"""
LangGraph Workflow Definition (FE-BE 구조용)
각 단계가 독립적으로 실행되고 바로 종료
"""
from langgraph.graph import StateGraph, END
from langgraph_system.state import BrandConsultingState

# Import Nodes
from langgraph_system.nodes.diagnosis_node import diagnosis_node
from langgraph_system.nodes.naming_node import naming_node
from langgraph_system.nodes.concept_node import concept_node
from langgraph_system.nodes.story_node import story_node
from langgraph_system.nodes.logo_node import logo_node

def create_info_graph():
    """
    FE-BE 구조용 단순화된 LangGraph
    각 API 호출이 독립적으로 실행되므로:
    - current_step에 따라 해당 노드만 실행
    - 실행 후 바로 종료 (END)
    - quality_check, human_review 불필요 (FE가 관리)
    """
    workflow = StateGraph(BrandConsultingState)
    
    # 1. 노드 추가
    workflow.add_node("diagnosis", diagnosis_node)
    workflow.add_node("naming", naming_node)
    workflow.add_node("concept", concept_node)
    workflow.add_node("story", story_node)
    workflow.add_node("logo", logo_node)
    
    # 2. 라우팅 함수: current_step에 따라 실행할 노드 결정
    def route_to_step(state: BrandConsultingState) -> str:
        current_step = state.get("current_step", 1)
        
        step_mapping = {
            1: "diagnosis",
            2: "naming",
            3: "concept",
            4: "story",
            5: "logo"
        }
        
        next_node = step_mapping.get(current_step, "diagnosis")
        print(f"[Router] ➡️  Step {current_step} 실행: {next_node}")
        return next_node
    
    # 3. 시작점 설정 (조건부 엣지로 라우팅)
    workflow.set_conditional_entry_point(route_to_step)
    
    # 4. 각 노드 실행 후 바로 종료
    workflow.add_edge("diagnosis", END)
    workflow.add_edge("naming", END)
    workflow.add_edge("concept", END)
    workflow.add_edge("story", END)
    workflow.add_edge("logo", END)
    
    # 5. 컴파일
    app = workflow.compile()
    
    return app
