# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'Session'
        db.create_table(u'tapalong_app_session', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('token', self.gf('django.db.models.fields.CharField')(max_length=50)),
        ))
        db.send_create_signal(u'tapalong_app', ['Session'])


    def backwards(self, orm):
        # Deleting model 'Session'
        db.delete_table(u'tapalong_app_session')


    models = {
        u'tapalong_app.activity': {
            'Meta': {'object_name': 'Activity'},
            'attendees': ('django.db.models.fields.related.ManyToManyField', [], {'related_name': "'attending_set'", 'symmetrical': 'False', 'to': u"orm['tapalong_app.User']"}),
            'creator': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'event_set'", 'to': u"orm['tapalong_app.User']"}),
            'description': ('django.db.models.fields.CharField', [], {'max_length': '300'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'location': ('django.db.models.fields.CharField', [], {'max_length': '60'}),
            'max_attendees': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'pub_date': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'start_time': ('django.db.models.fields.DateTimeField', [], {}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '30'})
        },
        u'tapalong_app.session': {
            'Meta': {'object_name': 'Session'},
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'token': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        u'tapalong_app.user': {
            'Meta': {'object_name': 'User'},
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '20'}),
            'password': ('django.db.models.fields.CharField', [], {'max_length': '30'})
        }
    }

    complete_apps = ['tapalong_app']