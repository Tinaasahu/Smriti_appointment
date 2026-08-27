FROM python:3.10-slim

WORKDIR /app

# Install requirements
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy all backend app files
COPY . /app

# Ensure PYTHONPATH includes /app
ENV PYTHONPATH=/app

EXPOSE 8000

# Start FastAPI server
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
