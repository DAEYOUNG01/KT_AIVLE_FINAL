"""
Step 4: Story Node
브랜드 스토리 생성 단계 (Candidates 생성)
"""
from langgraph_system.state import BrandConsultingState
from langgraph_system.utils import get_openai_client, validate_step_input, flatten_context
from langgraph_system.prompts import GenerationPrompts
import json


def story_node(state: BrandConsultingState) -> BrandConsultingState:
    """
    Step 4: Story Node
    
    [입력 - Input]
    - diagnosis_context: Step 1 브랜드 진단 결과 (타겟 페르소나 등)
    - naming_context: Step 2 확정된 브랜드명 및 네이밍 전략
    - concept_context: Step 3 확정된 브랜드 컨셉 및 전략
    - step_4_qa: 사용자 Story 관련 답변 (JSON)
    
    [처리 - Process]
    - GPT-5.1를 활용하여 3가지 버전의 브랜드 스토리 후보를 생성합니다.
    - 각 후보는 서로 다른 톤앤매너(감성적, 기능적, 비전 중심 등)를 가집니다.
    
    [출력 - Output]
    - story_candidates: 3가지 스토리 후보 리스트
      (각 후보는 brand_story, story_rationale 포함)
    """
    print(f"\n{'='*60}")
    print(f"[Step 4: Story] 브랜드 스토리 생성 시작")
    print(f"{'='*60}")
    
    # 1. 입력 데이터 검증
    # 필수 Context가 누락되었는지 확인하여, 누락 시 에러 처리
    step_4_qa = state.get("step_4_qa")
    if not validate_step_input(4, {"answers": step_4_qa} if step_4_qa else None):
        error_msg = "Step 4 Q&A 데이터가 누락되었습니다."
        print(f"[Step 4] ❌ {error_msg}")
        state["error_occurred"] = True
        state["error_message"] = error_msg
        return state

    # Context 확인 (Naming, Concept, Diagnosis)
    naming_context = state.get("naming_context")
    concept_context = state.get("concept_context")
    diagnosis_context = state.get("diagnosis_context") # Persona 등 참조용 (없어도 에러는 아님, 기본값 사용)
    
    # [수정] Context Flattening (Backend 리스트 대응)
    if naming_context:
        naming_context = flatten_context(naming_context, step_4_qa)
    if concept_context:
        concept_context = flatten_context(concept_context, step_4_qa)
    
    # 핵심 선행 데이터 확인
    if not naming_context or not concept_context:
        error_msg = "필수 선행 데이터(Naming 또는 Concept Context)가 없습니다. 이전 단계가 정상적으로 완료되지 않았을 수 있습니다."
        print(f"[Step 4] ❌ {error_msg}")
        state["error_occurred"] = True
        state["error_message"] = error_msg
        return state

    
    # 3. OpenAI 클라이언트 초기화
    try:
        client = get_openai_client()
    except Exception as e:
        error_msg = f"OpenAI Client 초기화 실패: {str(e)}"
        print(f"[Step 4] ❌ {error_msg}")
        state["error_occurred"] = True
        state["error_message"] = error_msg
        return state

    
    feedback_section = ""  # 재생성 기능 제거됨

    # 4. 프롬프트 구성 (JSON 직접 전달)
    # 시스템 프롬프트: 역할 정의
    # 유저 프롬프트: 브랜드 맥락(Context), QA 데이터, 피드백 결합
    system_prompt = GenerationPrompts.STORY_SYSTEM
    
    # Diagnosis Context가 없는 경우 안전하게 처리
    target_persona = "Customers"
    if diagnosis_context and "target_persona" in diagnosis_context:
        target_persona = diagnosis_context["target_persona"]
        
    user_prompt = GenerationPrompts.STORY_USER.format(
        brand_name=naming_context.get("brand_name", "Brand Name"),
        concept_statement=concept_context.get("concept_statement", "Brand Concept"),
        target_persona=target_persona,
        qa_data_json=json.dumps(step_4_qa, ensure_ascii=False, indent=2),
        feedback_section=feedback_section
    )

    # 5. GPT-5.1 모델 호출 (Candidate 생성)
    try:
        print("[Step 4] GPT-5.1 모델에 브랜드 스토리 3종 생성을 요청합니다...")
        resp = client.chat.completions.create(
            model="gpt-5.1",  # 최신 모델 사용 권장
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"} # JSON 출력 강제
        )
        
        # 응답 파싱
        result_content = resp.choices[0].message.content
        result_data = json.loads(result_content)
        story_options = result_data.get("options", [])
        
        # 결과 개수 검증 (최소 3개 보장)
        if len(story_options) < 3:
            print(f"[Step 4] ⚠️ 생성된 스토리 개수가 부족합니다 ({len(story_options)}개). 더미 데이터를 추가합니다.")
            while len(story_options) < 3:
                story_options.append({
                    "brand_story": f"Story Option {len(story_options)+1} (생성 부족으로 인한 플레이스홀더)",
                    "story_rationale": "시스템에서 자동 추가된 항목입니다."
                })
        else:
            print(f"[Step 4] ✅ 스토리 후보 3개 생성 완료")

    except json.JSONDecodeError:
        error_msg = "AI 응답을 JSON으로 파싱하는데 실패했습니다."
        print(f"[Step 4] ❌ {error_msg}")
        state["error_occurred"] = True
        state["error_message"] = error_msg
        return state
        
    except Exception as e:
        error_msg = f"스토리 생성 중 예외가 발생했습니다: {str(e)}"
        print(f"[Step 4] ❌ {error_msg}")
        state["error_occurred"] = True
        state["error_message"] = error_msg
        # fallback: 에러 상황에서도 멈추지 않도록 더미 데이터 제공 (선택적)
        story_options = [
             {"brand_story": "Error: 생성 실패", "story_rationale": "시스템 에러가 발생했습니다."} 
             for _ in range(3)
        ]
        # 여기서는 return state 하지 않고 진행하여 에러 화면을 보여줄 수도 있음

    # 6. 결과 구조화 (Candidates 리스트 생성)
    # UI/Client에서 사용하기 편한 형태로 ID 부여 및 구조 변환
    candidates = []
    for i, option in enumerate(story_options[:3]): # 최대 3개까지만 사용
        candidates.append({
            "candidate_id": i,
            "output": option  # UI 렌더링에 필요한 핵심 데이터
        })
    
    # State 업데이트
    state["story_candidates"] = candidates
    state["current_step"] = 5  # 다음 단계(Step 5: Logo) 준비 또는 Human Review 진입
    
    # 결과 요약 출력
    print(f"\n[Step 4] 생성 결과 요약:")
    for c in candidates:
        story_preview = c['output'].get('brand_story', '')[:50].replace('\n', ' ')
        print(f"  - [후보 {c['candidate_id']}] {story_preview}...")
    
    print(f"\n{'='*60}\n")
    
    return state
