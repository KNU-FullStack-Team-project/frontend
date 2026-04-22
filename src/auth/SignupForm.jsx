import React, { useEffect, useState } from "react";
import AppInput from "../common/AppInput";
import AppButton from "../common/AppButton";
import TermsSection from "./agreement/TermsSection";
import TermsModal from "./agreement/TermsModal";
import { TERMS_CONTENT } from "./agreement/termsData";

const SignupForm = ({ onSignup, onSocialSignup, socialSignupData = null }) => {
  const isSocialSignup = !!socialSignupData?.credential;
  const nicknamePlaceholder = socialSignupData?.rejoinCandidate
    ? "새 닉네임을 입력하세요"
    : "닉네임을 입력하세요";

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
      value
    );

  useEffect(() => {
    if (!isSocialSignup) {
      return;
    }

    setEmail(socialSignupData.email || "");
    setNickname(socialSignupData.nickname || "");
    setHasCheckedEmail(true);
    setIsEmailAvailable(true);
    setIsVerified(true);
    setMessage(
      socialSignupData.rejoinCandidate
        ? "다시 돌아오신 것을 환영합니다. 닉네임과 약관 동의 후 재가입을 마무리해 주세요."
        : "구글 계정 확인이 완료되었습니다. 닉네임과 약관 동의 후 가입을 마무리해 주세요."
    );
    setIsMessageSuccess(true);
    setCode("");
    setTimer(0);
    setIsTimerRunning(false);
  }, [isSocialSignup, socialSignupData]);

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

  const openTermsModal = (termsKey) => setActiveTermsKey(termsKey);
  const closeTermsModal = () => setActiveTermsKey(null);

  const handleAgreeFromModal = () => {
    if (activeTermsKey === "service") setAgreeService(true);
    if (activeTermsKey === "privacy") setAgreePrivacy(true);
    if (activeTermsKey === "marketing") setMarketingConsent(true);
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
      const res = await fetch(`/users/check-email?${params.toString()}`);
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

  const handleSignup = async (e) => {
    e.preventDefault();

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

    if (!isSocialSignup) {
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
    }

    try {
      setIsSubmitting(true);

      if (isSocialSignup) {
        await onSocialSignup({
          credential: socialSignupData.credential,
          nickname: nickname.trim(),
          marketingConsent,
        });
        return;
      }

      await onSignup({
        email: email.trim(),
        password,
        nickname: nickname.trim(),
        marketingConsent,
      });
    } catch (error) {
      setMessage("회원가입 처리 중 오류가 발생했습니다.");
      setIsMessageSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="form-box signup-form" onSubmit={handleSignup}>
      <h3 className="section-title">
        {isSocialSignup ? "간편회원가입" : "회원가입"}
      </h3>

      <AppInput
        label="이메일"
        name="email"
        placeholder="이메일을 입력하세요"
        icon="✉️"
        value={email}
        onChange={handleEmailChange}
        disabled={isSocialSignup || isVerified}
      />

      {!isSocialSignup && (
        <>
          <div className="signup-action-row">
            <AppButton
              type="button"
              variant="primary"
              fullWidth
              onClick={handleCheckEmail}
              disabled={isVerified || isCheckingEmail}
            >
              {isCheckingEmail ? "확인 중..." : "이메일 중복 확인"}
            </AppButton>
          </div>

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
            name="code"
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
        </>
      )}

      {message && (
        <p
          className={`signup-status ${
            isMessageSuccess ? "signup-status--success" : "signup-status--error"
          }`}
        >
          {message}
        </p>
      )}

      <AppInput
        label="닉네임"
        name="nickname"
        placeholder={nicknamePlaceholder}
        icon="👤"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
      />

      {!isSocialSignup && (
        <>
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
            비밀번호는 8자 이상이며 영문, 숫자, 특수문자를 포함해야 합니다.
          </p>

          <AppInput
            label="비밀번호 확인"
            name="passwordConfirm"
            type="password"
            placeholder="비밀번호를 다시 입력하세요"
            icon="🔏"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
          />
        </>
      )}

      <TermsSection
        agreeAll={agreeAll}
        agreeService={agreeService}
        agreePrivacy={agreePrivacy}
        agreeMarketing={marketingConsent}
        onAgreeAllChange={handleAgreeAllChange}
        onToggleService={() => setAgreeService((prev) => !prev)}
        onTogglePrivacy={() => setAgreePrivacy((prev) => !prev)}
        onToggleMarketing={() => setMarketingConsent((prev) => !prev)}
        onOpenServiceTerms={() => openTermsModal("service")}
        onOpenPrivacyTerms={() => openTermsModal("privacy")}
        onOpenMarketingTerms={() => openTermsModal("marketing")}
      />

      <AppButton type="submit" variant="primary" fullWidth disabled={isSubmitting}>
        {isSubmitting
          ? "처리 중..."
          : isSocialSignup
            ? "간편회원가입 완료"
            : "회원가입"}
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
