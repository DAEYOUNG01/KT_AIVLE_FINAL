export const CURRENT_USER_ID_KEY = "currentUserId";
export const IS_LOGGED_IN_KEY = "isLoggedIn";

// ✅ currentUserId는 userLocalStorage(계정별 분리)에 사용됩니다.
// 과거 빌드/새 탭/새로고침 등으로 currentUserId가 비어있을 수 있어,
// accessToken이 있다면 JWT payload에서 loginId/sub를 읽어 복구합니다.
export const getCurrentUserId = () => {
  try {
    const existing = localStorage.getItem(CURRENT_USER_ID_KEY);
    if (existing) return existing;

    const token =
      localStorage.getItem("accessToken") || localStorage.getItem("token");
    if (!token) return null;

    // JWT: header.payload.signature
    const parts = String(token).split(".");
    if (parts.length < 2) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      Array.prototype.map
        .call(
          atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")),
          (c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2),
        )
        .join(""),
    );
    const payload = JSON.parse(json);

    const recovered =
      (payload && typeof payload.loginId === "string" && payload.loginId) ||
      (payload && typeof payload.sub === "string" && payload.sub) ||
      (payload && payload.userId != null ? String(payload.userId) : null);

    if (recovered) {
      localStorage.setItem(CURRENT_USER_ID_KEY, String(recovered));
      return String(recovered);
    }

    return null;
  } catch {
    return null;
  }
};

export const setCurrentUserId = (userId) => {
  if (userId === undefined || userId === null || userId === "") return;
  try {
    localStorage.setItem(CURRENT_USER_ID_KEY, String(userId));
  } catch {
    return;
  }
};

export const clearCurrentUserId = () => {
  try {
    localStorage.removeItem(CURRENT_USER_ID_KEY);
  } catch {
    return;
  }
};

export const getIsLoggedIn = () => {
  try {
    if (localStorage.getItem(IS_LOGGED_IN_KEY) === "true") return true;
    // 토큰만 남아있는 케이스(새로고침/과거 빌드)도 로그인 상태로 인정
    return Boolean(
      localStorage.getItem("accessToken") || localStorage.getItem("token"),
    );
  } catch {
    return false;
  }
};

export const setIsLoggedIn = (value) => {
  try {
    localStorage.setItem(IS_LOGGED_IN_KEY, value ? "true" : "false");
  } catch {
    return;
  }
};

export const clearIsLoggedIn = () => {
  try {
    localStorage.removeItem(IS_LOGGED_IN_KEY);
  } catch {
    return;
  }
};
