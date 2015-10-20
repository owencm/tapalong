from settings import *

DEBUG = False
TEMPLATE_DEBUG = False

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'ebdb',
        'USER': 'dbadmin',
        'PASSWORD': 'sn4pdr4g0nadmin',
        'HOST': 'aa1bie9y4xbp4ux.cdb9iiixydbt.us-west-2.rds.amazonaws.com',  # Empty for localhost through domain sockets or '127.0.0.1' for localhost through TCP.
        'PORT': '3306',
    }
}

# Note this doesn't provide reasonable security as static HTML/JS resources are being served by the webserver

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = True
SECURE_REDIRECT_EXEMPT = ['health']
