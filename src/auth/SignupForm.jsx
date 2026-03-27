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

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, email: value }));

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

  const canSubmit =
    isEmailValid &&
    isPasswordValid &&
    isPasswordMatch &&
    isNicknameValid &&
    agreeService &&
    agreePrivacy;

  const handleSubmit = (e) => {
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

    onSignup(signupData);
    alert("1단계 프론트 검증 통과");
  };

  const currentTerm = openedTerm ? TERMS_CONTENT[openedTerm] : null;

  return (
    <>
      <form className="form-box" onSubmit={handleSubmit}>
        <h3 className="section-title">회원가입</h3>

        {/* 프로필 이미지 컴포넌트 */}
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
        </div>

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
