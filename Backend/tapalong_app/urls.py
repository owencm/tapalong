from django.conf.urls import patterns, url

from tapalong_app import views

urlpatterns = patterns('',
    url(r'^v1/(?P<user_id>\d+)/$', views.get_activities_list, name='get_user_activities_list'),
    url(r'^v1/login/$', views.login_user, name='login_user'),
)