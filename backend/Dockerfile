FROM python:3.13-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy project files
COPY . .

RUN chmod +x start.sh

# Install main dependencies from the same manifest used by Render
RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 8000

CMD ["./start.sh"]
