from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from .models import Goal
from .serializers import GoalSerializer


class GoalListCreateView(generics.ListCreateAPIView):
    serializer_class = GoalSerializer
    pagination_class = None

    def get_queryset(self):
        return Goal.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        client_id = serializer.validated_data["client_id"]
        if Goal.objects.filter(user=self.request.user, client_id=client_id).exists():
            raise ValidationError({"id": ["A goal with this id already exists."]})
        serializer.save(user=self.request.user)


class GoalDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET / PUT (upsert) / PATCH / DELETE a goal by its client id.

    PUT is an upsert: it creates the goal if it does not
    exist yet, otherwise replaces it. Every query is scoped to the caller, so
    one user can never read or overwrite another user's goals.
    """

    serializer_class = GoalSerializer
    lookup_field = "client_id"
    lookup_url_kwarg = "goal_id"

    def get_queryset(self):
        return Goal.objects.filter(user=self.request.user)

    def put(self, request, *args, **kwargs):
        goal_id = kwargs[self.lookup_url_kwarg]
        instance = self.get_queryset().filter(client_id=goal_id).first()
        body = dict(request.data) if hasattr(request.data, "items") else {}
        body["id"] = goal_id  # the URL is the source of truth for the identifier
        serializer = self.get_serializer(instance, data=body)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return Response(
            serializer.data,
            status=status.HTTP_200_OK if instance else status.HTTP_201_CREATED,
        )
