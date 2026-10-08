from django.contrib import admin

from .models import FocusSessionLog


@admin.register(FocusSessionLog)
class FocusSessionLogAdmin(admin.ModelAdmin):
    list_display = ("subject", "user", "duration_minutes", "timestamp", "tag")
    search_fields = ("subject", "user__email", "client_id")
