"""
Step 3: Concept Node
브랜드 컨셉 생성 단계 (Candidates 생성)
"""
from langgraph_system.state import BrandConsultingState
from langgraph_system.utils import get_openai_client, validate_step_input, flatten_context
from langgraph_system.prompts import GenerationPrompts
import json


def concept_node(state: BrandConsultingState) -> BrandConsultingState:
    """
    Step 3: Concept Node
    
    [Input]
    - diagnosis_context: Step 1 진단 Context
    - naming_context: Step 2에서 선택된 브랜드명 Context
    - step_3_qa: 사용자 Concept 관련 Q&A
    
    [Output]
    - concept_candidates: 3가지 컨셉 후보
      (concept_statement, concept_rationale, brand_values)
    """
    print(f"\n{'='*60}")
    print(f"[Step 3: Concept] 실행 시작")
    print(f"{'='*60}")
    
    # 1. 입력 검증
    step_3_qa = state.get("step_3_qa")
    if not validate_step_input(3, {"answers": step_3_qa} if step_3_qa else None):
        state["error_occurred"] = True
        state["error_message"] = "Step 3 Q&A 데이터가 없습니다."
        return state

    # Context 확인
    diagnosis_context = state.get("diagnosis_context")
    naming_context = state.get("naming_context")
    
    # [수정] Naming Context Flattening (Backend 리스트 대응)
    if naming_context:
        naming_context = flatten_context(naming_context, step_3_qa)
    
    # 방어 코드: Context가 dict가 아니면 빈 dict로 초기화
    if not isinstance(diagnosis_context, dict):
        diagnosis_context = {}
    if not isinstance(naming_context, dict):
        naming_context = {}
    
    # 필수 데이터 확인 (brand_name 없으면 진행 불가)
    if not diagnosis_context or not naming_context.get("brand_name"):
        state["error_occurred"] = True
        state["error_message"] = "필수 Context (Diagnosis or Brand Name) 누락"
        return state

    
    # 3. OpenAI 클라이언트
    try:
        client = get_openai_client()
    except Exception as e:
        print(f"[ERROR] Client Init Failed: {e}")
        state["error_occurred"] = True
        state["error_message"] = f"Client Error: {e}"
        return state

    # 4. 프롬프트 구성 (JSON 직접 전달)
    feedback_section = ""  # 재생성 기능 제거됨

    # 5. 프롬프트 생성
    try:
        system_prompt = GenerationPrompts.CONCEPT_SYSTEM
        user_prompt = GenerationPrompts.CONCEPT_USER.format(
            diagnosis_summary=diagnosis_context.get("diagnosis_summary", "No diagnosis summary"),
            brand_name=naming_context.get("brand_name", "Brand"),
            name_rationale=naming_context.get("name_rationale", ""),
            qa_data_json=json.dumps(step_3_qa, ensure_ascii=False, indent=2),
            feedback_section=feedback_section
        )
    except Exception as e:
        print(f"[ERROR] Prompt Formatting Failed: {e}")
        state["error_occurred"] = True
        state["error_message"] = f"Prompt Error: {e}"
        return state

    # 5. GPT-5.1생성
    try:
        print("[Step 3] GPT-5.1 컨셉 후보 3개 생성 중...")
        resp = client.chat.completions.create(
            model="gpt-5.1",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"}
        )
        result_data = json.loads(resp.choices[0].message.content)
        concept_options = result_data.get("options", [])
        
        if len(concept_options) < 3:
            print(f"[Step 3] ⚠️ 부족한 후보 수 자동 보완")
            while len(concept_options) < 3:
                concept_options.append({
                    "concept_statement": f"Concept {len(concept_options)+1}",
                    "concept_rationale": "Generated as filler"
                })

    except Exception as e:
        print(f"[Step 3] ❌ 생성 실패: {e}")
        concept_options = [
             {"concept_statement": "Error", "concept_rationale": "Failed"} 
             for _ in range(3)
        ]

    # 6. Candidates 구조 변환
    candidates = []
    for i, option in enumerate(concept_options[:3]):
        candidates.append({
            "candidate_id": i,
            "output": option  # 핵심 데이터
        })
    
    state["concept_candidates"] = candidates
    state["current_step"] = 4
    
    print(f"[Step 3] ✅ 후보 생성 완료 ({len(candidates)}개)")
    for c in candidates:
        print(f"  - {c['output'].get('concept_statement', '')[:30]}...")
    print(f"{'='*60}\n")
    
    return state
