from django.conf.urls import patterns, include, url

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('',
	(r'^facebook/', include('django_facebook.urls')),
	#Don't add this line if you use django registration or userena for registration and auth.
	(r'^accounts/', include('django_facebook.auth_urls')),
	url(r'^activities/', include('tapalong_app.urls')),

    # Examples:
    # url(r'^$', 'tapalong.views.home', name='home'),
    # url(r'^tapalong/', include('tapalong.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    # url(r'^admin/', include(admin.site.urls)),
)
