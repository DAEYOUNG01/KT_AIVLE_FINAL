// src/utils/promoReportHistory.js
// ✅ 홍보물 컨설팅(개별 서비스) 결과 히스토리
// - 브랜드 컨설팅 결과는 백엔드(/brands 등)에서 조회
// - 홍보물 컨설팅은 현재 프론트(localStorage) 기반으로만 저장/조회

import { userSafeParse, userSetJSON } from "./userLocalStorage.js";

const PROMO_HISTORY_KEY = "promoConsultingHistory_v1";

function safeString(v, fallback = "") {
  const s = String(v ?? "").trim();
  return s ? s : fallback;
}

function toISO(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}

function readList() {
  const parsed = userSafeParse(PROMO_HISTORY_KEY);
  return Array.isArray(parsed) ? parsed : [];
}

function writeList(list) {
  userSetJSON(PROMO_HISTORY_KEY, Array.isArray(list) ? list : []);
}

export function listPromoReports() {
  const list = readList();
  return [...list].sort((a, b) => (b?.createdAt || 0) - (a?.createdAt || 0));
}

export function getPromoReport(id) {
  if (!id) return null;
  const list = readList();
  return list.find((r) => String(r?.id) === String(id)) || null;
}

export function addPromoReport(report) {
  if (!report?.id) return;
  const list = readList();
  const next = [report, ...list].slice(0, 80);
  writeList(next);
}

// NOTE)
// ✅ 홍보물 컨설팅은 서비스 종류가 계속 늘어날 수 있어서,
//    다양한 호출 형태를 허용(선택안/폼을 직접 넘기거나, result payload를 통째로 넘기는 방식)
export function createPromoReportSnapshot(opts = {}) {
  const {
    serviceKey,
    serviceLabel,
    selected: selectedArg,
    form: formArg,
    result,
    interviewRoute,
  } = opts;

  const selected = selectedArg || result?.selected || null;
  const form = formArg || result?.form || null;

  const createdAt = Date.now();
  const id = `pr_${safeString(serviceKey, "promo")}_${createdAt}`;

  const title = safeString(
    selected?.name,
    safeString(serviceLabel, "홍보물 컨설팅 리포트"),
  );
  const subtitle = safeString(
    form?.productName || form?.brandName || form?.serviceName || "",
    safeString(serviceLabel, ""),
  );

  return {
    id,
    kind: "promo",
    serviceKey: safeString(serviceKey, ""),
    serviceLabel: safeString(serviceLabel, ""),
    interviewRoute: safeString(interviewRoute, ""),
    createdAt,
    createdISO: toISO(createdAt),
    title,
    subtitle,
    snapshot: {
      selected,
      form,
      // (선택) 기존 결과 payload도 같이 보관해두면, 추후 상세페이지 확장에 유리
      result: result || null,
    },
  };
}
