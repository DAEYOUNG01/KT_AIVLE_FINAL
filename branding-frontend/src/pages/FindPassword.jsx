// src/pages/FindPassword.jsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import SiteFooter from "../components/SiteFooter.jsx";
import "../styles/FindPassword.css";

export default function FindPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState("request");

  // ✅ userId는 이제 "아이디"
  const [userId, setUserId] = useState("");
  const [phone, setPhone] = useState("");

  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState("");

  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const pageTitle = useMemo(() => {
    if (step === "reset") return "비밀번호 재설정";
    if (step === "done") return "비밀번호 재설정 완료";
    return "비밀번호 찾기";
  }, [step]);

  // ✅ VALIDATION: id 규칙(프론트-only)
  const isIdLike = useMemo(() => {
    const v = userId.trim();
    return /^[a-zA-Z0-9_]{4,20}$/.test(v);
  }, [userId]);

  const isPhoneLike = useMemo(() => {
    const onlyNum = phone.replace(/\D/g, "");
    return onlyNum.length >= 10 && onlyNum.length <= 11;
  }, [phone]);

  const pwRules = useMemo(() => {
    const v = newPw;
    return {
      lenOk: v.length >= 8,
      upperOk: /[A-Z]/.test(v),
      numOk: /\d/.test(v),
      specialOk: /[^a-zA-Z0-9]/.test(v),
    };
  }, [newPw]);

  const pwValid =
    pwRules.lenOk && pwRules.upperOk && pwRules.numOk && pwRules.specialOk;

  const pwMatch = useMemo(
    () => newPw && newPw2 && newPw === newPw2,
    [newPw, newPw2],
  );

  const resetAlerts = () => {
    setMessage("");
    setError("");
  };

  // (1) 인증코드 발송 (프론트-only)
  const handleRequest = async (e) => {
    e.preventDefault();
    resetAlerts();

    if (!userId.trim()) return setError("아이디를 입력해주세요.");
    if (!isIdLike)
      return setError("아이디는 4~20자, 영문/숫자/_ 형태로 입력해주세요.");

    if (!phone.trim()) return setError("휴대폰 번호를 입력해주세요.");
    if (!isPhoneLike)
      return setError("휴대폰 번호는 숫자만 10~11자리로 입력해주세요.");

    setLoading(true);
    try {
      const phoneNormalized = phone.replace(/\D/g, "");
      setSentTo(`${userId.trim()} / ${phoneNormalized}`);
      setStep("verify");
      setMessage("인증코드를 발송했습니다. (테스트)");
    } catch {
      setError("인증코드 발송에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  // (2) 인증코드 확인 (프론트-only)
  const handleVerify = async (e) => {
    e.preventDefault();
    resetAlerts();

    if (!code.trim()) return setError("인증코드를 입력해주세요.");

    setLoading(true);
    try {
      setStep("reset");
      setMessage("인증이 완료되었습니다. 새 비밀번호를 설정해주세요.");
    } catch {
      setError("인증코드가 올바르지 않습니다. 다시 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  // (3) 새 비밀번호 재설정 (프론트-only)
  const handleReset = async (e) => {
    e.preventDefault();
    resetAlerts();

    if (!pwValid) {
      return setError(
        "비밀번호는 8자 이상이며 대문자/숫자/특수문자를 포함해야 합니다.",
      );
    }
    if (!pwMatch) return setError("비밀번호 확인이 일치하지 않습니다.");

    setLoading(true);
    try {
      setStep("done");
      setMessage("비밀번호가 재설정되었습니다. 로그인 페이지로 이동해주세요.");
    } catch {
      setError("비밀번호 재설정에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    resetAlerts();
    setLoading(true);
    try {
      setMessage("인증코드를 재발송했습니다. (테스트)");
    } catch {
      setError("재발송에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const goBackToRequest = () => {
    resetAlerts();
    setStep("request");
    setCode("");
    setNewPw("");
    setNewPw2("");
  };

  return (
    <div className="findpw-page">
      <main className="findpw-card">
        <h1 className="findpw-title">{pageTitle}</h1>

        <div className="stepper" aria-label="비밀번호 찾기 단계">
          <div
            className={`step ${step === "request" ? "active" : ""} ${
              step !== "request" ? "done" : ""
            }`}
          >
            <span className="dot" /> 정보 입력
          </div>
          <div
            className={`step ${step === "verify" ? "active" : ""} ${
              step === "reset" || step === "done" ? "done" : ""
            }`}
          >
            <span className="dot" /> 인증
          </div>
          <div
            className={`step ${step === "reset" ? "active" : ""} ${
              step === "done" ? "done" : ""
            }`}
          >
            <span className="dot" /> 새 비밀번호
          </div>
        </div>

        {sentTo && step !== "request" ? (
          <p className="subinfo">
            대상: <strong>{sentTo}</strong>
          </p>
        ) : null}

        {message ? <p className="notice">{message}</p> : null}
        {error ? <p className="error">{error}</p> : null}

        {/* STEP 1 */}
        {step === "request" && (
          <form className="findpw-form" onSubmit={handleRequest}>
            <div className="field">
              <label htmlFor="findpw-id">아이디</label>
              <input
                id="findpw-id"
                type="text"
                placeholder="아이디 입력"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                autoComplete="username"
              />
              <small className="helper">
                4~20자, 영문/숫자/_ 형태의 아이디를 입력해주세요.
              </small>
            </div>

            <div className="field">
              <label htmlFor="findpw-phone">휴대폰 번호</label>
              <input
                id="findpw-phone"
                type="tel"
                placeholder="- 없이 숫자만 입력"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
              />
              <small className="helper">인증코드(SMS)가 발송됩니다.</small>
            </div>

            <button type="submit" className="primary" disabled={loading}>
              {loading ? "발송 중..." : "인증코드 발송"}
            </button>

            <button
              type="button"
              className="secondary"
              onClick={() => navigate("/login")}
              disabled={loading}
            >
              로그인 페이지로 이동
            </button>
          </form>
        )}

        {/* STEP 2 */}
        {step === "verify" && (
          <form className="findpw-form" onSubmit={handleVerify}>
            <div className="field">
              <label htmlFor="findpw-code">인증코드</label>
              <input
                id="findpw-code"
                type="text"
                inputMode="numeric"
                placeholder="6자리 인증코드 입력"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <small className="helper">
                문자로 받은 인증코드를 입력해주세요.
              </small>
            </div>

            <button type="submit" className="primary" disabled={loading}>
              {loading ? "확인 중..." : "인증 확인"}
            </button>

            <div className="row">
              <button
                type="button"
                className="secondary"
                onClick={handleResend}
                disabled={loading}
              >
                인증코드 재발송
              </button>
              <button
                type="button"
                className="secondary"
                onClick={goBackToRequest}
                disabled={loading}
              >
                정보 다시 입력
              </button>
            </div>
          </form>
        )}

        {/* STEP 3 */}
        {step === "reset" && (
          <form className="findpw-form" onSubmit={handleReset}>
            <div className="field">
              <label htmlFor="newpw">새 비밀번호</label>
              <input
                id="newpw"
                type="password"
                placeholder="새 비밀번호 입력"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                autoComplete="new-password"
              />
              <small className="helper">
                8자 이상 · 대문자/숫자/특수문자 포함
              </small>

              <div className="checkline">
                <span className={`pill ${pwRules.lenOk ? "ok" : ""}`}>
                  8자+
                </span>
                <span className={`pill ${pwRules.upperOk ? "ok" : ""}`}>
                  대문자
                </span>
                <span className={`pill ${pwRules.numOk ? "ok" : ""}`}>
                  숫자
                </span>
                <span className={`pill ${pwRules.specialOk ? "ok" : ""}`}>
                  특수문자
                </span>
              </div>
            </div>

            <div className="field">
              <label htmlFor="newpw2">새 비밀번호 확인</label>
              <input
                id="newpw2"
                type="password"
                placeholder="새 비밀번호 재입력"
                value={newPw2}
                onChange={(e) => setNewPw2(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <div className="checkline">
              <span className={`pill ${pwValid ? "ok" : ""}`}>규칙 충족</span>
              <span className={`pill ${pwMatch ? "ok" : ""}`}>일치</span>
            </div>

            <button type="submit" className="primary" disabled={loading}>
              {loading ? "저장 중..." : "비밀번호 재설정"}
            </button>

            <button
              type="button"
              className="secondary"
              onClick={() => navigate("/login")}
              disabled={loading}
            >
              취소하고 로그인
            </button>
          </form>
        )}

        {/* DONE */}
        {step === "done" && (
          <div className="done">
            <p className="done-title">완료!</p>
            <p className="done-desc">
              비밀번호 재설정이 완료되었습니다.
              <br />새 비밀번호로 로그인해주세요.
            </p>
            <button
              className="primary"
              type="button"
              onClick={() => navigate("/login")}
            >
              로그인 페이지로 이동
            </button>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
