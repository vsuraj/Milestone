from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError("An email address is required.")
        email = self.normalize_email(email).lower()
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")
        return self._create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Email-based user account (Django authentication)."""

    email = models.EmailField(max_length=255, unique=True)
    name = models.CharField(max_length=100)
    photo_url = models.URLField(max_length=500, blank=True, default="")
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name"]

    class Meta:
        ordering = ["id"]

    def save(self, *args, **kwargs):
        # Emails are stored lower-cased so uniqueness is effectively case-insensitive.
        if self.email:
            self.email = self.email.strip().lower()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.email

    def get_full_name(self):
        return self.name

    def get_short_name(self):
        return self.name.split(" ")[0] if self.name else self.email


class UserProfile(models.Model):
    """Per-user study preferences."""

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="profile"
    )
    school = models.CharField(max_length=120, blank=True, default="")
    major = models.CharField(max_length=120, blank=True, default="")
    semester = models.CharField(max_length=50, blank=True, default="")
    daily_goal_hours = models.FloatField(
        default=4, validators=[MinValueValidator(0), MaxValueValidator(24)]
    )
    pomodoro_minutes = models.PositiveSmallIntegerField(
        default=25, validators=[MinValueValidator(1), MaxValueValidator(180)]
    )
    short_break_minutes = models.PositiveSmallIntegerField(
        default=5, validators=[MinValueValidator(1), MaxValueValidator(60)]
    )
    long_break_minutes = models.PositiveSmallIntegerField(
        default=15, validators=[MinValueValidator(1), MaxValueValidator(120)]
    )
    sound_volume = models.PositiveSmallIntegerField(
        default=60, validators=[MaxValueValidator(100)]
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile<{self.user.email}>"
