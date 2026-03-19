"""
DB 저장 헬퍼 함수
DB 연결 없이도 동작하도록 안전하게 처리
"""
from database.connection import db_connection


def safe_db_save(save_func, *args, **kwargs):
    """
    DB 저장을 안전하게 처리하는 헬퍼 함수
    
    Args:
        save_func: 실행할 저장 함수
        *args, **kwargs: 저장 함수에 전달할 인자
    
    Returns:
        bool: 저장 성공 여부
    """
    if db_connection is None:
        print("[DB] ⚠️  DB 미사용 모드 - 저장 생략")
        return False
    
    try:
        result = save_func(*args, **kwargs)
        print("[DB] ✅ 저장 완료")
        return True
    except Exception as e:
        print(f"[DB] ⚠️  저장 실패: {e} (계속 진행)")
        return False
