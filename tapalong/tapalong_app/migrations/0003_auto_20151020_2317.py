# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import datetime


class Migration(migrations.Migration):

    dependencies = [
        ('tapalong_app', '0002_auto_20151019_2153'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='notification',
            name='dismissed',
        ),
        migrations.AddField(
            model_name='notification',
            name='created_at',
            field=models.DateTimeField(default=datetime.datetime(2015, 10, 21, 6, 17, 18, 635959)),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='notification',
            name='fetched_previously',
            field=models.BooleanField(default=False),
        ),
    ]
