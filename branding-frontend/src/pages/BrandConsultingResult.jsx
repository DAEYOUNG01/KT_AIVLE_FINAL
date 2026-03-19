// src/pages/BrandConsultingResult.jsx
import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import SiteHeader from "../components/SiteHeader.jsx";
import SiteFooter from "../components/SiteFooter.jsx";

import PolicyModal from "../components/PolicyModal.jsx";
import { PrivacyContent, TermsContent } from "../components/PolicyContents.jsx";

// ✅ 사용자별 localStorage 분리(계정마다 독립 진행)
import {
  userGetItem,
  userSetItem,
  userRemoveItem,
} from "../utils/userLocalStorage.js";
import "../styles/BrandConsultingResult.css";

const BRAND_HISTORY_KEY = "brandConsultingHistory_v1";

// ✅ 필드 라벨(공용)
const FIELD_LABELS = {
  companyName: "회사/프로젝트명",
  industry: "산업/분야",
  stage: "성장 단계",
  website: "웹사이트/소개 링크",
  oneLine: "한 줄 소개",
  brandDesc: "브랜드/서비스 상세 설명",

  targetCustomer: "타깃 고객",
  tone: "원하는 톤/성격",
  keywords: "핵심 키워드",
  avoidWords: "피하고 싶은 단어/뉘앙스",
  language: "언어",
  lengthPref: "길이 선호",
  mustInclude: "반드시 포함",
  competitorNames: "경쟁사/유사 서비스 이름",
  goal: "목표",
  useCase: "사용처",
  domainNeed: "도메인/계정 고려사항",

  brandPersonality: "브랜드 성격(인격)",
  avoidKeywords: "피하고 싶은 키워드/느낌",
  logoType: "로고 타입",
  styleRefs: "참고 스타일/레퍼런스",
  colorPref: "선호 색상/톤",
  colorAvoid: "피하고 싶은 색상",
  usagePlaces: "주요 사용처",
  mustAvoid: "반드시 피할 요소",
  competitorLogos: "경쟁사/유사 로고 참고",
  legalNotes: "법적/상표 고려사항",
  deliverables: "희망 산출물",
  notes: "추가 메모",

  siteGoal: "사이트 목표",
  primaryAction: "핵심 CTA(버튼)",
  mainSections: "필요한 섹션(목록)",
  keyContent: "반드시 보여줄 핵심 내용",
  productsServices: "상품/서비스 설명",
  pricing: "가격/요금 노출 방식",
  styleTone: "스타일/톤",
  referenceSites: "레퍼런스 사이트/링크",
  imagesAssets: "이미지/로고/영상 자료",
  devicePriority: "우선 디바이스",
  features: "필요 기능",
  integrations: "연동/도구",
  cms: "원하는 구현 방식",
  constraints: "제약/리스크",
  deadline: "희망 일정",
  budget: "예산",

  // ✅ story 전용
  brandCore: "브랜드 핵심(정체성/가치)",
  originStory: "시작 계기(Origin)",
  problemStory: "고객 문제(Problem)",
  solutionStory: "해결 방식(Solution)",
  keyMessages: "핵심 메시지",
  proof: "근거/증거(성과/수치/사례)",

  // ✅ 컨셉 컨설팅(Concept)
  brandName: "브랜드/서비스명",
  category: "업종/카테고리",
  core_values: "핵심 가치",
  target: "타겟 고객",
  differentiation: "차별점",
  concept_vibe: "원하는 분위기",
  tone_style: "톤/스타일",
  archetype: "브랜드 아키타입",

  // ✅ 컨셉 결과(선택안)
  selected_conceptTitle: "컨셉 타이틀",
  selected_tagline: "태그라인",
  selected_conceptStatement: "한 문장 정의",
  selected_voice: "보이스/말투",
  selected_keywords: "키워드",
  selected_quickPitch: "10초 피치",
  selected_doDont: "Do / Don't",
  selected_colorMood: "컬러/무드",
  selected_heroImagery: "추천 이미지",

  // ✅ 결과 체크(백 응답 기반)
  candidates: "후보 생성",
  selected: "후보 선택",
};

function stageLabel(stage) {
  const s = String(stage || "");
  if (s === "idea") return "아이디어 단계";
  if (s === "mvp") return "MVP/테스트 중";
  if (s === "pmf") return "PMF 탐색";
  if (s === "revenue") return "매출 발생";
  if (s === "invest") return "투자 유치 진행";
  return "-";
}

const SERVICE_CONFIG = {
  naming: {
    title: "네이밍 컨설팅 결과 리포트",
    sub: "백엔드 응답(후보/선택안)을 기반으로 결과를 표시합니다.",
    storageKey: "brandInterview_naming_v1",
    resetKeys: [
      "namingConsultingInterviewDraft_v1",
      "brandInterview_naming_v1",
    ],
    interviewPath: "/brand/naming/interview", // ✅ App.jsx와 일치
    requiredKeys: [
      "companyName",
      "industry",
      "stage",
      "oneLine",
      "targetCustomer",
      "tone",
      "keywords",
      "goal",
    ],
    blocks: [
      {
        title: "요약",
        fields: ["companyName", "industry", "stage", "oneLine"],
      },
      {
        title: "네이밍 방향",
        fields: [
          "targetCustomer",
          "tone",
          "keywords",
          "avoidWords",
          "language",
          "lengthPref",
          "mustInclude",
          "domainNeed",
        ],
      },
      {
        title: "활용/추가",
        fields: ["useCase", "competitorNames", "brandDesc", "website", "notes"],
      },
    ],
  },

  logo: {
    title: "로고 컨설팅 결과 리포트",
    sub: "저장된 입력/결과를 바탕으로 리포트를 표시합니다.",
    storageKey: "brandInterview_logo_v1",
    resetKeys: ["logoConsultingInterviewDraft_v1", "brandInterview_logo_v1"],
    interviewPath: "/brand/logo/interview", // ✅ App.jsx와 일치
    requiredKeys: [
      "companyName",
      "industry",
      "stage",
      "oneLine",
      "targetCustomer",
      "brandPersonality",
      "keywords",
      "goal",
    ],
    blocks: [
      {
        title: "요약",
        fields: ["companyName", "industry", "stage", "oneLine"],
      },
      {
        title: "로고 방향",
        fields: [
          "targetCustomer",
          "brandPersonality",
          "keywords",
          "avoidKeywords",
        ],
      },
      {
        title: "디자인 요구",
        fields: [
          "logoType",
          "usagePlaces",
          "colorPref",
          "colorAvoid",
          "styleRefs",
        ],
      },
      {
        title: "제약/리스크",
        fields: ["mustInclude", "mustAvoid", "competitorLogos", "legalNotes"],
      },
      {
        title: "목표/추가 요청",
        fields: ["goal", "deliverables", "notes", "website"],
      },
    ],
  },

  homepage: {
    title: "컨셉 컨설팅 결과 리포트",
    sub: "백엔드 응답(후보/선택안)을 기반으로 결과를 표시합니다.",
    storageKey: "brandInterview_concept_v1",
    storageKeyFallback: "brandInterview_homepage_v1",
    resetKeys: [
      "conceptConsultingInterviewDraft_v1",
      "conceptInterviewDraft_homepage_v6",
      "conceptConsultingInterviewResult_v1",
      "conceptInterviewResult_homepage_v6",
      "brandInterview_concept_v1",
      "brandInterview_homepage_v1",
    ],
    interviewPath: "/brand/concept/interview",
    requiredKeys: [
      "brandName",
      "category",
      "stage",
      "core_values",
      "target",
      "differentiation",
      "tone_style",
      "archetype",
    ],
    enrichForm: (draft) => {
      const picked =
        draft?.selected ||
        draft?.candidates?.find((c) => c?.id && c.id === draft?.selectedId) ||
        draft?.candidates?.[0] ||
        null;

      if (!picked) return {};

      return {
        selected_conceptTitle: picked.conceptTitle,
        selected_tagline: picked.tagline,
        selected_conceptStatement: picked.conceptStatement,
        selected_voice: picked.voice,
        selected_keywords: Array.isArray(picked.keywords)
          ? picked.keywords.join(", ")
          : "",
        selected_quickPitch: picked.quickPitch,
        selected_doDont: picked.doDont,
        selected_colorMood: picked.colorMood,
        selected_heroImagery: picked.heroImagery,
      };
    },
    blocks: [
      {
        title: "입력 요약",
        fields: [
          "brandName",
          "category",
          "stage",
          "core_values",
          "target",
          "differentiation",
          "tone_style",
          "archetype",
          "concept_vibe",
        ],
      },
      {
        title: "선택한 컨셉",
        fields: [
          "selected_conceptTitle",
          "selected_tagline",
          "selected_conceptStatement",
          "selected_voice",
          "selected_keywords",
          "selected_quickPitch",
        ],
      },
    ],
    deepBlocks: [
      {
        title: "선택한 컨셉 상세",
        fields: [
          "selected_doDont",
          "selected_colorMood",
          "selected_heroImagery",
        ],
      },
    ],
  },

  // ✅ NEW: story 추가
  story: {
    title: "브랜드 스토리 컨설팅 결과 리포트",
    sub: "저장된 입력/결과를 바탕으로 리포트를 표시합니다.",
    storageKey: "brandInterview_story_v1",
    resetKeys: [
      "brandStoryConsultingInterviewDraft_v1",
      "brandInterview_story_v1",
    ],
    interviewPath: "/brandstoryconsulting", // ✅ SiteHeader/Router와 일치
    requiredKeys: [
      "companyName",
      "industry",
      "stage",
      "oneLine",
      "targetCustomer",
      "brandCore",
      "goal",
    ],
    blocks: [
      {
        title: "요약",
        fields: [
          "companyName",
          "industry",
          "stage",
          "oneLine",
          "targetCustomer",
        ],
      },
      { title: "브랜드 핵심", fields: ["brandCore"] },
      {
        title: "스토리 구성",
        fields: ["originStory", "problemStory", "solutionStory"],
      },
      { title: "톤/메시지", fields: ["tone", "keyMessages"] },
      { title: "목표/근거", fields: ["goal", "proof", "notes", "website"] },
    ],
  },
};

// --------------------
// ✅ 공용 렌더 유틸 (JSON을 “칸/섹션”으로 자동 분리)
// --------------------
function isPlainObject(v) {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function renderValue(value) {
  const v = String(value ?? "").trim();
  return v ? v : "-";
}

function labelPrefixByService(service) {
  // naming / homepage(concept) / story => 컨설팅 제안
  // logo => 시안
  return service === "logo" ? "시안" : "컨설팅 제안";
}

function prettyCandidateTitle(service, title, idx) {
  const t = String(title ?? "").trim();

  // 레거시 표기(안 1/2/3, 후보 1/2/3, 로고 1/2/3)를 새 표기로 치환
  const m = t.match(/^(안|후보|제안|로고|시안)\s*(\d+)$/);
  if (m) {
    const n = m[2];
    return `${labelPrefixByService(service)} ${n}`;
  }

  // title이 비어있을 때 기본 라벨 제공
  if (!t) return `${labelPrefixByService(service)} ${idx + 1}`;

  return t;
}

function humanizeKey(key) {
  const k = String(key || "");
  const snake = k.replace(/_/g, " ");
  const spaced = snake.replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  const cleaned = spaced.replace(/\s+/g, " ").trim();
  if (!cleaned) return "-";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function labelOf(key) {
  return FIELD_LABELS[key] || humanizeKey(key);
}

function safeStringify(v) {
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

function toTextArray(v) {
  if (!v) return [];
  if (Array.isArray(v))
    return v.map((x) => String(x ?? "").trim()).filter(Boolean);
  if (typeof v === "string") {
    if (v.includes(","))
      return v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    return [v.trim()].filter(Boolean);
  }
  return [];
}

function pickFirstText(...vals) {
  for (const v of vals) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) {
      const first = v.find((x) => String(x ?? "").trim());
      if (first !== undefined) return String(first).trim();
      continue;
    }
    const s = String(v).trim();
    if (s) return s;
  }
  return "";
}

function guessItemTitle(obj, idx) {
  if (!isPlainObject(obj)) return `항목 ${idx + 1}`;
  return (
    pickFirstText(
      obj.title,
      obj.name,
      obj.label,
      obj.conceptTitle,
      obj.oneLiner,
      obj.oneLine,
      obj.tagline,
      obj.id,
      obj.code,
    ) || `항목 ${idx + 1}`
  );
}

function KVGrid({ data, columns = 2, stageKeyFallback }) {
  const entries = Object.entries(data || {}).filter(([k, v]) => {
    if (v === null || v === undefined) return false;
    const s = String(v ?? "").trim();
    if (Array.isArray(v)) return v.length > 0;
    if (isPlainObject(v)) return Object.keys(v).length > 0;
    return Boolean(s);
  });

  if (!entries.length) {
    return (
      <div className="block">
        <div className="block__body">표시할 값이 없습니다.</div>
      </div>
    );
  }

  return (
    <div
      className="summaryGrid"
      style={{
        gridTemplateColumns:
          columns === 3 ? "repeat(3, 1fr)" : "repeat(2, 1fr)",
      }}
    >
      {entries.map(([k, v]) => (
        <div className="summaryItem" key={k}>
          <div className="k">{labelOf(k)}</div>
          <div className="v" style={{ whiteSpace: "pre-wrap" }}>
            {k === "stage" || k === stageKeyFallback
              ? stageLabel(v)
              : Array.isArray(v)
                ? v.join(", ")
                : isPlainObject(v)
                  ? safeStringify(v)
                  : renderValue(v)}
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionCard({ title, subtitle, children, footer }) {
  return (
    <div className="card">
      <div className="card__head">
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {children}
      {footer ? <div style={{ marginTop: 12 }}>{footer}</div> : null}
    </div>
  );
}

function Chips({ items }) {
  const arr = toTextArray(items);
  if (!arr.length) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
      {arr.map((t, i) => (
        <span
          key={`${t}-${i}`}
          style={{
            fontSize: 12,
            padding: "6px 10px",
            borderRadius: 999,
            border: "1px solid #e5e7eb",
            background: "#fff",
          }}
        >
          {t}
        </span>
      ))}
    </div>
  );
}

function AnyValueBox({ label, value, depth = 0 }) {
  const MAX_DEPTH = 3;

  if (value === null || value === undefined) {
    return (
      <div className="block">
        <div className="block__title">{label}</div>
        <div className="block__body">-</div>
      </div>
    );
  }

  if (!Array.isArray(value) && !isPlainObject(value)) {
    return (
      <div className="block">
        <div className="block__title">{label}</div>
        <div className="block__body" style={{ whiteSpace: "pre-wrap" }}>
          {renderValue(value)}
        </div>
      </div>
    );
  }

  if (Array.isArray(value)) {
    const isPrimitiveArray = value.every(
      (x) =>
        x === null ||
        x === undefined ||
        (!Array.isArray(x) && !isPlainObject(x)),
    );

    return (
      <div className="block">
        <div className="block__title">{label}</div>
        <div className="block__body">
          {value.length === 0 ? (
            "-"
          ) : isPrimitiveArray ? (
            <Chips
              items={value.map((x) => String(x ?? "").trim()).filter(Boolean)}
            />
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {value.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    padding: 12,
                    background: "#fff",
                  }}
                >
                  <div style={{ fontWeight: 800, marginBottom: 8 }}>
                    {guessItemTitle(item, idx)}
                  </div>
                  {isPlainObject(item) ? (
                    depth >= MAX_DEPTH ? (
                      <pre
                        style={{
                          margin: 0,
                          fontSize: 12,
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {safeStringify(item)}
                      </pre>
                    ) : (
                      <KVGrid data={item} columns={2} />
                    )
                  ) : (
                    <div style={{ whiteSpace: "pre-wrap" }}>
                      {renderValue(item)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="block">
      <div className="block__title">{label}</div>
      <div className="block__body">
        {depth >= MAX_DEPTH ? (
          <details>
            <summary style={{ cursor: "pointer", fontWeight: 800 }}>
              JSON 펼치기
            </summary>
            <pre
              style={{
                marginTop: 10,
                fontSize: 12,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {safeStringify(value)}
            </pre>
          </details>
        ) : (
          <KVGrid data={value} columns={2} />
        )}
      </div>
    </div>
  );
}

function buildAutoSections(
  payload,
  { excludeKeys = [], stageKeyFallback } = {},
) {
  if (!isPlainObject(payload)) return [];

  const keys = Object.keys(payload).filter((k) => !excludeKeys.includes(k));
  if (!keys.length) return [];

  const simple = {};
  const complex = [];

  keys.forEach((k) => {
    const v = payload[k];
    const isComplex = Array.isArray(v) || isPlainObject(v);
    if (!isComplex) {
      simple[k] = v;
      return;
    }
    if (isPlainObject(v) && Object.keys(v).length <= 2) {
      simple[k] = v;
      return;
    }
    complex.push([k, v]);
  });

  const sections = [];

  if (Object.keys(simple).length) {
    sections.push({
      type: "kv",
      title: "추가 요약",
      subtitle: "백엔드 응답의 나머지 필드를 보기 좋게 정리했습니다.",
      data: simple,
      stageKeyFallback,
    });
  }

  complex.forEach(([k, v]) => {
    sections.push({
      type: "any",
      title: labelOf(k),
      subtitle: "",
      keyName: k,
      value: v,
      stageKeyFallback,
    });
  });

  return sections;
}

function getNamingDisplayTitle(c) {
  return pickFirstText(
    c?.oneLiner,
    c?.one_line,
    c?.oneLiner,
    c?.primary,
    c?.result,
    c?.finalName,
    c?.nameFinal,
    c?.samples,
    c?.title,
    c?.name,
  );
}

function getConceptDisplayTitle(c) {
  return pickFirstText(
    c?.title,
    c?.conceptTitle,
    c?.concept_title,
    c?.name,
    c?.label,
  );
}

export default function BrandConsultingResult({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [openType, setOpenType] = useState(null);
  const closeModal = () => setOpenType(null);

  const service = useMemo(() => {
    const sp = new URLSearchParams(location.search);
    const s = sp.get("service") || "naming";
    return SERVICE_CONFIG[s] ? s : "naming";
  }, [location.search]);

  const rid = useMemo(() => {
    const sp = new URLSearchParams(location.search);
    return sp.get("rid") || "";
  }, [location.search]);

  const isHistoryView = Boolean(rid);

  const config = SERVICE_CONFIG[service];

  const draft = useMemo(() => {
    // ✅ 히스토리 모드: rid가 있으면 저장된 스냅샷에서 읽어서 표시
    if (rid) {
      try {
        const parsed = safeParse(userGetItem(BRAND_HISTORY_KEY));
        const list = Array.isArray(parsed) ? parsed : [];
        const report =
          list.find((x) => String(x?.id || "") === String(rid)) || null;

        const svcKey = service === "homepage" ? "concept" : service;
        const fromHistory = report?.services?.[svcKey] || null;
        if (fromHistory) return fromHistory;
      } catch {
        // ignore
      }
    }

    // ✅ 기본 모드: 현재 사용자 localStorage의 최신 결과를 표시
    try {
      const raw =
        userGetItem(config.storageKey) ||
        (config.storageKeyFallback
          ? userGetItem(config.storageKeyFallback)
          : null);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [config.storageKey, config.storageKeyFallback, rid, service]);

  const isBackendOnlyResult = service === "naming" || service === "homepage";

  const candidates = useMemo(() => {
    return Array.isArray(draft?.candidates) ? draft.candidates : [];
  }, [draft]);

  const selectedId = draft?.selectedId ?? null;

  const selected = useMemo(() => {
    if (draft?.selected) return draft.selected;
    if (selectedId) return candidates.find((c) => c?.id === selectedId) || null;
    return null;
  }, [draft, candidates, selectedId]);

  const baseForm = draft?.form || {};
  const form = useMemo(() => {
    if (isBackendOnlyResult) return {};
    const extra = config.enrichForm ? config.enrichForm(draft) : null;
    return extra ? { ...baseForm, ...extra } : baseForm;
  }, [draft, isBackendOnlyResult]); // eslint-disable-line react-hooks/exhaustive-deps

  const requiredKeys = isBackendOnlyResult
    ? ["candidates", "selected"]
    : config.requiredKeys;

  const requiredStatus = useMemo(() => {
    const status = {};
    if (isBackendOnlyResult) {
      status.candidates = candidates.length > 0;
      status.selected = Boolean(selected);
      return status;
    }

    requiredKeys.forEach((k) => {
      status[k] = Boolean(String(form?.[k] || "").trim());
    });
    return status;
  }, [form, requiredKeys, isBackendOnlyResult, candidates.length, selected]);

  const completedRequired = useMemo(
    () => requiredKeys.filter((k) => requiredStatus[k]).length,
    [requiredKeys, requiredStatus],
  );

  const progress = useMemo(() => {
    if (requiredKeys.length === 0) return 0;
    return Math.round((completedRequired / requiredKeys.length) * 100);
  }, [completedRequired, requiredKeys.length]);

  const lastSaved = useMemo(() => {
    const t = draft?.updatedAt;
    if (!t) return "-";
    const d = new Date(t);
    return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString();
  }, [draft]);

  const extraSections = useMemo(() => {
    if (!draft) return [];
    const exclude = [
      "updatedAt",
      "form",
      "candidates",
      "selected",
      "selectedId",
    ];
    return buildAutoSections(draft, {
      excludeKeys: exclude,
      stageKeyFallback: "stage",
    });
  }, [draft]);

  const handleResetAll = () => {
    if (isHistoryView) {
      alert("히스토리 보기 모드에서는 초기화를 할 수 없습니다.");
      return;
    }
    config.resetKeys.forEach((k) => userRemoveItem(k));
    alert("해당 컨설팅 입력/결과 데이터를 초기화했습니다.");
    navigate(config.interviewPath);
  };

  const handleGoInterview = () => navigate(config.interviewPath);
  const handleGoHome = () => navigate("/brandconsulting");

  return (
    <div className="diagResult">
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

      <main className="diagResult__main">
        <div className="diagResult__container">
          <div className="diagResult__titleRow">
            <div>
              <h1 className="diagResult__title">{config.title}</h1>
              <p className="diagResult__sub">{config.sub}</p>
            </div>

            <div className="diagResult__topActions">
              <button
                type="button"
                className="btn ghost"
                onClick={handleGoHome}
              >
                브랜드 컨설팅 홈
              </button>
              <button type="button" className="btn" onClick={handleGoInterview}>
                인터뷰로 돌아가기
              </button>
            </div>
          </div>

          <div className="diagResult__grid">
            <section className="diagResult__left">
              {!draft ? (
                <div className="card">
                  <div className="card__head">
                    <h2>저장된 결과가 없습니다</h2>
                    <p>
                      인터뷰에서 <b>AI 분석 요청</b> 버튼을 누르면 결과가
                      생성됩니다.
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      type="button"
                      className="btn primary"
                      onClick={handleGoInterview}
                    >
                      인터뷰 작성하러 가기
                    </button>
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={handleGoHome}
                    >
                      브랜드 컨설팅 홈
                    </button>
                  </div>
                </div>
              ) : isBackendOnlyResult ? (
                <>
                  <SectionCard
                    title={
                      service === "naming" ? "선택한 네이밍" : "선택한 컨셉"
                    }
                    subtitle="선택안은 상단에서 한 눈에 보이게 요약하고, 세부는 아래 섹션에 나눠 표시합니다."
                    footer={
                      <div style={{ fontSize: 12, color: "#6b7280" }}>
                        마지막 저장: {lastSaved}
                      </div>
                    }
                  >
                    {selected ? (
                      <div className="block">
                        <div className="block__title">선택안 요약</div>
                        <div
                          className="block__body"
                          style={{ whiteSpace: "pre-wrap" }}
                        >
                          {service === "naming"
                            ? (() => {
                                const title = getNamingDisplayTitle(selected);
                                const label = pickFirstText(
                                  selected?.title,
                                  selected?.label,
                                  selected?.name,
                                );
                                const rationale = pickFirstText(
                                  selected?.rationale,
                                  selected?.reason,
                                  selected?.note,
                                  selected?.memo,
                                );
                                const keywords = toTextArray(
                                  selected?.keywords || selected?.tags,
                                );
                                const checks = toTextArray(
                                  selected?.checks || selected?.checkpoints,
                                );
                                const avoid = toTextArray(
                                  selected?.avoid ||
                                    selected?.avoidWords ||
                                    selected?.avoid_terms,
                                );
                                const samples = toTextArray(selected?.samples);

                                return (
                                  <div>
                                    <div
                                      style={{ fontSize: 18, fontWeight: 900 }}
                                    >
                                      {renderValue(title)}
                                    </div>

                                    {label && label !== title ? (
                                      <div
                                        style={{
                                          marginTop: 6,
                                          fontSize: 12,
                                          color: "#6b7280",
                                        }}
                                      >
                                        {label}
                                      </div>
                                    ) : null}

                                    {rationale ? (
                                      <div style={{ marginTop: 10 }}>
                                        <b>근거</b> · {rationale}
                                      </div>
                                    ) : null}

                                    {keywords.length ? (
                                      <div style={{ marginTop: 10 }}>
                                        <b>키워드</b>
                                        <Chips items={keywords} />
                                      </div>
                                    ) : null}

                                    {checks.length ? (
                                      <div style={{ marginTop: 10 }}>
                                        <b>체크 포인트</b>
                                        <Chips items={checks} />
                                      </div>
                                    ) : null}

                                    {avoid.length ? (
                                      <div style={{ marginTop: 10 }}>
                                        <b>주의</b>
                                        <Chips items={avoid} />
                                      </div>
                                    ) : null}

                                    {samples.length ? (
                                      <div style={{ marginTop: 10 }}>
                                        <b>샘플</b>
                                        <Chips items={samples} />
                                      </div>
                                    ) : null}
                                  </div>
                                );
                              })()
                            : (() => {
                                const title = getConceptDisplayTitle(selected);
                                const oneLine = pickFirstText(
                                  selected?.oneLine,
                                  selected?.one_line,
                                  selected?.oneLiner,
                                );
                                const slogan = pickFirstText(
                                  selected?.slogan,
                                  selected?.tagline,
                                );
                                const summary = pickFirstText(
                                  selected?.summary,
                                  selected?.description,
                                  selected?.overview,
                                );
                                const keyMessage = pickFirstText(
                                  selected?.keyMessage,
                                  selected?.key_message,
                                );
                                const trustFactors = pickFirstText(
                                  selected?.trustFactors,
                                  selected?.trust_factors,
                                );
                                const vibe = pickFirstText(
                                  selected?.conceptVibe,
                                  selected?.concept_vibe,
                                  selected?.vibe,
                                );
                                const tone = pickFirstText(
                                  selected?.tone,
                                  selected?.voice,
                                  selected?.style,
                                );
                                const keywords = toTextArray(
                                  selected?.keywords || selected?.tags,
                                );
                                const coreValues = toTextArray(
                                  selected?.coreValues || selected?.core_values,
                                );
                                const archetype = toTextArray(
                                  selected?.brandArchetype ||
                                    selected?.brand_archetype,
                                );

                                return (
                                  <div>
                                    <div
                                      style={{ fontSize: 18, fontWeight: 900 }}
                                    >
                                      {renderValue(title)}
                                    </div>

                                    {oneLine ? (
                                      <div style={{ marginTop: 10 }}>
                                        <b>한 줄</b> · {oneLine}
                                      </div>
                                    ) : null}

                                    {slogan ? (
                                      <div style={{ marginTop: 10 }}>
                                        <b>태그라인</b> · {slogan}
                                      </div>
                                    ) : null}

                                    {summary ? (
                                      <div style={{ marginTop: 10 }}>
                                        <b>요약</b> · {summary}
                                      </div>
                                    ) : null}

                                    {keyMessage ? (
                                      <div style={{ marginTop: 10 }}>
                                        <b>키 메시지</b> · {keyMessage}
                                      </div>
                                    ) : null}

                                    {trustFactors ? (
                                      <div style={{ marginTop: 10 }}>
                                        <b>신뢰 포인트</b> · {trustFactors}
                                      </div>
                                    ) : null}

                                    {vibe ? (
                                      <div style={{ marginTop: 10 }}>
                                        <b>분위기</b> · {vibe}
                                      </div>
                                    ) : null}

                                    {tone ? (
                                      <div style={{ marginTop: 10 }}>
                                        <b>톤/보이스</b> · {tone}
                                      </div>
                                    ) : null}

                                    {coreValues.length ? (
                                      <div style={{ marginTop: 10 }}>
                                        <b>핵심가치</b>
                                        <Chips items={coreValues} />
                                      </div>
                                    ) : null}

                                    {archetype.length ? (
                                      <div style={{ marginTop: 10 }}>
                                        <b>아키타입</b>
                                        <Chips items={archetype} />
                                      </div>
                                    ) : null}

                                    {keywords.length ? (
                                      <div style={{ marginTop: 10 }}>
                                        <b>키워드</b>
                                        <Chips items={keywords} />
                                      </div>
                                    ) : null}
                                  </div>
                                );
                              })()}
                        </div>
                      </div>
                    ) : (
                      <div className="block">
                        <div className="block__title">선택안</div>
                        <div className="block__body">
                          선택된 후보가 없습니다. 인터뷰 페이지에서 후보를
                          선택해주세요.
                        </div>
                      </div>
                    )}
                  </SectionCard>

                  <SectionCard
                    title="후보안"
                    subtitle="후보 리스트는 개별 카드로 분리해서 보기 좋게 표시합니다."
                  >
                    {candidates.length ? (
                      <div style={{ display: "grid", gap: 12 }}>
                        {candidates.map((c, idx) => {
                          const key = c?.id || `${idx}`;
                          const title =
                            service === "naming"
                              ? getNamingDisplayTitle(c)
                              : getConceptDisplayTitle(c);

                          const one =
                            service === "naming"
                              ? pickFirstText(
                                  c?.rationale,
                                  c?.reason,
                                  c?.note,
                                  c?.memo,
                                )
                              : pickFirstText(
                                  c?.oneLine,
                                  c?.one_line,
                                  c?.oneLiner,
                                  c?.summary,
                                  c?.description,
                                );

                          const kw = toTextArray(c?.keywords || c?.tags);

                          return (
                            <div
                              key={key}
                              style={{
                                border: "1px solid #e5e7eb",
                                borderRadius: 16,
                                padding: 14,
                                background: "#fff",
                              }}
                            >
                              <div style={{ fontWeight: 900, fontSize: 16 }}>
                                {prettyCandidateTitle(
                                  service,
                                  renderValue(title),
                                  idx,
                                )}
                              </div>

                              {one ? (
                                <div style={{ marginTop: 8, color: "#374151" }}>
                                  <b>
                                    {service === "naming"
                                      ? "근거"
                                      : "한 줄/요약"}
                                  </b>{" "}
                                  · {one}
                                </div>
                              ) : null}

                              {kw.length ? (
                                <div style={{ marginTop: 10 }}>
                                  <b style={{ color: "#374151" }}>키워드</b>
                                  <Chips items={kw} />
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="block">
                        <div className="block__body">
                          후보 데이터가 없습니다.
                        </div>
                      </div>
                    )}
                  </SectionCard>

                  {extraSections.length
                    ? extraSections.map((sec, i) => {
                        if (sec.type === "kv") {
                          return (
                            <SectionCard
                              key={`extra-kv-${i}`}
                              title={sec.title}
                              subtitle={sec.subtitle}
                            >
                              <KVGrid
                                data={sec.data}
                                columns={2}
                                stageKeyFallback={sec.stageKeyFallback}
                              />
                            </SectionCard>
                          );
                        }
                        return (
                          <SectionCard
                            key={`extra-any-${i}`}
                            title={sec.title}
                            subtitle={sec.subtitle}
                          >
                            <AnyValueBox
                              label={sec.title}
                              value={sec.value}
                              depth={0}
                            />
                          </SectionCard>
                        );
                      })
                    : null}
                </>
              ) : (
                config.blocks.map((b, idx) => {
                  if (b.title === "요약") {
                    return (
                      <div className="card" key={idx}>
                        <div className="card__head">
                          <h2>{b.title}</h2>
                          <p>핵심 정보만 빠르게 확인합니다.</p>
                        </div>

                        <div className="summaryGrid">
                          {b.fields.map((f) => (
                            <div className="summaryItem" key={f}>
                              <div className="k">{FIELD_LABELS[f] || f}</div>
                              <div className="v">
                                {f === "stage"
                                  ? stageLabel(form.stage)
                                  : renderValue(form[f])}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div
                          style={{
                            marginTop: 12,
                            fontSize: 12,
                            color: "#6b7280",
                          }}
                        >
                          마지막 저장: {lastSaved}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="card" key={idx}>
                      <div className="card__head">
                        <h2>{b.title}</h2>
                        <p>입력 값을 기반으로 리포트 UI를 구성합니다.</p>
                      </div>

                      {b.fields.map((f) => (
                        <div className="block" key={f}>
                          <div className="block__title">
                            {FIELD_LABELS[f] || f}
                          </div>
                          <div
                            className="block__body"
                            style={{ whiteSpace: "pre-wrap" }}
                          >
                            {renderValue(
                              f === "stage" ? stageLabel(form.stage) : form[f],
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })
              )}
            </section>

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

                <div className="divider" />

                <button
                  type="button"
                  className="btn primary w100"
                  onClick={handleGoInterview}
                >
                  입력 수정하기
                </button>
                {!isHistoryView ? (
                  <button
                    type="button"
                    className="btn ghost w100"
                    onClick={handleResetAll}
                    style={{ marginTop: 10 }}
                  >
                    처음부터 다시하기(초기화)
                  </button>
                ) : null}

                <p className="hint">
                  * naming / concept(homepage)은 <b>백 응답 JSON</b>을
                  “섹션/칸”으로 자동 분리해 표시합니다.
                  {isHistoryView ? " (현재는 히스토리 스냅샷 보기 모드)" : ""}
                </p>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <SiteFooter onOpenPolicy={setOpenType} />
    </div>
  );
}
