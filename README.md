# KT_AIVLE_FINAL

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


## 현재 구현과 역할 범위

- **웹 프로토타입:** 진단 → 네이밍 → 컨셉 → 스토리 → 로고 생성과 후보 선택을 팀으로 연결했습니다. 개발 기간은 2025.12.29~2026.02.20, 팀 규모는 6명이며 KT AIVLE School BIG Project Practical상을 수상했습니다.
- **유대영의 직접 개발:** 단계별 LangGraph 처리·프롬프트·정성적 모델 선택·Cloudinary 이미지 URL 전달·홍보물 4종 확장.
- **공동 개발:** FastAPI 브랜딩 API 5개와 Pydantic 요청·응답 모델, 최종 AI 응답 형식 점검·조정.
- **팀 시스템:** React·Spring·DB·인증·상태 관리·배포·S3 연결. 팀 결과와 개인 기여를 구분합니다.
- **향후 확장:** 아래 비즈니스 가치와 구독·마케팅 연계는 목표·가능성이며 실제 매출·고객 효과·운영 지표가 아닙니다.

# CONTENTS 

* 프로젝트 개요

* 주요 기술(기능)

* 아키텍처 및 기술 스택

* 핵심 기술 및 트러블슈팅

* 비즈니스 가치 및 확장성

# 프로젝트 개요 

## 1️⃣ 서비스 소개 

💡BRANDPILOT은 초기 창업자와 스타트업을 위한 생성형 AI 기반 브랜드 컨설팅 웹 프로토타입입니다.

💡진단·네이밍·컨셉·스토리·로고의 5단계 생성과 사용자 후보 선택을 연결했습니다.

## 2️⃣ 문제 정의 및 기획 배경

출처:Top 20 Poor Marketing statics 2025, amraandelma

💡 마케팅 예산의 64%가 잘못된 키워드나 타겟팅으로 낭비

💡 마케터의 43%가 명확한 전략 부재를 겪으며, 일관성 없는 브랜딩으로 마케팅 실패 초래

💡 명확한 브랜드 전략 및 객관적 판단 기준의 필요성 대두

## 3️⃣ 기존 솔루션의 한계 및 차별점

💡**기존 한계:** 에이전시 의뢰 시 수천만 원의 높은 비용 발생 및 인력 중심 작업으로 인한 대량 처리/객관성 유지의 어려움

💡**접근 방식:** 기업 Q&A와 이전 단계 정보를 활용해 후보와 제안 이유를 생성하고, 사용자가 선택하며 브랜드 방향을 구체화하도록 구성했습니다.

💡**프롬프트 구조화를 통해 기업 요구사항에 최적화된 맞춤형 전략 도출**

---

# ✨ 주요 기능 

## 1️⃣ 단계별 AI 브랜드 컨설팅 

📌 **Step 1. 기업 초기 진단 (Diagnosis Node)**

**기술적 동작** : 단순 분석을 넘어, 사용자의 추상적 Q&A(비즈니스 목표, 타겟, 경쟁사 등)를 구체적 전략으로 변환

**데이터 구조화** : 산출물(Brand Essence, Target Persona, Core Keywords)을 diagnosis_context 딕셔너리로 표준화하여, 후속 요청에서 생성 입력으로 사용할 수 있도록 Context에 구성

| 기업 진단 인터뷰 1 | 기업 진단 인터뷰 2 |
| :---: | :---: |
| <img src="https://github.com/user-attachments/assets/4dff9020-814b-4cfa-97f3-bf345b1e4080" width="400" height="300" /> | <img src="https://github.com/user-attachments/assets/35a818d3-af50-48a9-8078-a0c29c469fe0" width="400" height="300" /> |

📌 **Step 2. 네이밍 컨설팅 (Naming Node)** 

**기술적 동작** : Step 1의 diagnosis_context를 프롬프트에 동적으로 주입. 진단 요약·브랜드 정보와 현재 사용자 요구를 프롬프트 입력으로 결합

**전략적 추론** : 단순한 단어 조합 생성이 아닌, 해당 네이밍이 우리 브랜드 전략에 왜 부합하는지를 설득하는 논리를 필수적으로 함께 생성

| 네이밍 컨설팅 1 | 네이밍 컨설팅 2 |
| :---: | :---: |
| <img src="https://github.com/user-attachments/assets/2f0caebd-dd60-4590-b301-4ff08d18939b" width="400" height="300" /> | <img src="https://github.com/user-attachments/assets/1d51b001-d939-4528-8079-3d0b491010f4" width="400" height="300" /> |

📌 **Step 3. 브랜드 컨셉 진단 (Concept Node)** 

**기술적 동작** : Naming Context와 Diagnosis Context를 참조해 이름의 의미와 사업 배경을 함께 반영하도록 구성

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

**디자인 제어** : 브랜드명 중심의 평면적인 스타일과 Horizontal·Integrated·Stacked 구도를 프롬프트로 지시해 로고 시안을 생성

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

🔍 **AI 처리 계층**

* FastAPI가 단계별 요청을 받아 이전 Context와 현재 Q&A로 State를 구성합니다.
* LangGraph는 `current_step`에 해당하는 노드 하나를 실행한 뒤 END로 종료합니다. 다음 단계는 사용자 선택과 새로운 API 요청으로 이어집니다.
* 요청 사이의 상태 저장·재전달은 Spring·DB가 담당합니다. AI 서버의 checkpointer 영속 세션이나 자율적 도구 선택 구조를 구현한 것으로 설명하지 않습니다.

🔍 **모델 계층**

* 현재 생성 경로는 GPT-5.1의 텍스트 생성·로고 기획과 Nano Banana Pro(Gemini 3 Pro Image, 당시 API ID `gemini-3-pro-image-preview`)의 이미지 생성을 연결합니다.
* GPT-4o와 DALL-E 3는 모델 전환 이전의 사용 경험입니다. 모델 선택 기준은 아래의 정성적 관찰로 구분합니다.

🔍 **이미지 전달·저장 계층**

* AI 서버는 생성 이미지를 파일로 저장한 뒤 Cloudinary URL로 전달합니다.
* 사용자가 최종 로고를 선택하면 백엔드의 다운로드·S3 저장 경로로 연결됩니다. Cloudinary 전달과 S3 최종 저장은 역할이 다릅니다.

## 2️⃣ 기술 스택
### 🛠️ 기술 스택 (Tech Stack)

| 분류 | 기술 스택 | 도입 목적 및 주요 역할 |
| :--- | :--- | :--- |
| **Frontend** | **React / JavaScript** | • 컴포넌트 기반 사용자 맞춤형 UI/UX 구축 및 클라이언트 상태 관리<br>• 비동기 통신을 통한 AI 산출물 실시간 렌더링 구현 |
| | **HTML5 / CSS3** | • 반응형 웹 디자인 적용 및 사용자 인터랙션 구현<br>• 정적 이미지 리소스(WebP) 최적화를 통한 프론트엔드 성능(FCP/LCP) 개선 |
| **Backend** | **Spring Boot** | • 비즈니스 로직 처리, 사용자 인증(JWT), 투자 라운지(게시판) CRUD 구현<br>• 단계별 AI 산출물(StateContext) DB 연동 및 컨설팅 진행 상태 잠금(Lock) 제어 |
| | **FastAPI** | • 단계별 브랜딩 API와 Pydantic 요청·응답 모델<br>• 이전 Context와 현재 Q&A로 State 구성, result/state_context 반환 |
| | **MySQL** | • 사용자 정보, 게시판 데이터, 컨설팅 단계별 컨텍스트 및 AI 산출물 구조화 저장 |
| **AI / ML** | **LangChain / LangGraph** | • current_step에 따른 생성 노드 선택 및 요청별 한 단계 실행<br>• 전달받은 Context를 단계별 프롬프트 입력으로 구성 |
| | **GPT-4o / GPT-5.1** | • 장기 문맥 유지가 필수적인 초기 진단, 네이밍, 컨셉, 스토리텔링 등 전략 텍스트 생성 |
| | **Nano Banana Pro / DALL-E 3** | • 브랜드명·색상·구도·스타일 조건에 따른 이미지 시안 생성<br>• DALL-E 3에서 Nano Banana Pro로 전환한 정성적 검토 경험 |
| 별도 검토 | **KR-SBERT** | • 한국어 문장 유사도 접근을 제안하고 팀원 구현을 공동 로컬 검토<br>• 현재 서비스 생성 그래프에는 미적용 |

| **Infra & DevOps** | **AWS (EC2, S3)** | • EC2 기반 애플리케이션 서버 클라우드 호스팅<br>• S3를 활용한 AI 생성 대용량 이미지 산출물 영구 저장소 구축 |
| | **Docker / NGINX** | • 서비스 구동 환경의 일관성 유지를 위한 애플리케이션 컨테이너화(Docker)<br>• 리버스 프록시 설정, 웹 서버 부하 분산 및 정적 리소스 제공(NGINX) |
| | **GitHub Actions** | • 소스 코드 브랜치 병합 시 빌드, 테스트, 배포 과정을 자동화하는 CI/CD 파이프라인 구축 |
| | **Cloudinary** | • 생성 이미지 파일 업로드와 HTTPS URL 전달<br>• AI API의 이미지 반환 형식을 백엔드 URL 규격에 연결 |

---

# 🌟 핵심 기술 및 트러블 슈팅

## 1️⃣ 단계별 프롬프트와 모델 선택

### Context와 출력 구조

진단·네이밍·컨셉·스토리·로고의 작업을 노드별로 나누고, 이전 진단·선택 정보와 현재 Q&A를 프롬프트에 전달했습니다. 후보 본문과 제안 이유·Q&A 반영 근거를 JSON으로 요청하고, 화면용 `result`와 후속 입력용 `state_context`로 구성했습니다.

FastAPI 브랜딩 API 5개와 Pydantic 요청·응답 모델은 공동 개발했습니다. 최종 연동에서 AI 응답의 키·필드명을 점검·조정하고, 팀원과 예시 JSON을 교환하며 Swagger로 호환성을 확인했습니다. JSON 문자열 Context의 파싱과 단계 키 소문자화는 요청 모델의 사전 처리에 있습니다. JSON 모드와 Pydantic의 기본 자료형 정의만으로 생성 품질이나 모든 내부 필드의 일치를 보장하지는 않습니다.

### 텍스트 모델 전환: GPT-4o → GPT-5.1

후보의 방향과 제안 이유, 이전 브랜드 맥락, 후속 파싱용 응답 구조, 한국어 어감의 차이를 직접 검토했습니다. GPT-5.1로 전환하면서 역할·페르소나·설명 길이·출력 필드 지시를 함께 조정했습니다. 이는 개발자의 정성적 비교 경험이며, 같은 입력의 통제 실험이나 측정된 개선율로 제시하지 않습니다.

### 이미지 모델 전환: DALL-E 3 → Nano Banana Pro

DALL-E 3 결과의 브랜드명 가독성과 스타일 제어를 검토해 Nano Banana Pro로 전환했습니다. 브랜드명만 표시하고, 색상·구도·Minimal/Flat vector 스타일과 그림자·3D·목업 제외 조건을 지시했습니다. 실제 출력은 래스터 이미지이며 벡터 파일 생성이나 오타의 완전한 해결을 의미하지 않습니다. 생성 속도 40% 개선과 비용 절감은 확인 가능한 측정 조건·로그가 없어 성과 수치로 사용하지 않습니다.

## 2️⃣ 홍보물 확장과 검토 범위

아이콘·브랜드 인물·제품 연출·SNS 포스터 4종을 별도 확장으로 직접 개발했습니다. 공통 브랜드 정보와 유형별 요구를 결합하고 GPT-5.1의 concept/rationale을 이미지 지시로 변환해 Nano Banana Pro 생성·파일 저장·Cloudinary 전달 함수에 연결했습니다. 자연광·피부 질감·제품 구도·브랜드명 배치 등은 생성 조건이며 출력 품질의 보장은 아닙니다.

확인한 완료 범위는 생성 노드 실행과 저장 이미지의 시각 검토입니다. 시간 제약으로 홍보물의 웹 서비스 통합은 마치지 못했습니다. 5단계 브랜딩 웹 프로토타입과 별도 홍보물 확장을 구분합니다.

KR-SBERT를 활용한 한국어 문장 유사도 접근은 팀원 구현을 공동 로컬 검토한 별도 실험입니다. 발표자료의 검증 설계와 현재 서비스 적용 범위를 구분하며, 활성 생성 그래프의 자동 품질 검증 성과로 제시하지 않습니다.

## 3️⃣ 이미지 반환 형식과 서비스 연동

이미지 모델 전환 후 반환되는 inline_data를 바이트로 읽어 파일로 저장하고, Cloudinary 업로드의 `secure_url`을 API 응답에 담았습니다. 백엔드가 기대한 URL 필드로 변환해 화면 표시·후속 저장 경로에 연결한 작업입니다. 이미지 바이트가 API JSON에서 URL 문자열로 바뀌는 것과 이미지 다운로드량·속도·비용 개선을 구분합니다.

입력 누락·JSON 파싱·이미지 생성·업로드의 예외 처리는 코드에 있으나, Error 후보·로컬 경로 fallback 등 실패 판정의 일관성은 개선 대상입니다. 또한 후보 선택 추출과 일부 Context 필드의 대응은 추가 점검이 필요하므로, 모든 선택값의 정확한 전달이나 무오류 동작을 보장한다고 표현하지 않습니다.

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
