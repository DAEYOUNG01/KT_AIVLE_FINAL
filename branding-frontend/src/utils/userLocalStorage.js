// src/utils/userLocalStorage.js
// ✅ 목적: 같은 브라우저(localStorage) 환경에서 사용자(userId)별로
//     기업진단/컨설팅/작성중 Draft/Result 데이터를 분리 저장하기
//     (user1 로그아웃 후 user2 로그인 시 user1 데이터가 보이는 문제 방지)

import { getCurrentUserId } from "../api/auth.js";

const SUFFIX = "__uid__";

export function getActiveUserId() {
  try {
    const id = getCurrentUserId();
    const normalized = String(id || "").trim();
    return normalized || "guest";
  } catch {
    return "guest";
  }
}

export function userKey(baseKey, userId) {
  const uid = String(userId || getActiveUserId()).trim() || "guest";
  return `${baseKey}${SUFFIX}${uid}`;
}

export function userGetItem(baseKey, userId) {
  try {
    return localStorage.getItem(userKey(baseKey, userId));
  } catch {
    return null;
  }
}

export function userSetItem(baseKey, value, userId) {
  try {
    localStorage.setItem(userKey(baseKey, userId), value);
  } catch {
    // ignore
  }
}

export function userRemoveItem(baseKey, userId) {
  try {
    localStorage.removeItem(userKey(baseKey, userId));
  } catch {
    // ignore
  }
}

export function userSafeParse(baseKey, userId) {
  const raw = userGetItem(baseKey, userId);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function userSetJSON(baseKey, payload, userId) {
  try {
    userSetItem(baseKey, JSON.stringify(payload), userId);
  } catch {
    // ignore
  }
}

/**
 * ✅ 레거시(사용자 스코프 없는) 키 제거
 * - 기존 버전에서 localStorage에 저장되던 값들이 남아 있으면,
 *   다른 계정 로그인 시 노출될 수 있어서 정리용으로 사용
 */
export function removeLegacyKey(baseKey) {
  try {
    localStorage.removeItem(baseKey);
  } catch {
    // ignore
  }
}

export function removeLegacyKeys(baseKeys = []) {
  try {
    for (const k of baseKeys) removeLegacyKey(k);
  } catch {
    // ignore
  }
}
