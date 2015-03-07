from tapalong_app.models import User, Activity, Session, Notification, PushSubscription
from django.utils import simplejson as json
from django.conf import settings
import requests

# When a subscription is created, send a tickle if it has notifications
def create_subscription(user, subscription_id):
	print 'Created a subscription'
	push_subscription = PushSubscription(subscription_id=subscription_id, recipient=user)
	push_subscription.save()
	if (get_active(user.id).__len__() > 0):
		send_tickle(push_subscription)
	return

def create_notification(user_id, template, options):
	user = User.objects.get(id=user_id)
	serialized_options = json.dumps(options)
	note = Notification(user = user, template = template, options = serialized_options)
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
		# TODO: TTL
	}
	values = json.dumps(values)
	headers = {
		'UserAgent': "GCM-Server",
		'Content-Type': 'application/json',
		'Authorization': 'key=' + settings.GCM_API_KEY,
	}
	print('Sending a tickle!')
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
	return {'title': options['activity_title'],
			'body': options['attending_user_name'] + ' is coming along',
			'icon': options['icon'],
			'url': 'https://www.google.com/',
			'id': note.id}

def get_active(user_id):
	potential_notifications = Notification.objects.filter(dismissed = False, expired = False, user = User.objects.get(id=user_id))
	active_notifications = []
	for note in potential_notifications:
		# if note.start_time < date.today():
		# 	note.expired = true
		# 	note.save()
		# else:
			active_notifications.append(note)
	notifications_to_send = map(lambda note: render_notification(note), active_notifications)
	return notifications_to_send

def delete_all_notifications():
	for note in Notification.objects.all:
		note.delete()
