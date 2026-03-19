"""
DB CRUD 연산
State 중심 아키텍처 - 결과물만 저장/조회
"""
from sqlalchemy.orm import Session
from database.models import Brand, BrandConsulting, MarketingConsulting, FinalReport
from typing import Dict, Any, Optional
from datetime import datetime


def create_brand(session: Session, brand_id: str, user_id: str) -> Brand:
    """새로운 브랜드 프로젝트 생성"""
    brand = Brand(
        brand_id=brand_id,
        user_id=user_id,
        current_step=1
    )
    session.add(brand)
    session.commit()
    session.refresh(brand)
    
    # BrandConsulting 초기화
    consulting = BrandConsulting(brand_id=brand_id)
    session.add(consulting)
    session.commit()
    
    print(f"[DB] 브랜드 생성: {brand_id}")
    return brand


def save_brand_result(
    session: Session,
    brand_id: str,
    step_name: str,
    result_data: Dict[str, Any]
) -> BrandConsulting:
    """
    브랜드 컨설팅 결과물 저장 (Steps 1-5)
    
    Args:
        session: DB 세션
        brand_id: 브랜드 ID
        step_name: 단계 이름 ("diagnosis", "naming", "concept", "story", "logo")
        result_data: 결과물 데이터
            - Step 1: {"qa": {...}, "analysis": {...}}
            - Steps 2-5: {"analysis": {...}, "output": {...}}
    """
    consulting = session.query(BrandConsulting).filter_by(brand_id=brand_id).first()
    
    if not consulting:
        consulting = BrandConsulting(brand_id=brand_id)
        session.add(consulting)
    
    # 단계별 결과 저장
    field_name = f"{step_name}_result"
    if hasattr(consulting, field_name):
        setattr(consulting, field_name, result_data)
        consulting.updated_at = datetime.now()
        session.commit()
        session.refresh(consulting)
        print(f"[DB] 결과물 저장: {brand_id} - {step_name}")
    else:
        raise ValueError(f"잘못된 단계 이름: {step_name}")
    
    return consulting


def save_marketing_result(
    session: Session,
    brand_id: str,
    step_name: str,
    result_data: Dict[str, Any]
) -> MarketingConsulting:
    """
    마케팅 자산 결과물 저장 (Steps 6-9)
    
    Args:
        session: DB 세션
        brand_id: 브랜드 ID
        step_name: 단계 이름 ("icon", "model", "staging", "poster")
        result_data: 결과물 데이터 {"analysis": {...}, "output": {...}}
    """
    marketing = session.query(MarketingConsulting).filter_by(brand_id=brand_id).first()
    
    if not marketing:
        marketing = MarketingConsulting(brand_id=brand_id)
        session.add(marketing)
    
    # 단계별 결과 저장
    field_name = f"{step_name}_result"
    if hasattr(marketing, field_name):
        setattr(marketing, field_name, result_data)
        marketing.updated_at = datetime.now()
        session.commit()
        session.refresh(marketing)
        print(f"[DB] 마케팅 결과 저장: {brand_id} - {step_name}")
    else:
        raise ValueError(f"잘못된 단계 이름: {step_name}")
    
    return marketing


def load_brand_results(
    session: Session,
    brand_id: str,
    up_to_step: int
) -> Dict[str, Any]:
    """
    DB에서 이전 단계 결과물 로드
    
    Args:
        session: DB 세션
        brand_id: 브랜드 ID
        up_to_step: 어느 단계까지 로드할지 (1~9)
    
    Returns:
        결과물 딕셔너리
    """
    results = {}
    
    # Steps 1-5 결과물
    if up_to_step >= 1:
        consulting = session.query(BrandConsulting).filter_by(brand_id=brand_id).first()
        if consulting:
            step_mapping = {
                1: "diagnosis_result",
                2: "naming_result",
                3: "concept_result",
                4: "story_result",
                5: "logo_result"
            }
            for step_num in range(1, min(up_to_step + 1, 6)):
                field_name = step_mapping.get(step_num)
                if field_name and hasattr(consulting, field_name):
                    value = getattr(consulting, field_name)
                    if value:
                        results[field_name] = value
    
    # Steps 6-9 결과물
    if up_to_step >= 6:
        marketing = session.query(MarketingConsulting).filter_by(brand_id=brand_id).first()
        if marketing:
            step_mapping = {
                6: "icon_result",
                7: "model_result",
                8: "staging_result",
                9: "poster_result"
            }
            for step_num in range(6, min(up_to_step + 1, 10)):
                field_name = step_mapping.get(step_num)
                if field_name and hasattr(marketing, field_name):
                    value = getattr(marketing, field_name)
                    if value:
                        results[field_name] = value
    
    return results


def save_final_report(
    session: Session,
    brand_id: str,
    brand_qa_analysis: Dict[str, Any],
    final_brand_content: Dict[str, Any]
) -> FinalReport:
    """
    최종 통합 리포트 저장
    
    Args:
        session: DB 세션
        brand_id: 브랜드 ID
        brand_qa_analysis: 브랜드 Q&A 누적 분석 (State에서 가져옴)
        final_brand_content: 전체 결과물 통합
    """
    report = session.query(FinalReport).filter_by(brand_id=brand_id).first()
    
    if not report:
        report = FinalReport(brand_id=brand_id)
        session.add(report)
    
    report.brand_qa_analysis = brand_qa_analysis
    report.final_brand_content = final_brand_content
    report.updated_at = datetime.now()
    session.commit()
    session.refresh(report)
    
    print(f"[DB] 최종 리포트 저장: {brand_id}")
    return report


def update_brand_step(session: Session, brand_id: str, current_step: int):
    """브랜드 진행 단계 업데이트"""
    brand = session.query(Brand).filter_by(brand_id=brand_id).first()
    if brand:
        brand.current_step = current_step
        brand.updated_at = datetime.now()
        session.commit()
        print(f"[DB] 진행 단계 업데이트: {brand_id} -> Step {current_step}")
