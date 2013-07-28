from django.utils import simplejson as json
from django.http import HttpResponse
import datetime

from tapalong_app.models import User, Activity

# Returns all events for the given user. Events are
# returns in order of creation; youngest to oldest.
def get_events_list(request, user_id):
	user_events_list = Activity.objects.filter(attendees=user_id).order_by('-pub_date')
	output = ', '.join([a.title for a in user_events_list])

	return HttpResponse(output)


