import React, { useEffect, useState } from "react";
import AppButton from "../common/AppButton";
import OrderHistory from "../components/stock/OrderHistory";

const MyPage = ({ currentUser, viewedUser, onMoveAccountSettings }) => {
  const [profile, setProfile] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [resettingAccountId, setResettingAccountId] = useState(null);
  const [error, setError] = useState("");

  const targetEmail = viewedUser?.email || currentUser?.email;
  const isMyOwnPage = !viewedUser || viewedUser.email === currentUser?.email;

  const loadMyPageData = async () => {
    if (!targetEmail) {
      return;
    }

    try {
      const token = localStorage.getItem("accessToken") || currentUser?.token;

      if (!token) {
        setError("로그인 토큰이 없습니다. 다시 로그인해주세요.");
        return;
      }

      const params = new URLSearchParams({ email: targetEmail });

      const commonHeaders = {
        Authorization: `Bearer ${token}`,
      };

      const [profileResponse, dashboardResponse, accountsResponse] =
        await Promise.all([
          fetch(`http://localhost:8081/users/profile?${params.toString()}`, {
            headers: commonHeaders,
          }),
          fetch(
            `http://localhost:8081/api/accounts/my/dashboard?${params.toString()}`,
            {
              headers: commonHeaders,
            },
          ),
          fetch(`http://localhost:8081/api/accounts/my?${params.toString()}`, {
            headers: commonHeaders,
          }),
        ]);

      if (
        !profileResponse.ok ||
        !dashboardResponse.ok ||
        !accountsResponse.ok
      ) {
        console.error("API 응답 에러:", {
          profile: profileResponse.status,
          dashboard: dashboardResponse.status,
          accounts: accountsResponse.status,
        });
        throw new Error("failed");
      }

      const [profileData, dashboardData, accountsData] = await Promise.all([
        profileResponse.json(),
        dashboardResponse.json(),
        accountsResponse.json(),
      ]);

      setProfile(profileData);
      setDashboard(dashboardData);
      setAccounts(accountsData);
      setError("");
    } catch (loadError) {
      console.error("마이페이지 조회 오류:", loadError);
      setError("마이페이지 정보를 불러오지 못했습니다.");
    }
  };

  useEffect(() => {
    loadMyPageData();
  }, [targetEmail, currentUser]);

  const handleResetCash = async (accountId) => {
    if (!accountId || resettingAccountId || !isMyOwnPage) {
      return;
    }

    if (!window.confirm("예수금과 보유중인 주식을 초기화할까요?")) {
      return;
    }

    setResettingAccountId(accountId);

    try {
      const token = localStorage.getItem("accessToken") || currentUser?.token;

      if (!token) {
        throw new Error("로그인 토큰이 없습니다. 다시 로그인해주세요.");
      }

      const response = await fetch(
        `http://localhost:8081/api/accounts/${accountId}/reset-cash`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "예수금 리셋에 실패했습니다.");
      }

      await loadMyPageData();
    } catch (resetError) {
      alert(resetError.message || "예수금 리셋에 실패했습니다.");
    } finally {
      setResettingAccountId(null);
    }
  };

  const accountId = profile?.accountId;
  const profileImageUrl = profile?.profileImageUrl
    ? `http://localhost:8081${profile.profileImageUrl}`
    : "";
  const createdAtText = profile?.createdAt?.includes("T")
    ? profile.createdAt.split("T")[0]
    : profile?.createdAt?.slice(0, 10) || "-";

  const visibleHoldings =
    dashboard?.holdings?.filter((h) => h.quantity > 0) || [];

  return (
    <div className="mypage-container">
      <div className="content-card">
        <div className="section-header">
          <div>
            <h3>
              {isMyOwnPage
                ? "마이페이지"
                : `${profile?.nickname || "회원"} 마이페이지`}
            </h3>
            <p className="page-desc">
              내 계정 정보와 보유 자산, 최근 주문 내역을 확인할 수 있습니다.
            </p>
          </div>

          {isMyOwnPage ? (
            <AppButton type="button" onClick={onMoveAccountSettings}>
              회원정보수정
            </AppButton>
          ) : null}
        </div>

        {error ? <p className="page-desc">{error}</p> : null}

        <div className="mypage-info">
          <div className="mypage-profile-row">
            <div className="mypage-profile-avatar">
              {profileImageUrl ? (
                <img src={profileImageUrl} alt="프로필 사진" />
              ) : (
                <span>{profile?.nickname?.[0] || "U"}</span>
              )}
            </div>
          </div>

          <div className="mypage-row">
            <span>닉네임</span>
            <strong>{profile?.nickname ?? "-"}</strong>
          </div>

          <div className="mypage-row">
            <span>이메일</span>
            <strong>{profile?.email ?? targetEmail ?? "-"}</strong>
          </div>

          {accounts.length > 0 ? (
            accounts.map((account, index) => {
              const isMainAccount = account.accountType === "MAIN";

              return (
                <div className="mypage-row" key={account.accountId}>
                  <span>{account.accountName || `계좌 ${index + 1}`}</span>
                  <div className="mypage-balance-controls">
                    {isMyOwnPage && isMainAccount ? (
                      <button
                        type="button"
                        className="mypage-deposit-button"
                        onClick={() => handleResetCash(account.accountId)}
                        disabled={resettingAccountId === account.accountId}
                      >
                        {resettingAccountId === account.accountId
                          ? "초기화 중..."
                          : "계좌 초기화"}
                      </button>
                    ) : null}
                    <strong>{account.cashBalance ?? "-"}</strong>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="mypage-row">
              <span>예수금</span>
              <strong>{dashboard?.cashBalance ?? "-"}</strong>
            </div>
          )}

          <div className="mypage-row">
            <span>가입일</span>
            <strong>{createdAtText}</strong>
          </div>
        </div>
      </div>

      <div className="content-card large">
        <h3>보유 종목</h3>
        <p className="page-desc">
          현재 계좌에 보유 중인 종목을 확인할 수 있습니다.
        </p>
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
              {visibleHoldings.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    style={{
                      textAlign: "center",
                      padding: "40px",
                      color: "#888",
                    }}
                  >
                    보유 중인 종목이 없습니다.
                  </td>
                </tr>
              ) : (
                visibleHoldings.map((item, index) => (
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

      {accountId ? (
        <OrderHistory accountId={accountId} currentUser={currentUser} />
      ) : null}
    </div>
  );
};

export default MyPage;
