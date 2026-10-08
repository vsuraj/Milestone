from django.contrib import admin
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.conf import settings
from django.urls import include, path, re_path

from accounts.views import ProfileView
from core import views as core_views

urlpatterns = [
    path("admin/", admin.site.urls),
    # ---- REST API (everything under /api/ is served by Django) ----
    re_path(r"^api/health/?$", core_views.health, name="health"),
    path("api/auth/", include("accounts.urls")),
    path("api/profile/", ProfileView.as_view(), name="profile"),
    path("api/goals/", include("goals.urls")),
    path("api/focus-logs/", include("focus.urls")),
    path("api/gemini/", include("ai.urls")),
    re_path(r"^api/.*$", core_views.api_not_found),
    # ---- React single-page app: every other route returns index.html ----
    re_path(r"^(?!static/|admin/|api/).*$", core_views.ReactAppView.as_view(), name="spa"),
]

# ``runserver`` needs an explicit static-file route in this URL configuration
# so the compiled Vite assets in ``frontend/dist`` are available during local
# development. Production assets are served by WhiteNoise instead.
if settings.DEBUG:
    urlpatterns += staticfiles_urlpatterns()
