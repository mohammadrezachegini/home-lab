FROM python:3.11-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip \
    && pip install --prefix=/install --no-cache-dir -r requirements.txt


FROM python:3.11-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /install /usr/local

# Copy ONLY the src contents — this puts django_app/ directly under /app
COPY src/ /app

# Now manage.py is at /app/django_app/manage.py
WORKDIR /app/django_app

# Do privileged operations BEFORE switching user
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh \
    && useradd --no-create-home --shell /bin/false appuser \
    && chown -R appuser /app

USER appuser

EXPOSE 8000
ENTRYPOINT ["/entrypoint.sh"]