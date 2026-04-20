import React, { useEffect, useState } from "react";
import AppInput from "../common/AppInput";
import AppButton from "../common/AppButton";
import TermsSection from "./agreement/TermsSection";
import TermsModal from "./agreement/TermsModal";
import { TERMS_CONTENT } from "./agreement/termsData";

const SignupForm = ({ onSignup }) => {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [agreeService, setAgreeService] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [activeTermsKey, setActiveTermsKey] = useState(null);

  const [isEmailAvailable, setIsEmailAvailable] = useState(false);
  const [hasCheckedEmail, setHasCheckedEmail] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const [message, setMessage] = useState("");
  const [isMessageSuccess, setIsMessageSuccess] = useState(false);

  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const agreeAll = agreeService && agreePrivacy && marketingConsent;

  const validatePassword = (value) =>
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(
      value,
    );

  useEffect(() => {
    let interval = null;

    if (isTimerRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }

    if (timer === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      if (!isVerified) {
        setMessage("인증 시간이 만료되었습니다. 다시 요청해 주세요.");
        setIsMessageSuccess(false);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timer, isVerified]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainSeconds = seconds % 60;
    return `${minutes}:${String(remainSeconds).padStart(2, "0")}`;
  };

  const handleAgreeAllChange = () => {
    const nextValue = !agreeAll;
    setAgreeService(nextValue);
    setAgreePrivacy(nextValue);
    setMarketingConsent(nextValue);
  };

  const handleToggleService = () => {
    setAgreeService((prev) => !prev);
  };

  const handleTogglePrivacy = () => {
    setAgreePrivacy((prev) => !prev);
  };

  const handleToggleMarketing = () => {
    setMarketingConsent((prev) => !prev);
  };

  const openTermsModal = (termsKey) => {
    setActiveTermsKey(termsKey);
  };

  const closeTermsModal = () => {
    setActiveTermsKey(null);
  };

  const handleAgreeFromModal = () => {
    if (activeTermsKey === "service") {
      setAgreeService(true);
    }

    if (activeTermsKey === "privacy") {
      setAgreePrivacy(true);
    }

    if (activeTermsKey === "marketing") {
      setMarketingConsent(true);
    }

    closeTermsModal();
  };

  const resetEmailFlow = () => {
    setHasCheckedEmail(false);
    setIsEmailAvailable(false);
    setIsVerified(false);
    setCode("");
    setTimer(0);
    setIsTimerRunning(false);
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    resetEmailFlow();
  };

  const handleCheckEmail = async () => {
    if (!email.trim()) {
      setMessage("이메일을 입력해 주세요.");
      setIsMessageSuccess(false);
      return;
    }

    try {
      setIsCheckingEmail(true);

      const params = new URLSearchParams({ email: email.trim() });
      const res = await fetch(
        `/users/check-email?${params.toString()}`,
      );
      const data = await res.text();
      const available = res.ok && data.includes("사용 가능");

      setHasCheckedEmail(true);
      setIsEmailAvailable(available);
      setIsVerified(false);
      setCode("");
      setTimer(0);
      setIsTimerRunning(false);
      setMessage(data);
      setIsMessageSuccess(available);
    } catch (error) {
      setHasCheckedEmail(false);
      setIsEmailAvailable(false);
      setMessage("이메일 중복 확인 중 오류가 발생했습니다.");
      setIsMessageSuccess(false);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleSendCode = async () => {
    if (!hasCheckedEmail || !isEmailAvailable) {
      setMessage("이메일 중복 확인을 먼저 완료해 주세요.");
      setIsMessageSuccess(false);
      return;
    }

    try {
      setIsSendingCode(true);

      const res = await fetch("/email/send/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      setMessage(data.message);
      setIsMessageSuccess(!!data.success);

      if (data.success) {
        setTimer(data.remainingSeconds || 300);
        setIsTimerRunning(true);
        setIsVerified(false);
      }
    } catch (error) {
      setMessage("인증번호 발송 중 오류가 발생했습니다.");
      setIsMessageSuccess(false);
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code.trim()) {
      setMessage("인증번호를 입력해 주세요.");
      setIsMessageSuccess(false);
      return;
    }

    try {
      setIsVerifyingCode(true);

      const res = await fetch("/email/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          code: code.trim(),
        }),
      });

      const data = await res.json();

      setMessage(data.message);
      setIsMessageSuccess(!!data.success);

      if (data.success) {
        setIsVerified(true);
        setIsTimerRunning(false);
      }
    } catch (error) {
      setMessage("인증번호 확인 중 오류가 발생했습니다.");
      setIsMessageSuccess(false);
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const submitDirectly = async () => {
    const res = await fetch("/users/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.trim(),
        password,
        nickname: nickname.trim(),
        marketingConsent,
      }),
    });

    const data = await res.text();
    alert(data);
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!hasCheckedEmail || !isEmailAvailable) {
      setMessage("이메일 중복 확인을 먼저 완료해 주세요.");
      setIsMessageSuccess(false);
      return;
    }

    if (!isVerified) {
      setMessage("이메일 인증을 먼저 완료해 주세요.");
      setIsMessageSuccess(false);
      return;
    }

    if (!nickname.trim()) {
      setMessage("닉네임을 입력해 주세요.");
      setIsMessageSuccess(false);
      return;
    }

    if (!agreeService || !agreePrivacy) {
      setMessage("필수 약관에 동의해 주세요.");
      setIsMessageSuccess(false);
      return;
    }

    if (!validatePassword(password)) {
      setMessage("비밀번호는 8자 이상이며 영문, 숫자, 특수문자를 포함해야 합니다.");
      setIsMessageSuccess(false);
      return;
    }

    if (password !== passwordConfirm) {
      setMessage("비밀번호가 일치하지 않습니다.");
      setIsMessageSuccess(false);
      return;
    }

    try {
      setIsSubmitting(true);

      const form = {
        email: email.trim(),
        password,
        nickname: nickname.trim(),
        marketingConsent,
      };

      if (onSignup) {
        await onSignup(form);
      } else {
        await submitDirectly();
      }
    } catch (error) {
      setMessage("회원가입 처리 중 오류가 발생했습니다.");
      setIsMessageSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="form-box signup-form" onSubmit={handleSignup}>
      <h3 className="section-title">회원가입</h3>

      <div className="input-group">
        <label className="input-label">이메일</label>
        <div className="signup-inline-group">
          <div className="input-wrapper signup-inline-field">
            <span className="input-icon">✉️</span>
            <input
              className="custom-input"
              type="email"
              placeholder="이메일을 입력하세요"
              value={email}
              onChange={handleEmailChange}
              disabled={isVerified}
            />
          </div>
          <button
            type="button"
            className="inline-action-button"
            onClick={handleCheckEmail}
            disabled={isVerified || isCheckingEmail}
          >
            {isCheckingEmail ? "확인 중..." : "중복체크"}
          </button>
        </div>
      </div>

      {message && (
        <p
          className={`signup-status ${isMessageSuccess ? "signup-status--success" : "signup-status--error"
            }`}
        >
          {message}
        </p>
      )}

      <div className="signup-action-row">
        <AppButton
          type="button"
          variant="primary"
          fullWidth
          onClick={handleSendCode}
          disabled={isVerified || isSendingCode}
        >
          {isSendingCode ? "전송 중..." : "인증번호 보내기"}
        </AppButton>
      </div>

      <AppInput
        label="인증번호"
        placeholder="인증번호를 입력하세요"
        icon="🔐"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        disabled={isVerified}
      />

      {(isTimerRunning || isVerified) && (
        <div className="signup-meta-row">
          {isTimerRunning && !isVerified ? (
            <p className="helper-text error">남은 시간 {formatTime(timer)}</p>
          ) : (
            <p className="helper-text success">이메일 인증이 완료되었습니다.</p>
          )}
        </div>
      )}

      <AppButton
        type="button"
        variant="primary"
        fullWidth
        onClick={handleVerifyCode}
        disabled={isVerified || isVerifyingCode}
      >
        {isVerified
          ? "인증 완료"
          : isVerifyingCode
            ? "확인 중..."
            : "인증번호 확인"}
      </AppButton>

      <AppInput
        label="닉네임"
        name="nickname"
        placeholder="닉네임을 입력하세요"
        icon="🙂"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
      />

      <AppInput
        label="비밀번호"
        name="password"
        type="password"
        placeholder="비밀번호를 입력하세요"
        icon="🔒"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <p className="helper-text">
        비밀번호는 8자 이상, 영문·숫자·특수문자를 포함해야 합니다.
      </p>

      <AppInput
        label="비밀번호 확인"
        name="passwordConfirm"
        type="password"
        placeholder="비밀번호를 다시 입력하세요"
        icon="🔑"
        value={passwordConfirm}
        onChange={(e) => setPasswordConfirm(e.target.value)}
      />

      <TermsSection
        agreeAll={agreeAll}
        agreeService={agreeService}
        agreePrivacy={agreePrivacy}
        agreeMarketing={marketingConsent}
        onAgreeAllChange={handleAgreeAllChange}
        onToggleService={handleToggleService}
        onTogglePrivacy={handleTogglePrivacy}
        onToggleMarketing={handleToggleMarketing}
        onOpenServiceTerms={() => openTermsModal("service")}
        onOpenPrivacyTerms={() => openTermsModal("privacy")}
        onOpenMarketingTerms={() => openTermsModal("marketing")}
      />

      <AppButton type="submit" variant="primary" fullWidth disabled={isSubmitting}>
        {isSubmitting ? "처리 중..." : "회원가입"}
      </AppButton>

      <TermsModal
        open={!!activeTermsKey}
        title={activeTermsKey ? TERMS_CONTENT[activeTermsKey].title : ""}
        content={activeTermsKey ? TERMS_CONTENT[activeTermsKey].content : ""}
        onClose={closeTermsModal}
        onAgree={handleAgreeFromModal}
      />
    </form>
  );
};

export default SignupForm;
