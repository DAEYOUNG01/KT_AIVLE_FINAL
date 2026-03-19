// src/components/CurrentUserWidget.jsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import "../styles/CurrentUserWidget.css";

import { apiRequest, clearAccessToken } from "../api/client.js";
import {
  getCurrentUserId,
  getIsLoggedIn,
  clearCurrentUserId,
  clearIsLoggedIn,
} from "../api/auth.js";

import { listPromoReports } from "../utils/promoReportHistory.js";
import { userSafeParse } from "../utils/userLocalStorage.js";

function toMillis(value) {
  if (value == null || value === "") return 0;

  if (value instanceof Date) {
    const t = value.getTime();
    return Number.isFinite(t) ? t : 0;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    // 초 단위 epoch로 들어오는 경우 보정
    return value < 1_000_000_000_000 ? value * 1000 : value;
  }

  if (typeof value === "string") {
    const s = value.trim();
    if (!s) return 0;

    const asNum = Number(s);
    if (Number.isFinite(asNum)) {
      return asNum < 1_000_000_000_000 ? asNum * 1000 : asNum;
    }

    const parsed = Date.parse(s);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function isBrandCompleted(record) {
  const step = String(
    record?.currentStep ??
      record?.backendStep ??
      record?._raw?.currentStep ??
      "",
  )
    .trim()
    .toUpperCase();

  if (["FINAL", "COMPLETE", "COMPLETED", "DONE", "FINISHED"].includes(step)) {
    return true;
  }

  if (
    record?.isComplete === true ||
    record?.completed === true ||
    record?.done === true
  ) {
    return true;
  }

  const pct = Number(
    record?.progressPercent ?? record?.progress?.percent ?? Number.NaN,
  );
  if (Number.isFinite(pct) && pct >= 100) return true;

  return false;
}

function readRecordTimestamp(record) {
  const candidates = [
    // 완료 시각 계열
    record?.completedAt,
    record?.completed_at,
    record?.finishedAt,
    record?.finished_at,

    // 수정 시각 계열
    record?.updatedAt,
    record?.updated_at,

    // 생성 시각 계열
    record?.createdAt,
    record?.created_at,
    record?.createdISO,
    record?.createdIso,
    record?.timestamp,

    // _raw(정규화 전 DTO) 폴백
    record?._raw?.completedAt,
    record?._raw?.completed_at,
    record?._raw?.finishedAt,
    record?._raw?.finished_at,
    record?._raw?.updatedAt,
    record?._raw?.updated_at,
    record?._raw?.createdAt,
    record?._raw?.created_at,
    record?._raw?.createdISO,
    record?._raw?.createdIso,
    record?._raw?.timestamp,
  ];

  for (const c of candidates) {
    const ms = toMillis(c);
    if (ms > 0) return ms;
  }

  return 0;
}

function latestTimestamp(records = [], { completedOnly = false } = {}) {
  const arr = Array.isArray(records) ? records : [];
  const target = completedOnly ? arr.filter(isBrandCompleted) : arr;
  if (!target.length) return 0;

  let latest = 0;
  for (const item of target) {
    const ts = readRecordTimestamp(item);
    if (ts > latest) latest = ts;
  }
  return latest;
}

export default function CurrentUserWidget() {
  const navigate = useNavigate();
  const rootRef = useRef(null);

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try {
      return getIsLoggedIn();
    } catch {
      return false;
    }
  });
  const [userId, setUserId] = useState(() => {
    try {
      return getCurrentUserId();
    } catch {
      return null;
    }
  });
  const [open, setOpen] = useState(false);
  const [stats, setStats] = useState({ brand: 0, promotion: 0 });
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [timeTick, setTimeTick] = useState(0);

  const label = useMemo(() => {
    const id = String(userId ?? "").trim();
    if (!id) return "";
    if (id.length <= 24) return id;
    return `${id.slice(0, 12)}…${id.slice(-8)}`;
  }, [userId]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeTick((v) => v + 1);
    }, 30 * 1000);

    return () => window.clearInterval(timer);
  }, []);

  const relativeUpdated = useMemo(() => {
    // 30초마다 재계산되도록 의존성 유지
    void timeTick;

    if (!lastUpdatedAt) return "기록 없음";

    const diffSec = Math.max(
      1,
      Math.floor((Date.now() - lastUpdatedAt.getTime()) / 1000),
    );

    if (diffSec < 60) return "방금 전";
    const m = Math.floor(diffSec / 60);
    if (m < 60) return `${m}분 전`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}시간 전`;
    const d = Math.floor(h / 24);
    return `${d}일 전`;
  }, [lastUpdatedAt, timeTick]);

  const readPromotionMetaFromStorage = () => {
    try {
      // 1) 사용자 분리 저장소 기준(정확)
      const promoList = listPromoReports();
      if (Array.isArray(promoList)) {
        const latestAt = latestTimestamp(promoList);
        return { count: promoList.length, latestAt };
      }

      // 2) 사용자 분리 키 직접 조회(폴백)
      const scopedKeys = [
        "promoConsultingHistory_v1",
        "promoReportHistory",
        "promotionReportHistory",
        "promotionHistory",
      ];

      for (const key of scopedKeys) {
        const parsed = userSafeParse(key);
        if (Array.isArray(parsed)) {
          return {
            count: parsed.length,
            latestAt: latestTimestamp(parsed),
          };
        }
      }

      // 3) 레거시 전역 키 폴백
      for (const key of scopedKeys) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return {
            count: parsed.length,
            latestAt: latestTimestamp(parsed),
          };
        }
      }

      return { count: 0, latestAt: 0 };
    } catch {
      return { count: 0, latestAt: 0 };
    }
  };

  const readBrandMetaFromStorage = () => {
    try {
      const raw = localStorage.getItem("myBrands");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return {
            count: parsed.length,
            // 브랜드 결과 기준이므로 완료 항목 우선
            latestAt:
              latestTimestamp(parsed, { completedOnly: true }) ||
              latestTimestamp(parsed),
          };
        }
      }

      // 구조를 알 수 없는 레거시 데이터는 개수만 약식 계산
      let brand = 0;
      for (let i = 0; i < localStorage.length; i += 1) {
        const k = String(localStorage.key(i) || "");
        const v = String(localStorage.getItem(k) || "");
        if (
          /brand/i.test(k + " " + v) &&
          /(result|history|done|completed|consulting)/i.test(k + " " + v)
        ) {
          brand += 1;
        }
      }

      return { count: brand, latestAt: 0 };
    } catch {
      return { count: 0, latestAt: 0 };
    }
  };

  const refreshCounts = useCallback(async () => {
    let brandCount = 0;
    let latestBrandAt = 0;

    try {
      // 백엔드 스펙 차이를 고려해서 순차적으로 시도
      const candidates = ["/mypage/brands", "/brands/mine", "/brands"];
      for (const url of candidates) {
        try {
          const res = await apiRequest(url, { method: "GET" });
          const arr = Array.isArray(res)
            ? res
            : Array.isArray(res?.data)
              ? res.data
              : null;
          if (arr) {
            brandCount = arr.length;

            // ✅ 요청사항 반영:
            // 최근 업데이트 = 가장 최근 "결과" 생성 시각
            // 브랜드는 완료된 결과(FINAL) 시각 우선 사용
            latestBrandAt =
              latestTimestamp(arr, { completedOnly: true }) ||
              latestTimestamp(arr);
            break;
          }
        } catch {
          // 다음 후보로 진행
        }
      }

      // API 실패/빈응답 대비 로컬 폴백
      const brandFallback = readBrandMetaFromStorage();
      if (brandCount === 0) brandCount = brandFallback.count;
      if (latestBrandAt === 0) latestBrandAt = brandFallback.latestAt;
    } catch {
      const brandFallback = readBrandMetaFromStorage();
      brandCount = brandFallback.count;
      latestBrandAt = brandFallback.latestAt;
    }

    const promoMeta = readPromotionMetaFromStorage();

    setStats({ brand: brandCount, promotion: promoMeta.count });

    const latest = Math.max(latestBrandAt, promoMeta.latestAt);
    setLastUpdatedAt(latest > 0 ? new Date(latest) : null);
  }, []);

  useEffect(() => {
    const syncIdentity = () => {
      try {
        setIsLoggedIn(getIsLoggedIn());
      } catch {
        setIsLoggedIn(false);
      }
      try {
        setUserId(getCurrentUserId());
      } catch {
        setUserId(null);
      }
    };

    syncIdentity();
    refreshCounts();

    const onStorage = () => {
      syncIdentity();
      refreshCounts();
    };
    const onUpdated = () => refreshCounts();
    const onFocus = () => refreshCounts();

    window.addEventListener("storage", onStorage);
    window.addEventListener("consulting:updated", onUpdated);
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("consulting:updated", onUpdated);
      window.removeEventListener("focus", onFocus);
    };
  }, [refreshCounts]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      const root = rootRef.current;
      if (!root) return;
      if (root.contains(e.target)) return;
      setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("touchstart", onDown, { passive: true });
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("touchstart", onDown);
    };
  }, [open]);

  const go = (path) => {
    setOpen(false);
    navigate(path);
  };

  const handleLogout = async () => {
    const ok = window.confirm("로그아웃 하시겠습니까?");
    if (!ok) return;
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    clearAccessToken();
    clearCurrentUserId();
    clearIsLoggedIn();
    setOpen(false);
    navigate("/login", { replace: true });
  };

  if (!isLoggedIn || !userId) return null;

  return (
    <div
      ref={rootRef}
      className={`current-user-widget ${open ? "is-open" : ""}`}
      aria-label="현재 로그인 계정"
    >
      <button
        type="button"
        className="current-user-pill"
        onClick={() => {
          setOpen((v) => !v);
          refreshCounts();
        }}
        title="현재 로그인 계정"
        aria-expanded={open}
      >
        <span className="current-user-dot" aria-hidden="true" />
        <span className="current-user-text">
          <span className="current-user-id">{label}</span>
          <span className="current-user-meta">
            최근 업데이트: {relativeUpdated}
          </span>
        </span>
        <span className="current-user-chev" aria-hidden="true">
          {open ? "▴" : "▾"}
        </span>
      </button>

      <div className="current-user-panel" role="menu" aria-hidden={!open}>
        <section className="current-user-stats">
          <h4>BRANDPILOT</h4>
        </section>

        <button
          type="button"
          className="current-user-menu-item"
          onClick={() => go("/mypage")}
        >
          마이페이지
        </button>
        <button
          type="button"
          className="current-user-menu-item"
          onClick={() => go("/brandconsulting")}
        >
          브랜드 컨설팅 시작하기
        </button>
        <button
          type="button"
          className="current-user-menu-item"
          onClick={() => go("/promotion")}
        >
          홍보물 컨설팅 시작하기
        </button>
        <button
          type="button"
          className="current-user-menu-item danger"
          onClick={handleLogout}
        >
          로그아웃
        </button>
      </div>
    </div>
  );
}
