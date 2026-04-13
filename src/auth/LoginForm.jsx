import React, { useEffect, useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import AppInput from "../common/AppInput";
import AppButton from "../common/AppButton";

const LoginForm = ({
  onLogin,
  captchaRequired = false,
  captchaResetKey = 0,
  loginErrorMessage = "",
}) => {
  const [form, setForm] = useState({
    email: "",
    password: "",
    captchaToken: "",
  });

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      captchaToken: "",
    }));
  }, [captchaResetKey]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCaptchaChange = (token) => {
    setForm((prev) => ({
      ...prev,
      captchaToken: token || "",
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(form);
  };

  return (
    <form className="form-box" onSubmit={handleSubmit}>
      <AppInput
        label="이메일"
        name="email"
        placeholder="이메일을 입력하세요"
        icon="✉️"
        value={form.email}
        onChange={handleChange}
      />

      <AppInput
        label="비밀번호"
        name="password"
        type="password"
        placeholder="비밀번호를 입력하세요"
        icon="🔒"
        value={form.password}
        onChange={handleChange}
      />

      {loginErrorMessage && !captchaRequired && (
        <p className="helper-text error">{loginErrorMessage}</p>
      )}

      {captchaRequired && (
        <div className="login-captcha-box">
          <p className="helper-text error">
            로그인 실패가 누적되어 reCAPTCHA 인증이 필요합니다.
          </p>
          <ReCAPTCHA
            key={captchaResetKey}
            sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
            onChange={handleCaptchaChange}
          />
        </div>
      )}

      <AppButton type="submit" variant="primary" fullWidth>
        로그인
      </AppButton>
    </form>
  );
};

export default LoginForm;
