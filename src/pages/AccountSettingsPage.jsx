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

const AccountSettingsPage = ({
  currentUser,
  onLogout,
  onBackToMyPage,
  onUpdateCurrentUser,
}) => {
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [isSocialLogin, setIsSocialLogin] = useState(
    !!currentUser?.isSocialLogin,
  );
  const [isProfileUploading, setIsProfileUploading] = useState(false);
  const [nickname, setNickname] = useState(currentUser?.nickname || "");
  const [nicknameMessage, setNicknameMessage] = useState("");
  const [isNicknameDuplicate, setIsNicknameDuplicate] = useState(false);
  const [isNicknameSaving, setIsNicknameSaving] = useState(false);
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
  const isNicknameChanged = nickname.trim() !== (currentUser?.nickname || "");
  const canChangeNickname =
    Boolean(currentUser?.email) &&
    Boolean(nickname.trim()) &&
    isNicknameChanged &&
    !isNicknameDuplicate &&
    !isNicknameSaving;
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
          `/api/users/profile?${params.toString()}`,
          { headers: { Authorization: `Bearer ${currentUser.token}` } },
        );

        if (!response.ok) {
          return;
        }

        const profileData = await response.json();
        setProfileImageUrl(profileData.profileImageUrl || "");
        setIsSocialLogin(!!profileData.socialLogin);
        onUpdateCurrentUser?.({
          profileImageUrl: profileData.profileImageUrl || "",
          isSocialLogin: !!profileData.socialLogin,
        });
      } catch {
        setProfileImageUrl("");
      }
    };

    loadProfile();
  }, [currentUser?.email, currentUser?.token, onUpdateCurrentUser]);

  useEffect(() => {
    setNickname(currentUser?.nickname || "");
  }, [currentUser?.nickname]);

  useEffect(() => {
    if (!currentUser?.email) {
      return;
    }

    const trimmedNickname = nickname.trim();
    const currentNickname = currentUser?.nickname || "";

    if (!trimmedNickname || trimmedNickname === currentNickname) {
      setIsNicknameDuplicate(false);
      return;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          nickname: trimmedNickname,
          email: currentUser.email,
        });
        const response = await fetch(
          `/api/users/check-nickname?${params.toString()}`,
          { headers: { Authorization: `Bearer ${currentUser.token}` } },
        );

        const message = await response.text();

        if (cancelled) {
          return;
        }

        const isDuplicate = message === "이미 사용 중인 닉네임입니다.";
        setIsNicknameDuplicate(isDuplicate);
        if (isDuplicate) {
          setNicknameMessage(message);
        } else if (nicknameMessage === "이미 사용 중인 닉네임입니다.") {
          setNicknameMessage("");
        }
      } catch {
        if (!cancelled) {
          setIsNicknameDuplicate(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [nickname, currentUser?.email, currentUser?.nickname, currentUser?.token]);

  const handleNicknameChange = (event) => {
    setNickname(event.target.value);
    if (nicknameMessage !== "이미 사용 중인 닉네임입니다.") {
      setNicknameMessage("");
    }
  };

  const handlePasswordFieldChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    setPasswordMessage("");
  };

  const handleNicknameSubmit = async (event) => {
    event.preventDefault();

    if (!canChangeNickname) {
      setNicknameMessage("닉네임을 다시 확인해 주세요.");
      return;
    }

    setIsNicknameSaving(true);

    try {
      const response = await fetch(
        "/api/users/change-nickname",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentUser.token}`,
          },
          body: JSON.stringify({
            email: currentUser.email,
            nickname: nickname.trim(),
          }),
        },
      );

      const bodyText = await response.text();
      let profileData = null;

      try {
        profileData = JSON.parse(bodyText);
      } catch {
        profileData = null;
      }

      if (!response.ok || !profileData) {
        throw new Error(bodyText || "닉네임 변경에 실패했습니다.");
      }

      const nextNickname = profileData.nickname || nickname.trim();
      setNickname(nextNickname);
      setNicknameMessage("닉네임이 변경되었습니다.");
      onUpdateCurrentUser?.({ nickname: nextNickname });
    } catch (submitError) {
      setNicknameMessage(
        submitError.message || "닉네임 변경에 실패했습니다.",
      );
    } finally {
      setIsNicknameSaving(false);
    }
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
        `/api/users/profile-image?${params.toString()}`,
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
        "/api/users/change-password",
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
      const response = await fetch("/api/users/withdraw", {
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
            <p className="mypage-eyebrow">ACCOUNT SETTINGS</p>
            <h3 className="mypage-title">회원정보수정</h3>
            <p className="mypage-subtext">프로필 정보와 보안 설정을 관리하세요.</p>
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
            <p className="mypage-subtext">나를 표현하는 멋진 사진을 등록해 보세요.</p>
          </div>
        </div>

        <div className="profile-image-editor">
          <div className="profile-image-preview is-large">
            {profileImageUrl ? (
              <img
                src={`${profileImageUrl}`}
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
            <h3>닉네임 변경</h3>
            <p className="mypage-subtext">사이트에서 사용할 고유한 이름을 설정합니다.</p>
          </div>
        </div>

        <form className="password-form" onSubmit={handleNicknameSubmit}>
          <label className="password-form__field">
            <span>새 닉네임</span>
            <input
              type="text"
              name="nickname"
              value={nickname}
              onChange={handleNicknameChange}
              placeholder="새 닉네임"
            />
          </label>

          {nicknameMessage ? (
            <p className="password-form__message">{nicknameMessage}</p>
          ) : null}

          <div className="password-form__actions">
            <AppButton type="submit" disabled={!canChangeNickname}>
              {isNicknameSaving ? "저장 중..." : "닉네임 변경"}
            </AppButton>
          </div>
        </form>
      </div>

      {!isSocialLogin && (
        <div className="content-card">
          <div className="section-header">
            <div>
              <h3>비밀번호 변경</h3>
              <p className="mypage-subtext">안전한 계정 관리를 위해 비밀번호를 주기적으로 변경해 주세요.</p>
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
      )}

      <div className="content-card">
        <div className="section-header">
          <div>
            <h3>회원탈퇴</h3>
            <p className="mypage-subtext">탈퇴 시 모든 정보가 삭제되며 복구할 수 없습니다.</p>
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
