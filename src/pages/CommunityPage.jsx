import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";

const CommunityPage = ({ onSelectStockCommunity }) => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef(null);

  const fetchStocks = useCallback(async (pageNum = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/stocks?page=${pageNum}&size=30`);
      if (!response.ok) {
        throw new Error("종목 목록을 불러오지 못했습니다.");
      }

      const data = await response.json();
      
      if (pageNum === 1) {
        setStocks(Array.isArray(data.content) ? data.content : []);
      } else {
        setStocks((prev) => [...prev, ...(data.content || [])]);
      }

      setHasMore(data.content && data.content.length > 0 && data.currentPage < data.totalPages);
    } catch (error) {
      console.error("커뮤니티 종목 목록 조회 오류:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStocks(1);
  }, [fetchStocks]);

  useEffect(() => {
    // 검색 중일 때는 무한 스크롤을 방지합니다.
    if (searchKeyword.trim() || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchStocks(nextPage);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [hasMore, loading, page, fetchStocks, searchKeyword]);

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
        <p style={styles.heroText}>
          투자 정보를 공유하고 소통하며, 더 넓은 시장의 통찰력을 얻어보세요.
        </p>
      </div>

      <div style={styles.searchWrap}>
        <form
          onSubmit={(e) => e.preventDefault()}
          style={styles.searchForm}
        >
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="종목명 또는 종목코드를 검색하세요."
            style={styles.searchInput}
          />
          <button type="submit" style={styles.searchButton}>
            검색
          </button>
        </form>
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
          
          {/* 무한 스크롤 감지 및 로딩 표시 영역 */}
          {!searchKeyword.trim() && hasMore && (
            <div
              ref={observerTarget}
              style={styles.observerTarget}
            >
              {loading && (
                <div style={styles.loader}>
                  종목을 더 불러오는 중...
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
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
  searchWrap: {
    marginBottom: "18px",
  },
  searchForm: {
    display: "flex",
    gap: "10px",
    width: "100%",
  },
  searchInput: {
    flex: 1,
    height: "48px",
    borderRadius: "14px",
    border: "1px solid #d1d5db",
    padding: "0 16px",
    fontSize: "14px",
    outline: "none",
    background: "#fff",
  },
  searchButton: {
    padding: "0 28px",
    borderRadius: "14px",
    border: "none",
    background: "#111827",
    color: "#fff",
    fontWeight: "700",
    fontSize: "14px",
    cursor: "pointer",
    transition: "background 0.2s",
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
  observerTarget: {
    gridColumn: "1 / -1",
    height: "100px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  loader: {
    padding: "20px",
    background: "#f8fafc",
    borderRadius: "12px",
    color: "#64748b",
    fontSize: "14px",
    fontWeight: "700",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
  },
};

export default CommunityPage;