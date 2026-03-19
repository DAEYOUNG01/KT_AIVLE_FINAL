"""
Human Review Node
사용자의 검토 및 승인을 처리하는 노드입니다.
- 선택(0, 1, 2): 3개 후보 중 1개 선택
"""
from langgraph_system.state import BrandConsultingState

def human_review_node(state: BrandConsultingState) -> BrandConsultingState:
    """
    Human Review Node - 3개 후보 선택 처리 및 Core Context 추출
    
    1. 사용자 선택 처리 (0, 1, 2)
    2. 선택된 결과(Full) 저장 (result_key)
    3. **다음 단계를 위한 핵심 데이터(Core Context) 추출 및 저장**
    """
    
    # 사용자 입력 (main.py에서 update_state로 주입됨)
    user_choice = state.get("user_choice")
    current_step = state.get("current_step")
    
    print(f"\n[Human Review] 사용자 선택 처리: {user_choice}")
    
    # 후보 선택 (0, 1, 2)
    try:
        selected_idx = int(user_choice)
        if selected_idx not in [0, 1, 2]:
            raise ValueError("Invalid index")
    except (ValueError, TypeError):
        print(f"[Human Review] ❌ 잘못된 선택: {user_choice}")
        state["error_occurred"] = True
        state["error_message"] = f"잘못된 선택값: {user_choice}"
        return state
    
    # 3. 단계별 매핑 정보 (Candidates Key, Result Key, Context Key)
    # Context Key: 다음 단계로 핵심만 전달하기 위한 키
    step_mappings = {
        3: ("naming_candidates", "naming_result", "naming_context"),
        4: ("concept_candidates", "concept_result", "concept_context"),
        5: ("story_candidates", "story_result", "story_context"),
        6: ("logo_candidates", "logo_result", "logo_context")
    }
    
    # Step 1은 후보가 없으므로 매핑 없음 (Diagnosis는 Node 내부에서 이미 Context 생성함)
    if current_step not in step_mappings:
        print(f"[Human Review] ⚠️ Step {current_step}은 후보 선택 대상이 아닙니다.")
        return {
            "quality_check_passed": True,
            "quality_check_passed": True,
            "user_choice": None
        }
    
    candidates_key, result_key, context_key = step_mappings[current_step]
    candidates = state.get(candidates_key, [])
    
    # 4. 후보 유효성 검증
    if not candidates or selected_idx >= len(candidates):
        print(f"[Human Review] ❌ 후보가 없거나 인덱스 초과 (max: {len(candidates)-1})")
        state["error_occurred"] = True
        state["error_message"] = "후보 데이터가 없거나 인덱스가 범위를 초과했습니다."
        return state
    
    
    # 5. 선택된 결과 저장 (Full Data)
    selected = candidates[selected_idx]
    final_result = {
        "analysis": selected.get("analysis", {}),
        "output": selected.get("output", {})
    }
    
    # 6. Core Context 추출 Logic
    # 전체 데이터가 아닌, 다음 단계에 꼭 필요한 '핵심 필드'만 추출해서 context_key에 저장
    output_data = final_result["output"]
    core_context = {}

    if context_key == "naming_context":
        core_context = {
            "brand_name": output_data.get("brand_name"),
            "name_rationale": output_data.get("name_rationale")
        }
    elif context_key == "concept_context":
        core_context = {
            "concept_statement": output_data.get("concept_statement"),
            "concept_rationale": output_data.get("concept_rationale")
        }
    elif context_key == "story_context":
        core_context = {
            "brand_story": output_data.get("brand_story"),
            "story_rationale": output_data.get("story_rationale")
        }
    elif context_key == "logo_context":
        # Logo는 마지막 단계라 명시적 다음 단계는 없지만, 일관성 유지
        core_context = {
            "logo_image_url": output_data.get("logo_image_url"), # 나중에 채워짐
            "logo_rationale": output_data.get("logo_rationale")
        }

    print(f"\n[Human Review] ✅ 선택 완료: 후보 {selected_idx}")
    print(f"[Human Review] Full Result 저장 -> {result_key}")
    print(f"[Human Review] Core Context 저장 -> {context_key}: {list(core_context.keys())}")
    
    return {
        result_key: final_result,
        context_key: core_context,      # 핵심 데이터 별도 저장
        # index_key: selected_idx,      # 인덱스는 굳이 State에 유지 안 해도 됨 (선택된 결과가 있으므로)
        "quality_check_passed": True,
        "user_choice": None
    }
