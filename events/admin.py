from django.contrib import admin

from events.models import Event, EventDescription

class EventDescriptionInline(admin.TabularInline):
    model = EventDescription
    extra = 1

class EventAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'start_date', 'end_date', 'priority','is_host_ntnui']
    inlines = [EventDescriptionInline,
               ]

admin.site.register(Event, EventAdmin)