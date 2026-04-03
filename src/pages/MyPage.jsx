import React, { useEffect, useState } from "react";
import AppButton from "../common/AppButton";
import OrderHistory from "../components/stock/OrderHistory";

const MyPage = ({ currentUser, onMoveAccountSettings }) => {
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
        setError("마이페이지 정보를 불러오지 못했습니다.");
      }
    };

    loadProfile();
  }, [currentUser?.email]);

  const accountId = profile?.accountId;
  const createdAtText = profile?.createdAt?.includes("T")
    ? profile.createdAt.split("T")[0]
    : profile?.createdAt?.slice(0, 10) || "-";

  return (
    <div className="mypage-container">
      <div className="content-card">
        <div className="section-header">
          <div>
            <h3>마이페이지</h3>
            <p className="page-desc">
              내 계정 정보와 보유 자산, 최근 주문 내역을 확인할 수 있습니다.
            </p>
          </div>

          <AppButton type="button" onClick={onMoveAccountSettings}>
            회원정보수정
          </AppButton>
        </div>

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
            <span>예수금</span>
            <strong>{dashboard?.cashBalance ?? "-"}</strong>
          </div>
          <div className="mypage-row">
            <span>가입일</span>
            <strong>{createdAtText}</strong>
          </div>
        </div>
      </div>

      <div className="content-card large">
        <h3>보유 종목</h3>
        <p className="page-desc">현재 계좌에 보유 중인 종목을 확인할 수 있습니다.</p>
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
                  <td
                    colSpan="5"
                    style={{ textAlign: "center", padding: "40px", color: "#888" }}
                  >
                    보유 중인 종목이 없습니다.
                  </td>
                </tr>
              ) : (
                dashboard.holdings.map((item, index) => (
                  <tr key={`${item.stockName}-${index}`}>
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
