from rest_framework import serializers


class BreakdownGoalRequestSerializer(serializers.Serializer):
    goalTitle = serializers.CharField(max_length=200)
    category = serializers.CharField(max_length=50, required=False, allow_blank=True)
    detail = serializers.CharField(max_length=1000, required=False, allow_blank=True)
    targetDate = serializers.CharField(max_length=50, required=False, allow_blank=True)


class GenerateScheduleRequestSerializer(serializers.Serializer):
    availableHours = serializers.FloatField(min_value=0, max_value=24, required=False)
    courses = serializers.ListField(
        child=serializers.CharField(max_length=100), max_length=20, required=False
    )
    focusPreference = serializers.CharField(max_length=100, required=False, allow_blank=True)
    studyGoals = serializers.CharField(max_length=1000, required=False, allow_blank=True)


class ChatHistoryItemSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=["user", "assistant"])
    text = serializers.CharField(max_length=8000, allow_blank=True)


class AssistantChatRequestSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=4000)
    history = ChatHistoryItemSerializer(many=True, required=False, max_length=20)
