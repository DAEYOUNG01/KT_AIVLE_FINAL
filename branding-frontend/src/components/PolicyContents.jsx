// src/components/PolicyContents.jsx
import React from "react";

const POLICY_META = {
  companyName: "BRANDPILOT",
  serviceName: "BRANDPILOT",
  operator: "KT AIVLE 8기 7반 15조",
  address: "대전광역시 서구 문정로48번길 30 (탄방동, KT타워)",
  businessNumber: "해당 없음 (교육 프로젝트 단계)",
  privacyOfficer: "KT AIVLE 8기 7반 15조 운영팀",
  contactEmail: "aivle8.team15@kt.com", // 실제 팀 메일로 교체 가능
  establishedDate: "2025년 12월 29일", // 제정일
  revisedDate: "2026년 2월 20일", // 최종수정일
  effectiveDate: "2026년 2월 20일", // 시행일
};

function PolicyMetaBlock() {
  return (
    <div style={{ marginTop: 16 }}>
      <h4>운영자 정보</h4>
      <ul>
        <li>상호: {POLICY_META.companyName}</li>
        <li>서비스명: {POLICY_META.serviceName}</li>
        <li>운영주체: {POLICY_META.operator}</li>
        <li>주소: {POLICY_META.address}</li>
        <li>사업자등록번호: {POLICY_META.businessNumber}</li>
        <li>개인정보보호책임자: {POLICY_META.privacyOfficer}</li>
        <li>문의 이메일: {POLICY_META.contactEmail}</li>
      </ul>
    </div>
  );
}

export function TermsContent() {
  return (
    <div>
      <h3>이용약관</h3>

      <h4>제1조 (목적)</h4>
      <p>
        본 약관은 BRANDPILOT(이하 “회사”)가 제공하는 AI 브랜드 컨설팅 서비스
        “BRANDPILOT”(이하 “서비스”)의 이용과 관련하여 회사와 이용자 간 권리,
        의무 및 책임사항을 규정함을 목적으로 합니다.
      </p>

      <h4>제2조 (서비스의 성격)</h4>
      <p>
        서비스는 예비창업자, 스타트업, 소상공인 및 리브랜딩/성장을 원하는 기업을
        대상으로, AI 기반 브랜드 컨설팅을 제공합니다.
      </p>
      <ul>
        <li>진행 단계: 기업진단 → 네이밍 → 컨셉 → 스토리 → 로고</li>
        <li>각 단계에서 AI 제안 3개 제공, 이용자 1개 선택</li>
        <li>
          이전 단계 결과를 기반으로 다음 단계 제안을 생성하는 순차형(one-queue)
          컨설팅 구조
        </li>
      </ul>

      <h4>제3조 (회원가입 및 계정관리)</h4>
      <ul>
        <li>이용자는 정확한 정보를 기재하여 계정을 생성해야 합니다.</li>
        <li>
          계정의 관리 책임은 이용자에게 있으며, 제3자에게 양도·대여할 수
          없습니다.
        </li>
        <li>
          계정 도용 또는 보안 사고가 의심되는 경우 즉시 회사에 통지해야 합니다.
        </li>
      </ul>

      <h4>제4조 (서비스 제공 내용)</h4>
      <p>
        회사는 브랜드 컨설팅 결과 및 다음 부가 서비스를 제공하거나 제공 예정일
        수 있습니다.
      </p>
      <ul>
        <li>제품 아이콘 컨설팅</li>
        <li>AI 컷 모델</li>
        <li>제품 연출컷</li>
        <li>SNS 제품 포스터</li>
      </ul>
      <p>
        부가 서비스의 세부 범위, 제공 방식, 이용 조건은 회사의 정책 및 공지에
        따릅니다.
      </p>

      <h4>제5조 (결과물 및 지식재산권)</h4>
      <ul>
        <li>
          서비스 내 AI 결과물(텍스트/이미지 포함)은 이용자 선택 및 편집을 전제로
          제공됩니다.
        </li>
        <li>
          이용자는 결과물을 상표권·저작권·디자인권 등 관련 법령에 맞게 검토 후
          사용해야 합니다.
        </li>
        <li>
          회사는 이용자의 결과물 사용 과정에서 발생한 분쟁(권리침해, 손해 등)에
          대해 고의·중과실이 없는 한 책임을 지지 않습니다.
        </li>
      </ul>

      <h4>제6조 (금지행위)</h4>
      <ul>
        <li>법령 위반, 권리 침해, 서비스 악용 행위</li>
        <li>비정상적 접근/자동화 남용/시스템 안정성 저해 행위</li>
        <li>타인의 계정·정보를 무단 사용하거나 부정 취득하는 행위</li>
      </ul>

      <h4>제7조 (서비스 제한 및 해지)</h4>
      <p>
        회사는 이용자가 약관 또는 법령을 위반한 경우 서비스 이용을 제한하거나
        계정을 해지할 수 있습니다.
      </p>

      <h4>제8조 (면책)</h4>
      <ul>
        <li>
          AI 결과는 참고용 제안이며, 사업 성과·매출·투자유치 등 특정 결과를
          보장하지 않습니다.
        </li>
        <li>서비스는 법률·세무·회계·의료·투자 자문을 제공하지 않습니다.</li>
        <li>
          이용자는 최종 의사결정 전에 필요한 경우 전문가 검토를 수행해야 합니다.
        </li>
      </ul>

      <h4>제9조 (약관의 변경)</h4>
      <p>
        회사는 관련 법령 범위 내에서 약관을 변경할 수 있으며, 변경 시 적용일자와
        변경 사유를 서비스 내에 사전 고지합니다.
      </p>

      <PolicyMetaBlock />

      <h4>부칙</h4>
      <p>본 약관은 {POLICY_META.effectiveDate}부터 시행합니다.</p>
      <ul>
        <li>제정일: {POLICY_META.establishedDate}</li>
        <li>최종수정일: {POLICY_META.revisedDate}</li>
        <li>시행일: {POLICY_META.effectiveDate}</li>
      </ul>
      <p>
        본 서비스는 교육 프로젝트 단계에서 운영되며, 향후 상용 서비스로 전환되는
        경우 관련 법령 및 운영정책에 따라 약관을 개정하여 고지합니다.
      </p>
    </div>
  );
}

export function PrivacyContent() {
  return (
    <div>
      <h3>개인정보처리방침</h3>

      <p>
        BRANDPILOT(이하 “회사”)는 이용자의 개인정보를 중요하게 생각하며,
        「개인정보 보호법」 등 관련 법령을 준수합니다. 회사는 아래와 같이
        개인정보를 처리합니다.
      </p>

      <h4>1. 수집하는 개인정보 항목</h4>
      <ul>
        <li>계정정보: 이름(또는 닉네임), 이메일, 로그인 식별정보</li>
        <li>
          서비스 이용정보: 기업진단 응답, 단계별 선택
          이력(네이밍/컨셉/스토리/로고)
        </li>
        <li>문의정보: 문의 내용, 회신을 위한 연락처</li>
        <li>접속기록: IP, 쿠키, 접속 로그, 기기/브라우저 정보</li>
      </ul>

      <h4>2. 개인정보 처리 목적</h4>
      <ul>
        <li>회원 식별 및 계정 관리</li>
        <li>AI 브랜드 컨설팅 결과 제공 및 단계 진행 관리</li>
        <li>고객 문의 응대, 서비스 품질 개선, 보안 및 이상행위 탐지</li>
      </ul>

      <h4>3. 개인정보 보유 및 이용기간</h4>
      <ul>
        <li>원칙적으로 처리 목적 달성 시 지체 없이 파기합니다.</li>
        <li>
          다만, 관계 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.
        </li>
      </ul>

      <h4>4. 개인정보의 제3자 제공</h4>
      <p>
        회사는 이용자의 개인정보를 원칙적으로 제3자에게 제공하지 않습니다. 다만,
        법령상 의무가 있거나 이용자가 사전에 동의한 경우는 예외로 합니다.
      </p>

      <h4>5. 개인정보 처리의 위탁</h4>
      <p>
        회사는 서비스 운영을 위해 일부 업무를 외부에 위탁할 수 있으며, 위탁 시
        관련 법령에 따라 수탁자 관리·감독을 수행합니다.
      </p>

      <h4>6. 이용자의 권리</h4>
      <ul>
        <li>개인정보 열람, 정정, 삭제, 처리정지 요구</li>
        <li>동의 철회 및 계정 탈퇴 요청</li>
      </ul>
      <p>
        권리 행사는 문의 이메일을 통해 요청할 수 있으며, 회사는 지체 없이
        조치합니다.
      </p>

      <h4>7. 개인정보의 파기절차 및 방법</h4>
      <ul>
        <li>전자파일: 복구가 불가능한 방식으로 영구 삭제</li>
        <li>출력물: 분쇄 또는 소각</li>
      </ul>

      <h4>8. 개인정보 보호를 위한 안전성 확보조치</h4>
      <ul>
        <li>접근권한 관리 및 접근통제</li>
        <li>전송/저장 구간 보호(암호화 등)</li>
        <li>접속기록 보관, 보안 점검 및 내부 관리계획 수립</li>
      </ul>

      <h4>9. 쿠키(Cookie) 운영</h4>
      <p>
        회사는 로그인 유지, 사용성 개선, 트래픽 분석 등을 위해 쿠키를 사용할 수
        있습니다. 이용자는 브라우저 설정을 통해 쿠키 저장을 거부할 수 있으나,
        일부 기능 이용이 제한될 수 있습니다.
      </p>

      <h4>10. 개인정보보호책임자 및 문의</h4>
      <ul>
        <li>개인정보보호책임자: {POLICY_META.privacyOfficer}</li>
        <li>문의 이메일: {POLICY_META.contactEmail}</li>
        <li>주소: {POLICY_META.address}</li>
      </ul>

      <h4>11. 프로젝트 단계 운영 안내</h4>
      <p>
        본 서비스는 교육 프로젝트 단계에서 운영됩니다. 서비스 운영 목적이 달성된
        후에는 관련 법령상 보관 의무가 없는 개인정보를 지체 없이 파기합니다.
      </p>

      <h4>부칙</h4>
      <p>본 개인정보처리방침은 {POLICY_META.effectiveDate}부터 적용됩니다.</p>
      <ul>
        <li>제정일: {POLICY_META.establishedDate}</li>
        <li>최종수정일: {POLICY_META.revisedDate}</li>
        <li>시행일: {POLICY_META.effectiveDate}</li>
      </ul>
    </div>
  );
}
