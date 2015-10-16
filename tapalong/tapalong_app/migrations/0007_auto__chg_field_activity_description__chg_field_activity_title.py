# -*- coding: utf-8 -*-
from south.utils import datetime_utils as datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):

        # Changing field 'Activity.description'
        db.alter_column(u'tapalong_app_activity', 'description', self.gf('django.db.models.fields.CharField')(max_length=1024))

        # Changing field 'Activity.title'
        db.alter_column(u'tapalong_app_activity', 'title', self.gf('django.db.models.fields.CharField')(max_length=60))

    def backwards(self, orm):

        # Changing field 'Activity.description'
        db.alter_column(u'tapalong_app_activity', 'description', self.gf('django.db.models.fields.CharField')(max_length=300))

        # Changing field 'Activity.title'
        db.alter_column(u'tapalong_app_activity', 'title', self.gf('django.db.models.fields.CharField')(max_length=30))

    models = {
        u'tapalong_app.activity': {
            'Meta': {'object_name': 'Activity'},
            'attendees': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'attending_set'", 'symmetrical': 'False', 'to': u"orm['tapalong_app.User']"}),
            'creator': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'event_set'", 'to': u"orm['tapalong_app.User']"}),
            'description': ('django.db.models.fields.CharField', [], {'default': "''", 'max_length': '1024'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'location': ('django.db.models.fields.CharField', [], {'max_length': '60'}),
            'max_attendees': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'pub_date': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'start_time': ('django.db.models.fields.DateTimeField', [], {}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '60'})
        },
        u'tapalong_app.notification': {
            'Meta': {'object_name': 'Notification'},
            'dismissed': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'expired': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'options': ('django.db.models.fields.TextField', [], {'default': "''"}),
            'template': ('django.db.models.fields.CharField', [], {'max_length': '60'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'notification_set'", 'to': u"orm['tapalong_app.User']"})
        },
        u'tapalong_app.pushsubscription': {
            'Meta': {'object_name': 'PushSubscription'},
            'created_at': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'expired_at': ('django.db.models.fields.DateTimeField', [], {'null': 'True', 'blank': 'True'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'recipient': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'push_subscription_set'", 'to': u"orm['tapalong_app.User']"}),
            'subscription_id': ('django.db.models.fields.CharField', [], {'max_length': '300'})
        },
        u'tapalong_app.session': {
            'Meta': {'object_name': 'Session'},
            'created_at': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'expires_at': ('django.db.models.fields.DateTimeField', [], {}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'token': ('django.db.models.fields.BigIntegerField', [], {}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['tapalong_app.User']"})
        },
        u'tapalong_app.user': {
            'Meta': {'object_name': 'User'},
            'fb_id': ('django.db.models.fields.IntegerField', [], {}),
            'friends': ('django.db.models.fields.TextField', [], {'default': "''"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '20'}),
            'password': ('django.db.models.fields.CharField', [], {'max_length': '30'})
        }
    }

    complete_apps = ['tapalong_app']