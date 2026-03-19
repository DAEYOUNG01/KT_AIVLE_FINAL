// src/pages/SNSPosterConsultingInterview.jsx
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

// ✅ 마이페이지 카드(히스토리) 저장
import {
  addPromoReport,
  createPromoReportSnapshot,
} from "../utils/promoReportHistory.js";
import "../styles/ConceptConsultingInterview.css";
import "../styles/ConsultingUnifiedTheme.css";

/**
 * ✅ 홍보물 컨설팅 (독립 서비스)
 * - SNS 제품 포스터 컨설팅
 * - 브랜드 컨설팅 인터뷰(ConceptConsultingInterview)와 유사한 레이아웃/진행 UI
 * - 필수 입력 완료 → 후보 3안(카피/레이아웃+이미지 프롬프트) 생성 → 1안 선택 → 결과 페이지
 */

const STORAGE_KEY = "promoInterviewDraft_poster_v1";
const RESULT_KEY = "promoInterviewResult_poster_v1";
const LEGACY_KEY = "promo_poster_v1"; // (마이페이지/히스토리/완료표시용)

function safeParse(raw) {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function compactList(text) {
  return String(text || "")
    .split(/[,\n]/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function buildPosterPrompt({
  brandName,
  productName,
  targetPlatform,
  tone,
  keyMessage,
  colorPref,
  layoutPref,
  aspectRatio,
}) {
  const brand = brandName?.trim() ? brandName.trim() : "브랜드";
  const product = productName?.trim() ? productName.trim() : "제품";
  const platform = targetPlatform?.trim() ? targetPlatform.trim() : "SNS";
  const mood = tone?.trim() ? tone.trim() : "미니멀하고 현대적인";
  const msg = keyMessage?.trim() ? keyMessage.trim() : "핵심 메시지";
  const colors = colorPref?.trim()
    ? `Color palette: ${colorPref}`
    : "Color palette: neutral + brand accent";
  const layout = layoutPref?.trim()
    ? `Layout: ${layoutPref}`
    : "Layout: clean grid, large product area, clear CTA area";
  const ratio = aspectRatio?.trim()
    ? `Aspect ratio: ${aspectRatio}`
    : "Aspect ratio: 1:1";

  return (
    `High-quality product poster for ${platform}. ` +
    `Brand: ${brand}. Product: ${product}. ` +
    `Style: ${mood}. ` +
    `Core message: "${msg}". ` +
    `${colors}. ${layout}. ${ratio}. ` +
    "Modern typography, generous whitespace, studio lighting, sharp focus, no watermark, no illegible text."
  );
}

function makeCandidates(form) {
  const mood = form.tone?.trim() || "미니멀·프리미엄";
  const ratio = form.aspectRatio || "1:1";
  const keys = compactList(form.keywords).join(" · ");

  return [
    {
      id: "a",
      name: "제품 강조형 미니멀 포스터",
      summary: [
        "제품 비주얼을 크게 배치하고 카피는 최소화",
        `톤: ${mood} / 비율: ${ratio}`,
        "신제품 런칭·브랜드 신뢰감 전달에 유리",
      ],
      copy: [
        form.keyMessage?.trim() || "핵심 메시지 1문장",
        "서브 카피: 제품의 가장 큰 장점 1개",
        "CTA: 지금 확인하기 / 구매하기",
      ],
      prompt: buildPosterPrompt({
        ...form,
        layoutPref:
          form.layoutPref || "product hero large + minimal copy + clear CTA",
      }),
      do: [
        "제품 영역을 60% 이상 확보",
        "카피 3줄 이내",
        "CTA는 버튼/스티커로 분리",
      ],
      dont: ["요소 과다", "과한 장식 프레임", "복잡한 배경 텍스처"],
    },
    {
      id: "b",
      name: "혜택/할인 강조형 프로모션 포스터",
      summary: [
        "할인/혜택(숫자)을 강하게 보여주는 구조",
        keys ? `키워드: ${keys}` : "키워드 기반 혜택/문구를 강조",
        "캠페인·이벤트(기간 한정) 전환에 유리",
      ],
      copy: [
        "헤드라인: 최대 00% / 00원 혜택",
        "혜택 요약 2~3개 (아이콘/불릿)",
        "CTA: 지금 쿠폰 받기 / 바로 구매",
      ],
      prompt: buildPosterPrompt({
        ...form,
        layoutPref:
          form.layoutPref ||
          "promo badge + big numbers + benefit bullets + CTA",
      }),
      do: [
        "숫자(혜택)를 가장 크게",
        "기간/조건은 작은 영역에 정리",
        "혜택 3개 이내",
      ],
      dont: ["너무 많은 조건 문구", "가독성 낮은 폰트", "강한 색 4개 이상"],
    },
    {
      id: "c",
      name: "라이프스타일 무드형 포스터",
      summary: [
        "사용 장면(무드)을 보여줘서 감성/브랜딩 강화",
        `플랫폼: ${form.targetPlatform || "SNS"} / 톤: ${mood}`,
        "브랜드 세계관·프리미엄 이미지 구축에 유리",
      ],
      copy: [
        "헤드라인: 삶의 한 장면을 바꾸는 ○○",
        "서브: 자연스러운 사용 경험/감성 키워드",
        "CTA: 자세히 보기",
      ],
      prompt: buildPosterPrompt({
        ...form,
        layoutPref:
          form.layoutPref ||
          "lifestyle scene background + product integrated + soft typography + subtle CTA",
      }),
      do: [
        "배경은 단순한 무드(1개 장면)",
        "제품은 자연스럽게 포함",
        "카피는 감성 1문장+서브",
      ],
      dont: ["배경 정보 과다", "제품이 묻히는 구도", "과도한 필터/노이즈"],
    },
  ];
}

export default function SNSPosterConsultingInterview({ onLogout }) {
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
    campaignGoal: "",

    tone: "",
    keyMessage: "",
    benefits: "",
    copyPoints: "",
    callToAction: "",
    keywords: "",

    aspectRatio: "1:1",
    layoutPref: "",
    colorPref: "",
    colorAvoid: "",
    typographyPref: "",

    mustInclude: "",
    mustAvoid: "",
    references: "",

    goal: "",
    notes: "",
  });

  // ✅ 후보/선택
  const [candidates, setCandidates] = useState([]);
  const [selectedId, setSelectedId] = useState("");

  // ✅ 저장 상태 UI
  const [saveMsg, setSaveMsg] = useState("");
  const [lastSaved, setLastSaved] = useState("-");

  // 섹션 스크롤 ref
  const refBasic = useRef(null);
  const refMessage = useRef(null);
  const refDesign = useRef(null);
  const refConstraints = useRef(null);
  const refGoal = useRef(null);
  const refResult = useRef(null);

  const sections = useMemo(
    () => [
      { id: "basic", label: "기본 정보", ref: refBasic },
      { id: "message", label: "메시지/카피", ref: refMessage },
      { id: "design", label: "디자인 방향", ref: refDesign },
      { id: "constraints", label: "제약/참고", ref: refConstraints },
      { id: "goal", label: "목표/요청", ref: refGoal },
      { id: "result", label: "후보 3안", ref: refResult },
    ],
    [],
  );

  const requiredKeys = useMemo(
    () => [
      "productName",
      "targetPlatform",
      "targetCustomer",
      "tone",
      "keyMessage",
      "goal",
    ],
    [],
  );

  const setValue = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

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
    const basicOk =
      form.productName.trim() &&
      form.targetPlatform.trim() &&
      form.targetCustomer.trim();

    if (!basicOk) return "기본 정보";
    if (!form.keyMessage.trim() || !form.tone.trim()) return "메시지/카피";
    if (!form.goal.trim()) return "목표/요청";
    return "완료";
  }, [form]);

  // ✅ draft/result 로드
  useEffect(() => {
    const draft = safeParse(userGetItem(STORAGE_KEY));
    if (draft?.form) setForm((prev) => ({ ...prev, ...draft.form }));
    if (Array.isArray(draft?.candidates)) setCandidates(draft.candidates);
    if (typeof draft?.selectedId === "string") setSelectedId(draft.selectedId);
    if (draft?.updatedAt) {
      const d = new Date(draft.updatedAt);
      if (!Number.isNaN(d.getTime())) setLastSaved(d.toLocaleString());
    }

    const result = safeParse(userGetItem(RESULT_KEY));
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

  const scrollToSection = (ref) => {
    if (!ref?.current) return;
    ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleNext = () => {
    const map = {
      "기본 정보": refMessage,
      "메시지/카피": refDesign,
      "목표/요청": refResult,
      완료: refResult,
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
      service: "poster",
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
          title: selected?.name || "SNS 제품 포스터 컨설팅",
          subtitle: form.productName || form.brandName,
        },
      }),
    );

    try {
      // ✅ 완료 시점의 결과 스냅샷 저장(카드 히스토리)
      addPromoReport(
        createPromoReportSnapshot({
          serviceKey: "poster",
          serviceLabel: "SNS 제품 포스터 컨설팅",
          interviewRoute: "/promotion/poster/interview",
          result: payload,
        }),
      );
    } catch {
      // ignore
    }

    navigate("/promotion/result?service=poster");
  };

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
                  SNS 제품 포스터 컨설팅 인터뷰
                </h1>
                <p className="diagInterview__sub">
                  브랜드 컨설팅 인터뷰와 동일한 구성으로 질문을 작성하고, 포스터
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

          <PromotionServicePanel activeKey="poster" />

          <div className="diagInterview__grid">
            {/* LEFT */}

            <section className="diagInterview__left">
              <div className="card consultingIntroCard">
                <div className="card__head">
                  <h2>SNS Product Poster Consulting Interview</h2>
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
                  <p>
                    제품/플랫폼/타깃이 명확할수록 카피와 레이아웃이 좋아져요.
                  </p>
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
                      placeholder="예) 스마트 텀블러"
                    />
                  </div>
                  <div className="field">
                    <label>제품 카테고리 (선택)</label>
                    <input
                      value={form.productCategory}
                      onChange={(e) =>
                        setValue("productCategory", e.target.value)
                      }
                      placeholder="예) 생활/주방, 뷰티, IT기기"
                    />
                  </div>
                  <div className="field">
                    <label>
                      타깃 플랫폼 <span className="req">*</span>
                    </label>
                    <select
                      value={form.targetPlatform}
                      onChange={(e) =>
                        setValue("targetPlatform", e.target.value)
                      }
                    >
                      <option value="">선택</option>
                      <option value="Instagram">Instagram</option>
                      <option value="Facebook">Facebook</option>
                      <option value="TikTok">TikTok</option>
                      <option value="Naver Blog">Naver Blog</option>
                      <option value="SmartStore">스마트스토어</option>
                      <option value="Coupang">쿠팡</option>
                      <option value="Others">기타</option>
                    </select>
                  </div>
                </div>

                <div className="field">
                  <label>
                    타깃 고객 <span className="req">*</span>
                  </label>
                  <input
                    value={form.targetCustomer}
                    onChange={(e) => setValue("targetCustomer", e.target.value)}
                    placeholder="예) 20~30대 직장인 / 1인 가구 / 선물 구매층"
                  />
                </div>

                <div className="field">
                  <label>캠페인 목적 (선택)</label>
                  <input
                    value={form.campaignGoal}
                    onChange={(e) => setValue("campaignGoal", e.target.value)}
                    placeholder="예) 신제품 런칭, 재구매 유도, 이벤트 홍보"
                  />
                </div>
              </div>

              {/* 2) MESSAGE */}
              <div className="card" ref={refMessage}>
                <div className="card__head">
                  <h2>메시지/카피</h2>
                  <p>포스터는 “한 문장”으로 설득하는 게임이에요.</p>
                </div>

                <div className="formGrid">
                  <div className="field">
                    <label>
                      톤/분위기 <span className="req">*</span>
                    </label>
                    <input
                      value={form.tone}
                      onChange={(e) => setValue("tone", e.target.value)}
                      placeholder="예) 미니멀, 프리미엄, 발랄, 감성, 테크"
                    />
                  </div>

                  <div className="field">
                    <label>
                      핵심 메시지(1문장) <span className="req">*</span>
                    </label>
                    <input
                      value={form.keyMessage}
                      onChange={(e) => setValue("keyMessage", e.target.value)}
                      placeholder="예) 하루 물 섭취를 자동으로 관리해주는 스마트 텀블러"
                    />
                  </div>
                </div>

                <div className="field">
                  <label>주요 혜택/장점 (선택)</label>
                  <textarea
                    value={form.benefits}
                    onChange={(e) => setValue("benefits", e.target.value)}
                    placeholder={
                      "예)\n- 온도 유지 12시간\n- 앱 연동 알림\n- BPA Free"
                    }
                    rows={4}
                  />
                </div>

                <div className="formGrid">
                  <div className="field">
                    <label>카피 포인트(키워드) (선택)</label>
                    <input
                      value={form.copyPoints}
                      onChange={(e) => setValue("copyPoints", e.target.value)}
                      placeholder="예) 가벼움, 휴대성, 선물, 건강"
                    />
                  </div>
                  <div className="field">
                    <label>CTA 문구(선택)</label>
                    <input
                      value={form.callToAction}
                      onChange={(e) => setValue("callToAction", e.target.value)}
                      placeholder="예) 지금 구매하기 / 쿠폰 받기"
                    />
                  </div>
                </div>

                <div className="field">
                  <label>추가 키워드 (선택)</label>
                  <textarea
                    value={form.keywords}
                    onChange={(e) => setValue("keywords", e.target.value)}
                    placeholder="예) 건강, 루틴, 선물, 미니멀, 프리미엄"
                    rows={3}
                  />
                </div>
              </div>

              {/* 3) DESIGN */}
              <div className="card" ref={refDesign}>
                <div className="card__head">
                  <h2>디자인 방향</h2>
                  <p>비율/레이아웃/색감만 정리해도 결과가 깔끔해집니다.</p>
                </div>

                <div className="formGrid">
                  <div className="field">
                    <label>비율(권장) (선택)</label>
                    <select
                      value={form.aspectRatio}
                      onChange={(e) => setValue("aspectRatio", e.target.value)}
                    >
                      <option value="1:1">1:1 (정사각)</option>
                      <option value="4:5">4:5 (인스타 피드)</option>
                      <option value="9:16">9:16 (스토리/릴스)</option>
                      <option value="16:9">16:9 (가로 배너)</option>
                    </select>
                  </div>

                  <div className="field">
                    <label>레이아웃 선호 (선택)</label>
                    <input
                      value={form.layoutPref}
                      onChange={(e) => setValue("layoutPref", e.target.value)}
                      placeholder="예) 제품 크게 + 카피 최소 / 혜택 배지 + 숫자 강조"
                    />
                  </div>

                  <div className="field">
                    <label>원하는 색상/톤 (선택)</label>
                    <input
                      value={form.colorPref}
                      onChange={(e) => setValue("colorPref", e.target.value)}
                      placeholder="예) 네이비/오프화이트, 파스텔, 브랜드 컬러"
                    />
                  </div>

                  <div className="field">
                    <label>피하고 싶은 색상 (선택)</label>
                    <input
                      value={form.colorAvoid}
                      onChange={(e) => setValue("colorAvoid", e.target.value)}
                      placeholder="예) 형광색, 강한 빨강"
                    />
                  </div>
                </div>

                <div className="field">
                  <label>폰트/타이포 선호 (선택)</label>
                  <input
                    value={form.typographyPref}
                    onChange={(e) => setValue("typographyPref", e.target.value)}
                    placeholder="예) 깔끔한 산세리프, 굵은 헤드라인, 얇은 본문"
                  />
                </div>
              </div>

              {/* 4) CONSTRAINTS */}
              <div className="card" ref={refConstraints}>
                <div className="card__head">
                  <h2>제약/참고</h2>
                  <p>필수 포함 요소/금지 요소를 적어두면 시행착오가 줄어요.</p>
                </div>

                <div className="formGrid">
                  <div className="field">
                    <label>반드시 포함할 요소 (선택)</label>
                    <input
                      value={form.mustInclude}
                      onChange={(e) => setValue("mustInclude", e.target.value)}
                      placeholder="예) 제품명, 로고, 가격, 이벤트 기간"
                    />
                  </div>

                  <div className="field">
                    <label>반드시 피할 요소 (선택)</label>
                    <input
                      value={form.mustAvoid}
                      onChange={(e) => setValue("mustAvoid", e.target.value)}
                      placeholder="예) 과장 표현, 특정 소재, 과한 장식"
                    />
                  </div>
                </div>

                <div className="field">
                  <label>레퍼런스/참고 링크 (선택)</label>
                  <textarea
                    value={form.references}
                    onChange={(e) => setValue("references", e.target.value)}
                    placeholder="예) 좋아하는 브랜드 포스터 링크 / 경쟁사 링크"
                    rows={4}
                  />
                </div>
              </div>

              {/* 5) GOAL */}
              <div className="card" ref={refGoal}>
                <div className="card__head">
                  <h2>목표/요청</h2>
                  <p>최종적으로 어떤 반응을 얻고 싶은지 정리해요.</p>
                </div>

                <div className="field">
                  <label>
                    목표 <span className="req">*</span>
                  </label>
                  <textarea
                    value={form.goal}
                    onChange={(e) => setValue("goal", e.target.value)}
                    placeholder="예) 클릭률/전환율을 올리고, 제품의 핵심 장점을 한눈에 전달하고 싶어요."
                    rows={4}
                  />
                </div>

                <div className="field">
                  <label>추가 메모 (선택)</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setValue("notes", e.target.value)}
                    placeholder="예) 텍스트는 과하지 않게, 깔끔한 분위기 유지 / 특정 문구는 반드시 포함"
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
                              <div style={{ marginTop: 10 }}>
                                <h4 style={{ marginBottom: 6 }}>추천 카피</h4>
                                <ul style={{ margin: 0, paddingLeft: 18 }}>
                                  {(c.copy || []).map((t) => (
                                    <li key={t}>{t}</li>
                                  ))}
                                </ul>
                              </div>
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

              {/* Bottom bar */}
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

            {/* RIGHT */}
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
                  <li className={requiredStatus.targetPlatform ? "ok" : ""}>
                    플랫폼
                  </li>
                  <li className={requiredStatus.targetCustomer ? "ok" : ""}>
                    타깃 고객
                  </li>
                  <li className={requiredStatus.tone ? "ok" : ""}>톤/분위기</li>
                  <li className={requiredStatus.keyMessage ? "ok" : ""}>
                    핵심 메시지
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
