"""
FastAPI Request DTOs
FE -> BE -> AI 흐름에서 사용되는 요청 데이터 구조 정의
구조: user_input (해당 단계 Q&A) + context (이전 단계 누적 정보) + selected_candidate (FE가 선택한 후보 상세 정보)
"""
from pydantic import BaseModel, Field, root_validator
from typing import Dict, Any, Optional
import json

# 공통 Validator: 백엔드에서 보낸 JSON String Context를 Dict로 변환 & Flattened Input 처리
def parse_context_validator(cls, values):
    # 1. user_input이 없는 경우 (Legacy Flattened Payload)
    if 'user_input' not in values:
        if 'qa_answers' in values:
            # 1-1. qa_answers 호환
            values['user_input'] = values['qa_answers']
        else:
            # 1-2. RootFields -> user_input 매핑 (Context 제외한 나머지 필드)
            # context 키를 제외한 모든 데이터를 user_input으로 간주
            input_data = {k: v for k, v in values.items() if k != 'context'}
            # 빈 데이터가 아니면 할당
            if input_data:
                values['user_input'] = input_data
    
    # 2. Context String Parsing & Key Normalization (Lowercase)
    if 'context' in values:
        ctx = values.get('context', {})
        new_ctx = {}
        
        if isinstance(ctx, dict):
            for k, v in ctx.items():
                # Key Normalization: (e.g. "NAMING" -> "naming")
                norm_key = k.lower()
                
                # Value Parsing (JSON String -> Dict/List)
                parsed_v = v
                if isinstance(v, str):
                    try:
                        if v.strip().startswith('{') or v.strip().startswith('['):
                            parsed_v = json.loads(v)
                    except (json.JSONDecodeError, TypeError):
                        pass
                
                new_ctx[norm_key] = parsed_v
                
            values['context'] = new_ctx
    return values

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
    _validator = root_validator(pre=True, allow_reuse=True)(parse_context_validator)

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
    _validator = root_validator(pre=True, allow_reuse=True)(parse_context_validator)

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
    _validator = root_validator(pre=True, allow_reuse=True)(parse_context_validator)

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
    _validator = root_validator(pre=True, allow_reuse=True)(parse_context_validator)

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
    _validator = root_validator(pre=True, allow_reuse=True)(parse_context_validator)