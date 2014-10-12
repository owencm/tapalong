from django.conf.urls import patterns, url

from tapalong_app import views

urlpatterns = patterns('',
    url(r'^v1/activities/visible_to_user/$', views.activities_list, name='user_activities_list'),
    url(r'^v1/activities/(?P<activity_id>\d+)/attend/$', views.attending, name='attending'),
    url(r'^v1/activities/(?P<activity_id>\d+)/$', views.activity, name='activity'), 
    url(r'^v1/login/$', views.login_user, name='login_user'),
)