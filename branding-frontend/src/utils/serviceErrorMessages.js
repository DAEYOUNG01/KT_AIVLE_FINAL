// src/utils/serviceErrorMessages.js

function normalizeText(v) {
  return String(v ?? "").trim();
}

function lower(v) {
  return normalizeText(v).toLowerCase();
}

export function getErrorStatus(error) {
  return (
    error?.status ??
    error?.response?.status ??
    error?.response?.data?.status ??
    null
  );
}

export function getErrorRawMessage(error) {
  const msg =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.response?.data?.title ||
    error?.userMessage ||
    error?.message ||
    "";

  return normalizeText(msg);
}

export function getBrandIdMismatchMessage() {
  return "현재 로그인한 계정과 브랜드 정보가 일치하지 않아 요청을 처리할 수 없습니다.\n기업진단부터 다시 시작해 새로운 브랜드를 만든 뒤 진행해주세요.";
}

export function getBrandIdMissingMessage(extraGuide = "") {
  const guide = normalizeText(extraGuide);
  const base =
    "브랜드 식별 정보(brandId)를 찾을 수 없어 요청을 진행할 수 없습니다.\n기업진단부터 다시 시작해 브랜드를 다시 생성해주세요.";
  return guide ? `${base}\n\n안내: ${guide}` : base;
}

export function getPayloadTooLargeMessage() {
  return "요청 데이터 용량이 허용 범위를 초과했습니다.\n파일 크기를 줄이거나 입력 내용을 정리한 뒤 다시 시도해주세요.";
}

function includesAny(text, words) {
  const t = lower(text);
  return words.some((w) => t.includes(lower(w)));
}

export function getServiceErrorMessage(error, options = {}) {
  const {
    context = "general", // login | signup | brand | upload | general
    fallback = "요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
  } = options;

  const status = getErrorStatus(error);
  const raw = getErrorRawMessage(error);

  const tokenLike = includesAny(raw, [
    "token",
    "jwt",
    "expired",
    "만료",
    "세션",
    "인증",
    "unauthorized",
  ]);

  const duplicateLike = includesAny(raw, [
    "already",
    "duplicate",
    "exists",
    "중복",
    "이미 존재",
    "이미 사용",
    "아이디",
    "email",
    "loginId",
    "username",
  ]);

  const brandIdLike = includesAny(raw, [
    "brandid",
    "brand id",
    "brand_id",
    "브랜드",
    "권한",
    "forbidden",
    "소유자",
  ]);

  const payloadTooLargeLike =
    status === 413 ||
    includesAny(raw, [
      "payload",
      "too large",
      "max size",
      "size limit",
      "file too large",
      "request entity too large",
      "용량",
      "크기",
      "파일",
      "첨부",
      "413",
    ]);

  if (payloadTooLargeLike) {
    return getPayloadTooLargeMessage();
  }

  if (status === 401) {
    if (context === "login") {
      return "로그인에 실패했습니다. 아이디 또는 비밀번호를 다시 확인해주세요.";
    }
    return "로그인 세션이 만료되었거나 유효하지 않습니다. 다시 로그인 후 이용해주세요.";
  }

  if (status === 403) {
    if (context === "brand" || brandIdLike) {
      return getBrandIdMismatchMessage();
    }
    return "접근 권한이 없습니다. 권한이 있는 계정으로 다시 로그인해 주세요.";
  }

  if (status === 409 || (context === "signup" && duplicateLike)) {
    return "이미 사용 중인 아이디 또는 이메일입니다. 다른 정보로 회원가입해주세요.";
  }

  if (status === 422) {
    return "입력 형식이 올바르지 않습니다. 필수 항목과 입력 값을 다시 확인해주세요.";
  }

  if (status === 429) {
    return "요청이 일시적으로 많아 처리 대기 중입니다. 잠시 후 다시 시도해주세요.";
  }

  if (status >= 500) {
    return "서버 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
  }

  if (tokenLike && context !== "login") {
    return "로그인 세션이 만료되었거나 유효하지 않습니다. 다시 로그인 후 이용해주세요.";
  }

  if (context === "signup" && duplicateLike) {
    return "이미 사용 중인 아이디 또는 이메일입니다. 다른 정보로 회원가입해주세요.";
  }

  if (context === "login") {
    return raw || "로그인 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
  }

  if (context === "signup") {
    return (
      raw || "회원가입 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요."
    );
  }

  if (context === "brand" && brandIdLike) {
    return getBrandIdMismatchMessage();
  }

  if (context === "upload") {
    return (
      raw ||
      "업로드 처리 중 문제가 발생했습니다. 파일 형식과 크기를 확인해주세요."
    );
  }

  return raw || fallback;
}

function toSingleLine(text) {
  return normalizeText(text).replace(/\s+/g, " ").trim();
}

function truncate(text, max = 140) {
  const s = String(text || "");
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1).trim()}…`;
}

export function buildDetailedErrorMessages(error, options = {}) {
  const friendly = getServiceErrorMessage(error, options);
  const raw = toSingleLine(getErrorRawMessage(error));
  const status = getErrorStatus(error);

  const hasDistinctRaw = raw && raw !== friendly;
  const codeLabel = status ? ` (코드 ${status})` : "";

  const detailText = hasDistinctRaw ? raw : "";

  const alertMessage = detailText
    ? `${friendly}

상세 메시지${codeLabel}: ${detailText}`
    : friendly;

  const toastMessage = detailText
    ? `${friendly} · 상세${codeLabel}: ${truncate(detailText, 110)}`
    : status
      ? `${friendly} · 오류 코드: ${status}`
      : friendly;

  return {
    friendly,
    alertMessage,
    toastMessage,
    status,
    raw,
    hasDistinctRaw,
  };
}
