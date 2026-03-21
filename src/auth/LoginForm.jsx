import React, { useState } from "react";
import AppInput from "../common/AppInput";
import AppButton from "../common/AppButton";

const LoginForm = ({ onLogin }) => {
  const [form, setForm] = useState({
    email: "",
    password: "",
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

      <AppButton type="submit" variant="primary" fullWidth>
        로그인
      </AppButton>
    </form>
  );
};

export default LoginForm;
