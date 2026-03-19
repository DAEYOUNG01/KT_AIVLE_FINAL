// src/components/PolicyModal.jsx
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "../styles/PolicyModal.css";

export default function PolicyModal({ open, title, onClose, children }) {
  const prevOverflow = useRef("");
  const prevPaddingRight = useRef("");

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKeyDown);

    // ✅ 스크롤 잠금 + 레이아웃 밀림(스크롤바 폭 변화) 방지
    const body = document.body;
    prevOverflow.current = body.style.overflow;
    prevPaddingRight.current = body.style.paddingRight;

    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      body.style.overflow = prevOverflow.current;
      body.style.paddingRight = prevPaddingRight.current;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="policyModal" role="dialog" aria-modal="true">
      <button
        type="button"
        className="policyModal__backdrop"
        aria-label="닫기"
        onClick={onClose}
      />

      <div className="policyModal__panel" role="document">
        <div className="policyModal__head">
          <h2 className="policyModal__title">{title}</h2>
          <button
            type="button"
            className="policyModal__close"
            onClick={onClose}
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <div className="policyModal__body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
