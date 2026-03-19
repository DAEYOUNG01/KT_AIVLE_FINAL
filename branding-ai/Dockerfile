FROM python:3.11-slim

WORKDIR /app

# 시스템 패키지 (필요 최소)
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 의존성 먼저 설치 (캐시 최적화)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && pip list

# 소스 복사
COPY . .

EXPOSE 8000

# 🔴 중요: 실제 main 위치 기준
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]