from django.conf.urls import patterns, url

from tapalong_app import views

urlpatterns = patterns('',
    url(r'^v1/activities/visible_to_user/(?P<user_id>\d+)/$', views.activities_list, name='user_activities_list'),
    url(r'^v1/activities/(?P<activity_id>\d+)/attend/(?P<user_id>\d+)/$', views.attending, name='attending'),
    url(r'^v1/login/$', views.login_user, name='login_user'),
)