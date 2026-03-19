#config.py
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_TITLE: str = "Brand Consulting AI API"
    API_VERSION: str = "1.0.0"

    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173"
    ]

    SESSION_TIMEOUT: int = 3600
    MAX_SESSIONS: int = 100

    # 🔥 여기가 핵심
    OPENAI_API_KEY: str
    GEMINI_API_KEY: str

    CLOUDINARY_CLOUD_NAME: str
    CLOUDINARY_API_KEY: str
    CLOUDINARY_API_SECRET: str

    ENABLE_DB: bool = False

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()