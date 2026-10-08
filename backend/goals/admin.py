from django.contrib import admin

from .models import Goal


@admin.register(Goal)
class GoalAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "category", "priority", "progress", "target_date")
    list_filter = ("category", "priority")
    search_fields = ("title", "user__email", "client_id")
