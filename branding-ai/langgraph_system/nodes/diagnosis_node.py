"""
Step 1: Diagnosis Node
초기 진단 단계 - 비즈니스 핵심 파악
"""
from langgraph_system.state import BrandConsultingState, get_cumulative_key
from langgraph_system.utils import get_openai_client, validate_step_input
from langgraph_system.prompts import GenerationPrompts
import json


def diagnosis_node(state: BrandConsultingState) -> BrandConsultingState:
    """
    Step 1: 초기 진단 노드 (Diagnosis)
    
    [Input]
    - step_1_qa: 사용자 응답 데이터
    
    [Process]
    - Business, User, Market 3가지 관점 분석
    - 종합 진단 요약, 핵심 키워드, 타겟 페르소나 추출
    
    [Output]
    - diagnosis_result: 전체 분석 결과 (JSON)
    - diagnosis_context: 다음 단계 전달용 핵심 데이터 Subset
    """
    print(f"\n{'='*60}")
    print(f"[Step 1: Diagnosis] 실행 시작")
    print(f"{'='*60}")
    
    # 1. 입력 검증
    step_1_qa = state.get("step_1_qa")
    if not validate_step_input(1, {"answers": step_1_qa} if step_1_qa else None):
        state["error_occurred"] = True
        state["error_message"] = "Step 1 Q&A 데이터가 없습니다."
        return state
    
    
    # 3. OpenAI 클라이언트 생성
    try:
        client = get_openai_client()
    except Exception as e:
        state["error_occurred"] = True
        state["error_message"] = f"OpenAI 클라이언트 생성 실패: {e}"
        return state
    
    # 4. 프롬프트 준비 (JSON 직접 전달)
    system_prompt = GenerationPrompts.DIAGNOSIS_SYSTEM
    user_prompt = GenerationPrompts.DIAGNOSIS_USER.format(
        qa_data_json=json.dumps(step_1_qa, ensure_ascii=False, indent=2)
    )
    
    # 5. GPT-5.1 호출
    try:
        print("[Step 1] GPT-5.1 비즈니스 진단 분석 중...")
        resp = client.chat.completions.create(
            model="gpt-5.1",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"}
        )
        analysis_data = json.loads(resp.choices[0].message.content)
        print("[Step 1] 분석 완료: 3가지 관점 및 핵심 요소 추출됨")
        
    except Exception as e:
        print(f"[Step 1] ❌ GPT-5.1 분석 실패: {e}")
        # 실패 시 기본값 (Fallback)
        analysis_data = {
            "summary": "분석 실패 (기본값)",
            "keywords": ["Error"],
            "persona": "Unknown",
            "perspectives": {},
            "brand_essence": "",
            "emotional_core": "",
            "differentiation_point": ""
        }
    
    # 6. 결과 구성
    # 6-1. Diagnosis Result (전체 저장용)
    diagnosis_output = {
        "summary": analysis_data.get("summary", ""),
        "keywords": analysis_data.get("keywords", []),
        "persona": analysis_data.get("persona", ""),
        "perspectives": analysis_data.get("perspectives", {}),
        "brand_essence": analysis_data.get("brand_essence", ""),
        "emotional_core": analysis_data.get("emotional_core", ""),
        "differentiation_point": analysis_data.get("differentiation_point", "")
    }
    
    diagnosis_result = {
        "qa": step_1_qa,
        "analysis": diagnosis_output
    }
    state["diagnosis_result"] = diagnosis_result
    
    # 6-2. Diagnosis Context (다음 단계 전달용 - 강화)
    diagnosis_context = {
        "diagnosis_summary": diagnosis_output["summary"],
        "core_keywords": diagnosis_output["keywords"],
        "target_persona": diagnosis_output["persona"],
        "perspectives": diagnosis_output["perspectives"],
        # 강화 항목
        "brand_essence": diagnosis_output["brand_essence"],
        "emotional_core": diagnosis_output["emotional_core"],
        "differentiation_point": diagnosis_output["differentiation_point"]
    }
    state["diagnosis_context"] = diagnosis_context
    state["step_1_analysis"] = diagnosis_output  # 기존 호환성 유지
    
    print(f"[Step 1] Context 설정 완료: {list(diagnosis_context.keys())}")

    # 6. DB 저장 (제거됨 - Pure Logic)
    # Backend에서 처리
    
    # 7. 상태 업데이트
    state["current_step"] = 2
    
    print(f"[Step 1] ✅ 완료")
    print(f"  - 키워드: {diagnosis_output['keywords']}")
    print(f"  - 페르소나: {diagnosis_output['persona']}")
    print(f"{'='*60}\n")
    
    return state
