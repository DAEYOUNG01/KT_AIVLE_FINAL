#main.py
from dotenv import load_dotenv
# .env 파일 로드 (os.getenv 지원) - 가장 먼저 실행
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.config import settings
from api.routers import brand, marketing

# FastAPI 앱 생성
app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION,
    description="""
    AI Brand Consulting API
    
    [Workflow]
    1. Step 1 (Diagnosis): Q&A -> Analysis Result
    2. Step 2 (Naming): Analysis + Q&A -> 3 Candidates
    3. Step 3 (Concept): Analysis + Naming Context + Q&A -> 3 Candidates
    4. Step 4 (Story): Analysis + Naming + Concept + Q&A -> 3 Candidates
    5. Step 5 (Logo): All Context + Q&A -> 3 Candidates (Images)
    
    [Marketing]
    6. Step 6 (Icon): Brand Assets + Q&A -> Icon Image
    7. Step 7 (Model): Brand Assets + Q&A -> Model Image
    8. Step 8 (Staging): Brand Assets + Q&A -> Staging Image
    9. Step 9 (Ad): Brand Assets + Q&A -> Ad Poster
    """
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(brand.router)
app.include_router(marketing.router, prefix="/marketing", tags=["Marketing"])
@app.get("/")
async def root():
    return {
        "message": "AI Brand Consulting API is Running",
        "docs": "/docs"
    }
