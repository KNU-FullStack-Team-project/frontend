import React, { useState, useEffect } from "react";
import AppButton from "../common/AppButton";
import InfoCard from "../common/InfoCard";
import SectionTitle from "../common/SectionTitle";

const HomePage = ({ isLoggedIn, onOpenLogin, currentUser }) => {
  const [accountData, setAccountData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn && currentUser?.email) {
      const fetchDashboard = async () => {
        setLoading(true);
        try {
          const response = await fetch(
            `/api/accounts/my/dashboard?email=${currentUser.email}`,
          );
          if (response.ok) {
            const data = await response.json();
            setAccountData(data);
          }
        } catch (err) {
          console.error("Dashboard fetch error:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchDashboard();
    }
  }, [isLoggedIn, currentUser?.email]);
  if (!isLoggedIn) {
    return (
      <div className="landing-page">
        <section className="landing-hero">
          <div className="landing-badge">Mock Invest</div>
          <h1 className="landing-title">가볍게 시작하는 모의투자</h1>
          <p className="landing-description">
            실제 돈 없이 투자 감각을 익히고, 다양한 전략을 연습해보세요.
          </p>
          <div className="landing-actions">
            <AppButton variant="primary" onClick={onOpenLogin}>
              로그인하고 시작하기
            </AppButton>
          </div>
        </section>

        <section className="landing-section">
          <SectionTitle>서비스 소개</SectionTitle>
          <div className="stock-grid">
            <div className="mini-stock-card">
              <h4>모의 매매</h4>
              <p>실전처럼 사고 팔며 투자 흐름을 익혀보세요.</p>
            </div>
            <div className="mini-stock-card">
              <h4>대회 참여</h4>
              <p>다른 사용자와 수익률을 비교하며 경쟁해보세요.</p>
            </div>
            <div className="mini-stock-card">
              <h4>포트폴리오 확인</h4>
              <p>내 투자 결과를 한눈에 정리해서 볼 수 있습니다.</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (loading) {
    return <div className="dashboard-grid">데이터를 불러오는 중...</div>;
  }

  return (
    <div className="dashboard-grid">
      <InfoCard title="총 자산" value={accountData?.totalAsset || "₩0"} />
      <InfoCard title="보유 현금" value={accountData?.cashBalance || "₩0"} />
      <InfoCard
        title="평가 손익"
        value={accountData?.totalProfitAmount || "₩0"}
        valueClassName={
          accountData?.totalProfitAmount?.startsWith("+") ? "up" : "down"
        }
      />
      <InfoCard
        title="수익률"
        value={accountData?.totalReturnRate || "0%"}
        valueClassName={
          accountData?.totalReturnRate?.startsWith("+") ? "up" : "down"
        }
      />

      <div className="content-card large">
        <SectionTitle title="관심 종목" />
        <table className="stock-table">
          <thead>
            <tr>
              <th>종목명</th>
              <th>현재가</th>
              <th>등락률</th>
              <th>거래량</th>
            </tr>
          </thead>
          <tbody>
            {accountData?.favoriteStocks &&
            accountData.favoriteStocks.length > 0 ? (
              accountData.favoriteStocks.map((s, i) => (
                <tr key={i}>
                  <td>{s.name}</td>
                  <td>{parseInt(s.currentPrice).toLocaleString()}원</td>
                  <td className={parseFloat(s.changeRate) >= 0 ? "up" : "down"}>
                    {parseFloat(s.changeRate) >= 0 ? "+" : ""}
                    {s.changeRate}%
                  </td>
                  <td>{parseInt(s.volume).toLocaleString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="4"
                  style={{ textAlign: "center", padding: "20px" }}
                >
                  관심 종목이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="content-card large">
        <SectionTitle title="보유 종목" />
        <table className="stock-table">
          <thead>
            <tr>
              <th>종목명</th>
              <th>보유수량</th>
              <th>평균단가</th>
              <th>현재가</th>
            </tr>
          </thead>
          <tbody>
            {accountData?.holdings && accountData.holdings.length > 0 ? (
              accountData.holdings.map((h, i) => (
                <tr key={i}>
                  <td>{h.stockName}</td>
                  <td>{h.quantity}주</td>
                  <td>{h.averageBuyPrice}</td>
                  <td>{h.currentPrice}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="4"
                  style={{ textAlign: "center", padding: "20px" }}
                >
                  보유 중인 종목이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HomePage;
