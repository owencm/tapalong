from tapalong_app.models import User, Activity, Session, Notification, PushSubscription
from django.utils.timezone import utc
from django.http import HttpResponse, HttpResponseForbidden, QueryDict
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import redirect
from django.template import RequestContext, loader
from django.conf import settings
from datetime import date, timedelta
import json
import datetime
import dateutil.parser
import sessions
import notifications
import facebook

# TODO: This code all makes me sad. Rewrite or something, please.
# TODO: Move all ACLing to middleware

def index(request):
	return redirect('/static/index.html')

# Elastic beanstalk needs a URL to check for a 200 OK response to see if the server is running
def health(request):
	return HttpResponse()

# return user id and session token
@csrf_exempt
def login_user(request):
	if request.method == 'POST':
		request_contents = json.loads(request.body)
		fb_token = request_contents.get('fb_token')
		graph = facebook.GraphAPI(access_token=fb_token)
		# Todo: Handle this failing, for example if the user waits a long time
		# before pressing login you get 'Error validating access token: ...'
		fb_user = graph.get_object(id='me')
		try:
			user = User.objects.get(fb_id=fb_user['id'])
			refreshFriends(graph, user)
			session_token = sessions.start_session(user.id)
			# Stringify the session token since if JS reads it as an int it doesn't have enough precision
			json_output = json.dumps({'success': 'true', "user_id": user.id, "user_name": user.name, "session_token": str(session_token), "first_login": "false"})
			return HttpResponse(json_output, content_type='application/json')
		except User.DoesNotExist:
			# TODO: catch errors here
			user = User(name=fb_user.name, fb_id=fb_user.id)
			user.save()
			refreshFriends(facebook, user)
			session_token = sessions.start_session(user.id)
			# Stringify the session token since if JS reads it as an int it doesn't have enough precision
			json_output = json.dumps({'success': 'true', "user_id": user.id, "user_name": user.name, "session_token": str(session_token), "first_login": "true"})
			return HttpResponse(json_output, content_type='application/json')
	else:
		raise Exception('Requests to /login/ must be post, not get.')

def refreshFriends(graph, user):
	# This returns a list of all friends who have also granted updog permission
	# friends = graph.get_connections(id='me', connection_name='friends')['data']
	# friend_ids = map(lambda friend: friend['id'], friends)
	friend_ids=[1,2]
	# Join only works on strings so cast to strings here
	user.friends = ','.join(str(id) for id in friend_ids)
	user.save()

# Serializes a single activity into JSON, passing along the following:
# Title, start time, description, location, max attendees
# attendees names
def serialize_activity(activity, user_id):
	# No idea why user_id is acting as a str here.
	is_creator = activity.creator_id == int(user_id)
	is_attending = activity.attendees.filter(id=user_id).exists()

	attendees_names = map(lambda user: user.name, activity.attendees.all())

	return {
		"activity":
			{
				"activity_id": activity.id,
				"is_creator": is_creator,
				"creator_name": activity.creator.name,
				"creator_id": activity.creator.id,
				"title": activity.title,
				"start_time": activity.start_time.isoformat(),
				"description": activity.description,
				"location": activity.location,
				"max_attendees": activity.max_attendees,
				"attendees": attendees_names,
				"is_attending": is_attending,
				"thumbnail": "https://graph.facebook.com/"+str(activity.creator.fb_id)+"/picture"
			 }
		 }

# TODO: Move this function to somewhere more sensible
def users_fb_friends_with_user(user):
	fb_ids_of_users_friends_with_user = user.friends.split(',')
	# If user.friends == '' this will be split to [''] so filter that out
	if fb_ids_of_users_friends_with_user == ['']:
		fb_ids_of_users_friends_with_user = []
	return User.objects.filter(fb_id__in=fb_ids_of_users_friends_with_user)

def user_can_see_activity(user, activity):
	return activity in get_activities_visible_to_user(user)

def get_activities_visible_to_user(user):
	# Get all of the user objects that are FB friends with user
	users_friends_with_user = users_fb_friends_with_user(user)

	# Get all activities scheduled for the future and created by friends
	my_activities = Activity.objects.filter(creator=user)
	friends_activities = Activity.objects.filter(creator__in=users_friends_with_user).exclude(start_time__lt=date.today()).order_by('-pub_date')
	# Anyone can see the first two users plans! TODO: Remove eventually so users in prod can't see private stuff
	test_acc_activities = Activity.objects.filter(creator_id__in=[1,2])
	return my_activities | friends_activities | test_acc_activities

# On GET: Returns all events for the given user. Events are
# returned in order of creation; youngest to oldest.
# On POST: Accepts and stores a new activity
@csrf_exempt
def activities_list(request):
	# TODO: factor out auth check to somewhere higher that covers all APIs
	# Check auth token sent with request
	token = request.META.get('HTTP_SESSION_TOKEN')
	user_id = request.META.get('HTTP_USER_ID')
	if not (sessions.is_valid_token_for_user(token, user_id)):
		print('A suspicious operation ocurred', token, user_id)
		return HttpResponseForbidden()

	user = User.objects.get(id=user_id)

	if request.method == 'GET':
		user_activities_list = get_activities_visible_to_user(user)

		# Serialized and output to json.
		serialized_activities = [serialize_activity(a, user_id) for a in user_activities_list]
		json_output = json.dumps(serialized_activities)
		return HttpResponse(json_output, content_type='application/json')
	elif request.method == 'POST':
		# Get request data and parse it from JSON
		activity_info = json.loads(request.body)
		activity = Activity(creator=user,
							title=activity_info.get("title"),
							start_time=dateutil.parser.parse(activity_info.get("start_time")),
							description=activity_info.get("description"),
							location=activity_info.get("location"),
							max_attendees=activity_info.get("max_attendees"))
		activity.save()
		serialized_activity = serialize_activity(activity, user_id)
		json_output = json.dumps(serialized_activity)
		return HttpResponse(json_output, content_type='application/json')

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

		if not user_can_see_activity(user, activity):
			print 'User tried to attend an activity they cant see'
			return HttpResponseForbidden()

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
				# TODO: Return an error to be rendered on the client
		activity.save()
		serialized_activity = serialize_activity(activity, user_id)
		json_output = json.dumps(serialized_activity)
		return HttpResponse(json_output, content_type='application/json')
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
		if not (activity.creator == user):
			return HttpResponseForbidden('You do not own this plan')

		# TODO: Just mark it as cancelled, don't actually delete it
		# TODO: Try/catch this in case it fails
		activity.delete()
		return HttpResponse('', content_type='application/json')
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
		return HttpResponse(json_output, content_type='application/json')
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
def notifications_list(request):
	token = request.META.get('HTTP_SESSION_TOKEN')
	user_id = request.META.get('HTTP_USER_ID')
	if not (sessions.is_valid_token_for_user(token, user_id)):
		return HttpResponseForbidden()

	active_notifications = notifications.get_active_notifications(user_id)
	notifications_to_send = notifications.render_notifications(active_notifications)
	json_output = json.dumps(notifications_to_send)

	# Mark all these notifications as having been fetched
	for note in active_notifications:
		notifications.mark_notification_fetched(note)

	return HttpResponse(json_output, content_type='application/json')

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
