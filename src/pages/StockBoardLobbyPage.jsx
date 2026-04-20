import React, { useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 120;

const StockBoardLobbyPage = ({
  onBack,
  onMoveFreeBoard,
  onOpenStockBoard,
  onSelectNoticeBoard,
}) => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchStocksPage = async (pageNumber, append = false) => {
    const response = await fetch(
      `/api/stocks?page=${pageNumber}&size=${PAGE_SIZE}`
    );

    if (!response.ok) {
      throw new Error("종목 목록을 불러오지 못했습니다.");
    }

    const data = await response.json();
    const stockList = Array.isArray(data.content) ? data.content : [];

    setStocks((prev) => (append ? [...prev, ...stockList] : stockList));
    setPage(pageNumber);

    const totalPages =
      typeof data.totalPages === "number" ? data.totalPages : null;
    const isLast =
      typeof data.last === "boolean"
        ? data.last
        : totalPages != null
        ? pageNumber >= totalPages
        : stockList.length < PAGE_SIZE;

    setHasMore(!isLast);
  };

  const fetchInitialStocks = async () => {
    try {
      setLoading(true);
      await fetchStocksPage(1, false);
    } catch (error) {
      console.error(error);
      setStocks([]);
      setPage(1);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      await fetchStocksPage(page + 1, true);
    } catch (error) {
      console.error(error);
      alert("추가 종목을 불러오지 못했습니다.");
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchInitialStocks();
  }, []);

  const hotStocks = useMemo(() => {
    return [...stocks]
      .sort(
        (a, b) =>
          Math.abs(Number(b.changeRate ?? 0)) - Math.abs(Number(a.changeRate ?? 0))
      )
      .slice(0, 8);
  }, [stocks]);

  const positiveStocks = useMemo(() => {
    return [...stocks]
      .filter((stock) => Number(stock.changeRate ?? 0) > 0)
      .sort((a, b) => Number(b.changeRate ?? 0) - Number(a.changeRate ?? 0))
      .slice(0, 8);
  }, [stocks]);

  const filteredStocks = useMemo(() => {
    const value = keyword.trim().toLowerCase();

    if (!value) return stocks;

    return stocks.filter((stock) =>
      `${stock.name ?? ""} ${stock.symbol ?? ""}`
        .toLowerCase()
        .includes(value)
    );
  }, [stocks, keyword]);

  return (
    <section style={styles.page}>
      <button type="button" onClick={onBack} style={styles.backButton}>
        ← 자유게시판으로 돌아가기
      </button>

      <div style={styles.pageLayout}>
        <aside style={styles.sidebar}>
          <div style={styles.sidebarCard}>
            <div style={styles.sidebarTitle}>게시판</div>
            <button
              type="button"
              style={styles.sideMenuButton}
              onClick={onMoveFreeBoard}
            >
              자유게시판
            </button>
            <button type="button" style={styles.sideMenuButtonActive}>
              종목게시판
            </button>
            <button
              type="button"
              style={styles.sideMenuButtonNotice}
              onClick={onSelectNoticeBoard}
            >
              공지사항
            </button>
          </div>

          <div style={styles.sidebarCard}>
            <div style={styles.sidebarTitle}>급등 종목 TOP 8</div>
            <div style={styles.quickList}>
              {positiveStocks.map((stock) => (
                <button
                  key={stock.symbol}
                  type="button"
                  style={styles.quickItem}
                  onClick={() => onOpenStockBoard?.(stock.symbol)}
                >
                  <div style={styles.quickLeft}>
                    <span style={styles.quickSymbol}>{stock.symbol}</span>
                    <span style={styles.quickName}>{stock.name}</span>
                  </div>
                  <span style={styles.quickRate}>
                    +{Number(stock.changeRate ?? 0).toFixed(2)}%
                  </span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div style={styles.content}>
          <div style={styles.heroCard}>
            <div style={styles.heroBadge}>STOCK BOARD</div>
            <h1 style={styles.heroTitle}>종목게시판</h1>
            <p style={styles.heroDesc}>
              원하는 종목을 선택하면 해당 종목 게시판으로 바로 이동합니다.
            </p>

            <div style={styles.tabRow}>
              <button
                type="button"
                style={styles.tabButton}
                onClick={onMoveFreeBoard}
              >
                자유게시판
              </button>
              <button type="button" style={styles.tabButtonActive}>
                종목게시판
              </button>
            </div>
          </div>

          <div style={styles.summaryGrid}>
            <div style={styles.summaryCard}>
              <div style={styles.summaryHeader}>
                <span style={styles.summaryBadge}>🔥 HOT</span>
                <span style={styles.summaryTitle}>주목 종목</span>
              </div>
              <div style={styles.tagWrap}>
                {hotStocks.map((stock) => (
                  <button
                    key={stock.symbol}
                    type="button"
                    style={styles.tagButton}
                    onClick={() => onOpenStockBoard?.(stock.symbol)}
                  >
                    {stock.name}
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.summaryCard}>
              <div style={styles.summaryHeader}>
                <span style={styles.summaryBadge}>📈 TOP</span>
                <span style={styles.summaryTitle}>급등 종목</span>
              </div>
              <div style={styles.tagWrap}>
                {positiveStocks.map((stock) => (
                  <button
                    key={stock.symbol}
                    type="button"
                    style={styles.tagButton}
                    onClick={() => onOpenStockBoard?.(stock.symbol)}
                  >
                    {stock.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={styles.listCard}>
            <div style={styles.listHeader}>
              <div>
                <h3 style={styles.listTitle}>종목 선택</h3>
                <p style={styles.listDesc}>
                  박스를 클릭하면 해당 종목 게시판으로 이동합니다.
                </p>
              </div>

              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="종목명 또는 종목코드 검색"
                style={styles.searchInput}
              />
            </div>

            {loading ? (
              <div style={styles.loadingText}>종목 목록을 불러오는 중입니다...</div>
            ) : filteredStocks.length === 0 ? (
              <div style={styles.emptyText}>검색 결과가 없습니다.</div>
            ) : (
              <>
                <div style={styles.stockGrid}>
                  {filteredStocks.map((stock) => (
                    <button
                      key={stock.symbol}
                      type="button"
                      style={styles.stockCard}
                      onClick={() => onOpenStockBoard?.(stock.symbol)}
                    >
                      <div style={styles.stockCardTop}>
                        <span style={styles.stockCode}>{stock.symbol}</span>
                        <span
                          style={{
                            ...styles.stockRate,
                            color:
                              Number(stock.changeRate ?? 0) >= 0
                                ? "#e03131"
                                : "#1971c2",
                          }}
                        >
                          {Number(stock.changeRate ?? 0) >= 0 ? "+" : ""}
                          {Number(stock.changeRate ?? 0).toFixed(2)}%
                        </span>
                      </div>
                      <div style={styles.stockName}>{stock.name}</div>
                      <div style={styles.stockPrice}>
                        {stock.currentPrice
                          ? `${Number(stock.currentPrice).toLocaleString("ko-KR")}원`
                          : "-"}
                      </div>
                    </button>
                  ))}
                </div>

                {!keyword.trim() && hasMore && (
                  <div style={styles.loadMoreWrap}>
                    <button
                      type="button"
                      style={styles.loadMoreButton}
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                    >
                      {loadingMore ? "불러오는 중..." : "더보기 (120개씩)"}
                    </button>
                  </div>
                )}

                {!keyword.trim() && !hasMore && stocks.length > 0 && (
                  <div style={styles.endText}>
                    모든 종목을 불러왔습니다.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

const styles = {
  page: {
    maxWidth: "1320px",
    margin: "0 auto",
    padding: "28px 20px 56px",
  },
  backButton: {
    marginBottom: "16px",
    cursor: "pointer",
    border: "none",
    background: "transparent",
    fontSize: "14px",
    color: "#555",
  },
  pageLayout: {
    display: "grid",
    gridTemplateColumns: "280px 1fr",
    gap: "20px",
    alignItems: "start",
  },
  sidebar: {
    display: "grid",
    gap: "16px",
  },
  sidebarCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "16px",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.04)",
  },
  sidebarTitle: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#111827",
    marginBottom: "12px",
  },
  sideMenuButton: {
    width: "100%",
    textAlign: "left",
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#374151",
    borderRadius: "12px",
    padding: "12px 14px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    marginBottom: "8px",
  },
  sideMenuButtonActive: {
    width: "100%",
    textAlign: "left",
    border: "1px solid #111827",
    background: "#111827",
    color: "#fff",
    borderRadius: "12px",
    padding: "12px 14px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    marginBottom: "8px",
  },
  sideMenuButtonNotice: {
    width: "100%",
    textAlign: "left",
    border: "1px solid #fed7aa",
    background: "#fff7ed",
    color: "#c2410c",
    borderRadius: "12px",
    padding: "12px 14px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    marginBottom: "8px",
  },
  quickList: {
    display: "grid",
    gap: "8px",
  },
  quickItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    width: "100%",
    border: "1px solid #edf2f7",
    background: "#fff",
    borderRadius: "12px",
    padding: "10px 12px",
    cursor: "pointer",
    textAlign: "left",
  },
  quickLeft: {
    display: "grid",
    gap: "3px",
  },
  quickSymbol: {
    fontSize: "12px",
    color: "#667085",
    fontWeight: "800",
  },
  quickName: {
    fontSize: "14px",
    color: "#111827",
    fontWeight: "800",
  },
  quickRate: {
    fontSize: "13px",
    color: "#e03131",
    fontWeight: "900",
    flexShrink: 0,
  },
  content: {
    display: "grid",
    gap: "18px",
  },
  heroCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
    padding: "24px 28px",
    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.05)",
  },
  heroBadge: {
    display: "inline-block",
    padding: "6px 12px",
    borderRadius: "999px",
    background: "#eef2ff",
    color: "#4c6ef5",
    fontSize: "12px",
    fontWeight: "800",
    marginBottom: "10px",
  },
  heroTitle: {
    margin: "0 0 8px",
    fontSize: "30px",
    fontWeight: "800",
    color: "#111827",
  },
  heroDesc: {
    margin: 0,
    fontSize: "14px",
    color: "#6b7280",
    lineHeight: "1.7",
  },
  tabRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "16px",
  },
  tabButton: {
    height: "40px",
    padding: "0 18px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#374151",
    fontSize: "14px",
    fontWeight: "800",
    cursor: "pointer",
  },
  tabButtonActive: {
    height: "40px",
    padding: "0 18px",
    borderRadius: "12px",
    border: "1px solid #111827",
    background: "#111827",
    color: "#fff",
    fontSize: "14px",
    fontWeight: "800",
    cursor: "pointer",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "16px",
  },
  summaryCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "18px",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.04)",
  },
  summaryHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "12px",
  },
  summaryBadge: {
    fontSize: "12px",
    fontWeight: "800",
    color: "#4c6ef5",
  },
  summaryTitle: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#111827",
  },
  tagWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  tagButton: {
    height: "34px",
    padding: "0 12px",
    borderRadius: "999px",
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#374151",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
  },
  listCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "20px",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.04)",
  },
  listHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "16px",
    marginBottom: "18px",
    flexWrap: "wrap",
  },
  listTitle: {
    margin: "0 0 6px",
    fontSize: "20px",
    fontWeight: "800",
    color: "#111827",
  },
  listDesc: {
    margin: 0,
    fontSize: "14px",
    color: "#6b7280",
  },
  searchInput: {
    width: "320px",
    maxWidth: "100%",
    height: "42px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    padding: "0 12px",
    fontSize: "14px",
    outline: "none",
    background: "#fff",
  },
  stockGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "12px",
  },
  stockCard: {
    textAlign: "left",
    border: "1px solid #e5e7eb",
    background: "#fff",
    borderRadius: "14px",
    padding: "16px",
    cursor: "pointer",
    transition: "transform 0.15s ease",
  },
  stockCardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    marginBottom: "10px",
  },
  stockCode: {
    fontSize: "12px",
    fontWeight: "800",
    color: "#6b7280",
  },
  stockRate: {
    fontSize: "12px",
    fontWeight: "800",
  },
  stockName: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#111827",
    marginBottom: "8px",
  },
  stockPrice: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#374151",
  },
  loadingText: {
    padding: "18px 0",
    fontSize: "14px",
    color: "#6b7280",
  },
  emptyText: {
    padding: "18px 0",
    fontSize: "14px",
    color: "#6b7280",
  },
  loadMoreWrap: {
    display: "flex",
    justifyContent: "center",
    marginTop: "20px",
  },
  loadMoreButton: {
    minWidth: "180px",
    height: "42px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#111827",
    fontSize: "14px",
    fontWeight: "800",
    cursor: "pointer",
  },
  endText: {
    textAlign: "center",
    marginTop: "20px",
    fontSize: "13px",
    color: "#6b7280",
    fontWeight: "700",
  },
};

export default StockBoardLobbyPage;