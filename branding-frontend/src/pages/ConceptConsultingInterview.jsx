// src/pages/ConceptConsultingInterview.jsx
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
  // ✅ (기본정보 UI 제거했지만) AI payload 품질 위해 진단 요약만 내부 전달
  readDiagnosisDraftForm,
  buildDiagnosisSummaryFromDraft,
} from "../utils/brandPipelineStorage.js";

// ✅ 백 연동(이미 프로젝트에 존재하는 클라이언트 사용)
import { apiRequest, apiRequestAI } from "../api/client.js";
import "../styles/ConceptConsultingInterview.css";
import "../styles/ConsultingUnifiedTheme.css";

const STORAGE_KEY = "conceptInterviewDraft_homepage_v7";
const RESULT_KEY = "conceptInterviewResult_homepage_v7";
const LEGACY_KEY = "brandInterview_homepage_v1";
const NEXT_PATH = "/brand/story";

function safeText(v, fallback = "") {
  const s = String(v ?? "").trim();
  return s ? s : fallback;
}
function hasText(v) {
  return Boolean(String(v ?? "").trim());
}

/** ======================
 *  ✅ 백 응답 후보 normalize (3안 형태로 통일)
 *  ====================== */
function normalizeConceptCandidates(raw) {
  const payload = raw?.data ?? raw?.result ?? raw;

  const takeObjCandidates = (obj) => {
    const keys = [
      "concept1",
      "concept2",
      "concept3",
      "candidate1",
      "candidate2",
      "candidate3",
      "option1",
      "option2",
      "option3",
    ];
    const list = [];
    for (const k of keys) {
      const v = obj?.[k];
      if (v === undefined || v === null) continue;
      list.push(v);
    }
    return list;
  };

  let list = Array.isArray(payload) ? payload : null;

  if (!list && payload && typeof payload === "object") {
    list =
      payload?.candidates ||
      payload?.concepts ||
      payload?.data?.candidates ||
      payload?.data?.concepts ||
      payload?.result?.candidates ||
      payload?.result?.concepts ||
      null;
  }

  if (
    !list &&
    payload &&
    typeof payload === "object" &&
    !Array.isArray(payload)
  ) {
    list = takeObjCandidates(payload);
  }

  if (!Array.isArray(list)) return [];

  return list.slice(0, 3).map((item, idx) => {
    if (typeof item === "string") {
      const title = item.trim();
      return {
        id: `concept_${idx + 1}`,
        title,
        summary: "",
        tone: "",
        keywords: [],
        slogan: "",
        oneLine: "",
        note: "",
      };
    }

    const obj = item && typeof item === "object" ? item : {};
    const id = safeText(
      obj.id || obj.candidateId || obj.conceptId || "",
      `concept_${idx + 1}`,
    );
    const title = safeText(
      obj.title ||
        obj.name ||
        obj.label ||
        obj.conceptName ||
        obj.concept ||
        "",
      "",
    );

    return {
      id,
      title,
      summary: safeText(
        obj.summary || obj.description || obj.overview || "",
        "",
      ),
      tone: safeText(obj.tone || obj.brandTone || obj.voice || "", ""),
      keywords: Array.isArray(obj.keywords) ? obj.keywords : [],
      slogan: safeText(obj.slogan || obj.tagline || "", ""),
      oneLine: safeText(obj.oneLine || obj.one_line || obj.oneLiner || "", ""),
      note: safeText(obj.note || obj.memo || "", ""),
    };
  });
}

/** ✅ 칩 UI (CSS 없어도 선택 색이 무조건 보이도록 inline style 적용) */
function MultiChips({ value, options, onChange, max = null }) {
  const current = Array.isArray(value) ? value : [];

  const normalized = (Array.isArray(options) ? options : []).map((opt) => {
    if (typeof opt === "string") return { value: opt, label: opt };
    const o = opt && typeof opt === "object" ? opt : {};
    return {
      value: String(o.value ?? ""),
      label: String(o.label ?? o.value ?? ""),
    };
  });

  const toggle = (optValue) => {
    const exists = current.includes(optValue);

    // ✅ 단일 선택(max=1): 교체 동작 보장
    if (max === 1) {
      const next = exists ? [] : [optValue];
      onChange(next);
      return;
    }

    // ✅ 다중 선택
    let next = exists
      ? current.filter((x) => x !== optValue)
      : [...current, optValue];

    // ✅ max 초과 시: "방금 누른 항목"이 남도록 최근 선택 유지
    if (typeof max === "number" && max > 0 && next.length > max) {
      next = next.slice(next.length - max);
    }

    onChange(next);
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {normalized.map((opt) => {
        const active = current.includes(opt.value);

        const baseStyle = {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "8px 12px",
          borderRadius: 999,
          border: "1px solid rgba(0,0,0,0.14)",
          background: "transparent",
          color: "rgba(0,0,0,0.85)",
          fontSize: 13,
          fontWeight: 800,
          lineHeight: 1,
          cursor: "pointer",
          transition:
            "transform 120ms ease, background 160ms ease, border-color 160ms ease, box-shadow 160ms ease, color 160ms ease",
          userSelect: "none",
          outline: "none",
        };

        const activeStyle = active
          ? {
              background: "rgba(37,99,235,0.10)",
              border: "1px solid rgba(37,99,235,0.42)",
              color: "rgba(0,0,0,0.9)",
              boxShadow: "0 0 0 3px rgba(37,99,235,0.14)",
            }
          : {};

        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            className={`chip ${active ? "active" : ""}`}
            aria-pressed={active}
            style={{ ...baseStyle, ...activeStyle }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/** ======================
 * ✅ Step 3 질문지 옵션
 * ====================== */
const CORE_VALUE_OPTIONS = [
  { value: "Innovation", label: "혁신" },
  { value: "Trust", label: "신뢰" },
  { value: "Simplicity", label: "단순함" },
  { value: "Speed", label: "속도" },
  { value: "Customer Focus", label: "고객 중심" },
  { value: "Quality", label: "품질" },
  { value: "Collaboration", label: "협력" },
  { value: "Sustainability", label: "지속가능성" },
  { value: "Accessibility", label: "접근성" },
  { value: "Other", label: "기타" },
];

const BRAND_VOICE_OPTIONS = [
  { value: "Professional Expert", label: "전문적인 박사님" },
  { value: "Friendly Guide", label: "친절한 가이드" },
  { value: "Witty Friend", label: "위트 있는 친구" },
  { value: "Supportive Coach", label: "응원하는 코치" },
  { value: "Minimalist", label: "간결한 전달자" },
  { value: "Other", label: "기타" },
];

const POSITIONING_AXES_OPTIONS = [
  { value: "More Mass/Friendly", label: "더 대중적/친근한" },
  { value: "More Premium/Luxury", label: "더 프리미엄/고급스러운" },
  { value: "Faster/More Efficient", label: "더 빠르고 효율적인" },
  { value: "More Innovative/Experimental", label: "더 혁신적이고 실험적인" },
  { value: "Simpler/More Intuitive", label: "더 심플하고 직관적인" },
  { value: "More Fun/Witty", label: "더 재미있고 위트 있는" },
  { value: "More Stable/Conservative", label: "더 안정적이고 보수적인" },
  { value: "Other", label: "기타" },
];

/** ======================
 *  ✅ (요청 반영) 기업 기본 정보 필드/UI 제거
 *  - 컨셉 질문(필수 입력)만 유지
 * ====================== */
const INITIAL_FORM = {
  core_values: [],
  core_values_other: "",

  brand_voice: [],
  brand_voice_other: "",

  brand_promise: "",
  key_message: "",
  concept_vibe: "",

  positioning_axes: [],
  positioning_axes_other: "",

  // (호환/저장 구조 유지용)
  notes: "",
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

export default function ConceptConsultingInterview({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const REQUIRED_FIELD_ID = {
    core_values: "concept-q-core_values",
    brand_voice: "concept-q-brand_voice",
    brand_promise: "concept-q-brand_promise",
    key_message: "concept-q-key_message",
    concept_vibe: "concept-q-concept_vibe",
    positioning_axes: "concept-q-positioning_axes",
  };

  useEffect(() => {
    try {
      migrateLegacyToPipelineIfNeeded();

      const access = ensureStrictStepAccess("concept");
      if (!access?.ok) {
        if (access?.reason === "no_back") {
          alert(
            "이전 단계로는 돌아갈 수 없습니다. 현재 단계에서 계속 진행해주세요.",
          );
        }
        if (access?.redirectTo) {
          navigate(access.redirectTo, { replace: true });
        }
        return;
      }

      const p = readPipeline();
      const brandId =
        location?.state?.brandId ??
        location?.state?.report?.brandId ??
        p?.brandId ??
        null;

      startBrandFlow({ brandId });
      setBrandFlowCurrent("concept");
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ 약관/방침 모달
  const [openType, setOpenType] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);
  const closeModal = () => setOpenType(null);

  // ✅ 폼 상태
  const [form, setForm] = useState(INITIAL_FORM);

  // ✅ 저장 UI
  const [saveMsg, setSaveMsg] = useState("");
  const [lastSaved, setLastSaved] = useState("-");

  // ✅ 결과
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
  const [regenSeed, setRegenSeed] = useState(0);
  const refResult = useRef(null);

  // 섹션 ref
  const refConcept = useRef(null);

  const requiredKeys = useMemo(
    () => [
      "core_values",
      "brand_voice",
      "brand_promise",
      "key_message",
      "concept_vibe",
      "positioning_axes",
    ],
    [],
  );

  const requiredStatus = useMemo(() => {
    const status = {};
    status.core_values =
      Array.isArray(form?.core_values) && form.core_values.length >= 2; // 2~3
    status.brand_voice =
      Array.isArray(form?.brand_voice) && form.brand_voice.length >= 1; // 1
    status.brand_promise = hasText(form?.brand_promise);
    status.key_message = hasText(form?.key_message);
    status.concept_vibe = hasText(form?.concept_vibe);
    status.positioning_axes =
      Array.isArray(form?.positioning_axes) &&
      form.positioning_axes.length >= 1; // 1~2
    return status;
  }, [form]);

  const questionComplete = useMemo(
    () => ({
      core_values:
        Boolean(requiredStatus.core_values) &&
        (!(
          Array.isArray(form?.core_values) && form.core_values.includes("Other")
        ) ||
          hasText(form?.core_values_other)),
      brand_voice:
        Boolean(requiredStatus.brand_voice) &&
        (!(
          Array.isArray(form?.brand_voice) && form.brand_voice.includes("Other")
        ) ||
          hasText(form?.brand_voice_other)),
      brand_promise: Boolean(requiredStatus.brand_promise),
      key_message: Boolean(requiredStatus.key_message),
      concept_vibe: Boolean(requiredStatus.concept_vibe),
      positioning_axes:
        Boolean(requiredStatus.positioning_axes) &&
        (!(
          Array.isArray(form?.positioning_axes) &&
          form.positioning_axes.includes("Other")
        ) ||
          hasText(form?.positioning_axes_other)),
    }),
    [form, requiredStatus],
  );

  const completedRequired = useMemo(
    () => requiredKeys.filter((k) => Boolean(requiredStatus[k])).length,
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
  const loadingProgress = Math.min(96, Math.max(10, 22 + loadingElapsed * 16));
  const loadingStep = loadingElapsed < 1.8 ? 1 : loadingElapsed < 3.8 ? 2 : 3;

  const requiredLabelMap = {
    core_values: "핵심 가치",
    brand_voice: "브랜드 톤/보이스",
    brand_promise: "브랜드 약속",
    key_message: "핵심 메시지",
    concept_vibe: "컨셉 무드",
    positioning_axes: "포지셔닝 축",
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

  // ✅ draft 로드 (키 sanitize)
  useEffect(() => {
    try {
      const raw = userGetItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);

      const loaded =
        parsed?.form && typeof parsed.form === "object"
          ? sanitizeForm(parsed.form)
          : null;

      if (loaded) setForm(loaded);

      if (parsed?.updatedAt) {
        const d = new Date(parsed.updatedAt);
        if (!Number.isNaN(d.getTime())) setLastSaved(d.toLocaleString());
      }
    } catch {
      // ignore
    }
  }, []);

  // ✅ 결과 로드
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

  // ✅ 자동 저장(디바운스)
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

    try {
      const selected =
        nextCandidates.find((c) => c.id === nextSelectedId) || null;
      setStepResult("concept", {
        candidates: nextCandidates,
        selectedId: nextSelectedId,
        selected,
        regenSeed: nextSeed,
        updatedAt,
      });
      clearStepsFrom("story");
    } catch {
      // ignore
    }
  };

  const buildPayloadForAI = (mode, nextSeed) => {
    const coreValues = Array.isArray(form.core_values)
      ? [...form.core_values]
      : [];
    const brandVoice = Array.isArray(form.brand_voice)
      ? [...form.brand_voice]
      : [];
    const positioning = Array.isArray(form.positioning_axes)
      ? [...form.positioning_axes]
      : [];

    // ✅ (보이지 않게) 진단 요약만 내부 전달해서 AI 품질 유지
    const p = readPipeline();
    const diagnosisSummary =
      p?.diagnosisSummary ||
      (() => {
        const diag = readDiagnosisDraftForm();
        return diag ? buildDiagnosisSummaryFromDraft(diag) : null;
      })();

    return {
      ...form,
      core_values: coreValues,
      brand_voice: brandVoice,
      positioning_axes: positioning,
      mode,
      regenSeed: nextSeed,
      diagnosisSummary: diagnosisSummary || null,
      questionnaire: {
        step: "concept",
        version: "concept_v1",
        locale: "ko-KR",
      },
    };
  };

  const handleGenerateCandidates = async (mode = "generate") => {
    setAnalyzeError("");

    if (!canAnalyze) {
      if (
        Array.isArray(form?.core_values) &&
        form.core_values.length > 0 &&
        form.core_values.length < 2
      ) {
        alert("핵심 가치는 최소 2개를 선택해주세요. (2~3개 선택)");
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
        "brandId를 확인할 수 없습니다. 기업진단 → 네이밍을 먼저 진행해 주세요.",
      );
      navigate("/diagnosisinterview", { state: { mode: "start" } });
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

      const payload = buildPayloadForAI(mode, nextSeed);

      requestStartedAt = Date.now();
      const res = await apiRequestAI(`/brands/${brandId}/concept`, {
        method: "POST",
        data: payload,
      });

      const nextCandidates = normalizeConceptCandidates(res);

      if (!nextCandidates.length) {
        alert("컨셉 제안을 받지 못했습니다. 백 응답 포맷을 확인해주세요.");
        setCandidates([]);
        setSelectedId(null);
        persistResult([], null, nextSeed);
        return;
      }

      setCandidates(nextCandidates);
      setSelectedId(null);
      persistResult(nextCandidates, null, nextSeed);
      showToast({
        icon: "💡",
        title: "AI 분석 완료",
        msg: "컨셉 컨설팅 제안 3개가 도착했어요. 1개를 선택하면 다음 단계로 진행할 수 있어요.",
        variant: "success",
      });
      window.setTimeout(() => scrollToResult(), 50);
    } catch (e) {
      const status = e?.response?.status;
      const msg =
        e?.response?.data?.message || e?.userMessage || e?.message || "";

      console.warn("POST /brands/{brandId}/concept failed:", e);

      if (status === 401 || status === 403) {
        alert(
          status === 401
            ? "로그인이 필요합니다. 다시 로그인한 뒤 시도해주세요."
            : "권한이 없습니다(403). brandId 권한 문제일 수 있어요. 기업진단을 다시 진행해 brandId를 새로 만든 뒤 시도해주세요.",
        );
        return;
      }

      setAnalyzeError(`컨셉 생성에 실패했습니다: ${msg || "요청 실패"}`);
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
    const selectedConcept =
      selected?.title ||
      selected?.oneLiner ||
      selected?.summary ||
      selected?.oneLine ||
      "";

    if (!brandId) {
      alert("brandId를 확인할 수 없습니다. 기업진단을 다시 진행해 주세요.");
      return;
    }
    if (!String(selectedConcept).trim()) {
      alert("선택된 컨셉을 찾을 수 없습니다. 제안을 다시 선택해 주세요.");
      return;
    }

    try {
      await apiRequest(`/brands/${brandId}/concept/select`, {
        method: "POST",
        data: { selectedByUser: String(selectedConcept) },
      });
    } catch (e) {
      const status = e?.response?.status;
      const msg =
        e?.response?.data?.message || e?.userMessage || e?.message || "";

      console.warn("POST /brands/{brandId}/concept/select failed:", e);

      if (status === 401 || status === 403) {
        alert(
          status === 401
            ? "로그인이 필요합니다. 다시 로그인한 뒤 시도해주세요."
            : "권한이 없습니다(403). brandId 권한 문제일 수 있어요. 기업진단을 다시 진행해 brandId를 새로 만든 뒤 시도해주세요.",
        );
        return;
      }
      alert(`컨셉 선택 저장에 실패했습니다: ${msg || "요청 실패"}`);
      return;
    }

    try {
      setBrandFlowCurrent("story");
    } catch {
      // ignore
    }

    navigate(NEXT_PATH);
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
      clearStepsFrom("concept");
      setBrandFlowCurrent("concept");
    } catch {
      // ignore
    }

    setForm({ ...INITIAL_FORM });
    setCandidates([]);
    setSelectedId(null);
    setRegenSeed(0);
    setSaveMsg("");
    setLastSaved("-");
    setAnalyzeError("");
    setToast(EMPTY_TOAST);
  };

  const isOtherSelected = (arr) => Array.isArray(arr) && arr.includes("Other");

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
          <section className="diagInterviewHero" aria-label="인터뷰 안내 배너">
            <div className="diagInterviewHero__inner">
              <div className="diagInterviewHero__left">
                <h1 className="diagInterview__title">컨셉 컨설팅 인터뷰</h1>
                <p className="diagInterview__sub">
                  아래 질문에 답하면 컨셉 제안 3안을 생성합니다. 선택한 1안은
                  다음 단계(스토리) 생성에 사용됩니다.
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

          <ConsultingFlowPanel activeKey="concept" />

          <div className="diagInterview__grid">
            <section className="diagInterview__left">
              {/* ✅ (요청 반영) 1) BASIC 기본정보 카드 제거 */}

              {/* 2) Step 3 */}
              <div className="card consultingIntroCard" ref={refConcept}>
                <div className="card__head">
                  <h2>Brand Concept Consulting</h2>
                  {/* <p>아래 질문에 답하면, 컨셉 제안 3가지를 생성할 수 있어요.</p> */}
                </div>
              </div>

              <div
                className="card questionCard"
              >
                <div
                  className={`field questionField ${questionComplete.core_values ? "is-complete" : ""}`}
                  id="concept-q-core_values"
                >
                  <label>
                    1. 브랜드가 절대 포기할 수 없는 핵심 가치는 무엇인가요?
                    (2-3개 선택) <span className="req">*</span>
                  </label>
                  <div className="hint" style={{ marginTop: 6 }}>
                    최소 2개 선택 필요 / 최대 3개까지 선택됩니다.
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <MultiChips
                      value={form.core_values}
                      options={CORE_VALUE_OPTIONS}
                      max={3}
                      onChange={(next) => setValue("core_values", next)}
                    />
                  </div>

                  {isOtherSelected(form.core_values) ? (
                    <div className="field" style={{ marginTop: 10 }}>
                      <label>기타(핵심 가치) 직접 입력</label>
                      <input
                        value={form.core_values_other}
                        onChange={(e) =>
                          setValue("core_values_other", e.target.value)
                        }
                        placeholder="핵심 가치를 직접 입력해주세요"
                      />
                    </div>
                  ) : null}

                  {!requiredStatus.core_values ? (
                    <div className="hint" style={{ marginTop: 8 }}>
                      * 핵심 가치는 최소 2개를 선택해주세요.
                    </div>
                  ) : null}
                </div>
              </div>

              <div
                className="card questionCard"
              >
                <div
                  className={`field questionField ${questionComplete.brand_voice ? "is-complete" : ""}`}
                  id="concept-q-brand_voice"
                >
                  <label>
                    2. 고객에게 말을 건넨다면 어떤 말투일까요?{" "}
                    <span className="req">*</span>
                  </label>
                  <div className="hint" style={{ marginTop: 6 }}>
                    1개 선택
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <MultiChips
                      value={form.brand_voice}
                      options={BRAND_VOICE_OPTIONS}
                      max={1}
                      onChange={(next) => setValue("brand_voice", next)}
                    />
                  </div>

                  {isOtherSelected(form.brand_voice) ? (
                    <div className="field" style={{ marginTop: 10 }}>
                      <label>기타(말투) 직접 입력</label>
                      <input
                        value={form.brand_voice_other}
                        onChange={(e) =>
                          setValue("brand_voice_other", e.target.value)
                        }
                        placeholder="브랜드의 말투를 구체적으로 설명해주세요"
                      />
                    </div>
                  ) : null}
                </div>
              </div>

              <div
                className="card questionCard"
              >
                <div
                  className={`field questionField ${questionComplete.brand_promise ? "is-complete" : ""}`}
                  id="concept-q-brand_promise"
                >
                  <label>
                    3. 우리 브랜드가 고객에게 약속하는 단 하나는 무엇인가요?{" "}
                    <span className="req">*</span>
                  </label>
                  <input
                    value={form.brand_promise}
                    onChange={(e) => setValue("brand_promise", e.target.value)}
                    placeholder="예: 3일 안에 배송 / 24시간 응대 / 100% 환불"
                  />
                </div>
              </div>

              <div
                className="card questionCard"
              >
                <div
                  className={`field questionField ${questionComplete.key_message ? "is-complete" : ""}`}
                  id="concept-q-key_message"
                >
                  <label>
                    4. 고객이 기억해야 할 단 한 문장은 무엇인가요?{" "}
                    <span className="req">*</span>
                  </label>
                  <input
                    value={form.key_message}
                    onChange={(e) => setValue("key_message", e.target.value)}
                    placeholder="예: '당신의 시간을 아껴드립니다'"
                  />
                </div>
              </div>

              <div
                className="card questionCard"
              >
                <div
                  className={`field questionField ${questionComplete.concept_vibe ? "is-complete" : ""}`}
                  id="concept-q-concept_vibe"
                >
                  <label>
                    5. 브랜드 전체를 관통하는 시각적/심리적 분위기는 무엇인가요?{" "}
                    <span className="req">*</span>
                  </label>
                  <input
                    value={form.concept_vibe}
                    onChange={(e) => setValue("concept_vibe", e.target.value)}
                    placeholder="예: 깨끗하고 미니멀 / 따뜻한 카페 / 활기찬 스타트업"
                  />
                </div>
              </div>

              <div
                className="card questionCard"
              >
                <div
                  className={`field questionField ${questionComplete.positioning_axes ? "is-complete" : ""}`}
                  id="concept-q-positioning_axes"
                >
                  <label>
                    6. 우리 브랜드가 경쟁사와 가장 달라지고 싶은 방향은 어디에
                    가깝나요? (최대 2개) <span className="req">*</span>
                  </label>
                  <div className="hint" style={{ marginTop: 6 }}>
                    최대 2개까지 선택됩니다.
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <MultiChips
                      value={form.positioning_axes}
                      options={POSITIONING_AXES_OPTIONS}
                      max={2}
                      onChange={(next) => setValue("positioning_axes", next)}
                    />
                  </div>

                  {isOtherSelected(form.positioning_axes) ? (
                    <div className="field" style={{ marginTop: 10 }}>
                      <label>기타(포지셔닝 방향) 직접 입력</label>
                      <input
                        value={form.positioning_axes_other}
                        onChange={(e) =>
                          setValue("positioning_axes_other", e.target.value)
                        }
                        placeholder="원하는 포지셔닝 방향을 구체적으로 설명해주세요"
                      />
                    </div>
                  ) : null}
                </div>
              </div>

              {/* 결과 anchor */}
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
                      {analyzing ? "컨셉 제안 생성 중" : "컨셉 제안 생성 완료"}
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
                              제안 핵심
                            </div>
                            <div className="candidateLoadingLine lg" />
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
                    <h2>컨셉 컨설팅 제안 3가지</h2>
                    <p>제안 1개를 선택하면 다음 단계로 진행할 수 있어요.</p>
                  </div>

                  <div className="candidateList">
                    {candidates.map((c, idx) => {
                      const isSelected = selectedId === c.id;

                      const title = safeText(c?.title, "");
                      const summary = safeText(c?.summary, "");
                      const oneLine = safeText(c?.oneLine, "");
                      const slogan = safeText(c?.slogan, "");
                      const tone = safeText(c?.tone, "");
                      const note = safeText(c?.note, "");
                      const keywords = Array.isArray(c?.keywords)
                        ? c.keywords.filter((x) => hasText(x))
                        : [];

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
                          style={{
                            border: isSelected
                              ? "2px solid rgba(37,99,235,0.46)"
                              : undefined,
                            boxShadow: isSelected
                              ? "0 0 0 3px rgba(37,99,235,0.14)"
                              : undefined,
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
                              <div className="candidateSectionLabel">
                                제안 핵심
                              </div>
                              {hasText(title) ? (
                                <div className="candidateSectionText">
                                  {title}
                                </div>
                              ) : null}
                              {hasText(summary) ? (
                                <div className="candidateSectionText">
                                  {summary}
                                </div>
                              ) : null}
                              {hasText(oneLine) ? (
                                <div className="candidateSectionText">
                                  {oneLine}
                                </div>
                              ) : null}
                              {hasText(slogan) ? (
                                <div
                                  style={{
                                    marginTop: 10,
                                    fontSize: 13,
                                    fontWeight: 800,
                                    opacity: 0.95,
                                  }}
                                >
                                  “{slogan}”
                                </div>
                              ) : null}

                              {hasText(tone) ? (
                                <div
                                  className="candidateDetailItem"
                                  style={{ marginTop: 10 }}
                                >
                                  <b>톤</b> · {tone}
                                </div>
                              ) : null}

                              {keywords.length ? (
                                <div
                                  style={{
                                    marginTop: 10,
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 6,
                                  }}
                                >
                                  {keywords.map((kw) => (
                                    <span
                                      key={kw}
                                      style={{
                                        fontSize: 12,
                                        fontWeight: 800,
                                        padding: "4px 10px",
                                        borderRadius: 999,
                                        background: "rgba(0,0,0,0.04)",
                                        border: "1px solid rgba(0,0,0,0.06)",
                                        color: "rgba(0,0,0,0.75)",
                                      }}
                                    >
                                      #{kw}
                                    </span>
                                  ))}
                                </div>
                              ) : null}

                              {hasText(note) ? (
                                <div
                                  className="candidateDetailItem"
                                  style={{ marginTop: 10 }}
                                >
                                  {note}
                                </div>
                              ) : null}
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
                      ? "✅ 사이드 카드에서 ‘스토리 단계로 이동’ 버튼을 눌러주세요."
                      : "* 제안 1개를 선택하면 사이드 카드에 다음 단계 버튼이 표시됩니다."}
                  </div>
                </div>
              ) : null}
            </section>

            {/* 오른쪽 */}
            <aside className="diagInterview__right">
              <div className="sideCard">
                <ConsultingFlowMini activeKey="concept" />

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
                      스토리 단계로 이동
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
