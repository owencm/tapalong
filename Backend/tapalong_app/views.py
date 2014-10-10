from tapalong_app.models import User, Activity, Session
from django.utils import simplejson as json
from django.utils.timezone import utc
from django.http import HttpResponse
from django.http import QueryDict
from django.views.decorators.csrf import csrf_exempt
from django.template import RequestContext, loader
from pyfb import Pyfb
from django.conf import settings
import datetime
from datetime import date, timedelta
import dateutil.parser
import sessions

# return user id and session token
@csrf_exempt
def login_user(request):
	if request.method == 'POST':
		request_contents = json.loads(request.body)
		fb_token = request_contents.get('fb_token')
		facebook = Pyfb(settings.FACEBOOK_APP_ID)
		#Sets the authentication token
		facebook.set_access_token(fb_token)
		#Gets info about myself 
		me = facebook.get_myself()
		try:
			user = User.objects.get(fb_id=me.id)
			session_token = sessions.start_session(user.id)
			json_output = json.dumps({"user_id": User.id, "user_name": User.name, "session_token": session_token})
			return HttpResponse(json_output, mimetype='application/json')
		except User.DoesNotExist:
			return HttpResponse('<p> User doesn\'t exist </p>')
	else:
		raise Exception('Requests to /login/ must be post, not get.')

# Serializes a single activity into JSON, passing along the following:
# Title, start time, description, location, max attendees
#attendees names
def serialize_activity(activity, user_id):
	print activity.creator_id, user_id
	# No idea why user_id is acting as a str here.
	if activity.creator_id == int(user_id):
		is_creator = True
	else:
		is_creator = False

	attendees_names = map(lambda user: user.name, activity.attendees.all())
	#serialized_attendees_names = json.dumps(attendees_names)
	
	return {"activity": {"activity_id": activity.id, "is_creator": is_creator, "creator_name": activity.creator.name, "creator_id": activity.creator.id, "title": activity.title, "start_time": str(activity.start_time), "description": activity.description, "location": activity.location, "max_attendees": activity.max_attendees, "attendees": attendees_names}}

# On GET: Returns all events for the given user. Events are
# returned in order of creation; youngest to oldest.
# On POST: Accepts and stores a new activity
# TODO @allygale: Will need to convert start time from str 
# to datetime, check to make sure user exists?
@csrf_exempt
def get_activities_list(request, user_id):
	# Check auth token sent with request
	token = request.META.get('HTTP_SESSION_TOKEN')
	if not (sessions.is_valid_token_for_user(token, user_id)):
		return HttpResponse('<p>Suspicious Operation</p>')

	# TODO, only return activities where creator_id is a friend and attendees.length < max_attendees or current user is in attendees
	#friends = facebook.get_friends()
	#for friend in friends:
		#print friend.name

	if request.method == 'GET':
		# Get all activities
		# Currently showing things from the past while debugging
		# user_activities_list = Activity.objects.exclude(start_time__lt=date.today()).order_by('-pub_date')
		user_activities_list = Activity.objects.order_by('-pub_date')
		# Serialized and output to json.
		serialized_activities = [serialize_activity(a, user_id) for a in user_activities_list]
		json_output = json.dumps(serialized_activities)
		return HttpResponse(json_output, mimetype='application/json')
	elif request.method == 'POST':
		# Get current time for activity creation timestamp
		#now = datetime.datetime.utcnow().replace(tzinfo=utc)
		# Get request data and parse it from JSON
		activity_info = json.loads(request.body)
		activity = Activity(creator=User.objects.get(id=user_id), title=activity_info.get("title"), start_time=dateutil.parser.parse(activity_info.get("start_time")), description=activity_info.get("description"), location=activity_info.get("location"), max_attendees=activity_info.get("max_attendees"))
		print(activity.start_time)
		activity.save()
		serialized_activity = serialize_activity(activity, user_id)
		json_output = json.dumps(serialized_activity)
		return HttpResponse(json_output, mimetype='application/json')