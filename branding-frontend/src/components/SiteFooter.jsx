import React from "react";
import "../styles/SiteFooter.css";

/**
 * 공통 푸터
 * - 약관/개인정보 처리방침 버튼 클릭 시, 상위 페이지에서 모달 열도록 onOpenPolicy 사용
 *   onOpenPolicy("privacy") / onOpenPolicy("terms")
 */
export default function SiteFooter({ onOpenPolicy }) {
  const openPrivacy = () => {
    if (typeof onOpenPolicy === "function") onOpenPolicy("privacy");
    else alert("개인정보 처리방침 (모달 연결 필요)");
  };

  const openTerms = () => {
    if (typeof onOpenPolicy === "function") onOpenPolicy("terms");
    else alert("이용약관 (모달 연결 필요)");
  };

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__links" aria-label="정책 링크">
          <button
            type="button"
            className="site-footer__link"
            onClick={openPrivacy}
          >
            개인정보 처리방침
          </button>
          <span className="site-footer__sep">|</span>
          <button
            type="button"
            className="site-footer__link"
            onClick={openTerms}
          >
            이용약관
          </button>
        </div>

        <div
          className="site-footer__info"
          role="contentinfo"
          aria-label="운영 정보"
        >
          <div className="site-footer__row">
            <span className="site-footer__label">상호</span>
            <span className="site-footer__value">BRANDPILOT</span>
          </div>
          <div className="site-footer__row">
            <span className="site-footer__label">운영주체</span>
            <span className="site-footer__value">KT AIVLE 8기 7반 15조</span>
          </div>
          <div className="site-footer__row">
            <span className="site-footer__label">주소</span>
            <span className="site-footer__value">
              대전광역시 서구 문정로48번길 30 (탄방동, KT타워)
            </span>
          </div>
          <div className="site-footer__row">
            <span className="site-footer__label">사업자등록번호</span>
            <span className="site-footer__value">
              해당 없음 (교육 프로젝트 단계)
            </span>
          </div>
        </div>

        <div className="site-footer__bottom">
          <div className="site-footer__copy">
            © 2026 BRANDPILOT Team. All rights reserved.
          </div>
          <a className="site-footer__email" href="mailto:aivle8.team15@kt.com">
            문의: aivle8.team15@kt.com
          </a>
        </div>
      </div>
    </footer>
  );
}
