from django.utils import simplejson as json
from django.http import HttpResponse
import datetime

from tapalong_app.models import User, Activity

# Serializes a single activity, passing along the following:
# Title, start time, description, location, max attendees
def serialize_activity(activity):
	return {"title": activity.title, "start_time": str(activity.start_time), "description": activity.description, "location": activity.location, "max_attendees": activity.max_attendees}

# Returns all events for the given user. Events are
# returns in order of creation; youngest to oldest.
def get_activities_list(request, user_id):
	user_activities_list = Activity.objects.filter(attendees=user_id).order_by('-pub_date')
	serialized_activities = map(serialize_activity, user_activities_list)
	json_output = json.dumps(serialized_activities)
	return HttpResponse(json_output, mimetype='application/json')


