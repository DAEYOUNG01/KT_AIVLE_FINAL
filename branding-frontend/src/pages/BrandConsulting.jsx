// src/pages/BrandConsulting.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import bannerImage from "../Image/banner_image/Banner_B.webp";

// ✅ 기업진단 단계(추가)
import diagnosisImg from "../Image/brandcon_image/diagnosis.webp";
import Logocon from "../Image/brandcon_image/logo_consulting.webp";
import namecon from "../Image/brandcon_image/naming.webp";
import conceptcon from "../Image/brandcon_image/concept_consulting.webp";
import storycon from "../Image/brandcon_image/brand_story.webp";

import PolicyModal from "../components/PolicyModal.jsx";
import { PrivacyContent, TermsContent } from "../components/PolicyContents.jsx";

import SiteFooter from "../components/SiteFooter.jsx";
import SiteHeader from "../components/SiteHeader.jsx";

import {
  migrateLegacyToPipelineIfNeeded,
  readPipeline,
  ensureStrictStepAccess,
  setBrandFlowCurrent,
  resetBrandConsultingToDiagnosisStart,
} from "../utils/brandPipelineStorage.js";
import { fetchMyBrands } from "../api/mypage.js";
import "../styles/BrandConsulting.css";

export default function BrandConsulting({ onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [openType, setOpenType] = useState(null);
  const closeModal = () => setOpenType(null);

  // ✅ pipeline 상태(브랜드 컨설팅 흐름의 단일 소스)
  const [pipeline, setPipeline] = useState(() => readPipeline());
  const [hasCompletedHistory, setHasCompletedHistory] = useState(false);

  // ✅ 1회 마이그레이션 + 상태 동기화
  useEffect(() => {
    const next = migrateLegacyToPipelineIfNeeded();
    setPipeline(next);
  }, []);

  // ✅ 마이페이지 완료 이력 확인(하단 리포트 버튼 활성화 기준)
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const rows = await fetchMyBrands();
        const arr = Array.isArray(rows) ? rows : [];
        const hasFinal = arr.some(
          (d) =>
            String(d?.currentStep || "")
              .trim()
              .toUpperCase() === "FINAL",
        );
        if (alive) setHasCompletedHistory(hasFinal);
      } catch {
        // API 실패 시에는 기존 화면 로직으로 동작
        if (alive) setHasCompletedHistory(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const pickedSection = location.state?.section || null;

  const steps = useMemo(
    () => [
      {
        key: "diagnosis",
        title: "기업진단 & 인터뷰",
        sub: "브랜드 컨설팅의 기준 데이터(요약)를 만들기 위한 기업진단 단계",
        img: diagnosisImg,
        tag: "Diagnosis",
        route: "/diagnosisinterview",
      },
      {
        key: "naming",
        title: "네이밍",
        sub: "기업진단 요약을 바탕으로 네이밍 3안을 제안",
        img: namecon,
        tag: "Naming",
        route: "/brand/naming/interview",
      },
      {
        key: "concept",
        title: "컨셉",
        sub: "선택한 네이밍 + 기업진단 요약으로 컨셉 3안을 제안",
        img: conceptcon,
        tag: "Concept",
        route: "/brand/concept/interview",
      },
      {
        key: "story",
        title: "브랜드 스토리",
        sub: "선택한 컨셉 기반으로 설득력 있는 스토리 3안을 제안",
        img: storycon,
        tag: "Story",
        route: "/brand/story",
      },
      {
        key: "logo",
        title: "로고",
        sub: "선택한 스토리/컨셉에 맞춘 로고 방향 3안을 제안",
        img: Logocon,
        tag: "Logo",
        route: "/brand/logo/interview",
      },
    ],
    [],
  );

  const rawStatus = useMemo(() => {
    const hasDiagnosis = Boolean(
      (typeof pipeline?.diagnosisSummary === "string" &&
        pipeline.diagnosisSummary.trim()) ||
      pipeline?.diagnosisSummary?.shortText ||
      pipeline?.diagnosisSummary?.companyName ||
      pipeline?.diagnosisSummary?.oneLine,
    );
    const hasNaming = Boolean(
      pipeline?.naming?.selectedId || pipeline?.naming?.selected,
    );
    const hasConcept = Boolean(
      pipeline?.concept?.selectedId || pipeline?.concept?.selected,
    );
    const hasStory = Boolean(
      pipeline?.story?.selectedId || pipeline?.story?.selected,
    );
    const hasLogo = Boolean(
      pipeline?.logo?.selectedId || pipeline?.logo?.selected,
    );

    return { hasDiagnosis, hasNaming, hasConcept, hasStory, hasLogo };
  }, [pipeline]);

  const pipelineBrandId = pipeline?.brandId ?? null;

  // ✅ 완료 이력이 있는 상태에서는 홈에서 수정 금지(새 진단부터만 시작)
  const isPipelineCompleted =
    rawStatus.hasDiagnosis &&
    rawStatus.hasNaming &&
    rawStatus.hasConcept &&
    rawStatus.hasStory &&
    rawStatus.hasLogo;

  const isCompletedLockMode = isPipelineCompleted;

  // 화면 표시는 "처음 시작"처럼 보이게
  const status = useMemo(() => {
    if (!isCompletedLockMode) return rawStatus;
    return {
      hasDiagnosis: false,
      hasNaming: false,
      hasConcept: false,
      hasStory: false,
      hasLogo: false,
    };
  }, [isCompletedLockMode, rawStatus]);

  const unlocked = useMemo(() => {
    const naming = status.hasDiagnosis;
    const concept = status.hasDiagnosis && status.hasNaming;
    const story = status.hasDiagnosis && status.hasNaming && status.hasConcept;
    const logo =
      status.hasDiagnosis &&
      status.hasNaming &&
      status.hasConcept &&
      status.hasStory;
    return { naming, concept, story, logo };
  }, [status]);

  const nextStep = useMemo(() => {
    if (!status.hasDiagnosis) return "diagnosis";
    if (!status.hasNaming) return "naming";
    if (!status.hasConcept) return "concept";
    if (!status.hasStory) return "story";
    if (!status.hasLogo) return "logo";
    return "done";
  }, [status]);

  const nextRoute = useMemo(() => {
    if (nextStep === "diagnosis") return "/diagnosisinterview";
    if (nextStep === "naming") return "/brand/naming/interview";
    if (nextStep === "concept") return "/brand/concept/interview";
    if (nextStep === "story") return "/brand/story";
    if (nextStep === "logo") return "/brand/logo/interview";
    return "/mypage";
  }, [nextStep]);

  const ctaText = useMemo(() => {
    if (nextStep === "diagnosis") return "기업진단 시작하기";
    if (nextStep === "naming") return "네이밍부터 시작하기";
    if (nextStep === "concept") return "컨셉 이어서 진행하기";
    if (nextStep === "story") return "스토리 이어서 진행하기";
    if (nextStep === "logo") return "로고 이어서 진행하기";
    return "마이페이지에서 리포트 보기";
  }, [nextStep]);

  const canViewMyReports = isPipelineCompleted || hasCompletedHistory;

  const startFreshDiagnosis = () => {
    resetBrandConsultingToDiagnosisStart("completed_lock_start_new");
    const next = readPipeline();
    setPipeline(next);
    navigate("/diagnosisinterview?mode=start", { state: { mode: "start" } });
  };

  const handlePrimaryCTA = () => {
    // ✅ 완료 상태에서는 수정 금지 + 새 진단으로만 시작
    if (isCompletedLockMode) {
      startFreshDiagnosis();
      return;
    }

    if (nextStep === "diagnosis") {
      alert(
        "브랜드 컨설팅은 기업진단 요약을 기반으로 진행됩니다. 기업진단을 먼저 완료해주세요.",
      );
      navigate("/diagnosisinterview?mode=start", { state: { mode: "start" } });
      return;
    }

    const access = ensureStrictStepAccess(nextStep);
    if (!access?.ok) {
      const msg =
        access?.reason === "diagnosis_missing"
          ? "기업진단이 완료되지 않았습니다. 기업진단부터 진행해주세요."
          : access?.reason === "naming_missing"
            ? "네이밍 컨설팅 완료 후 접근할 수 있습니다."
            : access?.reason === "concept_missing"
              ? "컨셉 컨설팅 완료 후 접근할 수 있습니다."
              : access?.reason === "story_missing"
                ? "브랜드 스토리 컨설팅 완료 후 접근할 수 있습니다."
                : access?.reason === "no_back"
                  ? "진행 중에는 이전 단계로 돌아갈 수 없습니다."
                  : access?.reason === "no_jump"
                    ? "단계를 건너뛸 수 없습니다. 현재 진행 단계부터 이어서 진행해주세요."
                    : "허용되지 않는 접근입니다.";
      alert(msg);
      navigate(access?.redirectTo || "/brandconsulting", { replace: true });
      return;
    }

    setBrandFlowCurrent(nextStep);
    navigate(nextRoute, {
      state: { flow: "brand", brandId: pipelineBrandId ?? undefined },
    });
  };

  const handleViewFinalReport = () => {
    if (!canViewMyReports) return;
    navigate("/mypage");
  };

  const labelMap = {
    logo: "로고 컨설팅",
    naming: "네이밍 컨설팅",
    homepage: "컨셉 컨설팅",
    story: "브랜드 스토리 컨설팅",
  };

  const diagSummaryText = isCompletedLockMode
    ? ""
    : pipeline?.diagnosisSummary?.shortText || "";

  return (
    <div className="brand-page">
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

      <SiteHeader onLogout={onLogout} />

      <section className="brand-hero">
        <div className="brand-hero-inner">
          <div className="hero-banner" aria-label="브랜딩 컨설팅 소개">
            <img
              src={bannerImage}
              alt="브랜딩 컨설팅 배너"
              className="hero-banner-image"
            />
            <div className="hero-banner-text">
              <div className="bcHero">
                <p className="bcHero__pill">AI Brand Consulting</p>
                <h1 className="bcHero__title">브랜드 컨설팅</h1>
                <p className="bcHero__sub">
                  기업진단 요약 → <b>네이밍 → 컨셉 → 스토리 → 로고</b> 순서로
                  진행되며,
                  <br />각 단계마다 <b>AI 3안</b> 중 하나를 선택해 다음 단계로
                  이어집니다.
                </p>

                {pickedSection ? (
                  <div style={{ marginTop: 14, fontSize: 14, opacity: 0.9 }}>
                    선택된 메뉴:{" "}
                    <b>{labelMap[pickedSection] ?? pickedSection}</b>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="brand-content">
        <div className="bcFlowHeader">
          <div>
            <h2 className="section-title">진행 흐름</h2>
            {/* <p className="bcFlowSub">
              각 단계에서 AI가 <b>3안을 제안</b>하고, 선택한 <b>1안</b>이 다음
              단계로 이어집니다.
            </p> */}
          </div>

          <div className="bcFlowMeta" aria-label="브랜드 컨설팅 요약">
            <span className="bcMetaPill">5단계</span>
            <span className="bcMetaPill">단계별 3안</span>
            <span className="bcMetaPill">선택 기반 연결</span>
          </div>
        </div>

        <section
          className="bcFlowCard service-card service-card--static"
          aria-label="브랜드 컨설팅 진행 순서"
        >
          <div className="bcFlowCard__head">
            <h2>브랜드 컨설팅 진행 순서</h2>
            <p>기업진단 요약 → 네이밍 → 컨셉 → 스토리 → 로고</p>
          </div>

          <div className="bcFlowCard__grid">
            <div>
              <div
                className="bcFlowList"
                role="list"
                aria-label="브랜드 컨설팅 5단계 목록"
              >
                {steps.map((s, idx) => {
                  const isDiagnosisStep = s.key === "diagnosis";

                  const stepUnlocked = isCompletedLockMode
                    ? isDiagnosisStep
                    : isDiagnosisStep
                      ? true
                      : Boolean(unlocked[s.key]);

                  const stepDone = isCompletedLockMode
                    ? false
                    : isDiagnosisStep
                      ? status.hasDiagnosis
                      : Boolean(
                          pipeline?.[s.key]?.selectedId ||
                          pipeline?.[s.key]?.selected,
                        );

                  return (
                    <div
                      key={s.key}
                      className="bcFlowItem"
                      role="listitem"
                      style={{
                        opacity: stepUnlocked ? 1 : 0.55,
                        filter: stepUnlocked ? "none" : "grayscale(0.2)",
                      }}
                    >
                      <div className="bcFlowItem__imgWrap">
                        <div className="bcFlowBadge">STEP {idx + 1}</div>
                        <div className="bcFlowItem__img">
                          <img src={s.img} alt={`${s.title} 예시 이미지`} />
                        </div>
                      </div>

                      <div className="bcFlowItem__text">
                        <p className="bcFlowTag">
                          {s.tag}{" "}
                          {stepDone
                            ? " · 완료"
                            : stepUnlocked
                              ? " · 진행 가능"
                              : " · 잠김"}
                        </p>
                        <h3 className="bcFlowTitle">{s.title}</h3>
                        <p className="bcFlowSub">{s.sub}</p>

                        <div style={{ marginTop: 10 }}>
                          <button
                            type="button"
                            className={`btn ghost ${stepUnlocked ? "" : "disabled"}`}
                            disabled={!stepUnlocked}
                            onClick={() => {
                              if (isCompletedLockMode) {
                                if (isDiagnosisStep) {
                                  startFreshDiagnosis();
                                  return;
                                }

                                alert(
                                  "완료된 컨설팅은 홈에서 수정할 수 없습니다. 새 기업진단으로 다시 시작하거나, 마이페이지에서 기존 리포트를 확인해주세요.",
                                );
                                return;
                              }

                              const access = ensureStrictStepAccess(s.key);
                              if (isDiagnosisStep && access?.ok) {
                                if (status.hasDiagnosis) {
                                  navigate(s.route, {
                                    state: { mode: "resume" },
                                  });
                                } else {
                                  navigate("/diagnosisinterview?mode=start", {
                                    state: { mode: "start" },
                                  });
                                }
                                return;
                              }

                              if (!access?.ok) {
                                const msg =
                                  access?.reason === "diagnosis_missing"
                                    ? "기업진단이 완료되지 않았습니다. 기업진단부터 진행해주세요."
                                    : access?.reason === "naming_missing"
                                      ? "네이밍 컨설팅 완료 후 접근할 수 있습니다."
                                      : access?.reason === "concept_missing"
                                        ? "컨셉 컨설팅 완료 후 접근할 수 있습니다."
                                        : access?.reason === "story_missing"
                                          ? "브랜드 스토리 컨설팅 완료 후 접근할 수 있습니다."
                                          : access?.reason === "no_back"
                                            ? "진행 중에는 이전 단계로 돌아갈 수 없습니다."
                                            : access?.reason === "no_jump"
                                              ? "단계를 건너뛸 수 없습니다. 현재 진행 단계부터 이어서 진행해주세요."
                                              : "허용되지 않는 접근입니다.";
                                alert(msg);
                                navigate(
                                  access?.redirectTo || "/brandconsulting",
                                  {
                                    replace: true,
                                  },
                                );
                                return;
                              }

                              setBrandFlowCurrent(s.key);
                              navigate(s.route, {
                                state: {
                                  flow: "brand",
                                  brandId: pipelineBrandId ?? undefined,
                                },
                              });
                            }}
                          >
                            {isCompletedLockMode
                              ? isDiagnosisStep
                                ? "기업진단 시작"
                                : "잠김 (새 진단 필요)"
                              : isDiagnosisStep
                                ? stepDone
                                  ? "진단 확인/수정"
                                  : "기업진단 시작"
                                : stepDone
                                  ? "결과 확인/수정"
                                  : "이 단계 진행"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <aside
              className="bcFlowActions"
              aria-label="브랜드 컨설팅 시작/리포트"
            >
              <h3 className="bcFlowActions__title">다음 할 일</h3>

              {isCompletedLockMode ? (
                <p className="bcFlowActions__desc">
                  이전 브랜드 컨설팅은 완료되어 홈에서 수정할 수 없습니다.
                  <br />새 브랜드로 진행하려면 <b>기업진단부터 다시 시작</b>
                  하세요.
                </p>
              ) : status.hasDiagnosis ? (
                <p className="bcFlowActions__desc">
                  기업진단 요약이 준비되었습니다.
                  {diagSummaryText ? (
                    <>
                      <br />
                      <span style={{ opacity: 0.9 }}>
                        <b>요약</b> · {diagSummaryText}
                      </span>
                    </>
                  ) : null}
                </p>
              ) : (
                <p className="bcFlowActions__desc">
                  브랜드 컨설팅은 <b>기업진단 요약</b>을 기반으로 단계별 제안을
                  생성합니다.
                  <br />
                  먼저 기업진단을 완료해주세요.
                </p>
              )}

              <div className="bcFlowActions__actions">
                <button
                  type="button"
                  className="btn primary"
                  onClick={handlePrimaryCTA}
                >
                  {ctaText}
                </button>

                <button
                  type="button"
                  className={`btn ghost bcTooltipBtn ${
                    canViewMyReports ? "" : "is-disabled"
                  }`}
                  onClick={handleViewFinalReport}
                  aria-disabled={!canViewMyReports}
                >
                  마이페이지에서 리포트 보기
                  {!canViewMyReports && (
                    <span className="bcTooltip" role="tooltip">
                      완료된 리포트가 아직 없습니다.
                    </span>
                  )}
                </button>

                {!canViewMyReports ? (
                  <p className="bcFlowActions__hint">
                    * 네이밍 → 컨셉 → 스토리 → 로고 선택까지 완료하면 리포트가
                    활성화돼요.
                  </p>
                ) : null}
              </div>
            </aside>
          </div>
        </section>

        <p className="bcBottomCTA__hint" style={{ marginTop: 18 }}>
          * 단계별 선택 결과는 자동 저장되며, 다음 단계 생성에 그대로
          사용됩니다.
        </p>
      </main>

      <SiteFooter onOpenPolicy={setOpenType} />
    </div>
  );
}
