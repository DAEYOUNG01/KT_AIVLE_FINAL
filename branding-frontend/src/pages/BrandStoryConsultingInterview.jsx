// src/pages/BrandStoryConsultingInterview.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import SiteHeader from "../components/SiteHeader.jsx";
import SiteFooter from "../components/SiteFooter.jsx";

import ConsultingFlowPanel from "../components/ConsultingFlowPanel.jsx";
import ConsultingFlowMini from "../components/ConsultingFlowMini.jsx";

import PolicyModal from "../components/PolicyModal.jsx";
import { PrivacyContent, TermsContent } from "../components/PolicyContents.jsx";

// ✅ 사용자별 localStorage 분리(계정마다 독립 진행)
import {
  userGetItem,
  userSetItem,
  userRemoveItem,
} from "../utils/userLocalStorage.js";

import {
  ensureStrictStepAccess,
  migrateLegacyToPipelineIfNeeded,
  setBrandFlowCurrent,
  setStepResult,
  clearStepsFrom,
  readPipeline,
  startBrandFlow,
  ensureBrandIdConsistency,
} from "../utils/brandPipelineStorage.js";

// ✅ 백 연동(이미 프로젝트에 존재하는 클라이언트 사용)
import { apiRequest, apiRequestAI } from "../api/client.js";
import "../styles/BrandStoryConsultingInterview.css";
import "../styles/ConsultingUnifiedTheme.css";

const STORAGE_KEY = "brandStoryConsultingInterviewDraft_v1";
const RESULT_KEY = "brandStoryConsultingInterviewResult_v1";
const LEGACY_KEY = "brandInterview_story_v1";
const NEXT_PATH = "/brand/logo/interview";

function alertBrandIdMismatchAndStop(info) {
  const expected = info?.expectedBrandId ?? "-";
  const incoming = info?.incomingBrandId ?? "-";
  window.alert(
    `기업진단에서 생성된 brandID(${expected})와 다른 ID(${incoming})가 감지되어 컨설팅을 중단합니다.\n진행 중이던 컨설팅은 동일한 brandID로만 이어서 진행할 수 있습니다.`,
  );
}

const DIAG_KEYS = ["diagnosisInterviewDraft_v1", "diagnosisInterviewDraft"];

function safeText(v, fallback = "") {
  const s = String(v ?? "").trim();
  return s ? s : fallback;
}

function stageLabel(v) {
  const s = String(v || "")
    .trim()
    .toLowerCase();
  if (!s) return "-";
  if (s === "idea") return "아이디어";
  if (s === "mvp") return "MVP";
  if (s === "pmf") return "PMF";
  if (s === "revenue" || s === "early_revenue") return "매출";
  if (s === "invest") return "투자";
  if (s === "scaleup" || s === "scaling") return "스케일업";
  if (s === "rebrand") return "리브랜딩";
  return String(v);
}

function safeParse(raw) {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function readDiagnosisForm() {
  for (const k of DIAG_KEYS) {
    const parsed = safeParse(userGetItem(k));
    if (!parsed) continue;
    const form =
      parsed?.form && typeof parsed.form === "object" ? parsed.form : parsed;
    if (form && typeof form === "object") return form;
  }
  return null;
}

function getBasicFromDiagnosis(diag) {
  if (!diag || typeof diag !== "object") return null;

  return {
    companyName: safeText(
      diag.companyName || diag.brandName || diag.projectName,
      "",
    ),
    industry: safeText(diag.industry || diag.category || diag.field, ""),
    stage: safeText(diag.stage, ""),
    website: safeText(diag.website || diag.homepage || diag.siteUrl, ""),
    oneLine: safeText(
      diag.oneLine ||
        diag.companyIntro ||
        diag.intro ||
        diag.serviceIntro ||
        diag.shortIntro,
      "",
    ),
    targetCustomer: safeText(
      diag.targetCustomer ||
        diag.target ||
        diag.customerTarget ||
        diag.primaryCustomer,
      "",
    ),
  };
}

function buildDiagnosisSummaryString(ctx) {
  if (!ctx) return "";
  const parts = [];
  if (ctx.companyName) parts.push(`회사/프로젝트: ${ctx.companyName}`);
  if (ctx.industry) parts.push(`산업/분야: ${ctx.industry}`);
  if (ctx.stage) parts.push(`성장단계: ${stageLabel(ctx.stage)}`);
  if (ctx.targetCustomer) parts.push(`타깃: ${ctx.targetCustomer}`);
  if (ctx.website) parts.push(`링크: ${ctx.website}`);
  if (ctx.oneLine) parts.push(`한줄소개: ${ctx.oneLine}`);
  return parts.join(" | ");
}

function isFilled(v) {
  if (Array.isArray(v)) return v.length > 0;
  return Boolean(String(v ?? "").trim());
}

function QTag({ n }) {
  return <span className="questionNumber">{n}.</span>;
}

/** ✅ multiple 선택용 칩 UI (value는 배열) */
function MultiChips({ value, options, onChange, max = null }) {
  const current = Array.isArray(value) ? value : [];

  const normOpt = (opt) => {
    if (typeof opt === "string") return { value: opt, label: opt };
    return {
      value: opt?.value,
      label: opt?.label ?? opt?.text ?? String(opt?.value ?? ""),
    };
  };

  const toggle = (optRaw) => {
    const opt = normOpt(optRaw);
    if (!opt.value) return;

    const exists = current.includes(opt.value);
    let next = exists
      ? current.filter((x) => x !== opt.value)
      : [...current, opt.value];

    if (typeof max === "number" && max > 0 && next.length > max) {
      // ✅ 최대 선택 수를 넘으면 "마지막으로 누른 것"이 들어가도록 유지
      const last = opt.value;
      next = next.filter((x) => x !== last);
      next = [...next.slice(0, Math.max(0, max - 1)), last];
    }
    onChange(next);
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {options.map((optRaw) => {
        const opt = normOpt(optRaw);
        const active = current.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            onClick={() => toggle(optRaw)}
            style={{
              fontSize: 12,
              fontWeight: 800,
              padding: "7px 11px",
              borderRadius: 999,
              background: active ? "rgba(37,99,235,0.10)" : "rgba(0,0,0,0.04)",
              border: active
                ? "1px solid rgba(37,99,235,0.36)"
                : "1px solid rgba(0,0,0,0.10)",
              color: "rgba(0,0,0,0.78)",
              cursor: "pointer",
              transition: "transform 120ms ease, background 140ms ease",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

const STORY_PLOT_OPTIONS = [
  {
    id: "plot_problem",
    text: "문제 해결형",
    value: "Problem-Solution",
    description: "고객의 문제를 발견하고 해결책을 제시하는 구조",
    example: "많은 사람들이 OO 때문에 고통받았다 → 우리가 XX로 해결했다",
  },
  {
    id: "plot_vision",
    text: "비전 제시형",
    value: "Visionary",
    description: "미래의 더 나은 세상을 제시하는 구조",
    example: "우리는 OO한 세상을 꿈꾼다 → 함께 만들어가자",
  },
  {
    id: "plot_hero",
    text: "영웅의 여정형",
    value: "Hero's Journey",
    description: "도전과 성장의 과정을 담은 구조",
    example: "작은 시작 → 시련 극복 → 변화 창출",
  },
  {
    id: "plot_myth",
    text: "탄생 신화형",
    value: "Founding Myth",
    description: "브랜드가 어떻게 탄생했는지 신화처럼 풀어내는 구조",
    example: "한 사람의 작은 아이디어가 세상을 바꾸기 시작했다",
  },
  {
    id: "plot_other",
    text: "기타",
    value: "Other",
    has_text_input: true,
    text_input_placeholder: "원하는 스토리 구조를 설명해주세요",
  },
];

const STORY_EMOTION_OPTIONS = [
  {
    id: "emo_relief",
    text: "안도감",
    value: "Relief",
    description: "이제 걱정 안 해도 된다는 느낌",
  },
  {
    id: "emo_curiosity",
    text: "호기심",
    value: "Curiosity",
    description: "더 알고 싶고 경험해보고 싶은 느낌",
  },
  {
    id: "emo_excitement",
    text: "설렘",
    value: "Excitement",
    description: "새로운 가능성에 대한 기대",
  },
  {
    id: "emo_empowerment",
    text: "자신감",
    value: "Empowerment",
    description: "나도 할 수 있다는 힘",
  },
  {
    id: "emo_belonging",
    text: "소속감",
    value: "Belonging",
    description: "우리는 연결되어 있다는 느낌",
  },
  {
    id: "emo_nostalgia",
    text: "향수",
    value: "Nostalgia",
    description: "따뜻한 과거를 떠올리는 감정",
  },
  {
    id: "emo_other",
    text: "기타",
    value: "Other",
    has_text_input: true,
    text_input_placeholder: "자극하고 싶은 감정을 설명해주세요",
  },
];

const PLOT_LABEL = Object.fromEntries(
  STORY_PLOT_OPTIONS.map((o) => [o.value, o.text]),
);
const EMO_LABEL = Object.fromEntries(
  STORY_EMOTION_OPTIONS.map((o) => [o.value, o.text]),
);

function plotLabelValue(plotValue, plotOther) {
  if (plotValue === "Other") {
    const t = safeText(plotOther, "");
    return t ? `기타(${t})` : "기타";
  }
  return PLOT_LABEL[plotValue] || safeText(plotValue, "-");
}

function emotionLabels(values, otherText) {
  const list = Array.isArray(values) ? values : [];
  const mapped = list.map((v) =>
    v === "Other"
      ? safeText(otherText)
        ? `기타(${safeText(otherText)})`
        : "기타"
      : EMO_LABEL[v] || v,
  );
  return mapped.filter(Boolean);
}

/**
 * ✅ (보험) 백 응답이 비거나 실패할 때 로컬에서 3안 생성
 * - 기본정보(UI 제거됨)는 diagCtx에서 가져와 품질 유지
 */
function generateStoryCandidates(form, seed = 0, diagCtx = null) {
  const ctx = diagCtx || {};

  const companyName = safeText(ctx?.companyName, "우리");
  const industry = safeText(ctx?.industry, "분야");
  const stage = stageLabel(ctx?.stage);
  const target = safeText(ctx?.targetCustomer, "고객");
  const oneLine = safeText(ctx?.oneLine, "");

  const founding = safeText(form?.founding_story, "");
  const transformation = safeText(form?.customer_transformation, "");
  const aha = safeText(form?.aha_moment, "");
  const mission = safeText(form?.brand_mission, "");
  const conflict = safeText(form?.customer_conflict, "");
  const ultimate = safeText(form?.ultimate_goal, "");

  const founderPersonality = safeText(form?.founder_personality, "");
  const flagshipCase = safeText(form?.flagship_case, "");

  const plotValue = safeText(form?.story_plot, "");
  const plotOther = safeText(form?.story_plot_other, "");
  const plotLabel = plotLabelValue(plotValue, plotOther);

  const emoValues = Array.isArray(form?.story_emotion)
    ? form.story_emotion
    : [];
  const emoOther = safeText(form?.story_emotion_other, "");
  const emotions = emotionLabels(emoValues, emoOther);

  const pick = (arr, idx) => arr[(idx + seed) % arr.length];

  const hooks = [
    "왜 좋은 선택이 늘 어려울까요?",
    "고객의 하루는 늘 방해물로 가득합니다.",
    "우리는 ‘당연한 불편’을 당연하게 넘기지 않았습니다.",
    "작은 결핍이 큰 포기로 이어지는 순간이 있습니다.",
  ];

  const endings = [
    "우리는 오늘도 고객이 더 쉽게, 더 확신 있게 앞으로 나아가도록 돕습니다.",
    "우리는 고객이 멈추는 지점에서 다시 움직이게 만드는 브랜드가 되겠습니다.",
    "우리는 더 나은 내일을 ‘실행 가능한 이야기’로 만들겠습니다.",
  ];

  const baseMeta = () => ({
    oneLiner: oneLine
      ? `“${oneLine}”`
      : `“${ultimate || mission || "브랜드 스토리"}”`,
    meta: `${industry} · ${stage} · 타깃: ${target}`,
    emotions: emotions.length ? emotions : ["안도감"],
    plot: plotLabel || "-",
  });

  const block = (title, content, fallback) => {
    const c = safeText(content, "");
    return c ? `【${title}】\n${c}` : `【${title}】\n${fallback}`;
  };

  const buildStory = (plotTypeValue, variantSeed = 0) => {
    const hook = pick(hooks, variantSeed);
    const end = pick(endings, variantSeed);

    const pFounding = block(
      "창업 계기",
      founding,
      `시작은 작은 질문에서 출발했습니다. “${hook}”`,
    );
    const pConflict = block(
      "고객의 결핍/방해물",
      conflict,
      `${target}은(는) 중요한 순간에 ‘정보/시간/확신’의 결핍으로 흔들립니다.`,
    );
    const pTransform = block(
      "사용 전/후 변화",
      transformation,
      `사용 전에는 고민이 길어지고 실행이 끊기지만, 사용 후에는 선택이 빨라지고 실행이 이어집니다.`,
    );
    const pAha = block(
      "감탄의 순간",
      aha,
      `고객이 “와, 이렇게 간단할 수가!”라고 느끼는 순간을 만들어냅니다.`,
    );
    const pMission = block(
      "미션",
      mission,
      `우리는 수익을 넘어, 고객이 더 나은 결정을 내리고 지속적으로 성장하도록 돕고자 합니다.`,
    );
    const pUltimate = block(
      "궁극적 목표",
      ultimate,
      `우리는 ‘더 쉽고 더 신뢰할 수 있는 선택’이 당연한 세상을 만들고자 합니다.`,
    );

    const pFounder = founderPersonality
      ? `【팀/창업자 성격】\n${founderPersonality}`
      : "";

    const pCase = flagshipCase ? `【대표 고객 사례】\n${flagshipCase}` : "";

    const emoLine = `【자극하고 싶은 감정】 ${(emotions.length ? emotions : ["안도감"]).join(" · ")}`;
    const plotLine = `【스토리 구조】 ${plotLabel || plotTypeValue || "-"}`;

    if (plotTypeValue === "Problem-Solution") {
      return {
        plot: plotLabel,
        story: [
          `【훅】 ${hook}`,
          plotLine,
          pConflict,
          pFounding,
          pTransform,
          pAha,
          pMission,
          pUltimate,
          pFounder,
          pCase,
          emoLine,
          `【마무리】 ${end}`,
        ]
          .filter(Boolean)
          .join("\n\n"),
        ending: end,
      };
    }

    if (plotTypeValue === "Visionary") {
      return {
        plot: plotLabel,
        story: [
          `【훅】 우리가 꿈꾸는 미래는 분명합니다.`,
          plotLine,
          pUltimate,
          pMission,
          pConflict,
          pTransform,
          pAha,
          pFounding,
          pFounder,
          pCase,
          emoLine,
          `【마무리】 ${end}`,
        ]
          .filter(Boolean)
          .join("\n\n"),
        ending: end,
      };
    }

    if (plotTypeValue === "Hero's Journey") {
      return {
        plot: plotLabel,
        story: [
          `【훅】 이 이야기는 ‘도전 → 변화 → 새로운 일상’의 여정입니다.`,
          plotLine,
          `【부름(문제의 등장)】\n${safeText(conflict, `${target}은(는) 중요한 순간마다 방해물에 부딪힙니다.`)}`,
          `【시련(해결의 탐색)】\n${safeText(founding, `우리는 그 불편을 외면하지 않고 끝까지 파고들었습니다.`)}`,
          `【변화(전환점)】\n${safeText(transformation, `사용 전에는 망설임이 길었지만, 사용 후에는 확신이 생깁니다.`)}`,
          `【감탄(결정적 순간)】\n${safeText(aha, `고객이 “이제 됐다”라고 느끼는 순간이 생깁니다.`)}`,
          pMission,
          pUltimate,
          pFounder,
          pCase,
          emoLine,
          `【마무리】 ${end}`,
        ]
          .filter(Boolean)
          .join("\n\n"),
        ending: end,
      };
    }

    return {
      plot: plotLabel,
      story: [
        `【훅】 이 이야기는 ‘왜 시작했는가’에서 시작합니다.`,
        plotLine,
        pFounding,
        pMission,
        pConflict,
        pTransform,
        pAha,
        pUltimate,
        pFounder,
        pCase,
        emoLine,
        `【마무리】 ${end}`,
      ]
        .filter(Boolean)
        .join("\n\n"),
      ending: end,
    };
  };

  const base = baseMeta();
  const plotToUse = plotValue || "Founding Myth";

  const mk = (id, name, variantSeed) => {
    const { story, ending } = buildStory(plotToUse, variantSeed);

    const keywords = Array.from(
      new Set([
        industry,
        stage,
        base.plot,
        ...(base.emotions || []),
        "스토리",
        "브랜드",
        companyName,
      ]),
    ).slice(0, 10);

    const firstLine =
      story
        .split("\n")
        .find((ln) => ln.trim() && !ln.trim().startsWith("【"))
        ?.trim() ||
      story
        .split("\n")
        .find((ln) => ln.trim())
        ?.trim() ||
      "";

    return {
      id,
      name,
      oneLiner:
        firstLine.length > 60
          ? `${firstLine.slice(0, 60)}…`
          : base.oneLiner || firstLine,
      meta: base.meta,
      plot: base.plot,
      emotions: base.emotions,
      story,
      ending,
      keywords,
      raw: story,
    };
  };

  return [
    mk("story_1", `A · ${plotLabel || "스토리"} 1안`, 0),
    mk("story_2", `B · ${plotLabel || "스토리"} 2안`, 1),
    mk("story_3", `C · ${plotLabel || "스토리"} 3안`, 2),
  ];
}

/**
 * ✅ (요청 반영) 기본정보(자동반영) UI 제거
 * - form에서 회사/산업/단계/링크/한줄/타깃 필드 제거
 * - 대신 diagCtx를 내부에서만 유지해서 AI payload/메타 품질 유지
 */
const INITIAL_FORM = {
  // Step 4 fields (JSON 기준)
  founding_story: "",
  customer_transformation: "",
  aha_moment: "",
  brand_mission: "",
  story_plot: "", // single_choice value
  story_plot_other: "",
  customer_conflict: "",
  story_emotion: [], // multiple_choice values (max 2)
  story_emotion_other: "",
  ultimate_goal: "",

  // optional (JSON 기준)
  founder_personality: "",
  flagship_case: "",
};

const ALLOWED_FORM_KEYS = Object.keys(INITIAL_FORM);
function sanitizeForm(raw) {
  const obj = raw && typeof raw === "object" ? raw : {};
  const next = { ...INITIAL_FORM };
  ALLOWED_FORM_KEYS.forEach((k) => {
    if (k in obj) next[k] = obj[k];
  });
  return next;
}

/** ======================
 *  백 응답 후보 normalize (스토리)
 *  - 백이 어떤 포맷을 주더라도 UI에서 쓰기 쉽게 3안 형태로 맞춤
 *  ====================== */
function normalizeStoryCandidates(raw, form = {}, diagCtx = null) {
  const payload = raw?.data ?? raw?.result ?? raw;

  const pickStr = (v) => (typeof v === "string" ? v.trim() : "");
  const tryKeys = (obj, keys) => {
    for (const k of keys) {
      const v = pickStr(obj?.[k]);
      if (v) return v;
    }
    return "";
  };

  const ctx = diagCtx || {};
  const metaParts = [
    safeText(ctx?.industry, ""),
    stageLabel(ctx?.stage),
    safeText(ctx?.targetCustomer, ""),
  ].filter((v) => v && v !== "-");
  const meta = metaParts.join(" · ");

  const emotions = emotionLabels(
    form?.story_emotion,
    form?.story_emotion_other,
  );
  const plot = plotLabelValue(form?.story_plot, form?.story_plot_other) || "-";

  // ✅ 케이스 0) { story1, story2, story3 }
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const values = ["story1", "story2", "story3"]
      .map((k) => pickStr(payload?.[k]))
      .filter(Boolean);

    if (values.length) {
      return values.slice(0, 3).map((story, idx) => {
        const firstLine =
          story
            .split("\n")
            .find((ln) => ln.trim())
            ?.trim() || story;
        return {
          id: `story_${idx + 1}`,
          name: `컨설팅 제안 ${idx + 1}`,
          oneLiner:
            firstLine.length > 60 ? `${firstLine.slice(0, 60)}…` : firstLine,
          meta,
          story,
          plot,
          emotions,
          ending: "-",
          keywords: [],
          raw: story,
        };
      });
    }
  }

  // ✅ 케이스 1) 배열 / candidates 배열
  const list = Array.isArray(payload)
    ? payload
    : payload?.candidates ||
      payload?.stories ||
      payload?.data?.candidates ||
      payload?.result?.candidates;

  if (!Array.isArray(list)) return [];

  // ["스토리1","스토리2"] 형태
  if (list.length && typeof list[0] === "string") {
    return list.slice(0, 3).map((story, idx) => ({
      id: `story_${idx + 1}`,
      name: `컨설팅 제안 ${idx + 1}`,
      oneLiner: story.length > 60 ? `${story.slice(0, 60)}…` : story,
      meta,
      story,
      plot,
      emotions,
      ending: "-",
      keywords: [],
      raw: story,
    }));
  }

  // 객체 배열(유연 대응)
  return list.slice(0, 3).map((item, idx) => {
    const id = item?.id || item?.candidateId || `story_${idx + 1}`;
    const story =
      pickStr(item?.story) ||
      pickStr(item?.text) ||
      pickStr(item?.content) ||
      pickStr(item?.value) ||
      tryKeys(item, ["story1", "story2", "story3"]) ||
      "";

    const firstLine =
      story
        .split("\n")
        .find((ln) => ln.trim())
        ?.trim() || story;

    return {
      id,
      name: item?.name || item?.title || `컨설팅 제안 ${idx + 1}`,
      oneLiner:
        item?.oneLiner ||
        (firstLine.length > 60 ? `${firstLine.slice(0, 60)}…` : firstLine),
      meta: item?.meta || meta,
      story,
      plot: item?.plot || plot,
      emotions: Array.isArray(item?.emotions) ? item.emotions : emotions,
      ending: item?.ending || "-",
      keywords: Array.isArray(item?.keywords) ? item.keywords : [],
      raw: story,
    };
  });
}

export default function BrandStoryConsultingInterview({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const REQUIRED_FIELD_ID = {
    founding_story: "story-q-founding_story",
    customer_transformation: "story-q-customer_problem",
    aha_moment: "story-q-solution_essence",
    brand_mission: "story-q-emotional_hook",
    story_plot: "story-q-brand_persona",
    customer_conflict: "story-q-credibility_basis",
    story_emotion: "story-q-story_emotion",
    ultimate_goal: "story-q-ultimate_goal",
  };

  // ✅ 기본정보(UI 제거됐지만) 내부 컨텍스트로만 보관
  const [diagCtx, setDiagCtx] = useState(null);

  // ✅ (최우선) strict 접근 제어 + flow 현재 단계 고정(절대 뒤로가기 금지)
  useEffect(() => {
    try {
      migrateLegacyToPipelineIfNeeded();

      const access = ensureStrictStepAccess("story");
      if (!access?.ok) {
        const msg =
          access?.reason === "diagnosis_missing"
            ? "기업진단이 완료되지 않았습니다. 기업진단부터 진행해주세요."
            : access?.reason === "naming_missing"
              ? "네이밍 컨설팅 완료 후 접근할 수 있습니다."
              : access?.reason === "concept_missing"
                ? "컨셉 컨설팅 완료 후 접근할 수 있습니다."
                : access?.reason === "no_back"
                  ? "진행 중에는 이전 단계로 돌아갈 수 없습니다."
                  : access?.reason === "no_jump"
                    ? "단계를 건너뛸 수 없습니다. 현재 진행 단계부터 이어서 진행해주세요."
                    : "허용되지 않는 접근입니다.";
        window.alert(msg);
        if (access?.redirectTo) navigate(access.redirectTo, { replace: true });
        return;
      }

      const p = readPipeline();
      const brandId = location?.state?.brandId ?? p?.brandId ?? null;

      const guard = ensureBrandIdConsistency(brandId);
      if (!guard?.ok) {
        alertBrandIdMismatchAndStop(guard);
        navigate(guard.redirectTo || "/brandconsulting", { replace: true });
        return;
      }

      const started = startBrandFlow({ brandId });
      if (started?.ok === false && started?.reason === "brand_mismatch") {
        alertBrandIdMismatchAndStop(started);
        navigate(started.redirectTo || "/brandconsulting", { replace: true });
        return;
      }

      setBrandFlowCurrent("story");
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ 진단 컨텍스트 로드(화면에는 표시 X)
  useEffect(() => {
    try {
      const diag = readDiagnosisForm();
      const ctx = getBasicFromDiagnosis(diag);
      if (ctx) setDiagCtx(ctx);
    } catch {
      // ignore
    }
  }, []);

  const [openType, setOpenType] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);
  const closeModal = () => setOpenType(null);

  const [form, setForm] = useState(INITIAL_FORM);

  const [saveMsg, setSaveMsg] = useState("");
  const [lastSaved, setLastSaved] = useState("-");

  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState("");
  const MIN_AI_LOADING_MS = 1500;

  const waitForMinAiLoading = async (startedAt) => {
    if (!startedAt) return;
    const elapsed = Date.now() - startedAt;
    const remaining = MIN_AI_LOADING_MS - elapsed;
    if (remaining > 0) {
      await new Promise((resolve) => window.setTimeout(resolve, remaining));
    }
  };

  const TOAST_DURATION = 3200;
  const EMPTY_TOAST = {
    show: false,
    icon: "",
    title: "",
    msg: "",
    variant: "success",
  };

  const [toast, setToast] = useState(EMPTY_TOAST);
  const [loadingElapsed, setLoadingElapsed] = useState(0);
  const toastTimerRef = useRef(null);
  const didMountRef = useRef(false);
  const prevCanAnalyzeRef = useRef(false);

  const [candidates, setCandidates] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [expandedCandidates, setExpandedCandidates] = useState({});
  const [regenSeed, setRegenSeed] = useState(0);
  const refResult = useRef(null);

  // ✅ JSON(step_4) required true 항목만
  const requiredKeys = useMemo(
    () => [
      "founding_story",
      "customer_transformation",
      "aha_moment",
      "brand_mission",
      "story_plot",
      "customer_conflict",
      "story_emotion",
      "ultimate_goal",
    ],
    [],
  );

  const requiredStatus = useMemo(() => {
    const status = {};
    requiredKeys.forEach((k) => {
      status[k] = isFilled(form?.[k]);
    });

    // ✅ 기타 선택 시 텍스트 입력도 사실상 필수로 처리(질문지 품질)
    if (form?.story_plot === "Other") {
      status.story_plot =
        isFilled(form?.story_plot) && isFilled(form?.story_plot_other);
    }
    if (
      Array.isArray(form?.story_emotion) &&
      form.story_emotion.includes("Other")
    ) {
      status.story_emotion =
        isFilled(form?.story_emotion) && isFilled(form?.story_emotion_other);
    }

    return status;
  }, [form, requiredKeys]);

  const questionComplete = useMemo(
    () => ({
      founding_story: Boolean(requiredStatus.founding_story),
      customer_transformation: Boolean(requiredStatus.customer_transformation),
      aha_moment: Boolean(requiredStatus.aha_moment),
      brand_mission: Boolean(requiredStatus.brand_mission),
      story_plot: Boolean(requiredStatus.story_plot),
      customer_conflict: Boolean(requiredStatus.customer_conflict),
      story_emotion: Boolean(requiredStatus.story_emotion),
      ultimate_goal: Boolean(requiredStatus.ultimate_goal),
      founder_personality: isFilled(form?.founder_personality),
      flagship_case: isFilled(form?.flagship_case),
    }),
    [form, requiredStatus],
  );

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
  const hasResult = candidates.length > 0;
  const canGoNext = Boolean(hasResult && selectedId && !analyzing);
  const requiredLabelMap = {
    founding_story: "창업 계기",
    customer_transformation: "고객 변화",
    aha_moment: "핵심 전환점",
    brand_mission: "브랜드 미션",
    story_plot: "스토리 플롯",
    customer_conflict: "고객 갈등",
    story_emotion: "스토리 감정 톤",
    ultimate_goal: "궁극적 목표",
  };

  const scrollToRequiredField = (key) => {
    try {
      const id = REQUIRED_FIELD_ID?.[key];
      if (!id) return;
      const el = document.getElementById(id);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      const focusTarget = el.querySelector(
        "textarea, input, button, [role='button']",
      );
      if (focusTarget && typeof focusTarget.focus === "function") {
        focusTarget.focus({ preventScroll: true });
      }
    } catch {
      // ignore
    }
  };

  const setValue = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const scrollToResult = () => {
    if (!refResult?.current) return;
    refResult.current.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const showToast = (payload) => {
    const isString = typeof payload === "string";
    const text = isString
      ? String(payload || "").trim()
      : String(payload?.msg || "").trim();
    if (!text) return;

    const variantFromText = /^\s*(⚠️|❌)/.test(text) ? "warn" : "success";
    const variant = isString
      ? variantFromText
      : payload?.variant || variantFromText;
    const icon = isString
      ? variant === "warn"
        ? "⚠️"
        : "✅"
      : payload?.icon || (variant === "warn" ? "⚠️" : "✅");
    const title = isString
      ? variant === "warn"
        ? "요청 실패"
        : "알림"
      : String(payload?.title || (variant === "warn" ? "요청 실패" : "알림"));

    setToast({
      show: true,
      icon,
      title,
      msg: text,
      variant,
    });

    try {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
      toastTimerRef.current = window.setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, TOAST_DURATION);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    return () => {
      try {
        if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
      } catch {
        // ignore
      }
    };
  }, []);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      prevCanAnalyzeRef.current = canAnalyze;
      return;
    }

    if (!prevCanAnalyzeRef.current && canAnalyze) {
      showToast({
        icon: "✅",
        title: "필수 입력 완료",
        msg: "모든 필수 입력이 완료됐어요. 이제 AI 분석 버튼을 눌러 다음 단계로 진행해 주세요.",
        variant: "success",
      });
    }

    prevCanAnalyzeRef.current = canAnalyze;
  }, [canAnalyze]);

  useEffect(() => {
    if (!analyzing) {
      setLoadingElapsed(0);
      return;
    }
    const startedAt = Date.now();
    setLoadingElapsed(0);
    const timer = window.setInterval(() => {
      setLoadingElapsed((Date.now() - startedAt) / 1000);
    }, 100);
    return () => window.clearInterval(timer);
  }, [analyzing]);

  const shouldShowMore = (text) => {
    const t = String(text || "").trim();
    if (!t) return false;
    const lines = t.split("\n").filter(Boolean);
    return t.length > 220 || lines.length > 6;
  };

  const toggleExpanded = (id) => {
    setExpandedCandidates((prev) => ({ ...prev, [id]: !prev?.[id] }));
  };

  // ✅ draft 로드 (키 sanitize + legacy 매핑)
  useEffect(() => {
    try {
      const raw = userGetItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);

      const loaded =
        parsed?.form && typeof parsed.form === "object"
          ? sanitizeForm(parsed.form)
          : null;

      if (loaded) {
        setForm((prev) => {
          const next = { ...prev, ...loaded };

          // legacy 매핑(이전 필드명 호환)
          const rawLoaded = parsed?.form || {};
          if (
            !String(next.founding_story || "").trim() &&
            String(rawLoaded.originStory || "").trim()
          ) {
            next.founding_story = rawLoaded.originStory;
          }
          if (
            !String(next.customer_conflict || "").trim() &&
            String(rawLoaded.problemStory || "").trim()
          ) {
            next.customer_conflict = rawLoaded.problemStory;
          }
          if (
            !String(next.customer_transformation || "").trim() &&
            String(rawLoaded.solutionStory || "").trim()
          ) {
            next.customer_transformation = rawLoaded.solutionStory;
          }
          if (
            !String(next.ultimate_goal || "").trim() &&
            String(rawLoaded.goal || "").trim()
          ) {
            next.ultimate_goal = rawLoaded.goal;
          }
          if (
            !String(next.brand_mission || "").trim() &&
            String(rawLoaded.brandCore || "").trim()
          ) {
            next.brand_mission = rawLoaded.brandCore;
          }

          return next;
        });
      }

      if (parsed?.updatedAt) {
        const d = new Date(parsed.updatedAt);
        if (!Number.isNaN(d.getTime())) setLastSaved(d.toLocaleString());
      }
    } catch {
      // ignore
    }
  }, []);

  // 결과 로드
  useEffect(() => {
    try {
      const raw = userGetItem(RESULT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.candidates)) setCandidates(parsed.candidates);
      if (parsed?.selectedId) setSelectedId(parsed.selectedId);
      if (typeof parsed?.regenSeed === "number") setRegenSeed(parsed.regenSeed);
    } catch {
      // ignore
    }
  }, []);

  // 자동 저장
  useEffect(() => {
    setSaveMsg("");
    const t = setTimeout(() => {
      try {
        const payload = { form, updatedAt: Date.now() };
        userSetItem(STORAGE_KEY, JSON.stringify(payload));
        setLastSaved(new Date(payload.updatedAt).toLocaleString());
        setSaveMsg("자동 저장됨");
      } catch {
        // ignore
      }
    }, 600);

    return () => clearTimeout(t);
  }, [form]);

  const persistResult = (nextCandidates, nextSelectedId, nextSeed) => {
    const updatedAt = Date.now();

    try {
      userSetItem(
        RESULT_KEY,
        JSON.stringify({
          candidates: nextCandidates,
          selectedId: nextSelectedId,
          regenSeed: nextSeed,
          updatedAt,
        }),
      );
    } catch {
      // ignore
    }

    // legacy 저장
    try {
      const selected =
        nextCandidates.find((c) => c.id === nextSelectedId) || null;
      userSetItem(
        LEGACY_KEY,
        JSON.stringify({
          form,
          candidates: nextCandidates,
          selectedId: nextSelectedId,
          selected,
          regenSeed: nextSeed,
          updatedAt,
        }),
      );
    } catch {
      // ignore
    }

    // ✅ pipeline 저장 + 이후 단계 초기화(스토리가 바뀌면 로고는 무효)
    try {
      const selected =
        nextCandidates.find((c) => c.id === nextSelectedId) || null;
      setStepResult("story", {
        candidates: nextCandidates,
        selectedId: nextSelectedId,
        selected,
        regenSeed: nextSeed,
        updatedAt,
      });
      clearStepsFrom("logo");
    } catch {
      // ignore
    }
  };

  const handleGenerateCandidates = async (mode = "generate") => {
    setAnalyzeError("");

    if (!canAnalyze) {
      // ✅ 기타 선택 시 텍스트 미입력 안내
      if (form?.story_plot === "Other" && !isFilled(form?.story_plot_other)) {
        alert("스토리텔링 구조에서 ‘기타’를 선택했다면 설명을 입력해주세요.");
        return;
      }
      if (
        Array.isArray(form?.story_emotion) &&
        form.story_emotion.includes("Other") &&
        !isFilled(form?.story_emotion_other)
      ) {
        alert("감정 선택에서 ‘기타’를 선택했다면 설명을 입력해주세요.");
        return;
      }

      alert("필수 항목을 모두 입력하면 요청이 가능합니다.");
      return;
    }

    const p = readPipeline();
    const brandId =
      p?.brandId ||
      p?.brand?.id ||
      p?.diagnosisResult?.brandId ||
      p?.diagnosis?.brandId ||
      null;

    if (!brandId) {
      alert(
        "brandId를 확인할 수 없습니다. 기업진단/이전 단계를 다시 진행해 주세요.",
      );
      return;
    }

    setAnalyzing(true);
    setTimeout(() => scrollToResult?.(), 30);
    setAnalyzeError("");
    let requestStartedAt = null;

    try {
      const nextSeed = mode === "regen" ? regenSeed + 1 : regenSeed;
      if (mode === "regen") setRegenSeed(nextSeed);

      if (mode === "regen") {
        // 재분석 시작 시 기존 선택을 해제해 다음 단계 버튼을 비활성화
        setSelectedId(null);
        persistResult(candidates, null, nextSeed);
      }

      // ✅ 기본정보(UI 제거)지만 백이 기대할 수 있어 payload에 포함(진단 컨텍스트 기반)
      const basic = diagCtx || {};
      const payload = {
        ...basic, // companyName/industry/stage/website/oneLine/targetCustomer
        ...form, // story 질문지
        step: "story",
        mode,
        regenSeed: nextSeed,
        diagnosisSummary: buildDiagnosisSummaryString(basic) || undefined,
      };

      requestStartedAt = Date.now();
      const raw = await apiRequestAI(`/brands/${brandId}/story`, {
        method: "POST",
        data: payload,
      });

      const nextCandidates = normalizeStoryCandidates(raw, form, diagCtx);

      // 백이 비어주면 로컬 후보 생성(보험)
      const fallbackCandidates = nextCandidates.length
        ? nextCandidates
        : generateStoryCandidates(form, nextSeed, diagCtx);

      if (!fallbackCandidates.length) {
        alert("스토리 제안을 받지 못했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }

      setCandidates(fallbackCandidates);
      setSelectedId(null);
      persistResult(fallbackCandidates, null, nextSeed);
      showToast({
        icon: "💡",
        title: "AI 분석 완료",
        msg: "스토리 컨설팅 제안 3개가 도착했어요. 1개를 선택하면 다음 단계로 진행할 수 있어요.",
        variant: "success",
      });
      window.setTimeout(() => scrollToResult(), 50);
    } catch (e) {
      const status = e?.response?.status;
      const msg =
        e?.response?.data?.message ||
        e?.userMessage ||
        e?.message ||
        "요청 실패";

      console.warn("POST /brands/{brandId}/story failed:", e);

      if (status === 401) {
        alert("로그인이 필요합니다. 다시 로그인한 뒤 시도해주세요.");
        return;
      }
      if (status === 403) {
        alert(
          "권한이 없습니다(403). 보통 현재 로그인한 계정의 brandId가 아닌 값으로 요청할 때 발생합니다. 기업진단을 다시 진행해 brandId를 새로 생성한 뒤 시도해주세요.",
        );
        return;
      }

      if (String(msg).includes("스토리 단계")) {
        alert(
          `스토리 생성이 거절되었습니다: ${msg}

컨셉 단계에서 '선택'을 완료한 뒤 다시 시도해 주세요.`,
        );
        return;
      }

      setAnalyzeError(`스토리 생성에 실패했습니다: ${msg}`);
      showToast("⚠️ 생성에 실패했어요. 아래에서 ‘다시 시도’를 눌러주세요.");
    } finally {
      await waitForMinAiLoading(requestStartedAt);
      setAnalyzing(false);
    }
  };

  const handleSelectCandidate = (id) => {
    setSelectedId(id);
    persistResult(candidates, id, regenSeed);
    showToast({
      icon: "🚀",
      title: "선택 완료",
      msg: "제안 1개 선택 완료! 오른쪽 진행 상태 카드에서 다음 단계 버튼으로 진행하세요.",
      variant: "success",
    });
  };

  const handleGoNext = async () => {
    if (!canGoNext) return;

    const p = readPipeline();
    const brandId =
      p?.brandId ||
      p?.brand?.id ||
      p?.diagnosisResult?.brandId ||
      p?.diagnosis?.brandId ||
      null;

    const selected = candidates.find((c) => c.id === selectedId) || null;
    const selectedStory = selected?.raw || selected?.story || "";

    if (!brandId) {
      alert(
        "brandId를 확인할 수 없습니다. 기업진단/이전 단계를 다시 진행해 주세요.",
      );
      return;
    }
    if (!String(selectedStory).trim()) {
      alert("선택된 스토리를 찾을 수 없습니다. 제안을 다시 선택해 주세요.");
      return;
    }

    try {
      await apiRequest(`/brands/${brandId}/story/select`, {
        method: "POST",
        data: { selectedByUser: String(selectedStory) },
      });
    } catch (e) {
      const status = e?.response?.status;
      const msg =
        e?.response?.data?.message || e?.userMessage || e?.message || "";

      console.warn("POST /brands/{brandId}/story/select failed:", e);

      if (status === 401 || status === 403) {
        alert(
          status === 401
            ? "로그인이 필요합니다. 다시 로그인한 뒤 시도해주세요."
            : "권한이 없습니다(403). 보통 현재 로그인한 계정의 brandId가 아닌 값으로 요청할 때 발생합니다. 기업진단을 다시 진행해 brandId를 새로 생성한 뒤 시도해주세요.",
        );
        return;
      }

      // 이미 단계가 넘어간 경우에는 다음 진행 허용
      if (!String(msg).includes("스토리 단계")) {
        alert(`스토리 선택 저장에 실패했습니다: ${msg || "요청 실패"}`);
        return;
      }
    }

    try {
      setBrandFlowCurrent("logo");
    } catch {
      // ignore
    }

    navigate(NEXT_PATH, {
      state: { from: "story", brandId },
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleResetAll = () => {
    const ok = window.confirm("입력/결과를 모두 초기화할까요?");
    if (!ok) return;

    try {
      userRemoveItem(STORAGE_KEY);
      userRemoveItem(RESULT_KEY);
      userRemoveItem(LEGACY_KEY);
    } catch {
      // ignore
    }

    try {
      clearStepsFrom("story");
      setBrandFlowCurrent("story");
    } catch {
      // ignore
    }

    setForm({ ...INITIAL_FORM });
    setCandidates([]);
    setSelectedId(null);
    setRegenSeed(0);
    setSaveMsg("");
    setLastSaved("-");
  };

  // ✅ plot 선택 핸들러 (Other일 때 입력 유지)
  const selectPlot = (value) => {
    setForm((prev) => {
      const next = { ...prev, story_plot: value };
      if (value !== "Other") next.story_plot_other = "";
      return next;
    });
  };

  // ✅ emotion 선택 핸들러 (max 2는 MultiChips가 보장)
  const setEmotions = (next) => {
    setForm((prev) => {
      const hasOther = Array.isArray(next) && next.includes("Other");
      const updated = { ...prev, story_emotion: next };
      if (!hasOther) updated.story_emotion_other = "";
      return updated;
    });
  };

  return (
    <div className="diagInterview consultingInterview brandStoryInterview">
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
          <section className="diagInterviewHero" aria-label="인터뷰 안내 배너">
            <div className="diagInterviewHero__inner">
              <div className="diagInterviewHero__left">
                <h1 className="diagInterview__title">
                  브랜드 스토리 컨설팅 인터뷰
                </h1>
                <p className="diagInterview__sub">
                  아래 질문(총 10문항) 답변을 기반으로 스토리 제안 3가지를
                  생성합니다.
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
                  <span
                    className={`diagInterviewHero__chip state ${canAnalyze ? "ready" : "pending"}`}
                  >
                    {canAnalyze
                      ? "AI 분석 요청 가능"
                      : `필수 ${remainingRequired}개 남음`}
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
                      ? "모든 필수 입력이 완료되었어요"
                      : "필수 항목을 입력하면 AI 분석 요청이 활성화돼요"}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <ConsultingFlowPanel activeKey="story" />

          <div className="diagInterview__grid">
            <section className="diagInterview__left">
              {/* ✅ (요청 반영) 1) 기본 정보(자동 반영) 카드 제거 */}

              {/* 2) Intro */}
              <div className="card consultingIntroCard">
                <div className="card__head">
                  <h2>Brand Story Consulting</h2>
                  {/* <p>
                    아래 질문에 답하면, 브랜드 스토리 제안 3가지를 생성할 수
                    있어요.
                  </p> */}
                </div>
              </div>

              {/* 3) Q1~Q4 */}
              <div className="card questionCard">
                <div
                  className={`field questionField ${questionComplete.founding_story ? "is-complete" : ""}`}
                  id="story-q-founding_story"
                >
                  <label>
                    <QTag n="1" />
                    창업자가 이 사업을 시작하게 된 결정적인 ‘계기’나 ‘사건’은
                    무엇인가요? <span className="req">*</span>
                  </label>
                  <textarea
                    value={form.founding_story}
                    onChange={(e) => setValue("founding_story", e.target.value)}
                    placeholder="개인적인 경험, 문제 인식, 영감을 받은 순간 등을 구체적으로 작성해주세요"
                    rows={5}
                  />
                </div>

                <div
                  className={`field questionField ${questionComplete.customer_transformation ? "is-complete" : ""}`}
                  id="story-q-customer_problem"
                >
                  <label>
                    <QTag n="2" />
                    우리 서비스를 이용하기 전과 후, 고객의 삶은 어떻게
                    달라지나요? <span className="req">*</span>
                  </label>
                  <textarea
                    value={form.customer_transformation}
                    onChange={(e) =>
                      setValue("customer_transformation", e.target.value)
                    }
                    placeholder="구체적인 변화를 Before/After로 작성해주세요"
                    rows={5}
                  />
                </div>

                <div
                  className={`field questionField ${questionComplete.aha_moment ? "is-complete" : ""}`}
                  id="story-q-solution_essence"
                >
                  <label>
                    <QTag n="3" />
                    고객이 우리만의 서비스를 이용하면서 감탄하는 순간은
                    언제인가요? <span className="req">*</span>
                  </label>
                  <textarea
                    value={form.aha_moment}
                    onChange={(e) => setValue("aha_moment", e.target.value)}
                    placeholder="예: 첫 주문이 10분 만에 도착했을 때, 복잡한 작업이 클릭 한 번으로 해결되었을 때"
                    rows={4}
                  />
                </div>

                <div
                  className={`field questionField ${questionComplete.brand_mission ? "is-complete" : ""}`}
                  id="story-q-emotional_hook"
                >
                  <label>
                    <QTag n="4" />
                    수익 창출 외에, 우리가 세상에 기여하고자 하는 것은
                    무엇인가요? <span className="req">*</span>
                  </label>
                  <textarea
                    value={form.brand_mission}
                    onChange={(e) => setValue("brand_mission", e.target.value)}
                    placeholder="사회적 가치, 환경적 영향, 문화적 변화 등"
                    rows={4}
                  />
                </div>
              </div>

              {/* 3) Q5 story_plot (single choice) */}
              <div className="card">
                <div className="card__head">
                  <h2>2. 스토리 구조 선택</h2>
                  <p>질문지(step_4) 기준: 1개 선택 (기타 선택 시 직접 입력)</p>
                </div>

                <div
                  className={`field questionField ${questionComplete.story_plot ? "is-complete" : ""}`}
                  id="story-q-brand_persona"
                >
                  <label>
                    <QTag n="5" />
                    어떤 스타일의 스토리텔링을 원하나요?{" "}
                    <span className="req">*</span>
                  </label>

                  <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                    {STORY_PLOT_OPTIONS.map((opt) => {
                      const selected = form.story_plot === opt.value;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          className="btn"
                          onClick={() => selectPlot(opt.value)}
                          style={{
                            textAlign: "left",
                            padding: "12px 12px",
                            borderRadius: 12,
                            border: selected
                              ? "1px solid rgba(37,99,235,0.44)"
                              : "1px solid rgba(0,0,0,0.10)",
                            background: selected
                              ? "rgba(37,99,235,0.08)"
                              : "rgba(255,255,255,0.9)",
                            cursor: "pointer",
                          }}
                          aria-pressed={selected}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                            }}
                          >
                            <span
                              style={{
                                width: 14,
                                height: 14,
                                borderRadius: 999,
                                border: "2px solid rgba(0,0,0,0.35)",
                                background: selected
                                  ? "rgba(37,99,235,0.92)"
                                  : "transparent",
                                boxShadow: selected
                                  ? "0 0 0 3px rgba(37,99,235,0.15)"
                                  : "none",
                              }}
                            />
                            <div style={{ fontWeight: 900 }}>{opt.text}</div>
                          </div>

                          {opt.description ? (
                            <div
                              style={{
                                marginTop: 6,
                                fontSize: 12,
                                opacity: 0.8,
                              }}
                            >
                              {opt.description}
                            </div>
                          ) : null}
                          {opt.example ? (
                            <div
                              style={{
                                marginTop: 6,
                                fontSize: 12,
                                opacity: 0.75,
                              }}
                            >
                              <span style={{ fontWeight: 800 }}>예:</span>{" "}
                              {opt.example}
                            </div>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>

                  {form.story_plot === "Other" ? (
                    <div className="field" style={{ marginTop: 10 }}>
                      <label>
                        기타(직접 입력) <span className="req">*</span>
                      </label>
                      <input
                        value={form.story_plot_other}
                        onChange={(e) =>
                          setValue("story_plot_other", e.target.value)
                        }
                        placeholder="원하는 스토리 구조를 설명해주세요"
                      />
                      {!requiredStatus.story_plot ? (
                        <div className="hint" style={{ marginTop: 8 }}>
                          * ‘기타’를 선택했다면 설명을 입력해주세요.
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* 4) Q6 conflict */}
              <div className="card">
                <div className="card__head">
                  <h2>3. 갈등(Conflict)</h2>
                  <p>
                    고객이 부딪히는 “가장 큰 방해물”을 구체적으로 적어주세요.
                  </p>
                </div>

                <div
                  className={`field questionField ${questionComplete.customer_conflict ? "is-complete" : ""}`}
                  id="story-q-credibility_basis"
                >
                  <label>
                    <QTag n="6" />
                    고객이 현재 겪고 있는 가장 큰 결핍이나 방해물은 무엇인가요?{" "}
                    <span className="req">*</span>
                  </label>
                  <textarea
                    value={form.customer_conflict}
                    onChange={(e) =>
                      setValue("customer_conflict", e.target.value)
                    }
                    placeholder="시간 부족, 정보 과부하, 높은 비용, 복잡한 과정 등"
                    rows={4}
                  />
                </div>
              </div>

              {/* 5) Q7 emotion (multiple choice max 2) */}
              <div className="card">
                <div className="card__head">
                  <h2>4. 감정(Emotion)</h2>
                  <p>
                    질문지(step_4) 기준: 최대 2개 선택 (기타 선택 시 직접 입력)
                  </p>
                </div>

                <div
                  className={`field questionField ${questionComplete.story_emotion ? "is-complete" : ""}`}
                  id="story-q-story_emotion"
                >
                  <label>
                    <QTag n="7" />
                    스토리를 통해 고객의 어떤 감정을 자극하고 싶나요? (최대 2개){" "}
                    <span className="req">*</span>
                  </label>

                  <div className="hint" style={{ marginTop: 6 }}>
                    2개를 넘기면 마지막으로 선택한 항목이 유지돼요.
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <MultiChips
                      value={form.story_emotion}
                      options={STORY_EMOTION_OPTIONS.map((o) => ({
                        value: o.value,
                        label: o.text,
                      }))}
                      onChange={setEmotions}
                      max={2}
                    />
                  </div>

                  {Array.isArray(form.story_emotion) &&
                  form.story_emotion.includes("Other") ? (
                    <div className="field" style={{ marginTop: 10 }}>
                      <label>
                        기타(직접 입력) <span className="req">*</span>
                      </label>
                      <input
                        value={form.story_emotion_other}
                        onChange={(e) =>
                          setValue("story_emotion_other", e.target.value)
                        }
                        placeholder="자극하고 싶은 감정을 설명해주세요"
                      />
                      {!requiredStatus.story_emotion ? (
                        <div className="hint" style={{ marginTop: 8 }}>
                          * ‘기타’를 선택했다면 설명을 입력해주세요.
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* 6) Q8 ultimate_goal */}
              <div className="card">
                <div className="card__head">
                  <h2>5. 비전(Vision)</h2>
                  <p>브랜드가 도달하고 싶은 “세상”을 그려주세요.</p>
                </div>

                <div
                  className={`field questionField ${questionComplete.ultimate_goal ? "is-complete" : ""}`}
                  id="story-q-ultimate_goal"
                >
                  <label>
                    <QTag n="8" />
                    브랜드가 궁극적으로 만들고자 하는 세상의 모습은 무엇인가요?{" "}
                    <span className="req">*</span>
                  </label>
                  <textarea
                    value={form.ultimate_goal}
                    onChange={(e) => setValue("ultimate_goal", e.target.value)}
                    placeholder="10년 후, 우리의 브랜드가 있는 세상은 어떻게 변해 있을까요?"
                    rows={4}
                  />
                </div>
              </div>

              {/* 7) Optional Q9~Q10 */}
              <div className="card">
                <div className="card__head">
                  <h2>6. 선택 질문 (Optional)</h2>
                  <p>가능하면 적어주면 좋아요. 결과 퀄리티가 올라갑니다.</p>
                </div>

                <div
                  className={`field questionField ${questionComplete.founder_personality ? "is-complete" : ""}`}
                >
                  <label>
                    <QTag n="9" />
                    창업자(또는 팀)의 성격이나 스타일을 한 문장으로 표현한다면
                    어떤 사람들인가요?
                  </label>
                  <textarea
                    value={form.founder_personality}
                    onChange={(e) =>
                      setValue("founder_personality", e.target.value)
                    }
                    placeholder="예: 집요하게 파고드는 엔지니어, 사람 얘기를 잘 들어주는 팀장 등"
                    rows={3}
                  />
                </div>

                <div
                  className={`field questionField ${questionComplete.flagship_case ? "is-complete" : ""}`}
                >
                  <label>
                    <QTag n="10" />
                    기억에 남는 고객 사례가 있다면 하나만 구체적으로
                    소개해주세요.
                  </label>
                  <textarea
                    value={form.flagship_case}
                    onChange={(e) => setValue("flagship_case", e.target.value)}
                    placeholder="어떤 고객이었고, 어떤 문제가 있었으며, 우리 서비스를 통해 어떻게 달라졌는지"
                    rows={4}
                  />
                </div>
              </div>

              <div ref={refResult} />

              {analyzing || hasResult ? (
                <div
                  className="card namingLoadingCard"
                  style={{ marginTop: 14 }}
                >
                  <div className="namingLoadingCard__glow" aria-hidden="true" />

                  <div className="namingLoadingCard__top">
                    <span className="namingLoadingCard__pill">
                      {analyzing ? "AI 분석 진행 중" : "AI 분석 완료"}
                    </span>
                    <span className="namingLoadingCard__elapsed">
                      {analyzing ? `${loadingElapsed.toFixed(1)}초` : "완료"}
                    </span>
                  </div>

                  <div className="namingLoadingCard__head">
                    {analyzing ? (
                      <span
                        className="namingLoadingCard__spinner"
                        aria-hidden="true"
                      />
                    ) : (
                      <span
                        className="namingLoadingCard__done"
                        aria-hidden="true"
                      >
                        ✓
                      </span>
                    )}
                    <h2>
                      {analyzing
                        ? "스토리 제안 생성 중"
                        : "스토리 제안 생성 완료"}
                    </h2>
                  </div>

                  <p className="namingLoadingCard__desc">
                    {analyzing
                      ? "입력 내용을 바탕으로 제안 3가지를 만들고 있어요."
                      : "AI 분석이 완료되었습니다. 아래 제안을 확인하고 1개를 선택해 주세요."}
                  </p>

                  {analyzing ? (
                    <>
                      <div
                        className="namingLoadingCard__steps"
                        aria-hidden="true"
                      >
                        <span className="namingLoadingCard__step is-active">
                          질문 분석
                        </span>
                        <span className="namingLoadingCard__step is-active">
                          키워드 조합
                        </span>
                        <span className="namingLoadingCard__step">
                          후보 정리
                        </span>
                      </div>

                      <div
                        className="namingLoadingCard__progress"
                        aria-hidden="true"
                      >
                        <span className="namingLoadingCard__progressFill" />
                      </div>

                      <div className="namingLoadingCard__wait">
                        잠시만 기다려주세요
                        <span
                          className="namingLoadingCard__dots"
                          aria-hidden="true"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="namingLoadingCard__wait is-done">
                      제안이 준비되었습니다
                    </div>
                  )}
                </div>
              ) : null}

              {analyzing ? (
                <div
                  className="aiToast loading"
                  role="status"
                  aria-live="polite"
                >
                  <div className="aiToast__loadingWrap">
                    <span className="aiToast__spinner" aria-hidden="true" />
                    <strong>AI 분석 중</strong>
                  </div>
                  <p className="aiToast__timer">
                    진행 시간 {loadingElapsed.toFixed(1)}초
                  </p>
                </div>
              ) : toast?.show ? (
                <div
                  className={`aiToast ${toast.variant}`}
                  role="status"
                  aria-live="polite"
                >
                  <div className="aiToast__head">
                    <span className="aiToast__icon" aria-hidden="true">
                      {toast.icon}
                    </span>
                    <strong>{toast.title}</strong>
                  </div>
                  <p className="aiToast__msg">{toast.msg}</p>
                </div>
              ) : null}

              {analyzeError ? (
                <div className="card aiError" style={{ marginTop: 14 }}>
                  <div className="card__head">
                    <h2>요청에 실패했어요</h2>
                    <p>{analyzeError}</p>
                  </div>
                  <div
                    className="bottomBar"
                    style={{ justifyContent: "flex-start" }}
                  >
                    <button
                      type="button"
                      className="btn primary"
                      onClick={() =>
                        handleGenerateCandidates(
                          hasResult ? "regen" : "generate",
                        )
                      }
                    >
                      다시 시도
                    </button>
                  </div>
                </div>
              ) : null}

              {analyzing ? (
                <>
                  <div
                    className="candidateList candidateList--loading"
                    aria-hidden="true"
                  >
                    {[1, 2, 3].map((n) => (
                      <div
                        key={n}
                        className="candidateCard candidateCard--loading"
                      >
                        <div className="candidateHead">
                          <div className="candidateTitle">{`컨설팅 제안 ${n}`}</div>
                          <span className="candidateBadge">생성 중</span>
                        </div>
                        <div className="candidateSections single">
                          <section className="candidateSection candidateSection--content">
                            <div className="candidateSectionLabel candidateSectionLabel--ai">
                              AI 제안 스토리
                            </div>
                            <div className="candidateLoadingLine lg" />
                            <div className="candidateLoadingLine" />
                            <div className="candidateLoadingLine" />
                            <div className="candidateLoadingLine sm" />
                          </section>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : hasResult ? (
                <div className="card" style={{ marginTop: 14 }}>
                  <div className="card__head">
                    <h2>스토리 컨설팅 제안 3가지</h2>
                    <p>제안 1개를 선택하면 다음 단계로 진행할 수 있어요.</p>
                  </div>

                  <div className="candidateList">
                    {candidates.map((c, idx) => {
                      const isSelected = selectedId === c.id;
                      const aiStory = safeText(
                        c?.story || c?.raw || c?.oneLiner || "",
                        "",
                      );
                      const canExpand = shouldShowMore(aiStory);

                      return (
                        <div
                          key={c.id}
                          className={`candidateCard ${isSelected ? "selected" : ""}`}
                          role="button"
                          tabIndex={0}
                          onClick={() =>
                            !isSelected && handleSelectCandidate(c.id)
                          }
                          onKeyDown={(e) => {
                            if (isSelected) return;
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleSelectCandidate(c.id);
                            }
                          }}
                        >
                          <div className="candidateHead">
                            <div className="candidateTitle">{`컨설팅 제안 ${idx + 1}`}</div>
                            <span className="candidateBadge">
                              {isSelected ? "선택됨" : "제안"}
                            </span>
                          </div>

                          <div className="candidateSections single">
                            <section className="candidateSection candidateSection--content">
                              <div className="candidateSectionLabel candidateSectionLabel--ai">
                                AI 제안 스토리
                              </div>

                              <div>
                                <div
                                  className={`candidateBody ${expandedCandidates?.[c.id] ? "expanded" : "clamped"}`}
                                >
                                  {aiStory || "AI 결과값이 없습니다."}
                                </div>

                                {canExpand ? (
                                  <button
                                    type="button"
                                    className="candidateMore"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleExpanded(c.id);
                                    }}
                                  >
                                    {expandedCandidates?.[c.id]
                                      ? "접기"
                                      : "더 보기"}
                                  </button>
                                ) : null}
                              </div>
                            </section>
                          </div>

                          <div className="candidateActions">
                            <button
                              type="button"
                              className={`btn primary ${isSelected ? "disabled" : ""}`}
                              disabled={isSelected}
                              onClick={() => handleSelectCandidate(c.id)}
                            >
                              {isSelected ? "선택 완료" : "선택"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ marginTop: 12, fontSize: 12, opacity: 0.75 }}>
                    {canGoNext
                      ? "✅ 사이드 카드에서 ‘로고 단계로 이동’ 버튼을 눌러주세요."
                      : "* 제안 1개를 선택하면 사이드 카드에 다음 단계 버튼이 표시됩니다."}
                  </div>
                </div>
              ) : null}
            </section>

            {/* 오른쪽 사이드 카드 */}
            <aside className="diagInterview__right">
              <div className="sideCard">
                <ConsultingFlowMini activeKey="story" />

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
                    <span className="k">필수 완료</span>
                    <span className="v">
                      {completedRequired}/{requiredKeys.length}
                    </span>
                  </div>
                  <div className="sideMeta__row">
                    <span className="k">마지막 저장</span>
                    <span className="v">{lastSaved}</span>
                  </div>
                  {/* ✅ (요청 반영) 기본정보 제거에 맞춰 단계(stage) 표시도 제거 */}
                </div>

                {saveMsg ? <p className="saveMsg">{saveMsg}</p> : null}

                <div className="divider" />

                {hasResult ? (
                  <div
                    className="sideCompactDone"
                    role="status"
                    aria-live="polite"
                  >
                    <h4 className="sideSubTitle" style={{ marginTop: 0 }}>
                      입력 상태
                    </h4>
                    <p className="hint" style={{ marginTop: 6 }}>
                      필수 입력 완료 · AI 제안 수신 완료
                    </p>
                  </div>
                ) : (
                  <>
                    <h4 className="sideSubTitle">필수 입력 체크</h4>
                    <ul className="checkList checkList--cards">
                      {requiredKeys.map((key) => {
                        const ok = Boolean(requiredStatus[key]);
                        const label = requiredLabelMap[key] || key;

                        return (
                          <li key={key}>
                            <button
                              type="button"
                              className={`checkItemBtn ${ok ? "ok" : "todo"}`}
                              onClick={() => scrollToRequiredField(key)}
                              aria-label={`${label} 항목으로 이동`}
                            >
                              <span className="checkItemLeft">
                                <span
                                  className={`checkStateIcon ${ok ? "ok" : "todo"}`}
                                  aria-hidden="true"
                                >
                                  {ok ? "✅" : "❗"}
                                </span>
                                <span>{label}</span>
                              </span>
                              <span className="checkItemState">
                                {ok ? "완료" : "필수"}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}

                <div className="divider" />

                <button
                  type="button"
                  className="btn ghost"
                  onClick={handleResetAll}
                  style={{ width: "100%", marginBottom: 8 }}
                >
                  전체 초기화
                </button>

                <button
                  type="button"
                  className={`btn primary sideAnalyze ${canAnalyze ? "ready" : "pending"} ${analyzing ? "disabled loading" : ""}`}
                  onClick={() =>
                    handleGenerateCandidates(hasResult ? "regen" : "generate")
                  }
                  disabled={!canAnalyze || analyzing}
                  style={{ width: "100%", marginBottom: 8 }}
                >
                  {analyzing ? (
                    <>
                      <span className="btnInlineSpinner" aria-hidden="true" />
                      <span>생성 중...</span>
                    </>
                  ) : hasResult ? (
                    "AI 분석 재요청"
                  ) : canAnalyze ? (
                    "AI 분석 요청"
                  ) : (
                    `AI 분석 요청 (${remainingRequired}개 남음)`
                  )}
                </button>

                <p
                  className={`hint sideActionHint ${canAnalyze ? "ready" : ""}`}
                >
                  {canAnalyze
                    ? "모든 필수 입력이 완료됐어요. AI 분석 요청을 눌러 다음 진행을 시작하세요."
                    : `필수 항목 ${remainingRequired}개를 모두 입력하면 AI 분석 요청 버튼이 활성화돼요.`}
                </p>

                {analyzeError ? (
                  <div className="aiInlineError" style={{ marginTop: 10 }}>
                    {analyzeError}
                  </div>
                ) : null}

                <div className="divider" />

                <h4 className="sideSubTitle">다음 단계</h4>
                {hasResult ? (
                  <>
                    <button
                      type="button"
                      className={`btn primary ${canGoNext ? "" : "disabled"}`}
                      onClick={handleGoNext}
                      disabled={!canGoNext}
                      style={{ width: "100%" }}
                    >
                      로고 단계로 이동
                    </button>
                    {!canGoNext ? (
                      <p className="hint" style={{ marginTop: 10 }}>
                        * 제안 1개를 선택하면 다음 단계 버튼이 활성화됩니다.
                      </p>
                    ) : null}
                  </>
                ) : (
                  <p className="hint" style={{ marginTop: 10 }}>
                    * AI 제안이 도착하면 다음 단계 버튼이 표시됩니다.
                  </p>
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>

      <SiteFooter onOpenPolicy={setOpenType} />
    </div>
  );
}
