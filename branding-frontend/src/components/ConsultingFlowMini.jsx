import React, { useEffect, useRef, useState } from "react";
import "../styles/ConsultingFlowMini.css";

/**
 * ✅ 사이드 카드용 경고 알림 컴포넌트
 * - 상단 단계 카드(ConsultingFlowPanel)에서 "이전 단계 미완료"로 이동이 막힐 때
 *   window CustomEvent("consultingFlow:guard")를 받아 경고 메시지만 보여줍니다.
 * - 사이드 카드에 단계 아이콘/미니 스텝/이전·다음 버튼은 노출하지 않습니다.
 */
export default function ConsultingFlowMini() {
  const [guardMsg, setGuardMsg] = useState("");
  const guardRef = useRef(null);

  useEffect(() => {
    const onGuard = (e) => {
      const msg = e?.detail?.message;
      if (!msg) return;
      setGuardMsg(msg);

      // 사이드 카드 영역에서 바로 보이게 스크롤(상황에 따라 자연스럽게)
      requestAnimationFrame(() => {
        guardRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      });
    };

    window.addEventListener("consultingFlow:guard", onGuard);
    return () => window.removeEventListener("consultingFlow:guard", onGuard);
  }, []);

  // 자동 사라짐(선호에 따라 시간 조정 가능)
  useEffect(() => {
    if (!guardMsg) return;
    const t = setTimeout(() => setGuardMsg(""), 4500);
    return () => clearTimeout(t);
  }, [guardMsg]);

  if (!guardMsg) return null;

  return (
    <div
      ref={guardRef}
      className="flowMiniGuard"
      role="alert"
      aria-live="polite"
    >
      <div className="flowMiniGuard__title">
        <span className="flowMiniGuard__dot" />
        이전 단계가 완료되지 않았어요
      </div>
      <div className="flowMiniGuard__text">{guardMsg}</div>
    </div>
  );
}
