import React from "react";

const SocialAuth = () => {
  return (
    <div className="social-auth">
      <div className="divider">
        <span>또는</span>
      </div>

      <button className="google-button">
        <img
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/smartlock/icon_google.svg"
          alt="Google"
        />
        <span>Google로 시작하기</span>
      </button>
    </div>
  );
};

export default SocialAuth;
