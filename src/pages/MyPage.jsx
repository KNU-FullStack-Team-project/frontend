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
      <div className="mypage-layout">
        {/* 좌측 섹션: 사용자 정보 및 계좌 목록 */}
        <aside className="mypage-left">
          <section className="content-card">
            <div className="section-header">
              <div>
                <h3>
                  {isMyOwnPage
                    ? "내 정보"
                    : `${profile?.nickname || "회원"} 정보`}
                </h3>
              </div>
              {isMyOwnPage && (
                <AppButton type="button" onClick={onMoveAccountSettings} size="sm">
                  수정
                </AppButton>
              )}
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
                <strong style={{ fontSize: '12px' }}>{profile?.email ?? targetEmail ?? "-"}</strong>
              </div>

              <div className="mypage-row">
                <span>가입일</span>
                <strong>{createdAtText}</strong>
              </div>

              <div style={{ marginTop: '24px', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px' }}>나의 계좌</h4>
                {accounts.length > 0 ? (
                  accounts.map((account, index) => {
                    const isMainAccount = account.accountType === "MAIN";
                    const isSelected = selectedAccountId === account.accountId;

                    return (
                      <div
                        className={`mypage-row ${isSelected ? "active-account" : ""}`}
                        key={account.accountId}
                        onClick={() => setSelectedAccountId(account.accountId)}
                        style={{
                          cursor: "pointer",
                          padding: "10px 12px",
                          borderRadius: "10px",
                          margin: "4px 0",
                          transition: "all 0.2s",
                          backgroundColor: isSelected ? "#f3f4f6" : "transparent",
                          border: isSelected
                            ? "1px solid #e5e7eb"
                            : "1px solid transparent",
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span
                            style={{
                              fontWeight: isSelected ? "800" : "normal",
                              color: isSelected ? "#111827" : "#6b7280",
                              fontSize: '14px'
                            }}
                          >
                            {account.accountName || `계좌 ${index + 1}`}
                          </span>
                          {isSelected && (
                            <span style={{ fontSize: "12px", color: "#10b981" }}>
                              ●
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ color: isSelected ? "#111827" : "#374151" }}>
                            {account.cashBalance ?? "-"}
                          </strong>
                          {isMyOwnPage && isMainAccount && isSelected ? (
                            <AppButton
                              variant="danger"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleResetCash(account.accountId);
                              }}
                              disabled={resettingAccountId === account.accountId}
                              style={{ height: '24px', padding: '0 8px', fontSize: '11px' }}
                            >
                              {resettingAccountId === account.accountId
                                ? "..."
                                : "리셋"}
                            </AppButton>
                          ) : null}
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
              </div>
            </div>
          </section>
        </aside>

        {/* 우측 섹션: 포트폴리오 차트, 보유 종목, 주문 내역 */}
        <main className="mypage-right">
          <section className="content-card large">
            <div className="portfolio-section-layout">
              <div className="portfolio-chart-container">
                <h3>자산 구성 비중</h3>
                <PortfolioChart holdings={visibleHoldings} />
              </div>
              <div className="portfolio-list-container">
                <h3>보유 종목 현황</h3>
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
          </section>

          {selectedAccountId ? (
            <OrderHistory
              accountId={selectedAccountId}
              currentUser={currentUser}
            />
          ) : null}
        </main>
      </div>
    </div>
  );
};

export default MyPage;
