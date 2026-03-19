"""
SQLAlchemy 모델 정의
State 중심 아키텍처 - 결과물만 DB에 저장
"""
from sqlalchemy import Column, String, Integer, JSON, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()


class User(Base):
    """users 테이블 - 사용자 정보"""
    __tablename__ = 'users'
    
    user_id = Column(String(50), primary_key=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationships
    brands = relationship("Brand", back_populates="user")


class Brand(Base):
    """brands 테이블 - 브랜드 프로젝트 메타데이터"""
    __tablename__ = 'brands'
    
    brand_id = Column(String(50), primary_key=True)
    user_id = Column(String(50), ForeignKey('users.user_id'), nullable=False)
    current_step = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationships
    user = relationship("User", back_populates="brands")
    brand_consulting = relationship("BrandConsulting", back_populates="brand", uselist=False)
    marketing_consulting = relationship("MarketingConsulting", back_populates="brand", uselist=False)
    final_report = relationship("FinalReport", back_populates="brand", uselist=False)





class BrandConsulting(Base):
    """brand_consulting 테이블 - 브랜드 컨설팅 결과물 (Steps 1-5)"""
    __tablename__ = 'brand_consulting'
    
    brand_consulting_id = Column(Integer, primary_key=True, autoincrement=True)
    brand_id = Column(String(50), ForeignKey('brands.brand_id'), nullable=False, unique=True)
    
    # 각 단계 결과물만 저장 (분석 내용은 State로 관리)
    # Step 1: {"qa": {...}, "analysis": {...}}
    # Steps 2-5: {"analysis": {...}, "output": {...}}
    diagnosis_result = Column(JSON, nullable=True)
    naming_result = Column(JSON, nullable=True)
    concept_result = Column(JSON, nullable=True)
    story_result = Column(JSON, nullable=True)
    logo_result = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationships
    brand = relationship("Brand", back_populates="brand_consulting")





class MarketingConsulting(Base):
    """marketing_consulting 테이블 - 마케팅 자산 결과물 (Steps 6-9)"""
    __tablename__ = 'marketing_consulting'
    
    marketing_consulting_id = Column(Integer, primary_key=True, autoincrement=True)
    brand_id = Column(String(50), ForeignKey('brands.brand_id'), nullable=False, unique=True)
    
    # 각 단계 결과물만 저장
    # {"analysis": {...}, "output": {...}}
    icon_result = Column(JSON, nullable=True)
    model_result = Column(JSON, nullable=True)
    staging_result = Column(JSON, nullable=True)
    poster_result = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationships
    brand = relationship("Brand", back_populates="marketing_consulting")


class FinalReport(Base):
    """final_report 테이블 - 전체 단계 통합 최종 리포트"""
    __tablename__ = 'final_report'
    
    final_report_id = Column(Integer, primary_key=True, autoincrement=True)
    brand_id = Column(String(50), ForeignKey('brands.brand_id'), nullable=False, unique=True)
    
    # 브랜드 Q&A 누적 분석 (State에서 가져옴)
    brand_qa_analysis = Column(JSON, nullable=True)  # cumulative_qa_analysis["step_1_2_3_4_5"]
    
    # 전체 결과물 통합
    final_brand_content = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationships
    brand = relationship("Brand", back_populates="final_report")
