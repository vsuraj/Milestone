# Milestone

A focus timer, goal tracker and study planner with an AI mentor.

Built with React, TypeScript and Vite on the frontend, and Django REST Framework, SimpleJWT and PostgreSQL on the backend. AI features use Google Gemini, called from the server.

## Project structure

```
backend/     Django project
frontend/    React app
.env.example Environment variable template
```

## Requirements

- Python 3.11+
- Node.js 20+
- PostgreSQL 14+

## Setup

### Database

```sql
CREATE USER milestone WITH PASSWORD 'milestone' CREATEDB;
CREATE DATABASE milestone OWNER milestone;
```

### Environment

Copy `.env.example` to `.env` in the project root and fill in:

```
DJANGO_DEBUG=true
DJANGO_SECRET_KEY=your-secret-key
DATABASE_URL=postgres://milestone:milestone@localhost:5432/milestone
GEMINI_API_KEY=your-gemini-key
GEMINI_MODEL=gemini-3.5-flash-lite
GEMINI_TIMEOUT_SECONDS=90
```

### Backend

```
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

On macOS or Linux, activate with `source .venv/bin/activate`.

### Frontend

```
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. Requests to `/api` are forwarded to Django on port 8000.

## Production build

Django serves the API and the built React app together.

```
cd frontend
npm ci
npm run build

cd ../backend
python manage.py collectstatic --noinput
python manage.py migrate
gunicorn config.wsgi:application
```

Set `DJANGO_DEBUG=false` and a real `DJANGO_SECRET_KEY` before running this.

## Deploy to PythonAnywhere

PostgreSQL requires a paid account. Replace `USERNAME` with your username.

1. Run `npm run build` in `frontend` and upload `backend/` and `frontend/dist/` to `~/milestone/`.
2. In a Bash console:
   ```
   mkvirtualenv milestone --python=python3.12
   cd ~/milestone/backend
   pip install -r requirements.txt
   ```
3. In the Databases tab, set a Postgres password and create a database named `milestone`.
4. Create `~/milestone/.env`:
   ```
   DJANGO_DEBUG=false
   DJANGO_SECRET_KEY=your-secret-key
   DJANGO_ALLOWED_HOSTS=USERNAME.pythonanywhere.com
   DJANGO_CSRF_TRUSTED_ORIGINS=https://USERNAME.pythonanywhere.com
   DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/milestone
   GEMINI_API_KEY=your-gemini-key
   GEMINI_MODEL=gemini-3.5-flash-lite
   GEMINI_TIMEOUT_SECONDS=90
   ```
5. Run:
   ```
   python manage.py migrate
   python manage.py collectstatic --noinput
   ```
6. In the Web tab, add a new web app with manual configuration, then set:
   - Virtualenv: `/home/USERNAME/.virtualenvs/milestone`
   - Static files: `/static/` to `/home/USERNAME/milestone/backend/staticfiles`
   - WSGI file:
     ```python
     import os, sys

     path = "/home/USERNAME/milestone/backend"
     if path not in sys.path:
         sys.path.insert(0, path)

     os.environ["DJANGO_SETTINGS_MODULE"] = "config.settings"

     from django.core.wsgi import get_wsgi_application
     application = get_wsgi_application()
     ```
7. Click Reload.

## Tests

```
cd backend
python manage.py test

cd frontend
npm run lint
npm run build
```

## API

| Method | Path | Description |
| :--- | :--- | :--- |
| POST | `/api/auth/register/` | Create an account |
| POST | `/api/auth/login/` | Log in |
| POST | `/api/auth/token/refresh/` | Refresh the access token |
| POST | `/api/auth/logout/` | Log out |
| GET | `/api/auth/me/` | Current user |
| GET, PUT | `/api/profile/` | Profile and timer settings |
| GET, POST | `/api/goals/` | List or create goals |
| GET, PUT, DELETE | `/api/goals/{id}/` | Read, save or delete a goal |
| GET, POST | `/api/focus-logs/` | List or create focus sessions |
| POST | `/api/gemini/breakdown-goal/` | AI goal breakdown |
| POST | `/api/gemini/generate-schedule/` | AI daily schedule |
| POST | `/api/gemini/assistant-chat/` | AI mentor chat |
| GET | `/api/health` | Health check |

All endpoints except auth and health need an `Authorization: Bearer <token>` header.
