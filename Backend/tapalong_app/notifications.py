from tapalong_app.models import User, Activity, Session

def create_notification(user_id, template, options):
	user = User.objects.get(id=user_id)
	# note = Notification(user = user, template = template, options = options)
	# note.save()
	# deliver_notification(note)

def deliver_notification(note):
 	registrations = PushRegistration.objects.filter(recipient=note.user)
 	for registration in registrations:
 		send_tickle(registration)
 	# TODO: is this a thing? 
	note.sent_to += registration
	note.save()

def send_tickle(reg):
	# TODO
	# Note: invalidate reigstrations that fail
	print 'Todo'

def render_notification(note):
	# Todo, handle different templates
	return {'title': note.options.activity.title,
			'body': note.options.attending_user_name + ' is also coming along',
			'url': 'https://www.google.com/',
			'id': note.id}

# When a registration is created, send a tickle if it has notifications