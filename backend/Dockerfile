# ── AgriSense AI — Backend Dockerfile ──────────────────────────────────
# Build context is the REPO ROOT (Railway runs docker build from root).

FROM python:3.11-slim AS base

# Prevent Python from writing .pyc files and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# ── Install dependencies first (layer caching) ───────────────────────
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── Copy backend source (includes model/*.pkl) ───────────────────────
COPY backend/ .

# ── Railway injects PORT at runtime (default 5000 for local testing) ─
ENV PORT=5000
EXPOSE ${PORT}

# ── Run with gunicorn (production WSGI server) ───────────────────────
CMD gunicorn app:app --bind 0.0.0.0:${PORT} --workers 2 --timeout 120
