import tempfile
from pathlib import Path
from unittest import mock

from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from ai import views as ai_views
from goals.models import Goal

PASSWORD = "S7rong-passw0rd!"


def make_client(email="alice@example.com", name="Alice"):
    client = APIClient()
    res = client.post(
        "/api/auth/register/",
        {"email": email, "name": name, "password": PASSWORD},
        format="json",
    )
    assert res.status_code == 201, res.content
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {res.data['access']}")
    return client, res.data


GOAL = {
    "id": "g-1",
    "title": "Pass Algorithms",
    "category": "Academic",
    "targetDate": "2026-12-01",
    "progress": 20,
    "priority": "High",
    "description": "Finish CLRS ch 1-5",
    "milestones": [{"id": "m1", "title": "Ch1", "subtasks": []}],
    "tags": ["cs"],
    "aiTip": "Use active recall.",
}


class AuthTests(TestCase):
    def test_register_login_me_refresh_logout(self):
        client, data = make_client()
        self.assertEqual(data["user"]["email"], "alice@example.com")
        self.assertEqual(data["user"]["displayName"], "Alice")

        anon = APIClient()
        login = anon.post(
            "/api/auth/login/",
            {"email": "ALICE@example.com", "password": PASSWORD},
            format="json",
        )
        self.assertEqual(login.status_code, 200, login.content)
        self.assertIn("access", login.data)
        self.assertEqual(login.data["user"]["displayName"], "Alice")

        me = client.get("/api/auth/me/")
        self.assertEqual(me.status_code, 200)
        self.assertEqual(me.data["email"], "alice@example.com")

        refreshed = anon.post(
            "/api/auth/token/refresh/", {"refresh": login.data["refresh"]}, format="json"
        )
        self.assertEqual(refreshed.status_code, 200)
        self.assertIn("access", refreshed.data)
        # refresh tokens rotate: the old one is blacklisted
        reuse = anon.post(
            "/api/auth/token/refresh/", {"refresh": login.data["refresh"]}, format="json"
        )
        self.assertEqual(reuse.status_code, 401)

        out = anon.post(
            "/api/auth/logout/", {"refresh": refreshed.data["refresh"]}, format="json"
        )
        self.assertEqual(out.status_code, 205)
        after = anon.post(
            "/api/auth/token/refresh/", {"refresh": refreshed.data["refresh"]}, format="json"
        )
        self.assertEqual(after.status_code, 401)

    def test_bad_credentials_and_duplicates(self):
        make_client()
        anon = APIClient()
        bad = anon.post(
            "/api/auth/login/", {"email": "alice@example.com", "password": "nope"}, format="json"
        )
        self.assertEqual(bad.status_code, 401)
        dup = anon.post(
            "/api/auth/register/",
            {"email": "Alice@Example.com", "name": "Again", "password": PASSWORD},
            format="json",
        )
        self.assertEqual(dup.status_code, 400)
        weak = anon.post(
            "/api/auth/register/",
            {"email": "bob@example.com", "name": "Bob", "password": "12345678"},
            format="json",
        )
        self.assertEqual(weak.status_code, 400)
        self.assertIn("password", weak.data)

    def test_protected_routes_require_jwt(self):
        anon = APIClient()
        for url in ["/api/goals/", "/api/focus-logs/", "/api/profile/", "/api/auth/me/"]:
            self.assertEqual(anon.get(url).status_code, 401, url)
        self.assertEqual(
            anon.post("/api/gemini/assistant-chat", {"message": "hi"}, format="json").status_code,
            401,
        )

    def test_profile_roundtrip_updates_name(self):
        client, _ = make_client()
        got = client.get("/api/profile/")
        self.assertEqual(got.status_code, 200)
        self.assertEqual(got.data["pomodoroMinutes"], 25)
        self.assertEqual(got.data["name"], "Alice")
        res = client.put(
            "/api/profile/",
            {
                "name": "Alice B",
                "school": "TSPDC",
                "major": "CS",
                "semester": "Fall 2026",
                "dailyGoalHours": 5,
                "pomodoroMinutes": 30,
                "shortBreakMinutes": 7,
            },
            format="json",
        )
        self.assertEqual(res.status_code, 200, res.content)
        self.assertEqual(client.get("/api/auth/me/").data["displayName"], "Alice B")
        bad = client.put(
            "/api/profile/", {"name": "x", "pomodoroMinutes": 999}, format="json"
        )
        self.assertEqual(bad.status_code, 400)


class GoalTests(TestCase):
    def test_upsert_list_delete(self):
        client, _ = make_client()
        created = client.put("/api/goals/g-1/", GOAL, format="json")
        self.assertEqual(created.status_code, 201, created.content)
        updated = client.put("/api/goals/g-1/", {**GOAL, "progress": 60}, format="json")
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.data["progress"], 60)
        listing = client.get("/api/goals/")
        self.assertEqual(len(listing.data), 1)
        self.assertEqual(listing.data[0]["milestones"][0]["id"], "m1")
        self.assertEqual(client.delete("/api/goals/g-1/").status_code, 204)
        self.assertEqual(client.get("/api/goals/").data, [])

    def test_create_conflict_and_validation(self):
        client, _ = make_client()
        self.assertEqual(client.post("/api/goals/", GOAL, format="json").status_code, 201)
        self.assertEqual(client.post("/api/goals/", GOAL, format="json").status_code, 400)
        for patch in [
            {"title": "x" * 201},
            {"progress": 101},
            {"progress": -1},
            {"category": "Nonsense"},
            {"tags": ["a"] * 21},
            {"milestones": [{}] * 51},
        ]:
            res = client.put("/api/goals/g-2/", {**GOAL, "id": "g-2", **patch}, format="json")
            self.assertEqual(res.status_code, 400, patch)
        bad_id = client.put("/api/goals/bad id!/", GOAL, format="json")
        self.assertIn(bad_id.status_code, (400, 404))

    def test_users_are_isolated(self):
        alice, _ = make_client("alice@example.com", "Alice")
        bob, _ = make_client("bob@example.com", "Bob")
        alice.put("/api/goals/g-1/", GOAL, format="json")
        self.assertEqual(bob.get("/api/goals/").data, [])
        self.assertEqual(bob.get("/api/goals/g-1/").status_code, 404)
        self.assertEqual(bob.delete("/api/goals/g-1/").status_code, 404)
        # Bob "upserting" the same id creates his own row, never touching Alice's
        res = bob.put("/api/goals/g-1/", {**GOAL, "title": "Bob's goal"}, format="json")
        self.assertEqual(res.status_code, 201)
        self.assertEqual(Goal.objects.get(user__email="alice@example.com").title, GOAL["title"])


class FocusLogTests(TestCase):
    LOG = {
        "id": "log-1",
        "timestamp": "2026-09-30 10:15",
        "durationMinutes": 25,
        "subject": "Math",
        "notes": "",
        "tag": "deep",
    }

    def test_create_list_delete_and_isolation(self):
        alice, _ = make_client("alice@example.com", "Alice")
        bob, _ = make_client("bob@example.com", "Bob")
        res = alice.post("/api/focus-logs/", self.LOG, format="json")
        self.assertEqual(res.status_code, 201, res.content)
        self.assertEqual(res.data["timestamp"], "2026-09-30 10:15")
        self.assertEqual(len(alice.get("/api/focus-logs/").data), 1)
        self.assertEqual(bob.get("/api/focus-logs/").data, [])
        self.assertEqual(bob.delete("/api/focus-logs/log-1/").status_code, 404)
        self.assertEqual(alice.delete("/api/focus-logs/log-1/").status_code, 204)

    def test_validation(self):
        client, _ = make_client()
        for patch in [{"durationMinutes": -5}, {"durationMinutes": 0}, {"durationMinutes": 1441}, {"subject": "x" * 101}]:
            res = client.post("/api/focus-logs/", {**self.LOG, **patch}, format="json")
            self.assertEqual(res.status_code, 400, patch)


class AITests(TestCase):
    def test_breakdown_schedule_chat_with_mocked_gemini(self):
        client, _ = make_client()
        with mock.patch.object(
            ai_views, "generate_json", return_value={"milestones": [], "studyTip": "tip"}
        ) as m:
            res = client.post(
                "/api/gemini/breakdown-goal", {"goalTitle": "Learn Django"}, format="json"
            )
            self.assertEqual(res.status_code, 200, res.content)
            self.assertEqual(res.data["studyTip"], "tip")
            m.assert_called_once()
        with mock.patch.object(ai_views, "generate_json", return_value={"schedule": [], "aiAdvice": "go"}):
            res = client.post(
                "/api/gemini/generate-schedule/",
                {"availableHours": 5, "courses": ["Math"], "focusPreference": "Pomodoro", "studyGoals": "x"},
                format="json",
            )
            self.assertEqual(res.status_code, 200)
        with mock.patch.object(ai_views, "generate_gemini_content", return_value="hello") as chat:
            res = client.post(
                "/api/gemini/assistant-chat",
                {"message": "hi", "history": [{"role": "assistant", "text": "yo"}]},
                format="json",
            )
            self.assertEqual(res.data, {"text": "hello"})
            self.assertEqual(chat.call_args.args[0][-1].parts[0].text, "hi")

    def test_validation_and_error_mapping(self):
        client, _ = make_client()
        self.assertEqual(
            client.post("/api/gemini/breakdown-goal", {}, format="json").status_code, 400
        )
        self.assertEqual(
            client.post("/api/gemini/assistant-chat", {"message": ""}, format="json").status_code, 400
        )
        # No key configured -> 503 (not a stack trace)
        with override_settings(GEMINI_API_KEY=""):
            res = client.post(
                "/api/gemini/assistant-chat", {"message": "hi"}, format="json"
            )
            self.assertEqual(res.status_code, 503)
        with mock.patch.object(
            ai_views, "generate_gemini_content", side_effect=ai_views.AIError("boom")
        ):
            res = client.post("/api/gemini/assistant-chat", {"message": "hi"}, format="json")
            self.assertEqual(res.status_code, 502)
            self.assertNotIn("boom", str(res.data))


class SpaFallbackTests(TestCase):
    def test_health_and_api_404_are_json(self):
        c = APIClient()
        self.assertEqual(c.get("/api/health").status_code, 200)
        self.assertEqual(c.get("/api/health/").json()["status"], "ok")
        res = c.get("/api/does-not-exist/")
        self.assertEqual(res.status_code, 404)
        self.assertEqual(res["Content-Type"], "application/json")

    def test_non_api_routes_return_react_index(self):
        with tempfile.TemporaryDirectory() as tmp:
            Path(tmp, "index.html").write_text("<html><div id='root'></div></html>")
            with override_settings(FRONTEND_DIST=Path(tmp)):
                c = APIClient()
                for path in ["/", "/dashboard", "/goals", "/login", "/some/deep/link"]:
                    res = c.get(path)
                    self.assertEqual(res.status_code, 200, path)
                    self.assertIn(b"id='root'", res.content)
                    self.assertEqual(res["Cache-Control"], "no-cache")

    def test_missing_build_gives_clear_error(self):
        with override_settings(FRONTEND_DIST=Path("/nonexistent-dist")):
            res = APIClient().get("/dashboard")
            self.assertEqual(res.status_code, 501)
