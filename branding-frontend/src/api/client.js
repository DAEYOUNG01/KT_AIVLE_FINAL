import axios from "axios";

// ✅ 기본값: 로컬 백엔드(환경변수 없을 때)
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "/api"
).replace(/\/+$/, "");

// ✅ 표준 토큰 키
const TOKEN_KEY = "accessToken";
// ✅ 레거시/실험 버전 호환: 여러 키에 저장된 토큰도 인식
const TOKEN_KEYS_FALLBACK = [
  TOKEN_KEY,
  "token",
  "jwt",
  "jwtToken",
  "access_token",
];

/** localStorage에서 토큰을 찾고(여러 키), 발견하면 accessToken으로 마이그레이션 */
export const getAccessToken = () => {
  try {
    for (const k of TOKEN_KEYS_FALLBACK) {
      const raw = localStorage.getItem(k);
      if (!raw) continue;

      // 혹시 "Bearer xxx" 형태로 저장돼 있으면 prefix 제거
      const token =
        typeof raw === "string" && raw.startsWith("Bearer ")
          ? raw.slice(7)
          : raw;

      // ✅ 발견 즉시 표준 키로 마이그레이션
      if (k !== TOKEN_KEY) {
        try {
          localStorage.setItem(TOKEN_KEY, token);
        } catch {
          // ignore
        }
      }
      return token;
    }
    return null;
  } catch {
    return null;
  }
};

export const setAccessToken = (token) => {
  if (!token) return;
  try {
    const t =
      typeof token === "string" && token.startsWith("Bearer ")
        ? token.slice(7)
        : token;

    localStorage.setItem(TOKEN_KEY, t);

    // (선택) 레거시 키도 함께 유지(과거 코드 호환)
    localStorage.setItem("token", t);
  } catch {
    return;
  }
};

export const clearAccessToken = () => {
  try {
    for (const k of TOKEN_KEYS_FALLBACK) localStorage.removeItem(k);
  } catch {
    return;
  }
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL || undefined,
  timeout: 15000,
  // ⚠️ 여기서 Content-Type을 고정하지 말고(GET 포함),
  // 요청 인터셉터에서 필요한 경우만 세팅하는 게 안전합니다.
  headers: {},
});

// ✅ 요청에 토큰 자동 첨부 + FormData(multipart) 헤더 자동 처리
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();

  const nextHeaders = { ...(config.headers || {}) };
  const method = String(config?.method || "GET").toUpperCase();

  // ✅ GET/HEAD + body 없는 요청은 Content-Type 제거
  if ((method === "GET" || method === "HEAD") && config?.data == null) {
    delete nextHeaders["Content-Type"];
    delete nextHeaders["content-type"];
  }

  const isFormData =
    typeof FormData !== "undefined" && config?.data instanceof FormData;

  if (isFormData) {
    // boundary 포함해서 브라우저/axios가 자동 설정하도록 제거
    delete nextHeaders["Content-Type"];
    delete nextHeaders["content-type"];
  } else {
    // ✅ JSON body가 있고 Content-Type이 없다면 자동 세팅
    if (
      config?.data != null &&
      method !== "GET" &&
      method !== "HEAD" &&
      !nextHeaders["Content-Type"] &&
      !nextHeaders["content-type"]
    ) {
      nextHeaders["Content-Type"] = "application/json";
    }
  }

  // ✅ 토큰 자동 첨부(이미 붙어있으면 유지)
  if (token && !nextHeaders.Authorization && !nextHeaders.authorization) {
    nextHeaders.Authorization = `Bearer ${token}`;
  }

  config.headers = nextHeaders;
  return config;
});

// ✅ 응답에서 토큰 갱신 + 에러 메시지 통일
apiClient.interceptors.response.use(
  (response) => {
    const authHeader =
      response?.headers?.authorization ||
      response?.headers?.Authorization ||
      response?.headers?.["access-token"] ||
      response?.headers?.["x-access-token"];

    if (authHeader) {
      const raw = Array.isArray(authHeader) ? authHeader[0] : authHeader;
      const token =
        typeof raw === "string" && raw.startsWith("Bearer ")
          ? raw.slice(7)
          : raw;
      if (token) setAccessToken(token);
    }

    return response;
  },
  (error) => {
    const msg =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "요청 실패";
    error.userMessage = msg;
    return Promise.reject(error);
  },
);

export const apiRequest = async (path, options = {}) => {
  const response = await apiClient.request({
    url: path,
    ...options,
  });
  return response.data;
};

// ✅ AI 생성/요약 요청은 시간이 오래 걸릴 수 있어요.
export const AI_TIMEOUT_MS = 1800000; // 30분으로 수정

export const apiRequestAI = async (path, options = {}) => {
  const timeout = options?.timeout ?? AI_TIMEOUT_MS;
  return apiRequest(path, { ...options, timeout });
};
