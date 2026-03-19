// src/pages/BrandReportDetail.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import SiteHeader from "../components/SiteHeader.jsx";
import SiteFooter from "../components/SiteFooter.jsx";

import { fetchMyBrands, mapBrandDtoToReport } from "../api/mypage.js";
import { userSafeParse } from "../utils/userLocalStorage.js";

import { clearAccessToken } from "../api/client.js";
import { clearCurrentUserId, clearIsLoggedIn } from "../api/auth.js";
import "../styles/ConceptConsultingInterview.css";
import "../styles/ConsultingUnifiedTheme.css";

const SELECTED_LOGO_MAP_KEY = "selectedLogoUrlByBrand_v1";

function fmt(ts) {
  if (!ts) return "-";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

function isObj(v) {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function pickFirstString(...vals) {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function mergeObjects(...objs) {
  return objs.reduce((acc, cur) => {
    if (isObj(cur)) return { ...acc, ...cur };
    return acc;
  }, {});
}

function uniq(items = []) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const t = String(item || "").trim();
    if (!t) continue;
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

function bulletize(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return uniq(
      value.flatMap((v) =>
        String(v || "")
          .split(/\n|•|·|;|\/{2,}/g)
          .map((t) => t.trim()),
      ),
    );
  }
  const s = String(value);
  return uniq(
    s
      .split(/\n|•|·|;|\/{2,}/g)
      .map((t) => t.trim())
      .filter(Boolean),
  );
}

function toBullets(...values) {
  return uniq(values.flatMap((v) => bulletize(v)));
}

function buildDiagnosis(report) {
  const snapDiag = isObj(report?.snapshot?.diagnosisSummary)
    ? report.snapshot.diagnosisSummary
    : {};
  const rawSnapDiag = isObj(report?._raw?.snapshot?.diagnosisSummary)
    ? report._raw.snapshot.diagnosisSummary
    : {};
  const rawDiag = isObj(report?._raw?.diagnosisSummary)
    ? report._raw.diagnosisSummary
    : isObj(report?._raw?.diagnosis)
      ? report._raw.diagnosis
      : {};

  const merged = mergeObjects(rawDiag, rawSnapDiag, snapDiag);

  return {
    companyName: pickFirstString(
      merged.companyName,
      merged.brandName,
      merged.projectName,
      report?._raw?.companyName,
      report?._raw?.brandName,
      report?._raw?.projectName,
    ),
    oneLine: pickFirstString(
      merged.oneLine,
      merged.tagline,
      merged.shortText,
      report?.snapshot?.diagnosisSummary?.oneLine,
      report?.snapshot?.diagnosisSummary?.shortText,
    ),
    shortText: pickFirstString(
      merged.shortText,
      merged.summary,
      merged.overview,
      merged.oneLine,
      merged.tagline,
    ),
    industry: pickFirstString(merged.industry, report?._raw?.industry),
    targetCustomer: pickFirstString(
      merged.targetCustomer,
      merged.targetPersona,
      merged.persona,
      report?._raw?.targetCustomer,
      report?._raw?.targetPersona,
    ),
    customerProblem: pickFirstString(
      merged.customerProblem,
      merged.problem,
      merged.painPoint,
    ),
    usp: pickFirstString(merged.usp, merged.differentiator),
    stage: pickFirstString(merged.stage, report?._raw?.stage),
    website: pickFirstString(
      merged.website,
      merged.homepage,
      report?._raw?.website,
      report?._raw?.homepage,
    ),
    visionHeadline: pickFirstString(
      merged.visionHeadline,
      merged.goal12m,
      merged.goal,
    ),
  };
}

function buildSelection(report, key) {
  const fromSnapshot = report?.snapshot?.selections?.[key];
  const fromRawSnapshot = report?._raw?.snapshot?.selections?.[key];
  const fromRawSelections = report?._raw?.selections?.[key];
  const fromSnapshotRoot = report?.snapshot?.[key];
  const fromRawSnapshotRoot = report?._raw?.snapshot?.[key];
  const fromRawRoot = report?._raw?.[key];

  const merged = mergeObjects(
    fromRawRoot,
    fromRawSnapshotRoot,
    fromRawSelections,
    fromRawSnapshot,
    fromSnapshotRoot,
    fromSnapshot,
  );

  if (key === "naming") {
    return {
      ...merged,
      name: pickFirstString(
        merged.name,
        merged.title,
        merged.wordmark,
        report?.title,
      ),
      summary: pickFirstString(
        merged.summary,
        merged.reason,
        merged.rationale,
        merged.description,
      ),
    };
  }

  if (key === "concept") {
    return {
      ...merged,
      name: pickFirstString(merged.name, merged.title, merged.conceptName),
      summary: pickFirstString(
        merged.summary,
        merged.description,
        merged.overview,
        merged.reason,
      ),
      content: pickFirstString(
        merged.content,
        merged.text,
        merged.copy,
        report?._raw?.concept,
        report?._raw?.conceptText,
        report?._raw?.conceptSummary,
      ),
      keywords: Array.isArray(merged.keywords)
        ? merged.keywords
        : Array.isArray(merged.tags)
          ? merged.tags
          : [],
    };
  }

  if (key === "story") {
    return {
      ...merged,
      name: pickFirstString(merged.name, merged.title, merged.storyTitle),
      summary: pickFirstString(
        merged.summary,
        merged.description,
        merged.overview,
        merged.reason,
      ),
      story: pickFirstString(
        merged.story,
        merged.content,
        merged.text,
        report?._raw?.story,
        report?._raw?.storyText,
        report?._raw?.storySummary,
      ),
      keywords: Array.isArray(merged.keywords)
        ? merged.keywords
        : Array.isArray(merged.tags)
          ? merged.tags
          : [],
    };
  }

  if (key === "logo") {
    return {
      ...merged,
      name: pickFirstString(merged.name, merged.title),
      imageUrl: pickFirstString(
        merged.imageUrl,
        merged.url,
        merged.logoUrl,
        merged.logoImageUrl,
        merged.selectedLogoUrl,
        merged.selectedByUser,
        report?.logoUrl,
        report?._raw?.logoUrl,
        report?._raw?.logoImageUrl,
        report?._raw?.selectedByUser,
        report?._raw?.selectedLogoUrl,
      ),
      summary: pickFirstString(
        merged.summary,
        merged.reason,
        merged.description,
        merged.overview,
      ),
    };
  }

  return merged;
}

function sectionToneStyle(tone) {
  switch (tone) {
    case "diagnosis":
      return {
        border: "rgba(37, 99, 235, 0.26)",
        soft: "rgba(37, 99, 235, 0.05)",
        badge: "#1d4ed8",
      };
    case "naming":
      return {
        border: "rgba(99, 102, 241, 0.24)",
        soft: "rgba(99, 102, 241, 0.05)",
        badge: "#4f46e5",
      };
    case "concept":
      return {
        border: "rgba(124, 58, 237, 0.24)",
        soft: "rgba(124, 58, 237, 0.05)",
        badge: "#7c3aed",
      };
    case "story":
      return {
        border: "rgba(219, 39, 119, 0.24)",
        soft: "rgba(219, 39, 119, 0.05)",
        badge: "#be185d",
      };
    case "logo":
      return {
        border: "rgba(13, 148, 136, 0.26)",
        soft: "rgba(13, 148, 136, 0.05)",
        badge: "#0f766e",
      };
    default:
      return {
        border: "rgba(15, 23, 42, 0.14)",
        soft: "rgba(15, 23, 42, 0.03)",
        badge: "#334155",
      };
  }
}

function DetailSection({
  id,
  title,
  name,
  bullets,
  extra,
  tone = "default",
  done = false,
  hideEmptyMessage = false,
  nameStyle = null,
}) {
  const hasBullets = Array.isArray(bullets) && bullets.length > 0;
  const hasExtra = Boolean(extra);
  const toneStyle = sectionToneStyle(tone);

  return (
    <article
      id={id}
      className="card questionCard"
      style={{
        marginBottom: 14,
        borderColor: toneStyle.border,
        background: `linear-gradient(180deg, ${toneStyle.soft} 0%, #ffffff 28%)`,
      }}
    >
      <div
        className="card__head"
        style={{ marginBottom: hasBullets || hasExtra ? 10 : 0 }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>{title}</h2>
            {name ? (
              <p
                style={{
                  margin: "7px 0 0",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#0f172a",
                  ...(nameStyle || {}),
                }}
              >
                {name}
              </p>
            ) : null}
          </div>

          <span
            style={{
              border: `1px solid ${toneStyle.border}`,
              background: done ? toneStyle.soft : "#ffffff",
              color: done ? toneStyle.badge : "#64748b",
              borderRadius: 999,
              padding: "4px 10px",
              fontSize: 11,
              fontWeight: 800,
              whiteSpace: "nowrap",
            }}
          >
            {done ? "결과 저장됨" : "내용 없음"}
          </span>
        </div>
      </div>

      {hasBullets ? (
        <ul
          style={{
            margin: 0,
            paddingLeft: 18,
            display: "grid",
            gap: 7,
            color: "#334155",
            fontSize: 13,
            lineHeight: 1.68,
          }}
        >
          {bullets.map((t, i) => (
            <li key={`${title}-${i}`}>{t}</li>
          ))}
        </ul>
      ) : (
        !hasExtra &&
        !hideEmptyMessage && (
          <p style={{ margin: "2px 0 0", color: "#64748b", fontSize: 13 }}>
            저장된 상세 내용이 없습니다.
          </p>
        )
      )}

      {extra ? <div style={{ marginTop: 10 }}>{extra}</div> : null}
    </article>
  );
}

export default function BrandReportDetail({ onLogout }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  const [report, setReport] = useState(() => {
    const st = location?.state || {};
    return st?.report || null;
  });
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  // ✅ 페이지 진입/리포트 변경 시 항상 최상단으로 이동
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [id]);

  // ✅ 401/403 등 인증 이슈가 발생하면 즉시 로그아웃 처리
  const forceRelogin = (message) => {
    try {
      clearAccessToken();
      clearCurrentUserId();
      clearIsLoggedIn();
    } catch {
      // ignore
    }
    try {
      if (typeof onLogout === "function") onLogout();
    } catch {
      // ignore
    }
    if (message) window.alert(message);
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    let alive = true;

    const load = async () => {
      // ✅ MyPage에서 state로 넘긴 report가 있으면 우선 사용
      const st = location?.state || {};
      if (st?.report && String(st.report?.id) === String(id)) {
        setReport(st.report);
        return;
      }

      setLoading(true);
      setLoadError("");

      try {
        const data = await fetchMyBrands();
        const arr = Array.isArray(data) ? data : [];
        const mapped = arr
          .map((dto) => mapBrandDtoToReport(dto))
          .filter((r) => r && r.id);

        const found = mapped.find((r) => String(r.id) === String(id));
        if (found) {
          if (!alive) return;
          setReport(found);
          return;
        }
        // ✅ 서버 목록에도 없으면 종료
        if (!alive) return;
        setLoadError("리포트를 찾을 수 없습니다.");
        setReport(null);
      } catch (e) {
        const status = e?.response?.status ?? e?.status;
        if (status === 401 || status === 403) {
          forceRelogin(
            "로그인이 만료되었거나 권한이 없습니다(401/403). 다시 로그인해주세요.",
          );
          return;
        }
        const msg =
          e?.userMessage || e?.message || "리포트를 불러오지 못했습니다.";
        if (!alive) return;
        setLoadError(msg);
        setReport(null);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, [id]);

  const naming = useMemo(
    () => buildSelection(report || {}, "naming"),
    [report],
  );

  const concept = useMemo(
    () => buildSelection(report || {}, "concept"),
    [report],
  );
  const story = useMemo(() => buildSelection(report || {}, "story"), [report]);
  const logo = useMemo(() => buildSelection(report || {}, "logo"), [report]);

  // ✅ 로고 URL: 서버 snapshot/raw dto → 로컬 fallback 순
  const selectedLogoMap = useMemo(() => {
    const v = userSafeParse(SELECTED_LOGO_MAP_KEY);
    return v && typeof v === "object" ? v : {};
  }, []);

  const logoImageUrl = useMemo(() => {
    const url =
      logo?.imageUrl ||
      logo?.url ||
      logo?.selectedLogoUrl ||
      logo?.selectedByUser ||
      (typeof selectedLogoMap?.[String(id)] === "string"
        ? selectedLogoMap[String(id)]
        : "");

    const raw = typeof url === "string" ? url.trim() : "";
    if (!raw) return "";

    // ✅ 상대경로(/uploads/.., logos/..)면 API_BASE/ASSET_BASE를 붙여서 표시
    const API_BASE =
      import.meta.env.VITE_API_BASE_URL || "/api";
    const ASSET_BASE =
      import.meta.env.VITE_ASSET_BASE_URL ||
      import.meta.env.VITE_S3_BASE_URL ||
      "";

    if (/^(data:|blob:|https?:\/\/)/i.test(raw)) return raw;
    if (raw.startsWith("//")) return `https:${raw}`;

    const base = (ASSET_BASE || API_BASE || "").replace(/\/+$/, "");
    const path = raw.startsWith("/") ? raw : `/${raw}`;
    return base ? `${base}${path}` : raw;
  }, [logo, id, selectedLogoMap]);

  const namingBullets = toBullets(
    naming?.summary,
    naming?.reason,
    naming?.rationale,
    naming?.description,
    naming?.overview,
    naming?.tagline ? `태그라인: ${naming.tagline}` : "",
  );

  const conceptBullets = toBullets(
    concept?.summary,
    concept?.content,
    concept?.reason,
    concept?.description,
    concept?.overview,
    Array.isArray(concept?.keywords) ? concept.keywords.join(", ") : "",
  );

  const storyBullets = toBullets(
    story?.summary,
    story?.story,
    story?.content,
    story?.reason,
    story?.description,
    story?.overview,
    Array.isArray(story?.keywords) ? story.keywords.join(", ") : "",
  );

  const logoBullets = toBullets(
    logo?.summary,
    logo?.reason,
    logo?.description,
    logo?.overview,
  );

  const namingDone = Boolean(naming?.name || namingBullets.length);
  const conceptDone = Boolean(concept?.name || conceptBullets.length);
  const storyDone = Boolean(story?.name || storyBullets.length);
  const logoDone = Boolean(logoImageUrl || logo?.name || logoBullets.length);

  const fallbackDone = [namingDone, conceptDone, storyDone, logoDone].filter(
    Boolean,
  ).length;
  const fallbackPct = Math.round((fallbackDone / 4) * 100);

  const storedPctRaw = Number(
    report?.progress?.percent ?? report?.progressPercent ?? Number.NaN,
  );
  const pctFromStored =
    Number.isFinite(storedPctRaw) && storedPctRaw > 0
      ? storedPctRaw
      : fallbackPct;

  const isComplete = Boolean(
    report?.isDummy ? true : (report?.isComplete ?? pctFromStored >= 100),
  );

  const progressPct = Math.max(
    0,
    Math.min(100, isComplete ? 100 : pctFromStored),
  );
  const statusLabel = isComplete ? "완료" : "미완료";

  const detailSubText =
    pickFirstString(
      report?.subtitle,
      naming?.summary,
      concept?.summary,
      story?.summary,
      logo?.summary,
    ) || "컨설팅 결과를 카드 형태로 확인할 수 있어요.";

  if (!report) {
    return (
      <div className="diagInterview consultingInterview">
        <SiteHeader onLogout={onLogout} />
        <main className="diagInterview__main">
          <div className="diagInterview__container">
            <div className="card">
              <div className="card__head">
                <h2>
                  {loading
                    ? "리포트를 불러오는 중..."
                    : "리포트를 찾을 수 없습니다"}
                </h2>
                <p>
                  {loading
                    ? "잠시만 기다려 주세요."
                    : loadError
                      ? loadError
                      : "마이페이지에서 다시 선택해 주세요."}
                </p>
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
          <section
            aria-label="브랜드 컨설팅 리포트 배너"
            style={{
              position: "relative",
              borderRadius: 20,
              padding: "18px 18px",
              background: "#ffffff",
              border: "1px solid rgba(15, 23, 42, 0.08)",
              boxShadow: "0 14px 34px rgba(15, 23, 42, 0.08)",
              marginBottom: 14,
              overflow: "hidden",
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(135deg, rgba(23, 102, 229, 0.12) 0%, rgba(255, 255, 255, 0) 45%, rgba(0, 31, 102, 0.06) 100%)",
                pointerEvents: "none",
              }}
            />

            <div style={{ position: "relative", zIndex: 1 }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: 28,
                  fontWeight: 900,
                  letterSpacing: "0.01em",
                  color: "#0f172a",
                }}
              >
                브랜드 컨설팅 결과
              </h1>
              <p
                style={{
                  margin: "8px 0 0",
                  color: "rgba(15, 23, 42, 0.72)",
                  lineHeight: 1.5,
                }}
              >
                {detailSubText}
              </p>

              <div
                className="diagInterviewHero__chips"
                style={{ marginTop: 12, position: "relative", zIndex: 1 }}
              >
                <span className="diagInterviewHero__chip">
                  <b>상태</b>
                  <span>{statusLabel}</span>
                </span>
                <span className="diagInterviewHero__chip">
                  <b>진행도</b>
                  <span>{progressPct}%</span>
                </span>
                <span className="diagInterviewHero__chip">
                  <b>생성일</b>
                  <span>{fmt(report.createdAt)}</span>
                </span>
                <span
                  className={`diagInterviewHero__chip state ${isComplete ? "ready" : "pending"}`}
                  style={{ maxWidth: "100%" }}
                >
                  {isComplete ? "최종 리포트 저장 완료" : "일부 단계는 미완료"}
                </span>
              </div>
            </div>
          </section>

          <div
            className="diagInterview__grid"
            style={{ marginTop: 14, gridTemplateColumns: "minmax(0, 1fr)" }}
          >
            <section
              className="diagInterview__left"
              style={{ maxWidth: "100%" }}
            >
              <DetailSection
                id="detail-naming"
                title="네이밍"
                name={naming?.name || ""}
                tone="naming"
                done={namingDone}
                bullets={namingBullets}
                hideEmptyMessage
                nameStyle={{
                  margin: "10px 0 0",
                  fontSize: "clamp(26px, 4vw, 38px)",
                  fontWeight: 900,
                  lineHeight: 1.14,
                  letterSpacing: "0.01em",
                  color: "#0b1220",
                }}
              />

              <DetailSection
                id="detail-concept"
                title="컨셉"
                name={concept?.name || ""}
                tone="concept"
                done={conceptDone}
                bullets={conceptBullets}
              />

              <DetailSection
                id="detail-story"
                title="브랜드 스토리"
                name={story?.name || ""}
                tone="story"
                done={storyDone}
                bullets={storyBullets}
              />

              <DetailSection
                id="detail-logo"
                title="로고"
                name={logo?.name || ""}
                tone="logo"
                done={logoDone}
                bullets={logoBullets}
                extra={
                  <>
                    {logoImageUrl ? (
                      <div style={{ marginTop: 2 }}>
                        <h4
                          style={{
                            margin: "4px 0 8px",
                            fontSize: 13,
                            fontWeight: 800,
                            color: "#0f172a",
                          }}
                        >
                          선택한 로고
                        </h4>
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 10,
                            borderRadius: 12,
                            border: "1px solid rgba(13,148,136,0.2)",
                            background: "#f8fbfb",
                          }}
                        >
                          <img
                            src={logoImageUrl}
                            alt="선택한 로고"
                            style={{
                              width: 240,
                              maxWidth: "100%",
                              height: "auto",
                              borderRadius: 10,
                              border: "1px solid #e5e7eb",
                              background: "#fff",
                            }}
                          />
                        </div>
                      </div>
                    ) : null}

                    <div style={{ marginTop: logoImageUrl ? 10 : 2 }}>
                      <h4
                        style={{
                          margin: "0 0 8px",
                          fontSize: 13,
                          fontWeight: 800,
                          color: "#0f172a",
                        }}
                      >
                        이미지 URL
                      </h4>
                      <input
                        readOnly
                        value={logoImageUrl || ""}
                        placeholder="저장된 이미지 URL이 없습니다."
                        style={{
                          width: "100%",
                          borderRadius: 10,
                          border: "1px solid rgba(15,23,42,0.14)",
                          background: "#ffffff",
                          color: "#334155",
                          padding: "9px 10px",
                          fontSize: 12,
                        }}
                      />
                    </div>

                    {logo?.prompt ? (
                      <div style={{ marginTop: 10 }}>
                        <h4
                          style={{
                            margin: "0 0 8px",
                            fontSize: 13,
                            fontWeight: 800,
                            color: "#0f172a",
                          }}
                        >
                          로고 프롬프트
                        </h4>
                        <textarea
                          readOnly
                          value={logo.prompt}
                          rows={5}
                          style={{
                            width: "100%",
                            borderRadius: 12,
                            border: "1px solid rgba(15,23,42,0.14)",
                            background: "#f8fafc",
                            color: "#334155",
                            padding: 10,
                            resize: "vertical",
                            fontSize: 13,
                            lineHeight: 1.58,
                          }}
                        />
                      </div>
                    ) : null}
                  </>
                }
              />
            </section>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
