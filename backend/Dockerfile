FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY app ./app

ENV DATABASE_URL=postgresql+asyncpg://melodia_user:eTgyHxeRJlBw4Kw3yISwD4xUGdB0d1hv@dpg-d7vqmqb7uimc73f0fi0g-a.frankfurt-postgres.render.com/melodia \
    JWT_SECRET_KEY=MELODIA@2026## \
    CORS_ORIGINS=http://localhost:8080,http://127.0.0.1:8080,https://melodia-flame.vercel.app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
