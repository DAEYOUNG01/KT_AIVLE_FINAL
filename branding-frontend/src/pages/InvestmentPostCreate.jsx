// src/pages/InvestmentPostCreate.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import SiteHeader from "../components/SiteHeader.jsx";
import SiteFooter from "../components/SiteFooter.jsx";
import PolicyModal from "../components/PolicyModal.jsx";
import { PrivacyContent, TermsContent } from "../components/PolicyContents.jsx";
import { apiRequest } from "../api/client.js";

// ✅ 사용자별 localStorage 분리(계정마다 독립 진행)
import {
  userGetItem,
  userSetItem,
  userRemoveItem,
} from "../utils/userLocalStorage.js";
import "../styles/InvestmentPostCreate.css";

const LOCATION_OPTIONS = [
  "수도권",
  "강원도",
  "충남/충북",
  "경남/경북",
  "전남/전북",
  "제주",
];
const COMPANY_SIZE_OPTIONS = [
  "예비 창업 / 개인",
  "스타트업",
  "중소기업",
  "중견기업",
  "대기업",
];
const DRAFT_STORAGE_KEY = "investmentPostDraft";
export default function InvestmentPostCreate({ onLogout }) {
  const navigate = useNavigate();

  const [openType, setOpenType] = useState(null);
  const closeModal = () => setOpenType(null);

  // 2026-02-03
  // 백엔드에 맞춰서 상세주소, 홈페이지 입력란 없앰.
  const [form, setForm] = useState({
    company: "",
    oneLiner: "",
    locations: [],
    companySizes: [],
    hashtags: ["", "", "", "", ""],
    contactName: "",
    contactEmail: "",
    summary: "",
  });
  const [logoFileName, setLogoFileName] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [draftPromptOpen, setDraftPromptOpen] = useState(false);
  const [draftCandidate, setDraftCandidate] = useState(null);
  const [locationOpen, setLocationOpen] = useState(false);
  const [sizeOpen, setSizeOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // ✅ 드롭다운 닫기 UX는 "옵션 선택 시 즉시 닫기"만 사용

  const updateField = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

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

  // ✅ 임시저장/불러오기에서 logoPreview가 dataURL인 경우,
  //    실제 파일 선택 없이도 multipart "image"로 전송 가능하게 변환
  const dataUrlToBlob = (dataUrl) => {
    if (!dataUrl || typeof dataUrl !== "string") return null;
    if (!dataUrl.startsWith("data:")) return null;

    const parts = dataUrl.split(",");
    if (parts.length < 2) return null;

    const meta = parts[0];
    const base64 = parts[1];
    const match = meta.match(/data:(.*);base64/);
    const mime = match?.[1] || "image/png";

    try {
      const binary = atob(base64);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i += 1) bytes[i] = binary.charCodeAt(i);
      return new Blob([bytes], { type: mime });
    } catch {
      return null;
    }
  };

  // ✅ 단일 선택: 지역 1개만 저장 + 옵션 선택 시 즉시 닫기
  const selectLocation = (value) => {
    setForm((prev) => ({
      ...prev,
      locations: value ? [value] : [],
    }));
    setLocationOpen(false);
  };

  const removeLocation = (value) => {
    setForm((prev) => ({
      ...prev,
      locations: prev.locations.filter((loc) => loc !== value),
    }));
  };

  // ✅ 단일 선택: 회사 규모 1개만 저장 + 옵션 선택 시 즉시 닫기
  const selectCompanySize = (value) => {
    setForm((prev) => ({
      ...prev,
      companySizes: value ? [value] : [],
    }));
    setSizeOpen(false);
  };

  const removeCompanySize = (value) => {
    setForm((prev) => ({
      ...prev,
      companySizes: prev.companySizes.filter((size) => size !== value),
    }));
  };

  const tagList = useMemo(() => {
    return form.hashtags.map((tag) => tag.trim()).filter(Boolean);
  }, [form.hashtags]);

  const previewLogo = (form.company || "회사").slice(0, 2).toUpperCase();
  const logoSrc = logoPreview;

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
    formData.append(
      "data",
      new Blob([JSON.stringify(payload)], { type: "application/json" }),
    );
    if (logoFile) {
      formData.append("image", logoFile);
    } else {
      const draftBlob = dataUrlToBlob(logoPreview);
      if (draftBlob) formData.append("image", draftBlob, "draft-logo.webp");
    }

    try {
      await apiRequest("/brands/posts", {
        method: "POST",
        data: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      userRemoveItem(DRAFT_STORAGE_KEY);
      navigate("/investment");
    } catch (error) {
      console.error(error);
      setSubmitError("게시글 등록에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDraftSave = () => {
    try {
      userSetItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({ ...form, logoImageUrl: logoPreview }),
      );
      alert("임시 저장되었습니다.");
    } catch (error) {
      console.error(error);
      alert("임시 저장에 실패했습니다.");
    }
  };

  const applyDraft = (draft) => {
    setForm((prev) => ({
      ...prev,
      ...draft,
      hashtags: Array.isArray(draft?.hashtags)
        ? [...draft.hashtags, "", "", "", "", ""].slice(0, 5)
        : prev.hashtags,
      locations: Array.isArray(draft?.locations)
        ? draft.locations
        : draft?.location
          ? [draft.location]
          : prev.locations,
      companySizes: Array.isArray(draft?.companySizes)
        ? draft.companySizes
        : draft?.companySize
          ? [draft.companySize]
          : prev.companySizes,
    }));
    setLogoPreview(draft?.logoImageUrl || "");
    setLogoFileName("");
    setLogoFile(null);
  };

  const handleDraftLoad = () => {
    if (!draftCandidate) return;
    applyDraft(draftCandidate);
    setDraftPromptOpen(false);
  };

  const handleDraftDiscard = () => {
    try {
      userRemoveItem(DRAFT_STORAGE_KEY);
    } catch (error) {
      console.error(error);
    }
    setDraftCandidate(null);
    setDraftPromptOpen(false);
  };

  useEffect(() => {
    try {
      const saved = userGetItem(DRAFT_STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      setDraftCandidate(parsed);
      setDraftPromptOpen(true);
    } catch (error) {
      console.error(error);
    }
  }, []);

  return (
    <div className="invest-create-page">
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

      <PolicyModal
        open={draftPromptOpen}
        title="임시 저장 불러오기"
        onClose={() => setDraftPromptOpen(false)}
      >
        <p className="invest-draft-text">
          임시 저장된 내용이 있습니다. 불러오시겠습니까?
        </p>
        <div className="invest-draft-actions">
          <button
            type="button"
            className="btn ghost"
            onClick={handleDraftDiscard}
          >
            삭제
          </button>
          <button type="button" className="btn" onClick={handleDraftLoad}>
            불러오기
          </button>
        </div>
      </PolicyModal>

      <SiteHeader onLogout={onLogout} />

      <main className="invest-create-main">
        <section className="invest-create-hero">
          <div>
            <h1 className="invest-create-title">투자 게시글 등록</h1>
            <p className="invest-create-sub">
              투자 라운지에 공유할 기업 정보를 입력해 주세요.
            </p>
          </div>
          <div className="invest-create-hero-actions">
            <button
              type="button"
              className="btn ghost"
              onClick={() => navigate("/investment")}
            >
              목록으로
            </button>
          </div>
        </section>

        <section className="invest-create-grid">
          <form
            id="invest-create"
            className="invest-create-card"
            onSubmit={handleSubmit}
          >
            <div className="invest-form-row two-col">
              <label className="invest-form-label">
                회사명
                <input
                  type="text"
                  value={form.company}
                  onChange={updateField("company")}
                  placeholder="브랜드 파일럿"
                  required
                />
              </label>
              <label className="invest-form-label">
                한 줄 소개
                <input
                  type="text"
                  value={form.oneLiner}
                  onChange={updateField("oneLiner")}
                  placeholder="예: AI 기반 B2B 영업 효율화 SaaS"
                />
              </label>
            </div>

            <div className="invest-form-row">
              <label className="invest-form-label">
                로고 이미지 업로드
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                />
              </label>
              {logoFileName ? (
                <div className="invest-form-helper">
                  선택된 파일: {logoFileName}
                </div>
              ) : null}
            </div>

            {/* ✅ 변경: 지역과 회사 규모를 two-col로 배치 */}
            <div className="invest-form-row two-col">
              <label className="invest-form-label">
                지역
                <div className="invest-location-select">
                  <button
                    type="button"
                    className="invest-location-control"
                    onClick={() => setLocationOpen((prev) => !prev)}
                    aria-expanded={locationOpen ? "true" : "false"}
                  >
                    <div className="invest-location-chips">
                      {form.locations.length === 0 ? (
                        <span className="placeholder">지역을 선택하세요</span>
                      ) : (
                        form.locations.map((loc) => (
                          <span key={loc} className="invest-location-chip">
                            {loc}
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                removeLocation(loc);
                              }}
                              aria-label={`${loc} 제거`}
                            >
                              x
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                    <span className={`chev ${locationOpen ? "is-open" : ""}`}>
                      ▾
                    </span>
                  </button>
                  {locationOpen ? (
                    <div className="invest-location-panel">
                      {LOCATION_OPTIONS.map((loc) => {
                        const selected = form.locations.includes(loc);
                        return (
                          <button
                            key={loc}
                            type="button"
                            className={`invest-location-option ${
                              selected ? "is-selected" : ""
                            }`}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              selectLocation(loc);
                            }}
                          >
                            {loc}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </label>
              <label className="invest-form-label">
                회사 규모
                <div className="invest-location-select">
                  <button
                    type="button"
                    className="invest-location-control"
                    onClick={() => setSizeOpen((prev) => !prev)}
                    aria-expanded={sizeOpen ? "true" : "false"}
                  >
                    <div className="invest-location-chips">
                      {form.companySizes.length === 0 ? (
                        <span className="placeholder">
                          회사 규모를 선택하세요
                        </span>
                      ) : (
                        form.companySizes.map((size) => (
                          <span key={size} className="invest-location-chip">
                            {size}
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                removeCompanySize(size);
                              }}
                              aria-label={`${size} 제거`}
                            >
                              x
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                    <span className={`chev ${sizeOpen ? "is-open" : ""}`}>
                      ▾
                    </span>
                  </button>
                  {sizeOpen ? (
                    <div className="invest-location-panel">
                      {COMPANY_SIZE_OPTIONS.map((size) => {
                        const selected = form.companySizes.includes(size);
                        return (
                          <button
                            key={size}
                            type="button"
                            className={`invest-location-option ${
                              selected ? "is-selected" : ""
                            }`}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              selectCompanySize(size);
                            }}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </label>
            </div>

            <div className="invest-form-row">
              <label className="invest-form-label">
                태그 (최대 5개)
                <div className="invest-tag-grid">
                  {form.hashtags.map((value, index) => (
                    <input
                      key={`hashtag-${index}`}
                      type="text"
                      value={value}
                      onChange={(event) => {
                        const next = [...form.hashtags];
                        next[index] = event.target.value;
                        setForm((prev) => ({ ...prev, hashtags: next }));
                      }}
                      placeholder={`해시태그 ${index + 1}`}
                    />
                  ))}
                </div>
              </label>
            </div>

            {/* ✅ 변경: 담당자 이름과 이메일을 two-col로 배치 (홈페이지 제거됨) */}
            <div className="invest-form-row two-col">
              <label className="invest-form-label">
                담당자 이름
                <input
                  type="text"
                  value={form.contactName}
                  onChange={updateField("contactName")}
                  placeholder="홍길동"
                />
              </label>
              <label className="invest-form-label">
                담당자 이메일
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={updateField("contactEmail")}
                  placeholder="contact@brandpilot.kr"
                />
              </label>
            </div>

            <div className="invest-form-row">
              <label className="invest-form-label">
                상세 소개
                <textarea
                  value={form.summary}
                  onChange={updateField("summary")}
                  placeholder={`아래 질문을 참고해 자유롭게 작성해 주세요.
• 어떤 문제를 해결하고 있나요?
• 누구를 위한 서비스인가요?
• 어떻게 수익을 만들고 있나요?
• 현재까지의 성과(고객, 매출, 지표 등)는 무엇인가요?
• 앞으로 어떤 성장을 계획하고 있나요?`}
                  rows={6}
                />
              </label>
            </div>

            <div className="invest-form-actions">
              <button
                type="button"
                className="btn ghost"
                onClick={handleDraftSave}
              >
                임시 저장
              </button>
              <button type="submit" className="btn primary" disabled={loading}>
                등록하기
              </button>
            </div>
            {submitError ? (
              <div className="invest-form-error">{submitError}</div>
            ) : null}
          </form>

          <aside className="invest-create-side">
            <div className="invest-preview">
              <div className="invest-preview-top">
                <div className="invest-preview-text">
                  <h3>{form.company || "회사명 입력"}</h3>
                  <p className="invest-preview-oneliner">
                    {form.oneLiner || "한 줄 소개가 표시됩니다."}
                  </p>
                </div>
                <div className="invest-preview-logo" aria-hidden="true">
                  {logoSrc ? (
                    <img src={logoSrc} alt="로고 미리보기" />
                  ) : (
                    previewLogo
                  )}
                </div>
              </div>
              <div className="invest-preview-tags">
                {tagList.length === 0 ? (
                  <span className="empty">태그를 입력해 주세요.</span>
                ) : (
                  tagList.map((tag) => <span key={tag}>#{tag}</span>)
                )}
              </div>
              <div className="invest-preview-bottom">
                <div className="invest-preview-status">
                  {form.locations.length
                    ? form.locations.join(", ")
                    : "지역 미선택"}
                  ,{" "}
                  {form.companySizes.length
                    ? form.companySizes.join(", ")
                    : "회사 규모 미선택"}
                </div>
                <button type="button" className="invest-preview-link">
                  ↗
                </button>
              </div>
            </div>

            <div className="invest-guide">
              <h4>작성 가이드</h4>
              <ul>
                <li>
                  회사명과 한 줄 소개는 투자자가 한눈에 이해할 수 있게 작성해
                  주세요.
                </li>
                <li>태그는 핵심 키워드 위주로 최대 5개까지 입력해 주세요.</li>
                <li>로고 이미지를 입력하면 게시글 완성도가 높아집니다.</li>
              </ul>
            </div>
          </aside>
        </section>
      </main>

      <SiteFooter onOpenPolicy={setOpenType} />
    </div>
  );
}
