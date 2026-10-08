from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError as DjangoValidationError
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import UserProfile

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Public representation of the signed-in user (camelCase for the React app)."""

    displayName = serializers.CharField(source="name", max_length=100)
    photoURL = serializers.URLField(
        source="photo_url", max_length=500, required=False, allow_blank=True
    )

    class Meta:
        model = User
        fields = ("id", "email", "displayName", "photoURL")
        read_only_fields = ("id", "email")


class RegisterSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    email = serializers.EmailField(max_length=255)
    password = serializers.CharField(write_only=True, max_length=128, trim_whitespace=False)

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Name may not be blank.")
        return value

    def validate_email(self, value):
        value = value.strip().lower()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate(self, attrs):
        candidate = User(email=attrs["email"], name=attrs["name"])
        try:
            validate_password(attrs["password"], user=candidate)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"password": list(exc.messages)})
        return attrs

    def create(self, validated_data):
        return User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            name=validated_data["name"],
        )


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Log in with email + password and return the user alongside the tokens."""

    def validate(self, attrs):
        attrs[self.username_field] = attrs[self.username_field].strip().lower()
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()


class ProfileSerializer(serializers.ModelSerializer):
    """Study profile. ``name`` is stored on the User row but exposed here so the
    settings screen can keep saving everything in a single request."""

    name = serializers.CharField(source="user.name", max_length=100)
    dailyGoalHours = serializers.FloatField(
        source="daily_goal_hours", min_value=0, max_value=24, required=False
    )
    pomodoroMinutes = serializers.IntegerField(
        source="pomodoro_minutes", min_value=1, max_value=180, required=False
    )
    shortBreakMinutes = serializers.IntegerField(
        source="short_break_minutes", min_value=1, max_value=60, required=False
    )
    longBreakMinutes = serializers.IntegerField(
        source="long_break_minutes", min_value=1, max_value=120, required=False
    )
    soundVolume = serializers.IntegerField(
        source="sound_volume", min_value=0, max_value=100, required=False
    )
    school = serializers.CharField(max_length=120, required=False, allow_blank=True)
    major = serializers.CharField(max_length=120, required=False, allow_blank=True)
    semester = serializers.CharField(max_length=50, required=False, allow_blank=True)

    class Meta:
        model = UserProfile
        fields = (
            "name",
            "school",
            "major",
            "semester",
            "dailyGoalHours",
            "pomodoroMinutes",
            "shortBreakMinutes",
            "longBreakMinutes",
            "soundVolume",
        )

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Name may not be blank.")
        return value

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", {})
        if "name" in user_data:
            instance.user.name = user_data["name"]
            instance.user.save(update_fields=["name"])
        return super().update(instance, validated_data)
