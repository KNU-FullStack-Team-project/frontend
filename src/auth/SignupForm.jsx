import React, { useState } from "react";
import AppInput from "../common/AppInput";
import AppButton from "../common/AppButton";

const SignupForm = ({ onSignup }) => {
  const [form, setForm] = useState({
    email: "",
    password: "",
    nickname: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSignup();
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
        label="닉네임"
        name="nickname"
        placeholder="닉네임 입력"
        value={form.nickname}
        onChange={handleChange}
      />

      <AppButton type="submit" variant="primary" fullWidth>
        회원가입
      </AppButton>
    </form>
  );
};

export default SignupForm;
