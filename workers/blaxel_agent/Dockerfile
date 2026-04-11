FROM python:3.11-slim

RUN apt-get update -qq && apt-get install -y -qq git build-essential > /dev/null 2>&1 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -q -r requirements.txt

COPY . .

# Blaxel will automatically pass $HOST and $PORT environment variables
CMD ["bash", "-c", "uvicorn main:app --port ${PORT:-80} --host ${HOST:-0.0.0.0}"]
