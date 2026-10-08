from rest_framework import generics
from rest_framework.exceptions import ValidationError

from .models import FocusSessionLog
from .serializers import FocusSessionLogSerializer


class FocusLogListCreateView(generics.ListCreateAPIView):
    serializer_class = FocusSessionLogSerializer
    pagination_class = None

    def get_queryset(self):
        return FocusSessionLog.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        client_id = serializer.validated_data["client_id"]
        if FocusSessionLog.objects.filter(
            user=self.request.user, client_id=client_id
        ).exists():
            raise ValidationError({"id": ["A focus log with this id already exists."]})
        serializer.save(user=self.request.user)


class FocusLogDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = FocusSessionLogSerializer
    lookup_field = "client_id"
    lookup_url_kwarg = "log_id"

    def get_queryset(self):
        return FocusSessionLog.objects.filter(user=self.request.user)
