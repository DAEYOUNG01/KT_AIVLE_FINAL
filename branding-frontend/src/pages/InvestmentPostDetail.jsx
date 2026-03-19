// src/pages/InvestmentPostDetail.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import SiteHeader from "../components/SiteHeader.jsx";
import SiteFooter from "../components/SiteFooter.jsx";
import PolicyModal from "../components/PolicyModal.jsx";
import { PrivacyContent, TermsContent } from "../components/PolicyContents.jsx";
import { apiRequest } from "../api/client.js";
import { getCurrentUserId } from "../api/auth.js";
import "../styles/InvestmentPostDetail.css";

export default function InvestmentPostDetail({ onLogout }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const currentUserId = getCurrentUserId();

  const [openType, setOpenType] = useState(null);
  const closeModal = () => setOpenType(null);

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const fetchPost = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiRequest(`/brands/posts/${id}`);

        const normalizeBool = (v) => {
          if (typeof v === "boolean") return v;
          if (v === "true") return true;
          if (v === "false") return false;
          return null;
        };

        // 작성자 식별자(백이 내려주는 필드 이름이 프로젝트마다 다를 수 있어 대응)
        const authorId =
          data?.userId ??
          data?.authorId ??
          data?.memberId ??
          data?.loginId ??
          data?.createdBy ??
          null;

        // ✅ 백에서 owner/isOwner/mine 같은 boolean을 내려주면 우선 사용
        // ✅ 없으면 currentUserId vs authorId로 fallback 판단
        const ownerFlag = normalizeBool(
          data?.owner ?? data?.isOwner ?? data?.mine ?? data?.isMine ?? null,
        );

        const computedOwner =
          currentUserId &&
          authorId &&
          String(currentUserId) === String(authorId);

        const mapped = {
          id: data?.postId ?? id,
          company: data?.companyName || "",
          oneLiner: data?.shortDescription || "",
          logoImageUrl: data?.logoImageUrl || "",
          locations: data?.region ? [data.region] : [],
          companySizes: data?.companySize ? [data.companySize] : [],
          hashtags: Array.isArray(data?.hashtags) ? data.hashtags : [],
          contactName: data?.contactName || "",
          contactEmail: data?.contactEmail || "",
          summary: data?.companyDescription || "",
          updatedAt: data?.updatedAt ? data.updatedAt.slice(0, 10) : "",
          authorId,
          isOwner:
            ownerFlag === null ? Boolean(computedOwner) : Boolean(ownerFlag),
        };

        if (mounted) setItem(mapped);
      } catch (err) {
        console.error(err);
        if (mounted) setError("게시글을 불러오지 못했습니다.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchPost();

    return () => {
      mounted = false;
    };
  }, [id, currentUserId]);

  const tags = useMemo(() => {
    if (!item || !Array.isArray(item.hashtags)) return [];
    return item.hashtags.map((tag) => String(tag).trim()).filter(Boolean);
  }, [item]);

  const metaItems = useMemo(() => {
    if (!item) return [];
    const locationText = Array.isArray(item.locations)
      ? item.locations.join(", ")
      : item.location || "";
    const sizeText = Array.isArray(item.companySizes)
      ? item.companySizes.join(", ")
      : item.companySize || "";
    return [sizeText, locationText].filter(Boolean);
  }, [item]);

  const companyName = item?.company || item?.name || "회사명 없음";
  const oneLiner = item?.oneLiner || "한 줄 소개가 없습니다.";
  const locationText = Array.isArray(item?.locations)
    ? item.locations.join(", ")
    : item?.location || "-";
  if (loading) {
    return (
      <div className="invest-detail-page">
        <SiteHeader onLogout={onLogout} />
        <main className="invest-detail-main">
          <div className="invest-detail-empty">불러오는 중...</div>
        </main>
        <SiteFooter onOpenPolicy={setOpenType} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="invest-detail-page">
        <SiteHeader onLogout={onLogout} />
        <main className="invest-detail-main">
          <div className="invest-detail-empty">{error}</div>
        </main>
        <SiteFooter onOpenPolicy={setOpenType} />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="invest-detail-page">
        <SiteHeader onLogout={onLogout} />
        <main className="invest-detail-main">
          <div className="invest-detail-empty">
            <h2>게시글을 찾을 수 없습니다.</h2>
            <button
              type="button"
              className="btn"
              onClick={() => navigate("/investment")}
            >
              목록으로
            </button>
          </div>
        </main>
        <SiteFooter onOpenPolicy={setOpenType} />
      </div>
    );
  }

  return (
    <div className="invest-detail-page">
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

      <main className="invest-detail-main">
        <div className="invest-detail-hero">
          <div>
            <h1>상세 정보</h1>
            <p className="invest-detail-sub">
              투자 라운지에 등록된 기업의 상세 정보를 확인할 수 있습니다.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {/* ✅ 작성자일 때만 수정 버튼 노출 */}
            {item.isOwner ? (
              <button
                type="button"
                className="btn primary"
                onClick={() => navigate(`/investment/edit/${item.id}`)}
              >
                수정
              </button>
            ) : null}

            <button
              type="button"
              className="btn ghost"
              onClick={() => navigate("/investment")}
            >
              목록으로
            </button>
          </div>
        </div>

        <div className="invest-detail-grid">
          <section className="invest-detail-block invest-detail-overview-main">
            <div className="invest-detail-header">
              <div className="invest-detail-logo">
                {item.logoImageUrl ? (
                  <img src={item.logoImageUrl} alt={`${companyName} 로고`} />
                ) : (
                  companyName.slice(0, 2)
                )}
              </div>
              <div className="invest-detail-title">
                <h2>{companyName}</h2>
              </div>
            </div>
            <p className="invest-detail-oneliner">{oneLiner}</p>
          </section>

          <section className="invest-detail-block invest-detail-overview-side">
            <div className="invest-detail-overview-panel">
              <div className="invest-detail-panel-section">
                <div className="invest-detail-panel-title">회사 규모·지역</div>
                <div className="invest-detail-right-meta">
                  {metaItems.map((value) => (
                    <span key={value}>{value}</span>
                  ))}
                </div>
              </div>
              <div className="invest-detail-panel-divider" />
              <div className="invest-detail-panel-section">
                <div className="invest-detail-panel-title">해시태그</div>
                <div className="invest-detail-right-tags">
                  {tags.map((tag) => (
                    <span key={tag}>#{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <div className="invest-detail-row invest-detail-row-balanced">
            <section className="invest-detail-block invest-detail-summary">
              <h3>상세 소개</h3>
              <p>{item.summary || "상세 소개가 아직 없습니다."}</p>
            </section>

            <section className="invest-detail-block invest-detail-fields">
              <h3>등록 정보</h3>
              <ul>
                <li>
                  <strong>지역</strong>
                  <span>{locationText}</span>
                </li>
                <li>
                  <strong>담당자</strong>
                  <span>{item.contactName || "-"}</span>
                </li>
                <li>
                  <strong>이메일</strong>
                  <span>{item.contactEmail || "-"}</span>
                </li>
              </ul>
            </section>
          </div>

          <section className="invest-detail-block invest-detail-footer">
            <span>업데이트: {item.updatedAt || "-"}</span>
          </section>
        </div>
      </main>

      <SiteFooter onOpenPolicy={setOpenType} />
    </div>
  );
}
