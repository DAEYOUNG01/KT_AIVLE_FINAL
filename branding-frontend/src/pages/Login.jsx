// src/pages/Login.jsx
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import namingLogoImg from "../Image/login_image/naming_logo.webp";

import PolicyModal from "../components/PolicyModal.jsx";
import { PrivacyContent, TermsContent } from "../components/PolicyContents.jsx";

// ✅ 팀 코드의 백 연동 방식으로 통일
import { apiRequest, setAccessToken } from "../api/client.js";
import { setCurrentUserId, setIsLoggedIn } from "../api/auth.js";
import "../styles/Login.css";

const TRANSPARENT_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

function EyeIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7S2.5 12 2.5 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EyeOffIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M3 3l18 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.6 10.6a2.6 2.6 0 0 0 3.7 3.7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.2 6.8C4 8.6 2.5 12 2.5 12s3.5 7 9.5 7c1.7 0 3.2-.4 4.5-1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.1 4.6A9.8 9.8 0 0 1 12 5c6 0 9.5 7 9.5 7s-1.2 2.4-3.5 4.3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function LoginApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location?.state?.redirectTo;

  // ✅ 약관/개인정보 모달
  const [openType, setOpenType] = useState(null);
  const closeModal = () => setOpenType(null);

  // ✅ 입력값
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // ✅ UX
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [marqueeImages, setMarqueeImages] = useState({
    analyzeCompany: "",
    analyzeReport: "",
    story: "",
  });

  useEffect(() => {
    let cancelled = false;

    const loadExtraImages = async () => {
      try {
        const [companyMod, reportMod, storyMod] = await Promise.all([
          import("../Image/login_image/diag_intro.webp"),
          import("../Image/login_image/diag_report.webp"),
          import("../Image/login_image/storytelling.webp"),
        ]);

        if (cancelled) return;

        setMarqueeImages({
          analyzeCompany: companyMod.default,
          analyzeReport: reportMod.default,
          story: storyMod.default,
        });
      } catch {
        // 이미지 지연 로드 실패 시 기존 UI 동작 유지
      }
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(loadExtraImages, {
        timeout: 1800,
      });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(idleId);
      };
    }

    const timer = window.setTimeout(loadExtraImages, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  // ✅ 회원가입 페이지 prefetch (hover/focus 시)
  const warmSignupPage = () => {
    import("./Signup.jsx").catch(() => {});
  };

  const goSignup = () => {
    if (isLoading) return;
    navigate("/signup");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMsg("");

    const loginId = id.trim();
    const pw = password;

    if (!loginId) return setErrorMsg("아이디를 입력해주세요.");
    if (!pw) return setErrorMsg("비밀번호를 입력해주세요.");

    setIsLoading(true);
    try {
      // ✅ 백엔드 로그인
      const data = await apiRequest("/auth/login", {
        method: "POST",
        data: {
          loginId,
          password: pw,
        },
      });

      // ✅ 토큰 저장(응답 키가 다를 가능성 대비)
      const token =
        data?.accessToken ||
        data?.token ||
        data?.access_token ||
        data?.jwt ||
        data?.jwtToken;
      if (token) setAccessToken(token);

      // ✅ 로그인 사용자 식별자 저장
      setCurrentUserId(data?.userId || data?.loginId || loginId);
      setIsLoggedIn(true);

      navigate(redirectTo || "/main");
      // 2026-02-05
      // 로그인 실패 시 오류 메시지 변경
    } catch (err) {
      const status = err?.status || err?.response?.status;
      if (status === 401 || status === 403) {
        setErrorMsg("아이디 또는 비밀번호가 올바르지 않습니다.");
      } else {
        setErrorMsg(err?.userMessage || "로그인에 실패했습니다.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page navy">
      <PolicyModal
        open={openType === "privacy"}
        title="개인정보 처리방침"
        onClose={closeModal}
      >
        <PrivacyContent />
      </PolicyModal>

      <PolicyModal
        open={openType === "terms"}
        title="이용약관"
        onClose={closeModal}
      >
        <TermsContent />
      </PolicyModal>

      <div className="login-shell split">
        {/* Left: 로그인 폼 */}
        <section className="login-panel light-panel">
          <h2>LOGIN</h2>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="login-id">아이디</label>
              <input
                id="login-id"
                type="text"
                placeholder="아이디 입력"
                autoComplete="username"
                value={id}
                onChange={(e) => setId(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="field">
              <label htmlFor="login-password">비밀번호</label>

              <div className="pw-input-wrap">
                <input
                  id="login-password"
                  className="pw-input"
                  type={showPassword ? "text" : "password"}
                  placeholder="비밀번호 입력"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />

                <button
                  type="button"
                  className="pw-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={
                    showPassword ? "비밀번호 숨기기" : "비밀번호 보기"
                  }
                  aria-pressed={showPassword}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <div className="login-links">
              <button type="button" onClick={() => navigate("/findid")}>
                아이디 찾기
              </button>
              <span className="dot" aria-hidden="true" />
              <button type="button" onClick={() => navigate("/findpw")}>
                비밀번호 찾기
              </button>
            </div>

            {errorMsg ? <p className="error">{errorMsg}</p> : null}

            <button
              type="submit"
              className="login-primary"
              disabled={isLoading}
            >
              {isLoading ? "로그인 중..." : "로그인"}
            </button>

            <div className="login-divider" />

            <div className="signup-row">
              <div className="signup-copy">
                회원가입하고 <strong>BrandPliot</strong>의<br />
                <strong>더 많은 컨설팅</strong>를 받아보세요!
              </div>
              <button
                type="button"
                className="signup-cta"
                onClick={goSignup}
                onMouseEnter={warmSignupPage}
                onFocus={warmSignupPage}
                disabled={isLoading}
              >
                회원가입
              </button>
            </div>
          </form>
        </section>

        {/* Right: 소개 영역 */}
        <section className="login-hero navy-panel">
          <div className="hero-top">
            <span className="hero-title-line">여러분의 새로운 시작</span>
            <span className="hero-title-line">BRANDPILOT이 함께 합니다.</span>
          </div>

          <div className="feature-marquee" aria-label="서비스 핵심 기능">
            <div className="marquee-track">
              <div className="marquee-card">
                <img src={namingLogoImg} alt="네이밍 로고 추천" loading="eager" decoding="async" fetchPriority="high" />
                <strong>네이밍·로고 추천</strong>
                <p>요구사항에 맞는 네이밍과 로고를 추천해드립니다.</p>
              </div>

              <div className="marquee-card">
                <img src={marqueeImages.analyzeCompany || TRANSPARENT_PIXEL} alt="기업 진단 분석" loading="lazy" decoding="async" />
                <strong>기업 진단분석</strong>
                <p>초기 상황을 분석하여 최적의 제안을 해드립니다.</p>
              </div>

              <div className="marquee-card">
                <img src={marqueeImages.analyzeReport || TRANSPARENT_PIXEL} alt="분석기반 리포트" loading="lazy" decoding="async" />
                <strong>분석 리포트 제공</strong>
                <p>분석 내용 기반 리포트를 제공합니다.</p>
              </div>

              <div className="marquee-card">
                <img src={marqueeImages.story || TRANSPARENT_PIXEL} alt="스토리텔링" loading="lazy" decoding="async" />
                <strong>스타트업 스토리텔링</strong>
                <p>기업 관련 소개글 등 기업관련 홍보글을 생성해줍니다.</p>
              </div>

              <div className="marquee-card" aria-hidden="true">
                <img src={namingLogoImg} alt="" loading="lazy" decoding="async" />
                <strong>네이밍·로고 추천</strong>
                <p>요구사항에 맞는 네이밍과 로고를 추천해드립니다.</p>
              </div>

              <div className="marquee-card" aria-hidden="true">
                <img src={marqueeImages.analyzeCompany || TRANSPARENT_PIXEL} alt="" loading="lazy" decoding="async" />
                <strong>기업 진단분석</strong>
                <p>초기 상황을 분석하여 최적의 제안을 해드립니다.</p>
              </div>

              <div className="marquee-card" aria-hidden="true">
                <img src={marqueeImages.analyzeReport || TRANSPARENT_PIXEL} alt="" loading="lazy" decoding="async" />
                <strong>분석 리포트 제공</strong>
                <p>분석 내용 기반 리포트를 제공합니다.</p>
              </div>

              <div className="marquee-card" aria-hidden="true">
                <img src={marqueeImages.story || TRANSPARENT_PIXEL} alt="" loading="lazy" decoding="async" />
                <strong>스타트업 스토리텔링</strong>
                <p>기업 관련 소개글 등 기업관련 홍보글을 생성해줍니다.</p>
              </div>
            </div>
          </div>

          <footer className="hero-footer">
            <div className="hero-footer-links">
              <button
                type="button"
                className="hero-footer-link"
                onClick={() => setOpenType("privacy")}
              >
                개인정보 처리방침
              </button>
              <span className="hero-footer-sep">|</span>
              <button
                type="button"
                className="hero-footer-link"
                onClick={() => setOpenType("terms")}
              >
                이용약관
              </button>
            </div>

            <div className="hero-footer-text">
              <div>
                <strong>BRANDPILOT</strong>
              </div>
              <div>
                BRANDPILOT | 대전광역시 서구 문정로48번길 30 (탄방동, KT타워)
              </div>
              <div>KT AIVLE 7반 15조</div>
              <div className="hero-footer-copy">
                © 2026 Team15 Corp. All rights reserved.
              </div>
            </div>
          </footer>
        </section>
      </div>
    </div>
  );
}
