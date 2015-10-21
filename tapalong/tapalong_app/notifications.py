from tapalong_app.models import User, Activity, Session, Notification, PushSubscription
from django.conf import settings
from django.utils.timezone import utc
import datetime
import json
import requests

# When a subscription is created, send a tickle if it has notifications
def create_subscription(user, subscription_id):
	print 'Created a subscription'
	push_subscription = PushSubscription(subscription_id=subscription_id, recipient=user)
	push_subscription.save()
	if (len(get_active_notifications(user.id)) > 0):
		send_tickle(push_subscription)
	return

def create_notification(user_id, template, options):
	user = User.objects.get(id=user_id)
	serialized_options = json.dumps(options)
	now = datetime.datetime.utcnow().replace(tzinfo=utc)
	note = Notification(user = user, template = template, options = serialized_options, created_at = now)
	note.save()
	send_tickles_for(note)

def send_tickles_for(note):
	subscriptions = PushSubscription.objects.filter(recipient=note.user)
	for subscription in subscriptions:
		send_tickle(subscription)
	note.save()

def send_tickle(subscription):
	# Note: invalidate reigstrations that fail
	values = {
		'registration_ids': [subscription.subscription_id],
		'data': {}
	}
	values = json.dumps(values)
	headers = {
		'UserAgent': "GCM-Server",
		'Content-Type': 'application/json',
		'Authorization': 'key=' + settings.GCM_API_KEY,
	}
	print('Sending a tickle to '+subscription.recipient.name + ' via '+str(subscription.subscription_id))
	try:
		response = requests.post(url="https://android.googleapis.com/gcm/send",
								 data=values,
								 headers=headers)
		print(response.content)
	except:
		print 'Error sending tickle'

def render_notification(note):
	# Todo, handle different templates
	options = json.loads(note.options)
	return {'title': 'Up Dog',
			'body': options['attending_user_name'] + ' is in for ' + options['activity_title'],
			'icon': options['icon'],
			'url': 'https://www.updogapp.co/static/',
			'id': note.id,
			'fetched_previously': note.fetched_previously,
			'created_at': note.created_at.isoformat()}

def render_notifications(note_list):
	return map(lambda note: render_notification(note), note_list)

def get_active_notifications(user_id):
	potential_notifications = Notification.objects.filter(expired = False, user = User.objects.get(id=user_id))
	active_notifications = []
	for note in potential_notifications:
		options = json.loads(note.options)
		# Try catch to handle the activity was deleted
		try:
			activity = Activity.objects.get(id=options['activity_id'])
			now = datetime.datetime.utcnow().replace(tzinfo=utc)
			# Only send notifications if the activity isn't in the past
			if activity.start_time < now:
				note.expired = True
				note.save()
			else:
				active_notifications.append(note)
		except Activity.DoesNotExist:
			note.expired = True
			note.save()
	return active_notifications

def delete_all_notifications():
	for note in Notification.objects.all:
		note.delete()
