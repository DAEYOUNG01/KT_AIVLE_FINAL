"""
마케팅 API 라우터
Step 6~9 (아이콘, 모델, 연출, 광고) 엔드포인트
FE -> BE -> AI 흐름: Request Body에 'context' (Step 1-5 자산)와 'user_input' (설문 답변)을 포함하여 전달
"""
from fastapi import APIRouter, HTTPException
from api.schemas.request import (
    IconRequest, ModelRequest, StagingRequest, AdRequest
)
from api.schemas.response import (
    LogoResponse # 이미지 출력용 구조 재사용 (또는 일반적인 구조 사용 가능)
)
# 마케팅 결과물은 구조가 조금씩 다르므로 일반적인 Dict 응답 사용
from typing import Dict, Any

from langgraph_system.state import BrandConsultingState
# 노드 로직을 직접 사용하여 호출 (Graph를 거치지 않고 단일 단계 실행)
from langgraph_system.nodes.marketing_nodes import (
    icon_node, model_node, staging_node, ad_node
)
import os

router = APIRouter()

# 요청 데이터로부터 State를 재구성하는 헬퍼 함수 (필요 시 사용)
def create_state_from_request(request_data, step_num: int):
    # BE에서 전달받은 Context와 사용자 답변
    context = request_data.context
    answers = request_data.user_input
    
    # State에 marketing_context를 담아서 반환
    # 노드 함수들이 이 marketing_context를 우선적으로 확인하도록 수정되었음
    return BrandConsultingState(
        brand_id="api_request", # 임시 ID
        current_step=step_num,
        marketing_context=context, # 전달받은 컨텍스트 저장
        marketing_answers={f"step_{step_num}": answers},
        step_6_output={},
        step_7_output={},
        step_8_output={},
        step_9_output={}
    )

# =================================================================
# [Step 6] 앱 아이콘 (Icon)
# =================================================================
@router.post("/step6/icon")
async def create_icon(request: IconRequest) -> Dict[str, Any]:
    print("=== [API] Step 6 아이콘 생성 요청 (Icon Request) ===")
    
    # State 구성
    # 참고: nodes.py는 파일 로드보다 state["marketing_context"]를 우선 사용하도록 수정됨
    
    state = BrandConsultingState(
        brand_id="api_req",
        current_step=6,
        marketing_context=request.context, # 노드에서 사용할 컨텍스트
        marketing_answers={"step_6": request.user_input},
        step_6_output={}
    )
    
    try:
        # 노드 직접 실행 (단일 단계이므로 빠르고 간편함)
        result_state = icon_node(state)
        output = result_state.get("step_6_output", {})
        
        return output
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"아이콘 생성 실패: {str(e)}")

# =================================================================
# [Step 7] 모델 (Model)
# =================================================================
@router.post("/step7/model")
async def create_model(request: ModelRequest) -> Dict[str, Any]:
    print("=== [API] Step 7 모델 생성 요청 (Model Request) ===")
    
    state = BrandConsultingState(
        brand_id="api_req",
        current_step=7,
        marketing_context=request.context,
        marketing_answers={"step_7": request.user_input},
        step_7_output={}
    )
    
    try:
        result_state = model_node(state)
        output = result_state.get("step_7_output", {})
        return output
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"모델 생성 실패: {str(e)}")

# =================================================================
# [Step 8] 제품 연출 (Staging)
# =================================================================
@router.post("/step8/staging")
async def create_staging(request: StagingRequest) -> Dict[str, Any]:
    print("=== [API] Step 8 제품 연출 생성 요청 (Staging Request) ===")
    
    state = BrandConsultingState(
        brand_id="api_req",
        current_step=8,
        marketing_context=request.context,
        marketing_answers={"step_8": request.user_input},
        step_8_output={}
    )
    
    try:
        result_state = staging_node(state)
        output = result_state.get("step_8_output", {})
        return output
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"제품 연출 생성 실패: {str(e)}")

# =================================================================
# [Step 9] 광고 포스터 (Ad)
# =================================================================
@router.post("/step9/ad")
async def create_ad(request: AdRequest) -> Dict[str, Any]:
    print("=== [API] Step 9 광고 포스터 생성 요청 (Ad Request) ===")
    
    state = BrandConsultingState(
        brand_id="api_req",
        current_step=9,
        marketing_context=request.context,
        marketing_answers={"step_9": request.user_input},
        step_9_output={}
    )
    
    try:
        result_state = ad_node(state)
        output = result_state.get("step_9_output", {})
        return output
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"광고 생성 실패: {str(e)}")
