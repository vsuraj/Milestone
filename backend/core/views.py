import logging
from pathlib import Path

from django.conf import settings
from django.http import HttpResponse, JsonResponse
from django.utils import timezone
from django.views import View

logger = logging.getLogger(__name__)

_index_cache: dict[str, tuple[float, bytes]] = {}


def health(request):
    return JsonResponse({"status": "ok", "timestamp": timezone.now().isoformat()})


def api_not_found(request, *args, **kwargs):
    """Unknown /api/ routes must return JSON 404, never the React app shell."""
    return JsonResponse({"error": "Not found."}, status=404)


class ReactAppView(View):
    """Serve the compiled React ``index.html`` for every non-API route so that
    React Router can resolve the path client-side (deep links + refresh)."""

    def get(self, request, *args, **kwargs):
        index_path = Path(settings.FRONTEND_DIST) / "index.html"
        try:
            mtime = index_path.stat().st_mtime
        except FileNotFoundError:
            logger.error("React build not found at %s", index_path)
            return HttpResponse(
                "Frontend build not found. Run `npm run build` in frontend/ "
                "(or use the Vite dev server on http://localhost:5173).",
                status=501,
                content_type="text/plain",
            )
        cached = _index_cache.get(str(index_path))
        if cached is None or cached[0] != mtime or settings.DEBUG:
            cached = (mtime, index_path.read_bytes())
            _index_cache[str(index_path)] = cached
        response = HttpResponse(cached[1], content_type="text/html; charset=utf-8")
        # index.html references hashed assets; it must never be cached itself.
        response["Cache-Control"] = "no-cache"
        return response
