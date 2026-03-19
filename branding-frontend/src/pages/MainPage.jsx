// src/pages/MainPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/MainPage.css";

// UI: 메인 카드(컨설팅 시작하기)에서 사용하는 이미지 에셋
import makeset from "../Image/main_image/brand_consult2.webp";
import story from "../Image/main_image/Promotional_consulting2.webp";
import mainBanner from "../Image/banner_image/Banner_B.webp";

// UI: 약관/개인정보 모달 + 공통 헤더/푸터
import PolicyModal from "../components/PolicyModal.jsx";
import { PrivacyContent, TermsContent } from "../components/PolicyContents.jsx";
import SiteFooter from "../components/SiteFooter.jsx";
import SiteHeader from "../components/SiteHeader.jsx";

import { apiRequest } from "../api/client.js";

// ✅ 브랜드 컨설팅(원큐) 진행 데이터 확인 + 리셋
import {
  readPipeline,
  resetBrandConsultingToDiagnosisStart,
} from "../utils/brandPipelineStorage.js";

export default function MainPage({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ 로그인 직후 진입 시 아주 약한 줌인 연출
  const [isEntryFromLogin, setIsEntryFromLogin] = useState(
    Boolean(location?.state?.fromLoginTransition),
  );

  // ✅ 약관/방침 모달
  const [openType, setOpenType] = useState(null);
  const closeModal = () => setOpenType(null);

  // ✅ 브랜드 컨설팅 진행 안내(가이드) 모달
  const [brandGuideMode, setBrandGuideMode] = useState(null);
  const openBrandGuideStart = () => setBrandGuideMode("start");
  const openBrandGuideSteps = () => setBrandGuideMode("steps");
  const closeBrandGuide = () => setBrandGuideMode(null);
  const openBrandGuide = brandGuideMode !== null;

  // ✅ 브랜드(기업진단 포함) 진행 데이터 여부
  const hasAnyBrandProgress = useMemo(() => {
    const p = readPipeline() || {};

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
  }, []);

  const brandCtaLabel = "기업진단 인터뷰부터 시작하기";

  // ✅ 좌측 패널(진행중/이어하기) + 배너 CTA에서 사용할 진행 상태
  const brandProgress = useMemo(() => {
    const p = readPipeline() || {};

    // 2025-02-05
    // 네이밍이 이어하기가 되지 않아 수정
    const hasDiagnosis = Boolean(
      (typeof p?.diagnosisSummary === "string" && p.diagnosisSummary.trim()) ||
      p?.diagnosisSummary?.companyName ||
      p?.diagnosisSummary?.oneLine,
    );
    const hasNaming = Boolean(p?.naming?.selectedId || p?.naming?.selected);
    const hasConcept = Boolean(p?.concept?.selectedId || p?.concept?.selected);
    const hasStory = Boolean(p?.story?.selectedId || p?.story?.selected);
    const hasLogo = Boolean(p?.logo?.selectedId || p?.logo?.selected);
    const brandId = p?.brandId ?? null;

    // ✅ 단계별 다음 라우트/진행률
    if (hasLogo) {
      return {
        percent: 100,
        status: "완료",
        stepLabel: "브랜드 컨설팅 완료",
        ctaLabel: "결과 보기",
        nextRoute: "/mypage",
        brandId,
      };
    }

    if (hasStory) {
      return {
        percent: 80,
        status: "진행중",
        stepLabel: "로고 컨설팅",
        ctaLabel: "이어하기",
        nextRoute: "/brand/logo/interview",
        brandId,
      };
    }

    if (hasConcept) {
      return {
        percent: 60,
        status: "진행중",
        stepLabel: "스토리 컨설팅",
        ctaLabel: "이어하기",
        nextRoute: "/brand/story/interview",
        brandId,
      };
    }

    if (hasNaming) {
      return {
        percent: 40,
        status: "진행중",
        stepLabel: "컨셉 컨설팅",
        ctaLabel: "이어하기",
        nextRoute: "/brand/concept/interview",
        brandId,
      };
    }

    if (hasDiagnosis) {
      return {
        percent: 20,
        status: "진행중",
        stepLabel: "네이밍 컨설팅",
        ctaLabel: "이어하기",
        nextRoute: "/brand/naming/interview",
        brandId,
      };
    }

    return {
      percent: 0,
      status: "시작 전",
      stepLabel: "기업진단부터 시작",
      ctaLabel: "바로 시작",
      nextRoute: "/diagnosisinterview",
      brandId,
    };
  }, []);

  // ✅ 투자유치(투자 게시판) 미리보기: 투자게시판과 동일한 데이터 사용
  const [dealItems, setDealItems] = useState([]);
  const [dealLoading, setDealLoading] = useState(false);
  const [dealError, setDealError] = useState("");

  useEffect(() => {
    let mounted = true;

    const fetchDealPosts = async () => {
      setDealLoading(true);
      setDealError("");
      try {
        const data = await apiRequest("/brands/posts");
        const list = Array.isArray(data) ? data : [];

        // ✅ InvestmentBoard.jsx와 동일한 매핑을 사용(필드명 차이 대응)
        const mapped = list.map((item) => ({
          id: item.postId ?? item.id,
          name: item.companyName || "회사명",
          oneLiner: item.shortDescription || "",
          logoImageUrl: item.logoImageUrl || "",
          tags: Array.isArray(item.hashtags)
            ? item.hashtags.map((tag) => String(tag).trim()).filter(Boolean)
            : [],
          region: item.region || "",
          companySize: item.companySize || "",
          updatedAt: item.updatedAt ? String(item.updatedAt).slice(0, 10) : "",
        }));

        // 최신순 정렬 (updatedAt이 없으면 뒤로)
        mapped.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));

        if (mounted) setDealItems(mapped);
      } catch (err) {
        console.error(err);
        if (mounted) setDealError("투자유치 게시글을 불러오지 못했습니다.");
      } finally {
        if (mounted) setDealLoading(false);
      }
    };

    fetchDealPosts();
    return () => {
      mounted = false;
    };
  }, []);

  const dealPreview = useMemo(() => {
    return (Array.isArray(dealItems) ? dealItems : []).slice(0, 3);
  }, [dealItems]);

  const handleStartBrandFromDiagnosis = () => {
    // ✅ 메인에서 바로 진입 시에도 단계 안내를 먼저 보여줌
    openBrandGuideStart();
  };

  const handleOpenStepGuide = () => {
    // ✅ 단계 보기: 라우팅 없이 모달로 안내
    openBrandGuideSteps();
  };

  const proceedStartBrandFromDiagnosis = () => {
    // ✅ 실제 시작(초기화 포함)은 모달에서 "바로 시작"을 눌렀을 때만 진행
    if (hasAnyBrandProgress) {
      const ok = window.confirm(
        "진행 중인 브랜드 컨설팅 데이터가 있어요.\n기업진단부터 다시 시작하면 진행 데이터가 초기화됩니다.\n계속할까요?",
      );
      if (!ok) return;
      resetBrandConsultingToDiagnosisStart("mainpage_restart");
    }
    closeBrandGuide();
    navigate("/diagnosisinterview?mode=start", { state: { mode: "start" } });
  };

  useEffect(() => {
    if (!isEntryFromLogin) return;
    const timer = window.setTimeout(() => setIsEntryFromLogin(false), 360);
    return () => window.clearTimeout(timer);
  }, [isEntryFromLogin]);

  return (
    <div
      className={`main-page ${isEntryFromLogin ? "main-page--entry-from-login" : ""}`}
    >
      {/* ✅ 개인정보/약관 모달 */}
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

      {/* ✅ 브랜드 컨설팅 진행 안내 모달 (메인에서 바로 시작할 때도 안내 제공) */}
      <PolicyModal
        open={openBrandGuide}
        title="브랜드 컨설팅 진행 안내"
        onClose={closeBrandGuide}
      >
        <div className="mp-guide">
          <p className="mp-guide__lead">
            브랜드 컨설팅은 아래 순서로 <strong>원큐</strong>로 진행돼요.
          </p>

          <div
            className="mp-steps mp-steps--guide"
            aria-label="브랜드 컨설팅 진행 단계"
          >
            <span className="mp-step">기업진단</span>
            <span className="mp-step__arrow" aria-hidden="true">
              →
            </span>
            <span className="mp-step">네이밍</span>
            <span className="mp-step__arrow" aria-hidden="true">
              →
            </span>
            <span className="mp-step">컨셉</span>
            <span className="mp-step__arrow" aria-hidden="true">
              →
            </span>
            <span className="mp-step">스토리</span>
            <span className="mp-step__arrow" aria-hidden="true">
              →
            </span>
            <span className="mp-step">로고</span>
          </div>

          <ul className="mp-guide__bullets">
            <li>중간에 나가도 저장되어, 이어서 진행할 수 있어요.</li>
            <li>
              기업진단부터 시작하면 네이밍·컨셉·스토리·로고로 자연스럽게
              이어집니다.
            </li>
          </ul>

          {brandGuideMode === "start" && hasAnyBrandProgress && (
            <div className="mp-warn">
              진행 데이터가 있어요. 기업진단부터 다시 시작하면 진행 데이터가
              초기화됩니다.
            </div>
          )}

          <div className="mp-guide__actions">
            {brandGuideMode === "start" ? (
              <button
                type="button"
                className="mp-cta"
                onClick={proceedStartBrandFromDiagnosis}
              >
                {brandCtaLabel}
              </button>
            ) : (
              <button
                type="button"
                className="mp-cta"
                onClick={closeBrandGuide}
              >
                확인
              </button>
            )}
          </div>
        </div>
      </PolicyModal>

      {/* ✅ 공통 헤더 */}
      <SiteHeader onLogout={onLogout} />

      <main className="main-content">
        {/* ✅ 상단: 좌측 진행 패널 + 우측 배너 */}
        <section className="mp-topgrid" aria-label="브랜드 컨설팅 시작 섹션">
          <aside className="mp-side" aria-label="브랜드 컨설팅 진행 패널">
            <div className="mp-side__head">
              <p className="mp-side__badge">BRAND</p>
              <h3 className="mp-side__title">브랜드 컨설팅</h3>
              <p className="mp-side__desc">
                기업진단부터 로고까지 한 번에 완성하는 원큐 플로우
              </p>
            </div>

            <div className="mp-side__progress">
              <div className="mp-side__row">
                <span className="mp-side__status">{brandProgress.status}</span>
                <span className="mp-side__pct">{brandProgress.percent}%</span>
              </div>
              <div className="mp-progress" aria-hidden="true">
                <div
                  className="mp-progress__bar"
                  style={{ width: `${brandProgress.percent}%` }}
                />
              </div>
              <p className="mp-side__step">
                현재 단계: {brandProgress.stepLabel}
              </p>
            </div>

            <div className="mp-side__actions">
              <button
                type="button"
                className="mp-side__primary"
                onClick={() => {
                  // ✅ 시작 전이면 안내 모달을 먼저 노출
                  if (brandProgress.percent === 0) {
                    openBrandGuideStart();
                    return;
                  }
                  // 완료면 결과, 진행중이면 다음 단계로
                  navigate(brandProgress.nextRoute, {
                    state: {
                      flow: "brand_continue",
                      brandId: brandProgress.brandId ?? undefined,
                    },
                  });
                }}
              >
                {brandProgress.ctaLabel}
              </button>

              <button
                type="button"
                className="mp-side__ghost"
                onClick={handleOpenStepGuide}
              >
                단계 보기
              </button>
            </div>
          </aside>

          {/* ✅ 메인 배너 */}
          <div className="mp-hero" aria-label="AI 컨설팅 배너">
            <img
              className="mp-hero__img"
              src={mainBanner}
              alt="AI 컨설팅 배너"
            />
            <div className="mp-hero__overlay">
              <p className="mp-hero__kicker">AI 기반 컨설팅 허브</p>
              <p className="mp-hero__sub">
                브랜드 컨설팅은 <strong>기업진단부터 로고까지</strong> 원큐로
                진행돼요.
                <br />
                아래에서 브랜드 컨설팅을 선택해 바로 시작할 수 있어요.
              </p>
            </div>
          </div>
        </section>

        <h2 className="mp-section-title">컨설팅 시작하기</h2>

        {/* ✅ 카드 2개만 */}
        <div className="mp-card-grid">
          {/* 1) 브랜드 컨설팅(기업진단 포함) */}
          <article
            className="mp-card mp-card--brand"
            aria-label="브랜드 컨설팅 카드"
          >
            <div
              className="mp-card__image mp-card__image--brand"
              aria-hidden="true"
            >
              <img src={makeset} alt="" />
            </div>

            <div className="mp-card__body">
              <p className="mp-card__tag">Brand Consulting · One Queue</p>
              <h3 className="mp-card__title">브랜드 컨설팅 (기업진단 포함)</h3>
              <p className="mp-card__desc">
                기업진단을 시작으로 네이밍·컨셉·스토리·로고까지 한 흐름으로
                완성합니다.
              </p>

              <div className="mp-steps" aria-label="브랜드 컨설팅 진행 순서">
                <span className="mp-step">기업진단</span>
                <span className="mp-step__arrow" aria-hidden="true">
                  →
                </span>
                <span className="mp-step">네이밍</span>
                <span className="mp-step__arrow" aria-hidden="true">
                  →
                </span>
                <span className="mp-step">컨셉</span>
                <span className="mp-step__arrow" aria-hidden="true">
                  →
                </span>
                <span className="mp-step">스토리</span>
                <span className="mp-step__arrow" aria-hidden="true">
                  →
                </span>
                <span className="mp-step">로고</span>
              </div>

              {hasAnyBrandProgress && (
                <div className="mp-warn">
                  진행 데이터가 있어요. 다시 시작하면 초기화됩니다.
                </div>
              )}

              <div className="mp-actions">
                <button
                  type="button"
                  className="mp-cta"
                  onClick={handleStartBrandFromDiagnosis}
                >
                  {brandCtaLabel}
                </button>

                <div className="mp-subactions">
                  <button
                    type="button"
                    className="mp-link"
                    onClick={() => navigate("/brandconsulting")}
                  >
                    소개 보기
                  </button>
                </div>
              </div>
            </div>
          </article>

          {/* 2) 홍보물 컨설팅 */}
          <article
            className="mp-card mp-card--clickable"
            role="button"
            tabIndex={0}
            onClick={() => navigate("/promotion")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") navigate("/promotion");
            }}
            aria-label="홍보물 컨설팅 카드"
          >
            <div
              className="mp-card__image mp-card__image--promo"
              aria-hidden="true"
            >
              <img src={story} alt="" />
            </div>

            <div className="mp-card__body">
              <p className="mp-card__tag">Promotional Consulting</p>
              <h3 className="mp-card__title">홍보물 컨설팅</h3>
              <p className="mp-card__desc">
                제품 아이콘, AI컷, 연출컷, 포스터 등 홍보물을 목적에 맞게
                제안합니다.
              </p>

              <div className="mp-pills" aria-label="홍보물 컨설팅 종류">
                <span className="mp-pill">제품 아이콘</span>
                <span className="mp-pill">AI컷 모델</span>
                <span className="mp-pill">제품 연출컷</span>
                <span className="mp-pill">SNS 포스터</span>
              </div>
            </div>
          </article>
        </div>

        {/* ===== 투자 유치 게시판(틀 유지) ===== */}
        <section className="deal-board" aria-label="투자 유치 게시판">
          <div className="deal-header">
            <div className="deal-header-main">
              <p className="deal-eyebrow">
                투자자와 기업을 연결하는 기업 홍보 공간입니다.
              </p>
              <h3 className="deal-title">투자 라운지</h3>
              <div className="deal-status-row" aria-hidden="true">
                <span className="deal-status-pill">실시간 업데이트</span>
                <span className="deal-count-pill">
                  게시글 {dealLoading ? "-" : dealItems.length}건
                </span>
              </div>
            </div>

            <button
              type="button"
              className="deal-more"
              onClick={() => navigate("/investment")}
            >
              전체보기 &gt;
            </button>
          </div>

          <div className="deal-grid">
            {dealLoading ? (
              <>
                {Array.from({ length: 3 }).map((_, idx) => (
                  <article key={idx} className="deal-card deal-card--skeleton">
                    <div className="deal-card-head">
                      <div>
                        <h4 className="skeleton-line skeleton-line--title" />
                        <p className="skeleton-line" />
                        <p className="skeleton-line" />
                      </div>
                      <div className="deal-logo skeleton-box" />
                    </div>
                    <div className="deal-tags">
                      <span className="skeleton-pill" />
                      <span className="skeleton-pill" />
                      <span className="skeleton-pill" />
                    </div>
                    <div className="deal-footer">
                      <strong className="skeleton-line skeleton-line--strong" />
                      <button type="button" disabled>
                        불러오는 중
                      </button>
                    </div>
                  </article>
                ))}
              </>
            ) : dealError ? (
              <div className="deal-empty">{dealError}</div>
            ) : dealPreview.length === 0 ? (
              <div className="deal-empty">
                <div className="deal-empty__left">
                  <span className="deal-empty__icon" aria-hidden="true">
                    📌
                  </span>
                  <div className="deal-empty__text">
                    <strong>등록된 게시글이 없습니다.</strong>
                    <p>첫 게시글을 등록하고 투자자에게 회사를 소개해보세요.</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="deal-empty-btn"
                  onClick={() => navigate("/investment/new")}
                >
                  게시글 등록
                </button>
              </div>
            ) : (
              dealPreview.map((it) => {
                const logoText = (it.name || "CO").slice(0, 2).toUpperCase();
                const metaLine = [it.companySize, it.region]
                  .filter(Boolean)
                  .join(" · ");
                const detailPath = `/investment/${it.id}`;

                return (
                  <article
                    key={it.id}
                    className="deal-card deal-card--clickable"
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(detailPath)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ")
                        navigate(detailPath);
                    }}
                    aria-label={`${it.name} 투자유치 게시글`}
                  >
                    <div className="deal-card-head">
                      <div>
                        <h4>{it.name}</h4>
                        <p>{it.oneLiner || "한 줄 소개가 아직 없습니다."}</p>
                        {metaLine ? <p>{metaLine}</p> : null}
                      </div>

                      <div className="deal-logo" aria-hidden="true">
                        {it.logoImageUrl ? (
                          <img
                            className="deal-logo-img"
                            src={it.logoImageUrl}
                            alt=""
                          />
                        ) : (
                          logoText
                        )}
                      </div>
                    </div>

                    <div className="deal-tags">
                      {Array.isArray(it.tags) && it.tags.length > 0 ? (
                        it.tags
                          .slice(0, 3)
                          .map((tag, idx) => (
                            <span key={`${tag}-${idx}`}>#{tag}</span>
                          ))
                      ) : (
                        <span className="deal-tag-empty">태그 없음</span>
                      )}
                    </div>

                    <div className="deal-footer">
                      <strong>
                        {it.updatedAt
                          ? `업데이트: ${it.updatedAt}`
                          : "상세보기"}
                      </strong>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(detailPath);
                        }}
                      >
                        상세보기
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </main>

      <SiteFooter onOpenPolicy={setOpenType} />
    </div>
  );
}
