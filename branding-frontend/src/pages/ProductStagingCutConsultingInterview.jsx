// src/pages/ProductStagingCutConsultingInterview.jsx
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
 * - 제품 연출컷 컨설팅
 * - 브랜드 컨설팅 인터뷰(ConceptConsultingInterview)와 유사한 레이아웃/진행 UI
 * - 필수 입력 완료 → AI 컨설팅 생성(후보 3안) → 1안 선택 → 결과 페이지
 */

const STORAGE_KEY = "promoInterviewDraft_staging_v1";
const RESULT_KEY = "promoInterviewResult_staging_v1";
const LEGACY_KEY = "promo_staging_v1"; // (마이페이지/히스토리용)

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

function buildStagingPrompt(form, flavor) {
  const {
    brandName,
    productName,
    productCategory,
    targetPlatform,
    targetCustomer,
    usage,
    sceneConcept,
    props,
    background,
    lighting,
    angle,
    tone,
    keywords,
    colorPref,
    colorAvoid,
    mustInclude,
    mustAvoid,
    references,
    goal,
  } = form;

  const parts = [
    `Commercial product photography / product staging shot`,
    `Brand: ${brandName}`,
    `Product: ${productName} (${productCategory})`,
    goal ? `Purpose: ${goal}` : null,
    targetPlatform ? `Platform: ${targetPlatform}` : null,
    targetCustomer ? `Target: ${targetCustomer}` : null,
    usage ? `Output spec: ${usage}` : null,
    `Scene concept: ${sceneConcept}`,
    props ? `Props: ${props}` : null,
    background ? `Background: ${background}` : null,
    lighting ? `Lighting: ${lighting}` : null,
    angle ? `Camera angle/composition: ${angle}` : null,
    `Mood/Tone: ${tone}`,
    `Keywords: ${keywords}`,
    colorPref ? `Preferred colors: ${colorPref}` : null,
    colorAvoid ? `Avoid colors: ${colorAvoid}` : null,
    mustInclude ? `Must include: ${mustInclude}` : null,
    mustAvoid ? `Must avoid: ${mustAvoid}` : null,
    references ? `Reference links/keywords: ${references}` : null,
    `Direction flavor: ${flavor}`,
    `Ultra realistic, high detail, clean edges, accurate proportions`,
    `No text, no watermark, no logos overlaid, no people unless explicitly requested`,
  ].filter(Boolean);

  return parts.join("\n");
}

function makeCandidates(form) {
  return [
    {
      id: "A",
      name: "미니멀 스튜디오 연출컷",
      summary: [
        "배경을 단순화해 제품 형태/소재를 또렷하게 강조",
        "카피/배너가 올라가도 무너지지 않는 여백 설계",
        "상세페이지/자사몰 메인 썸네일에 적합",
      ],
      prompt: buildStagingPrompt(
        form,
        "Minimal studio, clean background, soft shadow, centered composition",
      ),
      do: [
        "배경 색상은 1~2개 톤으로 제한",
        "광택/재질 표현을 위해 부드러운 확산광 사용",
        "제품 로고/라벨이 있는 경우 정면 가독성 확보",
      ],
      dont: [
        "복잡한 소품 과다 배치",
        "강한 색 대비로 제품이 묻히는 구성",
        "텍스트가 이미지에 직접 들어가게 만들기",
      ],
    },
    {
      id: "B",
      name: "라이프스타일 감성 연출컷",
      summary: [
        "타깃이 공감할 수 있는 사용 맥락(상황)을 보여줌",
        "감성 무드로 브랜드 톤을 자연스럽게 전달",
        "SNS 피드/광고 소재에 활용하기 좋음",
      ],
      prompt: buildStagingPrompt(
        form,
        "Lifestyle scene, natural props, warm atmosphere, candid but premium",
      ),
      do: [
        "타깃 라이프스타일과 연결되는 소품 2~4개만 선택",
        "빛/그림자로 시간대(아침/저녁) 분위기 연출",
        "제품이 '주인공'이 되도록 시선 동선 정리",
      ],
      dont: [
        "브랜드 톤과 무관한 소품 사용",
        "배경 디테일 과다로 제품이 작아 보이는 구도",
        "과한 필터/노이즈로 품질 저하",
      ],
    },
    {
      id: "C",
      name: "프리미엄 하이엔드 연출컷",
      summary: [
        "고급 소재(대리석/메탈/유리) 텍스처로 프리미엄 무드",
        "드라마틱 조명으로 제품의 윤곽과 입체감 강조",
        "런칭/PR/광고 키비주얼로 사용하기 적합",
      ],
      prompt: buildStagingPrompt(
        form,
        "High-end key visual, dramatic lighting, premium textures, cinematic composition",
      ),
      do: [
        "명암 대비를 활용해 실루엣/윤곽을 선명하게",
        "배경 텍스처는 제품 카테고리에 맞게 선택",
        "후보 3안 중 가장 브랜드 이미지에 가까운 무드 선택",
      ],
      dont: [
        "제품보다 배경이 더 화려해지는 구성",
        "반사(글레어)로 라벨/형태가 가려지는 조명",
        "과도한 장식 요소로 시선 분산",
      ],
    },
  ];
}

export default function ProductStagingCutConsultingInterview({ onLogout }) {
  const navigate = useNavigate();

  // ✅ 약관/방침 모달
  const [openType, setOpenType] = useState(null);
  const closeModal = () => setOpenType(null);

  // ✅ 폼
  const [form, setForm] = useState({
    // 기본 정보
    brandName: "",
    productName: "",
    productCategory: "",

    // 채널/타깃
    targetPlatform: "",
    targetCustomer: "",
    usage: "",

    // 연출 방향
    sceneConcept: "",
    props: "",
    background: "",
    lighting: "",
    angle: "",
    tone: "",
    keywords: "",
    colorPref: "",
    colorAvoid: "",

    // 제약/참고
    mustInclude: "",
    mustAvoid: "",
    references: "",

    // 목표/메모
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
  const refChannel = useRef(null);
  const refDirection = useRef(null);
  const refConstraints = useRef(null);
  const refGoal = useRef(null);
  const refResult = useRef(null);

  const sections = useMemo(
    () => [
      { id: "basic", label: "기본 정보", ref: refBasic },
      { id: "channel", label: "채널/타깃", ref: refChannel },
      { id: "direction", label: "연출 방향", ref: refDirection },
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
      "sceneConcept",
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
    if (!form.targetPlatform.trim()) return "채널/타깃";
    if (
      !form.sceneConcept.trim() ||
      !form.tone.trim() ||
      !form.keywords.trim() ||
      !form.usage.trim()
    )
      return "연출 방향";
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
      "기본 정보": refChannel,
      "채널/타깃": refDirection,
      "연출 방향": refConstraints,
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
      service: "staging",
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
          title: selected?.name || "제품 연출컷 컨설팅",
          subtitle: form.productName || form.brandName,
        },
      }),
    );
    try {
      // ✅ 완료 시점의 결과 스냅샷 저장(카드 히스토리)
      addPromoReport(
        createPromoReportSnapshot({
          serviceKey: "staging",
          serviceLabel: "제품 연출컷 컨설팅",
          interviewRoute: "/promotion/staging/interview",
          result: payload,
        }),
      );
    } catch {
      // ignore
    }
    navigate(`/promotion/result?service=staging`);
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
                  제품 연출컷 컨설팅 인터뷰
                </h1>
                <p className="diagInterview__sub">
                  브랜드 컨설팅 인터뷰와 동일한 구성으로 질문을 작성하고, 연출컷
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

          <PromotionServicePanel activeKey="staging" />

          <div className="diagInterview__grid">
            {/* ✅ 왼쪽: 폼 */}

            <section className="diagInterview__left">
              <div className="card consultingIntroCard">
                <div className="card__head">
                  <h2>Product Staging Cut Consulting Interview</h2>
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
                  <p>연출컷의 ‘맥락’을 결정하는 핵심 정보입니다.</p>
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
                      placeholder="예) 화장품, 음료, 전자기기, 건강식품"
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
              <div className="card" ref={refChannel}>
                <div className="card__head">
                  <h2>채널/타깃</h2>
                  <p>어디에 쓰는 연출컷인지가 스타일/가독성을 좌우합니다.</p>
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
                      placeholder="예) 쿠팡 상세페이지, 자사몰, 인스타그램, 광고소재"
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
                    placeholder="예) 1500x1500 상세페이지 메인, 1080x1350 피드, 16:9 배너"
                  />
                </div>
              </div>

              {/* 3) DIRECTION */}
              <div className="card" ref={refDirection}>
                <div className="cardHead">
                  <h2 className="cardTitle">연출 방향</h2>
                  <p className="cardSub">
                    장면/소품/조명/톤을 정하면 AI가 연출컷 후보 3안을
                    만들어줘요.
                  </p>
                </div>

                <div className="formStack">
                  <label className="fieldLabel">
                    연출 컨셉/상황 <span className="req">*</span>
                  </label>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="예) 화이트 스튜디오 테이블 위, 제품 단독 + 은은한 그림자 / 감성 원목 테이블 위 티타임 분위기"
                    value={form.sceneConcept}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, sceneConcept: e.target.value }))
                    }
                  />

                  <div className="formGrid">
                    <div>
                      <label className="fieldLabel">소품</label>
                      <input
                        className="input"
                        placeholder="예) 유리컵, 대리석 트레이, 자연광 커튼"
                        value={form.props}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, props: e.target.value }))
                        }
                      />
                    </div>

                    <div>
                      <label className="fieldLabel">배경</label>
                      <input
                        className="input"
                        placeholder="예) 밝은 무지 배경 / 실내 키친 / 카페 테이블"
                        value={form.background}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, background: e.target.value }))
                        }
                      />
                    </div>

                    <div>
                      <label className="fieldLabel">조명</label>
                      <input
                        className="input"
                        placeholder="예) 소프트박스 확산광 / 역광 실루엣 / 시네마틱 조명"
                        value={form.lighting}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, lighting: e.target.value }))
                        }
                      />
                    </div>

                    <div>
                      <label className="fieldLabel">구도/각도</label>
                      <input
                        className="input"
                        placeholder="예) 45도 탑뷰 / 정면 중앙 / 로우앵글"
                        value={form.angle}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, angle: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  <label className="fieldLabel">
                    무드/톤 <span className="req">*</span>
                  </label>
                  <input
                    className="input"
                    placeholder="예) 미니멀, 프리미엄, 따뜻한 감성, 상큼한"
                    value={form.tone}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, tone: e.target.value }))
                    }
                  />

                  <label className="fieldLabel">
                    키워드(3~8개) <span className="req">*</span>
                  </label>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="예) clean, soft shadow, natural, premium, texture"
                    value={form.keywords}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, keywords: e.target.value }))
                    }
                  />

                  <div className="formGrid">
                    <div>
                      <label className="fieldLabel">선호 색감</label>
                      <input
                        className="input"
                        placeholder="예) 뉴트럴/오프화이트, 파스텔, 모노톤"
                        value={form.colorPref}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, colorPref: e.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <label className="fieldLabel">피하고 싶은 색감</label>
                      <input
                        className="input"
                        placeholder="예) 과한 원색, 형광톤"
                        value={form.colorAvoid}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, colorAvoid: e.target.value }))
                        }
                      />
                    </div>
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
                    placeholder="예) 작은 사이즈에서도 또렷하고, 브랜드 톤이 느껴지는 연출컷"
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
