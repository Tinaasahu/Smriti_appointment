FROM python:3.10-slim

WORKDIR /app

# Install dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code and prediction module
COPY backend /app/backend
COPY prediction /app/prediction

# Set PYTHONPATH so python imports 'app' and 'prediction' packages
ENV PYTHONPATH=/app:/app/backend

WORKDIR /app/backend

EXPOSE 8000

# Execute FastAPI with Uvicorn reading PORT from Railway environment (default 8000)
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
