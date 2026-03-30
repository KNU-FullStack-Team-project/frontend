import { useEffect, useState } from "react";
import AppInput from "../common/AppInput";
import AppButton from "../common/AppButton";
import TermsSection from "./agreement/TermsSection";
import TermsModal from "./agreement/TermsModal";
import { TERMS_CONTENT } from "./agreement/termsData";
import ProfileImagePicker from "./ProfileImagePicker";

const DEFAULT_PROFILE_IMAGE = "/default-profile.png";

const SignupForm = ({ onSignup }) => {
  const [form, setForm] = useState({
    email: "",
    password: "",
    passwordConfirm: "",
    nickname: "",
  });

  const [emailMessage, setEmailMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordConfirmMessage, setPasswordConfirmMessage] = useState("");
  const [nicknameMessage, setNicknameMessage] = useState("");

  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [isPasswordMatch, setIsPasswordMatch] = useState(false);
  const [isNicknameValid, setIsNicknameValid] = useState(false);

  const [isEmailChecked, setIsEmailChecked] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);

  const [agreeAll, setAgreeAll] = useState(false);
  const [agreeService, setAgreeService] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);

  const [openedTerm, setOpenedTerm] = useState(null);

  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profilePreview, setProfilePreview] = useState(DEFAULT_PROFILE_IMAGE);

  const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const validatePassword = (value) =>
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(
      value,
    );

  const validateNickname = (value) => {
    const trimmed = value.trim();
    return trimmed.length >= 2 && trimmed.length <= 12;
  };

  const resetEmailVerificationState = () => {
    setIsEmailChecked(false);
    setIsEmailVerified(false);
    setIsCodeSent(false);
    setVerificationCode("");
    setVerificationMessage("");
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, email: value }));
    resetEmailVerificationState();

    if (!value.trim()) {
      setEmailMessage("이메일을 입력해주세요.");
      setIsEmailValid(false);
      return;
    }

    if (!validateEmail(value)) {
      setEmailMessage("올바른 이메일 형식이 아닙니다.");
      setIsEmailValid(false);
      return;
    }

    setEmailMessage("사용 가능한 이메일 형식입니다.");
    setIsEmailValid(true);
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, password: value }));

    if (!value.trim()) {
      setPasswordMessage("비밀번호를 입력해주세요.");
      setIsPasswordValid(false);
    } else if (!validatePassword(value)) {
      setPasswordMessage("8자 이상, 영문/숫자/특수문자를 포함해야 합니다.");
      setIsPasswordValid(false);
    } else {
      setPasswordMessage("사용 가능한 비밀번호입니다.");
      setIsPasswordValid(true);
    }

    if (form.passwordConfirm) {
      if (value === form.passwordConfirm) {
        setPasswordConfirmMessage("비밀번호가 일치합니다.");
        setIsPasswordMatch(true);
      } else {
        setPasswordConfirmMessage("비밀번호가 일치하지 않습니다.");
        setIsPasswordMatch(false);
      }
    }
  };

  const handlePasswordConfirmChange = (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, passwordConfirm: value }));

    if (!value.trim()) {
      setPasswordConfirmMessage("비밀번호 확인을 입력해주세요.");
      setIsPasswordMatch(false);
      return;
    }

    if (form.password === value) {
      setPasswordConfirmMessage("비밀번호가 일치합니다.");
      setIsPasswordMatch(true);
    } else {
      setPasswordConfirmMessage("비밀번호가 일치하지 않습니다.");
      setIsPasswordMatch(false);
    }
  };

  const handleNicknameChange = (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, nickname: value }));

    if (!value.trim()) {
      setNicknameMessage("닉네임을 입력해주세요.");
      setIsNicknameValid(false);
      return;
    }

    if (!validateNickname(value)) {
      setNicknameMessage("닉네임은 2자 이상 12자 이하로 입력해주세요.");
      setIsNicknameValid(false);
      return;
    }

    setNicknameMessage("사용 가능한 형식의 닉네임입니다.");
    setIsNicknameValid(true);
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxSize = 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      alert("jpg, png, webp 형식의 이미지만 업로드할 수 있습니다.");
      return;
    }

    if (file.size > maxSize) {
      alert("이미지 크기는 5MB 이하만 가능합니다.");
      return;
    }

    setProfileImageFile(file);
    setProfilePreview(URL.createObjectURL(file));
  };

  const handleResetProfileImage = () => {
    setProfileImageFile(null);
    setProfilePreview(DEFAULT_PROFILE_IMAGE);
  };

  const handleAgreeAllChange = (e) => {
    const checked = e.target.checked;
    setAgreeAll(checked);
    setAgreeService(checked);
    setAgreePrivacy(checked);
    setAgreeMarketing(checked);
  };

  const handleCloseTerm = () => {
    setOpenedTerm(null);
  };

  const handleAgreeCurrentTerm = () => {
    if (openedTerm === "service") setAgreeService(true);
    if (openedTerm === "privacy") setAgreePrivacy(true);
    if (openedTerm === "marketing") setAgreeMarketing(true);
    setOpenedTerm(null);
  };

  const handleToggleService = () => {
    if (agreeService) {
      setAgreeService(false);
    } else {
      setOpenedTerm("service");
    }
  };

  const handleTogglePrivacy = () => {
    if (agreePrivacy) {
      setAgreePrivacy(false);
    } else {
      setOpenedTerm("privacy");
    }
  };

  const handleToggleMarketing = () => {
    if (agreeMarketing) {
      setAgreeMarketing(false);
    } else {
      setOpenedTerm("marketing");
    }
  };

  useEffect(() => {
    setAgreeAll(agreeService && agreePrivacy && agreeMarketing);
  }, [agreeService, agreePrivacy, agreeMarketing]);

  const handleCheckEmailDuplicate = async () => {
    if (!isEmailValid) {
      alert("올바른 이메일을 입력해주세요.");
      return;
    }

    try {
      const res = await fetch("http://localhost:8081/users/check-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: form.email.trim(),
        }),
      });

      const data = await res.text();

      if (data === "사용 가능한 이메일입니다.") {
        alert(data);
        setIsEmailChecked(true);
      } else {
        alert(data);
        setIsEmailChecked(false);
      }
    } catch (error) {
      console.error(error);
      alert("이메일 중복 체크 중 오류가 발생했습니다.");
    }
  };

  const handleSendVerificationCode = async () => {
    if (!isEmailChecked) {
      alert("이메일 중복 체크를 먼저 해주세요.");
      return;
    }

    try {
      const res = await fetch("http://localhost:8081/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: form.email.trim(),
        }),
      });

      const data = await res.text();
      alert(data);

      if (data === "인증코드 발송 완료") {
        setIsCodeSent(true);
      }
    } catch (error) {
      console.error(error);
      alert("인증번호 발송 중 오류가 발생했습니다.");
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      alert("인증번호를 입력해주세요.");
      return;
    }

    try {
      const res = await fetch("http://localhost:8081/email/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: form.email.trim(),
          code: verificationCode.trim(),
        }),
      });

      const data = await res.text();

      if (data === "인증 성공") {
        setVerificationMessage("이메일 인증이 완료되었습니다.");
        setIsEmailVerified(true);
        alert("이메일 인증 완료");
      } else {
        setVerificationMessage("인증번호가 올바르지 않습니다.");
        setIsEmailVerified(false);
        alert("인증 실패");
      }
    } catch (error) {
      console.error(error);
      alert("인증번호 확인 중 오류가 발생했습니다.");
    }
  };

  const canSubmit =
    isEmailValid &&
    isEmailChecked &&
    isEmailVerified &&
    isPasswordValid &&
    isPasswordMatch &&
    isNicknameValid &&
    agreeService &&
    agreePrivacy;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canSubmit) {
      alert("필수 입력값을 다시 확인해주세요.");
      return;
    }

    const signupData = {
      email: form.email.trim(),
      password: form.password,
      nickname: form.nickname.trim(),
      marketingConsent: agreeMarketing,
      profileImageFile,
    };

    const result = await onSignup(signupData);

    if (result === "success") {
      alert("회원가입 성공! 로그인 해주세요.");
    }
  };

  const currentTerm = openedTerm ? TERMS_CONTENT[openedTerm] : null;

  return (
    <>
      <form className="form-box" onSubmit={handleSubmit}>
        <h3 className="section-title">회원가입</h3>

        <ProfileImagePicker
          profilePreview={profilePreview}
          onChangeImage={handleProfileImageChange}
          onResetImage={handleResetProfileImage}
        />

        <div>
          <AppInput
            label="이메일"
            placeholder="example@email.com"
            icon="📧"
            type="email"
            value={form.email}
            onChange={handleEmailChange}
            name="email"
          />
          {emailMessage && (
            <p
              className={
                isEmailValid ? "helper-text success" : "helper-text error"
              }
            >
              {emailMessage}
            </p>
          )}

          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <AppButton type="button" onClick={handleCheckEmailDuplicate}>
              이메일 중복 체크
            </AppButton>
            <AppButton type="button" onClick={handleSendVerificationCode}>
              인증번호 보내기
            </AppButton>
          </div>
        </div>

        {isCodeSent && (
          <div style={{ marginTop: "16px" }}>
            <AppInput
              label="인증번호"
              placeholder="인증번호를 입력하세요"
              icon="✅"
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              name="verificationCode"
            />
            <div style={{ marginTop: "10px" }}>
              <AppButton type="button" onClick={handleVerifyCode}>
                인증번호 확인
              </AppButton>
            </div>
            {verificationMessage && (
              <p
                className={
                  isEmailVerified ? "helper-text success" : "helper-text error"
                }
              >
                {verificationMessage}
              </p>
            )}
          </div>
        )}

        <div>
          <AppInput
            label="비밀번호"
            placeholder="비밀번호를 입력하세요"
            icon="🔒"
            type="password"
            value={form.password}
            onChange={handlePasswordChange}
            name="password"
          />
          {passwordMessage && (
            <p
              className={
                isPasswordValid ? "helper-text success" : "helper-text error"
              }
            >
              {passwordMessage}
            </p>
          )}
        </div>

        <div>
          <AppInput
            label="비밀번호 확인"
            placeholder="비밀번호를 다시 입력하세요"
            icon="🔐"
            type="password"
            value={form.passwordConfirm}
            onChange={handlePasswordConfirmChange}
            name="passwordConfirm"
          />
          {passwordConfirmMessage && (
            <p
              className={
                isPasswordMatch ? "helper-text success" : "helper-text error"
              }
            >
              {passwordConfirmMessage}
            </p>
          )}
        </div>

        <div>
          <AppInput
            label="닉네임"
            placeholder="닉네임을 입력하세요"
            icon="👤"
            type="text"
            value={form.nickname}
            onChange={handleNicknameChange}
            name="nickname"
          />
          {nicknameMessage && (
            <p
              className={
                isNicknameValid ? "helper-text success" : "helper-text error"
              }
            >
              {nicknameMessage}
            </p>
          )}
        </div>

        <TermsSection
          agreeAll={agreeAll}
          agreeService={agreeService}
          agreePrivacy={agreePrivacy}
          agreeMarketing={agreeMarketing}
          onAgreeAllChange={handleAgreeAllChange}
          onToggleService={handleToggleService}
          onTogglePrivacy={handleTogglePrivacy}
          onToggleMarketing={handleToggleMarketing}
        />

        <AppButton type="submit" fullWidth disabled={!canSubmit}>
          회원가입
        </AppButton>
      </form>

      <TermsModal
        open={!!openedTerm}
        title={currentTerm?.title || ""}
        content={currentTerm?.content || ""}
        onClose={handleCloseTerm}
        onAgree={handleAgreeCurrentTerm}
      />
    </>
  );
};

export default SignupForm;
