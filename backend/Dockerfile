# backend/Dockerfile
FROM python:3.11-slim

# system deps (for Pillow)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy only requirements first for layer caching
COPY requirements.txt .

RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Copy app
COPY server.py .
COPY best.onnx .
COPY classes.txt .

ENV MODEL_PATH=model.onnx
ENV CLASSES_TXT=classes.txt
ENV PORT=10000

EXPOSE 10000

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "10000", "--workers", "1", "--log-level", "info"]
