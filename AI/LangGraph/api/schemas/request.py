"""
FastAPI Request DTOs
FE -> BE -> AI 흐름에서 사용되는 요청 데이터 구조 정의
구조: user_input (해당 단계 Q&A) + context (이전 단계 누적 정보) + selected_candidate (FE가 선택한 후보 상세 정보)
"""
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional

# =================================================================
# [Step 1] 진단 (Diagnosis) Request
# =================================================================
class DiagnosisRequest(BaseModel):
    """
    Step 1: 진단 요청
    user_input: answers.json의 step_1 Q&A 답변
    """
    user_input: Dict[str, Any] = Field(
        ..., 
        description="Step 1 Q&A 답변 (answers.json의 step_1 내용)"
    )

# =================================================================
# [Step 2] 네이밍 (Naming) Request
# =================================================================
class NamingRequest(BaseModel):
    """
    Step 2: 네이밍 요청
    user_input: Step 2 Q&A 답변
    context: Step 1 진단 상세 정보
    """
    user_input: Dict[str, Any] = Field(
        ..., 
        description="Step 2 Q&A 답변 (answers.json의 step_2 내용)"
    )
    context: Dict[str, Any] = Field(
        ..., 
        description="""Step 1 진단 상세 정보
        {
          "interview": {
            "brand_direction": "...",
            "tone": "...",
            "keywords": [...],
            "perspectives": {...},
            "brand_essence": "...",
            "emotional_core": "...",
            "differentiation_point": "...",
            "target_persona": "...",
            "diagnosis_summary": "..."
          }
        }"""
    )

# =================================================================
# [Step 3] 컨셉 (Concept) Request
# =================================================================
class ConceptRequest(BaseModel):
    """
    Step 3: 컨셉 요청
    user_input: Step 3 Q&A 답변
    context: Step 1 진단 정보 + 선택된 네이밍 상세 정보
    """
    user_input: Dict[str, Any] = Field(
        ..., 
        description="Step 3 Q&A 답변 (answers.json의 step_3 내용)"
    )
    context: Dict[str, Any] = Field(
        ..., 
        description="""Step 1 진단 + 선택된 네이밍 상세 정보
        {
          "interview": {...},  // Step 1 진단 정보
          "naming": {          // FE가 선택한 네이밍 후보 상세 정보
            "id": 0,
            "brand_name": "...",
            "name_rationale": "...",
            "qa_analysis_summary": "...",
            "qa_keywords": [...]
          }
        }"""
    )

# =================================================================
# [Step 4] 스토리 (Story) Request
# =================================================================
class StoryRequest(BaseModel):
    """
    Step 4: 스토리 요청
    user_input: Step 4 Q&A 답변
    context: Step 1 진단 + 선택된 네이밍 + 선택된 컨셉 상세 정보
    """
    user_input: Dict[str, Any] = Field(
        ..., 
        description="Step 4 Q&A 답변 (answers.json의 step_4 내용)"
    )
    context: Dict[str, Any] = Field(
        ..., 
        description="""Step 1-3 누적 정보 (선택된 후보들만)
        {
          "interview": {...},  // Step 1 진단 정보
          "naming": {          // 선택된 네이밍 상세 정보
            "id": 0,
            "brand_name": "...",
            "name_rationale": "...",
            "qa_analysis_summary": "...",
            "qa_keywords": [...]
          },
          "concept": {         // 선택된 컨셉 상세 정보
            "id": 1,
            "concept_statement": "...",
            "concept_rationale": "...",
            "qa_analysis_summary": "...",
            "qa_keywords": [...],
            "brand_values": [...]
          }
        }"""
    )

# =================================================================
# [Step 5] 로고 (Logo) Request
# =================================================================
class LogoRequest(BaseModel):
    """
    Step 5: 로고 요청
    user_input: Step 5 Q&A 답변
    context: Step 1-4 누적 정보 (선택된 후보들만)
    """
    user_input: Dict[str, Any] = Field(
        ..., 
        description="Step 5 Q&A 답변 (answers.json의 step_5 내용)"
    )
    context: Dict[str, Any] = Field(
        ..., 
        description="""Step 1-4 누적 정보 (선택된 후보들만)
        {
          "interview": {...},  // Step 1 진단 정보
          "naming": {...},     // 선택된 네이밍 상세 정보
          "concept": {...},    // 선택된 컨셉 상세 정보
          "story": {           // 선택된 스토리 상세 정보
            "id": 2,
            "brand_story": "...",
            "story_rationale": "...",
            "qa_analysis_summary": "...",
            "qa_keywords": [...],
            "emotional_arc": "..."
          }
        }"""
    )
# =================================================================
# [Step 6] 앱 아이콘 (Icon) Request
# =================================================================
class IconRequest(BaseModel):
    """
    Step 6: 앱 아이콘 요청
    user_input: Step 6 Q&A 답변
    context: Step 1-5 누적 브랜드 자산 (Identity, Logo, Color 등)
    """
    user_input: Dict[str, Any] = Field(..., description="Step 6 Q&A 답변")
    context: Dict[str, Any] = Field(..., description="Step 1-5 누적 브랜드 자산")

# =================================================================
# [Step 7] 모델 (Model) Request
# =================================================================
class ModelRequest(BaseModel):
    """
    Step 7: 페르소나 모델 요청
    user_input: Step 7 Q&A 답변
    context: Step 1-5 누적 브랜드 자산
    """
    user_input: Dict[str, Any] = Field(..., description="Step 7 Q&A 답변")
    context: Dict[str, Any] = Field(..., description="Step 1-5 누적 브랜드 자산")

# =================================================================
# [Step 8] 제품 연출 (Staging) Request
# =================================================================
class StagingRequest(BaseModel):
    """
    Step 8: 제품 연출 요청
    user_input: Step 8 Q&A 답변
    context: Step 1-5 누적 브랜드 자산
    """
    user_input: Dict[str, Any] = Field(..., description="Step 8 Q&A 답변")
    context: Dict[str, Any] = Field(..., description="Step 1-5 누적 브랜드 자산")

# =================================================================
# [Step 9] 광고 (Ad) Request
# =================================================================
class AdRequest(BaseModel):
    """
    Step 9: 광고 포스터 요청
    user_input: Step 9 Q&A 답변
    context: Step 1-5 누적 브랜드 자산 (및 이전 마케팅 결과물 옵션)
    """
    user_input: Dict[str, Any] = Field(..., description="Step 9 Q&A 답변")
    context: Dict[str, Any] = Field(..., description="Step 1-5 누적 브랜드 자산")
