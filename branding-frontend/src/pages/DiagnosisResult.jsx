// src/pages/DiagnosisResult.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import SiteHeader from "../components/SiteHeader.jsx";
import SiteFooter from "../components/SiteFooter.jsx";

import PolicyModal from "../components/PolicyModal.jsx";
import { PrivacyContent, TermsContent } from "../components/PolicyContents.jsx";

// ✅ 사용자별 localStorage 분리(계정마다 독립 진행)
import { userGetItem, userRemoveItem } from "../utils/userLocalStorage.js";
import {
  upsertPipeline,
  startBrandFlow,
  setBrandFlowCurrent,
  ensureBrandIdConsistency,
} from "../utils/brandPipelineStorage.js";
import "../styles/DiagnosisResult.css";
import "../styles/ConsultingUnifiedTheme.css";

const DIAGNOSIS_RESULT_KEY = "diagnosisResult_v1";
const DIAGNOSIS_RESULT_KEY_LEGACY = "diagnosisResult_v1_global";
const DIAGNOSIS_DRAFT_KEYS = [
  "diagnosisInterviewDraft_v1",
  "diagnosisInterviewDraft",
];

function alertBrandIdMismatchAndStop(info) {
  const expected = info?.expectedBrandId ?? "-";
  const incoming = info?.incomingBrandId ?? "-";
  window.alert(
    `기업진단에서 생성된 brandID(${expected})와 다른 ID(${incoming})가 감지되어 컨설팅을 중단합니다.\n진행 중이던 컨설팅은 동일한 brandID로만 이어서 진행할 수 있습니다.`,
  );
}

function safeParse(raw) {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function isPlainObject(v) {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function renderText(v) {
  const s = String(v ?? "").trim();
  return s ? s : "-";
}

function Block({ title, children, subtitle }) {
  return (
    <div className="block">
      <div className="block__title">
        {title}
        {subtitle ? (
          <span
            style={{
              marginLeft: 8,
              fontSize: 12,
              color: "#6b7280",
              fontWeight: 500,
            }}
          >
            {subtitle}
          </span>
        ) : null}
      </div>
      <div className="block__body" style={{ whiteSpace: "pre-wrap" }}>
        {children}
      </div>
    </div>
  );
}

function Card({ title, sub, children, footer }) {
  return (
    <div className="card">
      <div className="card__head">
        <h2>{title}</h2>
        {sub ? <p>{sub}</p> : null}
      </div>
      {children}
      {footer ? <div style={{ marginTop: 12 }}>{footer}</div> : null}
    </div>
  );
}

export default function DiagnosisResult({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [openType, setOpenType] = useState(null);
  const closeModal = () => setOpenType(null);

  // ✅ 브랜드 컨설팅 시작 안내 모달
  const [openBrandStartGuide, setOpenBrandStartGuide] = useState(false);

  // ✅ report 로드: state 우선 → userLocalStorage → localStorage
  const report = useMemo(() => {
    const state = location.state || {};
    const fromState =
      state?.report ||
      state?.result ||
      state?.diagnosisResult ||
      (state?.interviewReport
        ? {
            brandId: state?.brandId ?? null,
            interviewReport: state.interviewReport,
            receivedAt: Date.now(),
          }
        : null);
    if (fromState) return fromState;

    const raw =
      userGetItem(DIAGNOSIS_RESULT_KEY) ||
      userGetItem(DIAGNOSIS_RESULT_KEY_LEGACY) ||
      localStorage.getItem(DIAGNOSIS_RESULT_KEY) ||
      null;

    return safeParse(raw);
  }, [location.state]);

  // =========================================================
  // ✅ 백 응답(flat) 기준 + (추후) nested 구조도 fallback 지원
  // =========================================================

  // 1) flat 값 (FastAPI 더미 응답)
  const flatSummary = report?.summary ?? "";
  const flatAnalysisText = report?.analysis ?? "";
  const flatKeyInsights = report?.key_insights ?? "";

  // ✅ legacy(이전 코드/백 응답) 구조 fallback
  const legacyInterviewReport =
    report?.interviewReport ||
    report?.data?.interviewReport ||
    report?.interview_report ||
    null;

  const legacyUserResult =
    legacyInterviewReport?.user_result ||
    legacyInterviewReport?.userResult ||
    {};

  const legacyRag =
    legacyInterviewReport?.rag_context ||
    legacyInterviewReport?.ragContext ||
    {};

  const legacyRawAnswers =
    legacyRag?.step_1_raw_answers ||
    legacyRag?.step1_raw_answers ||
    legacyRag?.rawAnswers ||
    {};

  // ✅ 입력 요약(필드형) 우선 사용
  const rawQAFields =
    (isPlainObject(report?.raw_qa_fields) && report.raw_qa_fields) ||
    (isPlainObject(report?.rawQaFields) && report.rawQaFields) ||
    (isPlainObject(legacyRawAnswers) && legacyRawAnswers) ||
    {};

  // 2) nested 구조가 있을 경우 fallback (미래 대비)
  const nestedAnalysis =
    report?.analysis && typeof report.analysis === "object"
      ? report.analysis
      : {};
  const nestedOutput = report?.output || {};

  // 3) 화면용 값: flat 우선 → nested fallback
  const uiSummary = String(
    flatSummary ||
      legacyUserResult?.summary ||
      nestedOutput?.summary ||
      nestedAnalysis?.diagnosis_summary ||
      nestedAnalysis?.summary ||
      "",
  ).trim();

  const uiAnalysisText = String(
    (typeof flatAnalysisText === "string" ? flatAnalysisText : "") ||
      nestedAnalysis?.analysis ||
      "",
  ).trim();

  const uiKeyInsights = String(
    flatKeyInsights ||
      nestedAnalysis?.key_insights ||
      nestedAnalysis?.keyInsights ||
      "",
  ).trim();

  const uiKeywords =
    nestedOutput?.keywords ||
    nestedAnalysis?.core_keywords ||
    nestedAnalysis?.keywords ||
    [];

  const uiPerspectives =
    nestedOutput?.perspectives ||
    nestedAnalysis?.multi_perspective_analysis ||
    {};

  // Q&A: 최신 저장(raw_qa) 우선 → (optional) raw_qa_verbose → legacy → nested fallback
  const rawQA =
    (isPlainObject(report?.raw_qa) && Object.keys(report.raw_qa).length > 0
      ? report.raw_qa
      : isPlainObject(report?.raw_qa_verbose) &&
          Object.keys(report.raw_qa_verbose).length > 0
        ? report.raw_qa_verbose
        : isPlainObject(legacyRawAnswers) &&
            Object.keys(legacyRawAnswers).length > 0
          ? legacyRawAnswers
          : nestedAnalysis?.raw_qa) || {};

  const brandId = useMemo(() => {
    return (
      report?.brandId ??
      report?.data?.brandId ??
      legacyInterviewReport?.brandId ??
      location.state?.brandId ??
      null
    );
  }, [report, location.state]);

  const lastSaved = useMemo(() => {
    const t = report?.updatedAt || report?.receivedAt || null;
    if (!t) return "-";
    const d = new Date(t);
    return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString();
  }, [report]);

  const pipelineSyncRef = useRef("");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    if (!report) return;

    const syncKey = `${brandId || "none"}::${String(uiSummary || "").trim()}`;
    if (pipelineSyncRef.current === syncKey) return;
    pipelineSyncRef.current = syncKey;

    const guard = ensureBrandIdConsistency(brandId);
    if (!guard?.ok) {
      alertBrandIdMismatchAndStop(guard);
      navigate(guard.redirectTo || "/brandconsulting", { replace: true });
      return;
    }

    const diagnosisSummaryPayload = {
      shortText: uiSummary || "기업진단 요약",
      companyName:
        rawQAFields?.companyName ||
        rawQAFields?.name ||
        report?.companyName ||
        "",
      oneLine:
        rawQAFields?.serviceDefinition || rawQAFields?.oneLineDefinition || "",
      industry: rawQAFields?.industry || rawQAFields?.businessCategory || "",
      targetPersona: rawQAFields?.targetCustomer || rawQAFields?.target || "",
    };

    upsertPipeline({
      brandId: brandId ?? null,
      diagnosisSummary: diagnosisSummaryPayload,
      updatedAt: Date.now(),
    });

    const started = startBrandFlow({ brandId });
    if (started?.ok === false && started?.reason === "brand_mismatch") {
      alertBrandIdMismatchAndStop(started);
      navigate(started.redirectTo || "/brandconsulting", { replace: true });
      return;
    }

    setBrandFlowCurrent("naming");
  }, [report, brandId, uiSummary, rawQAFields, navigate]);

  const goInterview = () =>
    navigate("/diagnosisinterview", { state: { mode: "resume" } });
  const goHome = () => navigate("/brandconsulting");

  const goBrandConsultingStart = () => {
    if (brandId == null || String(brandId).trim() === "") {
      alert(
        "brandId가 없어 다음 단계로 진행할 수 없습니다.\n기업진단 인터뷰를 다시 진행해주세요.",
      );
      return;
    }
    navigate("/brand/naming/interview", {
      state: { report, brandId, fromDiagnosis: true },
    });
  };

  const handleReset = () => {
    DIAGNOSIS_DRAFT_KEYS.forEach((k) => userRemoveItem(k));
    userRemoveItem(DIAGNOSIS_RESULT_KEY);
    userRemoveItem(DIAGNOSIS_RESULT_KEY_LEGACY);
    localStorage.removeItem(DIAGNOSIS_RESULT_KEY);
    alert("기업진단 입력/결과 데이터를 초기화했습니다.");
    navigate("/diagnosisinterview?mode=start", { state: { mode: "start" } });
  };

  // 입력 요약 카드: 필드형(raw_qa_fields) 우선 → 질문/답변 맵(raw_qa)에서 유추 fallback
  const inputSummaryRows = useMemo(() => {
    const f = rawQAFields || {};
    const qa = rawQA || {};

    const findByQuestionIncludes = (needles) => {
      const ns = (needles || []).map((x) => String(x));
      for (const [q, a] of Object.entries(qa)) {
        const qs = String(q);
        if (ns.some((n) => qs.includes(n))) return a;
      }
      return "";
    };

    const pick = (key, needles) => {
      const v1 = String(f?.[key] ?? "").trim();
      if (v1) return v1;
      const v2 = String(findByQuestionIncludes(needles) ?? "").trim();
      return v2;
    };

    const rows = [
      {
        k: "회사/프로젝트명",
        v: pick("company_name", ["회사/프로젝트명", "회사", "프로젝트명"]),
      },
      { k: "웹사이트", v: pick("website", ["웹사이트", "홈페이지", "URL"]) },
      {
        k: "서비스 정의",
        v: pick("service_definition", ["서비스", "한 문장", "10살"]),
      },
      { k: "Pain Point", v: pick("pain_point", ["문제", "불편", "pain"]) },
      {
        k: "타깃 페르소나",
        v: pick("target_persona", ["핵심 고객층", "고객층", "타깃", "persona"]),
      },
      { k: "USP", v: pick("usp", ["무기", "차별", "USP"]) },
      { k: "성장 단계", v: pick("growth_stage", ["단계", "성장", "stage"]) },
      { k: "산업군", v: pick("industry", ["산업군", "산업", "업종"]) },
      {
        k: "비전 헤드라인",
        v: pick("vision_headline", ["기사", "제목", "헤드라인"]),
      },
    ];
    return rows.filter((x) => String(x.v ?? "").trim());
  }, [rawQAFields, rawQA]);

  const hasReport = Boolean(report);
  const canContinue = brandId != null && String(brandId).trim() !== "";

  // flat 응답은 keywords/persona가 없을 수 있으니
  // summary/analysis/key_insights 중 하나라도 있으면 "AI 내용 있음"으로 판단
  const hasAIContent =
    Boolean(uiSummary) ||
    Boolean(uiAnalysisText) ||
    Boolean(uiKeyInsights) ||
    (Array.isArray(uiKeywords) && uiKeywords.length > 0);

  // ✅ 진행 상태(저장만 되어도 100)
  const progress = hasReport ? 100 : 0;
  const requiredDone = hasReport ? 1 : 0;
  const requiredTotal = 1;

  return (
    <div className="diagResult">
      {/* 정책 모달 */}
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

      {/* 브랜드 컨설팅 시작 안내 모달 */}
      <PolicyModal
        open={openBrandStartGuide}
        title="브랜드 컨설팅 시작 안내"
        onClose={() => setOpenBrandStartGuide(false)}
      >
        <div style={{ lineHeight: 1.7, color: "#111827" }}>
          <div style={{ fontWeight: 900, fontSize: 16 }}>
            네이밍부터 순서대로 진행됩니다.
          </div>

          <div style={{ marginTop: 10, color: "#374151" }}>
            브랜드 컨설팅은 아래 순서로 진행돼요.
          </div>

          <ul style={{ marginTop: 10, paddingLeft: 18, color: "#374151" }}>
            <li>
              진행 순서: <b>네이밍 → 컨셉 → 스토리 → 로고</b>
            </li>
            <li>
              진행 중 이탈(뒤로가기/메뉴 이동/새로고침 등) 시{" "}
              <b>이탈 방지 안내</b>가 표시됩니다.
            </li>
            <li>
              중간에 나가면 <b>네이밍부터 다시 진행</b>하도록 구성되어 있습니다.
            </li>
          </ul>

          <div
            style={{
              marginTop: 14,
              padding: 12,
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              background: "rgba(0,0,0,0.03)",
              fontSize: 13,
              color: "#374151",
            }}
          >
            * 다음 단계에서 만든 결과는 최종 리포트에 반영됩니다.
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button
              type="button"
              className="btn ghost"
              onClick={() => setOpenBrandStartGuide(false)}
              style={{ flex: 1 }}
            >
              취소
            </button>
            <button
              type="button"
              className="btn primary"
              onClick={() => {
                setOpenBrandStartGuide(false);
                goBrandConsultingStart();
              }}
              style={{ flex: 1 }}
            >
              확인하고 시작
            </button>
          </div>
        </div>
      </PolicyModal>

      <SiteHeader onLogout={onLogout} />

      <main className="diagResult__main">
        <div className="diagResult__container">
          <section
            className="diagResultHero"
            aria-label="기업 진단 결과 안내 배너"
          >
            <div className="diagResultHero__inner">
              <div className="diagResultHero__left">
                <h1 className="diagResult__title">기업 진단 결과 리포트</h1>
                <p className="diagResult__sub">
                  진단 입력 내용을 기반으로 생성된 AI 리포트입니다. 결과를
                  확인하고 바로 다음 단계(브랜드 컨설팅)로 이어서 진행할 수
                  있어요.
                </p>

                <div className="diagResultHero__chips">
                  <span className="diagResultHero__chip">
                    <b>진행률</b>
                    <span>{progress}%</span>
                  </span>
                  <span className="diagResultHero__chip">
                    <b>필수 완료</b>
                    <span>
                      {requiredDone}/{requiredTotal}
                    </span>
                  </span>
                  <span
                    className={`diagResultHero__chip state ${
                      hasReport ? "ready" : "pending"
                    }`}
                  >
                    {hasReport ? "진단 완료" : "결과 대기"}
                  </span>
                </div>
              </div>

              <div className="diagResultHero__right">
                <div
                  className={`diagResultHero__status ${
                    canContinue ? "ready" : "pending"
                  }`}
                >
                  <span
                    className="diagResultHero__statusDot"
                    aria-hidden="true"
                  />
                  <span>
                    {canContinue
                      ? "브랜드 컨설팅 다음 단계로 진행할 수 있어요"
                      : "인터뷰 내용을 수정하거나 brandId 확인이 필요해요"}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <div className="diagResult__grid">
            {/* ===================== LEFT ===================== */}
            <section className="diagResult__left">
              {!hasReport ? (
                // ✅ 저장된 report가 없을 때만
                <div className="card">
                  <div className="card__head">
                    <h2>저장된 결과가 없습니다</h2>
                    <p>
                      인터뷰에서 <b>AI 진단하기</b>를 누르면 결과가 생성됩니다.
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      type="button"
                      className="btn primary"
                      onClick={goInterview}
                    >
                      인터뷰 작성하러 가기
                    </button>
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={goHome}
                    >
                      기업진단 홈
                    </button>
                  </div>
                </div>
              ) : !hasAIContent ? (
                // ✅ 저장은 됐는데 summary/analysis/insights가 비어있을 때
                <Card
                  title="AI 결과를 받지 못했습니다"
                  sub="저장은 되었지만 서버 응답이 비어있습니다."
                >
                  <Block title="디버그: report">
                    {JSON.stringify(report, null, 2)}
                  </Block>
                  <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                    <button type="button" className="btn" onClick={goInterview}>
                      인터뷰로 돌아가기
                    </button>
                    <button
                      type="button"
                      className="btn primary"
                      onClick={() => window.location.reload()}
                    >
                      새로고침
                    </button>
                  </div>
                </Card>
              ) : (
                // ✅ 정상 렌더
                <>
                  <Card
                    title="AI 진단 요약"
                    sub="AI가 분석한 브랜드 진단 결과를 요약해 제공합니다."
                    footer={
                      <div style={{ fontSize: 12, color: "#6b7280" }}>
                        마지막 저장: {lastSaved}
                      </div>
                    }
                  >
                    <Block title="요약">{renderText(uiSummary)}</Block>
                    <Block title="분석">{renderText(uiAnalysisText)}</Block>
                    <Block title="핵심 인사이트">
                      {renderText(uiKeyInsights)}
                    </Block>
                  </Card>

                  {/* 다각도 분석은 값이 있을 때만 표시 */}
                  {isPlainObject(uiPerspectives) &&
                  Object.keys(uiPerspectives).length > 0 ? (
                    <Card
                      title="다각도 분석"
                      sub="비즈니스/유저/시장 관점으로 나눠서 인사이트를 제공합니다."
                    >
                      <div style={{ display: "grid", gap: 12 }}>
                        <div
                          style={{
                            border: "1px solid #e5e7eb",
                            borderRadius: 16,
                            padding: 14,
                            background: "#fff",
                          }}
                        >
                          <div style={{ fontWeight: 900, marginBottom: 6 }}>
                            비즈니스 관점
                          </div>
                          <div style={{ whiteSpace: "pre-wrap" }}>
                            {renderText(uiPerspectives?.business_perspective)}
                          </div>
                        </div>

                        <div
                          style={{
                            border: "1px solid #e5e7eb",
                            borderRadius: 16,
                            padding: 14,
                            background: "#fff",
                          }}
                        >
                          <div style={{ fontWeight: 900, marginBottom: 6 }}>
                            사용자 관점
                          </div>
                          <div style={{ whiteSpace: "pre-wrap" }}>
                            {renderText(uiPerspectives?.user_perspective)}
                          </div>
                        </div>

                        <div
                          style={{
                            border: "1px solid #e5e7eb",
                            borderRadius: 16,
                            padding: 14,
                            background: "#fff",
                          }}
                        >
                          <div style={{ fontWeight: 900, marginBottom: 6 }}>
                            시장 관점
                          </div>
                          <div style={{ whiteSpace: "pre-wrap" }}>
                            {renderText(uiPerspectives?.market_perspective)}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ) : null}

                  {/* 입력 요약은 raw_qa가 있을 때만 보여주기 */}
                  {inputSummaryRows.length ? (
                    <Card
                      title="인터뷰 입력 요약"
                      sub="AI가 참고한 입력(원문)을 핵심 항목만 추려 정리합니다."
                    >
                      <div className="summaryGrid">
                        {inputSummaryRows.map((r) => (
                          <div className="summaryItem" key={r.k}>
                            <div className="k">{r.k}</div>
                            <div
                              className="v"
                              style={{ whiteSpace: "pre-wrap" }}
                            >
                              {renderText(r.v)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ) : null}
                </>
              )}
            </section>

            {/* ===================== RIGHT ===================== */}
            <aside className="diagResult__right">
              <div className="sideCard">
                <div className="sideCard__titleRow">
                  <h3>진행/상태</h3>
                  <span className="badge">{progress}%</span>
                </div>

                <div
                  className="progressBar"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress}
                >
                  <div
                    className="progressBar__fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="sideMeta">
                  <div className="sideMeta__row">
                    <span className="k">현재 단계</span>
                    <span className="v">{hasReport ? "완료" : "-"}</span>
                  </div>
                  <div className="sideMeta__row">
                    <span className="k">필수 완료</span>
                    <span className="v">
                      {requiredDone}/{requiredTotal}
                    </span>
                  </div>
                  <div className="sideMeta__row">
                    <span className="k">마지막 저장</span>
                    <span className="v">{lastSaved}</span>
                  </div>
                </div>

                <div className="divider" />

                <button
                  type="button"
                  className="btn primary w100"
                  onClick={goInterview}
                >
                  입력 수정하기
                </button>

                <button
                  type="button"
                  className="btn ghost w100"
                  onClick={handleReset}
                  style={{ marginTop: 10 }}
                >
                  처음부터 다시하기(초기화)
                </button>
              </div>

              {hasReport ? (
                <div className="sideCard" style={{ marginTop: 14 }}>
                  <div className="sideCard__titleRow">
                    <h3>다음 단계</h3>
                    <span className="badge">
                      {canContinue ? "완료" : "확인 필요"}
                    </span>
                  </div>

                  {canContinue ? (
                    <>
                      <div style={{ marginTop: 8, color: "#111827" }}>
                        <b>기업 진단이 완료되었습니다.</b>
                        <div
                          style={{
                            marginTop: 6,
                            color: "#374151",
                            lineHeight: 1.55,
                          }}
                        >
                          이제 브랜드 컨설팅에서{" "}
                          <b>네이밍 · 컨셉 · 스토리 · 로고</b>까지 이어서
                          도와드릴게요.
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn primary w100"
                        onClick={() => setOpenBrandStartGuide(true)}
                        style={{ marginTop: 12 }}
                      >
                        브랜드 컨설팅 시작하기
                      </button>
                    </>
                  ) : (
                    <>
                      <div style={{ marginTop: 8, color: "#111827" }}>
                        <b>
                          brandId를 받지 못해 다음 단계로 진행할 수 없습니다.
                        </b>
                        <div
                          style={{
                            marginTop: 6,
                            color: "#374151",
                            lineHeight: 1.55,
                          }}
                        >
                          서버 응답에 brandId가 없으면 네이밍/컨셉/스토리/로고가
                          같은 브랜드로 연결되지 않아요.{" "}
                          <b>기업진단 인터뷰를 다시</b> 진행해 주세요.
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn primary w100"
                        onClick={goInterview}
                        style={{ marginTop: 12 }}
                      >
                        기업진단 다시하기
                      </button>
                    </>
                  )}
                </div>
              ) : null}
            </aside>
          </div>

          {hasReport ? (
            <div
              className="diagBottomReadyNotice"
              role="status"
              aria-live="polite"
            >
              <span className="diagBottomReadyNotice__icon" aria-hidden="true">
                ✅
              </span>
              <p>
                {canContinue ? (
                  <>
                    <strong>기업 진단이 완료되었습니다.</strong> 오른쪽 다음
                    단계 카드의 <b>브랜드 컨설팅 시작하기</b> 버튼으로 이어서
                    진행할 수 있습니다.
                  </>
                ) : (
                  <>
                    <strong>결과는 생성되었지만 확인이 더 필요합니다.</strong>{" "}
                    브랜드 연결(brandId) 상태를 확인한 뒤 다시 진행해 주세요.
                  </>
                )}
              </p>
            </div>
          ) : null}
        </div>
      </main>

      <SiteFooter onOpenPolicy={setOpenType} />
    </div>
  );
}
