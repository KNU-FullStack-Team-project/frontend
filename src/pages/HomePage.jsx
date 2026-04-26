import React, { useState, useEffect } from "react";
import AppButton from "../common/AppButton";
import InfoCard from "../common/InfoCard";
import SectionTitle from "../common/SectionTitle";

const HomePage = ({ isLoggedIn, onOpenLogin, currentUser, onSelectNoticeBoard, onSelectPost }) => {
  const [accountData, setAccountData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [latestNotice, setLatestNotice] = useState(null);

  useEffect(() => {
    const fetchLatestNotice = async () => {
      try {
        const response = await fetch("/api/community/notices");
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            setLatestNotice(data[0]);
          }
        }
      } catch (err) {
        console.error("Notice fetch error:", err);
      }
    };
    fetchLatestNotice();
  }, []);

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
            `/api/accounts/my/dashboard?email=${currentUser.email}`,
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
      <div style={styles.page}>
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

          {latestNotice && (
            <div style={styles.noticeBar} onClick={() => onSelectPost?.(latestNotice.postId)}>
              <span style={styles.noticeBadge}>전역공지</span>
              <span style={styles.noticeTitle}>{latestNotice.title}</span>
              <span style={styles.noticeMore}>더보기 →</span>
            </div>
          )}

          <section className="landing-section" style={{ textAlign: "center" }}>
            <SectionTitle value="서비스 소개" />
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

      {latestNotice && (
        <div style={styles.noticeBar} onClick={() => onSelectPost?.(latestNotice.postId)}>
          <span style={styles.noticeBadge}>전역공지</span>
          <span style={styles.noticeTitle}>{latestNotice.title}</span>
          <span style={styles.noticeMore}>더보기 →</span>
        </div>
      )}

      <div className="dashboard-grid">
        <article className="mypage-stat-card">
          <span className="mypage-stat-label">총 자산</span>
          <span className="mypage-stat-value">
            {accountData?.totalAsset || "₩0"}
          </span>
        </article>
        <article className="mypage-stat-card">
          <span className="mypage-stat-label">보유 현금</span>
          <span className="mypage-stat-value">
            {accountData?.cashBalance || "₩0"}
          </span>
        </article>
        <article className="mypage-stat-card">
          <span className="mypage-stat-label">평가 손익</span>
          <span
            className={`mypage-stat-value ${Number(accountData?.totalProfitAmount?.replace(/[^0-9.-]/g, "")) > 0
              ? "up"
              : Number(accountData?.totalProfitAmount?.replace(/[^0-9.-]/g, "")) < 0
                ? "down"
                : ""
              }`}
          >
            {accountData?.totalProfitAmount || "₩0"}
          </span>
        </article>

        <article className="mypage-stat-card">
          <span className="mypage-stat-label">수익률</span>
          <span
            className={`mypage-stat-value ${parseFloat(accountData?.totalReturnRate) > 0
              ? "up"
              : parseFloat(accountData?.totalReturnRate) < 0
                ? "down"
                : ""
              }`}
          >
            {accountData?.totalReturnRate || "0%"}
          </span>
        </article>

        <div className="content-card large">
          <SectionTitle value="관심 종목" />
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
          <SectionTitle value="보유 종목" />
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
    background: "linear-gradient(135deg, #4874d4, #c6d2e7)",
    border: "none",
    borderRadius: "24px",
    padding: "50px 30px",
    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.1)",
    marginBottom: "20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    position: "relative",
    color: "white",
  },
  heroBadge: {
    display: "inline-block",
    padding: "6px 14px",
    borderRadius: "999px",
    background: "rgba(255, 255, 255, 0.2)",
    color: "#fff",
    fontSize: "12px",
    fontWeight: "800",
    marginBottom: "12px",
    backdropFilter: "blur(4px)",
  },
  heroTitle: {
    margin: "0 0 10px",
    fontSize: "36px",
    fontWeight: "800",
    color: "#fff",
  },
  heroText: {
    margin: 0,
    fontSize: "15px",
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: "1.6",
    maxWidth: "800px",
  },
  noticeBar: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "14px 20px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "24px",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
    transition: "transform 0.2s ease",
  },
  noticeBadge: {
    background: "#1d4ed8",
    color: "#fff",
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
    flexShrink: 0,
  },
  noticeTitle: {
    fontSize: "14px",
    color: "#374151",
    fontWeight: "600",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    flex: 1,
  },
  noticeMore: {
    fontSize: "13px",
    color: "#6b7280",
    fontWeight: "500",
    flexShrink: 0,
  },
};

export default HomePage;
