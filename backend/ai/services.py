"""Server-side Gemini integration (ported from the former Express ``server.ts``)."""
import json
import logging

from django.conf import settings
from google import genai
from google.genai import types
from pydantic import BaseModel


logger = logging.getLogger(__name__)

ASSISTANT_SYSTEM_INSTRUCTION = (
    "You are Milestone AI, a friendly, encouraging, and highly effective academic mentor "
    "and study assistant for college students.\n"
    "Your advice is grounded in evidence-based study techniques: Active Recall, Spaced "
    "Repetition, Pomodoro, Feynman Technique, and Eisenhower Matrix.\n"
    "Keep your responses well-structured using markdown with bullet points, bold key "
    "concepts, and actionable study steps. Be supportive and clear."
)


class AIUnavailable(Exception):
    """GEMINI_API_KEY is not configured."""


class AIError(Exception):
    """The upstream model call failed."""


# --- Structured-output schemas -------------------------------------------------
class SubtaskOut(BaseModel):
    id: str
    title: str
    estimatedMinutes: float
    completed: bool


class MilestoneOut(BaseModel):
    id: str
    title: str
    dueDate: str
    priority: str
    subtasks: list[SubtaskOut]


class BreakdownOut(BaseModel):
    milestones: list[MilestoneOut]
    studyTip: str


class ScheduleBlockOut(BaseModel):
    id: str
    timeSlot: str
    subject: str
    activity: str
    type: str
    focusMethod: str
    priority: str


class ScheduleOut(BaseModel):
    schedule: list[ScheduleBlockOut]
    aiAdvice: str


# --- Helpers -------------------------------------------------------------------
def get_client() -> genai.Client:
    if not settings.GEMINI_API_KEY:
        print("services get- client problem")
        raise AIUnavailable("GEMINI_API_KEY is not configured in the environment.")
    try:
        print("api", settings.GEMINI_API_KEY)
        return genai.Client(
            api_key=settings.GEMINI_API_KEY,
            http_options=types.HttpOptions(
                timeout=settings.GEMINI_TIMEOUT_SECONDS * 1000,
            ),
            
        )
    except Exception as exc:
        # For example, an invalid client/API-key configuration.  Expose the
        # same safe API error as a failed generation rather than returning 500.
        logger.exception("Gemini client initialization failed")
        raise AIError("Unable to initialize the Gemini client.") from exc


def _generate_json(prompt: str, schema: type[BaseModel]) -> dict:
    try:
        client = get_client()
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=schema,
            ),
        )
        return json.loads(response.text or "{}")
    except AIUnavailable:
        raise
    except Exception as exc:  # network errors, quota, malformed JSON ...
        logger.exception("Gemini structured generation failed")
        raise AIError(str(exc)) from exc


# --- Public API ----------------------------------------------------------------
def breakdown_goal(goal_title, category=None, detail=None, target_date=None) -> dict:
    prompt = f"""You are an expert student mentor and productivity strategist.
Break down the following student goal into 3 to 5 clear milestones, each with 2 to 4 actionable subtasks.

Goal Title: "{goal_title}"
Category: "{category or "Academic"}"
Details/Target: "{detail or "College course preparation"}"
Target Date: "{target_date or "Next month"}"

Return JSON matching this exact structure:
{{
  "milestones": [
    {{
      "id": "m1",
      "title": "Milestone title",
      "dueDate": "YYYY-MM-DD or relative time like 'Week 1'",
      "priority": "High" | "Medium" | "Low",
      "subtasks": [
        {{
          "id": "st1",
          "title": "Subtask title",
          "estimatedMinutes": 45,
          "completed": false
        }}
      ]
    }}
  ],
  "studyTip": "A short 1-2 sentence actionable tip to excel at this goal."
}}"""
    return _generate_json(prompt, BreakdownOut)


def generate_schedule(available_hours=None, courses=None, focus_preference=None, study_goals=None) -> dict:
    courses_text = ", ".join(courses) if courses else "General Study"
    prompt = f"""Act as an academic schedule generator for a college student.
Create an optimal daily schedule based on:
- Total Study/Work Hours Available: {available_hours or 6} hours
- Active Courses/Subjects: {courses_text}
- Preferred Focus Technique: {focus_preference or "Pomodoro 25/5"}
- Today's Key Targets: {study_goals or "Review notes, work on assignment"}

Generate an array of time blocks spanning from morning to evening, balanced with study sessions, short active recall breaks, meal time, and deep focus blocks.

Return JSON in this format:
{{
  "schedule": [
    {{
      "id": "block1",
      "timeSlot": "09:00 AM - 10:15 AM",
      "subject": "Organic Chemistry",
      "activity": "Deep Reading & Reaction Mechanism Flashcards",
      "type": "Study", // "Study" | "Break" | "Review" | "Exam Prep"
      "focusMethod": "2x 25m Pomodoro",
      "priority": "High"
    }}
  ],
  "aiAdvice": "Motivational focus advice for the day."
}}"""
    return _generate_json(prompt, ScheduleOut)


def assistant_chat(message: str, history: list[dict] | None = None) -> str:
    contents = []
    for item in history or []:
        text = str(item.get("text", "")).strip()
        if not text:
            continue
        contents.append(
            types.Content(
                role="user" if item.get("role") == "user" else "model",
                parts=[types.Part(text=text)],
            )
        )

    # Gemini conversations must begin with a user turn.  The UI includes a
    # welcome message, so discard it (and any other leading model turns).
    while contents and contents[0].role != "user":
        contents.pop(0)

    contents.append(types.Content(role="user", parts=[types.Part(text=message.strip())]))
    try:
        client = get_client()
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=ASSISTANT_SYSTEM_INSTRUCTION,
                temperature=0.7,
            ),
        )
        return response.text or "No response received."
    except AIUnavailable:
        raise
    except Exception as exc:
        logger.exception("Gemini chat failed")
        raise AIError(str(exc)) from exc
