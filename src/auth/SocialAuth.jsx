import React, { useEffect, useRef, useState } from "react";

const GOOGLE_SCRIPT_ID = "google-identity-services";
const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

const SocialAuth = ({ onGoogleLogin }) => {
  const buttonRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const onGoogleLoginRef = useRef(onGoogleLogin);

  // onGoogleLogin 함수가 변경될 때마다 ref 업데이트
  useEffect(() => {
    onGoogleLoginRef.current = onGoogleLogin;
  }, [onGoogleLogin]);

  useEffect(() => {
    if (!clientId) {
      setErrorMessage("Google 로그인 설정이 아직 연결되지 않았습니다.");
      return undefined;
    }

    let cancelled = false;

    const renderGoogleButton = () => {
      if (cancelled || !window.google?.accounts?.id || !buttonRef.current) {
        return;
      }

      // 이미 초기화되었는지 확인하거나 콜백 로직 업데이트
      // 참고: Google GSI 라이브러리는 initialize가 여러 번 호출되면 경고를 발생시킵니다.
      // onGoogleLogin이 변경되어도 재초기화할 필요가 없도록 ref를 사용합니다.
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          if (!response?.credential) {
            setErrorMessage("Google 로그인 응답을 확인하지 못했습니다.");
            return;
          }

          setErrorMessage("");
          if (onGoogleLoginRef.current) {
            await onGoogleLoginRef.current(response.credential);
          }
        },
      });

      buttonRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        shape: "pill",
        width: 360,
        text: "signin_with",
      });
      setIsReady(true);
    };

    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID);
    if (existingScript) {
      if (window.google?.accounts?.id) {
        renderGoogleButton();
      } else {
        existingScript.addEventListener("load", renderGoogleButton, {
          once: true,
        });
      }

      return () => {
        cancelled = true;
      };
    }

    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = renderGoogleButton;
    script.onerror = () => {
      if (!cancelled) {
        setErrorMessage("Google 로그인 스크립트를 불러오지 못했습니다.");
      }
    };

    document.head.appendChild(script);

    return () => {
      cancelled = true;
    };
  }, [clientId]); // Removed onGoogleLogin from dependencies to avoid re-initialization

  return (
    <div className="social-auth">
      <div className="divider">
        <span>또는</span>
      </div>

      <div className="google-login-panel">
        <div
          ref={buttonRef}
          className={`google-login-slot ${isReady ? "is-ready" : ""}`}
        />

        {!isReady && !errorMessage && (
          <button type="button" className="google-button" disabled>
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/smartlock/icon_google.svg"
              alt="Google"
            />
            <span>Google 로그인 준비 중...</span>
          </button>
        )}

        {errorMessage && <p className="helper-text error">{errorMessage}</p>}
      </div>
    </div>
  );
};

export default SocialAuth;
