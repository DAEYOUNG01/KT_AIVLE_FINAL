// src/pages/PromotionResult.jsx
import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import SiteHeader from "../components/SiteHeader.jsx";
import SiteFooter from "../components/SiteFooter.jsx";

// ✅ 사용자별 localStorage 분리(계정마다 독립 진행)
import {
  userGetItem,
  userSetItem,
  userRemoveItem,
} from "../utils/userLocalStorage.js";
import "../styles/PromotionResult.css";
import "../styles/ConceptConsultingInterview.css";
import "../styles/ConsultingUnifiedTheme.css";

const SERVICE_MAP = {
  icon: {
    label: "제품 아이콘 컨설팅",
    resultKey: "promoInterviewResult_icon_v1",
    interviewRoute: "/promotion/icon/interview",
  },
  aicut: {
    label: "AI컷 모델 컨설팅",
    resultKey: "promoInterviewResult_aicut_v1",
    interviewRoute: "/promotion/aicut/interview",
  },
  staging: {
    label: "제품 연출컷 컨설팅",
    resultKey: "promoInterviewResult_staging_v1",
    interviewRoute: "/promotion/staging/interview",
  },
  poster: {
    label: "SNS 제품 포스터 컨설팅",
    resultKey: "promoInterviewResult_poster_v1",
    interviewRoute: "/promotion/poster/interview",
  },
};

function safeParse(raw) {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function prettyLines(text) {
  return String(text || "")
    .split(/\n/)
    .map((t) => t.trim())
    .filter(Boolean);
}

export default function PromotionResult({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const query = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );
  const service = query.get("service") || "icon";
  const meta = SERVICE_MAP[service] || SERVICE_MAP.icon;

  const data = useMemo(
    () => safeParse(userGetItem(meta.resultKey)),
    [meta.resultKey],
  );

  const selected = useMemo(() => {
    if (!data) return null;
    if (data.selected) return data.selected;
    const pickedId = data.selectedId;
    const list = Array.isArray(data.candidates) ? data.candidates : [];
    return pickedId ? list.find((c) => c.id === pickedId) : null;
  }, [data]);

  const hasResult = Boolean(selected);

  const highlightsTitle = useMemo(() => {
    if (service === "poster") return "포스터 산출물";
    if (service === "staging") return "연출컷 산출물";
    if (service === "aicut") return "AI컷 모델 산출물";
    return "아이콘 산출물";
  }, [service]);

  return (
    <div className="diagInterview consultingInterview">
      <SiteHeader onLogout={onLogout} />

      <main className="diagInterview__main">
        <div className="diagInterview__container">
          <div className="diagInterview__titleRow">
            <div>
              <h1 className="diagInterview__title">홍보물 컨설팅 결과</h1>
              <p className="diagInterview__sub">
                {meta.label} 결과입니다. 선택한 1안을 기준으로 요약과 프롬프트를
                확인하세요.
              </p>
            </div>

            <div className="diagInterview__topActions">
              <button
                type="button"
                className="btn ghost"
                onClick={() => navigate("/promotion")}
              >
                홍보물 컨설팅 홈
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => navigate(meta.interviewRoute)}
              >
                다시 인터뷰
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => navigate("/mypage?tab=promo")}
              >
                결과 히스토리
              </button>
            </div>
          </div>

          {!hasResult ? (
            <div className="card">
              <div className="card__head">
                <h2>아직 결과가 없습니다</h2>
                <p>
                  인터뷰에서 후보 3안을 만든 뒤, 1안을 선택하면 결과가
                  저장됩니다.
                </p>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => navigate(meta.interviewRoute)}
                >
                  {meta.label} 인터뷰 하러가기
                </button>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => navigate("/promotion")}
                >
                  홍보물 컨설팅 홈으로
                </button>
              </div>
            </div>
          ) : (
            <div className="diagInterview__grid">
              {/* LEFT */}
              <section className="diagInterview__left">
                <div className="card">
                  <div className="card__head">
                    <h2>선택한 안</h2>
                    <p>후보에서 선택한 1안의 핵심 요약입니다.</p>
                  </div>

                  <div className="resultCard selected" style={{ marginTop: 8 }}>
                    <div className="resultCard__head">
                      <div>
                        <p className="resultBadge">선택됨</p>
                        <h3 className="resultTitle">
                          {selected?.name || "선택안"}
                        </h3>
                      </div>
                      <div className="resultPick">
                        <span className="pickDot on" />
                        <span className="pickText">확정</span>
                      </div>
                    </div>

                    {Array.isArray(selected?.summary) &&
                    selected.summary.length ? (
                      <ul className="resultBullets">
                        {selected.summary.map((t) => (
                          <li key={t}>{t}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>

                <div className="card">
                  <div className="card__head">
                    <h2>{highlightsTitle}</h2>
                    <p>
                      아래 프롬프트/가이드를 기반으로 제작을 진행할 수 있어요.
                    </p>
                  </div>

                  <div className="resultGrid">
                    <div className="resultBlock">
                      <h4>추천 프롬프트</h4>
                      <textarea
                        readOnly
                        value={selected?.prompt || ""}
                        rows={6}
                        style={{ width: "100%" }}
                      />

                      {Array.isArray(selected?.copy) && selected.copy.length ? (
                        <div style={{ marginTop: 12 }}>
                          <h4 style={{ marginBottom: 6 }}>추천 카피</h4>
                          <ul style={{ margin: 0, paddingLeft: 18 }}>
                            {selected.copy.map((t) => (
                              <li key={t}>{t}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>

                    <div className="resultBlock">
                      <h4>가이드</h4>
                      <div className="resultMiniGrid">
                        <div>
                          <p className="miniTitle">Do</p>
                          <ul>
                            {(selected?.do || []).map((t) => (
                              <li key={t}>{t}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="miniTitle">Don&apos;t</p>
                          <ul>
                            {(selected?.dont || []).map((t) => (
                              <li key={t}>{t}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card__head">
                    <h2>입력 요약</h2>
                    <p>인터뷰에서 입력한 핵심 값만 간단히 정리합니다.</p>
                  </div>

                  <div className="formGrid">
                    <div className="field">
                      <label>브랜드</label>
                      <p>{data?.form?.brandName || "-"}</p>
                    </div>
                    <div className="field">
                      <label>제품</label>
                      <p>{data?.form?.productName || "-"}</p>
                    </div>
                    <div className="field">
                      <label>타깃</label>
                      <p>{data?.form?.targetCustomer || "-"}</p>
                    </div>
                    <div className="field">
                      <label>톤/분위기</label>
                      <p>{data?.form?.tone || "-"}</p>
                    </div>
                  </div>

                  {data?.form?.goal ? (
                    <div className="field" style={{ marginTop: 10 }}>
                      <label>목표</label>
                      <p style={{ whiteSpace: "pre-wrap" }}>{data.form.goal}</p>
                    </div>
                  ) : null}
                </div>
              </section>

              {/* RIGHT */}
              <aside className="diagInterview__right">
                <div className="sideCard">
                  <div className="sideCard__titleRow">
                    <h3>후보 3안</h3>
                    <span className="badge">
                      {(data?.candidates || []).length}개
                    </span>
                  </div>

                  <div className="divider" />

                  <div style={{ display: "grid", gap: 10 }}>
                    {(data?.candidates || []).map((c) => {
                      const isPicked =
                        c.id === (data?.selectedId || selected?.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          className={`jumpBtn ${isPicked ? "ok" : ""}`}
                          onClick={() => navigate(meta.interviewRoute)}
                          title="인터뷰 페이지에서 다른 안을 선택할 수 있어요"
                          style={{ textAlign: "left" }}
                        >
                          {isPicked ? "✅ " : ""}
                          후보 {String(c.id).toUpperCase()} · {c.name}
                        </button>
                      );
                    })}
                  </div>

                  <div className="divider" />

                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => navigate(meta.interviewRoute)}
                  >
                    다른 안 선택하기
                  </button>
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
