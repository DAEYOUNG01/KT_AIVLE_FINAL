// src/pages/EasyLogin.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/EasyLogin.css";

/**
 * [EasyLogin Page] 간편 로그인 "페이지" 버전
 * ------------------------------------------------------------
 * ✅ 목적
 * - Google/Kakao/Naver/Apple 같은 OAuth 제공자로 로그인 시작(또는 테스트)
 * - 성공 시 메인(/main)으로 이동
 *
 * ✅ 현재 구현(테스트)
 * - 버튼 클릭 → 0.6초 딜레이 → alert → /main 이동
 *
 * ✅ BACKEND 연동 핵심 포인트
 * 1) OAuth 시작(프론트에서 제공자 인증 페이지로 이동)
 *    - 가장 흔한 방식: 백엔드가 OAuth URL로 리다이렉트 시킴
 *    - 예: window.location.href = `${API_BASE}/auth/google`
 *
 * 2) OAuth 콜백 처리(매우 중요)
 *    - 제공자 인증이 끝나면 "콜백 URL"로 돌아옴
 *    - 백엔드가 보통 아래 중 하나를 해줌:
 *      A) (권장) 프론트로 "code"를 넘기고 프론트가 /auth/callback API로 교환
 *      B) 백엔드가 세션/쿠키를 심고 프론트는 그냥 로그인 상태가 됨
 *      C) 백엔드가 프론트로 accessToken/refreshToken을 리다이렉트로 넘김(주의 필요)
 *
 * 3) 로그인 성공 후 해야할 일
 *    - accessToken 저장(localStorage or cookie)
 *    - 사용자 정보(me) 조회해서 전역 상태(auth) 세팅
 *    - 이후 API 호출에 토큰 포함(axios interceptor 등)
 */
export default function EasyLogin() {
  const navigate = useNavigate();

  // ✅ 어떤 provider 버튼을 눌렀는지 로딩 표시용 (중복 클릭 방지)
  const [loadingProvider, setLoadingProvider] = useState("");

  /**
   * [handleProvider] 제공자 클릭 시 동작
   * ------------------------------------------------------------
   * ✅ 지금: 테스트 딜레이 후 /main 이동
   *
   * ✅ BACKEND 붙이면 여기서 바뀔 것
   * - 여기서 "OAuth 시작"을 해야 함
   * - 대부분은 "페이지 리다이렉트"라서 navigate가 아니라 window.location.href 사용
   *
   * 예시(리다이렉트 방식):
   *   window.location.href = `${API_BASE}/auth/${provider.toLowerCase()}`
   *
   * 예시(팝업 방식):
   *   window.open(`${API_BASE}/auth/${...}`, "oauth", "width=500,height=700");
   *   그리고 postMessage로 결과 받기 등 추가 구현 필요
   */
  const handleProvider = async (provider) => {
    setLoadingProvider(provider);

    try {
      // TODO(BACKEND): 실제 서비스에서는 여기서 OAuth 시작
      // --------------------------------------------------
      // ✅ 방식 1) "리다이렉트" (가장 단순/일반적)
      // window.location.href = `${API_BASE}/auth/${provider.toLowerCase()}`;
      //
      // ✅ 방식 2) "팝업"
      // const popup = window.open(`${API_BASE}/auth/${provider.toLowerCase()}`, ...);
      // 그리고 콜백에서 window.opener.postMessage(...)로 결과 전달

      // ✅ 지금은 테스트용 딜레이
      await new Promise((r) => setTimeout(r, 600));

      // ✅ 테스트: 로그인 성공했다고 가정
      alert(`${provider} 간편로그인 (테스트)`);

      // TODO(BACKEND): 실제로는 "토큰 저장" + "유저 정보 조회" 후 이동해야 함
      // 예)
      // localStorage.setItem("accessToken", token);
      // await fetchMe();
      navigate("/main");
    } finally {
      setLoadingProvider("");
    }
  };

  return (
    <div className="easy-page">
      <main className="easy-card">
        <div className="easy-head">
          <h1 className="easy-title">간편 로그인</h1>
          <p className="easy-subtitle">
            자주 쓰는 계정으로 빠르게 로그인하세요.
          </p>
        </div>

        {/* =====================================================
            ✅ 제공자 버튼 리스트 (정적)
            BACKEND:
            - 어떤 제공자를 지원하는지 서버 설정에 따라 달라질 수 있음
            - 나중에 서버에서 enabledProviders 내려받아 렌더링할 수도 있음
           ===================================================== */}
        <div className="easy-providers" aria-label="간편 로그인 제공자">
          <button
            type="button"
            className="provider-btn"
            onClick={() => handleProvider("Google")}
            disabled={!!loadingProvider}
          >
            <span className="provider-icon" aria-hidden="true">
              G
            </span>
            <span className="provider-text">Google로 계속하기</span>
            <span className="provider-right">
              {loadingProvider === "Google" ? "진행 중..." : "→"}
            </span>
          </button>

          <button
            type="button"
            className="provider-btn"
            onClick={() => handleProvider("Kakao")}
            disabled={!!loadingProvider}
          >
            <span className="provider-icon" aria-hidden="true">
              K
            </span>
            <span className="provider-text">Kakao로 계속하기</span>
            <span className="provider-right">
              {loadingProvider === "Kakao" ? "진행 중..." : "→"}
            </span>
          </button>

          <button
            type="button"
            className="provider-btn"
            onClick={() => handleProvider("Naver")}
            disabled={!!loadingProvider}
          >
            <span className="provider-icon" aria-hidden="true">
              N
            </span>
            <span className="provider-text">Naver로 계속하기</span>
            <span className="provider-right">
              {loadingProvider === "Naver" ? "진행 중..." : "→"}
            </span>
          </button>

          <button
            type="button"
            className="provider-btn"
            onClick={() => handleProvider("Apple")}
            disabled={!!loadingProvider}
          >
            <span className="provider-icon" aria-hidden="true">
              
            </span>
            <span className="provider-text">Apple로 계속하기</span>
            <span className="provider-right">
              {loadingProvider === "Apple" ? "진행 중..." : "→"}
            </span>
          </button>
        </div>

        <div className="easy-divider" />

        {/* ✅ 일반 로그인/회원가입 이동 */}
        <div className="easy-actions">
          <button
            type="button"
            className="easy-secondary"
            onClick={() => navigate("/login")}
            disabled={!!loadingProvider}
          >
            일반 로그인으로 돌아가기
          </button>
          <button
            type="button"
            className="easy-ghost"
            onClick={() => navigate("/signup")}
            disabled={!!loadingProvider}
          >
            아직 계정이 없어요 (회원가입)
          </button>
        </div>

        <p className="easy-footnote">
          * 실제 서비스에서는 간편로그인 제공자의 인증 절차 후 로그인됩니다.
        </p>
      </main>

      {/* ✅ 페이지 하단 footer(정적) */}
      <footer className="easy-footer">
        <div className="footer-inner">
          <div>
            <strong>BRANDPILOT</strong>
          </div>
          <div>
            BRANDPILOT | 대전광역시 서구 문정로48번길 30 (탄방동, KT타워)
          </div>
          <div>KT AIVLE 7반 15조 </div>
          <div className="hero-footer-copy">
            © 2026 Team15 Corp. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
