"""
Brand Consulting API Router
FE 요청을 받아 LangGraph를 실행하고 result + state_context 형식으로 응답
Response: 3개 후보 + 각 후보 상세 정보
Request: FE가 선택한 후보 상세 정보를 context에 포함하여 전달
"""
from fastapi import APIRouter, HTTPException
from api.schemas.request import (
    DiagnosisRequest, NamingRequest, ConceptRequest, StoryRequest, LogoRequest
)
from api.schemas.response import (
    DiagnosisResponse, NamingResponse, ConceptResponse, StoryResponse, LogoResponse
)
from langgraph_system.state import BrandConsultingState
from langgraph_system.graph import create_info_graph
import os

router = APIRouter()

# LangGraph 초기화
print("\n[System] LangGraph Workflow Loading...")
workflow_app = create_info_graph()
print("[System] LangGraph Workflow Loaded Successfully.\n")

# output_id 생성 함수
def get_next_output_id():
    """Test/outputs/ 폴더에서 다음 output 번호를 찾아 반환"""
    outputs_dir = os.path.join("Test", "outputs")
    os.makedirs(outputs_dir, exist_ok=True)
    
    # 기존 output 폴더들 찾기
    existing_outputs = []
    for folder in os.listdir(outputs_dir):
        if folder.startswith("output_") and os.path.isdir(os.path.join(outputs_dir, folder)):
            try:
                num = int(folder.split("_")[1])
                existing_outputs.append(num)
            except:
                pass
    
    # 다음 번호 결정
    next_num = max(existing_outputs) + 1 if existing_outputs else 1
    return f"output_{next_num:02d}"  # output_01, output_02, ...

# =================================================================
# [Step 1] 진단 (Diagnosis)
# =================================================================
@router.post("/brands/interview", response_model=DiagnosisResponse)
async def create_diagnosis(request: DiagnosisRequest):
    """
    Step 1: 진단 (Backend Path: /brands/interview)
    Input: Q&A 답변
    Output: 진단 요약 (result) + 진단 상세 정보 (state_context)
    """
    output_id = get_next_output_id()
    
    state = BrandConsultingState(
        output_id=output_id,
        current_step=1,
        step_1_qa=request.user_input
    )
    
    try:
        result_state = workflow_app.invoke(state)
        
        if result_state.get("error_occurred"):
            raise HTTPException(status_code=500, detail=result_state.get("error_message"))
        
        diagnosis_result = result_state.get("diagnosis_result", {})
        analysis = diagnosis_result.get("analysis", {})
        diagnosis_context = result_state.get("diagnosis_context", {})
        
        # result: 사용자 표시용 (DB 저장)
        result = {
            "summary": analysis.get("summary", ""),
            "analysis": "브랜드 방향성 분석 완료",
            "key_insights": f"핵심 키워드: {', '.join(analysis.get('keywords', [])[:3])}"
        }
        
        # state_context: Step 2 전달용 (진단 상세 정보)
        # FE는 이 output_id를 저장했다가 Step 2 요청 시 보내주어야 함
        state_context = {
            "output_id": output_id,
            "brand_direction": analysis.get("summary", "")[:100],
            "tone": diagnosis_context.get("emotional_core", ""),
            "keywords": analysis.get("keywords", []),
            "perspectives": analysis.get("perspectives", {}),
            "brand_essence": diagnosis_context.get("brand_essence", ""),
            "emotional_core": diagnosis_context.get("emotional_core", ""),
            "differentiation_point": diagnosis_context.get("differentiation_point", ""),
            "target_persona": analysis.get("persona", ""),
            "diagnosis_summary": analysis.get("summary", "")
        }
        
        return DiagnosisResponse(result=result, state_context=state_context)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"진단 실패: {str(e)}")

# =================================================================
# [Step 2] 네이밍 (Naming)
# =================================================================
@router.post("/brands/naming", response_model=NamingResponse)
async def create_naming(request: NamingRequest):
    """
    Step 2: 네이밍 (Backend Path: /brands/naming)
    Input: Q&A 답변 + Step 1 진단 정보
    Output: 3개 네이밍 후보 (result) + 각 후보 상세 정보 (state_context)
    """
    interview_context = request.context.get("interview", {})
    
    # [변경] Context에서 output_id 확인 (없으면 새로 생성)
    output_id = interview_context.get("output_id") or get_next_output_id()
    
    state = BrandConsultingState(
        output_id=output_id,
        current_step=2,
        diagnosis_context=interview_context,
        step_2_qa=request.user_input
    )
    
    try:
        result_state = workflow_app.invoke(state)
        
        if result_state.get("error_occurred"):
            raise HTTPException(status_code=500, detail=result_state.get("error_message"))
        
        candidates_data = result_state.get("naming_candidates", [])
        
        # result: 사용자 표시용 (name1, name2, name3)
        result_data = {}
        for i, cand in enumerate(candidates_data[:3]):
            result_data[f"name{i+1}"] = cand["output"]["brand_name"]
        
        # state_context: 각 후보의 상세 정보
        candidates_full = []
        for i, cand in enumerate(candidates_data[:3]):
            output = cand["output"]
            candidates_full.append({
                "id": i,
                "brand_name": output.get("brand_name", ""),
                "name_rationale": output.get("name_rationale", ""),
                "qa_analysis_summary": output.get("qa_analysis_summary", ""),
                "qa_keywords": output.get("qa_keywords", [])
            })
        
        state_context = {
            "candidates": candidates_full
        }
        
        return NamingResponse(result=result_data, state_context=state_context)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"네이밍 생성 실패: {str(e)}")

# =================================================================
# [Step 3] 컨셉 (Concept)
# =================================================================
@router.post("/brands/concept", response_model=ConceptResponse)
async def create_concept(request: ConceptRequest):
    """
    Step 3: 컨셉 (Backend Path: /brands/concept)
    Input: Q&A 답변 + Step 1 진단 정보 + 선택된 네이밍 상세 정보
    Output: 3개 컨셉 후보 (result) + 각 후보 상세 정보 (state_context)
    """
    interview_context = request.context.get("interview", {})
    naming_context = request.context.get("naming", {})  # FE가 선택한 네이밍 상세 정보
    
    # [변경] Context에서 output_id 추출
    output_id = interview_context.get("output_id") or get_next_output_id()
    
    state = BrandConsultingState(
        output_id=output_id,
        current_step=3,
        diagnosis_context=interview_context,
        naming_context=naming_context,
        step_3_qa=request.user_input
    )
    
    try:
        config = {"configurable": {"thread_id": output_id}}
        result_state = workflow_app.invoke(state, config)
        
        if result_state.get("error_occurred"):
            raise HTTPException(status_code=500, detail=result_state.get("error_message"))
        
        candidates_data = result_state.get("concept_candidates", [])
        
        # result: 사용자 표시용
        result = {}
        for i, cand in enumerate(candidates_data[:3]):
            result[f"concept{i+1}"] = cand["output"]["concept_statement"]
        
        # state_context: 각 후보의 상세 정보
        candidates_full = []
        for i, cand in enumerate(candidates_data[:3]):
            output = cand["output"]
            candidates_full.append({
                "id": i,
                "concept_statement": output.get("concept_statement", ""),
                "concept_rationale": output.get("concept_rationale", ""),
                "qa_analysis_summary": output.get("qa_analysis_summary", ""),
                "qa_keywords": output.get("qa_keywords", []),
                "brand_values": output.get("brand_values", [])
            })
        
        state_context = {
            "candidates": candidates_full
        }
        
        return ConceptResponse(result=result, state_context=state_context)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"컨셉 생성 실패: {str(e)}")

# =================================================================
# [Step 4] 스토리 (Story)
# =================================================================
@router.post("/brands/story", response_model=StoryResponse)
async def create_story(request: StoryRequest):
    """
    Step 4: 스토리 (Backend Path: /brands/story)
    Input: Q&A 답변 + Step 1-3 누적 정보 (선택된 후보들만)
    Output: 3개 스토리 후보 (result) + 각 후보 상세 정보 (state_context)
    """
    interview_context = request.context.get("interview", {})
    naming_context = request.context.get("naming", {})
    concept_context = request.context.get("concept", {})
    
    # [변경] Context에서 output_id 추출
    output_id = interview_context.get("output_id") or get_next_output_id()
    
    state = BrandConsultingState(
        output_id=output_id,
        current_step=4,
        diagnosis_context=interview_context,
        naming_context=naming_context,
        concept_context=concept_context,
        step_4_qa=request.user_input
    )
    
    try:
        config = {"configurable": {"thread_id": output_id}}
        result_state = workflow_app.invoke(state, config)
        
        if result_state.get("error_occurred"):
            raise HTTPException(status_code=500, detail=result_state.get("error_message"))
        
        candidates_data = result_state.get("story_candidates", [])
        
        # result: 사용자 표시용
        result = {}
        for i, cand in enumerate(candidates_data[:3]):
            result[f"story{i+1}"] = cand["output"]["brand_story"]
        
        # state_context: 각 후보의 상세 정보
        candidates_full = []
        for i, cand in enumerate(candidates_data[:3]):
            output = cand["output"]
            candidates_full.append({
                "id": i,
                "brand_story": output.get("brand_story", ""),
                "story_rationale": output.get("story_rationale", ""),
                "qa_analysis_summary": output.get("qa_analysis_summary", ""),
                "qa_keywords": output.get("qa_keywords", []),
                "emotional_arc": output.get("emotional_arc", "")
            })
        
        state_context = {
            "candidates": candidates_full
        }
        
        return StoryResponse(result=result, state_context=state_context)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"스토리 생성 실패: {str(e)}")

# =================================================================
# [Step 5] 로고 (Logo)
# =================================================================
@router.post("/brands/logo", response_model=LogoResponse)
async def create_logo(request: LogoRequest):
    """
    Step 5: 로고 (최종 단계)
    Input: Q&A 답변 + Step 1-4 누적 정보 (선택된 후보들만)
    Output: 3개 로고 URL (result) + 각 후보 상세 정보 (state_context)
    """
    interview_context = request.context.get("interview", {})
    naming_context = request.context.get("naming", {})
    concept_context = request.context.get("concept", {})
    story_context = request.context.get("story", {})
    
    # [변경] Context에서 output_id 추출
    output_id = interview_context.get("output_id") or get_next_output_id()
    
    state = BrandConsultingState(
        output_id=output_id,
        current_step=5,
        diagnosis_context=interview_context,
        naming_context=naming_context,
        concept_context=concept_context,
        story_context=story_context,
        step_5_qa=request.user_input
    )
    
    try:
        config = {"configurable": {"thread_id": output_id}}
        result_state = workflow_app.invoke(state, config)
        
        if result_state.get("error_occurred"):
            raise HTTPException(status_code=500, detail=result_state.get("error_message"))
        
        candidates_data = result_state.get("logo_candidates", [])
        
        # result: 사용자 표시용 (logo URL만)
        result = {}
        for i, cand in enumerate(candidates_data[:3]):
            result[f"logo{i+1}_url"] = cand["output"]["logo_image_url"]
        
        # state_context: 각 후보의 상세 정보
        candidates_full = []
        for i, cand in enumerate(candidates_data[:3]):
            output = cand["output"]
            candidates_full.append({
                "id": i,
                "logo_image_url": output.get("logo_image_url", ""),
                "logo_concept": output.get("logo_concept", ""),
                "logo_rationale": output.get("logo_rationale", ""),
                "qa_analysis_summary": output.get("qa_analysis_summary", ""),
                "qa_keywords": output.get("qa_keywords", []),
                "color_palette": output.get("color_palette", [])
            })
        
        state_context = {
            "candidates": candidates_full
        }
        
        return LogoResponse(result=result, state_context=state_context)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"로고 생성 실패: {str(e)}")