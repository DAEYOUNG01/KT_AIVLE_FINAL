// src/components/PromotionServicePanel.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

// ✅ 사용자별 localStorage 분리(계정마다 독립 진행)
import { userGetItem } from "../utils/userLocalStorage.js";
import { notifyPromoInterviewComingSoon } from "../utils/promoComingSoon.js";

/**
 * ✅ 홍보물 컨설팅 서비스 단계 패널
 * - 브랜드 컨설팅 단계 카드와 동일한 시각 톤으로 표시
 * - 홍보물은 단계 잠금 없이 각 서비스로 자유 이동
 * - 완료 표시는 각 서비스의 결과 localStorage 기준
 */

const SERVICES = [
  {
    key: "icon",
    label: "제품 아이콘",
    desc: "아이콘 가이드",
    icon: "🔹",
    path: "/promotion/icon/interview",
    legacyKey: "promo_icon_v1",
  },
  {
    key: "staging",
    label: "제품 연출컷",
    desc: "연출/무드",
    icon: "📸",
    path: "/promotion/staging/interview",
    legacyKey: "promo_staging_v1",
  },
  {
    key: "aicut",
    label: "AI 컷 모델",
    desc: "모델 이미지",
    icon: "👤",
    path: "/promotion/aicut/interview",
    legacyKey: "promo_aicut_v1",
  },
  {
    key: "poster",
    label: "SNS 포스터",
    desc: "카피/레이아웃",
    icon: "📰",
    path: "/promotion/poster/interview",
    legacyKey: "promo_poster_v1",
  },
];

function safeParse(raw) {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function isDone(legacyKey) {
  const parsed = safeParse(userGetItem(legacyKey));
  if (!parsed) return false;
  return Boolean(parsed?.selected || parsed?.selectedId);
}

export default function PromotionServicePanel({ activeKey = "icon" }) {
  const navigate = useNavigate();
  const [doneMap, setDoneMap] = useState(() => {
    const initial = {};
    SERVICES.forEach((s) => {
      initial[s.key] = false;
    });
    return initial;
  });

  const doneCount = useMemo(
    () => Object.values(doneMap).filter(Boolean).length,
    [doneMap],
  );

  useEffect(() => {
    try {
      const next = {};
      SERVICES.forEach((s) => {
        next[s.key] = isDone(s.legacyKey);
      });
      setDoneMap(next);
    } catch {
      // ignore
    }
  }, [activeKey]);

  const handleClick = (svc) => {
    if (!svc?.path) return;
    if (svc.key === activeKey) return;
    notifyPromoInterviewComingSoon();
  };

  return (
    <section
      className="flowPanel flowPanel--promo"
      aria-label="홍보물 컨설팅 진행 단계"
    >
      <div className="flowPanel__head">
        <div className="flowPanel__title">홍보물 컨설팅 진행 단계</div>
        <div className="flowPanel__hint">
          완료 {doneCount}/{SERVICES.length} · 각 서비스는 독립적으로
          진행됩니다.
        </div>
      </div>

      <div className="flowPanel__steps">
        {SERVICES.map((s) => {
          const active = s.key === activeKey;
          const done = Boolean(doneMap[s.key]);

          return (
            <button
              key={s.key}
              type="button"
              className={[
                "flowStep",
                active ? "isActive" : "",
                done ? "isDone" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => handleClick(s)}
              aria-current={active ? "page" : undefined}
            >
              <div className="flowStep__text">
                <div className="flowStep__label">
                  <span className="flowStep__icon" aria-hidden="true">
                    {s.icon}
                  </span>
                  <span>{s.label}</span>
                </div>
                <div className="flowStep__desc">{s.desc}</div>
              </div>

              <div className="flowStep__status">
                {active ? "진행중" : done ? "완료" : "대기"}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flowPanel__actions">
        <button
          type="button"
          className="btn ghost flowPanel__homeBtn"
          onClick={() => navigate("/promotion")}
        >
          홍보물 홈
        </button>
      </div>
    </section>
  );
}
