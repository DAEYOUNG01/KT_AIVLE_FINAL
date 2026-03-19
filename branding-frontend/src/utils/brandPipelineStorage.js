// src/utils/brandPipelineStorage.js
import {
  userGetItem,
  userSetItem,
  userRemoveItem,
  userSafeParse,
  removeLegacyKey,
} from "./userLocalStorage.js";

export const PIPELINE_KEY = "brandPipeline_v1";
const DIAG_KEYS = ["diagnosisInterviewDraft_v1", "diagnosisInterviewDraft"];

// ✅ 단계별 localStorage 키(이전 단계 수정 시, 다음 단계 결과를 확실히 초기화하기 위함)
const STEP_STORAGE_KEYS = {
  naming: [
    "namingConsultingInterviewDraft_v1",
    "namingConsultingInterviewResult_v1",
    "brandInterview_naming_v1",
  ],
  concept: [
    // 컨셉(구 홈페이지 컨설팅 키 포함)
    "conceptConsultingInterviewDraft_v1",
    "conceptConsultingInterviewResult_v1",
    "conceptInterviewDraft_homepage_v7",
    "conceptInterviewResult_homepage_v7",
    "conceptInterviewDraft_homepage_v6",
    "conceptInterviewResult_homepage_v6",
    "conceptInterviewDraft_homepage_v5",
    "conceptInterviewResult_homepage_v5",
    "brandInterview_homepage_v1",
    "brandInterview_concept_v1",
  ],
  story: [
    "brandStoryConsultingInterviewDraft_v1",
    "brandStoryConsultingInterviewResult_v1",
    "brandInterview_story_v1",
  ],
  logo: [
    "logoConsultingInterviewDraft_v1",
    "logoConsultingInterviewResult_v1",
    "brandInterview_logo_v1",
  ],
};

function removeLocalStorageKeys(keys = []) {
  try {
    for (const k of keys) userRemoveItem(k);
  } catch {
    // ignore
  }
}

function safeParse(raw) {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function normalizeBrandIdValue(v) {
  if (v == null) return null;
  const s = String(v).trim();
  return s ? s : null;
}

function pickPipelineBrandId(p) {
  return normalizeBrandIdValue(p?.brandId ?? null);
}

export function ensureBrandIdConsistency(incomingBrandId) {
  const p = readPipeline();
  const expectedBrandId = pickPipelineBrandId(p);
  const incoming = normalizeBrandIdValue(incomingBrandId);

  // incoming 값이 없으면 pipeline 기준으로 그대로 진행
  if (!incoming) {
    return { ok: true, expectedBrandId, incomingBrandId: null };
  }

  if (expectedBrandId && String(expectedBrandId) !== String(incoming)) {
    return {
      ok: false,
      reason: "brand_mismatch",
      redirectTo: "/brandconsulting",
      expectedBrandId,
      incomingBrandId: incoming,
    };
  }

  return { ok: true, expectedBrandId, incomingBrandId: incoming };
}

export function readPipeline() {
  return safeParse(userGetItem(PIPELINE_KEY)) || {};
}

export function writePipeline(next) {
  const payload = { ...(next || {}), updatedAt: Date.now() };
  userSetItem(PIPELINE_KEY, JSON.stringify(payload));
  return payload;
}

export function upsertPipeline(patch) {
  const cur = readPipeline();
  return writePipeline({ ...cur, ...(patch || {}) });
}

export function clearStepsFrom(stepKey) {
  const cur = readPipeline();
  const next = { ...cur };

  // stepKey 이후 단계들을 모두 초기화
  const stepsToClear = [];
  if (stepKey === "naming")
    stepsToClear.push("naming", "concept", "story", "logo");
  else if (stepKey === "concept") stepsToClear.push("concept", "story", "logo");
  else if (stepKey === "story") stepsToClear.push("story", "logo");
  else if (stepKey === "logo") stepsToClear.push("logo");

  for (const s of stepsToClear) delete next[s];

  // ✅ 다음 단계 결과가 localStorage에 남아 있으면, 홈 화면에서 다시 "완료"로 복구되는 문제가 생길 수 있어
  // → pipeline 초기화와 함께 legacy/result/draft 키도 같이 지워서 일관성 유지
  for (const s of stepsToClear) {
    removeLocalStorageKeys(STEP_STORAGE_KEYS[s] || []);
  }

  return writePipeline(next);
}

export function setStepResult(stepKey, data) {
  const cur = readPipeline();
  const next = {
    ...cur,
    [stepKey]: {
      ...(cur?.[stepKey] || {}),
      ...(data || {}),
      updatedAt: Date.now(),
    },
    updatedAt: Date.now(),
  };
  userSetItem(PIPELINE_KEY, JSON.stringify(next));
  return next;
}

export function getSelected(stepKey) {
  const cur = readPipeline();
  const step = cur?.[stepKey];
  if (!step) return null;
  if (step?.selected) return step.selected;
  if (step?.selectedId && Array.isArray(step?.candidates)) {
    return step.candidates.find((c) => c.id === step.selectedId) || null;
  }
  return null;
}

export function readDiagnosisDraftForm() {
  for (const k of DIAG_KEYS) {
    const parsed = userSafeParse(k);
    if (!parsed) continue;
    const form =
      parsed?.form && typeof parsed.form === "object" ? parsed.form : parsed;
    if (form && typeof form === "object") return form;
  }
  return null;
}

/**
 * ✅ 기업진단 draft를 "요약" 형태로 정리
 * - 이후 네이밍/컨셉/스토리/로고 AI 요청 payload의 공통 입력으로 사용
 */
export function buildDiagnosisSummaryFromDraft(form) {
  const f = form || {};
  const companyName = String(
    f.companyName || f.brandName || f.projectName || "",
  ).trim();
  const website = String(f.website || "").trim();

  const oneLine = String(f.oneLine || "").trim();
  const customerProblem = String(f.customerProblem || "").trim();
  const targetPersona = String(
    f.targetPersona || f.targetCustomer || "",
  ).trim();
  const usp = String(f.usp || "").trim();
  const stage = String(f.stage || "").trim();
  const industry = String(f.industry || "").trim();
  const visionHeadline = String(f.visionHeadline || f.goal12m || "").trim();

  const shortText = [
    companyName ? `${companyName}` : null,
    oneLine ? `${oneLine}` : null,
    targetPersona ? `타깃: ${targetPersona}` : null,
    industry ? `산업: ${industry}` : null,
    stage ? `단계: ${stage}` : null,
  ]
    .filter(Boolean)
    .slice(0, 4)
    .join(" · ");

  return {
    companyName,
    website,
    oneLine,
    customerProblem,
    targetPersona,
    usp,
    stage,
    industry,
    visionHeadline,
    shortText,
  };
}

/**
 * ✅ 단계 접근 가드
 */
export function ensureStepAccess(stepKey) {
  const p = readPipeline();

  // ✅ 진단 완료 판정 로직 수정
  const hasDiagnosis =
    Boolean(p?.brandId) && Boolean(String(p?.diagnosisSummary || "").trim());

  const hasNaming = Boolean(p?.naming?.selectedId || p?.naming?.selected);
  const hasConcept = Boolean(p?.concept?.selectedId || p?.concept?.selected);
  const hasStory = Boolean(p?.story?.selectedId || p?.story?.selected);

  if (stepKey === "naming") {
    if (!hasDiagnosis)
      return {
        ok: false,
        redirectTo: "/diagnosisinterview",
        reason: "diagnosis_missing",
      };
    return { ok: true };
  }

  if (stepKey === "concept") {
    if (!hasDiagnosis)
      return {
        ok: false,
        redirectTo: "/diagnosisinterview",
        reason: "diagnosis_missing",
      };
    if (!hasNaming)
      return {
        ok: false,
        redirectTo: "/brand/naming/interview",
        reason: "naming_missing",
      };
    return { ok: true };
  }

  if (stepKey === "story") {
    if (!hasDiagnosis)
      return {
        ok: false,
        redirectTo: "/diagnosisinterview",
        reason: "diagnosis_missing",
      };
    if (!hasNaming)
      return {
        ok: false,
        redirectTo: "/brand/naming/interview",
        reason: "naming_missing",
      };
    if (!hasConcept)
      return {
        ok: false,
        redirectTo: "/brand/concept/interview",
        reason: "concept_missing",
      };
    return { ok: true };
  }

  if (stepKey === "logo") {
    if (!hasDiagnosis)
      return {
        ok: false,
        redirectTo: "/diagnosisinterview",
        reason: "diagnosis_missing",
      };
    if (!hasNaming)
      return {
        ok: false,
        redirectTo: "/brand/naming/interview",
        reason: "naming_missing",
      };
    if (!hasConcept)
      return {
        ok: false,
        redirectTo: "/brand/concept/interview",
        reason: "concept_missing",
      };
    if (!hasStory)
      return { ok: false, redirectTo: "/brand/story", reason: "story_missing" };
    return { ok: true };
  }

  return { ok: true };
}

/**
 * ✅ 레거시(기존 localStorage 키들) → pipeline으로 마이그레이션(1회성)
 * - 버그 수정: next 선언 전 참조하던 부분 정리
 */
export function migrateLegacyToPipelineIfNeeded() {
  const stepDone = (obj, k) =>
    Boolean(obj?.[k]?.selectedId || obj?.[k]?.selected);
  const prevOf = { concept: "naming", story: "concept", logo: "story" };

  const legacyMap = [
    // naming
    { step: "naming", key: "namingConsultingInterviewResult_v1" },
    { step: "naming", key: "brandInterview_naming_v1" },

    // concept
    { step: "concept", key: "conceptInterviewResult_homepage_v7" },
    { step: "concept", key: "conceptInterviewResult_homepage_v6" },
    { step: "concept", key: "conceptInterviewResult_homepage_v5" },
    { step: "concept", key: "conceptConsultingInterviewResult_v1" },
    { step: "concept", key: "brandInterview_homepage_v1" },
    { step: "concept", key: "brandInterview_concept_v1" },

    // story
    { step: "story", key: "brandStoryConsultingInterviewResult_v1" },
    { step: "story", key: "brandInterview_story_v1" },

    // logo
    { step: "logo", key: "logoConsultingInterviewResult_v1" },
    { step: "logo", key: "brandInterview_logo_v1" },
  ];

  const cur = readPipeline();
  let next = { ...cur };
  let changed = false;

  // 1) diagnosisSummary 없으면, diagnosis draft로 생성
  if (!next?.diagnosisSummary) {
    const diag = readDiagnosisDraftForm();
    if (diag) {
      const summary = buildDiagnosisSummaryFromDraft(diag);
      next = { ...next, diagnosisSummary: summary, updatedAt: Date.now() };
      changed = true;
    }
  }

  // 2) 기존 단계 결과 키들(예전 구현)에서 pipeline 채우기
  for (const { step, key } of legacyMap) {
    if (stepDone(next, step)) continue;

    const prev = prevOf[step];
    if (prev && !stepDone(next, prev)) continue;

    const raw = userSafeParse(key);
    if (!raw) continue;

    const rawUpdatedAt = Number(raw?.updatedAt || 0);
    const prevUpdatedAt = prev ? Number(next?.[prev]?.updatedAt || 0) : 0;

    // 이전 단계가 더 최신이면, 다음 단계 결과는 무효로 간주(오래된 결과가 다시 복구되는 문제 방지)
    if (prev && prevUpdatedAt && rawUpdatedAt && prevUpdatedAt > rawUpdatedAt)
      continue;
    if (prev && prevUpdatedAt && !rawUpdatedAt) continue;

    const selectedId = raw?.selectedId || null;
    const candidates = Array.isArray(raw?.candidates) ? raw.candidates : [];
    const selected = raw?.selected || null;

    if (selectedId || selected) {
      next[step] = {
        candidates,
        selectedId,
        selected,
        updatedAt: rawUpdatedAt || Date.now(),
      };
      changed = true;
    }
  }

  if (changed) writePipeline(next);
  return readPipeline();
}

/** =========================
 * ✅ Strict Brand Flow (네이밍 → 컨셉 → 스토리 → 로고)
 * ========================= */

export const BRAND_FLOW_STEPS = ["naming", "concept", "story", "logo"];

const BRAND_FLOW_STEP_INDEX = {
  naming: 0,
  concept: 1,
  story: 2,
  logo: 3,
};

const BRAND_FLOW_ROUTE_BY_STEP = {
  naming: "/brand/naming/interview",
  concept: "/brand/concept/interview",
  story: "/brand/story",
  logo: "/brand/logo/interview",
};

export function getBrandFlow() {
  const p = readPipeline();
  return p?.brandFlow || null;
}

function isStepSelected(p, stepKey) {
  const step = p?.[stepKey];
  return Boolean(step?.selectedId || step?.selected);
}

function inferMaxReachedStep(p) {
  // ✅ '선택 결과' 기준으로, 가장 멀리 도달한 단계를 추정
  // - flow가 없거나 손상되었을 때, 뒤로가기 차단을 안정적으로 유지하기 위함
  if (isStepSelected(p, "logo")) return "logo";
  if (isStepSelected(p, "story")) return "story";
  if (isStepSelected(p, "concept")) return "concept";
  if (isStepSelected(p, "naming")) return "naming";
  return "naming";
}

export function isBrandFlowActive() {
  const f = getBrandFlow();
  return Boolean(f?.active);
}

export function isBrandConsultingCompleted() {
  const p = readPipeline();
  const hasDiagnosis = Boolean(
    p?.diagnosisSummary?.companyName || p?.diagnosisSummary?.oneLine,
  );
  const hasNaming = isStepSelected(p, "naming");
  const hasConcept = isStepSelected(p, "concept");
  const hasStory = isStepSelected(p, "story");
  const hasLogo = isStepSelected(p, "logo");
  return Boolean(
    hasDiagnosis && hasNaming && hasConcept && hasStory && hasLogo,
  );
}

// ✅ App-level 라우팅 가드에서 사용하는 "진행 중" 판정
// - brandFlow.active가 true면 진행 중
// - 혹시 flow가 아직 시작되지 않았어도(레거시/비정상) 기업진단이 있고
//   최종 완료 전이면 진행 중으로 간주
export function isBrandWorkInProgress() {
  const p = readPipeline();
  const flow = p?.brandFlow;
  if (flow?.active) return true;

  const hasDiagnosis = Boolean(
    p?.diagnosisSummary?.companyName || p?.diagnosisSummary?.oneLine,
  );
  if (!hasDiagnosis) return false;
  return !isBrandConsultingCompleted();
}

export function getBrandFlowCurrentStep() {
  const f = getBrandFlow();
  const cur = String(f?.currentStep || "naming");
  return BRAND_FLOW_STEP_INDEX[cur] != null ? cur : "naming";
}

export function getBrandFlowRouteForStep(stepKey) {
  return BRAND_FLOW_ROUTE_BY_STEP[stepKey] || "/brand/naming/interview";
}

export function isBrandFlowRoute(pathname) {
  const p = String(pathname || "");
  if (!p) return false;

  if (p === "/brand/naming/interview") return true;
  if (p === "/brand/concept/interview") return true;
  if (p === "/brand/story" || p === "/brand/story/interview") return true;
  if (p === "/brand/logo/interview") return true;

  if (p === "/nameconsulting" || p === "/namingconsulting") return true;
  if (p === "/conceptconsulting" || p === "/homepageconsulting") return true;
  if (p === "/brand/homepage/interview") return true;
  if (p === "/brandstoryconsulting") return true;
  if (p === "/logoconsulting") return true;

  return false;
}

export function markBrandFlowPendingAbort(reason = "interrupted") {
  // ✅ 새로고침/네트워크 끊김 등을 "중단"으로 간주하면 UX가 나빠지고 데이터가 리셋될 수 있어
  // → 이 프로젝트에서는 beforeunload 기반 중단 판정을 사용하지 않음 (no-op)
  return readPipeline();
}

export function consumeBrandFlowPendingAbort() {
  // no-op (see markBrandFlowPendingAbort)
  return false;
}

export function startBrandFlow({ brandId } = {}) {
  const cur = readPipeline();

  const incomingBrandId = normalizeBrandIdValue(brandId);
  const curBrandId = pickPipelineBrandId(cur);

  const hasIncoming = incomingBrandId != null;
  const brandChanged =
    hasIncoming &&
    curBrandId != null &&
    String(curBrandId) !== String(incomingBrandId);

  // ✅ 진행 중 플로우에서 brandId가 바뀌면 즉시 차단
  // - 기존 데이터와 다른 브랜드 ID가 섞여 저장되는 문제 방지
  if (brandChanged && isBrandWorkInProgress()) {
    return {
      ok: false,
      reason: "brand_mismatch",
      redirectTo: "/brandconsulting",
      expectedBrandId: curBrandId,
      incomingBrandId,
      pipeline: cur,
    };
  }

  // ✅ brandId 변경이 허용되는 경우(완료 상태 등)에는 다음 단계를 초기화
  const base = brandChanged ? clearStepsFrom("naming") : { ...cur };
  const flow = base?.brandFlow || {};
  const inferred = inferMaxReachedStep(base);

  const next = {
    ...base,
    ...(hasIncoming ? { brandId: incomingBrandId } : {}),
    brandFlow: {
      active: true,
      currentStep: brandChanged
        ? "naming"
        : String(flow?.currentStep || inferred),
      startedAt: brandChanged ? Date.now() : flow?.startedAt || Date.now(),
      updatedAt: Date.now(),
      pendingAbort: false,
      pendingReason: null,
    },
    updatedAt: Date.now(),
  };

  const written = writePipeline(next);
  return { ok: true, pipeline: written, brandChanged };
}

export function setBrandFlowCurrent(stepKey) {
  const key = String(stepKey || "naming");
  const normalized = BRAND_FLOW_STEP_INDEX[key] != null ? key : "naming";

  const cur = readPipeline();
  const flow = cur?.brandFlow || {};

  // ✅ '절대 뒤로가기 금지' 정책
  // - 현재 단계보다 이전 단계로는 currentStep을 내리지 않음
  // - 브라우저 뒤로가기/메뉴 클릭 등으로 이전 페이지가 렌더되어도 상태가 되돌아가지 않게 함
  const curStepRaw = String(flow?.currentStep || inferMaxReachedStep(cur));
  const curStep =
    BRAND_FLOW_STEP_INDEX[curStepRaw] != null ? curStepRaw : "naming";
  const curIdx = BRAND_FLOW_STEP_INDEX[curStep] ?? 0;
  const wantIdx = BRAND_FLOW_STEP_INDEX[normalized] ?? 0;
  const nextStep = wantIdx >= curIdx ? normalized : curStep;

  const next = {
    ...cur,
    brandFlow: {
      active: true,
      currentStep: nextStep,
      startedAt: flow?.startedAt || Date.now(),
      updatedAt: Date.now(),
      pendingAbort: false,
      pendingReason: null,
    },
    updatedAt: Date.now(),
  };
  return writePipeline(next);
}

export function abortBrandFlow(reason = "leave") {
  const cleared = clearStepsFrom("naming");
  const cur = readPipeline();
  const flow = cur?.brandFlow || {};

  const next = {
    ...cleared,
    brandFlow: {
      ...flow,
      active: false,
      currentStep: "naming",
      pendingAbort: false,
      pendingReason: null,
      abortedAt: Date.now(),
      abortReason: String(reason || "leave"),
      updatedAt: Date.now(),
    },
    updatedAt: Date.now(),
  };
  return writePipeline(next);
}

export function completeBrandFlow() {
  const cur = readPipeline();
  const flow = cur?.brandFlow || {};
  const next = {
    ...cur,
    brandFlow: {
      ...flow,
      active: false,
      completedAt: Date.now(),
      updatedAt: Date.now(),
    },
    updatedAt: Date.now(),
  };
  return writePipeline(next);
}

export function ensureStrictStepAccess(stepKey) {
  const base = ensureStepAccess(stepKey);
  if (!base?.ok) return base;

  const cur = readPipeline();
  const flow = cur?.brandFlow;

  if (flow?.active) {
    const curStep = getBrandFlowCurrentStep();
    const wantRaw = String(stepKey || "naming");
    const wantStep =
      BRAND_FLOW_STEP_INDEX[wantRaw] != null ? wantRaw : "naming";

    const curIdx = BRAND_FLOW_STEP_INDEX[curStep] ?? 0;
    const wantIdx = BRAND_FLOW_STEP_INDEX[wantStep] ?? 0;

    // ✅ 이전 단계로 되돌아가기 금지
    if (wantIdx < curIdx) {
      return {
        ok: false,
        redirectTo: getBrandFlowRouteForStep(curStep),
        reason: "no_back",
        currentStep: curStep,
      };
    }

    // ✅ 현재 단계에서 2단계 이상 점프 금지
    if (wantIdx > curIdx + 1) {
      return {
        ok: false,
        redirectTo: getBrandFlowRouteForStep(curStep),
        reason: "no_jump",
        currentStep: curStep,
      };
    }
  }

  return { ok: true };
}

// ✅ 중도 이탈/권한 이슈 등으로 "기업진단부터 재시작"이 필요할 때 사용
// - 기업진단 진행률(홈 0%)을 위해 diagnosis draft/result도 함께 제거
// - 마이페이지 히스토리(brandReportHistory)는 보존
export function resetBrandConsultingToDiagnosisStart(reason = "reset") {
  // 1) 브랜드 파이프라인 제거
  try {
    userRemoveItem(PIPELINE_KEY);
  } catch {
    // ignore
  }

  // 2) 브랜드 단계별 draft/result 제거
  const allStepKeys = Object.values(STEP_STORAGE_KEYS).flat();
  try {
    allStepKeys.forEach((k) => userRemoveItem(k));
  } catch {
    // ignore
  }

  // 3) 기업진단 draft/result 제거(진행률 0%로)
  const DIAG_RESET_KEYS = [
    ...DIAG_KEYS,
    "diagnosisDraft",
    "diagnosisResult_v1",
  ];
  try {
    DIAG_RESET_KEYS.forEach((k) => userRemoveItem(k));
  } catch {
    // ignore
  }

  // 4) 레거시(사용자 스코프 없는) 키도 함께 제거(안전)
  try {
    [
      PIPELINE_KEY,
      ...DIAG_RESET_KEYS,
      "diagnosisResult_v1_global",
      ...allStepKeys,
    ].forEach((k) => removeLegacyKey(k));
  } catch {
    // ignore
  }

  return { ok: true, reason };
}
