// src/components/EasyLoginModal.jsx
import { useEffect, useState } from "react";
import { startGoogleEasyLogin } from "../lib/googleEasyLogin.js";
import { setAccessToken } from "../api/client.js";
import { setCurrentUserId, setIsLoggedIn } from "../api/auth.js";
import "../styles/EasyLoginModal.css";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.72 1.22 9.22 3.6l6.9-6.9C35.91 2.34 30.33 0 24 0 14.64 0 6.56 5.38 2.6 13.22l8.03 6.23C12.54 13.68 17.78 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.5 24.5c0-1.58-.14-3.09-.4-4.5H24v9h12.7c-.55 2.96-2.22 5.47-4.74 7.16l7.3 5.66c4.27-3.94 6.74-9.74 6.74-17.32z"
      />
      <path
        fill="#FBBC05"
        d="M10.63 28.55A14.5 14.5 0 019.5 24c0-1.58.28-3.1.78-4.55L2.25 13.22A24 24 0 000 24c0 3.87.93 7.53 2.57 10.78l8.06-6.23z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.33 0 11.65-2.08 15.53-5.67l-7.3-5.66c-2.03 1.36-4.64 2.16-8.23 2.16-6.22 0-11.46-4.18-13.37-9.95L2.57 34.8C6.56 42.62 14.64 48 24 48z"
      />
    </svg>
  );
}

function KakaoIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <rect x="2" y="2" width="44" height="44" rx="14" fill="#FEE500" />
      <path
        d="M24 12c-7.73 0-14 4.72-14 10.55 0 3.77 2.62 7.08 6.55 8.94l-1.25 6.22c-.1.5.46.88.9.61l7.08-4.41c.57.06 1.14.1 1.72.1 7.73 0 14-4.73 14-10.56C39 16.72 32.73 12 25 12h-1z"
        fill="#191919"
      />
    </svg>
  );
}

function NaverIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <rect x="2" y="2" width="44" height="44" rx="12" fill="#03C75A" />
      <path
        d="M15 13h8.3l9.7 14.08V13H41v22h-8.26L23 20.92V35h-8V13z"
        fill="#fff"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M32.24 25.47c.03 3.98 3.49 5.3 3.52 5.31-.03.09-.55 1.88-1.8 3.73-1.08 1.6-2.2 3.2-3.97 3.23-1.73.03-2.29-1.02-4.27-1.02s-2.6.99-4.23 1.05c-1.73.07-3.05-1.73-4.14-3.32-2.23-3.23-3.94-9.12-1.65-13.09 1.13-1.97 3.16-3.21 5.37-3.24 1.67-.03 3.25 1.12 4.27 1.12 1.01 0 2.91-1.38 4.9-1.17.83.03 3.15.34 4.64 2.52-.12.07-2.77 1.62-2.74 4.88zm-3.18-9.8c.89-1.08 1.5-2.58 1.33-4.08-1.28.05-2.83.85-3.75 1.94-.82.95-1.54 2.48-1.35 3.94 1.42.11 2.88-.72 3.77-1.8z"
      />
    </svg>
  );
}

/**
 * [EasyLoginModal] 간편로그인 모달(UI)
 * ------------------------------------------------------------
 * ✅ 프론트 단독으로 즉시 동작:
 * - Google: 실제 로그인 동작
 * - Kakao/Naver/Apple: 현재 준비중 안내
 *
 * ✅ Props
 * - open: 모달 열림 여부(boolean)
 * - onClose: 닫기 콜백
 * - onSuccess: 로그인 성공 시 콜백(선택)
 */
export default function EasyLoginModal({ open, onClose, onSuccess }) {
  const [loadingProvider, setLoadingProvider] = useState("");
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    document.addEventListener("keydown", onKeyDown);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleGoogleLogin = async () => {
    setLoadingProvider("Google");
    setStatusMsg("");

    try {
      const result = await startGoogleEasyLogin();

      if (typeof onSuccess === "function") {
        onSuccess(result);
      } else {
        // 부모에서 onSuccess를 연결하지 않은 경우에도 동작하도록 안전장치
        if (result?.accessToken) setAccessToken(result.accessToken);

        const fallbackId =
          result?.user?.email ||
          result?.user?.id ||
          result?.user?.name ||
          `google_${Date.now()}`;

        setCurrentUserId(String(fallbackId));
        setIsLoggedIn(true);

        onClose?.();
        window.location.assign("/main");
      }
    } catch (error) {
      setStatusMsg(
        error?.message || "Google 로그인 처리 중 오류가 발생했습니다.",
      );
    } finally {
      setLoadingProvider("");
    }
  };

  const handleNotReadyProvider = (provider) => {
    setStatusMsg(
      `${provider}는 현재 백엔드 연동 전 단계라 준비중입니다. 지금은 Google만 실제 로그인됩니다.`,
    );
  };

  return (
    <div
      className="easyModal__overlay"
      role="dialog"
      aria-modal="true"
      aria-label="간편 로그인"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="easyModal__panel">
        <div className="easyModal__head">
          <div>
            <h2 className="easyModal__title">간편 로그인</h2>
            <p className="easyModal__desc">
              자주 쓰는 계정으로 빠르게 로그인하세요.
            </p>
          </div>

          <button
            type="button"
            className="easyModal__close"
            aria-label="닫기"
            onClick={() => onClose?.()}
            disabled={!!loadingProvider}
          >
            ✕
          </button>
        </div>

        <div className="easyModal__providers">
          <button
            type="button"
            className="easyModal__providerBtn"
            onClick={handleGoogleLogin}
            disabled={!!loadingProvider}
          >
            <span
              className="easyModal__icon easyModal__icon--google"
              aria-hidden="true"
            >
              <GoogleIcon />
            </span>
            <span className="easyModal__text">Google로 계속하기</span>
            <span className="easyModal__right">
              {loadingProvider === "Google" ? "진행 중..." : "→"}
            </span>
          </button>

          <button
            type="button"
            className="easyModal__providerBtn"
            onClick={() => handleNotReadyProvider("Kakao")}
            disabled={!!loadingProvider}
          >
            <span
              className="easyModal__icon easyModal__icon--kakao"
              aria-hidden="true"
            >
              <KakaoIcon />
            </span>
            <span className="easyModal__text">Kakao로 계속하기</span>
            <span className="easyModal__right">준비중</span>
          </button>

          <button
            type="button"
            className="easyModal__providerBtn"
            onClick={() => handleNotReadyProvider("Naver")}
            disabled={!!loadingProvider}
          >
            <span
              className="easyModal__icon easyModal__icon--naver"
              aria-hidden="true"
            >
              <NaverIcon />
            </span>
            <span className="easyModal__text">Naver로 계속하기</span>
            <span className="easyModal__right">준비중</span>
          </button>

          <button
            type="button"
            className="easyModal__providerBtn"
            onClick={() => handleNotReadyProvider("Apple")}
            disabled={!!loadingProvider}
          >
            <span
              className="easyModal__icon easyModal__icon--apple"
              aria-hidden="true"
            >
              <AppleIcon />
            </span>
            <span className="easyModal__text">Apple로 계속하기</span>
            <span className="easyModal__right">준비중</span>
          </button>
        </div>

        <div className="easyModal__divider" />

        <div className="easyModal__bottom">
          <button
            type="button"
            className="easyModal__ghost"
            onClick={() => onClose?.()}
            disabled={!!loadingProvider}
          >
            나중에 할게요
          </button>

          {statusMsg ? <p className="easyModal__status">{statusMsg}</p> : null}

          <p className="easyModal__footnote">
            * 프론트 단독 단계: Google만 실제 로그인 동작
          </p>
        </div>
      </div>
    </div>
  );
}
