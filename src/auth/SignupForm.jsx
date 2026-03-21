import React, { useState } from "react";
import AppInput from "../common/AppInput";
import AppButton from "../common/AppButton";

const SignupForm = ({ onSignup }) => {
  const [form, setForm] = useState({
    email: "",
    password: "",
    passwordConfirm: "",
    nickname: "",
    marketingConsent: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSignup(form);
  };

  return (
    <form className="form-box" onSubmit={handleSubmit}>
      <AppInput
        label="이메일"
        name="email"
        placeholder="이메일 입력"
        value={form.email}
        onChange={handleChange}
      />

      <AppInput
        label="비밀번호"
        name="password"
        type="password"
        placeholder="비밀번호 입력"
        value={form.password}
        onChange={handleChange}
      />

      <AppInput
        label="비밀번호 확인"
        name="passwordConfirm"
        type="password"
        placeholder="비밀번호 다시 입력"
        value={form.passwordConfirm}
        onChange={handleChange}
      />

      <AppInput
        label="닉네임"
        name="nickname"
        placeholder="닉네임 입력"
        value={form.nickname}
        onChange={handleChange}
      />

      <div className="input-group">
        <label className="input-label">
          <input
            type="checkbox"
            name="marketingConsent"
            checked={form.marketingConsent}
            onChange={handleChange}
          />
          마케팅 정보 수신 동의(선택)
        </label>
      </div>

      <AppButton type="submit" variant="primary" fullWidth>
        회원가입
      </AppButton>
    </form>
  );
};

export default SignupForm;
