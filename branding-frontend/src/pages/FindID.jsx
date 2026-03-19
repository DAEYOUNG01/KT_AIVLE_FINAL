// src/pages/FindID.jsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import SiteFooter from "../components/SiteFooter.jsx";
import "../styles/FindID.css";

/**
 * [FindID] 아이디 찾기 페이지 (프론트-only)
 * - 이름 + 휴대폰 번호로 가입된 "아이디"를 확인(마스킹 표시)
 */
export default function FindID() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // ✅ maskedEmail → maskedId로 변경
  const [maskedId, setMaskedId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  const isPhoneLike = useMemo(() => {
    const onlyNum = phone.replace(/\D/g, "");
    return onlyNum.length >= 10 && onlyNum.length <= 11;
  }, [phone]);

  /**
   * ✅ 아이디 마스킹
   * - 예: brandpilot_01 → br********
   */
  const maskId = (rawId) => {
    const v = String(rawId || "").trim();
    if (!v) return "";
    if (v.length <= 1) return "*";
    if (v.length === 2) return `${v[0]}*`;
    const keep = 2;
    return `${v.slice(0, keep)}${"*".repeat(v.length - keep)}`;
  };

  const resetAlerts = () => {
    setError("");
    setMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    resetAlerts();
    setMaskedId("");

    const safeName = name.trim();
    if (!safeName) return setError("이름을 입력해주세요.");
    if (!phone.trim()) return setError("휴대폰 번호를 입력해주세요.");
    if (!isPhoneLike)
      return setError("휴대폰 번호는 숫자만 10~11자리로 입력해주세요.");

    setLoading(true);
    try {
      // ✅ 프론트-only mock
      const phoneNormalized = phone.replace(/\D/g, "");

      // 이름 기반으로 mock id 만들기(공백 제거 + 소문자 + 마지막 2자리)
      const base = safeName.replace(/\s+/g, "").toLowerCase();
      const cleanBase = base.replace(/[^a-z0-9_]/g, "") || "user";
      const mockId = `${cleanBase}_${phoneNormalized.slice(-2)}`;

      setMaskedId(maskId(mockId));
      setMessage("입력하신 정보로 가입된 아이디를 확인했습니다.");
    } catch {
      setError("아이디 조회에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const locked = Boolean(maskedId);

  return (
    <div className="findid-page">
      <main className="findid-card">
        <h1 className="findid-title">아이디 찾기</h1>

        <p className="findid-sub">
          회원가입 시 입력한 <strong>이름</strong>과{" "}
          <strong>휴대폰 번호</strong>로 가입된 아이디를 확인합니다.
        </p>

        {message ? <p className="notice">{message}</p> : null}
        {error ? <p className="error">{error}</p> : null}

        <form className="findid-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="findid-name">이름</label>
            <input
              id="findid-name"
              type="text"
              placeholder="실명 입력"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              disabled={loading || locked}
            />
          </div>

          <div className="field">
            <label htmlFor="findid-phone">휴대폰 번호</label>
            <input
              id="findid-phone"
              type="tel"
              placeholder="- 없이 입력해주세요"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              disabled={loading || locked}
            />
            <small className="helper">
              보안상 아이디 전체는 노출되지 않으며 일부 마스킹 처리됩니다.
            </small>
          </div>

          {maskedId ? (
            <div className="resultBox" role="status" aria-live="polite">
              <div className="resultTop">
                <span className="resultBadge">확인 완료</span>
                <span className="resultLabel">확인된 아이디</span>
              </div>
              <div className="resultValue">{maskedId}</div>
              <div className="resultHint">
                보안상 아이디는 일부 마스킹되어 표시됩니다.
              </div>
            </div>
          ) : null}

          {!maskedId ? (
            <button type="submit" className="primary" disabled={loading}>
              {loading ? "조회 중..." : "확인"}
            </button>
          ) : null}

          <button
            type="button"
            className="primary"
            onClick={() => navigate("/login")}
            disabled={loading}
          >
            로그인 페이지로 이동
          </button>
        </form>
      </main>

      <SiteFooter />
    </div>
  );
}
