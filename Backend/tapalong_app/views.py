from tapalong_app.models import User, Activity, Session
from django.utils import simplejson as json
from django.utils.timezone import utc
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.template import RequestContext, loader
from pyfb import Pyfb
from django.conf import settings
import random
import math
import datetime
import dateutil.parser
import sessions

# Serializes a single activity into JSON, passing along the following:
# Title, start time, description, location, max attendees

#attendees names
def serialize_activity(activity, user_id):
	print activity.creator_id, user_id
	# No idea why user_id is acting as a str here.
	if activity.creator_id == int(user_id):
		is_creator = "true"
	else:
		is_creator = "false"

	attendees_names = map(lambda user: user.name, activity.attendees.all())
	#serialized_attendees_names = json.dumps(attendees_names)
	
	return {"activity": {"activity_id": activity.id, "is_creator": is_creator, "creator_name": activity.creator.name, "creator_id": activity.creator.id, "title": activity.title, "start_time": str(activity.start_time), "description": activity.description, "location": activity.location, "max_attendees": activity.max_attendees, "attendees": attendees_names}}

# On GET: Returns all events for the given user. Events are
# returned in order of creation; youngest to oldest.
# On POST: Accepts and stores a new activity
# TODO @allygale: Will need to convert start time from str 
# to datetime, fix creator_id always being 1 (post fb-auth),
# check to make sure user exists?
@csrf_exempt
def get_activities_list(request, user_id):
	facebook = Pyfb(settings.FACEBOOK_APP_ID)
	#Sets the authentication token
	facebook.set_access_token('CAACff4vZA7iEBAGZA7eEsJ2FrofgeexbjQfGRUH7DCUdSUcBxd6utfVLMCWz1Q9odH7y6XwZCkImToRJZAru1ub1bmNNVrmjjRZAJZBcPAVFokAVnXlQbfVEFXQp0stSFu4QwL7ORmoIN2s7n937xZBo02QNYOWf7ED0l1ma97F1fcRyw51cjDZBF0HNQ7HgLptzcZB2CYhADDsdo7Ly1S4AUkTn8mhDqxwYZD')
	#Gets info about myself 
	me = facebook.get_myself()
	#print "-" * 40
	#print "Name: %s" % me.name
	#friends = facebook.get_friends()
	#for friend in friends:
		#print friend.name

	if request.method == 'GET':
		# Get all activities for which this user is an attendee of.
		# (Includes events they created.)
		user_activities_list = Activity.objects.filter(attendees=user_id).order_by('-pub_date')
		# Serialized and output to json.
		serialized_activities = [serialize_activity(a, user_id) for a in user_activities_list]
		json_output = json.dumps(serialized_activities)
		return HttpResponse(json_output, mimetype='application/json')
	elif request.method == 'POST':
		# Get current time for activity creation timestamp
		#now = datetime.datetime.utcnow().replace(tzinfo=utc)
		# Get request data
		activity_info = request.POST
		#FIX THIS CREATOR_ID=1; ID=1
		activity = Activity(creator=User.objects.get(id=1), title=activity_info.get("title"), start_time=dateutil.parser.parse(activity_info.get("start_time")), description=activity_info.get("description"), location=activity_info.get("location"), max_attendees=activity_info.get("max_attendees"))
		activity.save()
		activity.attendees.add(User.objects.get(id=1))
		activity.save()
		# Go through each activity and populate its attendees set
		# activity_attendees = activity_info.get("attendees")
		# for user_id in activity_attendees:
		# 	user = User.objects.get(id=user_id)
		# 	activity.attendees.add(user)
		# activity.save()
		serialized_activity = serialize_activity(activity, user_id)
		json_output = json.dumps(serialized_activity)
		return HttpResponse(json_output, mimetype='application/json')