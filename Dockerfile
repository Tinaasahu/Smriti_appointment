FROM python:3.10-slim

WORKDIR /app

# Install dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY backend /app/backend

# Set Python path to ensure module imports resolve correctly
ENV PYTHONPATH=/app/backend

WORKDIR /app/backend

EXPOSE 8000

# Execute FastAPI with Uvicorn using dynamic Railway $PORT
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
