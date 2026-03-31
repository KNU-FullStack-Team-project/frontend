import React, { useEffect, useState } from "react";
import OrderHistory from "../components/stock/OrderHistory";

const MyPage = ({ currentUser }) => {
  const [profile, setProfile] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");

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
            <strong>{profile?.createdAt ? profile.createdAt.slice(0, 10) : "-"}</strong>
          </div>
        </div>
      </div>

      {accountId ? <OrderHistory accountId={accountId} /> : null}
    </div>
  );
};

export default MyPage;
