from django.conf import settings
from django.core.validators import RegexValidator
from django.db import models

client_id_validator = RegexValidator(
    r"^[a-zA-Z0-9_\-]+$",
    "Only letters, numbers, underscores and hyphens are allowed.",
)


class FocusSessionLog(models.Model):
    """A completed focus / pomodoro sprint."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="focus_logs"
    )
    client_id = models.CharField(max_length=128, validators=[client_id_validator])
    # The React app writes "YYYY-MM-DD HH:MM" strings and compares them with
    # startsWith(); the string is stored verbatim to keep that behaviour intact.
    timestamp = models.CharField(max_length=50)
    duration_minutes = models.FloatField()
    subject = models.CharField(max_length=100)
    notes = models.CharField(max_length=500, blank=True, default="")
    tag = models.CharField(max_length=50, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "-id"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "client_id"], name="focus_log_user_client_id_unique"
            ),
            models.CheckConstraint(
                condition=models.Q(duration_minutes__gt=0, duration_minutes__lte=1440),
                name="focus_log_duration_range",
            ),
        ]
        indexes = [models.Index(fields=["user", "-created_at"])]

    def __str__(self):
        return f"{self.subject} {self.duration_minutes}m ({self.user_id})"
