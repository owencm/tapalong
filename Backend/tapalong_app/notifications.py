from tapalong_app.models import User, Activity, Session, Notification, PushSubscription
from django.utils import simplejson as json

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
	# TODO
	# Note: invalidate reigstrations that fail
	print 'Sent a tickle'

def render_notification(note):
	# Todo, handle different templates
	# Todo parse options from JSON
	return {'title': note.options.activity.title,
			'body': note.options.attending_user_name + ' is also coming along',
			'url': 'https://www.google.com/',
			'id': note.id}

# When a subscription is created, send a tickle if it has notifications