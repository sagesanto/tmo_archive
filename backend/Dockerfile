FROM python:3.11-slim AS base
WORKDIR /app
RUN pip install --no-cache-dir --upgrade pip

# avoid reinstalling all pkgs
COPY pyproject.toml .
RUN python -c "import tomllib; print('\n'.join(tomllib.load(open('pyproject.toml','rb'))['project']['dependencies']))" > requirements.txt \
    && pip install --no-cache-dir -r requirements.txt

COPY . .
RUN pip install --no-cache-dir --no-deps .

FROM base AS api
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "5080"]

FROM base AS ingest
CMD ["python", "ingest_service.py"]
