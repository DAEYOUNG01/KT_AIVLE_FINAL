// src/api/apiClient.js
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

function getAccessToken() {
  return (
    localStorage.getItem("accessToken") || localStorage.getItem("token") || ""
  );
}

export async function apiRequest(
  path,
  { method = "GET", body, headers = {}, auth = true } = {},
) {
  // ✅ GET 요청에 Content-Type을 강제로 넣으면 불필요한 preflight(OPTIONS) 요청이
  // 발생할 수 있어, body가 있을 때만 Content-Type을 설정합니다.
  const h = { ...headers };
  const upper = String(method || "GET").toUpperCase();
  if (
    body !== undefined &&
    body !== null &&
    upper !== "GET" &&
    upper !== "HEAD"
  ) {
    if (!h["Content-Type"] && !h["content-type"]) {
      h["Content-Type"] = "application/json";
    }
  }

  if (auth) {
    const token = getAccessToken();
    if (token) h.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: h,
    body:
      body !== undefined && body !== null ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const message =
      data?.message || data?.error || text || `HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}
