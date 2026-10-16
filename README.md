# KT_AIVLE_FINAL

<div align="center">
<img width="800" height="320" alt="image" src="https://github.com/user-attachments/assets/50528677-eff8-4fe8-bd5b-99d810c86cf0" />
</div>

**BRANDPILOT**

**초기 창업자와 스타트업을 위해 브랜드 기획부터 시각 결과물 제작까지 지원하는 생성형 AI 기반 맞춤형 브랜딩 컨설팅 플랫폼입니다.**

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

* 주요 기능

* 아키텍처 및 기술 스택

* 핵심 기술 및 트러블슈팅

* 비즈니스 가치 및 확장성

# 프로젝트 개요 

## 1️⃣ 서비스 소개 

💡 **BRANDPILOT** : 초기 창업자와 스타트업을 위한 생성형 AI 기반 맞춤형 브랜딩 컨설팅 플랫폼

💡 브랜드 기획부터 시각 결과물 제작까지 진단 → 네이밍 → 컨셉 → 스토리 → 로고 생성의 5단계 브랜딩 지원

💡 단계별 후보 선택과 이전 결과 반영을 통한 브랜드 방향 구체화

## 2️⃣ 문제 정의 및 기획 배경

출처: [Poor Marketing Statistics — Amra & Elma](https://www.amraandelma.com/poor-marketing-statistics/)

💡 잘못된 키워드 타겟팅으로 인한 유료 광고 예산의 64% 낭비

💡 마케터의 43%가 명확한 콘텐츠 전략 부재 경험

💡 사업·타깃에 맞는 브랜드 방향 설정과 기획부터 시각 결과물까지 일관된 연결의 필요성

## 3️⃣ 기존 솔루션의 한계 및 차별점

💡**기존 한계:** 전문 에이전시 의뢰 비용과 인력 중심 제작 과정에 따른 초기 창업자·스타트업의 부담

💡**해결 및 차별점:** 생성형 AI 기반 후보·제안 이유 제공과 사용자 선택 결과의 후속 단계 반영을 통한 단계별 브랜딩 지원

💡**프롬프트 구조화:** 이전 단계의 브랜드 정보와 현재 요구사항을 결합한 맞춤형 브랜드 전략·시각 결과물 생성

---

# ✨ 주요 기능 

## 1️⃣ 단계별 AI 브랜드 컨설팅 

📌 **Step 1. 기업 초기 진단 (Diagnosis Node)**

**기술적 동작** : 사용자 Q&A(비즈니스 목표, 타겟, 경쟁사 등)를 분석해 브랜드 핵심 가치·타겟 페르소나·핵심 키워드 도출

**데이터 구조화** : 진단 결과를 diagnosis_context 딕셔너리로 구조화하고, 후속 단계의 입력으로 활용할 수 있도록 State에 저장

| 기업 진단 인터뷰 1 | 기업 진단 인터뷰 2 |
| :---: | :---: |
| <img src="https://github.com/user-attachments/assets/4dff9020-814b-4cfa-97f3-bf345b1e4080" width="400" height="300" /> | <img src="https://github.com/user-attachments/assets/35a818d3-af50-48a9-8078-a0c29c469fe0" width="400" height="300" /> |

📌 **Step 2. 네이밍 컨설팅 (Naming Node)** 

**기술적 동작** : diagnosis_context의 진단 요약·핵심 키워드·타겟 페르소나와 현재 Q&A를 프롬프트에 결합해 브랜드명 후보 생성

**전략적 추론** : 브랜드 전략과 사용자 요구사항에 대한 적합성을 설명하는 후보별 제안 이유·요구 반영 근거 생성

| 네이밍 컨설팅 1 | 네이밍 컨설팅 2 |
| :---: | :---: |
| <img src="https://github.com/user-attachments/assets/2f0caebd-dd60-4590-b301-4ff08d18939b" width="400" height="300" /> | <img src="https://github.com/user-attachments/assets/1d51b001-d939-4528-8079-3d0b491010f4" width="400" height="300" /> |

📌 **Step 3. 브랜드 컨셉 진단 (Concept Node)** 

**기술적 동작** : Diagnosis Context와 Naming Context의 진단 요약·선택 브랜드명·이름 제안 이유를 참조해 브랜드 컨셉 후보 생성

**톤 동기화** : 브랜드명의 의미와 현재 요구사항을 연결해 컨셉 문장·제안 이유·핵심 가치 생성

| 브랜드 컨셉 1 | 브랜드 컨셉 2 |
| :---: | :---: |
| <img src="https://github.com/user-attachments/assets/46036925-52f2-499c-83bd-75d1604cc43b" width="400" height="300" /> | <img src="https://github.com/user-attachments/assets/0402a1e6-8bbe-4690-8f79-4ac5010696cb" width="400" height="300" /> |

📌 **Step 4. 스토리텔링 (Story Node)** 

**기술적 동작** : 브랜드명·컨셉·타겟 페르소나와 현재 Q&A를 결합해 브랜드 메시지를 전달하는 스토리 후보 생성

**어투 조정 (Tone & Manner)** : 타겟 페르소나와 사용자가 요청한 분위기·말투를 반영한 스토리 후보 3개 및 제안 이유 생성

| 브랜드 스토리 1 | 브랜드 스토리 2 |
| :---: | :---: |
| <img src="https://github.com/user-attachments/assets/b98792ef-18c7-48cd-a5e0-fb62049261e8" width="400" height="300" /> | <img src="https://github.com/user-attachments/assets/87e6ac35-84f1-47de-8f0d-f87b276dcae6" width="400" height="300" /> |

📌 **Step 5. 로고 컨설팅 (Logo Node - Multimodal Pipeline)** 

**기술적 동작** : 누적 브랜드 정보와 현재 Q&A를 기반으로 GPT-5.1이 로고 컨셉·색상·스타일·구도를 기획하고, Gemini가 이미지 생성을 수행하는 멀티모달 파이프라인 구성

**디자인 제어** : 브랜드명 중심의 타이포그래피와 평면적인 스타일을 프롬프트로 지시하고, 좌우형(Horizontal)·글자 통합형(Integrated)·상하형(Stacked)의 로고 시안 생성

| 브랜드 로고 1 | 브랜드 로고 2 |
| :---: | :---: |
| <img src="https://github.com/user-attachments/assets/3517a8a1-f753-4a83-9a6a-e7a7bff24e22" width="400" height="300" /> | <img src="https://github.com/user-attachments/assets/cafc127c-59ee-4124-85ae-29a73d3f31af" width="400" height="300" /> |

## 2️⃣ 투자 라운지(게시판) 

**브랜딩 산출물과 기업 소개를 공유하고 투자자에게 기업을 알릴 수 있는 홍보 공간 제공**

📌 **투자 라운지** 

| 투자 라운지 페이지 | 투자 라운지 리스트 |
| :---: | :---: |
| <img src="https://github.com/user-attachments/assets/d5a878c8-d42d-40ea-88ee-b617cf220d1e" width="450" height="260" /> | <img src="https://github.com/user-attachments/assets/b176ceff-632e-4119-9069-5c74a11ef0bc" width="450" height="260" /> |

--- 

# 아키텍처 및 기술 스택

## 1️⃣ 시스템 전체 구조

**계층별 역할 요약** : 비즈니스·AI 처리·모델 호출·데이터 저장의 역할 분리를 통한 결합도 완화 및 유지보수성 향상 지향

<div align = "center" >
<img width="800" height="674" alt="image" src="https://github.com/user-attachments/assets/8e3c7a3e-1e72-4798-8a08-13628a3c6725" />
</div>

🔍 **Application Layer (비즈니스 및 상태 관리 계층)**

* **핵심 역할** : 사용자 인증·컨설팅 진행 상태·단계별 산출물 관리

I. 단계별 진행 상태 확인 및 선행 단계 누락 방지를 위한 진행 제어

II. 사용자별 브랜드 정보와 단계별 산출물·Context 저장 및 버전 관리

III. 클라이언트 요청과 AI 서버 호출의 연결 및 생성 결과의 화면·저장 데이터 매핑

🔍 **AI Orchestration Layer (AI 파이프라인 제어 계층)**

* **핵심 역할** : 단계별 생성 흐름 제어 및 이전 Context·현재 요구사항의 결합

I. FastAPI 요청 데이터를 기반으로 이전 단계 Context와 현재 Q&A를 포함한 State 구성

II. LangGraph의 current_step에 따른 진단·네이밍·컨셉·스토리·로고 노드 선택 및 실행

III. 생성 결과를 화면 표시용 result와 후속 단계 입력용 state_context로 구성하고, 사용자 선택과 후속 API 요청을 통한 단계 연결

🔍 **Model Layer (AI 모델 계층)**

I.  GPT-5.1을 활용한 진단·네이밍·컨셉·스토리 생성 및 로고·홍보물의 시각 기획

II. Nano Banana Pro를 활용한 로고·홍보물 이미지 생성

III. GPT-4o·DALL-E 3 사용 경험을 바탕으로 텍스트 표현·브랜드명 가독성·스타일 제어를 검토한 생성 모델 전환

🔍 **Data Layer (데이터 영속성 계층)**

I.  MySQL을 활용한 사용자·브랜드 정보와 단계별 산출물·Context·버전 저장

II. Cloudinary를 활용한 생성 이미지 업로드 및 HTTPS URL 전달

III. AWS S3를 활용한 최종 선택 로고 이미지 저장

## 2️⃣ 기술 스택

| 분류 | 기술 스택 | 도입 목적 및 주요 역할 |
| :--- | :--- | :--- |
| **Frontend** | **React / JavaScript** | • 컴포넌트 기반 UI 구성 및 클라이언트 상태 관리<br>• 비동기 API 통신을 통한 AI 생성 결과의 화면 표시 |
| | **HTML5 / CSS3** | • 반응형 화면 구성 및 사용자 인터랙션 구현<br>• WebP 이미지 활용을 통한 정적 이미지 리소스 용량 절감 |
| **Backend** | **Spring Boot** | • 비즈니스 로직·JWT 인증·투자 라운지 게시판 CRUD 구현<br>• 단계별 산출물·StateContext 저장 및 컨설팅 진행 상태 제어 |
| | **FastAPI** | • 단계별 AI 생성 API 및 Pydantic 요청·응답 모델 구성<br>• 요청 데이터의 State 변환 및 LangGraph 실행 결과 반환 |
| | **MySQL** | • 사용자·브랜드·게시판 데이터 저장<br>• 단계별 Context·AI 산출물·버전 관리 |
| **AI / ML** | **LangChain / LangGraph** | • 단계별 생성 작업의 노드 구성 및 current_step 기반 실행 제어<br>• 이전 단계 Context와 현재 Q&A를 결합한 프롬프트 입력 구성 |
| | **GPT-4o / GPT-5.1** | • 진단·네이밍·컨셉·스토리 등 브랜드 전략 텍스트 생성<br>• GPT-4o에서 GPT-5.1로 전환하며 후보 차별성·맥락 반영·한국어 표현 검토 |
| | **DALL-E 3 / Nano Banana Pro** | • 브랜드 정보와 사용자 요구사항을 반영한 로고·홍보물 이미지 생성<br>• DALL-E 3에서 Nano Banana Pro로 전환하며 브랜드명 가독성·구도·스타일 제어 검토 |
| **Infra & DevOps** | **AWS (EC2, S3)** | • EC2 기반 애플리케이션 서버 호스팅<br>• S3를 활용한 최종 선택 로고 이미지 저장 |
| | **Docker / NGINX** | • 서비스별 실행 환경의 컨테이너화<br>• 리버스 프록시·HTTPS 설정 및 프론트엔드 정적 파일 제공 |
| | **GitHub Actions** | • 브랜치 병합을 트리거로 빌드·배포를 자동화하는 CI/CD 파이프라인 구성 |
| | **Cloudinary** | • 생성 이미지 파일 업로드 및 HTTPS URL 제공<br>• AI 생성 결과를 백엔드가 사용하는 이미지 URL 형식으로 연결 |

---

# 🌟 핵심 기술 및 트러블 슈팅

## 1️⃣ 프롬프트 구조화 및 생성 모델 전환

브랜드 컨설팅 작업을 단계별로 분리하고, 이전 생성 결과와 현재 요구사항을 연결하는 LangGraph 기반 워크플로우 구성

📌 **단계별 LLM 워크플로우 구성 (LangGraph 기반)**

* 진단·네이밍·컨셉·스토리·로고 생성 작업을 개별 Node로 분리

* current_step에 따라 해당 Node를 실행한 뒤 종료하는 요청별 처리 흐름 구성

* 사용자 후보 선택과 후속 API 요청을 통한 5단계 브랜딩 과정 연결

📌 **Context Injection(맥락 주입) 및 상태 관리**

* 요청 간 브랜드 맥락을 이어가기 위한 이전 단계 산출물의 Context 구조화

* 백엔드에 저장된 Context를 후속 요청의 State에 포함하고, 단계별 생성 입력으로 활용

* 진단 요약·브랜드명·선택 컨셉·스토리 등 단계별 필요 정보를 프롬프트에 반영

📌 **Context 기반 프롬프트 구성 및 출력 구조화**

* 역할·이전 브랜드 정보·현재 Q&A·생성 조건을 구분한 프롬프트 구성

* 타겟 페르소나와 사용자 요구에 따른 분위기·말투·설명 길이 지시

* 후보 본문과 제안 이유·Q&A 반영 근거를 함께 요청하는 JSON 출력 구조 설계

* 생성 결과를 화면 표시용 후보와 후속 단계 입력용 Context로 구분

📌 **텍스트 모델 전환 (GPT-4o → GPT-5.1)**

* **후보 차별성** : 후보 간 내용·분위기가 유사한 문제를 바탕으로 생성 방향과 제안 이유의 차이 검토

* **브랜드 맥락 반영** : 이전 진단 정보와 현재 요구사항이 후보·제안 이유에 반영되는 정도를 기준으로 모델 선택

* **응답 구조화** : JSON 응답 모드와 출력 필드 지시를 활용한 후속 파싱용 데이터 구성

* **한국어 표현 조정** : 역할·페르소나·말투·글자 수 지시를 통한 후보별 어감과 설명의 구체화

📌 **이미지 모델 전환 (DALL-E 3 → Nano Banana Pro)**

* **브랜드명 가독성** : 이미지 내 브랜드명 표현과 오타 발생 양상을 검토한 모델 전환

* **스타일 제어** : Minimal·Flat vector 스타일과 흰 배경을 지시하고, 그림자·3D·목업 제외 조건 명시

* **구도 제어** : 좌우형(Horizontal)·글자 통합형(Integrated)·상하형(Stacked)의 로고 후보 생성

* **결과 검토** : 브랜드명 가독성·구도·색상·세부 지시 반영 여부를 중심으로 생성 이미지 확인

📌 **홍보물 컨설팅 프롬프트 고도화 (로컬 실행)**

* **구현 범위** : 아이콘·인물·제품 연출·SNS 포스터 4종의 생성 노드 구현 및 로컬 실행·결과 이미지 확인, 웹 서비스 미통합

* **역할 분리** : GPT-5.1의 컨셉·제안 이유(Rationale) 기획과 Nano Banana Pro의 이미지 생성 역할 분리

* **공통 정보 활용** : 브랜드명·컨셉·스토리 등 공통 Context와 유형별 요구사항을 결합한 이미지 지시 구성

* **실사 표현 제어** : 35mm film·depth of field·imperfections 등의 지시를 활용한 촬영 분위기·심도·자연스러운 질감 표현 유도

* **레이아웃 제어** : SNS 포스터의 브랜드명을 별도 후처리 오버레이 없이 생성 이미지 내부에 표현하도록 지시

## 2️⃣ 이미지 반환 형식 및 전달 구조 개선 (Cloudinary 적용)

**💡문제 상황**

* 이미지 모델 전환 후 기존 URL 응답과 다른 inline_data 형태의 이미지 데이터 수신

* 백엔드가 사용하는 이미지 URL 필드와 모델 반환 데이터 간 형식 불일치

* 이미지 데이터를 JSON 응답에 직접 포함할 경우 응답 크기 증가 및 클라이언트 처리 부담 발생 가능

**💡해결책 및 최적화 효과**

* **반환 형식 변환** : inline_data에서 이미지 바이트를 추출해 로컬 파일로 저장한 뒤 Cloudinary 업로드

* **URL 기반 전달** : 업로드 결과의 secure_url을 API 응답에 포함해 백엔드의 이미지 URL 규격에 연결

* **JSON 응답 경량화** : 이미지 데이터 대신 URL 문자열을 전달해 API JSON 응답 크기 축소

* **표시·저장 역할 분리** : Cloudinary URL을 통한 생성 이미지 표시와 백엔드의 최종 선택 이미지 다운로드·S3 저장 경로 연결

---

# 비즈니스 가치 및 확장성 

## 💡 기대효과 및 확장 방향성

1️⃣ **전문 브랜드 컨설팅의 접근성 확대**

* 1인 창업자 및 초기 스타트업을 위한 AI 기반 브랜딩 지원을 통해 브랜드 기획·시안 제작의 비용과 진입 부담 완화 기대

2️⃣ **SaaS 서비스 모델 확장**

* 기업 규모와 컨설팅 범위에 따른 기능별 구독 요금제 및 B2B 맞춤형 API 제공 검토

3️⃣ **통합 마케팅 서비스 확장**

* 생성된 브랜드 에셋과 CRM·광고 자동화 솔루션의 연계를 통해 전략 수립 → 캠페인 실행 → 성과 분석으로 이어지는 서비스 확장 구상

4️⃣ **B2B / B2G 활용 확대**

* 마케팅 업체의 브랜딩 기획 지원, 공공기관의 창업 지원 프로그램, 대학 캡스톤 실습 등 다양한 활용 분야로의 확장 검토

