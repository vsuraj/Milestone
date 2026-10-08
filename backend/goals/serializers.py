from rest_framework import serializers

from .models import Goal, client_id_validator

MAX_MILESTONES = 50
MAX_TAGS = 20


class GoalSerializer(serializers.ModelSerializer):
    """camelCase JSON contract shared with the React ``Goal`` type."""

    id = serializers.CharField(
        source="client_id", max_length=128, validators=[client_id_validator]
    )
    targetDate = serializers.CharField(
        source="target_date", max_length=50, required=False, allow_blank=True
    )
    aiTip = serializers.CharField(source="ai_tip", required=False, allow_blank=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)
    description = serializers.CharField(
        max_length=1000, required=False, allow_blank=True
    )
    progress = serializers.FloatField(min_value=0, max_value=100)

    class Meta:
        model = Goal
        fields = (
            "id",
            "title",
            "category",
            "targetDate",
            "progress",
            "priority",
            "description",
            "milestones",
            "tags",
            "aiTip",
            "createdAt",
            "updatedAt",
        )

    def validate_milestones(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Must be a list.")
        if len(value) > MAX_MILESTONES:
            raise serializers.ValidationError(
                f"A goal can have at most {MAX_MILESTONES} milestones."
            )
        if not all(isinstance(item, dict) for item in value):
            raise serializers.ValidationError("Each milestone must be an object.")
        return value

    def validate_tags(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Must be a list.")
        if len(value) > MAX_TAGS:
            raise serializers.ValidationError(f"A goal can have at most {MAX_TAGS} tags.")
        if not all(isinstance(item, str) and len(item) <= 50 for item in value):
            raise serializers.ValidationError("Tags must be strings of at most 50 characters.")
        return value
