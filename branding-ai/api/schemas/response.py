"""
FastAPI Response DTOs
AI -> BE -> FE 흐름에서 반환되는 응답 데이터 구조 정의
구조: result (사용자 표시용 3개 후보, DB 저장용) + state_context (다음 단계 전달용, 각 후보 상세 정보 포함)
"""
from pydantic import BaseModel, Field
from typing import Dict, Any, List

# =================================================================
# [Step 1] 진단 (Diagnosis) Response
# =================================================================
class DiagnosisResponse(BaseModel):
    """
    Step 1: 진단 결과
    result: 사용자 표시용 진단 요약 (DB 저장)
    state_context: Step 2 전달용 진단 상세 정보
    """
    result: Dict[str, Any] = Field(
        ..., 
        description="사용자 표시용 진단 결과 (summary, analysis, key_insights) - DB 저장"
    )
    state_context: Dict[str, Any] = Field(
        ..., 
        description="Step 2 전달용 진단 상세 정보 (brand_direction, tone, keywords, perspectives, brand_essence, emotional_core, differentiation_point, target_persona, diagnosis_summary)"
    )

# =================================================================
# [Step 2] 네이밍 (Naming) Response
# =================================================================
class NamingResponse(BaseModel):
    """
    Step 2: 네이밍 결과
    result: 사용자 표시용 3개 후보 (DB 저장)
    state_context: 각 후보의 상세 정보 (FE가 선택 후 해당 후보 정보를 Step 3 Request에 포함)
    """
    result: Dict[str, Any] = Field(
        ..., 
        description="""사용자 표시용 3개 네이밍 후보 - DB 저장
        예시: {"name1": "Wanderly", "name2": "Voyara", "name3": "Tripwise"}"""
    )
    state_context: Dict[str, Any] = Field(
        ..., 
        description="""각 후보의 상세 정보 (FE가 선택 후 해당 후보를 다음 단계로 전달)
        {
          "candidates": [
            {
              "id": 0,
              "brand_name": "...",
              "name_rationale": "...",
              "qa_analysis_summary": "...",
              "qa_keywords": [...]
            },
            {"id": 1, ...},
            {"id": 2, ...}
          ]
        }"""
    )

# =================================================================
# [Step 3] 컨셉 (Concept) Response
# =================================================================
class ConceptResponse(BaseModel):
    """
    Step 3: 컨셉 결과
    result: 사용자 표시용 3개 후보 (DB 저장)
    state_context: 각 후보의 상세 정보
    """
    result: Dict[str, Any] = Field(
        ..., 
        description="""사용자 표시용 3개 컨셉 후보 - DB 저장
        예시: {"concept1": "당신만의 여행", "concept2": "자유로운 탐험", "concept3": "완벽한 순간"}"""
    )
    state_context: Dict[str, Any] = Field(
        ..., 
        description="""각 후보의 상세 정보
        {
          "candidates": [
            {
              "id": 0,
              "concept_statement": "...",
              "concept_rationale": "...",
              "qa_analysis_summary": "...",
              "qa_keywords": [...],
              "brand_values": [...]
            },
            {"id": 1, ...},
            {"id": 2, ...}
          ]
        }"""
    )

# =================================================================
# [Step 4] 스토리 (Story) Response
# =================================================================
class StoryResponse(BaseModel):
    """
    Step 4: 스토리 결과
    result: 사용자 표시용 3개 후보 (DB 저장)
    state_context: 각 후보의 상세 정보
    """
    result: Dict[str, Any] = Field(
        ..., 
        description="""사용자 표시용 3개 스토리 후보 - DB 저장
        예시: {"story1": "우리는...", "story2": "여행은...", "story3": "당신의..."}"""
    )
    state_context: Dict[str, Any] = Field(
        ..., 
        description="""각 후보의 상세 정보
        {
          "candidates": [
            {
              "id": 0,
              "brand_story": "...",
              "story_rationale": "...",
              "qa_analysis_summary": "...",
              "qa_keywords": [...],
              "emotional_arc": "..."
            },
            {"id": 1, ...},
            {"id": 2, ...}
          ]
        }"""
    )

# =================================================================
# [Step 5] 로고 (Logo) Response
# =================================================================
class LogoResponse(BaseModel):
    """
    Step 5: 로고 결과 (최종 단계)
    result: 사용자 표시용 3개 후보 (DB 저장)
    state_context: 각 후보의 상세 정보
    """
    result: Dict[str, Any] = Field(
        ..., 
        description="""사용자 표시용 3개 로고 URL - DB 저장
        예시: {"logo1_url": "https://...", "logo2_url": "https://...", "logo3_url": "https://..."}"""
    )
    state_context: Dict[str, Any] = Field(
        ..., 
        description="""각 후보의 상세 정보
        {
          "candidates": [
            {
              "id": 0,
              "logo_image_url": "...",
              "logo_concept": "...",
              "logo_rationale": "...",
              "qa_analysis_summary": "...",
              "qa_keywords": [...],
              "color_palette": [...]
            },
            {"id": 1, ...},
            {"id": 2, ...}
          ]
        }"""
    )