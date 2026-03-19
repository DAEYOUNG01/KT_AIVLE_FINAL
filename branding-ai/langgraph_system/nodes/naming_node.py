"""
Step 2: Naming Node
브랜드명 생성 단계 (Candidates 생성)
"""
from langgraph_system.state import BrandConsultingState
from langgraph_system.utils import get_openai_client, validate_step_input
from langgraph_system.prompts import GenerationPrompts
import json


def naming_node(state: BrandConsultingState) -> BrandConsultingState:
    """
    Step 2: Naming Node
    
    [입력 - Input]
    - diagnosis_context: Step 1 브랜드 진단 결과 (핵심 키워드, 타겟 페르소나, 진단 요약 등)
    - step_2_qa: 사용자 Naming 관련 질문에 대한 답변 (JSON)
    
    [처리 - Process]
    - GPT-5.1를 활용하여 3가지 브랜드 네이밍 후보를 생성합니다.
    - 각 후보는 이름, 선정 이유(Rationale), 유사 대안(Alternatives)을 포함합니다.
    
    [출력 - Output]
    - naming_candidates: 3가지 브랜드 네이밍 후보 리스트
      (각 후보는 brand_name, name_rationale, alternatives 포함)
    """
    print(f"\n{'='*60}")
    print(f"[Step 2: Naming] 브랜드 네이밍 생성 시작")
    print(f"{'='*60}")
    
    # 1. 입력 데이터 검증
    step_2_qa = state.get("step_2_qa")
    if not validate_step_input(2, {"answers": step_2_qa} if step_2_qa else None):
        error_msg = "Step 2 Q&A 데이터가 누락되었습니다."
        print(f"[Step 2] ❌ {error_msg}")
        state["error_occurred"] = True
        state["error_message"] = error_msg
        return state

    # Diagnosis Context 확인
    diagnosis_context = state.get("diagnosis_context")
    
    # Context가 없는 경우 복구 시도 (Step 1 완료 후 저장된 result에서)
    if not diagnosis_context:
        print(f"[Step 2] ⚠️ diagnosis_context가 State에 없습니다. diagnosis_result에서 복구를 시도합니다...")
        
        diagnosis_result = state.get("diagnosis_result")
        if diagnosis_result and "analysis" in diagnosis_result:
             analysis = diagnosis_result["analysis"]
             diagnosis_context = {
                "diagnosis_summary": analysis.get("summary", ""),
                "core_keywords": analysis.get("keywords", []),
                "target_persona": analysis.get("persona", ""),
                "perspectives": analysis.get("perspectives", {})
             }
             state["diagnosis_context"] = diagnosis_context
             print(f"[Step 2] ✅ Context 복구에 성공했습니다.")
        else:
            error_msg = "필수 선행 데이터(Step 1 Diagnosis)가 없습니다. Step 1이 정상적으로 완료되었는지 확인해주세요."
            print(f"[Step 2] ❌ {error_msg}")
            
            # 디버깅: 현재 State 키 출력
            print(f"[Step 2] 🔍 현재 State Keys: {list(state.keys())}")
            
            state["error_occurred"] = True
            state["error_message"] = error_msg
            return state
    
    
    # 3. OpenAI 클라이언트 초기화
    try:
        client = get_openai_client()
    except Exception as e:
        error_msg = f"OpenAI Client 초기화 실패: {str(e)}"
        print(f"[Step 2] ❌ {error_msg}")
        state["error_occurred"] = True
        state["error_message"] = error_msg
        return state

    # 4. 프롬프트 구성 (JSON 직접 전달)
    feedback_section = ""  # 재생성 기능 제거됨

    # 5. 프롬프트 생성
    system_prompt = GenerationPrompts.NAMING_SYSTEM
    user_prompt = GenerationPrompts.NAMING_USER.format(
        diagnosis_summary=diagnosis_context.get("diagnosis_summary", ""),
        core_keywords=str(diagnosis_context.get("core_keywords", [])),
        target_persona=diagnosis_context.get("target_persona", ""),
        qa_data_json=json.dumps(step_2_qa, ensure_ascii=False, indent=2),
        feedback_section=feedback_section
    )

    # 5. GPT-5.1 모델 호출 (후보 생성)
    try:
        print("[Step 2] GPT-5.1 모델에 브랜드 네이밍 후보 3종 생성을 요청합니다...")
        resp = client.chat.completions.create(
            model="gpt-5.1",  # 최신 모델 사용
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"}
        )
        result_data = json.loads(resp.choices[0].message.content)
        naming_options = result_data.get("options", [])
        
        # 결과 개수 검증 (3개 미만 시 처리)
        if len(naming_options) < 3:
            print(f"[Step 2] ⚠️ 생성된 후보가 3개 미만입니다 ({len(naming_options)}개). 더미 데이터를 추가합니다.")
            while len(naming_options) < 3:
                naming_options.append({
                    "brand_name": f"Option {len(naming_options)+1} (자동 추가됨)",
                    "name_rationale": "AI 생성 데이터 부족으로 인한 플레이스홀더"
                })
        else:
            print(f"[Step 2] ✅ 네이밍 후보 3개 생성 완료")
        
    except json.JSONDecodeError:
        error_msg = "AI 응답을 JSON으로 파싱하는데 실패했습니다."
        print(f"[Step 2] ❌ {error_msg}")
        state["error_occurred"] = True
        state["error_message"] = error_msg
        return state

    except Exception as e:
        error_msg = f"네이밍 생성 중 예외 발생: {str(e)}"
        print(f"[Step 2] ❌ {error_msg}")
        # 예외 발생 시 에러 메시지를 담은 더미 데이터 생성 (Process 중단 방지 옵션)
        naming_options = [
             {"brand_name": "Error 1", "name_rationale": f"Generation Failed: {str(e)}"},
             {"brand_name": "Error 2", "name_rationale": "Generation Failed"},
             {"brand_name": "Error 3", "name_rationale": "Generation Failed"}
        ]

    # 6. Candidates 구조 변환
    # UI/Client에서 사용하기 편한 형태로 변환
    candidates = []
    for i, option in enumerate(naming_options[:3]):
        candidates.append({
            "candidate_id": i,
            "output": option  # 핵심 데이터
        })
    
    # State 업데이트
    state["naming_candidates"] = candidates
    state["current_step"] = 3  # 다음 단계: Step 3 (Concept) 진행을 위한 상태, 실제로는 Human Review로 Interrupt 됨
    
    # 결과 요약 출력
    print(f"\n[Step 2] 생성 결과 요약:")
    for c in candidates:
        name = c['output'].get('brand_name')
        print(f"  - [후보 {c['candidate_id']}] {name}")
    print(f"{'='*60}\n")
    
    return state
