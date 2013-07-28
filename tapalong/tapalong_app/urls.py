from django.conf.urls import patterns, url

from tapalong_app import views

urlpatterns = patterns('',
    url(r'^(?P<user_id>\d+)/$', views.get_events_list, name='get_user_events_list'),
)