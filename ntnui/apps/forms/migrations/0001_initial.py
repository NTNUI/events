# -*- coding: utf-8 -*-
# Generated by Django 1.11.7 on 2018-02-12 15:28
from __future__ import unicode_literals

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('groups', '__first__'),
    ]

    operations = [
        migrations.CreateModel(
            name='BoardChange',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(default='Board Change Form', max_length=100)),
                ('old_president_approved', models.BooleanField(default=False)),
                ('president_approved', models.BooleanField(default=False)),
                ('vice_president_approved', models.BooleanField(default=True)),
                ('cashier', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='cashier', to=settings.AUTH_USER_MODEL)),
                ('group', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='group', to='groups.SportsGroup')),
                ('old_president', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='old_president', to=settings.AUTH_USER_MODEL)),
                ('president', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='president', to=settings.AUTH_USER_MODEL)),
                ('vice_president', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='vice_president', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='FormDoc',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=50)),
                ('description', models.TextField(max_length=150)),
            ],
        ),
    ]
