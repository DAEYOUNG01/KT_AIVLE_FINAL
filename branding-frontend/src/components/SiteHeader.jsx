// src/components/SiteHeader.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/SiteHeader.css";

// ✅ JWT 미사용: 토큰 관련 함수 제거하고 loginId만 지움
// ✅ 팀 코드의 백 연동 방식으로 통일
import { apiRequest, clearAccessToken } from "../api/client.js";
import { clearCurrentUserId, clearIsLoggedIn } from "../api/auth.js";

// ✅ 사용자별 localStorage 분리/정리 (user1→logout→user2 로그인 시 데이터 노출 방지)
import { removeLegacyKeys } from "../utils/userLocalStorage.js";
import { USER_DATA_KEYS } from "../utils/userDataKeys.js";

import {
  readPipeline,
  resetBrandConsultingToDiagnosisStart,
} from "../utils/brandPipelineStorage.js";
import { notifyPromoInterviewComingSoon } from "../utils/promoComingSoon.js";

const BRAND_HOME_ROUTE = "/brandconsulting";

const PROMO_INTERVIEW_ROUTES = {
  icon: "/promotion/icon/interview",
  aicut: "/promotion/aicut/interview",
  staging: "/promotion/staging/interview",
  poster: "/promotion/poster/interview",
};

export default function SiteHeader({ onLogout, onBrandPick, onPromoPick }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // ✅ 진단 라우트(브랜드 컨설팅 파이프라인의 0단계로 취급)
  const isDiagnosisRoute =
    pathname === "/diagnosis" ||
    pathname === "/diagnosisinterview" ||
    pathname.startsWith("/diagnosis/");

  // ✅ 브랜드 컨설팅 관련 라우트는 전부 active 처리 (+진단 포함)
  const isBrandRoute =
    isDiagnosisRoute ||
    pathname === BRAND_HOME_ROUTE ||
    pathname === "/logoconsulting" ||
    pathname === "/nameconsulting" ||
    pathname === "/conceptconsulting" ||
    pathname === "/homepageconsulting" ||
    pathname === "/brandstoryconsulting" ||
    pathname === "/namingconsulting" ||
    pathname.startsWith("/brand/") ||
    pathname.startsWith("/brandconsulting/");

  const isPromotionRoute =
    pathname === "/promotion" || pathname.startsWith("/promotion/");

  const isInvestmentRoute =
    pathname === "/investment" || pathname.startsWith("/investment/");

  const isActiveExact = (path) => pathname === path;

  // ===== Brand Progress (진행 데이터 존재 여부만 사용) =====
  const pipeline = useMemo(() => readPipeline(), [pathname]);

  const hasAnyBrandProgress = useMemo(() => {
    const p = pipeline || {};
    const hasDiagnosis = Boolean(
      p?.diagnosisSummary?.companyName || p?.diagnosisSummary?.oneLine,
    );
    const hasNaming = Boolean(p?.naming?.selectedId || p?.naming?.selected);
    const hasConcept = Boolean(p?.concept?.selectedId || p?.concept?.selected);
    const hasStory = Boolean(p?.story?.selectedId || p?.story?.selected);
    const hasLogo = Boolean(p?.logo?.selectedId || p?.logo?.selected);
    const hasFlow = Boolean(p?.brandFlow?.active || p?.brandFlow?.startedAt);

    return (
      hasDiagnosis || hasNaming || hasConcept || hasStory || hasLogo || hasFlow
    );
  }, [pipeline]);

  // ===== Hover Dropdown: Brand =====
  const [brandOpen, setBrandOpen] = useState(false);
  const brandCloseTimerRef = useRef(null);

  const clearBrandCloseTimer = () => {
    if (brandCloseTimerRef.current) {
      clearTimeout(brandCloseTimerRef.current);
      brandCloseTimerRef.current = null;
    }
  };

  const openBrandMenu = () => {
    clearBrandCloseTimer();
    setBrandOpen(true);
  };

  const closeBrandMenu = (delay = 180) => {
    clearBrandCloseTimer();
    brandCloseTimerRef.current = setTimeout(() => setBrandOpen(false), delay);
  };

  // ===== Hover Dropdown: Promotion =====
  const [promoOpen, setPromoOpen] = useState(false);
  const promoCloseTimerRef = useRef(null);

  const clearPromoCloseTimer = () => {
    if (promoCloseTimerRef.current) {
      clearTimeout(promoCloseTimerRef.current);
      promoCloseTimerRef.current = null;
    }
  };

  const openPromoMenu = () => {
    clearPromoCloseTimer();
    setPromoOpen(true);
  };

  const closePromoMenu = (delay = 180) => {
    clearPromoCloseTimer();
    promoCloseTimerRef.current = setTimeout(() => setPromoOpen(false), delay);
  };

  useEffect(() => {
    return () => {
      clearBrandCloseTimer();
      clearPromoCloseTimer();
    };
  }, []);

  const closeAllMenus = () => {
    setBrandOpen(false);
    setPromoOpen(false);
  };

  // ✅ 브랜드 메뉴 클릭: 소개/홈으로 이동
  const handleBrandClick = () => {
    setPromoOpen(false);
    setBrandOpen(false);
    navigate(BRAND_HOME_ROUTE);
    if (typeof onBrandPick === "function") onBrandPick("home");
  };

  // ✅ CTA: 기업진단 인터뷰부터 시작하기 (진행 데이터 있으면 리셋 후 0% 시작)
  const handleStartFromDiagnosis = () => {
    closeAllMenus();

    if (hasAnyBrandProgress) {
      const ok = window.confirm(
        "진행 중인 브랜드 컨설팅 데이터가 있어요.\n기업진단 인터뷰부터 다시 시작하면 진행 데이터가 초기화됩니다.\n계속할까요?",
      );
      if (!ok) return;

      resetBrandConsultingToDiagnosisStart("header_cta_restart");
    }

    navigate("/diagnosisinterview", { state: { mode: "start" } });
    if (typeof onBrandPick === "function") onBrandPick("diagnosis");
  };

  const handlePromoClick = () => {
    setBrandOpen(false);
    setPromoOpen(false);
    navigate("/promotion");
  };

  const handlePromoItem = (action) => {
    setPromoOpen(false);
    setBrandOpen(false);

    const to = PROMO_INTERVIEW_ROUTES[action];
    if (!to) return;

    notifyPromoInterviewComingSoon();
    if (typeof onPromoPick === "function") onPromoPick(action);
  };

  const handleInvestmentClick = () => {
    setBrandOpen(false);
    setPromoOpen(false);
    navigate("/investment");
  };

  // ✅ JWT 미사용 로그아웃: 서버 호출 없이 localStorage만 정리
  const handleLogout = async () => {
    const ok = window.confirm("로그아웃 하시겠습니까?");
    if (!ok) return;

    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } catch (error) {
      console.warn("logout API failed:", error);
    }

    clearAccessToken();
    clearCurrentUserId();
    clearIsLoggedIn();

    removeLegacyKeys(USER_DATA_KEYS);

    if (typeof onLogout === "function") onLogout();

    navigate("/login", { replace: true });
  };

  return (
    <header className="main-header">
      <div
        className="brand"
        role="button"
        tabIndex={0}
        onClick={() => navigate("/main")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") navigate("/main");
        }}
      >
        BRANDPILOT
      </div>

      {/* ✅ 메인 메뉴: 브랜드/홍보물/투자 3개 */}
      <nav className="main-nav" aria-label="주요 메뉴">
        {/* ✅ 브랜드 컨설팅 Hover 드롭다운 */}
        <div
          className={`nav-dropdown ${brandOpen ? "is-open" : ""}`}
          onMouseEnter={() => {
            openBrandMenu();
            setPromoOpen(false);
          }}
          onMouseLeave={() => closeBrandMenu(220)}
          onFocus={() => {
            openBrandMenu();
            setPromoOpen(false);
          }}
          onBlur={() => closeBrandMenu(120)}
        >
          <button
            type="button"
            className={`nav-link nav-dropdown__btn ${
              isBrandRoute ? "is-active" : ""
            }`}
            aria-expanded={brandOpen ? "true" : "false"}
            onClick={handleBrandClick}
            onKeyDown={(e) => {
              if (e.key === "Escape") setBrandOpen(false);
              if (e.key === "ArrowDown") openBrandMenu();
            }}
          >
            브랜드 컨설팅 <span className="nav-dropdown__chev">▾</span>
          </button>

          {/* ✅ 브랜드 드롭다운: "비클릭 프로세스 안내" + CTA만 클릭 */}
          <div
            className="nav-dropdown__panel nav-dropdown__panel--brand"
            role="menu"
            aria-label="브랜드 컨설팅 메뉴"
            onMouseEnter={openBrandMenu}
            onMouseLeave={() => closeBrandMenu(220)}
          >
            <div className="brand-dd">
              <div className="brand-dd__head">
                <div className="brand-dd__badge">원큐 진행</div>
                <div className="brand-dd__title">
                  기업진단부터 로고까지 한 번에 진행돼요
                </div>
                <div className="brand-dd__sub">
                  아래 순서대로 진행되며, 중간 단계로는 바로 들어갈 수 없어요.
                </div>
              </div>

              {/* ✅ 여기 단계는 "설명용"이라 클릭/호버 느낌 제거 */}
              <div
                className="brand-dd__process"
                aria-label="브랜드 컨설팅 진행 순서"
              >
                <ol className="brand-dd__steps">
                  <li className="brand-dd__step">
                    <span className="brand-dd__step-no">01</span>
                    <span className="brand-dd__step-name">기업진단</span>
                  </li>
                  <li className="brand-dd__step">
                    <span className="brand-dd__step-no">02</span>
                    <span className="brand-dd__step-name">네이밍</span>
                  </li>
                  <li className="brand-dd__step">
                    <span className="brand-dd__step-no">03</span>
                    <span className="brand-dd__step-name">컨셉</span>
                  </li>
                  <li className="brand-dd__step">
                    <span className="brand-dd__step-no">04</span>
                    <span className="brand-dd__step-name">스토리</span>
                  </li>
                  <li className="brand-dd__step">
                    <span className="brand-dd__step-no">05</span>
                    <span className="brand-dd__step-name">로고</span>
                  </li>
                </ol>
              </div>

              <div className="brand-dd__note">
                * 중간 단계는 잠겨 있어요. 기업진단부터 시작하면 자동으로 다음
                단계가 열립니다.
              </div>

              <button
                type="button"
                className="brand-dd__cta"
                onClick={handleStartFromDiagnosis}
              >
                기업진단 인터뷰부터 시작하기
              </button>
            </div>
          </div>
        </div>

        {/* ✅ 홍보물 컨설팅 Hover 드롭다운 */}
        <div
          className={`nav-dropdown ${promoOpen ? "is-open" : ""}`}
          onMouseEnter={() => {
            openPromoMenu();
            setBrandOpen(false);
          }}
          onMouseLeave={() => closePromoMenu(220)}
          onFocus={() => {
            openPromoMenu();
            setBrandOpen(false);
          }}
          onBlur={() => closePromoMenu(120)}
        >
          <button
            type="button"
            className={`nav-link nav-dropdown__btn ${
              isPromotionRoute ? "is-active" : ""
            }`}
            aria-expanded={promoOpen ? "true" : "false"}
            onClick={handlePromoClick}
            onKeyDown={(e) => {
              if (e.key === "Escape") setPromoOpen(false);
              if (e.key === "ArrowDown") openPromoMenu();
            }}
          >
            홍보물 컨설팅 <span className="nav-dropdown__chev">▾</span>
          </button>

          <div
            className="nav-dropdown__panel nav-dropdown__panel--promo"
            role="menu"
            aria-label="홍보물 컨설팅 메뉴"
            onMouseEnter={openPromoMenu}
            onMouseLeave={() => closePromoMenu(220)}
          >
            <div className="nav-dropdown__section-title">홍보물 컨설팅 4종</div>
            <div className="nav-dropdown__grid" role="none">
              <button
                type="button"
                className="nav-dropdown__item nav-dropdown__item--mini"
                onClick={() => handlePromoItem("icon")}
              >
                제품 아이콘
              </button>

              <button
                type="button"
                className="nav-dropdown__item nav-dropdown__item--mini"
                onClick={() => handlePromoItem("aicut")}
              >
                AI컷 모델
              </button>

              <button
                type="button"
                className="nav-dropdown__item nav-dropdown__item--mini"
                onClick={() => handlePromoItem("staging")}
              >
                제품 연출컷
              </button>

              <button
                type="button"
                className="nav-dropdown__item nav-dropdown__item--mini"
                onClick={() => handlePromoItem("poster")}
              >
                SNS 제품 포스터
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          className={`nav-link ${isInvestmentRoute ? "is-active" : ""}`}
          onClick={handleInvestmentClick}
        >
          투자 라운지
        </button>
      </nav>

      <div className="account-nav">
        <button
          type="button"
          className={`nav-link ${isActiveExact("/main") ? "is-active" : ""}`}
          onClick={() => navigate("/main")}
        >
          홈
        </button>

        <button
          type="button"
          className={`nav-link ${isActiveExact("/mypage") ? "is-active" : ""}`}
          onClick={() => navigate("/mypage")}
        >
          마이페이지
        </button>

        <button type="button" className="nav-link" onClick={handleLogout}>
          로그아웃
        </button>
      </div>
    </header>
  );
}
