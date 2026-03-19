"""
DB 연결 관리
SQLAlchemy 엔진 및 세션 생성
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv
from database.models import Base

# 환경 변수 로드
load_dotenv()


class DatabaseConnection:
    """데이터베이스 연결 관리 클래스"""
    
    def __init__(self):
        self.engine = None
        self.SessionLocal = None
        self._initialize()
    
    def _initialize(self):
        """DB 엔진 및 세션 초기화"""
        # 환경 변수에서 DB 설정 로드
        db_host = os.getenv("DB_HOST", "localhost")
        db_port = os.getenv("DB_PORT", "5432")
        db_name = os.getenv("DB_NAME", "brand_consulting")
        db_user = os.getenv("DB_USER", "postgres")
        db_password = os.getenv("DB_PASSWORD", "")
        
        # PostgreSQL 연결 문자열
        # 형식: postgresql://user:password@host:port/database
        database_url = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
        
        # 엔진 생성
        self.engine = create_engine(
            database_url,
            echo=os.getenv("LANGGRAPH_DEBUG", "false").lower() == "true",  # SQL 로그 출력
            pool_pre_ping=True,  # 연결 유효성 검사
            pool_recycle=3600    # 1시간마다 연결 재생성
        )
        
        # 세션 팩토리 생성
        self.SessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=self.engine
        )
    
    def create_tables(self):
        """테이블 생성 (개발용, 실제로는 백엔드가 담당)"""
        Base.metadata.create_all(bind=self.engine)
        print("[DB] 테이블 생성 완료")
    
    def get_session(self) -> Session:
        """DB 세션 반환"""
        return self.SessionLocal()
    
    def close(self):
        """연결 종료"""
        if self.engine:
            self.engine.dispose()
            print("[DB] 연결 종료")



# 전역 DB 연결 인스턴스 (선택적 초기화)
db_connection = None
DB_ENABLED = os.getenv("ENABLE_DB", "false").lower() == "true"

try:
    if DB_ENABLED:
        db_connection = DatabaseConnection()
        print("[DB] 연결 초기화 완료")
    else:
        print("[DB] DB 미사용 모드 (ENABLE_DB=false)")
except Exception as e:
    print(f"[DB] 연결 초기화 실패: {e}")
    print("[DB] DB 미사용 모드로 전환")
    db_connection = None


def get_db_session() -> Session:
    """
    DB 세션 가져오기 (컨텍스트 매니저 사용 권장)
    
    사용 예시:
    with get_db_session() as session:
        # DB 작업
        pass
    """
    session = db_connection.get_session()
    try:
        yield session
    finally:
        session.close()
