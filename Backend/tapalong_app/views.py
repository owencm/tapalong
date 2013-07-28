from django.utils import simplejson as json
from django.utils.timezone import utc
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
import datetime

from tapalong_app.models import User, Activity

# Serializes a single activity, passing along the following:
# Title, start time, description, location, max attendees
def serialize_activity(activity):
	return {"title": activity.title, "start_time": str(activity.start_time), "description": activity.description, "location": activity.location, "max_attendees": activity.max_attendees}

# On GET: Returns all events for the given user. Events are
# returned in order of creation; youngest to oldest.
# On POST: Accepts and stores a new activity
# TODO @allygale: Will need to convert start time from str 
# to datetime, fix creator_id always being 1 (post fb-auth),
# check to make sure user exists?
@csrf_exempt
def get_activities_list(request, user_id):
	if request.method == 'GET':
		user_activities_list = Activity.objects.filter(attendees=user_id).order_by('-pub_date')
		serialized_activities = map(serialize_activity, user_activities_list)
		json_output = json.dumps(serialized_activities)
		return HttpResponse(json_output, mimetype='application/json')
	elif request.method == 'POST':
		now = datetime.datetime.utcnow().replace(tzinfo=utc)
		activity_info=json.loads(request.raw_post_data)
		activity = Activity(creator_id=1, title=activity_info.get("title"), pub_date=now, start_time=now, description=activity_info.get("description"), location=activity_info.get("location"), max_attendees=activity_info.get("max_attendees"))
		activity.save()
		activity_attendees = activity_info.get("attendees")
		for user_id in activity_attendees:
			user = User.objects.get(id=user_id)
			activity.attendees.add(user)
		activity.save()
		return HttpResponse("I saved stuff!")




