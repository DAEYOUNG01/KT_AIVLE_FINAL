// src/pages/PromotionAllResults.jsx
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import SiteHeader from "../components/SiteHeader.jsx";
import SiteFooter from "../components/SiteFooter.jsx";

// ✅ 사용자별 localStorage 분리(계정마다 독립 진행)
import { userGetItem, userSetItem, userRemoveItem } from "../utils/userLocalStorage.js";
import "../styles/PromotionAllResults.css";

function safeParse(raw) {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function fmtDate(updatedAt) {
  if (!updatedAt) return "-";
  const d = new Date(updatedAt);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

const SERVICES = [
  {
    key: "icon",
    title: "제품 아이콘 컨설팅",
    desc: "아이콘 콘셉트 3안 + 이미지 프롬프트",
    resultKey: "promoInterviewResult_icon_v1",
    draftKey: "promoInterviewDraft_icon_v1",
    interviewRoute: "/promotion/icon/interview",
    resultRoute: "/promotion/result?service=icon",
  },
  {
    key: "aicut",
    title: "AI컷 모델 컨설팅",
    desc: "모델 컷 콘셉트 3안 + 촬영/프롬프트 가이드",
    resultKey: "promoInterviewResult_aicut_v1",
    draftKey: "promoInterviewDraft_aicut_v1",
    interviewRoute: "/promotion/aicut/interview",
    resultRoute: "/promotion/result?service=aicut",
  },
  {
    key: "staging",
    title: "제품 연출컷 컨설팅",
    desc: "연출 장면 3안 + 소품/구도/프롬프트",
    resultKey: "promoInterviewResult_staging_v1",
    draftKey: "promoInterviewDraft_staging_v1",
    interviewRoute: "/promotion/staging/interview",
    resultRoute: "/promotion/result?service=staging",
  },
  {
    key: "poster",
    title: "SNS 제품 포스터 컨설팅",
    desc: "카피/레이아웃 3안 + 포스터 프롬프트",
    resultKey: "promoInterviewResult_poster_v1",
    draftKey: "promoInterviewDraft_poster_v1",
    interviewRoute: "/promotion/poster/interview",
    resultRoute: "/promotion/result?service=poster",
  },
];

export default function PromotionAllResults({ onLogout }) {
  const navigate = useNavigate();

  const cards = useMemo(() => {
    return SERVICES.map((s) => {
      const result = safeParse(userGetItem(s.resultKey));
      const draft = safeParse(userGetItem(s.draftKey));

      const selectedId = result?.selectedId || result?.selected?.id;
      const selected =
        result?.selected ||
        (Array.isArray(result?.candidates)
          ? result.candidates.find((c) => c.id === selectedId)
          : null);

      const isDone = Boolean(selectedId);
      const inProgress = !isDone && Boolean(draft?.form);
      const updatedAt = result?.updatedAt || draft?.updatedAt;

      return {
        ...s,
        isDone,
        inProgress,
        updatedLabel: fmtDate(updatedAt),
        selectedTitle: selected?.name || "",
      };
    });
  }, []);

  const doneCount = useMemo(
    () => cards.filter((c) => c.isDone).length,
    [cards],
  );

  const progress = useMemo(() => {
    if (!cards.length) return 0;
    return Math.round((doneCount / cards.length) * 100);
  }, [doneCount, cards.length]);

  return (
    <div className="promoAll-page">
      <SiteHeader onLogout={onLogout} />

      <main className="promoAll-main">
        <div className="promoAll-container">
          <div className="promoAll-titleRow">
            <div>
              <h1 className="promoAll-title">홍보물 컨설팅 결과 모아보기</h1>
              <p className="promoAll-sub">
                4개의 홍보물 컨설팅 결과를 한 곳에서 확인할 수 있어요.
              </p>
            </div>

            <div className="promoAll-actions">
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
                onClick={() => navigate("/mypage")}
              >
                마이페이지
              </button>
            </div>
          </div>

          <div className="promoAll-grid">
            {/* Left: 서비스 카드 리스트 */}
            <section className="promoAll-left">
              {cards.map((c) => (
                <article
                  key={c.key}
                  id={`svc-${c.key}`}
                  className="card promoAll-card"
                >
                  <div className="card__head promoAll-cardHead">
                    <div>
                      <h2 className="promoAll-cardTitle">{c.title}</h2>
                      <p className="promoAll-cardDesc">{c.desc}</p>
                    </div>

                    {c.isDone ? (
                      <span className="status-pill success">완료</span>
                    ) : c.inProgress ? (
                      <span className="status-pill progress">진행중</span>
                    ) : (
                      <span className="status-pill ghost">미시작</span>
                    )}
                  </div>

                  <div className="promoAll-meta">
                    <div className="promoAll-metaRow">
                      <span className="k">마지막 저장</span>
                      <span className="v">{c.updatedLabel}</span>
                    </div>

                    {c.isDone && c.selectedTitle ? (
                      <div className="promoAll-metaRow">
                        <span className="k">선택한 안</span>
                        <span className="v">{c.selectedTitle}</span>
                      </div>
                    ) : null}
                  </div>

                  <div className="promoAll-cardActions">
                    {c.isDone ? (
                      <>
                        <button
                          type="button"
                          className="btn primary"
                          onClick={() => navigate(c.resultRoute)}
                        >
                          결과 보기
                        </button>
                        <button
                          type="button"
                          className="btn ghost"
                          onClick={() => navigate(c.interviewRoute)}
                        >
                          다시 인터뷰
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="btn primary"
                        onClick={() => navigate(c.interviewRoute)}
                      >
                        {c.inProgress ? "인터뷰 진행하기" : "인터뷰 시작"}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </section>

            {/* Right: 사이드 요약 */}
            <aside className="promoAll-right">
              <div className="sideCard">
                <div className="sideCard__titleRow">
                  <h3>진행 현황</h3>
                  <span className="badge">{progress}%</span>
                </div>

                <div
                  className="progressBar"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress}
                >
                  <div
                    className="progressBar__fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="sideMeta">
                  <div className="sideMeta__row">
                    <span className="k">완료</span>
                    <span className="v">
                      {doneCount}/{cards.length}
                    </span>
                  </div>
                </div>

                <div className="divider" />

                <h4 className="sideSubTitle">빠른 이동</h4>
                <div className="jumpGrid">
                  {cards.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      className="jumpBtn"
                      onClick={() => {
                        const el = document.getElementById(`svc-${c.key}`);
                        if (el)
                          el.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                      }}
                    >
                      {c.title}
                    </button>
                  ))}
                </div>

                <div className="divider" />

                <button
                  type="button"
                  className="btn primary w100"
                  onClick={() => navigate("/promotion")}
                >
                  홍보물 컨설팅 홈으로
                </button>

                <p className="hint">
                  * 이 페이지는 localStorage에 저장된 결과/임시저장 값을
                  기준으로 “완료/진행중/미시작”을 표시합니다.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
