# -*- coding: utf-8 -*-
# Generated by Django 1.11.10 on 2018-03-24 23:03
from __future__ import unicode_literals

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('events', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='SubEventRegistration',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('registration_time', models.DateTimeField(verbose_name='Registered for Event at Time')),
                ('attendee', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL, verbose_name='Attendee')),
                ('sub_event', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='events.SubEvent', verbose_name='Sub-event')),
            ],
            options={
                'verbose_name': 'Attendee for sub-event',
                'verbose_name_plural': 'Attendees for sub-event',
            },
        ),
        migrations.AlterUniqueTogether(
            name='subeventregistration',
            unique_together=set([('sub_event', 'attendee')]),
        ),
    ]