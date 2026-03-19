# LangGraph 기반 브랜드 컨설팅 시스템

## 프로젝트 개요
AI를 활용한 9단계 브랜드 컨설팅 자동화 시스템 (LangGraph 기반)

## 디렉토리 구조
```
LangGraph/
├── database/              # DB 모델 및 연결
│   ├── models.py         # SQLAlchemy 모델
│   ├── connection.py     # DB 연결 관리
│   └── operations.py     # CRUD 연산
│
├── langgraph_system/     # LangGraph 시스템
│   ├── state.py         # State 정의
│   ├── graph.py         # StateGraph 구성
│   ├── utils.py         # 유틸리티
│   └── nodes/           # 노드 구현
│       ├── diagnosis_node.py
│       ├── naming_node.py
│       ├── concept_node.py
│       ├── story_node.py
│       ├── logo_node.py
│       ├── icon_node.py
│       ├── model_node.py
│       ├── staging_node.py
│       ├── poster_node.py
│       ├── quality_check_node.py
│       └── human_review_node.py
│
├── questions.json        # 1~5단계 질문 데이터
├── marketing.json        # 6~9단계 질문 데이터
├── main.py              # 실행 진입점
└── requirements.txt     # 의존성 패키지
```

## 설치 및 실행
```bash
# 의존성 설치
pip install -r requirements.txt

# 실행
python main.py
```

## 기술 스택
- Python 3.10+
- LangGraph
- LangChain
- SQLAlchemy
- OpenAI API
