import React, { useEffect, useState } from "react";
import LoginForm from "../auth/LoginForm";
import SignupForm from "../auth/SignupForm";
import SocialAuth from "../auth/SocialAuth";
import PageHero from "../common/PageHero";
import FindPasswordForm from "../auth/FindPasswordForm";

const messages = [
  "실수해도 괜찮습니다.\n여기는 연습하는 곳이니까요.",
  "오늘의 연습이\n내일의 자신감이 됩니다.",
  "투자는 대박보다\n준비가 중요합니다.",
  "작은 시작은\n큰 차이를 만들어냅니다.",
];

const AuthPage = ({
  title,
  description,
  onLogin,
  onGoogleLogin,
  onSignup,
  onSocialSignup,
  socialSignupData,
  initialMode = "login",
  onChangeMode,
  authMessage,
  loginCaptchaRequired = false,
  loginCaptchaResetKey = 0,
  loginErrorMessage = "",
}) => {
  const [mode, setMode] = useState(initialMode);
  const [messageIndex, setMessageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);

      setTimeout(() => {
        setMessageIndex((prev) => (prev + 1) % messages.length);
        setIsVisible(true);
      }, 800);
    }, 3800);

    return () => clearInterval(interval);
  }, []);

  const changeMode = (nextMode) => {
    setMode(nextMode);
    if (onChangeMode) {
      onChangeMode(nextMode);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <PageHero badge="Mock Invest" title={title} description={description}>
          <div className="market-card">
            <div className="quote-label">오늘의 투자 조언</div>
            <div
              className={`quote-message ${isVisible ? "fade-in" : "fade-out"}`}
            >
              {messages[messageIndex]}
            </div>
          </div>
        </PageHero>

        <div className="auth-card">
          {mode === "login" && (
            <>
              <div className="auth-switch-text">
                처음이신가요?
                <button
                  type="button"
                  className="switch-button"
                  onClick={() => changeMode("signup")}
                >
                  회원가입
                </button>
              </div>

              {authMessage && (
                <p className="auth-success-message">{authMessage}</p>
              )}

              <LoginForm
                onLogin={onLogin}
                captchaRequired={loginCaptchaRequired}
                captchaResetKey={loginCaptchaResetKey}
                loginErrorMessage={loginErrorMessage}
              />

              <div className="auth-help-row">
                <button
                  type="button"
                  className="auth-text-link"
                  onClick={() => changeMode("findPassword")}
                >
                  비밀번호를 잊으셨나요?
                </button>
              </div>
            </>
          )}

          {mode === "signup" && (
            <>
              <div className="auth-switch-text">
                이미 계정이 있으신가요?
                <button
                  type="button"
                  className="switch-button"
                  onClick={() => changeMode("login")}
                >
                  로그인
                </button>
              </div>

              <SignupForm
                onSignup={onSignup}
                onSocialSignup={onSocialSignup}
                socialSignupData={socialSignupData}
              />
            </>
          )}

          {mode === "findPassword" && (
            <>
              <div className="auth-switch-text">
                로그인 화면으로 돌아가기
                <button
                  type="button"
                  className="switch-button"
                  onClick={() => changeMode("login")}
                >
                  로그인
                </button>
              </div>

              <FindPasswordForm />
            </>
          )}

          <SocialAuth onGoogleLogin={onGoogleLogin} />
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
