from django.utils import simplejson as json
from django.http import HttpResponse
import datetime

from tapalong_app.models import User, Activity

# Returns all events for the given user. Events are
# returns in order of creation; youngest to oldest.
def get_events_list(request, user_id):
	user_events_list = Activity.objects.filter(attendees=user_id).order_by('-pub_date')
	return HttpResponse("hi %s" % user_id)


