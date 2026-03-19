// src/lib/googleEasyLogin.js
const GSI_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

let gsiLoadPromise = null;

function loadGsiScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("브라우저 환경에서만 사용할 수 있습니다."));
  }

  if (window.google?.accounts?.oauth2) {
    return Promise.resolve();
  }

  if (gsiLoadPromise) return gsiLoadPromise;

  gsiLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GSI_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () =>
          reject(new Error("Google 로그인 스크립트를 불러오지 못했습니다.")),
        { once: true },
      );

      if (window.google?.accounts?.oauth2) resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = GSI_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      reject(new Error("Google 로그인 스크립트를 불러오지 못했습니다."));
    };

    document.head.appendChild(script);
  });

  return gsiLoadPromise;
}

async function fetchGoogleProfile(accessToken) {
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error("Google 사용자 정보를 가져오지 못했습니다.");
  }

  const profile = await res.json();

  return {
    id: profile?.sub || "",
    email: profile?.email || "",
    name: profile?.name || "",
    photo: profile?.picture || "",
  };
}

/**
 * ✅ 프론트 단독 Google 간편로그인
 * - Google Identity Services 토큰 팝업
 * - accessToken + 사용자 프로필 반환
 */
export async function startGoogleEasyLogin() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!clientId) {
    throw new Error(
      "VITE_GOOGLE_CLIENT_ID가 설정되지 않았습니다. .env에 Google Client ID를 추가해주세요.",
    );
  }

  await loadGsiScript();

  const googleApi = window.google?.accounts?.oauth2;
  if (!googleApi?.initTokenClient) {
    throw new Error("Google 로그인 API를 초기화하지 못했습니다.");
  }

  const tokenResponse = await new Promise((resolve, reject) => {
    const tokenClient = googleApi.initTokenClient({
      client_id: clientId,
      scope: "openid email profile",
      prompt: "select_account",
      callback: (resp) => {
        if (!resp || resp.error) {
          reject(
            new Error(
              resp?.error_description ||
                resp?.error ||
                "Google 로그인에 실패했습니다.",
            ),
          );
          return;
        }
        resolve(resp);
      },
      error_callback: () => {
        reject(
          new Error(
            "Google 로그인 팝업이 차단되었거나 취소되었습니다. 팝업 허용 후 다시 시도해주세요.",
          ),
        );
      },
    });

    tokenClient.requestAccessToken({ prompt: "select_account" });
  });

  const accessToken = tokenResponse?.access_token;
  if (!accessToken) {
    throw new Error("Google 액세스 토큰을 받지 못했습니다.");
  }

  const user = await fetchGoogleProfile(accessToken);

  return {
    provider: "Google",
    accessToken,
    user,
  };
}
