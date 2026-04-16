import React, { useEffect, useMemo, useState } from "react";

const CommunityPage = ({ onSelectStockCommunity }) => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/stocks?page=1&size=60");
        if (!response.ok) {
          throw new Error("종목 목록을 불러오지 못했습니다.");
        }

        const data = await response.json();
        setStocks(Array.isArray(data.content) ? data.content : []);
      } catch (error) {
        console.error("커뮤니티 종목 목록 조회 오류:", error);
        setStocks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStocks();
  }, []);

  const filteredStocks = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    if (!keyword) return stocks;

    return stocks.filter((stock) =>
      `${stock.name ?? ""} ${stock.symbol ?? ""}`
        .toLowerCase()
        .includes(keyword)
    );
  }, [stocks, searchKeyword]);

  return (
    <section style={styles.page}>
      <div style={styles.hero}>
        <div style={styles.heroBadge}>COMMUNITY</div>
        <h1 style={styles.heroTitle}>종목 커뮤니티</h1>
      </div>

      <div style={styles.searchWrap}>
        <input
          type="text"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          placeholder="종목명 또는 종목코드를 검색하세요."
          style={styles.searchInput}
        />
      </div>

      {filteredStocks.length === 0 ? (
        <div style={styles.emptyCard}>
          <p style={styles.emptyTitle}>검색 결과가 없습니다.</p>
          <p style={styles.emptyText}>다른 종목명이나 종목코드로 다시 검색해보세요.</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredStocks.map((stock) => (
            <button
              key={stock.symbol}
              type="button"
              onClick={() => onSelectStockCommunity(stock.symbol)}
              style={styles.card}
            >
              <div style={styles.cardTop}>
                <span style={styles.symbolBadge}>{stock.symbol}</span>
              </div>

              <div style={styles.stockName}>{stock.name}</div>

              <div style={styles.priceText}>
                {stock.currentPrice
                  ? `${Number(stock.currentPrice).toLocaleString("ko-KR")}원`
                  : "-"}
              </div>

              <div
                style={{
                  ...styles.rateText,
                  color: Number(stock.changeRate) >= 0 ? "#e03131" : "#1971c2",
                }}
              >
                {stock.changeRate != null
                  ? `${Number(stock.changeRate) >= 0 ? "+" : ""}${stock.changeRate}%`
                  : "-"}
              </div>

              <div style={styles.enterText}>커뮤니티 입장</div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
};

const styles = {
  page: {
    maxWidth: "1180px",
    margin: "0 auto",
    padding: "28px 20px 56px",
  },
  hero: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "24px",
    padding: "28px 30px",
    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.05)",
    marginBottom: "18px",
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
    marginBottom: "12px",
  },
  heroTitle: {
    margin: "0 0 10px",
    fontSize: "32px",
    fontWeight: "800",
    color: "#111827",
  },
  heroText: {
    margin: 0,
    fontSize: "15px",
    lineHeight: "1.7",
    color: "#6b7280",
  },
  searchWrap: {
    marginBottom: "18px",
  },
  searchInput: {
    width: "100%",
    height: "48px",
    borderRadius: "14px",
    border: "1px solid #d1d5db",
    padding: "0 16px",
    fontSize: "14px",
    outline: "none",
    background: "#fff",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: "16px",
  },
  card: {
    textAlign: "left",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "18px",
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
  },
  cardTop: {
    marginBottom: "12px",
  },
  symbolBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px 10px",
    borderRadius: "999px",
    background: "#f3f4f6",
    color: "#374151",
    fontSize: "12px",
    fontWeight: "700",
  },
  stockName: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#111827",
    marginBottom: "10px",
  },
  priceText: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#111827",
    marginBottom: "6px",
  },
  rateText: {
    fontSize: "14px",
    fontWeight: "700",
    marginBottom: "14px",
  },
  enterText: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#4c6ef5",
  },
  emptyCard: {
    backgroundColor: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "52px 24px",
    textAlign: "center",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.04)",
  },
  emptyTitle: {
    margin: "0 0 8px",
    fontSize: "18px",
    fontWeight: "700",
    color: "#111827",
  },
  emptyText: {
    margin: 0,
    fontSize: "14px",
    color: "#6b7280",
    lineHeight: "1.6",
  },
};

export default CommunityPage;