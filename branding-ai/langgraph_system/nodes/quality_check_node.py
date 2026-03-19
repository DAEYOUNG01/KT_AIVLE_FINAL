"""
Quality Check Node (Placeholder)
품질 검증 노드
"""
from langgraph_system.state import BrandConsultingState
from langgraph_system.prompts import VerificationPrompts

def quality_check_node(state: BrandConsultingState) -> BrandConsultingState:
    """
    Quality Check Node (Placeholder)
    
    현재는 무조건 Pass 처리합니다.
    단, 이전 단계에서 에러가 발생했는지 확인하여 에러 상태를 유지합니다.
    """
    print(f"\n{'='*60}")
    print(f"[Quality Check] 실행 (Placeholder)")
    print(f"{'='*60}")
    
    # 이전 노드에서 에러가 발생했다면 그대로 유지
    is_error = state.get("error_occurred", False)
    
    if is_error:
         print("[Quality Check] ⚠️ 이전 단계 에러 감지. Pass하지만 에러 상태는 유지합니다.")
    else:
         print("[Quality Check] ✅ 무조건 통과 (Pass)")
    
    return {
        "quality_check_passed": True,
        "error_occurred": is_error  # 에러 상태 유지
    }
