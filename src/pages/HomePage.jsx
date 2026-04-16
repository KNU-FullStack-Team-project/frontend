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
          const token =
            localStorage.getItem("accessToken") || currentUser?.token;

          if (!token) {
            setLoading(false);
            return;
          }

          const response = await fetch(
            `http://localhost:8081/api/accounts/my/dashboard?email=${currentUser.email}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
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
  }, [isLoggedIn, currentUser]);

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

        <section className="landing-section" style={{ textAlign: "center" }}>
          <SectionTitle title="서비스 소개" />
          <div
            className="stock-grid"
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "20px",
            }}
          >
            <div className="mini-stock-card" style={{ textAlign: "center" }}>
              <h4>모의 매매</h4>
              <p>실전처럼 사고 팔며 투자 흐름을 익혀보세요.</p>
            </div>
            <div className="mini-stock-card" style={{ textAlign: "center" }}>
              <h4>대회 참여</h4>
              <p>다른 사용자와 수익률을 비교하며 경쟁해보세요.</p>
            </div>
            <div className="mini-stock-card" style={{ textAlign: "center" }}>
              <h4>포트폴리오 확인</h4>
              <p>내 투자 결과를 한눈에 정리해서 볼 수 있습니다.</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">데이터를 불러오는 중입니다...</div>
      </div>
    );
  }

  const visibleHoldings =
    accountData?.holdings?.filter((h) => h.quantity > 0) || [];

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <div style={styles.heroBadge}>MAIN</div>
        <h1 style={styles.heroTitle}>메인</h1>
        <p style={styles.heroText}>내 자산 현황을 한눈에 파악하고, 오늘의 투자 목표를 설정해보세요.</p>
      </div>

      <div className="dashboard-grid">
        <article className="mypage-stat-card tone-primary">
          <span className="mypage-stat-label">총 자산</span>
          <strong className="mypage-stat-value">
            {accountData?.totalAsset || "₩0"}
          </strong>
        </article>
        <article className="mypage-stat-card tone-neutral">
          <span className="mypage-stat-label">보유 현금</span>
          <strong className="mypage-stat-value">
            {accountData?.cashBalance || "₩0"}
          </strong>
        </article>
        <article className="mypage-stat-card tone-profit">
          <span className="mypage-stat-label">평가 손익</span>
          <strong className="mypage-stat-value">
            {accountData?.totalProfitAmount || "₩0"}
          </strong>
        </article>
        <article className="mypage-stat-card tone-accent">
          <span className="mypage-stat-label">수익률</span>
          <strong className="mypage-stat-value">
            {accountData?.totalReturnRate || "0%"}
          </strong>
        </article>

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
                    <td
                      className={parseFloat(s.changeRate) >= 0 ? "up" : "down"}
                    >
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
                    아직 등록된 관심 종목이 없습니다.
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
              {visibleHoldings.length > 0 ? (
                visibleHoldings.map((h, i) => (
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
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: "16px",
    padding: "40px 30px",
    borderRadius: "24px",
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.05)",
    marginBottom: "16px",
  },
  heroBadge: {
    display: "inline-block",
    padding: "6px 12px",
    borderRadius: "999px",
    background: "#eef2ff",
    color: "#4c6ef5",
    fontSize: "12px",
    fontWeight: "800",
    letterSpacing: "0.06em",
    marginBottom: "4px",
  },
  heroTitle: {
    margin: 0,
    fontSize: "32px",
    fontWeight: "800",
    color: "#111827",
  },
  heroText: {
    margin: 0,
    fontSize: "15px",
    lineHeight: "1.7",
    color: "#6b7280",
    maxWidth: "600px",
  },
};

export default HomePage;
