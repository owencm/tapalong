from django.conf.urls import patterns, url

from tapalong_app import views

urlpatters = patterns('',
	url(r'^(?<user_id>\d+)/$', views.get_events_list, name='user_events_list')
)