import React, { useEffect, useRef, useState } from "react";
import AppButton from "../common/AppButton";

const isStrongPassword = (value) => {
  if (!value || value.length < 8) {
    return false;
  }

  const hasLetter = /[A-Za-z]/.test(value);
  const hasDigit = /\d/.test(value);
  const hasSpecial = /[^A-Za-z0-9]/.test(value);

  return hasLetter && hasDigit && hasSpecial;
};

const AccountSettingsPage = ({ currentUser, onLogout, onBackToMyPage }) => {
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [isProfileUploading, setIsProfileUploading] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordMessage, setPasswordMessage] = useState("");
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [isWithdrawSaving, setIsWithdrawSaving] = useState(false);
  const fileInputRef = useRef(null);

  const isPasswordValid = isStrongPassword(passwordForm.newPassword);
  const isPasswordMatch =
    passwordForm.newPassword.length > 0 &&
    passwordForm.newPassword === passwordForm.confirmPassword;
  const canChangePassword =
    Boolean(currentUser?.email) &&
    Boolean(passwordForm.currentPassword.trim()) &&
    isPasswordValid &&
    isPasswordMatch &&
    !isPasswordSaving;

  useEffect(() => {
    if (!currentUser?.email) {
      return;
    }

    const loadProfile = async () => {
      try {
        const params = new URLSearchParams({ email: currentUser.email });
        const response = await fetch(
          `http://localhost:8081/users/profile?${params.toString()}`,
          { headers: { Authorization: `Bearer ${currentUser.token}` } },
        );

        if (!response.ok) {
          return;
        }

        const profileData = await response.json();
        setProfileImageUrl(profileData.profileImageUrl || "");
      } catch {
        setProfileImageUrl("");
      }
    };

    loadProfile();
  }, [currentUser?.email]);

  const handlePasswordFieldChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    setPasswordMessage("");
  };

  const handleProfileImageChange = async (event) => {
    const selectedFile = event.target.files?.[0];
    event.target.value = "";

    if (!selectedFile || !currentUser?.email || isProfileUploading) {
      return;
    }

    if (!["image/png", "image/jpeg", "image/jpg"].includes(selectedFile.type)) {
      alert("PNG, JPG, JPEG 파일만 업로드할 수 있습니다.");
      return;
    }

    const formData = new FormData();
    formData.append("image", selectedFile);

    setIsProfileUploading(true);

    try {
      const params = new URLSearchParams({ email: currentUser.email });
      const response = await fetch(
        `http://localhost:8081/users/profile-image?${params.toString()}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${currentUser.token}` },
          body: formData,
        },
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "프로필 사진 저장에 실패했습니다.");
      }

      const profileData = await response.json();
      setProfileImageUrl(
        `${profileData.profileImageUrl}?updated=${Date.now()}`,
      );
    } catch (uploadError) {
      alert(uploadError.message || "프로필 사진 저장에 실패했습니다.");
    } finally {
      setIsProfileUploading(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    if (!canChangePassword) {
      setPasswordMessage("비밀번호 입력값을 다시 확인해 주세요.");
      return;
    }

    setIsPasswordSaving(true);

    try {
      const response = await fetch(
        "http://localhost:8081/users/change-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentUser.token}`,
          },
          body: JSON.stringify({
            email: currentUser.email,
            currentPassword: passwordForm.currentPassword,
            newPassword: passwordForm.newPassword,
          }),
        },
      );

      const message = await response.text();

      if (!response.ok) {
        throw new Error(message || "비밀번호 변경에 실패했습니다.");
      }

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      alert(message || "비밀번호가 변경되었습니다. 다시 로그인해 주세요.");
      onLogout?.();
    } catch (submitError) {
      setPasswordMessage(
        submitError.message || "비밀번호 변경에 실패했습니다.",
      );
    } finally {
      setIsPasswordSaving(false);
    }
  };

  const handleWithdraw = async () => {
    if (!currentUser?.email || isWithdrawSaving) {
      return;
    }

    if (!window.confirm("정말 회원탈퇴를 진행할까요?")) {
      return;
    }

    setIsWithdrawSaving(true);

    try {
      const response = await fetch("http://localhost:8081/users/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify({
          email: currentUser.email,
        }),
      });

      const message = await response.text();

      if (!response.ok) {
        throw new Error(message || "회원탈퇴에 실패했습니다.");
      }

      alert(message || "회원탈퇴가 완료되었습니다.");
      onLogout?.();
    } catch (withdrawError) {
      alert(withdrawError.message || "회원탈퇴에 실패했습니다.");
    } finally {
      setIsWithdrawSaving(false);
    }
  };

  return (
    <div className="mypage-container">
      <div className="content-card">
        <div className="section-header">
          <div>
            <h3>회원정보수정</h3>
            <p className="page-desc">
              프로필 사진, 비밀번호 변경, 회원탈퇴 등 회원정보를 관리합니다.
            </p>
          </div>

          <AppButton type="button" variant="outline" onClick={onBackToMyPage}>
            마이페이지로 돌아가기
          </AppButton>
        </div>
      </div>

      <div className="content-card">
        <div className="section-header">
          <div>
            <h3>프로필 사진</h3>
            <p className="page-desc">PNG/JPG/JPEG 파일을 업로드 해주세요</p>
          </div>
        </div>

        <div className="profile-image-editor">
          <div className="profile-image-preview">
            {profileImageUrl ? (
              <img
                src={`http://localhost:8081${profileImageUrl}`}
                alt="프로필 사진"
              />
            ) : (
              <span>{currentUser?.nickname?.[0] || "U"}</span>
            )}
          </div>

          <div className="profile-image-actions">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleProfileImageChange}
              style={{ display: "none" }}
            />
            <AppButton
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProfileUploading}
            >
              {isProfileUploading ? "업로드 중..." : "프로필 사진 변경"}
            </AppButton>
          </div>
        </div>
      </div>

      <div className="content-card">
        <div className="section-header">
          <div>
            <h3>비밀번호 변경</h3>
            <p className="page-desc">
              현재 비밀번호를 입력한 뒤 새로운 비밀번호로 바꿀 수 있습니다.
            </p>
          </div>
        </div>

        <form className="password-form" onSubmit={handlePasswordSubmit}>
          <label className="password-form__field">
            <span>현재 비밀번호</span>
            <input
              type="password"
              name="currentPassword"
              value={passwordForm.currentPassword}
              onChange={handlePasswordFieldChange}
              placeholder="현재 비밀번호"
            />
          </label>

          <label className="password-form__field">
            <span>새 비밀번호</span>
            <input
              type="password"
              name="newPassword"
              value={passwordForm.newPassword}
              onChange={handlePasswordFieldChange}
              placeholder="8자 이상, 영문/숫자/특수문자 포함"
            />
          </label>

          <label className="password-form__field">
            <span>새 비밀번호 확인</span>
            <input
              type="password"
              name="confirmPassword"
              value={passwordForm.confirmPassword}
              onChange={handlePasswordFieldChange}
              placeholder="새 비밀번호 확인"
            />
          </label>

          <p className="password-form__hint">
            8자 이상, 영문, 숫자, 특수문자를 각각 1개 이상 포함해야 합니다.
          </p>

          {passwordMessage ? (
            <p className="password-form__message">{passwordMessage}</p>
          ) : null}

          <div className="password-form__actions">
            <AppButton type="submit" disabled={!canChangePassword}>
              {isPasswordSaving ? "저장 중..." : "비밀번호 변경"}
            </AppButton>
          </div>
        </form>
      </div>

      <div className="content-card">
        <div className="section-header">
          <div>
            <h3>회원탈퇴</h3>
            <p className="page-desc">
              회원탈퇴를 진행하면 계정 상태가 QUIT으로 변경되고, 다시 로그인할
              수 없습니다.
            </p>
          </div>
        </div>

        <div className="password-form__actions">
          <AppButton
            type="button"
            variant="danger"
            onClick={handleWithdraw}
            disabled={isWithdrawSaving}
          >
            {isWithdrawSaving ? "처리 중..." : "회원탈퇴"}
          </AppButton>
        </div>
      </div>
    </div>
  );
};

export default AccountSettingsPage;
