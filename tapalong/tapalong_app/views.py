from tapalong_app.models import User, Activity, Session, Notification, PushSubscription
from django.utils import simplejson as json
from django.utils.timezone import utc
from django.http import HttpResponse, HttpResponseForbidden
from django.http import QueryDict
from django.views.decorators.csrf import csrf_exempt
from django.template import RequestContext, loader
from pyfb import Pyfb
from django.conf import settings
import datetime
from datetime import date, timedelta
import dateutil.parser
import sessions
import notifications

# return user id and session token
@csrf_exempt
def login_user(request):
	if request.method == 'POST':
		request_contents = json.loads(request.body)
		fb_token = request_contents.get('fb_token')
		facebook = Pyfb(settings.FACEBOOK_APP_ID)
		#Sets the authentication token
		facebook.set_access_token(fb_token)
		# Gets info about myself
		# Todo: what if this fails?
		fb_user = facebook.get_myself()
		try:
			user = User.objects.get(fb_id=fb_user.id)
			print('logging in as user ',user.id)
			refreshFriends(facebook, user)
			# Start dat session
			session_token = sessions.start_session(user.id)
			# Stringify the session token since if JS reads it as an int it doesn't have enough precision
			json_output = json.dumps({'success': 'true', "user_id": user.id, "user_name": user.name, "session_token": str(session_token), "first_login": "false"})
			return HttpResponse(json_output, mimetype='application/json')
		except User.DoesNotExist:
			# TODO: catch errors here
			user = User(name=fb_user.name, fb_id=fb_user.id)
			user.save()
			refreshFriends(facebook, user)
			session_token = sessions.start_session(user.id)
			# Stringify the session token since if JS reads it as an int it doesn't have enough precision
			json_output = json.dumps({'success': 'true', "user_id": user.id, "user_name": user.name, "session_token": str(session_token), "first_login": "true"})
			return HttpResponse(json_output, mimetype='application/json')
	else:
		raise Exception('Requests to /login/ must be post, not get.')

def refreshFriends(facebook, user):
	# Set up the list of the users' facebook friends' ids
	friends = facebook.get_friends()
	friend_ids = map(lambda friend: friend.id, friends)
	friend_ids_str = ','.join(friend_ids)
	print friend_ids_str
	user.friends=friend_ids_str
	user.save()

# Serializes a single activity into JSON, passing along the following:
# Title, start time, description, location, max attendees
# attendees names
def serialize_activity(activity, user_id):
	# No idea why user_id is acting as a str here.
	is_creator = activity.creator_id == int(user_id)
	is_attending = activity.attendees.filter(id=user_id).exists()

	attendees_names = map(lambda user: user.name, activity.attendees.all())
	#serialized_attendees_names = json.dumps(attendees_names)
	debug_start_time = activity.start_time

	return {"activity": {"activity_id": activity.id, "is_creator": is_creator, "creator_name": activity.creator.name, "creator_id": activity.creator.id, "title": activity.title, "start_time": activity.start_time.isoformat(), "description": activity.description, "location": activity.location, "max_attendees": activity.max_attendees, "attendees": attendees_names, "is_attending": is_attending, "thumbnail": "https://graph.facebook.com/"+str(activity.creator.fb_id)+"/picture"}}

# On GET: Returns all events for the given user. Events are
# returned in order of creation; youngest to oldest.
# On POST: Accepts and stores a new activity
# TODO @allygale: Will need to convert start time from str
# to datetime, check to make sure user exists?
@csrf_exempt
def activities_list(request):
	# TODO: factor out auth check to somewhere higher that covers all APIs
	# Check auth token sent with request
	token = request.META.get('HTTP_SESSION_TOKEN')
	user_id = request.META.get('HTTP_USER_ID')
	if not (sessions.is_valid_token_for_user(token, user_id)):
		print('A suspicious operation ocurred', token, user_id)
		return HttpResponseForbidden()

	# TODO, only return activities where creator_id is a friend and attendees.length < max_attendees or current user is in attendees
	#friends = facebook.get_friends()
	#for friend in friends:
		#print friend.name

	if request.method == 'GET':
		# Get all activities
		# Currently showing things from the past while debugging
		user_activities_list = Activity.objects.exclude(start_time__lt=date.today()).order_by('-pub_date')
		# Get all activities
		# user_activities_list = Activity.objects.order_by('-pub_date')
		# TODO: Get all activities that are created by friends of the user

		# Serialized and output to json.
		serialized_activities = [serialize_activity(a, user_id) for a in user_activities_list]
		# serialized_activities = []
		json_output = json.dumps(serialized_activities)
		return HttpResponse(json_output, mimetype='application/json')
	elif request.method == 'POST':
		# Get current time for activity creation timestamp
		# now = datetime.datetime.utcnow().replace(tzinfo=utc)
		# Get request data and parse it from JSON
		activity_info = json.loads(request.body)
		activity = Activity(creator=User.objects.get(id=user_id), title=activity_info.get("title"), start_time=dateutil.parser.parse(activity_info.get("start_time")), description=activity_info.get("description"), location=activity_info.get("location"), max_attendees=activity_info.get("max_attendees"))
		activity.save()
		serialized_activity = serialize_activity(activity, user_id)
		json_output = json.dumps(serialized_activity)
		return HttpResponse(json_output, mimetype='application/json')

@csrf_exempt
def attending(request, activity_id):
	# Check auth token sent with request
	token = request.META.get('HTTP_SESSION_TOKEN')
	user_id = request.META.get('HTTP_USER_ID')
	if not (sessions.is_valid_token_for_user(token, user_id)):
		return HttpResponseForbidden()

	if request.method == 'POST':
		user = User.objects.get(id=user_id)
		activity = Activity.objects.get(id=activity_id)
		# TODO: Ensure the user is allowed to see this activity
		# TODO: Ensure the activity is in the future
		# TODO: Ensure the user doesn't own this event
		# Toggle attendance based on whether they are already attending
		if activity.attendees.filter(id=user_id).exists():
			activity.attendees.remove(user)
		else:
			# If the activity has more space
			if activity.max_attendees == -1 or activity.attendees.count() < activity.max_attendees:
				activity.attendees.add(user)
				print activity.creator.image_url()
				notifications.create_notification(activity.creator.id, 'now_attending', {'attending_user_name': user.name, 'activity_id': activity.id, 'activity_title': activity.title, 'icon': user.large_image_url()})
			else:
				print('No room for user at activity')
				return HttpResponse('No room available')
				# TODO: Return an error
		activity.save()
		serialized_activity = serialize_activity(activity, user_id)
		json_output = json.dumps(serialized_activity)
		return HttpResponse(json_output, mimetype='application/json')
	else:
		return HttpResonse('This URL does not support non-post requests');

@csrf_exempt
def cancel(request, activity_id):
	# Check auth token sent with request
	token = request.META.get('HTTP_SESSION_TOKEN')
	user_id = request.META.get('HTTP_USER_ID')
	if not (sessions.is_valid_token_for_user(token, user_id)):
		return HttpResponseForbidden()

	if request.method == 'POST':
		user = User.objects.get(id=user_id)
		activity = Activity.objects.get(id=activity_id)
		# TODO: Ensure the user owns this event
		# TODO: Just mark it as cancelled, don't actually delete it
		# TODO: Try/catch this in case it fails
		activity.delete()
		return HttpResponse('', mimetype='application/json')
	else:
		return HttpResonse('This URL does not support non-post requests');

@csrf_exempt
def activity(request, activity_id):
	token = request.META.get('HTTP_SESSION_TOKEN')
	user_id = request.META.get('HTTP_USER_ID')
	if not (sessions.is_valid_token_for_user(token, user_id)):
		return HttpResponseForbidden()

	if request.method == 'POST':
		user = User.objects.get(id=user_id)
		activity = Activity.objects.get(id=activity_id)
		if activity.creator != user:
			print('Someone tried to modify an activity they did not own:')
			print(request)
			return HttpResponse('You aren\'t permitted to modify this event')
		# Get fields of the activity the client wants to change
		activity_info = json.loads(request.body)
		# Get all fields into the format they will be needed
		if 'start_time' in activity_info:
			activity_info['start_time'] = dateutil.parser.parse(activity_info.get('start_time'))
			print activity_info['start_time']
		updateActivity(activity, activity_info)
		serialized_activity = serialize_activity(activity, user_id)
		json_output = json.dumps(serialized_activity)
		return HttpResponse(json_output, mimetype='application/json')
	else:
		return HttpResonse('This URL does not support non-post requests');


def updateActivity(activity, activity_info):
	known_attributes = ['title', 'start_time', 'description', 'location', 'max_attendees']
	for attr in activity_info:
		if attr in known_attributes:
			setattr(activity, attr, activity_info[attr])
	# Todo: validate before we save
	activity.save()
	return

@csrf_exempt
def notifications_list(request, subscription_id):

	token = request.META.get('HTTP_SESSION_TOKEN')
	user_id = request.META.get('HTTP_USER_ID')
	if not (sessions.is_valid_token_for_user(token, user_id)):
		return HttpResponseForbidden()

	notifications_to_send = notifications.get_active(user_id)
	json_output = json.dumps(notifications_to_send)
	return HttpResponse(json_output, mimetype='application/json')

@csrf_exempt
def dismiss_notification(request, note_id):
	# Get the notification, set dismissed = true
	token = request.META.get('HTTP_SESSION_TOKEN')
	user_id = request.META.get('HTTP_USER_ID')
	if not (sessions.is_valid_token_for_user(token, user_id)):
		return HttpResponseForbidden()

	note = Notification.objects.get(id = note_id)
	if (note.user != User.objects.get(id=user_id)):
		return HttpResponse('Error: This notification was not for you.')

	note.dismissed = True
	note.save()
	return HttpResponse()

@csrf_exempt
def push_subscriptions_list(request):
	token = request.META.get('HTTP_SESSION_TOKEN')
	user_id = request.META.get('HTTP_USER_ID')
	if not (sessions.is_valid_token_for_user(token, user_id)):
		return HttpResponseForbidden()

	if request.method == 'POST':
		user = User.objects.get(id=user_id)
		subscription = json.loads(request.body)
		subscription_id = subscription.get('subscriptionId')
		# Ignore the endpoint until we support more than GCM on Chrome
		endpoint = subscription.get('endpoint')
		notifications.create_subscription(user, subscription_id)
		return HttpResponse()
	else:
		return HttpResponseBadRequest()
