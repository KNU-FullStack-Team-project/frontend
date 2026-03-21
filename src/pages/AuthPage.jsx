import React, { useEffect, useState } from "react";
import LoginForm from "../auth/LoginForm";
import SignupForm from "../auth/SignupForm";
import SocialAuth from "../auth/SocialAuth";
import PageHero from "../common/PageHero";

const messages = [
  "실수해도 괜찮습니다.\n여기는 연습하는 곳이니까요.",
  "오늘의 연습이\n내일의 자신감이 됩니다.",
  "투자는 타이밍보다\n준비가 중요합니다.",
  "작은 시작이\n큰 차이를 만듭니다.",
];

const AuthPage = ({ title, description, onLogin, onSignup }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [messageIndex, setMessageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

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

  return (
    <div className="auth-page">
      <div className="auth-container">
        <PageHero badge="Mock Invest" title={title} description={description}>
          <div className="market-card">
            <div className="quote-label">💡 투자 조언</div>
            <div
              className={`quote-message ${isVisible ? "fade-in" : "fade-out"}`}
            >
              {messages[messageIndex]}
            </div>
          </div>
        </PageHero>

        <div className="auth-card">
          <div className="auth-switch-text">
            {isLogin ? "처음이신가요?" : "이미 계정이 있으신가요?"}
            <button
              type="button"
              className="switch-button"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "회원가입" : "로그인"}
            </button>
          </div>

          {isLogin ? (
            <LoginForm onLogin={onLogin} />
          ) : (
            <SignupForm onSignup={onSignup} />
          )}

          <SocialAuth />
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
