from tapalong_app.models import User, Activity, Session, Notification, PushSubscription
from django.utils import simplejson as json
from django.conf import settings
import requests

def create_notification(user_id, template, options):
	user = User.objects.get(id=user_id)
	serialized_options = json.dumps(options)
	note = Notification(user = user, template = template, options = serialized_options)
	note.save()
	deliver_notification(note)

def deliver_notification(note):
 	subscriptions = PushSubscription.objects.filter(recipient=note.user)
 	for subscription in subscriptions:
 		send_tickle(subscription)
 	# TODO: is this a thing? 
	# note.sent_to += subscription
	note.save()

def send_tickle(reg):
	# Note: invalidate reigstrations that fail
    values = {
        'registration_ids': [reg.subscription_id],
        'data': {}
        # TODO: TTL
    }

    values = json.dumps(values)

    print values

    headers = {
        'UserAgent': "GCM-Server",
        'Content-Type': 'application/json',
        'Authorization': 'key=' + settings.GCM_API_KEY,
    }

    response = requests.post(url="https://android.googleapis.com/gcm/send",
                             data=values,
                             headers=headers)
    print(response.content)

def render_notification(note):
	# Todo, handle different templates
	options = json.loads(note.options)
	return {'title': options['activity_title'],
			'body': options['attending_user_name'] + ' is coming along too',
			'url': 'https://www.google.com/',
			'id': note.id}

# When a subscription is created, send a tickle if it has notifications
def create_subscription(user, subscription_id):
	print 'Created a subscription'
	push_subscription = PushSubscription(subscription_id=subscription_id, recipient=user)
	push_subscription.save()
	return

# Todo
def mark_delivered(note, subscription_id):
	print note