import React, { useEffect, useState } from "react";
import AppButton from "../common/AppButton";
import OrderHistory from "../components/stock/OrderHistory";
import PortfolioChart from "../components/stock/PortfolioChart";

const MyPage = ({ currentUser, viewedUser, onMoveAccountSettings }) => {
  const [profile, setProfile] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [resettingAccountId, setResettingAccountId] = useState(null);
  const [error, setError] = useState("");

  const targetEmail = viewedUser?.email || currentUser?.email;
  const isMyOwnPage = !viewedUser || viewedUser.email === currentUser?.email;

  const fetchDashboardData = async (accountId) => {
    try {
      const token = localStorage.getItem("accessToken") || currentUser?.token;
      if (!token) return;

      const response = await fetch(
        `http://localhost:8081/api/accounts/my/dashboard?email=${targetEmail}&accountId=${accountId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setDashboard(data);
      }
    } catch (err) {
      console.error("대시보드 로드 실패:", err);
    }
  };

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

      const [profileResponse, accountsResponse] =
        await Promise.all([
          fetch(`http://localhost:8081/users/profile?${params.toString()}`, {
            headers: commonHeaders,
          }),
          fetch(`http://localhost:8081/api/accounts/my?${params.toString()}`, {
            headers: commonHeaders,
          }),
        ]);

      if (
        !profileResponse.ok ||
        !accountsResponse.ok
      ) {
        throw new Error("failed");
      }

      const [profileData, accountsData] = await Promise.all([
        profileResponse.json(),
        accountsResponse.json(),
      ]);

      setProfile(profileData);
      setAccounts(accountsData);
      
      if (accountsData.length > 0) {
          const firstAccountId = accountsData[0].accountId;
          if (!selectedAccountId) {
            setSelectedAccountId(firstAccountId);
          } else {
            fetchDashboardData(selectedAccountId);
          }
      }
      
      setError("");
    } catch (loadError) {
      console.error("마이페이지 조회 오류:", loadError);
      setError("마이페이지 정보를 불러오지 못했습니다.");
    }
  };

  useEffect(() => {
    loadMyPageData();
  }, [targetEmail, currentUser]);

  useEffect(() => {
    if (selectedAccountId) {
      fetchDashboardData(selectedAccountId);
    }
  }, [selectedAccountId]);

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
    dashboard?.holdings
      ?.filter((h) => h.quantity > 0)
      .sort((a, b) => {
        const getVal = (item) => {
          if (item.holdingValueRaw !== undefined && item.holdingValueRaw !== null) {
            return Number(item.holdingValueRaw);
          }
          if (item.holdingValue) {
            return parseFloat(item.holdingValue.replace(/[^0-9.]/g, "")) || 0;
          }
          return 0;
        };
        return getVal(b) - getVal(a);
      }) || [];

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
              const isSelected = selectedAccountId === account.accountId;

              return (
                <div 
                  className={`mypage-row ${isSelected ? 'active-account' : ''}`} 
                  key={account.accountId}
                  onClick={() => setSelectedAccountId(account.accountId)}
                  style={{
                    cursor: 'pointer',
                    padding: '12px',
                    borderRadius: '12px',
                    margin: '4px -12px',
                    transition: 'all 0.2s',
                    backgroundColor: isSelected ? '#f3f4f6' : 'transparent',
                    border: isSelected ? '1px solid #e5e7eb' : '1px solid transparent'
                  }}
                >
                  <span style={{ fontWeight: isSelected ? '800' : 'normal', color: isSelected ? '#111827' : '#6b7280' }}>
                    {account.accountName || `계좌 ${index + 1}`}
                    {isSelected && <span style={{ marginLeft: '8px', fontSize: '12px', color: '#10b981' }}>● 선택됨</span>}
                  </span>
                  <div className="mypage-balance-controls">
                    {isMyOwnPage && isMainAccount ? (
                      <AppButton
                        variant="danger"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResetCash(account.accountId);
                        }}
                        disabled={resettingAccountId === account.accountId}
                      >
                        {resettingAccountId === account.accountId
                          ? "초기화 중..."
                          : "계좌 초기화"}
                      </AppButton>
                    ) : null}
                    <strong style={{ color: isSelected ? '#111827' : '#374151' }}>{account.cashBalance ?? "-"}</strong>
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
        <div className="portfolio-section-layout">
          <div className="portfolio-chart-container">
            <h3>자산 구성 비중</h3>
            <p className="page-desc">보유 중인 주식 종목별 비중입니다.</p>
            <PortfolioChart holdings={visibleHoldings} />
          </div>
          <div className="portfolio-list-container">
            <h3>보유 종목 현황</h3>
            <p className="page-desc">현재 계좌에 보유 중인 종목 리스트입니다.</p>
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
        </div>
      </div>

      {selectedAccountId ? (
        <OrderHistory accountId={selectedAccountId} currentUser={currentUser} />
      ) : null}
    </div>
  );
};

export default MyPage;
