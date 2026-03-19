// src/pages/ProductIconConsultingInterview.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import SiteHeader from "../components/SiteHeader.jsx";
import SiteFooter from "../components/SiteFooter.jsx";
import PromotionServicePanel from "../components/PromotionServicePanel.jsx";

import PolicyModal from "../components/PolicyModal.jsx";
import { PrivacyContent, TermsContent } from "../components/PolicyContents.jsx";

// ✅ 사용자별 localStorage 분리(계정마다 독립 진행)
import {
  userGetItem,
  userSetItem,
  userRemoveItem,
} from "../utils/userLocalStorage.js";

import {
  addPromoReport,
  createPromoReportSnapshot,
} from "../utils/promoReportHistory.js";
import "../styles/ConceptConsultingInterview.css";
import "../styles/ConsultingUnifiedTheme.css";

/**
 * ✅ 홍보물 컨설팅 (독립 서비스)
 * - 제품 아이콘 컨설팅
 * - 브랜드 컨설팅 인터뷰(ConceptConsultingInterview)와 유사한 레이아웃/진행 UI
 * - 필수 입력 완료 → AI 컨설팅 생성(후보 3안) → 1안 선택 → 결과 페이지
 */

const STORAGE_KEY = "promoInterviewDraft_icon_v1";
const RESULT_KEY = "promoInterviewResult_icon_v1";
const LEGACY_KEY = "promo_icon_v1"; // (마이페이지/히스토리용)

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function compactList(text) {
  return String(text || "")
    .split(/[,\n]/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 10);
}

function buildIconPrompt({
  brandName,
  productName,
  keywords,
  tone,
  colorPref,
}) {
  const keys = compactList(keywords).join(", ");
  const brand = brandName?.trim() ? brandName.trim() : "브랜드";
  const product = productName?.trim() ? productName.trim() : "제품";
  const mood = tone?.trim() ? tone.trim() : "미니멀하고 현대적인";
  const colors = colorPref?.trim()
    ? `color palette: ${colorPref}`
    : "neutral palette";

  return (
    `Flat vector icon for ${brand} / ${product}. ` +
    `${mood} style. ` +
    (keys ? `Keywords: ${keys}. ` : "") +
    `${colors}. ` +
    "Simple geometry, clean lines, high legibility at 24px, no text, no watermark, SVG style."
  );
}

function makeCandidates(form) {
  const keys = compactList(form.keywords);
  const baseTone = form.tone?.trim() || "미니멀·테크";

  const variants = [
    {
      id: "a",
      name: "미니멀 라인 아이콘",
      summary: [
        "라인/윤곽 중심으로 작은 사이즈에서도 또렷하게",
        `톤: ${baseTone} (가벼운 여백, 정돈된 형태)`,
        "앱 아이콘/파비콘/상품 썸네일에 적용 쉬움",
      ],
      prompt: buildIconPrompt({ ...form, tone: `${baseTone}, line icon` }),
      do: [
        "외곽선 두께를 일정하게",
        "3~5개 핵심 모티프만 사용",
        "단색/2색 버전도 함께",
      ],
      dont: ["세부 디테일 과다", "그라데이션 남발", "텍스트/슬로건 삽입"],
    },
    {
      id: "b",
      name: "픽토그램 심볼 아이콘",
      summary: [
        "의미가 직관적인 심볼(픽토그램)로 메시지 전달",
        `키워드: ${keys.slice(0, 5).join(" · ") || "브랜드 핵심 가치"}`,
        "패키지/라벨/포스터 등 다양한 매체 확장에 강함",
      ],
      prompt: buildIconPrompt({ ...form, tone: `${baseTone}, pictogram` }),
      do: [
        "형태 대비(큰/작은 면)를 명확히",
        "실루엣만으로도 인식되게",
        "금지 요소를 미리 배제",
      ],
      dont: [
        "유사 브랜드와 너무 비슷한 형태",
        "복잡한 그림자",
        "너무 많은 색상",
      ],
    },
    {
      id: "c",
      name: "프리미엄 모노그램",
      summary: [
        "이니셜/기호를 활용한 프리미엄 느낌",
        "컬러는 1~2개로 절제해 ‘고급감’ 강화",
        "명함/패키지/웹 헤더에 적용 시 브랜드 인상 강화",
      ],
      prompt: buildIconPrompt({
        ...form,
        tone: `${baseTone}, premium monogram`,
      }),
      do: [
        "균형(비율/중심)을 먼저 설계",
        "사이즈별(16/24/48px) 테스트",
        "흑백 버전 필수",
      ],
      dont: ["너무 얇은 선", "가독성 떨어지는 장식", "과도한 곡선 디테일"],
    },
  ];

  return variants;
}

export default function ProductIconConsultingInterview({ onLogout }) {
  const navigate = useNavigate();

  // ✅ 약관/방침 모달
  const [openType, setOpenType] = useState(null);
  const closeModal = () => setOpenType(null);

  // ✅ 폼
  const [form, setForm] = useState({
    brandName: "",
    productName: "",
    productCategory: "",
    targetPlatform: "",
    targetCustomer: "",
    tone: "",
    keywords: "",
    usage: "",
    colorPref: "",
    colorAvoid: "",
    mustInclude: "",
    mustAvoid: "",
    references: "",
    goal: "",
    notes: "",
  });

  // ✅ 결과/선택
  const [candidates, setCandidates] = useState([]);
  const [selectedId, setSelectedId] = useState("");

  // ✅ 저장 상태 UI
  const [saveMsg, setSaveMsg] = useState("");
  const [lastSaved, setLastSaved] = useState("-");

  // 섹션 스크롤 ref
  const refBasic = useRef(null);
  const refAudience = useRef(null);
  const refStyle = useRef(null);
  const refConstraints = useRef(null);
  const refGoal = useRef(null);
  const refResult = useRef(null);

  const sections = useMemo(
    () => [
      { id: "basic", label: "기본 정보", ref: refBasic },
      { id: "audience", label: "타깃/채널", ref: refAudience },
      { id: "style", label: "스타일/키워드", ref: refStyle },
      { id: "constraints", label: "제약/참고", ref: refConstraints },
      { id: "goal", label: "목표/요청", ref: refGoal },
      { id: "result", label: "후보 3안", ref: refResult },
    ],
    [],
  );

  const requiredKeys = useMemo(
    () => [
      "productName",
      "productCategory",
      "targetPlatform",
      "tone",
      "keywords",
      "usage",
      "goal",
    ],
    [],
  );

  const requiredStatus = useMemo(() => {
    const status = {};
    requiredKeys.forEach((k) => {
      status[k] = Boolean(String(form?.[k] || "").trim());
    });
    return status;
  }, [form, requiredKeys]);

  const completedRequired = useMemo(
    () => requiredKeys.filter((k) => requiredStatus[k]).length,
    [requiredKeys, requiredStatus],
  );

  const progress = useMemo(() => {
    if (requiredKeys.length === 0) return 0;
    return Math.round((completedRequired / requiredKeys.length) * 100);
  }, [completedRequired, requiredKeys.length]);

  const canAnalyze = completedRequired === requiredKeys.length;
  const remainingRequired = Math.max(
    requiredKeys.length - completedRequired,
    0,
  );

  const currentSectionLabel = useMemo(() => {
    if (!form.productName.trim() || !form.productCategory.trim())
      return "기본 정보";
    if (!form.targetPlatform.trim()) return "타깃/채널";
    if (!form.tone.trim() || !form.keywords.trim() || !form.usage.trim())
      return "스타일/키워드";
    if (!form.goal.trim()) return "목표/요청";
    return candidates.length ? "후보 3안" : "완료";
  }, [form, candidates.length]);

  const setValue = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const scrollToSection = (ref) => {
    if (!ref?.current) return;
    ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ✅ 기업 진단&인터뷰 기본 정보 자동 반영 (중복 질문 제거)
  useEffect(() => {
    try {
      const raw = userGetItem("diagnosisInterviewDraft_v1");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const diag = parsed?.form || parsed;
      if (!diag || typeof diag !== "object") return;

      const name = String(diag.companyName || diag.brandName || "").trim();

      setForm((prev) => ({
        ...prev,
        brandName: prev.brandName || name,
      }));
    } catch {
      // ignore
    }
  }, []);
  const handleTempSave = () => {
    try {
      const payload = { form, candidates, selectedId, updatedAt: Date.now() };
      userSetItem(STORAGE_KEY, JSON.stringify(payload));
      setLastSaved(new Date(payload.updatedAt).toLocaleString());
      setSaveMsg("임시 저장 완료");
    } catch {
      setSaveMsg("저장 실패");
    }
  };

  const handleNext = () => {
    const map = {
      "기본 정보": refAudience,
      "타깃/채널": refStyle,
      "스타일/키워드": refConstraints,
      "목표/요청": refResult,
      완료: refResult,
      "후보 3안": null,
    };
    const nextRef = map[currentSectionLabel];
    if (!nextRef) return;
    scrollToSection(nextRef);
  };

  const handleAnalyze = () => {
    alert(
      "AI 분석 기능은 추후 개발 예정입니다.\n현재는 인터뷰 입력/저장만 가능합니다.",
    );
  };

  const handleGoResult = () => {
    if (!selectedId) {
      alert("후보 1안을 선택해 주세요.");
      return;
    }
    const selected = candidates.find((c) => c.id === selectedId);
    const payload = {
      service: "icon",
      form,
      candidates,
      selectedId,
      selected,
      updatedAt: Date.now(),
    };
    userSetItem(RESULT_KEY, JSON.stringify(payload));
    userSetItem(
      LEGACY_KEY,
      JSON.stringify({
        updatedAt: payload.updatedAt,
        selectedId,
        selected,
        summary: {
          title: selected?.name || "제품 아이콘 컨설팅",
          subtitle: form.productName || form.brandName,
        },
      }),
    );
    try {
      // ✅ 완료 시점의 결과 스냅샷 저장(카드 히스토리)
      addPromoReport(
        createPromoReportSnapshot({
          serviceKey: "icon",
          serviceLabel: "제품 아이콘 컨설팅",
          interviewRoute: "/promotion/icon/interview",
          result: payload,
        }),
      );
    } catch {
      // ignore
    }
    navigate(`/promotion/result?service=icon`);
  };

  // ✅ draft/result 로드
  useEffect(() => {
    const rawDraft = userGetItem(STORAGE_KEY);
    const draft = rawDraft ? safeParse(rawDraft) : null;
    if (draft?.form) setForm((prev) => ({ ...prev, ...draft.form }));
    if (Array.isArray(draft?.candidates)) setCandidates(draft.candidates);
    if (typeof draft?.selectedId === "string") setSelectedId(draft.selectedId);
    if (draft?.updatedAt) {
      const d = new Date(draft.updatedAt);
      if (!Number.isNaN(d.getTime())) setLastSaved(d.toLocaleString());
    }

    const rawResult = userGetItem(RESULT_KEY);
    const result = rawResult ? safeParse(rawResult) : null;
    if (result?.form) setForm((prev) => ({ ...prev, ...result.form }));
    if (Array.isArray(result?.candidates)) setCandidates(result.candidates);
    if (typeof result?.selectedId === "string")
      setSelectedId(result.selectedId);
  }, []);

  // ✅ 자동 저장(디바운스)
  useEffect(() => {
    setSaveMsg("");
    const t = setTimeout(() => {
      try {
        const payload = { form, candidates, selectedId, updatedAt: Date.now() };
        userSetItem(STORAGE_KEY, JSON.stringify(payload));
        setLastSaved(new Date(payload.updatedAt).toLocaleString());
        setSaveMsg("자동 저장됨");
      } catch {
        // ignore
      }
    }, 650);
    return () => clearTimeout(t);
  }, [form, candidates, selectedId]);

  return (
    <div className="diagInterview consultingInterview">
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

      <main className="diagInterview__main">
        <div className="diagInterview__container">
          <section
            className="diagInterviewHero"
            aria-label="홍보물 인터뷰 안내 배너"
          >
            <div className="diagInterviewHero__inner">
              <div className="diagInterviewHero__left">
                <h1 className="diagInterview__title">
                  제품 아이콘 컨설팅 인터뷰
                </h1>
                <p className="diagInterview__sub">
                  브랜드 컨설팅 인터뷰와 동일한 구성으로 질문을 작성하고, 아이콘
                  방향을 체계적으로 정리하세요.
                </p>

                <div className="diagInterviewHero__chips">
                  <span className="diagInterviewHero__chip">
                    <b>진행률</b>
                    <span>{progress}%</span>
                  </span>
                  <span className="diagInterviewHero__chip">
                    <b>필수 완료</b>
                    <span>
                      {completedRequired}/{requiredKeys.length}
                    </span>
                  </span>
                  <span className="diagInterviewHero__chip state ready">
                    독립 서비스
                  </span>
                </div>
              </div>

              <div className="diagInterviewHero__right">
                <div
                  className={`diagInterviewHero__status ${canAnalyze ? "ready" : "pending"}`}
                >
                  <span
                    className="diagInterviewHero__statusDot"
                    aria-hidden="true"
                  />
                  <span>
                    {canAnalyze
                      ? "필수 입력이 완료되었습니다."
                      : `필수 항목 ${remainingRequired}개가 남아있습니다.`}
                  </span>
                </div>

                <div
                  className="diagInterview__topActions"
                  style={{ marginTop: 10 }}
                >
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => navigate("/promotion")}
                  >
                    홍보물 컨설팅으로
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={handleTempSave}
                  >
                    임시저장
                  </button>
                </div>
              </div>
            </div>
          </section>

          <PromotionServicePanel activeKey="icon" />

          <div className="diagInterview__grid">
            {/* ✅ 왼쪽: 폼 */}

            <section className="diagInterview__left">
              <div className="card consultingIntroCard">
                <div className="card__head">
                  <h2>Product Icon Consulting Interview</h2>
                  <p>
                    홍보물 컨설팅은 4개의 독립 서비스로 운영됩니다. 다른 서비스
                    완료 여부와 무관하게 바로 진행할 수 있습니다.
                  </p>
                </div>
              </div>
              {/* 1) BASIC */}
              <div className="card" ref={refBasic}>
                <div className="card__head">
                  <h2>기본 정보</h2>
                  <p>아이콘의 ‘맥락’을 결정하는 핵심 정보입니다.</p>
                </div>

                <div className="formGrid">
                  <div className="field">
                    <label>브랜드명 (자동 반영)</label>
                    <input
                      value={form.brandName}
                      disabled
                      placeholder="기업 진단에서 자동 반영"
                    />
                  </div>

                  <div className="field">
                    <label>
                      제품명 <span className="req">*</span>
                    </label>
                    <input
                      value={form.productName}
                      onChange={(e) => setValue("productName", e.target.value)}
                      placeholder="예) AI 브랜딩 리포트"
                    />
                  </div>

                  <div className="field">
                    <label>
                      제품 카테고리 <span className="req">*</span>
                    </label>
                    <input
                      value={form.productCategory}
                      onChange={(e) =>
                        setValue("productCategory", e.target.value)
                      }
                      placeholder="예) SaaS / 앱 / 커머스 / 교육"
                    />
                  </div>

                  <div className="field">
                    <label>참고 링크(선택)</label>
                    <input
                      value={form.references}
                      onChange={(e) => setValue("references", e.target.value)}
                      placeholder="예) https://... (레퍼런스/경쟁사/브랜드 가이드)"
                    />
                  </div>
                </div>
              </div>

              {/* 2) AUDIENCE */}
              <div className="card" ref={refAudience}>
                <div className="card__head">
                  <h2>타깃/채널</h2>
                  <p>어디에 쓰는 아이콘인지가 스타일/가독성을 좌우합니다.</p>
                </div>

                <div className="formGrid">
                  <div className="field">
                    <label>
                      사용 채널/플랫폼 <span className="req">*</span>
                    </label>
                    <input
                      value={form.targetPlatform}
                      onChange={(e) =>
                        setValue("targetPlatform", e.target.value)
                      }
                      placeholder="예) 앱 아이콘 / 웹 파비콘 / 상품 썸네일 / SNS"
                    />
                  </div>

                  <div className="field">
                    <label>타깃 고객(선택)</label>
                    <input
                      value={form.targetCustomer}
                      onChange={(e) =>
                        setValue("targetCustomer", e.target.value)
                      }
                      placeholder="예) 1인 창업자 / 소상공인 / B2B 담당자"
                    />
                  </div>
                </div>

                <div className="field">
                  <label>
                    주요 사용처/사이즈 <span className="req">*</span>
                  </label>
                  <input
                    value={form.usage}
                    onChange={(e) => setValue("usage", e.target.value)}
                    placeholder="예) 24px 툴바 아이콘 / 512px 앱 아이콘 / 1080x1080 썸네일"
                  />
                </div>
              </div>

              {/* 3) STYLE */}
              <div className="card" ref={refStyle}>
                <div className="card__head">
                  <h2>스타일/키워드</h2>
                  <p>원하는 무드와 핵심 키워드를 구체화합니다.</p>
                </div>

                <div className="field">
                  <label>
                    톤/분위기 <span className="req">*</span>
                  </label>
                  <input
                    value={form.tone}
                    onChange={(e) => setValue("tone", e.target.value)}
                    placeholder="예) 미니멀, 테크, 따뜻함, 프리미엄"
                  />
                </div>

                <div className="field">
                  <label>
                    핵심 키워드(3~10개) <span className="req">*</span>
                  </label>
                  <textarea
                    value={form.keywords}
                    onChange={(e) => setValue("keywords", e.target.value)}
                    placeholder="예) 신뢰, 속도, 실행, 성장, 간결, 전문"
                    rows={4}
                  />
                </div>

                <div className="formGrid">
                  <div className="field">
                    <label>선호 색상(선택)</label>
                    <input
                      value={form.colorPref}
                      onChange={(e) => setValue("colorPref", e.target.value)}
                      placeholder="예) 네이비/블루, 모노톤"
                    />
                  </div>
                  <div className="field">
                    <label>피하고 싶은 색상(선택)</label>
                    <input
                      value={form.colorAvoid}
                      onChange={(e) => setValue("colorAvoid", e.target.value)}
                      placeholder="예) 형광색, 과한 빨강"
                    />
                  </div>
                </div>
              </div>

              {/* 4) CONSTRAINTS */}
              <div className="card" ref={refConstraints}>
                <div className="card__head">
                  <h2>제약/참고</h2>
                  <p>반드시 포함/제외할 요소가 있으면 적어주세요.</p>
                </div>

                <div className="formGrid">
                  <div className="field">
                    <label>반드시 포함할 요소(선택)</label>
                    <input
                      value={form.mustInclude}
                      onChange={(e) => setValue("mustInclude", e.target.value)}
                      placeholder="예) 이니셜 BP / 특정 심볼"
                    />
                  </div>
                  <div className="field">
                    <label>반드시 피할 요소(선택)</label>
                    <input
                      value={form.mustAvoid}
                      onChange={(e) => setValue("mustAvoid", e.target.value)}
                      placeholder="예) 과한 디테일 / 특정 도형"
                    />
                  </div>
                </div>
              </div>

              {/* 5) GOAL */}
              <div className="card" ref={refGoal}>
                <div className="card__head">
                  <h2>목표/요청</h2>
                  <p>원하는 결과물의 기준을 명확히 합니다.</p>
                </div>

                <div className="field">
                  <label>
                    목표 <span className="req">*</span>
                  </label>
                  <textarea
                    value={form.goal}
                    onChange={(e) => setValue("goal", e.target.value)}
                    placeholder="예) 작은 사이즈에서도 또렷하고, 브랜드 톤이 느껴지는 아이콘"
                    rows={4}
                  />
                </div>

                <div className="field">
                  <label>추가 메모(선택)</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setValue("notes", e.target.value)}
                    placeholder="예) 단색 버전도 필수 / 라운드보다 각진 형태 선호"
                    rows={4}
                  />
                </div>
              </div>

              {/* 6) RESULT */}
              <div className="card" ref={refResult}>
                <div className="card__head">
                  <h2>후보 3안</h2>
                  <p>
                    AI 분석 기능은 준비 중입니다. 현재는 인터뷰 입력/저장 UI만
                    제공되며, 분석 결과 생성은 추후 업데이트에서 지원됩니다.
                  </p>
                </div>

                {candidates.length === 0 ? (
                  <div className="emptyHint">
                    <p style={{ margin: 0, color: "#6b7280" }}>
                      AI 분석 기능은 추후 개발 예정입니다. 현재는 인터뷰 작성 및
                      임시저장만 가능합니다.
                    </p>
                  </div>
                ) : (
                  <div className="resultList">
                    {candidates.map((c) => {
                      const picked = selectedId === c.id;
                      return (
                        <div
                          key={c.id}
                          className={`resultCard ${picked ? "selected" : ""}`}
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedId(c.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ")
                              setSelectedId(c.id);
                          }}
                          style={{ marginBottom: 14 }}
                        >
                          <div className="resultCard__head">
                            <div>
                              <p className="resultBadge">
                                후보 {c.id.toUpperCase()}
                              </p>
                              <h3 className="resultTitle">{c.name}</h3>
                            </div>
                            <div className="resultPick">
                              <span
                                className={`pickDot ${picked ? "on" : ""}`}
                              />
                              <span className="pickText">
                                {picked ? "선택됨" : "선택"}
                              </span>
                            </div>
                          </div>

                          <ul className="resultBullets">
                            {c.summary.map((t) => (
                              <li key={t}>{t}</li>
                            ))}
                          </ul>

                          <div className="resultGrid">
                            <div className="resultBlock">
                              <h4>추천 프롬프트</h4>
                              <textarea
                                readOnly
                                value={c.prompt}
                                rows={4}
                                style={{ width: "100%" }}
                              />
                            </div>
                            <div className="resultBlock">
                              <h4>가이드</h4>
                              <div className="resultMiniGrid">
                                <div>
                                  <p className="miniTitle">Do</p>
                                  <ul>
                                    {c.do.map((d) => (
                                      <li key={d}>{d}</li>
                                    ))}
                                  </ul>
                                </div>
                                <div>
                                  <p className="miniTitle">Don&apos;t</p>
                                  <ul>
                                    {c.dont.map((d) => (
                                      <li key={d}>{d}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <div className="bottomBar" style={{ marginTop: 10 }}>
                      <button
                        type="button"
                        className="btn ghost"
                        onClick={handleAnalyze}
                      >
                        후보 다시 생성
                      </button>
                      <button
                        type="button"
                        className={`btn primary ${selectedId ? "" : "disabled"}`}
                        onClick={handleGoResult}
                        disabled={!selectedId}
                      >
                        선택한 안으로 결과 보기
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 하단 버튼 */}
              <div className="bottomBar">
                <button
                  type="button"
                  className="btn ghost"
                  onClick={handleNext}
                >
                  다음 섹션
                </button>
                <button type="button" className="btn" onClick={handleTempSave}>
                  임시저장
                </button>
                <button
                  type="button"
                  className="btn primary"
                  onClick={handleAnalyze}
                >
                  AI 분석 (준비중)
                </button>
              </div>
            </section>

            {/* ✅ 오른쪽: 진행률/가이드 */}
            <aside className="diagInterview__right">
              <div className="sideCard">
                <div className="sideCard__titleRow">
                  <h3>진행 상태</h3>
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
                    <span className="v">{currentSectionLabel}</span>
                  </div>
                  <div className="sideMeta__row">
                    <span className="k">필수 완료</span>
                    <span className="v">
                      {completedRequired}/{requiredKeys.length}
                    </span>
                  </div>
                  <div className="sideMeta__row">
                    <span className="k">마지막 저장</span>
                    <span className="v">{lastSaved}</span>
                  </div>
                </div>

                {saveMsg ? <p className="saveMsg">{saveMsg}</p> : null}

                <div className="divider" />

                <h4 className="sideSubTitle">필수 입력 체크</h4>
                <ul className="checkList">
                  <li className={requiredStatus.productName ? "ok" : ""}>
                    제품명
                  </li>
                  <li className={requiredStatus.productCategory ? "ok" : ""}>
                    제품 카테고리
                  </li>
                  <li className={requiredStatus.targetPlatform ? "ok" : ""}>
                    사용 채널/플랫폼
                  </li>
                  <li className={requiredStatus.tone ? "ok" : ""}>톤/분위기</li>
                  <li className={requiredStatus.keywords ? "ok" : ""}>
                    핵심 키워드
                  </li>
                  <li className={requiredStatus.usage ? "ok" : ""}>
                    사용처/사이즈
                  </li>
                  <li className={requiredStatus.goal ? "ok" : ""}>목표</li>
                </ul>

                <div className="divider" />

                <h4 className="sideSubTitle">빠른 이동</h4>
                <div className="jumpGrid">
                  {sections.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className="jumpBtn"
                      onClick={() => scrollToSection(s.ref)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="btn primary sideAnalyze"
                  onClick={handleAnalyze}
                >
                  AI 분석 (준비중)
                </button>

                <p className="hint">* AI 분석 기능은 추후 개발 예정입니다.</p>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <SiteFooter onOpenPolicy={setOpenType} />
    </div>
  );
}
