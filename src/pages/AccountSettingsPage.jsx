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

const NICKNAME_MAX_LENGTH = 12;
const NICKNAME_ALLOWED_PATTERN = /^[A-Za-z0-9가-힣]{1,12}$/;
const NICKNAME_RULE_MESSAGE =
  "닉네임은 12자 이하의 한글, 영문, 숫자만 사용할 수 있습니다.";

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
  const isNicknameValid = NICKNAME_ALLOWED_PATTERN.test(nickname.trim());
  const canChangeNickname =
    Boolean(currentUser?.email) &&
    Boolean(nickname.trim()) &&
    isNicknameValid &&
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
          `/api/users/profile?${params.toString()}`
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
  }, [currentUser?.email, onUpdateCurrentUser]);

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

    if (!NICKNAME_ALLOWED_PATTERN.test(trimmedNickname)) {
      setIsNicknameDuplicate(false);
      setNicknameMessage(NICKNAME_RULE_MESSAGE);
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
          `/api/users/check-nickname?${params.toString()}`
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
  }, [nickname, currentUser?.email, currentUser?.nickname]);

  const normalizeNicknameInput = (value) =>
    value.replace(/[^A-Za-z0-9가-힣]/g, "").slice(0, NICKNAME_MAX_LENGTH);

  const handleNicknameChange = (event) => {
    setNickname(normalizeNicknameInput(event.target.value));
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
      setNicknameMessage(isNicknameValid ? "닉네임을 다시 확인해 주세요." : NICKNAME_RULE_MESSAGE);
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
    <div style={styles.page}>
      <div style={styles.hero}>
        <div style={styles.heroBadge}>PROFILE SETTINGS</div>
        <h1 style={styles.heroTitle}>회원 정보 수정</h1>
        <p style={styles.heroText}>
          프로필 정보와 보안 설정을 한눈에 관리하고 업데이트하세요.
        </p>
        <div style={{ marginTop: '20px' }}>
          <AppButton type="button" variant="outline" onClick={onBackToMyPage} style={{ borderColor: 'rgba(255,255,255,0.5)', color: 'white' }}>
            ← 마이페이지로 돌아가기
          </AppButton>
        </div>
      </div>

      <div className="settings-grid-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'stretch' }}>
        {/* 왼쪽: 프로필 사진 + 닉네임 합치기 */}
        <div className="settings-left-column" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="content-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', margin: 0, padding: '32px' }}>
            <div className="section-header" style={{ textAlign: 'left', alignItems: 'flex-start', marginBottom: '32px', paddingBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '800' }}>프로필 설정</h3>
              <p className="mypage-subtext" style={{ margin: '8px 0 0' }}>프로필 사진과 닉네임을 변경하세요.</p>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '40px', alignItems: 'center', justifyContent: 'center' }}>
              <div className="profile-image-editor" style={{ width: '100%', maxWidth: '500px', padding: '30px', background: '#f8fafc', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                <div className="profile-image-preview is-large" style={{ margin: '0 auto 24px' }}>
                  {profileImageUrl ? (
                    <img
                      src={`${profileImageUrl}`}
                      alt="프로필 사진"
                    />
                  ) : (
                    <span>{currentUser?.nickname?.[0] || "U"}</span>
                  )}
                </div>

                <div className="profile-image-actions" style={{ display: 'flex', justifyContent: 'center' }}>
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
                    style={{ padding: '12px 24px' }}
                  >
                    {isProfileUploading ? "업로드 중..." : "프로필 사진 변경"}
                  </AppButton>
                </div>
              </div>

              <div className="nickname-editor-section" style={{ width: '100%', maxWidth: '500px' }}>
                <form onSubmit={handleNicknameSubmit} style={{ textAlign: 'left' }}>
                  <span style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px', display: 'block' }}>새 닉네임</span>
                  <div style={{ display: 'flex', gap: '12px', maxWidth: '500px', alignItems: 'stretch' }}>
                    <input
                      type="text"
                      name="nickname"
                      value={nickname}
                      onChange={handleNicknameChange}
                      maxLength={NICKNAME_MAX_LENGTH}
                      placeholder="새 닉네임"
                      style={{
                        flex: 1,
                        height: '52px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '12px',
                        padding: '0 16px',
                        fontSize: '14px',
                        outline: 'none',
                        background: '#f8fafc',
                        boxSizing: 'border-box',
                        margin: 0
                      }}
                    />
                    <AppButton
                      type="submit"
                      disabled={!canChangeNickname}
                      style={{
                        height: '52px',
                        whiteSpace: 'nowrap',
                        padding: '0 24px',
                        boxSizing: 'border-box',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: 0,
                        transform: 'translateY(1px)'
                      }}
                    >
                      {isNicknameSaving ? "저장 중..." : "변경 적용"}
                    </AppButton>
                  </div>
                  <p className="helper-text" style={{ marginTop: '10px', maxWidth: '500px' }}>
                    닉네임은 12자 이하, 띄어쓰기와 특수문자 없이 입력해 주세요.
                  </p>

                  {nicknameMessage ? (
                    <p className="password-form__message" style={{ marginTop: '12px', maxWidth: '500px' }}>{nicknameMessage}</p>
                  ) : null}
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* 오른쪽: 비밀번호 변경 */}
        {!isSocialLogin && (
          <div className="settings-right-column" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="content-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', margin: 0, padding: '32px' }}>
              <div className="section-header" style={{ textAlign: 'left', alignItems: 'flex-start', marginBottom: '32px', paddingBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '800' }}>비밀번호 변경</h3>
                <p className="mypage-subtext" style={{ margin: '4px 0 0' }}>계정 보호를 위해 비밀번호를 관리하세요.</p>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <form className="password-form" onSubmit={handlePasswordSubmit} style={{
                  width: '100%',
                  maxWidth: '400px',
                  margin: '0',
                  textAlign: 'left',
                  alignItems: 'flex-start',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', alignItems: 'flex-start' }}>
                    <label className="password-form__field" style={{ width: '100%', alignItems: 'flex-start', textAlign: 'left' }}>
                      <span style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px', display: 'block', textAlign: 'left' }}>현재 비밀번호</span>
                      <input
                        type="password"
                        name="currentPassword"
                        value={passwordForm.currentPassword}
                        onChange={handlePasswordFieldChange}
                        placeholder="현재 비밀번호"
                        style={{ height: '52px', width: '100%', maxWidth: '400px', margin: 0 }}
                      />
                    </label>

                    <label className="password-form__field" style={{ width: '100%', alignItems: 'flex-start', textAlign: 'left' }}>
                      <span style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px', display: 'block', textAlign: 'left' }}>새 비밀번호</span>
                      <input
                        type="password"
                        name="newPassword"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordFieldChange}
                        placeholder="8자 이상, 영문/숫자/특수문자 포함"
                        style={{ height: '52px', width: '100%', maxWidth: '400px', margin: 0 }}
                      />
                    </label>

                    <label className="password-form__field" style={{ width: '100%', alignItems: 'flex-start', textAlign: 'left' }}>
                      <span style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px', display: 'block', textAlign: 'left' }}>새 비밀번호 확인</span>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordFieldChange}
                        placeholder="새 비밀번호 확인"
                        style={{ height: '52px', width: '100%', maxWidth: '400px', margin: 0 }}
                      />
                    </label>
                  </div>

                  <div style={{ width: '100%', textAlign: 'left' }}>
                    <p className="password-form__hint" style={{ marginTop: '20px', color: '#94a3b8', textAlign: 'left', marginLeft: 0 }}>
                      • 8자 이상, 영문, 숫자, 특수문자 포함
                    </p>

                    {passwordMessage ? (
                      <p className="password-form__message" style={{ marginTop: '16px', maxWidth: '400px' }}>{passwordMessage}</p>
                    ) : null}

                    <div className="password-form__actions" style={{ marginTop: '24px', justifyContent: 'flex-start' }}>
                      <AppButton type="submit" disabled={!canChangePassword} style={{ height: '52px', padding: '0 32px' }}>
                        {isPasswordSaving ? "저장 중..." : "비밀번호 변경 완료"}
                      </AppButton>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="content-card" style={{ marginTop: '30px', borderTop: '1px solid #fee2e2' }}>
        <div className="section-header" style={{ marginBottom: 0, paddingBottom: 0, borderBottom: 'none' }}>
          <div>
            <h3 style={{ color: '#ef4444', margin: 0 }}>회원 탈퇴</h3>
            <p className="mypage-subtext" style={{ margin: 0 }}>탈퇴 시 모든 정보가 삭제되며 복구할 수 없습니다.</p>
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
    </div>
  );
};

const styles = {
  page: {
    maxWidth: "1440px",
    margin: "0 auto",
    padding: "28px 20px 56px",
  },
  hero: {
    background: "linear-gradient(135deg, #4874d4, #c6d2e7)",
    border: "none",
    borderRadius: "24px",
    padding: "50px 30px",
    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.1)",
    marginBottom: "20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    position: "relative",
    color: "white",
  },
  heroBadge: {
    display: "inline-block",
    padding: "6px 14px",
    borderRadius: "999px",
    background: "rgba(255, 255, 255, 0.2)",
    color: "#fff",
    fontSize: "12px",
    fontWeight: "800",
    marginBottom: "12px",
    backdropFilter: "blur(4px)",
  },
  heroTitle: {
    margin: "0 0 10px",
    fontSize: "36px",
    fontWeight: "800",
    color: "#fff",
  },
  heroText: {
    margin: 0,
    fontSize: "15px",
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: "1.6",
    maxWidth: "800px",
  },
};

export default AccountSettingsPage;
