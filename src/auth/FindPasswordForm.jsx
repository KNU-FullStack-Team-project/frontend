import React, { useEffect, useState } from "react";
import AppInput from "../common/AppInput";
import AppButton from "../common/AppButton";

const FindPasswordForm = () => {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");

  const [isVerified, setIsVerified] = useState(false);
  const [message, setMessage] = useState("");
  const [isMessageSuccess, setIsMessageSuccess] = useState(false);

  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

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
        setMessage("인증시간이 만료되었습니다. 다시 요청해주세요.");
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

  const resetVerificationState = () => {
    setCode("");
    setIsVerified(false);
    setTimer(0);
    setIsTimerRunning(false);
    setMessage("");
    setIsMessageSuccess(false);
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    resetVerificationState();
  };

  const handleSendCode = async () => {
    if (!email.trim()) {
      setMessage("이메일을 입력해주세요.");
      setIsMessageSuccess(false);
      return;
    }

    try {
      const res = await fetch(
        "http://localhost:8081/email/send/password-reset",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
          }),
        },
      );

      const data = await res.json();

      setMessage(data.message);
      setIsMessageSuccess(!!data.success);

      if (data.success) {
        setTimer(data.remainingSeconds || 300);
        setIsTimerRunning(true);
        setIsVerified(false);
      }
    } catch (error) {
      console.error(error);
      setMessage("인증번호 발송 중 오류가 발생했습니다.");
      setIsMessageSuccess(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!email.trim()) {
      setMessage("이메일을 입력해주세요.");
      setIsMessageSuccess(false);
      return;
    }

    if (!code.trim()) {
      setMessage("인증번호를 입력해주세요.");
      setIsMessageSuccess(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:8081/email/verify", {
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
      } else {
        setIsVerified(false);
      }
    } catch (error) {
      console.error(error);
      setMessage("인증번호 확인 중 오류가 발생했습니다.");
      setIsMessageSuccess(false);
    }
  };

  const handleResetPassword = async () => {
    if (!isVerified) {
      setMessage("이메일 인증을 먼저 완료해주세요.");
      setIsMessageSuccess(false);
      return;
    }

    if (!newPassword || !newPasswordConfirm) {
      setMessage("새 비밀번호를 입력해주세요.");
      setIsMessageSuccess(false);
      return;
    }

    if (!validatePassword(newPassword)) {
      setMessage("비밀번호는 8자 이상, 영문/숫자/특수문자를 포함해야 합니다.");
      setIsMessageSuccess(false);
      return;
    }

    if (newPassword !== newPasswordConfirm) {
      setMessage("새 비밀번호가 일치하지 않습니다.");
      setIsMessageSuccess(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:8081/users/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          newPassword,
        }),
      });

      const data = await res.text();

      alert(data);

      if (data.includes("변경") || data.includes("재설정")) {
        setNewPassword("");
        setNewPasswordConfirm("");
        setCode("");
        setTimer(0);
        setIsTimerRunning(false);
      }
    } catch (error) {
      console.error(error);
      setMessage("비밀번호 재설정 중 오류가 발생했습니다.");
      setIsMessageSuccess(false);
    }
  };

  return (
    <div className="form-box">
      <h3 className="section-title">비밀번호 찾기</h3>

      <AppInput
        label="이메일"
        name="email"
        type="email"
        value={email}
        onChange={handleEmailChange}
        placeholder="가입한 이메일을 입력하세요"
        icon="📧"
        disabled={isVerified}
      />

      <AppButton
        type="button"
        fullWidth
        onClick={handleSendCode}
        disabled={isVerified}
      >
        인증번호 보내기
      </AppButton>

      <AppInput
        label="인증번호"
        name="code"
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="인증번호를 입력하세요"
        icon="✅"
        disabled={isVerified}
      />

      {isTimerRunning && !isVerified && (
        <p className="helper-text error">남은 시간: {formatTime(timer)}</p>
      )}

      <AppButton
        type="button"
        fullWidth
        onClick={handleVerifyCode}
        disabled={isVerified}
      >
        {isVerified ? "인증 완료" : "인증번호 확인"}
      </AppButton>

      {message && (
        <p
          className={
            isMessageSuccess ? "helper-text success" : "helper-text error"
          }
        >
          {message}
        </p>
      )}

      <AppInput
        label="새 비밀번호"
        name="newPassword"
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder="새 비밀번호를 입력하세요"
        icon="🔒"
      />

      <AppInput
        label="새 비밀번호 확인"
        name="newPasswordConfirm"
        type="password"
        value={newPasswordConfirm}
        onChange={(e) => setNewPasswordConfirm(e.target.value)}
        placeholder="새 비밀번호를 다시 입력하세요"
        icon="🔐"
      />

      <AppButton type="button" fullWidth onClick={handleResetPassword}>
        비밀번호 재설정
      </AppButton>
    </div>
  );
};

export default FindPasswordForm;
