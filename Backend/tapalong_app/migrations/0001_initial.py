# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'User'
        db.create_table(u'tapalong_app_user', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=20)),
            ('password', self.gf('django.db.models.fields.CharField')(max_length=30)),
            ('fb_id', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('friends', self.gf('django.db.models.fields.TextField')()),
        ))
        db.send_create_signal(u'tapalong_app', ['User'])

        # Adding model 'Activity'
        db.create_table(u'tapalong_app_activity', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('creator', self.gf('django.db.models.fields.related.ForeignKey')(related_name='event_set', to=orm['tapalong_app.User'])),
            ('pub_date', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, blank=True)),
            ('start_time', self.gf('django.db.models.fields.DateTimeField')()),
            ('title', self.gf('django.db.models.fields.CharField')(max_length=30)),
            ('description', self.gf('django.db.models.fields.CharField')(max_length=300)),
            ('location', self.gf('django.db.models.fields.CharField')(max_length=60)),
            ('max_attendees', self.gf('django.db.models.fields.IntegerField')(default=0)),
        ))
        db.send_create_signal(u'tapalong_app', ['Activity'])

        # Adding M2M table for field attendees on 'Activity'
        m2m_table_name = db.shorten_name(u'tapalong_app_activity_attendees')
        db.create_table(m2m_table_name, (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('activity', models.ForeignKey(orm[u'tapalong_app.activity'], null=False)),
            ('user', models.ForeignKey(orm[u'tapalong_app.user'], null=False))
        ))
        db.create_unique(m2m_table_name, ['activity_id', 'user_id'])

        # Adding model 'Session'
        db.create_table(u'tapalong_app_session', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('token', self.gf('django.db.models.fields.IntegerField')()),
            ('user', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['tapalong_app.User'])),
            ('created_at', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, blank=True)),
            ('expires_at', self.gf('django.db.models.fields.DateTimeField')()),
        ))
        db.send_create_signal(u'tapalong_app', ['Session'])


    def backwards(self, orm):
        # Deleting model 'User'
        db.delete_table(u'tapalong_app_user')

        # Deleting model 'Activity'
        db.delete_table(u'tapalong_app_activity')

        # Removing M2M table for field attendees on 'Activity'
        db.delete_table(db.shorten_name(u'tapalong_app_activity_attendees'))

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
            'created_at': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'expires_at': ('django.db.models.fields.DateTimeField', [], {}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'token': ('django.db.models.fields.IntegerField', [], {}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['tapalong_app.User']"})
        },
        u'tapalong_app.user': {
            'Meta': {'object_name': 'User'},
            'fb_id': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'friends': ('django.db.models.fields.TextField', [], {}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '20'}),
            'password': ('django.db.models.fields.CharField', [], {'max_length': '30'})
        }
    }

    complete_apps = ['tapalong_app']