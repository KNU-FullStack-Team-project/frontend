import React, { useEffect, useState } from "react";
import AppButton from "../common/AppButton";
import OrderHistory from "../components/stock/OrderHistory";

const isStrongPassword = (value) => {
  if (!value || value.length < 8) {
    return false;
  }

  const hasLetter = /[A-Za-z]/.test(value);
  const hasDigit = /\d/.test(value);
  const hasSpecial = /[^A-Za-z0-9]/.test(value);

  return hasLetter && hasDigit && hasSpecial;
};

const MyPage = ({ currentUser }) => {
  const [profile, setProfile] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordMessage, setPasswordMessage] = useState("");
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);

  useEffect(() => {
    if (!currentUser?.email) {
      return;
    }

    const loadProfile = async () => {
      try {
        const params = new URLSearchParams({ email: currentUser.email });
        const [profileResponse, dashboardResponse] = await Promise.all([
          fetch(`http://localhost:8081/users/profile?${params.toString()}`),
          fetch(
            `http://localhost:8081/api/accounts/my/dashboard?${params.toString()}`,
          ),
        ]);

        if (!profileResponse.ok || !dashboardResponse.ok) {
          throw new Error("failed");
        }

        const [profileData, dashboardData] = await Promise.all([
          profileResponse.json(),
          dashboardResponse.json(),
        ]);

        setProfile(profileData);
        setDashboard(dashboardData);
        setError("");
      } catch {
        setError("회원 정보를 불러오지 못했습니다.");
      }
    };

    loadProfile();
  }, [currentUser?.email]);

  const accountId = profile?.accountId;
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

  const handlePasswordFieldChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    setPasswordMessage("");
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    if (!canChangePassword) {
      setPasswordMessage("비밀번호 입력값을 다시 확인해 주세요.");
      return;
    }

    setIsPasswordSaving(true);

    try {
      const response = await fetch("http://localhost:8081/users/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: currentUser.email,
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const message = await response.text();

      if (!response.ok) {
        throw new Error(message || "비밀번호 변경에 실패했습니다.");
      }

      setPasswordMessage(message || "비밀번호가 변경되었습니다.");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (submitError) {
      setPasswordMessage(
        submitError.message || "비밀번호 변경에 실패했습니다.",
      );
    } finally {
      setIsPasswordSaving(false);
    }
  };

  return (
    <div className="mypage-container">
      <div className="content-card">
        <h3>마이페이지</h3>
        <p className="page-desc">
          회원 정보, 자산 내역, 관심 종목, 프로필 설정 영역입니다.
        </p>

        {error ? <p className="page-desc">{error}</p> : null}

        <div className="mypage-info">
          <div className="mypage-row">
            <span>닉네임</span>
            <strong>{profile?.nickname ?? "-"}</strong>
          </div>
          <div className="mypage-row">
            <span>이메일</span>
            <strong>{profile?.email ?? currentUser?.email ?? "-"}</strong>
          </div>
          <div className="mypage-row">
            <span>잔액</span>
            <strong>{dashboard?.cashBalance ?? "-"}</strong>
          </div>
          <div className="mypage-row">
            <span>가입일</span>
            <strong>{profile?.createdAt?.includes("T") ? profile.createdAt.split("T")[0] : (profile?.createdAt?.slice(0, 10) || "-")}</strong>
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
              {isPasswordSaving ? "변경 중..." : "비밀번호 변경"}
            </AppButton>
          </div>
        </form>
      </div>

      <div className="content-card large">
        <h3>보유 종목</h3>
        <p className="page-desc">현재 보유 중인 주식 자산 현황입니다.</p>
        <div className="table-responsive">
          <table className="stock-table">
            <thead>
              <tr>
                <th>종목명</th>
                <th>보유 수량</th>
                <th>평균 매수가</th>
                <th>현재가</th>
                <th>평가금액</th>
              </tr>
            </thead>
            <tbody>
              {!dashboard?.holdings || dashboard.holdings.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", padding: "40px", color: "#888" }}>
                    보유 중인 종목이 없습니다.
                  </td>
                </tr>
              ) : (
                dashboard.holdings.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.stockName}</td>
                    <td>{item.quantity?.toLocaleString()}주</td>
                    <td>{item.averageBuyPrice}</td>
                    <td>{item.currentPrice}</td>
                    <td>
                      <strong>{item.holdingValue}</strong>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {accountId ? <OrderHistory accountId={accountId} /> : null}
    </div>
  );
};

export default MyPage;
