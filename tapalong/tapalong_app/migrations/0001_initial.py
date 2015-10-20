# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Activity',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('pub_date', models.DateTimeField(auto_now_add=True)),
                ('start_time', models.DateTimeField()),
                ('title', models.CharField(max_length=60)),
                ('description', models.CharField(default=b'', max_length=1024)),
                ('location', models.CharField(max_length=60)),
                ('max_attendees', models.IntegerField(default=0)),
            ],
        ),
        migrations.CreateModel(
            name='Notification',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('template', models.CharField(max_length=60)),
                ('options', models.TextField(default=b'')),
                ('dismissed', models.BooleanField(default=False)),
                ('expired', models.BooleanField(default=False)),
            ],
        ),
        migrations.CreateModel(
            name='PushSubscription',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('subscription_id', models.CharField(max_length=300)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('expired_at', models.DateTimeField(null=True, blank=True)),
            ],
        ),
        migrations.CreateModel(
            name='Session',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('token', models.BigIntegerField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('expires_at', models.DateTimeField()),
            ],
        ),
        migrations.CreateModel(
            name='User',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('name', models.CharField(max_length=40)),
                ('password', models.CharField(max_length=30)),
                ('fb_id', models.BigIntegerField()),
                ('friends', models.TextField(default=b'')),
            ],
        ),
        migrations.AddField(
            model_name='session',
            name='user',
            field=models.ForeignKey(to='tapalong_app.User'),
        ),
        migrations.AddField(
            model_name='pushsubscription',
            name='recipient',
            field=models.ForeignKey(related_name='push_subscription_set', to='tapalong_app.User'),
        ),
        migrations.AddField(
            model_name='notification',
            name='user',
            field=models.ForeignKey(related_name='notification_set', to='tapalong_app.User'),
        ),
        migrations.AddField(
            model_name='activity',
            name='attendees',
            field=models.ManyToManyField(related_name='attending_set', to='tapalong_app.User'),
        ),
        migrations.AddField(
            model_name='activity',
            name='creator',
            field=models.ForeignKey(related_name='event_set', to='tapalong_app.User'),
        ),
    ]
