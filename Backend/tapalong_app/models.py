from django.db import models
from django.utils.timezone import utc
import datetime

class User(models.Model):
	name = models.CharField(max_length = 20)
	password = models.CharField(max_length = 30)
	fb_id = models.IntegerField(default=0)
	friends = models.TextField(default='')
	def __unicode__(self):
		return self.name

class Activity(models.Model):
	# Many-to-one relationship with User
	creator = models.ForeignKey(User, related_name='event_set')
	pub_date = models.DateTimeField(auto_now_add=True)
	start_time = models.DateTimeField()
	title = models.CharField(max_length=30)
	description = models.CharField(max_length=300)
	attendees = models.ManyToManyField(User, related_name='attending_set')
	location = models.CharField(max_length = 60)
	# 0 will represent no max here.
	max_attendees = models.IntegerField(default=0)

	def __unicode__(self):
		return self.title

class Session(models.Model):
	token = models.IntegerField()
	user = models.ForeignKey(User)
	created_at = models.DateTimeField(auto_now_add=True)
	expires_at = models.DateTimeField()

	# Use this to check whether it has expired yet
	def has_expired(self):
		now = datetime.datetime.utcnow().replace(tzinfo=utc)
		assert (self.created_at < now);
		return (now > self.expires_at)