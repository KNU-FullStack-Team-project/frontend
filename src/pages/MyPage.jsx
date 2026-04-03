import React, { useEffect, useState } from "react";
import AppButton from "../common/AppButton";
import OrderHistory from "../components/stock/OrderHistory";

const DEPOSIT_OPTIONS = [
  { label: "10만원", value: 100000 },
  { label: "30만원", value: 300000 },
  { label: "50만원", value: 500000 },
  { label: "100만원", value: 1000000 },
];

const MyPage = ({ currentUser, viewedUser, onMoveAccountSettings }) => {
  const [profile, setProfile] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [depositAmounts, setDepositAmounts] = useState({});
  const [depositingAccountId, setDepositingAccountId] = useState(null);
  const [error, setError] = useState("");

  const targetEmail = viewedUser?.email || currentUser?.email;
  const isMyOwnPage = !viewedUser || viewedUser.email === currentUser?.email;

  const loadMyPageData = async () => {
    if (!targetEmail) {
      return;
    }

    try {
      const params = new URLSearchParams({ email: targetEmail });
      const [profileResponse, dashboardResponse, accountsResponse] =
        await Promise.all([
          fetch(`http://localhost:8081/users/profile?${params.toString()}`),
          fetch(
            `http://localhost:8081/api/accounts/my/dashboard?${params.toString()}`,
          ),
          fetch(`http://localhost:8081/api/accounts/my?${params.toString()}`),
        ]);

      if (
        !profileResponse.ok ||
        !dashboardResponse.ok ||
        !accountsResponse.ok
      ) {
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
      setDepositAmounts((prev) => {
        const nextAmounts = { ...prev };
        accountsData.forEach((account) => {
          if (!nextAmounts[account.accountId]) {
            nextAmounts[account.accountId] = DEPOSIT_OPTIONS[0].value;
          }
        });
        return nextAmounts;
      });
      setError("");
    } catch {
      setError("마이페이지 정보를 불러오지 못했습니다.");
    }
  };

  useEffect(() => {
    loadMyPageData();
  }, [targetEmail]);

  const handleDepositAmountChange = (accountId, amount) => {
    setDepositAmounts((prev) => ({
      ...prev,
      [accountId]: Number(amount),
    }));
  };

  const handleDeposit = async (accountId) => {
    if (!accountId || depositingAccountId || !isMyOwnPage) {
      return;
    }

    setDepositingAccountId(accountId);

    try {
      const response = await fetch(
        `http://localhost:8081/api/accounts/${accountId}/deposit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: depositAmounts[accountId] || DEPOSIT_OPTIONS[0].value,
          }),
        },
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "자금 추가에 실패했습니다.");
      }

      await loadMyPageData();
    } catch (depositError) {
      alert(depositError.message || "자금 추가에 실패했습니다.");
    } finally {
      setDepositingAccountId(null);
    }
  };

  const accountId = profile?.accountId;
  const createdAtText = profile?.createdAt?.includes("T")
    ? profile.createdAt.split("T")[0]
    : profile?.createdAt?.slice(0, 10) || "-";

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
                      <>
                        <select
                          className="mypage-deposit-select"
                          value={
                            depositAmounts[account.accountId] ||
                            DEPOSIT_OPTIONS[0].value
                          }
                          onChange={(event) =>
                            handleDepositAmountChange(
                              account.accountId,
                              event.target.value,
                            )
                          }
                        >
                          {DEPOSIT_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="mypage-deposit-button"
                          onClick={() => handleDeposit(account.accountId)}
                          disabled={depositingAccountId === account.accountId}
                        >
                          {depositingAccountId === account.accountId
                            ? "추가 중..."
                            : "자금추가"}
                        </button>
                      </>
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
              {!dashboard?.holdings || dashboard.holdings.length === 0 ? (
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
