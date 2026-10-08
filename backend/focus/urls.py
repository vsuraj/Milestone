from django.urls import path

from . import views

urlpatterns = [
    path("", views.FocusLogListCreateView.as_view(), name="focus-log-list"),
    path("<str:log_id>/", views.FocusLogDetailView.as_view(), name="focus-log-detail"),
]
