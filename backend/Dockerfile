FROM python:3.10-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend files
COPY . /app/backend

# Set PYTHONPATH
ENV PYTHONPATH=/app:/app/backend

WORKDIR /app/backend

EXPOSE 8000

# Execute FastAPI with Uvicorn using dynamic Railway $PORT
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
