from django.urls import re_path

from . import views

# Trailing slash is optional so the original Express-style paths keep working.
urlpatterns = [
    re_path(r"^breakdown-goal/?$", views.BreakdownGoalView.as_view(), name="ai-breakdown-goal"),
    re_path(r"^generate-schedule/?$", views.GenerateScheduleView.as_view(), name="ai-generate-schedule"),
    re_path(r"^assistant-chat/?$", views.AssistantChatView.as_view(), name="ai-assistant-chat"),
]
