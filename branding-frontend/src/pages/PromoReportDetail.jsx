// src/pages/PromoReportDetail.jsx
import React, { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import SiteHeader from "../components/SiteHeader.jsx";
import SiteFooter from "../components/SiteFooter.jsx";

import { getPromoReport } from "../utils/promoReportHistory.js";
import "../styles/ConceptConsultingInterview.css";
import "../styles/ConsultingUnifiedTheme.css";

function fmt(ts) {
  if (!ts) return "-";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

function bulletize(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  const s = String(value);
  return s
    .split(/\n/)
    .map((t) => t.trim())
    .filter(Boolean);
}

export default function PromoReportDetail({ onLogout }) {
  const navigate = useNavigate();
  const { id } = useParams();

  const location = useLocation();

  const report = useMemo(() => {
    const st = location?.state || {};
    return st?.report || getPromoReport(id);
  }, [id]);
  const snap = report?.snapshot || {};
  const selected = snap?.selected || null;
  const form = snap?.form || null;

  if (!report) {
    return (
      <div className="diagInterview consultingInterview">
        <SiteHeader onLogout={onLogout} />
        <main className="diagInterview__main">
          <div className="diagInterview__container">
            <div className="card">
              <div className="card__head">
                <h2>리포트를 찾을 수 없습니다</h2>
                <p>마이페이지에서 다시 선택해 주세요.</p>
              </div>
              <button
                type="button"
                className="btn primary"
                onClick={() => navigate("/mypage")}
              >
                마이페이지로
              </button>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="diagInterview consultingInterview">
      <SiteHeader onLogout={onLogout} />

      <main className="diagInterview__main">
        <div className="diagInterview__container">
          <div className="diagInterview__titleRow">
            <div>
              <h1 className="diagInterview__title">홍보물 컨설팅 리포트</h1>
              <p className="diagInterview__sub">
                저장된 리포트 스냅샷입니다. (프론트 임시 저장)
              </p>
            </div>

            <div className="diagInterview__topActions">
              <button
                type="button"
                className="btn"
                onClick={() => navigate("/mypage")}
              >
                마이페이지
              </button>
              <button
                type="button"
                className="btn ghost"
                onClick={() => navigate("/promotion")}
              >
                홍보물 컨설팅 홈
              </button>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 14 }}>
            <div className="card__head">
              <h2>{report.title}</h2>
              {report.subtitle ? <p>{report.subtitle}</p> : null}
              <p style={{ margin: "6px 0 0", color: "#6b7280", fontSize: 13 }}>
                생성일: {fmt(report.createdAt)}
              </p>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 14 }}>
            <div className="card__head">
              <h2>선택한 안</h2>
              <p>{report.serviceLabel || report.serviceKey}</p>
            </div>
            <div className="resultCard selected" style={{ marginTop: 8 }}>
              <div className="resultCard__head">
                <div>
                  <p className="resultBadge">선택됨</p>
                  <h3 className="resultTitle">{selected?.name || "선택안"}</h3>
                </div>
              </div>
              {bulletize(selected?.summary).length ? (
                <ul className="resultBullets">
                  {bulletize(selected?.summary).map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>

          {selected?.prompt ? (
            <div className="card" style={{ marginBottom: 14 }}>
              <div className="card__head">
                <h2>추천 프롬프트</h2>
              </div>
              <textarea
                readOnly
                value={selected.prompt}
                rows={8}
                style={{ width: "100%" }}
              />
            </div>
          ) : null}

          <details className="card" style={{ marginBottom: 18 }}>
            <summary style={{ cursor: "pointer", fontWeight: 800 }}>
              원본 데이터 보기
            </summary>
            <pre style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>
              {JSON.stringify({ form, selected }, null, 2)}
            </pre>
          </details>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
