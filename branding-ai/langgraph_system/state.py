"""
LangGraph State 정의
State 중심 아키텍처 - RAG Context는 State로만 관리
"""
from typing import TypedDict, Optional, Dict, Any, List


class BrandConsultingState(TypedDict, total=False):
    """
    브랜드 컨설팅 LangGraph State
    
    주의: total=False로 설정하여 모든 필드를 선택적으로 만듦
    이를 통해 단계별로 State를 점진적으로 채울 수 있음
    """
    
    process_id: str  # Internal LangGraph Thread ID (UUID)
    output_id: str
    current_step: int
    
    # ========== 각 단계 Q&A 입력 ==========
    step_1_qa: Optional[Dict[str, Any]]  # Diagnosis
    step_2_qa: Optional[Dict[str, Any]]  # Naming
    step_3_qa: Optional[Dict[str, Any]]  # Concept
    step_4_qa: Optional[Dict[str, Any]]  # Story
    step_5_qa: Optional[Dict[str, Any]]  # Logo
    
    # ========== 단계별 Q&A 분석 (개별) ==========
    step_1_analysis: Optional[Dict[str, Any]]
    step_2_analysis: Optional[Dict[str, Any]]
    step_3_analysis: Optional[Dict[str, Any]]
    step_4_analysis: Optional[Dict[str, Any]]
    step_5_analysis: Optional[Dict[str, Any]]
    
    # ========== 누적 Q&A 분석 (RAG Context) ==========
    # State로만 관리, DB 저장 X
    cumulative_qa_analysis: Optional[Dict[str, Any]]
    # {
    #   "step_1": {...},
    #   "step_1_2": {...},
    #   "step_1_2_3": {...},
    #   "step_1_2_3_4": {...},
    #   "step_1_2_3_4_5": {...}  # 브랜드 완성
    # }
    
    # ========== 최종 결과물 (선택된 1개) ==========
    # State 저장: 모든 단계 {"analysis": {...}, "output": {...}}
    # DB 저장: Step 1만 {"qa": {...}, "analysis": {...}}, Steps 2-5는 output만
    diagnosis_result: Optional[Dict[str, Any]]  # Step 1: 1개만 (후보 없음)
    naming_result: Optional[Dict[str, Any]]     # Step 2-5: 선택된 1개
    concept_result: Optional[Dict[str, Any]]
    story_result: Optional[Dict[str, Any]]
    logo_result: Optional[Dict[str, Any]]
    
    # ========== 단계별 Core Context (다음 단계 전달용) ==========
    # 각 단계에서 생성되어 다음 단계의 프롬프트 구성에 사용됨
    diagnosis_context: Optional[Dict[str, Any]] # Step 1 -> Step 2
    naming_context: Optional[Dict[str, Any]]    # Step 2 -> Step 3
    concept_context: Optional[Dict[str, Any]]   # Step 3 -> Step 4
    story_context: Optional[Dict[str, Any]]     # Step 4 -> Step 5
    logo_context: Optional[Dict[str, Any]]      # Step 5 -> End (Report, etc.)
    
    # ========== 각 단계 결과물 후보 (3개) ==========
    # Step 1은 후보 없음 (diagnosis_result만 사용)
    # Step 2-5: 3개 후보 생성 후 Human Review에서 선택
    naming_candidates: Optional[List[Dict[str, Any]]]   # Step 2: 3개 브랜드명 후보
    concept_candidates: Optional[List[Dict[str, Any]]]  # Step 3: 3개 컨셉 후보
    story_candidates: Optional[List[Dict[str, Any]]]    # Step 4: 3개 스토리 후보
    logo_candidates: Optional[List[Dict[str, Any]]]     # Step 5: 3개 로고 후보
    
    # ========== 사용자 선택 인덱스 ==========
    # Step 1은 선택 없음 (1개만 제공)
    # Step 2-5: 0, 1, 2 중 선택
    naming_selected_index: Optional[int]   # Step 2 선택
    concept_selected_index: Optional[int]  # Step 3 선택
    story_selected_index: Optional[int]    # Step 4 선택
    logo_selected_index: Optional[int]     # Step 5 선택
    
    # ========== Human Review 제어 ==========
    user_choice: Optional[str]  # "0", "1", "2"
    
    # ========== 최종 리포트 (DB 저장) ==========
    final_report: Optional[Dict[str, Any]]  # Step 9 완료 후 생성 (Steps 1-9 종합)
    
    # ========== Human-in-the-Loop ==========
    # Simple Review Check
    # feedback_required, regenerate_step removed
    
    # ========== 품질 검증 ==========
    quality_check_passed: bool
    quality_issues: Optional[List[str]]
    
    # ========== 실행 제어 ==========
    error_occurred: bool
    error_message: Optional[str]


def create_initial_state(output_id: str, user_id: str) -> BrandConsultingState:
    """
    초기 State 생성
    
    Args:
        output_id: 출력 ID
        user_id: 사용자 ID
    
    Returns:
        초기화된 BrandConsultingState
    """
    return BrandConsultingState(
        output_id=output_id,
        user_id=user_id,
        current_step=1,
        cumulative_qa_analysis={},  # 누적 분석 초기화
        quality_check_passed=False,
        error_occurred=False
    )


def get_cumulative_key(up_to_step: int) -> str:
    """
    누적 분석 키 생성
    
    Args:
        up_to_step: 단계 번호 (1~9)
    
    Returns:
        "step_1", "step_1_2", "step_1_2_3", ... "step_1_2_3_4_5"
    
    Examples:
        >>> get_cumulative_key(1)
        'step_1'
        >>> get_cumulative_key(3)
        'step_1_2_3'
        >>> get_cumulative_key(5)
        'step_1_2_3_4_5'
    """
    if up_to_step == 1:
        return "step_1"
    else:
        return "_".join([f"{i}" for i in range(1, up_to_step + 1)])


def merge_qa_analyses(
    existing_analysis: Optional[Dict[str, Any]],
    new_analysis: Dict[str, Any]
) -> Dict[str, Any]:
    """
    두 개의 Q&A 분석을 통합
    
    Args:
        existing_analysis: 기존 누적 분석 (예: step_1_2)
        new_analysis: 새로운 단계 분석 (예: step_3_analysis)
    
    Returns:
        통합된 분석 (예: step_1_2_3)
    
    Note:
        raw_qa 필드는 제거됩니다 (중복 방지)
    """
    if not existing_analysis:
        # 새로운 분석에서 raw_qa 제거
        clean_analysis = {k: v for k, v in new_analysis.items() if k != "raw_qa"}
        return clean_analysis
    
    # 딥 카피하여 병합
    merged = existing_analysis.copy()
    
    # 새로운 분석 내용 추가 (raw_qa 제외)
    for key, value in new_analysis.items():
        if key == "raw_qa":
            continue  # raw_qa는 병합하지 않음
        
        if key in merged:
            # 리스트인 경우 확장
            if isinstance(merged[key], list) and isinstance(value, list):
                merged[key].extend(value)
            # 딕셔너리인 경우 업데이트
            elif isinstance(merged[key], dict) and isinstance(value, dict):
                merged[key].update(value)
            # 그 외는 덮어쓰기
            else:
                merged[key] = value
        else:
            merged[key] = value
    
    return merged


def get_cumulative_context(
    state: BrandConsultingState,
    up_to_step: int
) -> Dict[str, Any]:
    """
    누적 컨텍스트 수집 (DB 결과물 + State 누적 분석)
    
    Args:
        state: 현재 State
        up_to_step: 어느 단계까지의 컨텍스트를 가져올지 (1~9)
    
    Returns:
        누적된 컨텍스트 (결과물 + 분석)
    """
    context = {
        "process_id": state.get("process_id", "local_process"),
        "user_id": state.get("user_id")
    }
    
    # 1. DB 결과물 수집
    result_mappings = {
        1: "diagnosis_result",
        2: "naming_result",
        3: "concept_result",
        4: "story_result",
        5: "logo_result"
    }
    
    for step_num in range(1, min(up_to_step, 10)):
        result_key = result_mappings.get(step_num)
        if result_key and result_key in state and state[result_key]:
            context[result_key] = state[result_key]
    
    # 2. State 누적 분석 추가
    if "cumulative_qa_analysis" in state and state["cumulative_qa_analysis"]:
        # 이전 단계까지의 누적 분석 가져오기
        if up_to_step > 1:
            prev_key = get_cumulative_key(up_to_step - 1)
            if prev_key in state["cumulative_qa_analysis"]:
                context["cumulative_qa_analysis"] = state["cumulative_qa_analysis"][prev_key]
    
    return context
