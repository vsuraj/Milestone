"""Authenticated Gemini endpoints that call Gemini directly."""
import json
import logging

from django.conf import settings
from google import genai
from google.genai import types
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import AssistantChatRequestSerializer, BreakdownGoalRequestSerializer, GenerateScheduleRequestSerializer

logger = logging.getLogger(__name__)
ASSISTANT_SYSTEM_INSTRUCTION = """You are Milestone AI, a friendly, encouraging academic mentor for college students.
Ground advice in Active Recall, Spaced Repetition, Pomodoro, the Feynman Technique, and the Eisenhower Matrix.
Use clear markdown with practical, actionable study steps."""


class AIUnavailable(Exception):
    pass


class AIError(Exception):
    pass


def get_gemini_client() -> genai.Client:
    """Build the server-side Gemini client with a bounded request timeout."""
    if not settings.GEMINI_API_KEY:
        raise AIUnavailable
    try:
        return genai.Client(
            api_key=settings.GEMINI_API_KEY,
            http_options=types.HttpOptions(timeout=settings.GEMINI_TIMEOUT_SECONDS * 1000),
        )
    except Exception as exc:
        logger.exception("Gemini client initialization failed")
        raise AIError from exc


def generate_gemini_content(contents, config: types.GenerateContentConfig) -> str:
    """Call Gemini directly from this module and safely normalize failures."""
    client = get_gemini_client()  # keep a reference so the client stays open
    try:
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL, contents=contents, config=config
        )
        if not response.text:
            raise AIError("Gemini returned an empty response.")
        return response.text
    except (AIUnavailable, AIError):
        raise
    except Exception as exc:
        logger.exception("Gemini generation failed")
        raise AIError from exc



def generate_json(prompt: str) -> dict:
    text = generate_gemini_content(prompt, types.GenerateContentConfig(response_mime_type="application/json"))
    try:
        return json.loads(text)
    except json.JSONDecodeError as exc:
        logger.warning("Gemini returned invalid JSON")
        raise AIError from exc


class BaseAIView(APIView):
    throttle_scope = "ai"

    def error_response(self, exc: Exception) -> Response:
        if isinstance(exc, AIUnavailable):
            return Response({"error": "The AI service is not configured on the server."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        return Response({"error": "The AI service failed to respond. Please try again."}, status=status.HTTP_502_BAD_GATEWAY)


class BreakdownGoalView(BaseAIView):
    def post(self, request):
        serializer = BreakdownGoalRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        prompt = f'''Break down this student goal into 3 to 5 milestones with 2 to 4 actionable subtasks each.
Return valid JSON only: {{"milestones":[{{"id":"m1","title":"...","dueDate":"YYYY-MM-DD or Week 1","priority":"High","subtasks":[{{"id":"st1","title":"...","estimatedMinutes":45,"completed":false}}]}}],"studyTip":"..."}}
Goal: {data["goalTitle"]}; Category: {data.get("category") or "Academic"}; Details: {data.get("detail") or "College course preparation"}; Target date: {data.get("targetDate") or "Next month"}'''
        try:
            return Response(generate_json(prompt))
        except (AIUnavailable, AIError) as exc:
            return self.error_response(exc)


class GenerateScheduleView(BaseAIView):
    def post(self, request):
        serializer = GenerateScheduleRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        courses = ", ".join(data.get("courses") or ["General Study"])
        prompt = f'''Create a balanced daily study schedule. Return valid JSON only: {{"schedule":[{{"id":"block1","timeSlot":"09:00 AM - 10:00 AM","subject":"...","activity":"...","type":"Study","focusMethod":"Pomodoro","priority":"High"}}],"aiAdvice":"..."}}
Available hours: {data.get("availableHours") or 6}; Courses: {courses}; Focus preference: {data.get("focusPreference") or "Pomodoro 25/5"}; Study goals: {data.get("studyGoals") or "Review notes and assignments"}'''
        try:
            return Response(generate_json(prompt))
        except (AIUnavailable, AIError) as exc:
            return self.error_response(exc)


class AssistantChatView(BaseAIView):
    def post(self, request):
        serializer = AssistantChatRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        contents = []
        for item in data.get("history", []):
            text = item["text"].strip()
            if text:
                contents.append(types.Content(role="user" if item["role"] == "user" else "model", parts=[types.Part(text=text)]))
        while contents and contents[0].role != "user":
            contents.pop(0)
        contents.append(types.Content(role="user", parts=[types.Part(text=data["message"])]))
        try:
            text = generate_gemini_content(contents, types.GenerateContentConfig(system_instruction=ASSISTANT_SYSTEM_INSTRUCTION, temperature=0.7))
            return Response({"text": text})
        except (AIUnavailable, AIError) as exc:
            return self.error_response(exc)
