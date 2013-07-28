from django.conf.urls import patterns, url

from tapalong_app import views

urlpatterns = patterns('',
    url(r'^(?P<user_id>\d+)/$', views.get_activities_list, name='get_user_activities_list'),
    url(r'^(?P<user_id>\d+)/create_activity/$', views.create_activity, name='create_activity'),
)