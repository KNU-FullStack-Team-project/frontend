import React, { useEffect, useState } from "react";
import AppButton from "../common/AppButton";
import OrderHistory from "../components/stock/OrderHistory";
import PortfolioChart from "../components/stock/PortfolioChart";
import AssetGrowthChart from "../components/stock/AssetGrowthChart";
import DashboardSkeleton from "../components/common/DashboardSkeleton";

const TEXT = {
  loginMissing: "로그인 정보가 없습니다. 다시 로그인해 주세요.",
  loadFailed: "마이페이지 정보를 불러오지 못했습니다.",
  resetConfirm: "예수금과 보유 중인 주식을 초기화할까요?",
  resetFailed: "초기화에 실패했습니다.",
  myInfo: "내 정보",
  infoSuffix: "정보",
  edit: "수정",
  user: "사용자",
  nickname: "닉네임",
  email: "이메일",
  joinedAt: "가입일",
  accountCount: "보유 계좌",
  competitionCount: "참여 대회",
  myAccounts: "내 계좌",
  chooseAccount: "조회할 계좌를 선택하세요.",
  account: "계좌",
  mainAccount: "기본 계좌",
  selected: "선택됨",
  cashBalance: "예수금",
  reset: "리셋",
  processing: "처리 중",
  noAccounts: "표시할 계좌가 없습니다.",
  totalAsset: "총 자산",
  cashOnHand: "보유 현금",
  totalProfit: "총 수익",
  returnRate: "수익률",
  assetStatus: "자산 현황",
  selectedAccountLabel: "선택 계좌",
  selectAccountHelp: "계좌를 선택해 주세요",
  portfolioRatio: "자산 구성 비중",
  portfolioRatioDesc: "보유 종목의 평가금액 비중입니다.",
  holdingsStatus: "보유 종목 현황",
  holdingsStatusDesc: "평가금액이 큰 순서대로 정렬됩니다.",
  stockCountSuffix: "개 종목",
  stockName: "종목명",
  quantity: "보유 수량",
  averageBuyPrice: "평균 매수가",
  currentPrice: "현재가",
  valuation: "평가금액",
  noHoldings: "보유 중인 종목이 없습니다.",
  shares: "주",
  profitRate: "수익률",
  assetGrowthTitle: "자산 성장 곡선",
  assetGrowthDesc: "일일 자산 총액 변동 추이입니다.",
};

const MyPage = ({ currentUser, viewedUser, onMoveAccountSettings }) => {
  const [profile, setProfile] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [resettingAccountId, setResettingAccountId] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [myCompetitions, setMyCompetitions] = useState([]);
  const [snapshots, setSnapshots] = useState([]);

  const targetEmail = viewedUser?.email || currentUser?.email;
  const isMyOwnPage = !viewedUser || viewedUser.email === currentUser?.email;
  const selectedAccount =
    accounts.find((account) => account.accountId === selectedAccountId) || null;

  const fetchDashboardData = async (accountId) => {
    setIsLoading(true);
    try {
      // 대시보드 데이터 조회
      const dashResponse = await fetch(
        `/api/accounts/my/dashboard?email=${targetEmail}&accountId=${accountId}`
      );

      if (dashResponse.ok) {
        const data = await dashResponse.json();
        setDashboard(data);
      }

      // 자산 히스토리(스냅샷) 조회
      const snapResponse = await fetch(`/api/portfolio/snapshots/${accountId}`);
      if (snapResponse.ok) {
        const snapData = await snapResponse.json();
        setSnapshots(snapData);
      }
    } catch (err) {
      console.error("Dashboard load failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMyPageData = async () => {
    if (!targetEmail) {
      return;
    }

    try {
      const params = new URLSearchParams({ email: targetEmail });

      const [profileResponse, accountsResponse] = await Promise.all([
        fetch(`/api/users/profile?${params.toString()}`),
        fetch(`/api/accounts/my?${params.toString()}`),
      ]);

      if (!profileResponse.ok || !accountsResponse.ok) {
        throw new Error("failed");
      }

      const [profileData, accountsData] = await Promise.all([
        profileResponse.json(),
        accountsResponse.json(),
      ]);

      setProfile(profileData);
      setAccounts(accountsData);

      if (accountsData.length > 0) {
        const hasSelected = accountsData.some(
          (account) => account.accountId === selectedAccountId
        );
        const nextAccountId = hasSelected
          ? selectedAccountId
          : accountsData[0].accountId;

        setSelectedAccountId(nextAccountId);
        fetchDashboardData(nextAccountId);
      } else {
        setSelectedAccountId(null);
      }

      setError("");

      // 참여 대회 정보 가져오기
      const userId = profileData?.id || currentUser?.userId;
      if (userId) {
        const compResponse = await fetch(
          `/api/competitions/my?userId=${userId}`
        );
        if (compResponse.ok) {
          const compData = await compResponse.json();
          setMyCompetitions(compData);
        }
      }
    } catch (loadError) {
      console.error("MyPage load error:", loadError);
      setError(TEXT.loadFailed);
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

    if (!window.confirm(TEXT.resetConfirm)) {
      return;
    }

    setResettingAccountId(accountId);

    try {
      const response = await fetch(
        `/api/accounts/${accountId}/reset-cash`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || TEXT.resetFailed);
      }

      await loadMyPageData();
    } catch (resetError) {
      alert(resetError.message || TEXT.resetFailed);
    } finally {
      setResettingAccountId(null);
    }
  };

  const profileImageUrl = profile?.profileImageUrl
    ? `${profile.profileImageUrl}`
    : "";
  const createdAtText = profile?.createdAt?.includes("T")
    ? profile.createdAt.split("T")[0]
    : profile?.createdAt?.slice(0, 10) || "-";

  const visibleHoldings =
    dashboard?.holdings
      ?.filter((holding) => holding.quantity > 0)
      .sort((a, b) => {
        const getValue = (item) => {
          if (
            item.holdingValueRaw !== undefined &&
            item.holdingValueRaw !== null
          ) {
            return Number(item.holdingValueRaw);
          }
          if (item.holdingValue) {
            return parseFloat(item.holdingValue.replace(/[^0-9.]/g, "")) || 0;
          }
          return 0;
        };
        return getValue(b) - getValue(a);
      }) || [];

  const summaryItems = [
    {
      label: TEXT.totalAsset,
      value: dashboard?.totalAsset ?? "-",
      tone: "primary",
    },
    {
      label: TEXT.cashOnHand,
      value: dashboard?.cashBalance ?? selectedAccount?.cashBalance ?? "-",
      tone: "neutral",
    },
    {
      label: TEXT.totalProfit,
      value: dashboard?.totalProfitAmount ?? "-",
      tone: "profit",
    },
    {
      label: TEXT.returnRate,
      value: dashboard?.totalReturnRate ?? "-",
      tone: "accent",
    },
  ];

  return (
    <div className="mypage-container">
      <div className="mypage-layout">
        <aside className="mypage-left">
          <section className="content-card mypage-profile-card">
            <div className="mypage-card-header">
              <div>
                <p className="mypage-eyebrow">My Page</p>
                <h2 className="mypage-title">
                  {isMyOwnPage
                    ? TEXT.myInfo
                    : `${profile?.nickname || TEXT.user} ${TEXT.infoSuffix}`}
                </h2>
              </div>
              {isMyOwnPage && (
                <AppButton type="button" onClick={onMoveAccountSettings} size="sm">
                  {TEXT.edit}
                </AppButton>
              )}
            </div>

            {error ? <p className="page-desc">{error}</p> : null}

            <div className="mypage-profile-summary">
              <div className="mypage-profile-avatar">
                {profileImageUrl ? (
                  <img src={profileImageUrl} alt={TEXT.myInfo} />
                ) : (
                  <span>{profile?.nickname?.[0] || "U"}</span>
                )}
              </div>
              <div className="mypage-profile-copy">
                <strong>{profile?.nickname ?? TEXT.user}</strong>
                <div className="mypage-email-wrapper">
                  <span title={profile?.email ?? targetEmail}>{profile?.email ?? targetEmail ?? "-"}</span>
                </div>
              </div>
            </div>

            <div className="mypage-info-list">
              <div className="mypage-info-item">
                <span className="mypage-info-label">{TEXT.joinedAt}</span>
                <span className="mypage-info-value">{createdAtText}</span>
              </div>
              <div className="mypage-info-item">
                <span className="mypage-info-label">{TEXT.accountCount}</span>
                <span className="mypage-info-value">{`${accounts.length}개`}</span>
              </div>
              <div className="mypage-info-item">
                <span className="mypage-info-label">{TEXT.competitionCount}</span>
                <span className="mypage-info-value">{`${myCompetitions.length}개`}</span>
              </div>
            </div>

            <div className="mypage-account-section">
              <div className="mypage-section-head">
                <div>
                  <h3>{TEXT.myAccounts}</h3>
                  <p>{TEXT.chooseAccount}</p>
                </div>
              </div>

              {accounts.length > 0 ? (
                <div className="mypage-account-list">
                  {accounts.map((account, index) => {
                    const isMainAccount = account.accountType === "MAIN";
                    const isSelected = selectedAccountId === account.accountId;

                    return (
                      <div
                        key={account.accountId}
                        type="button"
                        className={`mypage-account-card ${isSelected ? "is-selected" : ""
                          }`}
                        onClick={() => setSelectedAccountId(account.accountId)}
                      >
                        <div className="mypage-account-top">
                          <div>
                            <strong className="mypage-account-name">
                              {account.accountName || `${TEXT.account} ${index + 1}`}
                            </strong>
                            <div className="mypage-account-meta">
                              {isMainAccount ? (
                                <span className="mypage-badge">{TEXT.mainAccount}</span>
                              ) : null}
                              {isSelected ? (
                                <span className="mypage-badge active">
                                  {TEXT.selected}
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <span className="mypage-account-indicator" />
                        </div>

                        <div className="mypage-account-bottom">
                          <div>
                            <span className="mypage-account-label">
                              {TEXT.cashBalance}
                            </span>
                            <strong className="mypage-account-balance">
                              {account.cashBalance ?? "-"}
                            </strong>
                          </div>

                          {isMyOwnPage && isMainAccount && isSelected ? (
                            <button
                              type="button"
                              className="mypage-reset-button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleResetCash(account.accountId);
                              }}
                              disabled={resettingAccountId === account.accountId}
                            >
                              {resettingAccountId === account.accountId
                                ? TEXT.processing
                                : TEXT.reset}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mypage-empty-box">
                  <p>{TEXT.noAccounts}</p>
                </div>
              )}
            </div>
          </section>
        </aside>

        <main className="mypage-right">
          {isLoading ? (
            <DashboardSkeleton />
          ) : (
            <>
              <section className="mypage-stats-grid">
                {summaryItems.map((item) => {
                  const isProfit = item.label === TEXT.totalProfit;
                  const isRate = item.label === TEXT.returnRate;

                  let valueClass = "";

                  if (isProfit) {
                    const num = Number(String(item.value).replace(/[^0-9.-]/g, ""));
                    valueClass = num > 0 ? "up" : num < 0 ? "down" : "";
                  }

                  if (isRate) {
                    const num = parseFloat(item.value);
                    valueClass = num > 0 ? "up" : num < 0 ? "down" : "";
                  }

                  return (
                    <article key={item.label} className="mypage-stat-card">
                      <span className="mypage-stat-label">{item.label}</span>
                      <span className={`mypage-stat-value ${valueClass}`}>
                        {item.value}
                      </span>
                    </article>
                  );
                })}
              </section>

              <section className="content-card mypage-portfolio-card">
                <div className="mypage-card-header">
                  <div>
                    <p className="mypage-eyebrow">Portfolio</p>
                    <h2 className="mypage-title">{TEXT.assetStatus}</h2>
                  </div>
                  <div className="mypage-selected-account">
                    <span>{TEXT.selectedAccountLabel}</span>
                    <strong>
                      {selectedAccount?.accountName || TEXT.selectAccountHelp}
                    </strong>
                  </div>
                </div>

                <div className="portfolio-section-layout">
                  <div className="portfolio-chart-container">
                    <div className="mypage-section-head">
                      <div>
                        <h3>{TEXT.portfolioRatio}</h3>
                        <p>{TEXT.portfolioRatioDesc}</p>
                      </div>
                    </div>
                    <PortfolioChart holdings={visibleHoldings} />
                  </div>

                  <div className="portfolio-list-container">
                    <div className="mypage-section-head">
                      <div>
                        <h3>{TEXT.holdingsStatus}</h3>
                        <p>{TEXT.holdingsStatusDesc}</p>
                      </div>
                      <span className="mypage-table-count">
                        {`${visibleHoldings.length}${TEXT.stockCountSuffix}`}
                      </span>
                    </div>

                    <div className="mypage-table-wrap">
                      <table className="stock-table mypage-table">
                        <thead>
                          <tr>
                            <th>{TEXT.stockName}</th>
                            <th>{TEXT.quantity}</th>
                            <th>{TEXT.averageBuyPrice}</th>
                            <th>{TEXT.currentPrice}</th>
                            <th>{TEXT.profitRate}</th>
                            <th>{TEXT.valuation}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visibleHoldings.length === 0 ? (
                            <tr>
                              <td colSpan="6" className="mypage-empty-cell">
                                {TEXT.noHoldings}
                              </td>
                            </tr>
                          ) : (
                            visibleHoldings.map((item, index) => {
                              const parsePrice = (str) =>
                                parseFloat(String(str).replace(/[^0-9.]/g, "")) || 0;
                              const avg = parsePrice(item.averageBuyPrice);
                              const curr = parsePrice(item.currentPrice);
                              const rate = avg > 0 ? ((curr - avg) / avg) * 100 : 0;
                              const rateClass =
                                rate > 0
                                  ? "stock-profit-up"
                                  : rate < 0
                                    ? "stock-profit-down"
                                    : "";
                              const rateSign = rate > 0 ? "+" : "";

                              return (
                                <tr key={`${item.stockName}-${index}`}>
                                  <td>{item.stockName}</td>
                                  <td>{`${item.quantity?.toLocaleString()}${TEXT.shares
                                    }`}</td>
                                  <td>{item.averageBuyPrice}</td>
                                  <td>{item.currentPrice}</td>
                                  <td className={rateClass}>
                                    {rate === 0
                                      ? "0.00%"
                                      : `${rateSign}${rate.toFixed(2)}%`}
                                  </td>
                                  <td>
                                    <strong>{item.holdingValue}</strong>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </section>

              {/* [이동] 자산 성장 곡선 차트 (자산 현황과 주문 내역 사이) */}
              <section className="content-card mypage-growth-card" style={{ marginBottom: "24px", marginTop: "24px" }}>
                <div className="mypage-card-header">
                  <div>
                    <p className="mypage-eyebrow">Performance</p>
                    <h2 className="mypage-title">{TEXT.assetGrowthTitle}</h2>
                    <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "4px" }}>{TEXT.assetGrowthDesc}</p>
                  </div>
                </div>
                <div style={{ padding: "10px 0" }}>
                  <AssetGrowthChart data={snapshots} />
                </div>
              </section>

              {selectedAccountId ? (
                <OrderHistory
                  accountId={selectedAccountId}
                  accountName={selectedAccount?.accountName}
                  currentUser={currentUser}
                />
              ) : null}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default MyPage;
