# -*- coding: utf-8 -*-
# Generated by Django 1.11.10 on 2018-04-01 20:39
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('events', '0007_auto_20180326_1418'),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='attendance_cap',
            field=models.IntegerField(blank=True, null=True, verbose_name='attendance cap'),
        ),
        migrations.AddField(
            model_name='subevent',
            name='attendance_cap',
            field=models.IntegerField(blank=True, null=True, verbose_name='attendance cap'),
        ),
    ]
