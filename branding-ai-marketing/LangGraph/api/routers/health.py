#health.py
from fastapi import APIRouter
from api.services.session_manager import session_manager

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("/")
async def health_check():
    """
    서버 헬스체크
    
    Returns:
        서버 상태 정보
    """
    return {
        "status": "healthy",
        "message": "Brand Consulting AI API is running",
        "active_sessions": session_manager.get_session_count()
    }


@router.get("/db")
async def db_health_check():
    """
    데이터베이스 연결 확인
    
    Returns:
        DB 연결 상태
    """
    try:
        from database.connection import db_connection
        
        if db_connection.is_connected():
            return {
                "status": "connected",
                "message": "Database connection is healthy"
            }
        else:
            return {
                "status": "disconnected",
                "message": "Database is not connected (may be disabled)"
            }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Database health check failed: {str(e)}"
        }
