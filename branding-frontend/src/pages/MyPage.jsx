// src/pages/MyPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import SiteHeader from "../components/SiteHeader.jsx";
import SiteFooter from "../components/SiteFooter.jsx";

import PolicyModal from "../components/PolicyModal.jsx";
import { PrivacyContent, TermsContent } from "../components/PolicyContents.jsx";

import {
  getCurrentUserId,
  clearCurrentUserId,
  clearIsLoggedIn,
} from "../api/auth.js";

import { clearAccessToken } from "../api/client.js";

import { userSafeParse, userSetJSON } from "../utils/userLocalStorage.js";

import {
  readPipeline,
  readDiagnosisDraftForm,
  buildDiagnosisSummaryFromDraft,
  resetBrandConsultingToDiagnosisStart,
} from "../utils/brandPipelineStorage.js";

import { listPromoReports } from "../utils/promoReportHistory.js";

import {
  fetchMyBrands,
  deleteMyBrand,
  mapBrandDtoToReport,
} from "../api/mypage.js";
import "../styles/MyPage.css";

function fmt(ts) {
  if (!ts) return "-";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

// ✅ 로컬에 남아있는 '진행중(미완료)' 상태를 마이페이지에 카드로 노출(서버가 미완료를 안 내려주는 경우 대비)
function buildLocalWipBrandReport() {
  try {
    const p = readPipeline() || {};
    const diagForm = readDiagnosisDraftForm();

    const hasDiagDraft =
      diagForm &&
      typeof diagForm === "object" &&
      Object.keys(diagForm).length > 0;

    const hasBrandId =
      p?.brandId != null && String(p.brandId).trim().length > 0;

    const hasAnyStep =
      Boolean(p?.naming?.selectedId || p?.naming?.selected) ||
      Boolean(p?.concept?.selectedId || p?.concept?.selected) ||
      Boolean(p?.story?.selectedId || p?.story?.selected) ||
      Boolean(p?.logo?.selectedId || p?.logo?.selected);

    const hasAny =
      hasDiagDraft || hasBrandId || hasAnyStep || Boolean(p?.brandFlow?.active);
    if (!hasAny) return null;

    let pct = 0;
    if (p?.logo?.selectedId || p?.logo?.selected) pct = 90;
    else if (p?.story?.selectedId || p?.story?.selected) pct = 75;
    else if (p?.concept?.selectedId || p?.concept?.selected) pct = 50;
    else if (p?.naming?.selectedId || p?.naming?.selected) pct = 25;
    else if (hasBrandId) pct = 10;
    else pct = 5;

    const summary =
      buildDiagnosisSummaryFromDraft(hasDiagDraft ? diagForm : {}) || {};
    const title = summary.companyName || "진행중 브랜드";
    const oneLine = summary.oneLine || summary.shortText || "";

    const id = hasBrandId ? String(p.brandId) : "local_wip";
    const resumePath = hasBrandId ? "/brandconsulting" : "/diagnosis";

    return {
      id,
      kind: "brand",
      serviceLabel: "브랜드 컨설팅",
      title,
      subtitle: oneLine ? oneLine : "진행중(미완료)",
      createdAt: p?.updatedAt || null,
      progressPercent: pct,
      isComplete: false,
      backendStep: "LOCAL_WIP",
      resumePath,
      resumeState: { from: "mypage" },
      _localWip: true,
      snapshot: {
        diagnosisSummary: {
          companyName: title,
          oneLine: oneLine || "",
        },
        selections: {},
      },
      _raw: { local: true },
    };
  } catch {
    return null;
  }
}
const PROFILE_KEY = "userProfile_v1";

// ✅ 마이페이지 카드 삭제(목록 숨김) 키(사용자 스코프)
const HIDDEN_BRANDS_KEY = "mypageHiddenBrands_v1";
const HIDDEN_PROMOS_KEY = "mypageHiddenPromos_v1";
// ✅ 로고 선택값 로컬 fallback(brandId -> logoUrl)
const SELECTED_LOGO_MAP_KEY = "selectedLogoUrlByBrand_v1";

function getInitialLabel(userId) {
  const raw = String(userId ?? "").trim();
  if (!raw) return "U";
  const first = raw[0];
  return first ? first.toUpperCase() : "U";
}

function hashToInt(str) {
  const s = String(str || "");
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function getBrandInitials(name) {
  const raw = String(name ?? "").trim();
  if (!raw) return "BR";

  // 한글은 1글자만, 영문/숫자는 2글자(또는 2단어 이니셜)
  const first = raw[0];
  if (/[가-힣]/.test(first)) return first;

  const cleaned = raw.replace(/[^A-Za-z0-9]+/g, " ").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return raw.slice(0, 2).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || "B"}${parts[1][0] || "R"}`.toUpperCase();
}

function extractLogoUrl(r) {
  const candidates = [
    r?.logoUrl,
    r?.logoImageUrl,
    r?.thumbnailUrl,
    r?.imageUrl,
    r?._raw?.logoUrl,
    r?._raw?.selectedLogoUrl,
    r?._raw?.selectedByUser,
    r?._raw?.logoImageUrl,
    r?.snapshot?.selections?.logo?.imageUrl,
    r?.snapshot?.selections?.logo?.logoImageUrl,
    r?.snapshot?.selections?.logo?.url,
    r?.snapshot?.selections?.logo?.image,
    r?.snapshot?.selections?.logo?.img,
  ];

  const raw =
    candidates.find((v) => typeof v === "string" && v.trim().length > 0) || "";
  if (!raw) return "";

  // ✅ 상대경로(/uploads/.., logos/..)면 API_BASE/ASSET_BASE를 붙여서 표시
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
  const ASSET_BASE =
    import.meta.env.VITE_ASSET_BASE_URL ||
    import.meta.env.VITE_S3_BASE_URL ||
    "";

  const s = String(raw).trim();
  if (/^(data:|blob:|https?:\/\/)/i.test(s)) return s;
  if (s.startsWith("//")) return `https:${s}`;

  const base = (ASSET_BASE || API_BASE || "").replace(/\/+$/, "");
  const path = s.startsWith("/") ? s : `/${s}`;
  return base ? `${base}${path}` : s;
}

function pickFirstString(...vals) {
  for (const v of vals) {
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
  }
  return "";
}

function normalizeText(t) {
  return String(t ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateText(text, maxLen = 120) {
  const s = normalizeText(text);
  if (!s) return "";
  if (s.length <= maxLen) return s;
  return `${s.slice(0, maxLen).trimEnd()}...`;
}

// ✅ 컨셉/스토리 장문 대비: 다양한 필드 후보에서 우선순위로 추출
function extractConceptText(r) {
  const sel = r?.snapshot?.selections || {};
  return pickFirstString(
    sel?.concept?.content,
    sel?.concept?.description,
    sel?.concept?.summary,
    sel?.concept?.text,
    sel?.concept?.name,
    r?.snapshot?.concept?.content,
    r?.snapshot?.concept?.description,
    r?.snapshot?.concept?.summary,
    r?.snapshot?.concept?.text,
    r?.snapshot?.concept?.name,
  );
}

function extractStoryText(r) {
  const sel = r?.snapshot?.selections || {};
  return pickFirstString(
    sel?.story?.content,
    sel?.story?.description,
    sel?.story?.summary,
    sel?.story?.text,
    sel?.story?.name,
    r?.snapshot?.story?.content,
    r?.snapshot?.story?.description,
    r?.snapshot?.story?.summary,
    r?.snapshot?.story?.text,
    r?.snapshot?.story?.name,
  );
}

// ✅ 한줄 소개 텍스트 추출(카드 표시용이 아닌 검색 보조용)
function extractOneLineText(r) {
  const ds = r?.snapshot?.diagnosisSummary || {};
  const sel = r?.snapshot?.selections || {};
  return pickFirstString(
    ds?.oneLine,
    ds?.tagline,
    ds?.shortText,
    sel?.naming?.tagline,
    sel?.naming?.oneLine,
    sel?.naming?.summary,
    r?.oneLine,
    r?.subtitle,
  );
}

// 2026-02-10
// 로고 다운로드
function safeFilename(name) {
  return String(name || "brand")
    .trim()
    .replace(/[\\/:*?"<>|]/g, "_")
    .slice(0, 60);
}

function guessExt(url) {
  const clean = String(url || "").split("?")[0];
  const m = clean.match(/\.([a-zA-Z0-9]+)$/);
  return m ? m[1].toLowerCase() : "jpg";
}

function openInNewTab(url) {
  window.open(url, "_blank", "noopener,noreferrer");
}

// ✅ “파일 저장” 시도 → 실패하면 새 탭(사용자 저장 가능)
async function downloadFromUrl(url, filenameBase) {
  if (!url) return;

  const ext = guessExt(url);
  const filename = `${safeFilename(filenameBase)}_logo.${ext}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("download failed");

    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(blobUrl);
  } catch {
    openInNewTab(url);
  }
}

export default function MyPage({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ 푸터 약관/방침 모달
  const [openType, setOpenType] = useState(null);
  const closeModal = () => setOpenType(null);

  // ✅ 결과 탭
  const [tab, setTab] = useState("brand"); // brand | promo
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("recent"); // recent | old

  const [brandReports, setBrandReports] = useState([]);
  const [promoReports, setPromoReports] = useState([]);

  const [brandLoading, setBrandLoading] = useState(false);
  const [brandError, setBrandError] = useState("");
  const [brandReloadTick, setBrandReloadTick] = useState(0);
  const reloadBrands = () => setBrandReloadTick((v) => v + 1);

  const [deletingId, setDeletingId] = useState(null);

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

  const userId = useMemo(() => {
    try {
      return getCurrentUserId();
    } catch {
      return null;
    }
  }, []);

  // ✅ 프로필(사용자 스코프 localStorage)
  const savedProfile = useMemo(() => {
    return userSafeParse(PROFILE_KEY) || {};
  }, []);

  // ✅ 로고 선택값 로컬 fallback(brandId -> logoUrl)
  // - 백에서 logoUrl이 아직 내려오지 않거나(지연/누락)
  //   프론트가 선택값 저장을 끝낸 직후에도 카드에 바로 보여주기 위함
  const selectedLogoMap = useMemo(() => {
    const v = userSafeParse(SELECTED_LOGO_MAP_KEY);
    return v && typeof v === "object" ? v : {};
  }, [userId]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [displayName, setDisplayName] = useState(
    savedProfile.displayName || "",
  );
  const [bio, setBio] = useState(savedProfile.bio || "");

  const profileName = displayName.trim() || "사용자";
  const profileIdLabel = userId ? String(userId) : "-";
  const profileInitial = getInitialLabel(profileIdLabel);

  const openProfileEdit = () => {
    const cur = userSafeParse(PROFILE_KEY) || {};
    setDisplayName(cur.displayName || "");
    setBio(cur.bio || "");
    setIsEditingProfile(true);
  };

  const cancelProfileEdit = () => {
    const cur = userSafeParse(PROFILE_KEY) || {};
    setDisplayName(cur.displayName || "");
    setBio(cur.bio || "");
    setIsEditingProfile(false);
  };

  const saveProfile = () => {
    userSetJSON(PROFILE_KEY, {
      displayName: displayName.trim(),
      bio: bio.trim(),
      updatedAt: Date.now(),
    });
    setIsEditingProfile(false);
  };

  const readHiddenSet = (key) => {
    const raw = userSafeParse(key);
    const arr = Array.isArray(raw) ? raw : [];
    return new Set(arr.map((v) => String(v)));
  };

  const addHiddenId = (key, id) => {
    const s = readHiddenSet(key);
    s.add(String(id));
    userSetJSON(key, Array.from(s));
    return s;
  };

  const hideReportCard = (r) => {
    if (!r?.id) return;
    if (r?.kind === "promo") {
      addHiddenId(HIDDEN_PROMOS_KEY, r.id);
      setPromoReports((prev) =>
        (Array.isArray(prev) ? prev : []).filter(
          (x) => String(x?.id) !== String(r.id),
        ),
      );
      return;
    }
    addHiddenId(HIDDEN_BRANDS_KEY, r.id);
    setBrandReports((prev) =>
      (Array.isArray(prev) ? prev : []).filter(
        (x) => String(x?.id) !== String(r.id),
      ),
    );
  };

  const onDeleteCard = async (r, e) => {
    if (e) e.stopPropagation();
    if (!r?.id) return;

    const ok = window.confirm(
      "이 결과 카드를 삭제할까요?\n(삭제 후 복구는 어렵습니다)",
    );
    if (!ok) return;

    setDeletingId(String(r.id));
    try {
      // ✅ 로컬 진행중(brandId 없음) 카드 삭제: 서버 호출 없이 로컬 진행만 초기화
      if (r?.kind === "brand" && r?._localWip && !/^\d+$/.test(String(r.id))) {
        resetBrandConsultingToDiagnosisStart("delete_local_wip");
        hideReportCard(r);
        return;
      }
      // ✅ 브랜드는 서버 삭제 API가 있을 경우 먼저 시도
      if (r?.kind === "brand") {
        try {
          await deleteMyBrand(r.id);
        } catch (err) {
          const status = err?.status;
          if (status === 401 || status === 403) {
            forceRelogin(
              "로그인이 만료되었거나 권한이 없습니다. 다시 로그인해주세요.",
            );
            return;
          }

          // 서버에 삭제 API가 없을 수 있으므로 '목록 숨김'으로 폴백
          if (status === 404 || status === 405) {
            window.alert(
              "현재 서버에 삭제 API가 없어 목록에서만 숨김 처리했습니다.",
            );
          } else {
            window.alert(
              "삭제 요청 중 오류가 있어 목록에서만 숨김 처리했습니다.",
            );
          }
        }
      }

      hideReportCard(r);

      // ✅ 진행중 카드였다면 로컬 진행도 같이 초기화(재등장 방지)
      if (r?.kind === "brand" && r?._localWip) {
        resetBrandConsultingToDiagnosisStart("delete_wip");
      }
    } finally {
      setDeletingId(null);
    }
  };

  // ✅ URL 파라미터로 탭 이동(/mypage?tab=promo) - 탭만 변경
  useEffect(() => {
    try {
      const sp = new URLSearchParams(location.search || "");
      const t = sp.get("tab");
      if (t === "promo") setTab("promo");
      if (t === "brand") setTab("brand");
    } catch {
      // ignore
    }
  }, [location.search]);

  // ✅ 데이터 로드: 마운트 시 1회만
  useEffect(() => {
    // ✅ 프로모(홍보물) 리포트: 현재는 프론트(localStorage) 기반 유지
    try {
      const hiddenPromo = readHiddenSet(HIDDEN_PROMOS_KEY);
      const promos = listPromoReports();
      const arr = Array.isArray(promos) ? promos : [];
      setPromoReports(
        arr.filter((r) => r && r.id && !hiddenPromo.has(String(r.id))),
      );
    } catch {
      setPromoReports([]);
    }

    let alive = true;

    const loadBrands = async () => {
      setBrandLoading(true);
      setBrandError("");

      const hiddenSet = readHiddenSet(HIDDEN_BRANDS_KEY);

      try {
        const data = await fetchMyBrands();
        const arr = Array.isArray(data) ? data : [];
        const mapped = arr
          .map((dto) => mapBrandDtoToReport(dto))
          .filter((r) => r && r.id);

        // ✅ 완료/미완료 모두 노출 (삭제/상태 확인을 위해)
        if (!alive) return;
        let visible = mapped.filter((r) => !hiddenSet.has(String(r.id)));

        // ✅ 로컬 진행중 카드(미완료) 폴백 추가
        const localWip = buildLocalWipBrandReport();
        if (localWip && !hiddenSet.has(String(localWip.id))) {
          const dup = visible.some(
            (x) => String(x?.id) === String(localWip.id),
          );
          if (!dup) visible = [localWip, ...visible];
        }

        setBrandReports(visible);
      } catch (e) {
        const status = e?.response?.status ?? e?.status;
        if (status === 401 || status === 403) {
          forceRelogin(
            "로그인이 만료되었거나 권한이 없습니다(401/403). 다시 로그인해주세요.",
          );
          return;
        }

        const msg = e?.userMessage || e?.message || "마이페이지 조회 실패";
        if (!alive) return;
        setBrandError(msg);
        setBrandReports([]);
      } finally {
        if (alive) setBrandLoading(false);
      }
    };

    loadBrands();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandReloadTick]); // ✅ 필요 시(에러/재시도) 재호출

  const activeReports = tab === "brand" ? brandReports : promoReports;

  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    const hidden =
      tab === "brand"
        ? readHiddenSet(HIDDEN_BRANDS_KEY)
        : readHiddenSet(HIDDEN_PROMOS_KEY);

    const base = [...activeReports].filter((r) => !hidden.has(String(r?.id)));

    // 2026-02-03
    // 오래된 순 적용이 되게 수정
    const sorted = base.sort((a, b) => {
      const at = new Date(a?.createdAt || 0).getTime();
      const bt = new Date(b?.createdAt || 0).getTime();
      return sort === "old" ? at - bt : bt - at;
    });

    if (!keyword) return sorted;

    return sorted.filter((r) => {
      const t = String(r?.title || "").toLowerCase();
      const s = String(r?.subtitle || "").toLowerCase();
      const lab = String(r?.serviceLabel || "").toLowerCase();

      const company =
        r?.snapshot?.diagnosisSummary?.companyName ||
        r?.snapshot?.diagnosisSummary?.brandName ||
        r?.snapshot?.diagnosisSummary?.projectName ||
        "";

      // 브랜드 카드 검색 품질: 한줄소개/컨셉/스토리까지 포함
      const oneLine = extractOneLineText(r).toLowerCase();
      const concept = extractConceptText(r).toLowerCase();
      const story = extractStoryText(r).toLowerCase();

      return (
        t.includes(keyword) ||
        s.includes(keyword) ||
        lab.includes(keyword) ||
        String(company).toLowerCase().includes(keyword) ||
        oneLine.includes(keyword) ||
        concept.includes(keyword) ||
        story.includes(keyword)
      );
    });
  }, [activeReports, q, sort, tab]);

  const goStart = () => {
    if (tab === "promo") {
      navigate("/promotion");
    } else {
      navigate("/brandconsulting");
    }
  };

  const goDetail = (r) => {
    if (!r?.id) return;
    if (r.kind === "promo") {
      navigate(`/mypage/promo-report/${r.id}`, { state: { report: r } });
      return;
    }

    // ✅ 로컬 진행중(미완료) 카드면: 상세가 아니라 "이어하기"로 이동
    if (r?.resumePath) {
      navigate(r.resumePath, { state: r.resumeState || undefined });
      return;
    }

    navigate(`/mypage/brand-report/${r.id}`, { state: { report: r } });
  };

  return (
    <div className="mypage-page">
      {/* ✅ 약관/방침 모달 */}
      <PolicyModal
        open={openType === "privacy"}
        title="개인정보 처리방침"
        onClose={closeModal}
      >
        <PrivacyContent />
      </PolicyModal>

      <PolicyModal
        open={openType === "terms"}
        title="이용약관"
        onClose={closeModal}
      >
        <TermsContent />
      </PolicyModal>

      <SiteHeader onLogout={onLogout} />

      <main className="mypage-content">
        <div className="mypage-hero">
          <div className="mypage-headerRow">
            <div>
              <h2 className="mypage-title">마이페이지</h2>
              <p className="mypage-sub">내가 만든 리포트를 모아볼 수 있어요.</p>
            </div>
          </div>
        </div>

        {/* ✅ 프로필(리뉴얼) */}
        <section className="mypage-card myprofileCard">
          <div className="myprofileBanner">
            <div className="myprofileLeft">
              <div className="myprofileAvatar" aria-hidden="true">
                {profileInitial}
              </div>

              <div className="myprofileText">
                <div className="myprofileNameRow">
                  <div className="myprofileName">{profileName}</div>
                  <span className="myprofileId">ID · {profileIdLabel}</span>
                </div>

                <div className="myprofileBio">
                  {bio.trim() || "로그인 계정 기준으로 결과가 분리 저장됩니다."}
                </div>

                <div className="myprofileChips">
                  <span className="metaChip">브랜드 {brandReports.length}</span>
                  <span className="metaChip">홍보물 {promoReports.length}</span>
                </div>
              </div>
            </div>

            <div className="myprofileActions">
              <button
                type="button"
                className="btn ghost"
                onClick={openProfileEdit}
              >
                프로필 편집
              </button>
            </div>
          </div>

          {isEditingProfile ? (
            <div className="myprofileEdit">
              <div className="myprofileField">
                <label>표시 이름</label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="예: 홍길동 / 팀명 / 닉네임"
                />
              </div>

              <div className="myprofileField">
                <label>한 줄 소개</label>
                <input
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="예: 내 리포트는 이곳에 저장돼요"
                />
              </div>

              <div className="btnRow" style={{ marginTop: 4 }}>
                <button type="button" className="btn" onClick={saveProfile}>
                  저장
                </button>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={cancelProfileEdit}
                >
                  취소
                </button>
              </div>
            </div>
          ) : null}
        </section>

        {/* ✅ 결과 섹션 */}
        <section className="mypage-card">
          <div className="cardTitleRow" style={{ marginBottom: 12 }}>
            <h3>내 리포트</h3>
            <span className="pill ghost">미리보기</span>
          </div>

          <div className="myhub-tabs" role="tablist" aria-label="리포트 종류">
            <button
              type="button"
              className={`myhub-tab ${tab === "brand" ? "is-active" : ""}`}
              onClick={() => setTab("brand")}
            >
              브랜드 컨설팅 결과
              <span className="myhub-count">{brandReports.length}</span>
            </button>
            <button
              type="button"
              className={`myhub-tab ${tab === "promo" ? "is-active" : ""}`}
              onClick={() => setTab("promo")}
            >
              홍보물 컨설팅 결과
              <span className="myhub-count">{promoReports.length}</span>
            </button>
          </div>

          <div className="myhub-toolbar">
            <div className="myhub-search">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={
                  tab === "promo"
                    ? "서비스/키워드로 검색"
                    : "브랜드/키워드로 검색"
                }
              />
            </div>
            <div className="myhub-right">
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="recent">최신순</option>
                <option value="old">오래된순</option>
              </select>
              <button type="button" className="btn" onClick={goStart}>
                {tab === "promo" ? "새 홍보물 생성" : "새 브랜드 생성"}
              </button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="myhub-empty">
              <div className="myhub-empty-illust" aria-hidden="true" />
              <div>
                <h4 className="myhub-empty-title">
                  {tab === "brand" && brandLoading
                    ? "불러오는 중..."
                    : tab === "brand" && brandError
                      ? "리포트를 불러오지 못했어요"
                      : "아직 저장된 리포트가 없습니다"}
                </h4>
                <p className="myhub-empty-sub">
                  {tab === "brand" && brandLoading
                    ? "잠시만 기다려주세요."
                    : tab === "brand" && brandError
                      ? brandError
                      : "컨설팅을 완료하면 카드가 자동으로 쌓입니다."}
                </p>
              </div>
              {tab === "brand" && brandError ? (
                <button
                  type="button"
                  className="btn primary"
                  onClick={reloadBrands}
                >
                  다시 불러오기
                </button>
              ) : (
                <button type="button" className="btn primary" onClick={goStart}>
                  지금 시작하기
                </button>
              )}
            </div>
          ) : (
            <>
              {tab === "brand" && brandLoading ? (
                <div className="myhub-hint">불러오는 중...</div>
              ) : null}
              {tab === "brand" && brandError ? (
                <div className="myhub-hint danger">
                  {brandError}{" "}
                  <button
                    type="button"
                    className="btn ghost sm"
                    onClick={reloadBrands}
                    style={{ marginLeft: 8 }}
                  >
                    다시 시도
                  </button>
                </div>
              ) : null}

              <div className="reportStack">
                {filtered.map((r) => {
                  const company =
                    r?.snapshot?.diagnosisSummary?.companyName ||
                    r?.snapshot?.diagnosisSummary?.brandName ||
                    r?.snapshot?.diagnosisSummary?.projectName ||
                    "브랜드";

                  const initials = getBrandInitials(company);
                  const variant = hashToInt(r?.id || company) % 6;
                  const logoUrl =
                    extractLogoUrl(r) ||
                    (typeof selectedLogoMap?.[String(r?.id)] === "string"
                      ? selectedLogoMap[String(r.id)]
                      : "");

                  const conceptRaw =
                    r?.kind === "brand" ? extractConceptText(r) : "";
                  const storyRaw =
                    r?.kind === "brand" ? extractStoryText(r) : "";
                  const conceptPreview = conceptRaw
                    ? truncateText(conceptRaw, 110)
                    : "-";
                  const storyPreview = storyRaw
                    ? truncateText(storyRaw, 110)
                    : "-";

                  const snap0 = r?.snapshot || {};
                  const sel0 = snap0?.selections || {};
                  const diag0 = snap0?.diagnosisSummary || {};

                  const diagDone = Boolean(
                    diag0?.companyName ||
                    diag0?.brandName ||
                    diag0?.projectName ||
                    diag0?.oneLine ||
                    diag0?.shortText,
                  );
                  const namingDone = Boolean(sel0?.naming);
                  const conceptDone = Boolean(sel0?.concept);
                  const storyDone = Boolean(sel0?.story);
                  const logoDone = Boolean(sel0?.logo);

                  const fallbackDone = [
                    diagDone,
                    namingDone,
                    conceptDone,
                    storyDone,
                    logoDone,
                  ].filter(Boolean).length;

                  const fallbackPct = Math.round((fallbackDone / 5) * 100);

                  const storedPctRaw = Number(
                    r?.progress?.percent ?? r?.progressPercent ?? Number.NaN,
                  );
                  const pctFromStored =
                    Number.isFinite(storedPctRaw) && storedPctRaw > 0
                      ? storedPctRaw
                      : fallbackPct;

                  const isComplete = Boolean(
                    r?.isDummy ? true : (r?.isComplete ?? pctFromStored >= 100),
                  );

                  const progressPct = Math.max(
                    0,
                    Math.min(100, isComplete ? 100 : pctFromStored),
                  );
                  const progressStatus = isComplete ? "완료" : "미완료";

                  return (
                    <article
                      key={r.id}
                      className={`reportCard ${r?.isDummy ? "is-dummy" : ""}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => goDetail(r)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          goDetail(r);
                        }
                      }}
                    >
                      <div className="reportCard__grid">
                        <div
                          className={`reportLogo variant-${variant} ${
                            logoUrl ? "hasImage" : ""
                          }`}
                          aria-hidden="true"
                        >
                          {logoUrl ? (
                            <img src={logoUrl} alt="" loading="lazy" />
                          ) : (
                            <span className="reportLogoText">{initials}</span>
                          )}
                        </div>

                        <div className="reportInfo">
                          {r?.kind === "brand" ? (
                            <>
                              <div className="reportTitleRow">
                                <h4 className="reportCard__title">{company}</h4>
                                <div className="reportTitleBadges">
                                  {r?.isDummy ? (
                                    <span className="pill dummy">더미</span>
                                  ) : null}
                                  <span
                                    className={`pill ${
                                      isComplete ? "complete" : "incomplete"
                                    }`}
                                  >
                                    {progressStatus}
                                  </span>

                                  {/* 2026-02-10 로고 다운로드 추가 */}
                                  <button
                                    type="button"
                                    className="btn ghost btn-sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const nameBase =
                                        company || r?.title || "brand";
                                      downloadFromUrl(logoUrl, nameBase);
                                    }}
                                    disabled={!logoUrl}
                                    title={
                                      !logoUrl
                                        ? "선택된 로고가 없습니다."
                                        : "로고를 다운로드합니다."
                                    }
                                  >
                                    로고 원본 보기
                                  </button>

                                  <button
                                    type="button"
                                    className={`btn danger btn-sm deleteBtn ${
                                      deletingId === String(r.id)
                                        ? "is-busy"
                                        : ""
                                    }`}
                                    aria-label="삭제"
                                    title="삭제"
                                    onClick={(e) => onDeleteCard(r, e)}
                                    disabled={deletingId === String(r.id)}
                                  >
                                    {deletingId === String(r.id)
                                      ? "삭제 중"
                                      : "삭제"}
                                  </button>
                                </div>
                              </div>

                              <p className="reportCard__sub">
                                <strong style={{ fontWeight: 900 }}>
                                  컨셉
                                </strong>{" "}
                                · {conceptPreview}
                              </p>

                              <p className="reportCard__sub">
                                <strong style={{ fontWeight: 900 }}>
                                  스토리
                                </strong>{" "}
                                · {storyPreview}
                              </p>

                              <div className="reportProgress">
                                <div className="reportProgress__row">
                                  <span className="reportProgress__label">
                                    진행도
                                  </span>
                                  <span className="reportProgress__value">
                                    {progressPct}%
                                  </span>
                                </div>
                                <div
                                  className="reportProgress__bar"
                                  role="progressbar"
                                  aria-valuenow={progressPct}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                >
                                  <div
                                    className="reportProgress__fill"
                                    style={{ width: `${progressPct}%` }}
                                  />
                                </div>
                              </div>

                              <div className="reportMeta">
                                <span className="metaChip ghost">
                                  {fmt(r.createdAt)}
                                </span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="reportTitleRow">
                                <h4 className="reportCard__title">{r.title}</h4>
                                <div className="reportTitleBadges">
                                  {r?.isDummy ? (
                                    <span className="pill dummy">더미</span>
                                  ) : null}
                                  <button
                                    type="button"
                                    className={`btn danger btn-sm deleteBtn ${
                                      deletingId === String(r.id)
                                        ? "is-busy"
                                        : ""
                                    }`}
                                    aria-label="삭제"
                                    title="삭제"
                                    onClick={(e) => onDeleteCard(r, e)}
                                    disabled={deletingId === String(r.id)}
                                  >
                                    {deletingId === String(r.id)
                                      ? "삭제 중"
                                      : "삭제"}
                                  </button>
                                </div>
                              </div>

                              {r.subtitle ? (
                                <p className="reportCard__sub">{r.subtitle}</p>
                              ) : null}
                              <div className="reportMeta">
                                {r.serviceLabel ? (
                                  <span className="metaChip">
                                    {r.serviceLabel}
                                  </span>
                                ) : null}
                                <span className="metaChip ghost">
                                  {fmt(r.createdAt)}
                                </span>
                              </div>
                            </>
                          )}
                        </div>

                        {/* 리포트 보기 버튼 제거: 카드 자체 클릭으로 이동 */}
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </section>

        {/* ✅ 계정 관리 */}
        <section className="mypage-card">
          <div className="cardTitleRow">
            <h3>계정 관리</h3>
            <span className="pill ghost">주의</span>
          </div>

          <div className="btnRow">
            <button
              type="button"
              className="btn ghost"
              onClick={() => alert("비밀번호 변경 (준비중)")}
            >
              비밀번호 변경
            </button>
            <button
              type="button"
              className="btn danger"
              onClick={() => alert("회원 탈퇴 (준비중)")}
            >
              회원 탈퇴
            </button>
          </div>
        </section>
      </main>

      <SiteFooter onOpenPolicy={setOpenType} />
    </div>
  );
}
