# KT_AIVLE_FINAL
https://aibrandpilot.com/ - 제작 사이트

<div align="center">
<img width="800" height="320" alt="image" src="https://github.com/user-attachments/assets/50528677-eff8-4fe8-bd5b-99d810c86cf0" />
</div>

**BRANDPILOT**

**초기 창업자와 스타트업을 위해 기획부터 시각 결과물까지 자동화된 브랜딩 과정을 제공하는 생성형 AI 기반 맞춤형 컨설팅 플랫폼입니다.**

# <img width="60" height="60" alt="image" src="https://github.com/user-attachments/assets/26a6b24a-1fc6-4cab-b0cf-fee28c67c177" /> 팀 소개 

<div align="center">

<table>
  <tr>
    <td align="center" valign="top" width="33%">
      <img src="https://github.com/user-attachments/assets/6fa5a0ac-f073-4ba7-9043-f2493793fba6" width="100" height="100" style="border-radius: 50%;"><br><br>
      <strong>김대호</strong><br>
      AI / PM (Leader)<br><br>
      • 프로젝트 총괄<br>
      • 생성물 일관성 검증<br>
      • 자료 제작/발표
    </td>
    <td align="center" valign="top" width="33%">
      <img src="https://github.com/user-attachments/assets/be2bf4e7-8654-41f7-a887-1fb64b57a54d" width="100" height="100" style="border-radius: 50%;"><br><br>
      <strong>유대영</strong><br>
      AI Agent Developer<br><br>
      • 브랜딩 에이전트 개발<br>
      • 프롬프트 구조화/최적화<br>
      • API 모델 분석<br>
      • 이미지 URL 변환
    </td>
    <td align="center" valign="top" width="33%">
      <img src="https://github.com/user-attachments/assets/b4686975-7863-4927-bcbd-2a872bf6d3c8" width="100" height="100" style="border-radius: 50%;"><br><br>
      <strong>정현호</strong><br>
      AI Agent Developer<br><br>
      • 브랜딩 에이전트 개발<br>
      • 프롬프트 구조화/최적화<br>
      • API 모델 분석<br>
      • 이미지 URL 변환
    </td>
  </tr>
  <tr>
    <td align="center" valign="top" width="33%">
      <img src="https://github.com/user-attachments/assets/4b1cf8d1-95ff-49de-94ca-99f1a7860880" width="100" height="100" style="border-radius: 50%;"><br><br>
      <strong>장혁준</strong><br>
      BE / CLOUD<br><br>
      • Backend/REST API 개발<br>
      • FastAPI 워크플로우 설계<br>
      • AWS 구성/Docker 배포
    </td>
    <td align="center" valign="top" width="33%">
      <img src="https://github.com/user-attachments/assets/109a4c4a-b077-4e6e-b872-5972f66c5c90" width="100" height="100" style="border-radius: 50%;"><br><br>
      <strong>김효성</strong><br>
      FE<br><br>
      • UI/UX 서비스 설계/개발<br>
      • 프론트엔드 성능 최적화<br>
      • FE Server 연동/오류 개선
    </td>
    <td align="center" valign="top" width="33%">
      <img src="https://github.com/user-attachments/assets/d7f04931-52f5-4b66-9fbd-39fd26119e37" width="100" height="100" style="border-radius: 50%;"><br><br>
      <strong>이시연</strong><br>
      FE<br><br>
      • 서비스 기획/UI/UX 개발<br>
      • 사용자 인증/API 연동<br>
      • CRUD 기능 구현
    </td>
  </tr>
</table>

</div>

---

# CONTENTS 

* 프로젝트 개요

* 주요 기술(기능)

* 아키텍처 및 기술 스택

* 핵심 기술 및 트러블슈팅

* 비즈니스 가치 및 확장성

# 프로젝트 개요 

## 1️⃣ 서비스 소개 

💡BRANDPIROT은 스타트업과 창업자를 위해 단기간 자동화된 브랜딩 과정을 제공하는 플랫폼

💡기획부터 시각 결과물 제작까지 단기간에 자동화된 브랜딩 과정 제공

## 2️⃣ 문제 정의 및 기획 배경

출처:Top 20 Poor Marketing statics 2025, amraandelma

💡 마케팅 예산의 64%가 잘못된 키워드나 타겟팅으로 낭비

💡 마케터의 43%가 명확한 전략 부재를 겪으며, 일관성 없는 브랜딩으로 마케팅 실패 초래

💡 명확한 브랜드 전략 및 객관적 판단 기준의 필요성 대두

## 3️⃣ 기존 솔루션의 한계 및 차별점

💡**기존 한계:** 에이전시 의뢰 시 수천만 원의 높은 비용 발생 및 인력 중심 작업으로 인한 대량 처리/객관성 유지의 어려움

💡**해결 및 차별점:** 생성형 AI 도입으로 컨설팅 기간 단축 및 인건비를 AI 토큰 비용으로 대체하여 저비용·고효율 구조 실현

💡**프롬프트 구조화를 통해 기업 요구사항에 최적화된 맞춤형 전략 도출**

---

# ✨ 주요 기능 

## 1️⃣ 단계별 AI 브랜드 컨설팅 

📌 **Step 1. 기업 초기 진단 (Diagnosis Node)**

**기술적 동작** : 단순 분석을 넘어, 사용자의 추상적 Q&A(비즈니스 목표, 타겟, 경쟁사 등)를 구체적 전략으로 변환

**데이터 구조화** : 산출물(Brand Essence, Target Persona, Core Keywords)을 diagnosis_context 딕셔너리로 표준화하여, 이후 노드들이 참조할 수 있도록 State에 강제 주입

| 기업 진단 인터뷰 1 | 기업 진단 인터뷰 2 |
| :---: | :---: |
| <img src="https://github.com/user-attachments/assets/4dff9020-814b-4cfa-97f3-bf345b1e4080" width="400" height="300" /> | <img src="https://github.com/user-attachments/assets/35a818d3-af50-48a9-8078-a0c29c469fe0" width="400" height="300" /> |

📌 **Step 2. 네이밍 컨설팅 (Naming Node)** 

**기술적 동작** : Step 1의 diagnosis_context를 프롬프트에 동적으로 주입. 도출된 키워드(예: '신뢰' → 묵직한 어감, '혁신' → 진취적 어감)에 따라 프롬프트 템플릿이 실시간으로 변형 및 최적화

**전략적 추론** : 단순한 단어 조합 생성이 아닌, 해당 네이밍이 우리 브랜드 전략에 왜 부합하는지를 설득하는 논리를 필수적으로 함께 생성

| 네이밍 컨설팅 1 | 네이밍 컨설팅 2 |
| :---: | :---: |
| <img src="https://github.com/user-attachments/assets/2f0caebd-dd60-4590-b301-4ff08d18939b" width="400" height="300" /> | <img src="https://github.com/user-attachments/assets/1d51b001-d939-4528-8079-3d0b491010f4" width="400" height="300" /> |

📌 **Step 3. 브랜드 컨셉 진단 (Concept Node)** 

**기술적 동작** : Naming Context와 Diagnosis Context 두 가지를 이중으로 참조하여 파이프라인의 맥락 유실을 방지

**톤 동기화** : 사용자가 특정 브랜드명을 선택하면 그 이름의 분위기에 맞춰 톤앤매너를 동기화하고, 고객에게 약속할 핵심 가치를 구체화

| 브랜드 컨셉 1 | 브랜드 컨셉 2 |
| :---: | :---: |
| <img src="https://github.com/user-attachments/assets/46036925-52f2-499c-83bd-75d1604cc43b" width="400" height="300" /> | <img src="https://github.com/user-attachments/assets/0402a1e6-8bbe-4690-8f79-4ac5010696cb" width="400" height="300" /> |

📌 **Step 4. 스토리텔링 (Story Node)** 

**기술적 동작** : Step 1~3의 누적 데이터(Naming, Concept, Persona)를 모두 주입받아 논리적 설득을 넘어선 감정적 동화를 설계

**어투 조정 (Tone & Manner)** : Step 1에서 도출된 타겟 페르소나(예: 전문직 타겟 → 신뢰감/정중함, 20대 타겟 → 위트/경쾌함)에 따라 문체와 말투를 동적으로 조정하여 서로 다른 3가지 톤의 내러티브를 생성

| 브랜드 스토리 1 | 브랜드 스토리 2 |
| :---: | :---: |
| <img src="https://github.com/user-attachments/assets/b98792ef-18c7-48cd-a5e0-fb62049261e8" width="400" height="300" /> | <img src="https://github.com/user-attachments/assets/87e6ac35-84f1-47de-8f0d-f87b276dcae6" width="400" height="300" /> |

📌 **Step 5. 로고 컨설팅 (Logo Node - Multimodal Pipeline)** 

**기술적 동작** : 추상적인 텍스트 전략(Full Context)을 구체적인 시각물로 변환하는 멀티모달 파이프라인임. 기획 단계(GPT-5.1)에서 상세 지시어를 추출한 뒤, 생성 단계(Gemini)에서 렌더링을 수행하도록 역할을 분리

**디자인 제어** : 단순 심볼보다 타이포그래피 자체가 브랜드가 되는 디자인 지향점을 프롬프트에 강제하여, 레이아웃(Horizontal, Integrated, Stacked)에 맞는 상업용 로고를 생성

| 브랜드 로고 1 | 브랜드 로고 2 |
| :---: | :---: |
| <img src="https://github.com/user-attachments/assets/3517a8a1-f753-4a83-9a6a-e7a7bff24e22" width="400" height="300" /> | <img src="https://github.com/user-attachments/assets/cafc127c-59ee-4124-85ae-29a73d3f31af" width="400" height="300" /> |

## 2️⃣ 투자 라운지(게시판) 

**완성된 브랜딩 산출물을 활용해 투자자와 연결될 수 있는 기업 홍보 공간 제공**

📌 **투자 라운지** 

| 투자 라운지 페이지 | 투자 라운지 리스트 |
| :---: | :---: |
| <img src="https://github.com/user-attachments/assets/d5a878c8-d42d-40ea-88ee-b617cf220d1e" width="450" height="260" /> | <img src="https://github.com/user-attachments/assets/b176ceff-632e-4119-9069-5c74a11ef0bc" width="450" height="260" /> |

--- 

# 아키텍터 및 기술 스택

## 1️⃣ 시스템 전체 구조

**계층별 역할 요약** : 비즈니스 로직과 AI 모델의 결합도를 낮추고 유지보수성을 높이기 위해 4계층 구조로 설계 및 구현

<div align = "center" >
<img width="800" height="674" alt="image" src="https://github.com/user-attachments/assets/8e3c7a3e-1e72-4798-8a08-13628a3c6725" />
</div>

🔍 **Application Layer (비즈니스 및 상태 관리 계층)**

* **핵심 역할** : 사용자 상태 관리 및 단계별 데이터 무결성 유지

I. 단계별 컨설팅 프로세스의 워크플로우 제어 및 이전 단계 누락 방지를 위한 상태 잠금 로직 처리

II. 사용자 세션 유지 및 단계별 산출물의 버전 관리 수행

III. 클라이언트 비즈니스 로직과 AI 서버 호출 결과를 매핑하는 미들웨어 역할 수행

🔍 **AI Orchestration Layer (AI 파이프라인 제어 계층)**

* **핵심 역할** : 프롬프트 흐름 제어 및 AI 생성·검증 파이프라인 총괄 관리

I. 단계별 프롬프트 템플릿 구성 및 이전 단계 산출물(Context)의 요구사항 동적 주입

II. 텍스트 생성 → 임베딩 유사도 분석 → 판정 사유 생성으로 이어지는 자동화 검증 파이프라인 구축

III. SBERT 기반의 정량적 평가(유사도 점수)와 LLM 기반의 정성적 분석(판정 사유) 흐름을 통합 제어

🔍 **Model Layer (AI 모델 계층)**

I. GPT-4o / GPT-5.1 등 GPT 계열 모델을 활용한 브랜드 전략 텍스트 및 스토리 생성

II. Nano Banana Pro 및 DALL-E 3 기반의 고품질 로고 및 브랜드 홍보물 이미지 생성

III. GPT-5-mini 기반의 텍스트-이미지 간 의미 정합성 교차 분석 수행

🔍 **Data Layer (데이터 영속성 계층)**

I.  단계별 산출물 및 검증결과를 구조화된 형태로 저장

II. AWS S3 및 Cloudinary를 활용한 대용량 이미지 산출물 영구 저장 및 CDN 기반 정적 리소스 배포 확장성 확보

## 2️⃣ 기술 스택
### 🛠️ 기술 스택 (Tech Stack)

| 분류 | 기술 스택 | 도입 목적 및 주요 역할 |
| :--- | :--- | :--- |
| **Frontend** | **React / JavaScript** | • 컴포넌트 기반 사용자 맞춤형 UI/UX 구축 및 클라이언트 상태 관리<br>• 비동기 통신을 통한 AI 산출물 실시간 렌더링 구현 |
| | **HTML5 / CSS3** | • 반응형 웹 디자인 적용 및 사용자 인터랙션 구현<br>• 정적 이미지 리소스(WebP) 최적화를 통한 프론트엔드 성능(FCP/LCP) 개선 |
| **Backend** | **Spring Boot** | • 비즈니스 로직 처리, 사용자 인증(JWT), 투자 라운지(게시판) CRUD 구현<br>• 단계별 AI 산출물(StateContext) DB 연동 및 컨설팅 진행 상태 잠금(Lock) 제어 |
| | **FastAPI** | • LangChain/LangGraph 기반 AI 에이전트 오케스트레이션 수행<br>• 무거운 AI 모델 호출의 비동기 파이프라인 처리 및 서버 부하 분산 |
| | **MySQL** | • 사용자 정보, 게시판 데이터, 컨설팅 단계별 컨텍스트 및 AI 산출물 구조화 저장 |
| **AI / ML** | **LangChain / LangGraph** | • 다단계 AI 워크플로우를 그래프(Node/Edge) 구조로 모델링하여 에이전트 파이프라인 구축<br>• 이전 단계 산출물을 다음 단계로 연결하는 프롬프트 동적 주입 흐름 제어 |
| | **GPT-4o / GPT-5.1** | • 장기 문맥 유지가 필수적인 초기 진단, 네이밍, 컨셉, 스토리텔링 등 전략 텍스트 생성 |
| | **Nano Banana Pro / DALL-E 3** | • 브랜드 핵심 메시지와 톤앤매너를 반영한 고품질 로고 및 마케팅 홍보물 이미지 생성<br>• 텍스트 렌더링(타이포그래피) 정확도 및 프롬프트 추종성 극대화 |
| | **KR-SBERT / HyperCLOVA X** | • 산출물 간 코사인 유사도 정량 평가(KR-SBERT)로 텍스트 의미 일관성 모니터링<br>• 정량 평가 기반 Pass/Fail 판정 및 불일치 사유 한국어 요약 자동 생성(HyperCLOVA X) |
| | **GPT-5-mini (Vision)** | • 생성된 텍스트(브랜드 스토리)와 시각 산출물(로고) 간의 의미 정합성 교차 검증 수행 |
| **Infra & DevOps** | **AWS (EC2, S3)** | • EC2 기반 애플리케이션 서버 클라우드 호스팅<br>• S3를 활용한 AI 생성 대용량 이미지 산출물 영구 저장소 구축 |
| | **Docker / NGINX** | • 서비스 구동 환경의 일관성 유지를 위한 애플리케이션 컨테이너화(Docker)<br>• 리버스 프록시 설정, 웹 서버 부하 분산 및 정적 리소스 제공(NGINX) |
| | **GitHub Actions** | • 소스 코드 브랜치 병합 시 빌드, 테스트, 배포 과정을 자동화하는 CI/CD 파이프라인 구축 |
| | **Cloudinary** | • 무거운 Base64 이미지 페이로드를 즉시 HTTPS URL로 변환하는 CDN 레이어 적용<br>• 네트워크 전송량 경량화 및 DB 저장 구조 단순화 달성 |

---

# 🌟 핵심 기술 및 트러블 슈팅

## 1️⃣ Advanced Prompt Engineering 및 모델 최적화 (세부 설명)

복잡한 비즈니스 로직을 LangGraph 기반의 Node & Edge 구조로 모델링하여 제어

📌 **Agentic Pipeline Architecture 도입 (LangGraph 기반)**

* 복잡한 브랜드 컨설팅 비즈니스 로직을 단일 프롬프트에 의존하지 않고, Node와 Edge 구조의 그래프로 모델링하여 제어 및 자동화

📌 **Context Injection(맥락 주입) 및 상태 관리**

* LLM의 Stateless(상태 비저장) 한계를 극복하기 위해 파이프라인 구조를 설계

* 이전 단계의 산출물을 표준화된 데이터(Context)로 변환한 뒤, 다음 단계의 State에 연속적으로 주입하여 전체 프로세스 간의 맥락 유실을 원천 차단

📌 **Dynamic Prompting 및 Chain of Thought 구현**

* 이전 단계의 도출 결과(페르소나, 키워드 등)에 따라 다음 단계의 프롬프트 템플릿과 생성 어투(Tone & Manner)가 실시간으로 변형 및 최적화

* 단순한 결과물 생성이 아닌, '진단 → 네이밍 → 컨셉 → 스토리 → 시각화(로고)'로 이어지는 5단계의 논리적 추론 과정을 설계

* 결과적으로 추상적인 텍스트 전략이 확고한 전략적 근거를 바탕으로 최종 시각 요소까지 일관되게 확장되는 파이프라인을 완성

📌 **텍스트 모델 전환 (GPT-4o → GPT-5.1)**

* **구조적 안정성** : 5단계 프로세스 동안 구문 오류 없이 데이터 구조를 생성하여 파이프라인 중단을 방지

* **긴 호흡의 맥락 유지** : 초기 진단의 페르소나와 핵심 가치를 끝까지 일관성 있게 유지하는 추론 능력 탁월

* **감성적 디테일** : 타겟 고객을 위한 미묘한 어감 차이와 고도화된 한국어 뉘앙스 표현 가능

📌 **이미지 모델 전환 (DALL-E 3 → Nano Banana Pro)**

* **타이포그래피 정확도** : 텍스트 렌더링 엔진 강화로 이미지 내 브랜드명 오타 이슈 해결

* **프롬프트 추종성** : 3D 효과나 그림자를 배제하는 미니멀 벡터 스타일 지시어 등 세밀한 디자인 가이드 엄수

* **비용 및 속도 효율성** : DALL-E 3 대비 생성 속도가 약 40% 이상 빨라 대량 시안 테스트 환경에서 비용 절감 효과 확인

📌 **[부록] 홍보물 컨설팅 프롬프트 고도화**

* **역할 분리**: GPT-5.1이 컨텍스트를 이해해 컨셉과 Rationale을 JSON으로 기획하고, Nano Banana Pro는 전달받은 내용 기반으로 이미지 렌더링만 전담하여 제어력 향상

* **프롬프트 최적화** : 35mm film, depth of field, imperfections 등 실사 품질 제약 조건을 강제하여 인위적인 "플라스틱 피부" 현상 방지

* **레이아웃 제어** : SNS 포스터 생성 시 브랜드명을 오버레이가 아닌 자연스러운 텍스트로 강제 삽입하도록 지시

## 2️⃣ 생성물 일관성 검증 파이프라인

**I. 구간별(PAIR) 분리 검증 도입**

* 파이프라인 종료 후 일괄 검증 시 장시간 소요되는 문제 해결을 위해 4개 PAIR(DIAG_TO_NAMING, NAMING_TO_CONCEPT, CONCEPT_TO_STORY, STORY_TO_LOGO)로 분리 진행

* 각 구간별 특성에 맞춰 임계치(Threshold)를 개별 조정하여 기준 값 최적화

**II. 검증 로직 세분화 (Text & Image)**

* **텍스트 검증** : KR-SBERT를 활용하여 이전 단계 핵심 문장(Pain/USP/Target 등)과 생성물 간의 유사도를 측정(Top-k 방식 적용)

* **이미지 검증** : 스토리-로고 구간은 의미 일관성 검증 방식을 도입하여 텍스트의 감성 및 핵심 메시지가 로고에 반영되었는지 판별

**III. LLM 기반 판정 및 관리자 피드백 생성**

* 임계치 결과에 따라 PASS, REVIEW, FAIL 판정 부여

* HyperCLOVA X SEED 및 GPT-5-mini를 활용하여 관리자가 이해하기 쉬운 형태의 검증 이유를 자연어로 생성

* 모든 검증 결과와 중간값은 디버깅 및 관리를 위해 Debug.json, Compact.json 형태로 출력/저장

## 3️⃣ 데이터 및 인프라 최적화 (Cloudinary 적용)

**💡문제 상황**

* Gemini 모델(Nano Banana Pro) 특성상 이미지 반환 시 Base64 바이너리로만 응답

* 이를 프론트엔드로 직배송할 경우 JSON 페이로드 용량이 폭발(장당 2~5MB)하여 모바일 성능 저하 및 렌더링 지연 발생

* 데이터베이스에 BLOB 형태로 저장 시 극심한 비효율 야기

**💡해결책 및 최적화 효과**

* **변환 레이어 구축** : Base64 데이터를 로컬 임시 저장 후 Cloudinary CDN 레이어를 통해 영구 HTTPS URL로 변환

* **페이로드 경량화** : 수 MB의 데이터를 수십 바이트(bytes)의 문자열(URL)로 축소하여 통신 효율성 극대화

* **백엔드 단순화** : DB에 URL 문자열만 저장하도록 구조 통일

* **성능 고도화** : 글로벌 CDN 가속을 통해 이미지 응답 및 로딩 속도 비약적 향상.

---

# 비즈니스 가치 및 확장성 

## 💡 기대효과 및 확장 방향성

1️⃣ **전문 브랜드 컨설팅의 대중화** 

* 수천만 원에 달하는 고비용 에이전시에 접근하기 어려운 1인 창업자 및 중소 스타트업에게 저비용·고품질의 전략 기반 브랜딩 기회 제공.

2️⃣ **SaaS 서비스 모델 확장** 

* 기업 규모와 컨설팅 뎁스에 따른 기능 확장형 구독 요금제 설계 및 B2B 맞춤형 API 제공 가능성 확보.

3️⃣ **통합 마케팅 생태계 구축** 

* 도출된 브랜드 에셋 바탕으로 CRM 및 광고 자동화 솔루션과 연동, 전략 수립-캠페인 실행-성과 분석으로 이어지는 선순환 마케팅 생태계 구축 기대.

4️⃣ **B2B / B2G 시장 진출** 

* 기존 마케팅 업체의 기획 검증 도구, 공공기관의 창업 지원 프로그램 도입, 대학 캡스톤 실습 도구 등 다양한 산업 특화 모델로 활용 기대.

