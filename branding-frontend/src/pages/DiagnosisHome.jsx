// src/pages/DiagnosisHome.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import SiteFooter from "../components/SiteFooter.jsx";
import SiteHeader from "../components/SiteHeader.jsx";

import PolicyModal from "../components/PolicyModal.jsx";
import { PrivacyContent, TermsContent } from "../components/PolicyContents.jsx";

// ✅ 배너 이미지: 기업진단 & 인터뷰 홈 배너 → Banner_D 사용
import bannerImage from "../Image/banner_image/Banner_D.webp";

// ✅ 사용자별 localStorage 분리(계정마다 독립 진행)
import { userGetItem } from "../utils/userLocalStorage.js";
import { resetBrandConsultingToDiagnosisStart } from "../utils/brandPipelineStorage.js";
import "../styles/DiagnosisHome.css";

const INTERVIEW_STORAGE_KEY = "diagnosisInterviewDraft_v1";
const HOME_SUMMARY_KEY = "diagnosisDraft";

const REQUIRED_KEYS = [
  "companyName",
  "industry",
  "stage",
  "oneLine",
  "targetCustomer",
  "customerProblem",
  "usp",
  "goal12m",
];

export default function DiagnosisHome({ onLogout }) {
  const navigate = useNavigate();

  // 약관/방침 모달
  const [openType, setOpenType] = useState(null);
  const closeModal = () => setOpenType(null);

  // 홈 표시용 draft(진행률 요약 정보)
  const [draft, setDraft] = useState(null);

  const calcProgressFromForm = (form) => {
    if (!form)
      return { progress: 0, completed: 0, total: REQUIRED_KEYS.length };
    const completed = REQUIRED_KEYS.filter((k) =>
      Boolean(form[k]?.trim()),
    ).length;
    const total = REQUIRED_KEYS.length;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { progress, completed, total };
  };

  const guessStageLabelFromForm = (form) => {
    if (!form) return "미시작";
    if (
      !form.companyName?.trim() ||
      !form.industry?.trim() ||
      !form.stage?.trim()
    )
      return "기본 정보";
    if (!form.oneLine?.trim()) return "아이템/서비스";
    if (!form.targetCustomer?.trim() || !form.customerProblem?.trim())
      return "고객/문제";
    if (!form.usp?.trim()) return "차별점";
    if (!form.goal12m?.trim()) return "목표/KPI";
    return "완료";
  };

  const loadDraft = () => {
    // 1) 홈 요약 키 우선
    try {
      const raw = userGetItem(HOME_SUMMARY_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }

    // 2) 요약 없으면 원본 draft로 계산
    try {
      const raw2 = userGetItem(INTERVIEW_STORAGE_KEY);
      if (!raw2) return null;
      const parsed = JSON.parse(raw2);
      const form = parsed?.form;
      const { progress, completed, total } = calcProgressFromForm(form);
      return {
        progress,
        completedRequired: completed,
        requiredTotal: total,
        stageLabel: guessStageLabelFromForm(form),
        updatedAt: parsed?.updatedAt ?? null,
      };
    } catch {
      return null;
    }
  };

  useEffect(() => {
    setDraft(loadDraft());
  }, []);

  const progress = useMemo(() => {
    const p = Number(draft?.progress ?? 0);
    if (!Number.isFinite(p)) return 0;
    return Math.max(0, Math.min(100, p));
  }, [draft]);

  const stageLabel = useMemo(() => draft?.stageLabel ?? "미시작", [draft]);

  const lastSaved = useMemo(() => {
    const t = draft?.updatedAt;
    if (!t) return "-";
    const d = new Date(t);
    return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString();
  }, [draft]);

  const requiredDone = useMemo(() => {
    const v = Number(draft?.completedRequired ?? 0);
    return Number.isFinite(v) ? v : 0;
  }, [draft]);

  const requiredTotal = useMemo(() => {
    const v = Number(draft?.requiredTotal ?? REQUIRED_KEYS.length);
    return Number.isFinite(v) ? v : REQUIRED_KEYS.length;
  }, [draft]);

  // ✅ "결과 보기" 활성화 조건: 완료 또는 100%
  const canViewResult = useMemo(() => {
    if (!draft) return false;
    return progress >= 100 || stageLabel === "완료";
  }, [draft, progress, stageLabel]);

  // 버튼 동작
  const handleStart = () => {
    navigate("/diagnosisinterview", { state: { mode: "start" } });
  };

  const handleResume = () => {
    if (!draft) return;
    navigate("/diagnosisinterview", { state: { mode: "resume" } });
  };

  const handleViewResult = () => {
    if (!canViewResult) return;
    navigate("/diagnosisresult", { state: { from: "home" } });
  };

  const handleRestart = () => {
    resetBrandConsultingToDiagnosisStart("manual_reset");
    setDraft(null);
    alert("진단 데이터를 초기화했습니다. 이제 인터뷰는 공백으로 시작됩니다.");
  };

  return (
    <div className="diagHome">
      {/* 개인정보/약관 모달 */}
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

      {/* 공통 헤더 */}
      <SiteHeader onLogout={onLogout} />

      {/* Hero 배너 */}
      <section className="diagHome__hero">
        <div className="diagHome__heroInner">
          <div
            className="diagHome__banner"
            aria-label="기업 진단 & 인터뷰 배너"
          >
            <img
              className="diagHome__bannerImg"
              src={bannerImage}
              alt="기업 진단 & 인터뷰 배너"
            />
            <div className="diagHome__bannerOverlay">
              <p className="diagHome__bannerKicker">Company Analysis</p>
              <h1 className="diagHome__bannerTitle">기업 진단 &amp; 인터뷰</h1>
              <p className="diagHome__bannerSub">
                간단한 정보를 입력하면 AI가 빠르게 분석하고, 주요 문제와 추천
                전략을 제공합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      <main className="diagHome__main">
        {/* 시작 카드 + 가이드 */}
        <section className="diagHome__topGrid">
          <button
            className="diagHome__startCard"
            type="button"
            onClick={handleStart}
          >
            <div className="diagHome__startTitle">기업 진단 시작하기</div>
            <div className="diagHome__startSub">
              평균 3~5분 · 결과 리포트 + 실행 체크리스트 제공
            </div>
            <div className="diagHome__startCta" aria-hidden="true">
              지금 시작 →
            </div>
          </button>

          <div className="diagHome__rightCard">
            <div className="diagHome__rightHint">
              <div className="diagHome__rightTitle">가이드</div>
              <div className="diagHome__rightDesc">
                • 로그인 상태에서 결과가 저장됩니다
                <br />
                • 중간 저장 후 이어서 진행 가능
                <br />• 리포트는 히스토리에서 다시 확인 가능
              </div>
            </div>
          </div>
        </section>

        {/* 진행률 */}
        <section className="diagHome__progressWrap">
          <div className="diagHome__progressInner">
            <h2 className="diagHome__progressTitle">
              기업 진단 진행률 및 정보 표시
            </h2>

            <div
              className="diagHome__progressBar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
            >
              <div
                className="diagHome__progressFill"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="diagHome__meta">
              <div className="diagHome__metaRow">
                <span className="diagHome__metaKey">현재 단계</span>
                <span className="diagHome__metaVal">{stageLabel}</span>
              </div>
              <div className="diagHome__metaRow">
                <span className="diagHome__metaKey">진행률</span>
                <span className="diagHome__metaVal">{progress}%</span>
              </div>
              <div className="diagHome__metaRow">
                <span className="diagHome__metaKey">필수 완료</span>
                <span className="diagHome__metaVal">
                  {requiredDone}/{requiredTotal}
                </span>
              </div>
              <div className="diagHome__metaRow">
                <span className="diagHome__metaKey">마지막 저장</span>
                <span className="diagHome__metaVal">{lastSaved}</span>
              </div>
            </div>
          </div>

          {/* ✅ 진행 관련 액션: 결과보기(툴팁), 이어서, 초기화 */}
          <div className="diagHome__actions">
            {/* 결과 보기: disabled 속성 대신 가짜 disabled로 hover 툴팁 가능 */}
            <button
              className={`diagHome__actionBtn diagHome__actionBtn--primary ${
                !canViewResult ? "is-disabled" : ""
              }`}
              type="button"
              onClick={handleViewResult}
              aria-disabled={!canViewResult}
            >
              결과 보기
              {!canViewResult && (
                <span className="diagHome__tooltip" role="tooltip">
                  현재 진행된 진단이 없습니다.
                </span>
              )}
            </button>

            <button
              className={`diagHome__actionBtn diagHome__actionBtn--outline ${
                !draft ? "is-disabled" : ""
              }`}
              type="button"
              onClick={handleResume}
              aria-disabled={!draft}
            >
              이어서 진행하기
              {!draft && (
                <span className="diagHome__tooltip" role="tooltip">
                  이어서 진행할 데이터가 없습니다.
                </span>
              )}
            </button>

            <button
              className="diagHome__actionBtn diagHome__actionBtn--ghost"
              type="button"
              onClick={handleRestart}
            >
              처음부터 다시 하기
            </button>
          </div>
        </section>
      </main>

      <SiteFooter onOpenPolicy={setOpenType} />
    </div>
  );
}
