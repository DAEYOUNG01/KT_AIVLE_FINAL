// src/pages/Promotion.jsx
import React, { useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";

import bannerImage from "../Image/banner_image/Banner_P.webp";
import iconImage from "../Image/promotion_image/ProductIcon.webp";
import aiCutImage from "../Image/promotion_image/AICutModel.webp";
import stagingImage from "../Image/promotion_image/ProductStaging.webp";
import posterImage from "../Image/promotion_image/SNSPoster.webp";

import SiteHeader from "../components/SiteHeader.jsx";
import SiteFooter from "../components/SiteFooter.jsx";

import PolicyModal from "../components/PolicyModal.jsx";
import { PrivacyContent, TermsContent } from "../components/PolicyContents.jsx";
import { notifyPromoInterviewComingSoon } from "../utils/promoComingSoon.js";
import "../styles/Promotion.css";

export default function PromotionPage({ onLogout }) {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // ✅ 약관/방침 모달
  const [openType, setOpenType] = useState(null);
  const closeModal = () => setOpenType(null);

  // ✅ 헤더 드롭다운에서 선택된 service (query or state)
  const pickedService = useMemo(() => {
    const q = searchParams.get("service");
    if (q) return q;
    return location.state?.service || null;
  }, [searchParams, location.state]);

  // ✅ 카드 클릭 이동
  const blockPromoInterviewEntry = () => {
    notifyPromoInterviewComingSoon();
  };

  const handleIcon = () => blockPromoInterviewEntry();
  const handleAICut = () => blockPromoInterviewEntry();
  const handleStaging = () => blockPromoInterviewEntry();
  const handlePoster = () => blockPromoInterviewEntry();

  const onPromoPick = (action) => {
    // 필요하면 여기서 추가 동작 가능 (지금은 알럿만 유지)
    const map = {
      icon: "제품 아이콘",
      aicut: "AI컷 모델",
      staging: "제품 연출컷",
      poster: "SNS 제품 포스터",
    };
    // alert(`${map[action]} 이동(테스트)`);
  };

  return (
    <div className="promo-page">
      {/* ✅ 약관/방침 모달 */}
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

      {/* ✅ 공통 헤더 */}
      <SiteHeader onLogout={onLogout} onPromoPick={onPromoPick} />

      {/* ✅ Hero */}
      <section className="promo-hero">
        <div className="promo-hero-inner">
          <div className="promo-banner" aria-label="홍보물컨설팅 소개">
            <img
              src={bannerImage}
              alt="홍보물컨설팅 배너"
              className="promo-banner-image"
            />
            <div className="promo-banner-text">
              <div className="promo-carousel">
                {/* <div className="promo-slide">
                  <strong>홍보물컨설팅</strong>
                  <span>브랜드 메시지를 효과적으로 전달합니다.</span>
                </div> */}
                <div className="promo-slide">
                  <strong>제품 아이콘 컨설팅</strong>
                  <span>앱/상품 아이콘 방향·키워드·프롬프트를 제안합니다.</span>
                </div>
                <div className="promo-slide">
                  <strong>AI컷 모델 컨설팅</strong>
                  <span>모델 톤, 스타일, 배경/조명을 설계합니다.</span>
                </div>
                <div className="promo-slide">
                  <strong>제품 연출컷 컨설팅</strong>
                  <span>연출 컨셉, 소품, 구도, 무드를 구성합니다.</span>
                </div>
                <div className="promo-slide">
                  <strong>SNS 제품 포스터 컨설팅</strong>
                  <span>카피/레이아웃/CTA까지 한 장으로 정리합니다.</span>
                </div>
              </div>

              {/* 필요하면 사용 */}
              {/* {pickedService ? (
                <div style={{ marginTop: 14, fontSize: 14, opacity: 0.9 }}>
                  선택된 메뉴: <b>{pickedService}</b>
                </div>
              ) : null} */}
            </div>
          </div>
        </div>
      </section>

      {/* ✅ Content */}
      <main className="promo-content">
        <section className="promo-intro">
          <h2 className="section-title">서비스 선택</h2>
          <p className="promo-subtitle">
            홍보물 컨설팅은 <b>4개의 독립 서비스</b>로 구성됩니다. 필요한
            서비스만 선택해서 진행하세요.
          </p>
        </section>

        <section className="promo-grid">
          <div className="promo-cards">
            <article
              className="promo-card"
              role="button"
              tabIndex={0}
              onClick={handleIcon}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") handleIcon();
              }}
            >
              <div className="promo-card-image">
                <img src={iconImage} alt="제품 아이콘 컨설팅" />
              </div>
              <p className="promo-card-tag">Icon Consulting</p>
              <h3>제품 아이콘 컨설팅</h3>
              <div className="promo-card-meta">
                <span>아이콘 방향·키워드·스타일·프롬프트를 제안합니다.</span>
                <span>↗</span>
              </div>
            </article>

            <article
              className="promo-card"
              role="button"
              tabIndex={0}
              onClick={handleAICut}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") handleAICut();
              }}
            >
              <div className="promo-card-image">
                <img src={aiCutImage} alt="AI컷 모델 컨설팅" />
              </div>
              <p className="promo-card-tag">AI Cut Model</p>
              <h3>AI컷 모델 컨설팅</h3>
              <div className="promo-card-meta">
                <span>모델/의상/포즈/배경/조명까지 한 번에 설계합니다.</span>
                <span>↗</span>
              </div>
            </article>

            <article
              className="promo-card"
              role="button"
              tabIndex={0}
              onClick={handleStaging}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") handleStaging();
              }}
            >
              <div className="promo-card-image">
                <img src={stagingImage} alt="제품 연출컷 컨설팅" />
              </div>
              <p className="promo-card-tag">Staging Cut</p>
              <h3>제품 연출컷 컨설팅</h3>
              <div className="promo-card-meta">
                <span>연출 컨셉·소품·구도·무드·프롬프트를 제안합니다.</span>
                <span>↗</span>
              </div>
            </article>

            <article
              className="promo-card"
              role="button"
              tabIndex={0}
              onClick={handlePoster}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") handlePoster();
              }}
            >
              <div className="promo-card-image">
                <img src={posterImage} alt="SNS 제품 포스터 컨설팅" />
              </div>
              <p className="promo-card-tag">SNS Poster</p>
              <h3>SNS 제품 포스터 컨설팅</h3>
              <div className="promo-card-meta">
                <span>카피/레이아웃/CTA까지 ‘한 장’ 구성으로 정리합니다.</span>
                <span>↗</span>
              </div>
            </article>
          </div>
        </section>
      </main>

      {/* ✅ 공통 푸터 */}
      <SiteFooter onOpenPolicy={setOpenType} />
    </div>
  );
}
