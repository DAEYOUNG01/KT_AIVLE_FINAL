// src/pages/InvestmentPostEdit.jsx
// 2026-01-20
// 게시글 수정 페이지 구현
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import SiteHeader from "../components/SiteHeader.jsx";
import SiteFooter from "../components/SiteFooter.jsx";
import PolicyModal from "../components/PolicyModal.jsx";
import { PrivacyContent, TermsContent } from "../components/PolicyContents.jsx";
import { apiRequest } from "../api/client.js";
import "../styles/InvestmentPostCreate.css";

const LOCATION_OPTIONS = ["수도권", "강원도", "충남/충북", "경남/경북", "전남/전북", "제주"];
const COMPANY_SIZE_OPTIONS = ["예비 창업 / 개인", "스타트업", "중소기업", "중견기업", "대기업"];

export default function InvestmentPostEdit({ onLogout }) {
  const navigate = useNavigate();
  const { id } = useParams();

  const [openType, setOpenType] = useState(null);
  const closeModal = () => setOpenType(null);

  const [form, setForm] = useState({
    company: "",
    oneLiner: "",
    locations: [],
    companySizes: [],
    logoImageUrl: "",
    hashtags: ["", "", "", "", ""],
    contactName: "",
    contactEmail: "",
    summary: "",
  });
  const [notFound, setNotFound] = useState(false);
  const [logoFileName, setLogoFileName] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [locationOpen, setLocationOpen] = useState(false);
  const [sizeOpen, setSizeOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const updateField = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const tagList = useMemo(() => {
    return form.hashtags.map((tag) => tag.trim()).filter(Boolean);
  }, [form.hashtags]);

  const previewLogo = (form.company || "회사").slice(0, 2).toUpperCase();
  const logoSrc = logoPreview || form.logoImageUrl;

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setLogoFileName("");
      setLogoPreview("");
      setLogoFile(null);
      return;
    }
    setLogoFileName(file.name);
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setLogoPreview(typeof reader.result === "string" ? reader.result : "");
    };
    reader.readAsDataURL(file);
  };

  const selectLocation = (value) => {
    setForm((prev) => ({ ...prev, locations: value ? [value] : [] }));
    setLocationOpen(false);
  };

  const removeLocation = (value) => {
    setForm((prev) => ({
      ...prev,
      locations: prev.locations.filter((loc) => loc !== value),
    }));
  };

  const selectCompanySize = (value) => {
    setForm((prev) => ({ ...prev, companySizes: value ? [value] : [] }));
    setSizeOpen(false);
  };

  const removeCompanySize = (value) => {
    setForm((prev) => ({
      ...prev,
      companySizes: prev.companySizes.filter((size) => size !== value),
    }));
  };

  useEffect(() => {
    let mounted = true;
    const fetchPost = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const data = await apiRequest(`/brands/posts/${id}`);
        if (!data) {
          if (mounted) setNotFound(true);
          return;
        }
        if (!mounted) return;
        setForm((prev) => ({
          ...prev,
          company: data.companyName || "",
          oneLiner: data.shortDescription || "",
          locations: data.region ? [data.region] : [],
          companySizes: data.companySize ? [data.companySize] : [],
          logoImageUrl: data.logoImageUrl || "",
          hashtags: Array.isArray(data.hashtags)
            ? [...data.hashtags, "", "", "", "", ""].slice(0, 5)
            : prev.hashtags,
          contactName: data.contactName || "",
          contactEmail: data.contactEmail || "",
          summary: data.companyDescription || "",
        }));
        setLogoPreview(data.logoImageUrl || "");
      } catch (error) {
        console.error(error);
        const status = error?.response?.status;
        if (!mounted) return;
        if (status === 403) {
          alert("수정 권한이 없습니다.");
          navigate(-1);
          return;
        }
        if (status === 404) {
          setNotFound(true);
          return;
        }
        setNotFound(true);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchPost();
    return () => { mounted = false; };
  }, [id, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError("");
    setLoading(true);

    const payload = {
      companyName: form.company.trim(),
      shortDescription: form.oneLiner.trim(),
      region: form.locations[0] || "",
      contactName: form.contactName.trim(),
      contactEmail: form.contactEmail.trim(),
      companyDescription: form.summary.trim(),
      companySize: form.companySizes[0] || "",
      hashtag1: form.hashtags[0] || "",
      hashtag2: form.hashtags[1] || "",
      hashtag3: form.hashtags[2] || "",
      hashtag4: form.hashtags[3] || "",
      hashtag5: form.hashtags[4] || "",
    };

    const formData = new FormData();
    formData.append("data", new Blob([JSON.stringify(payload)], { type: "application/json" }));
    if (logoFile) formData.append("image", logoFile);

    try {
      await apiRequest(`/brands/posts/${id}`, {
        method: "PUT",
        data: formData,
        headers: { "Content-Type": "multipart/form-data" },
      });
      navigate("/investment");
    } catch (error) {
      console.error(error);
      setSubmitError(error?.userMessage || "게시글 수정에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const ok = window.confirm("정말 삭제하시겠습니까?");
    if (!ok) return;
    try {
      await apiRequest(`/brands/posts/${id}`, { method: "DELETE" });
      alert("삭제되었습니다.");
      navigate("/investment");
    } catch (error) {
      console.error(error);
      alert("삭제에 실패했습니다.");
    }
  };

  return (
    <div className="invest-create-page">
      <PolicyModal open={openType === "privacy"} title="개인정보 처리방침" onClose={closeModal}>
        <PrivacyContent />
      </PolicyModal>
      <PolicyModal open={openType === "terms"} title="이용약관" onClose={closeModal}>
        <TermsContent />
      </PolicyModal>

      <SiteHeader onLogout={onLogout} />

      <main className="invest-create-main">
        <section className="invest-create-hero">
          <div>
            <h1 className="invest-create-title">투자 게시글 수정</h1>
            <p className="invest-create-sub">작성한 투자 게시글을 수정하거나 삭제할 수 있습니다.</p>
          </div>
          <div className="invest-create-hero-actions">
            <button type="button" className="btn ghost" onClick={() => navigate("/investment")}>목록으로</button>
          </div>
        </section>

        {loading ? (
          <section className="invest-create-card"><p>불러오는 중...</p></section>
        ) : notFound ? (
          <section className="invest-create-card">
            <p>수정할 게시글을 찾을 수 없습니다.</p>
            <button type="button" className="btn" onClick={() => navigate("/investment")}>목록으로</button>
          </section>
        ) : (
          <section className="invest-create-grid">
            <form id="invest-edit" className="invest-create-card" onSubmit={handleSubmit}>
              <div className="invest-form-row two-col">
                <label className="invest-form-label">
                  회사명
                  <input type="text" value={form.company} onChange={updateField("company")} required />
                </label>
                <label className="invest-form-label">
                  한 줄 소개
                  <input type="text" value={form.oneLiner} onChange={updateField("oneLiner")} />
                </label>
              </div>

              <div className="invest-form-row">
                <label className="invest-form-label">
                  로고 이미지 업로드
                  <input type="file" accept="image/*" onChange={handleLogoChange} />
                </label>
                {logoFileName ? (
                  <div className="invest-form-helper">선택된 파일: {logoFileName}</div>
                ) : logoSrc ? (
                  <div className="invest-form-helper">현재 로고가 등록되어 있습니다.</div>
                ) : null}
              </div>

              {/* 2026-02-03 변경: 지역과 회사 규모를 나란히 배치 */}
              <div className="invest-form-row two-col">
                <label className="invest-form-label">
                  지역
                  <div className="invest-location-select">
                    <div className="invest-location-control" onClick={() => setLocationOpen(!locationOpen)} style={{ cursor: 'pointer'}}
                      >
                      <div className="invest-location-chips">
                        {form.locations.length === 0 ? <span className="placeholder">지역 선택</span> : form.locations.map(loc => (
                          <span key={loc} className="invest-location-chip">{loc}
                            <button type="button" onClick={(e) => { e.stopPropagation(); removeLocation(loc); }}>x</button>
                          </span>
                        ))}
                      </div>
                    </div>
                    {locationOpen && (
                      <div className="invest-location-panel">
                        {LOCATION_OPTIONS.map(loc => (
                          <button key={loc} type="button" className={`invest-location-option ${form.locations.includes(loc) ? "is-selected" : ""}`} onClick={() => selectLocation(loc)}>{loc}</button>
                        ))}
                      </div>
                    )}
                  </div>
                </label>
                <label className="invest-form-label">
                  회사 규모
                  <div className="invest-location-select">
                    <div className="invest-location-control" onClick={() => setSizeOpen(!sizeOpen)} style={{ cursor: 'pointer' }}>
                      <div className="invest-location-chips">
                        {form.companySizes.length === 0 ? <span className="placeholder">규모 선택</span> : form.companySizes.map(size => (
                          <span key={size} className="invest-location-chip">{size}
                            <button type="button" onClick={(e) => { e.stopPropagation(); removeCompanySize(size); }}>x</button>
                          </span>
                        ))}
                      </div>
                    </div>
                    {sizeOpen && (
                      <div className="invest-location-panel">
                        {COMPANY_SIZE_OPTIONS.map(size => (
                          <button key={size} type="button" className={`invest-location-option ${form.companySizes.includes(size) ? "is-selected" : ""}`} onClick={() => selectCompanySize(size)}>{size}</button>
                        ))}
                      </div>
                    )}
                  </div>
                </label>
              </div>

              <div className="invest-form-row">
                <label className="invest-form-label">
                  태그 (최대 5개)
                  <div className="invest-tag-grid">
                    {form.hashtags.map((value, index) => (
                      <input key={index} type="text" value={value} onChange={(e) => {
                        const next = [...form.hashtags];
                        next[index] = e.target.value;
                        setForm({ ...form, hashtags: next });
                      }} placeholder={`태그 ${index + 1}`} />
                    ))}
                  </div>
                </label>
              </div>

              {/* 2026-02-03 변경: 홈페이지 제거 후 담당자 이름과 이메일을 나란히 배치 */}
              <div className="invest-form-row two-col">
                <label className="invest-form-label">
                  담당자 이름
                  <input type="text" value={form.contactName} onChange={updateField("contactName")} />
                </label>
                <label className="invest-form-label">
                  담당자 이메일
                  <input type="email" value={form.contactEmail} onChange={updateField("contactEmail")} />
                </label>
              </div>

              <div className="invest-form-row">
                <label className="invest-form-label">
                  상세 소개
                  <textarea value={form.summary} onChange={updateField("summary")} rows={5} />
                </label>
              </div>

              <div className="invest-form-actions">
                <button type="button" className="btn ghost danger" onClick={handleDelete}>삭제</button>
                <button type="submit" className="btn primary" disabled={loading}>수정 저장</button>
              </div>
              {submitError && <div className="invest-form-error">{submitError}</div>}
            </form>

            <aside className="invest-create-side">
              {/* 2026-02-03 미리보기 카드 레이아웃 유지 */}
              <div className="invest-preview">
                <div className="invest-preview-top">
                  <div className="invest-preview-text">
                    <h3>{form.company || "회사명"}</h3>
                    <p>{form.oneLiner || "한 줄 소개"}</p>
                  </div>
                  <div className="invest-preview-logo">
                    {logoSrc ? <img src={logoSrc} alt="로고" /> : previewLogo}
                  </div>
                </div>
                <div className="invest-preview-tags">
                  {tagList.map(tag => <span key={tag}>#{tag}</span>)}
                </div>
                <div className="invest-preview-bottom">
                  <div className="invest-preview-status">
                    {form.locations[0] || "지역 미선택"}, {form.companySizes[0] || "규모 미선택"}
                  </div>
                </div>
              </div>
            </aside>
          </section>
        )}
      </main>
      <SiteFooter onOpenPolicy={setOpenType} />
    </div>
  );
}
