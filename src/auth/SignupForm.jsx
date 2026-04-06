import React, { useEffect, useState } from "react";
import AppInput from "../common/AppInput";
import AppButton from "../common/AppButton";

const SignupForm = () => {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

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

  const handleSendCode = async () => {
    if (!email.trim()) {
      setMessage("이메일을 입력해주세요.");
      setIsMessageSuccess(false);
      return;
    }

    const res = await fetch("http://localhost:8081/email/send/signup", {
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
  };

  const handleVerifyCode = async () => {
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
    }
  };

  const handleSignup = async () => {
    if (!isVerified) {
      setMessage("이메일 인증을 먼저 완료해주세요.");
      setIsMessageSuccess(false);
      return;
    }

    if (!validatePassword(password)) {
      setMessage("비밀번호는 8자 이상, 영문/숫자/특수문자를 포함해야 합니다.");
      setIsMessageSuccess(false);
      return;
    }

    if (password !== passwordConfirm) {
      setMessage("비밀번호가 일치하지 않습니다.");
      setIsMessageSuccess(false);
      return;
    }

    const res = await fetch("http://localhost:8081/users/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.trim(),
        password,
      }),
    });

    const data = await res.text();
    alert(data);
  };

  return (
    <div className="form-box">
      <h3 className="section-title">회원가입</h3>

      <AppInput
        label="이메일"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
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
        value={code}
        onChange={(e) => setCode(e.target.value)}
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
        label="비밀번호"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <AppInput
        label="비밀번호 확인"
        type="password"
        value={passwordConfirm}
        onChange={(e) => setPasswordConfirm(e.target.value)}
      />

      <AppButton type="button" fullWidth onClick={handleSignup}>
        회원가입
      </AppButton>
    </div>
  );
};

export default SignupForm;
