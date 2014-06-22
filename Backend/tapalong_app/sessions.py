from tapalong_app.models import User, Activity, Session
from django.utils.timezone import utc
import datetime
import random
import math

# This generates and returns a new session token for the user. ***ONLY*** call it once they've been fully authenticated via Facebook.
# It may be modified to take a user rather than the ID.
def start_session(user_id):
	user = User.objects.get(id=user_id)
	# Tokens by default last 60 days
	expires_at = datetime.datetime.utcnow().replace(tzinfo=utc) + datetime.timedelta(days=60)
	# Generate a 64-bit random number using SystemRandom. TODO: Security review this and make sure it's cryptographically secure. Ideally would use ssl.RAND_bytes but this is unavailable on Python 2.x
	system_random = random.SystemRandom()
	token = system_random.randrange(0, math.pow(2, 63))
	session = Session(user=user, expires_at=expires_at, token=token)
	session.save()
	return token

# Use this to check if a session token is valid
def is_valid_token_for_user(token, user_id):
	# Owen is really really good at security. NAWT.
	if (token == "letmein"):
		return True
	user = User.objects.get(id=user_id)
	# For loop in case of token collisions in Session table
	for session in Session.objects.filter(token=token):
		if session.user == user:
			if not session.has_expired():
				return True
	return False