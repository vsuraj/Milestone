from rest_framework import serializers

from .models import FocusSessionLog, client_id_validator


class FocusSessionLogSerializer(serializers.ModelSerializer):
    id = serializers.CharField(
        source="client_id", max_length=128, validators=[client_id_validator]
    )
    durationMinutes = serializers.FloatField(
        source="duration_minutes", min_value=0.01, max_value=1440
    )
    notes = serializers.CharField(max_length=500, required=False, allow_blank=True)
    tag = serializers.CharField(max_length=50, required=False, allow_blank=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = FocusSessionLog
        fields = ("id", "timestamp", "durationMinutes", "subject", "notes", "tag", "createdAt")
