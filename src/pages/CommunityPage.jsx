import React, { useEffect, useMemo, useState } from "react";

const PREVIEW_POST_LIMIT = 3;
const TREND_STOCK_LIMIT = 6;
const DEFAULT_PREVIEW_SYMBOL = "005930";

const CommunityPage = ({
  onSelectNoticeBoard,
  onSelectFreeBoard,
  onSelectStockCommunity,
}) => {
  const [stocks, setStocks] = useState([]);
  const [freePosts, setFreePosts] = useState([]);
  const [selectedStockSymbol, setSelectedStockSymbol] = useState(null);
  const [selectedStockPosts, setSelectedStockPosts] = useState([]);

  const [loadingStocks, setLoadingStocks] = useState(true);
  const [loadingFreePosts, setLoadingFreePosts] = useState(true);
  const [loadingSelectedStockPosts, setLoadingSelectedStockPosts] = useState(false);

  const [searchKeyword, setSearchKeyword] = useState("");

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        setLoadingStocks(true);

        const response = await fetch("/api/stocks?page=1&size=60");
        if (!response.ok) {
          throw new Error("종목 목록을 불러오지 못했습니다.");
        }

        const data = await response.json();
        const stockList = Array.isArray(data.content) ? data.content : [];
        setStocks(stockList);

        if (stockList.length > 0) {
          const defaultStock =
            stockList.find((stock) => stock.symbol === DEFAULT_PREVIEW_SYMBOL) ||
            stockList[0];
          setSelectedStockSymbol(defaultStock?.symbol || null);
        }
      } catch (error) {
        console.error("커뮤니티 종목 목록 조회 오류:", error);
        setStocks([]);
      } finally {
        setLoadingStocks(false);
      }
    };

    const fetchFreePosts = async () => {
      try {
        setLoadingFreePosts(true);

        const response = await fetch(
          "/api/community/boards/free/posts"
        );

        if (!response.ok) {
          throw new Error("자유게시판 목록을 불러오지 못했습니다.");
        }

        const data = await response.json();
        setFreePosts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("자유게시판 목록 조회 오류:", error);
        setFreePosts([]);
      } finally {
        setLoadingFreePosts(false);
      }
    };

    fetchStocks();
    fetchFreePosts();
  }, []);

  useEffect(() => {
    const fetchSelectedStockPosts = async () => {
      if (!selectedStockSymbol) {
        setSelectedStockPosts([]);
        return;
      }

      try {
        setLoadingSelectedStockPosts(true);

        const response = await fetch(
          `/api/community/stocks/${selectedStockSymbol}/posts`
        );

        if (!response.ok) {
          throw new Error("선택 종목 게시글을 불러오지 못했습니다.");
        }

        const data = await response.json();
        const postList = Array.isArray(data) ? data : [];
        setSelectedStockPosts(postList.filter((post) => !post.isNotice));
      } catch (error) {
        console.error("선택 종목 게시글 조회 오류:", error);
        setSelectedStockPosts([]);
      } finally {
        setLoadingSelectedStockPosts(false);
      }
    };

    fetchSelectedStockPosts();
  }, [selectedStockSymbol]);

  const filteredStocks = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    if (!keyword) return stocks;

    return stocks.filter((stock) =>
      `${stock.name ?? ""} ${stock.symbol ?? ""}`
        .toLowerCase()
        .includes(keyword)
    );
  }, [stocks, searchKeyword]);

  const selectedStockInfo = useMemo(() => {
    return stocks.find((stock) => stock.symbol === selectedStockSymbol) || null;
  }, [stocks, selectedStockSymbol]);

  const recentFreePosts = useMemo(() => {
    return [...freePosts]
      .filter((post) => !post.isNotice)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, PREVIEW_POST_LIMIT);
  }, [freePosts]);

  const popularFreePosts = useMemo(() => {
    return [...freePosts]
      .filter((post) => !post.isNotice)
      .sort((a, b) => {
        const likeGap = (b.likeCount ?? 0) - (a.likeCount ?? 0);
        if (likeGap !== 0) return likeGap;
        return new Date(b.createdAt) - new Date(a.createdAt);
      })
      .slice(0, PREVIEW_POST_LIMIT);
  }, [freePosts]);

  const recentSelectedStockPosts = useMemo(() => {
    return [...selectedStockPosts]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, PREVIEW_POST_LIMIT);
  }, [selectedStockPosts]);

  const popularSelectedStockPosts = useMemo(() => {
    return [...selectedStockPosts]
      .sort((a, b) => {
        const likeGap = (b.likeCount ?? 0) - (a.likeCount ?? 0);
        if (likeGap !== 0) return likeGap;
        return new Date(b.createdAt) - new Date(a.createdAt);
      })
      .slice(0, PREVIEW_POST_LIMIT);
  }, [selectedStockPosts]);

  const hotStocks = useMemo(() => {
    return [...stocks]
      .sort(
        (a, b) =>
          Math.abs(Number(b.changeRate ?? 0)) - Math.abs(Number(a.changeRate ?? 0))
      )
      .slice(0, TREND_STOCK_LIMIT);
  }, [stocks]);

  const positiveStocks = useMemo(() => {
    return [...stocks]
      .filter((stock) => Number(stock.changeRate ?? 0) > 0)
      .sort((a, b) => Number(b.changeRate ?? 0) - Number(a.changeRate ?? 0))
      .slice(0, TREND_STOCK_LIMIT);
  }, [stocks]);

  const formatDateTime = (value) => {
    if (!value) return "-";

    const date = new Date(value);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");

    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  };

  const renderPostPreviewList = (
    posts,
    emptyMessage,
    onClickMore,
    loading = false,
    moreLabel = "더 보기 →"
  ) => {
    if (loading) {
      return <div style={styles.sectionLoading}>게시글을 불러오는 중입니다...</div>;
    }

    if (!posts.length) {
      return <div style={styles.sectionEmpty}>{emptyMessage}</div>;
    }

    return (
      <div style={styles.postPreviewList}>
        {posts.map((post) => (
          <button
            key={post.postId}
            type="button"
            style={styles.postPreviewItem}
            onClick={onClickMore}
          >
            <div style={styles.postPreviewTop}>
              <div style={styles.postPreviewTitleWrap}>
                <span style={styles.postPreviewTitle}>{post.title}</span>
              </div>
              <div style={styles.postPreviewLike}>💬 {post.commentCount ?? 0}</div>
            </div>

            <div style={styles.postPreviewMeta}>
              <span>{post.nickname}</span>
              <span>추천 {post.likeCount ?? 0}</span>
              <span>{formatDateTime(post.createdAt)}</span>
            </div>
          </button>
        ))}

        <button type="button" style={styles.moreLinkButton} onClick={onClickMore}>
          {moreLabel}
        </button>
      </div>
    );
  };

  return (
    <section style={styles.page}>
      <div style={styles.hero}>
        <div style={styles.heroBadge}>COMMUNITY</div>
        <h1 style={styles.heroTitle}>커뮤니티</h1>
        <p style={styles.heroText}>
          공지, 자유게시판, 종목별 게시판을 한 곳에서 확인해보세요.
        </p>
      </div>

      <div style={styles.layout}>
        <aside style={styles.sidebar}>
          <div style={styles.sidebarCard}>
            <div style={styles.sidebarTitle}>게시판</div>

            <button
              type="button"
              className="side-menu-btn notice"
              onClick={onSelectNoticeBoard}
            >
              공지사항
            </button>

            <button
              type="button"
              className="side-menu-btn active"
              onClick={onSelectFreeBoard}
            >
              자유게시판
            </button>

            <button type="button" className="side-menu-btn disabled">
              토론게시판
              <span className="side-menu-soon">준비중</span>
            </button>
          </div>

          <div style={styles.sidebarCard}>
            <div style={styles.sidebarTitle}>커뮤니티 한눈에</div>
            <div style={styles.sidebarText}>
              지금은 공지사항, 자유게시판, 종목별 게시판을 운영 중입니다.
              토론게시판은 곧 확장될 예정입니다.
            </div>
          </div>

          <div style={styles.sidebarCard}>
            <div style={styles.sidebarTitle}>급등 종목</div>

            {loadingStocks ? (
              <div style={styles.sidebarLoading}>불러오는 중...</div>
            ) : positiveStocks.length === 0 ? (
              <div style={styles.sidebarEmpty}>표시할 종목이 없습니다.</div>
            ) : (
              <div style={styles.sideStockList}>
                {positiveStocks.map((stock) => (
                  <button
                    key={stock.symbol}
                    type="button"
                    style={styles.sideStockItem}
                    onClick={() => setSelectedStockSymbol(stock.symbol)}
                  >
                    <div style={styles.sideStockLeft}>
                      <span style={styles.sideStockSymbol}>{stock.symbol}</span>
                      <span style={styles.sideStockName}>{stock.name}</span>
                    </div>
                    <span style={styles.sideStockRatePositive}>
                      +{Number(stock.changeRate ?? 0).toFixed(2)}%
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        <div style={styles.content}>
          <div style={styles.marketSummaryCard}>
            <div style={styles.marketSummaryHeader}>
              <div>
                <h3 style={styles.marketSummaryTitle}>커뮤니티 주목 종목</h3>
                <p style={styles.marketSummaryDesc}>
                  변동률이 큰 종목을 빠르게 확인하고 미리보기 종목으로 선택할 수 있습니다.
                </p>
              </div>
            </div>

            {loadingStocks ? (
              <div style={styles.sectionLoading}>종목 정보를 불러오는 중입니다...</div>
            ) : hotStocks.length === 0 ? (
              <div style={styles.sectionEmpty}>표시할 종목이 없습니다.</div>
            ) : (
              <div style={styles.hotStockGrid}>
                {hotStocks.map((stock) => (
                  <button
                    key={stock.symbol}
                    type="button"
                    style={{
                      ...styles.hotStockCard,
                      ...(selectedStockSymbol === stock.symbol
                        ? styles.hotStockCardActive
                        : {}),
                    }}
                    onClick={() => setSelectedStockSymbol(stock.symbol)}
                  >
                    <div style={styles.hotStockTop}>
                      <span style={styles.hotStockSymbol}>{stock.symbol}</span>
                      <span
                        style={{
                          ...styles.hotStockRate,
                          color:
                            Number(stock.changeRate) >= 0 ? "#e03131" : "#1971c2",
                        }}
                      >
                        {Number(stock.changeRate) >= 0 ? "+" : ""}
                        {Number(stock.changeRate ?? 0).toFixed(2)}%
                      </span>
                    </div>
                    <div style={styles.hotStockName}>{stock.name}</div>
                    <div style={styles.hotStockPrice}>
                      {stock.currentPrice
                        ? `${Number(stock.currentPrice).toLocaleString("ko-KR")}원`
                        : "-"}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={styles.previewGrid}>
            <div style={styles.previewCard}>
              <div style={styles.previewHeader}>
                <div>
                  <div style={styles.previewBadge}>🔥 HOT</div>
                  <h3 style={styles.previewTitle}>자유게시판 인기글</h3>
                </div>
              </div>

              {renderPostPreviewList(
                popularFreePosts,
                "아직 인기글이 없습니다.",
                onSelectFreeBoard,
                loadingFreePosts,
                "자유게시판 더 보기 →"
              )}
            </div>

            <div style={styles.previewCard}>
              <div style={styles.previewHeader}>
                <div>
                  <div style={styles.previewBadgeAlt}>🆕 NEW</div>
                  <h3 style={styles.previewTitle}>자유게시판 최근글</h3>
                </div>
              </div>

              {renderPostPreviewList(
                recentFreePosts,
                "아직 최근글이 없습니다.",
                onSelectFreeBoard,
                loadingFreePosts,
                "자유게시판 더 보기 →"
              )}
            </div>
          </div>

          <div style={styles.stockSection}>
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>종목별 게시판</h2>
                <p style={styles.sectionDesc}>
                  종목을 선택하면 해당 게시판의 인기글과 최근글을 바로 볼 수 있습니다.
                </p>
              </div>
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

            <div style={styles.stockTabWrap}>
              {loadingStocks ? (
                <div style={styles.sectionLoading}>종목 목록을 불러오는 중입니다...</div>
              ) : filteredStocks.length === 0 ? (
                <div style={styles.sectionEmpty}>
                  검색 결과가 없습니다. 다른 종목명이나 종목코드로 다시 검색해보세요.
                </div>
              ) : (
                <div style={styles.stockTabGrid}>
                  {filteredStocks.map((stock) => (
                    <button
                      key={stock.symbol}
                      type="button"
                      onClick={() => setSelectedStockSymbol(stock.symbol)}
                      style={{
                        ...styles.stockTabButton,
                        ...(selectedStockSymbol === stock.symbol
                          ? styles.stockTabButtonActive
                          : {}),
                      }}
                    >
                      {stock.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={styles.selectedBoardCard}>
              <div style={styles.selectedBoardHeader}>
                <div>
                  <div style={styles.selectedBoardBadge}>
                    {selectedStockInfo?.symbol || "-"}
                  </div>
                  <h3 style={styles.selectedBoardTitle}>
                    {selectedStockInfo?.name || "종목 선택"} 게시판
                  </h3>
                  <p style={styles.selectedBoardDesc}>
                    선택한 종목 게시판의 인기글과 최신글을 바로 확인할 수 있습니다.
                  </p>
                </div>

                <button
                  type="button"
                  style={styles.selectedBoardMoreButton}
                  onClick={() => {
                    if (selectedStockSymbol) {
                      onSelectStockCommunity(selectedStockSymbol);
                    }
                  }}
                  disabled={!selectedStockSymbol}
                >
                  {selectedStockInfo?.name || "선택 종목"} 게시판 더 보기 →
                </button>
              </div>

              <div style={styles.stockPreviewGrid}>
                <div style={styles.previewCardSoft}>
                  <div style={styles.previewHeader}>
                    <div>
                      <div style={styles.previewBadge}>🔥 HOT</div>
                      <h3 style={styles.previewTitle}>
                        {selectedStockInfo?.name || "선택 종목"} 인기글
                      </h3>
                    </div>
                  </div>

                  {renderPostPreviewList(
                    popularSelectedStockPosts,
                    "아직 인기글이 없습니다.",
                    () => {
                      if (selectedStockSymbol) {
                        onSelectStockCommunity(selectedStockSymbol);
                      }
                    },
                    loadingSelectedStockPosts,
                    `${selectedStockInfo?.name || "선택 종목"} 게시판 더 보기 →`
                  )}
                </div>

                <div style={styles.previewCardSoft}>
                  <div style={styles.previewHeader}>
                    <div>
                      <div style={styles.previewBadgeAlt}>🆕 NEW</div>
                      <h3 style={styles.previewTitle}>
                        {selectedStockInfo?.name || "선택 종목"} 최근글
                      </h3>
                    </div>
                  </div>

                  {renderPostPreviewList(
                    recentSelectedStockPosts,
                    "아직 최근글이 없습니다.",
                    () => {
                      if (selectedStockSymbol) {
                        onSelectStockCommunity(selectedStockSymbol);
                      }
                    },
                    loadingSelectedStockPosts,
                    `${selectedStockInfo?.name || "선택 종목"} 게시판 더 보기 →`
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
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
  layout: {
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
    borderRadius: "20px",
    padding: "18px",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.04)",
  },
  sidebarTitle: {
    fontSize: "17px",
    fontWeight: "900",
    color: "#111827",
    marginBottom: "12px",
  },
  sideMenuButton: {
    width: "100%",
    textAlign: "left",
    border: "1px solid #dbe4ff",
    background: "#eef2ff",
    color: "#1d4ed8",
    borderRadius: "14px",
    padding: "13px 14px",
    fontSize: "14px",
    fontWeight: "800",
    cursor: "pointer",
    marginBottom: "8px",
  },
  sideMenuButtonNotice: {
    width: "100%",
    textAlign: "left",
    border: "1px solid #bfdbfe",
    background: "#eff6ff",
    color: "#1e40af",
    borderRadius: "14px",
    padding: "13px 14px",
    fontSize: "14px",
    fontWeight: "800",
    cursor: "pointer",
    marginBottom: "8px",
  },
  sideMenuButtonDisabled: {
    width: "100%",
    textAlign: "left",
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
    color: "#6b7280",
    borderRadius: "14px",
    padding: "13px 14px",
    fontSize: "14px",
    fontWeight: "800",
    cursor: "default",
    marginBottom: "8px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sideMenuSoon: {
    fontSize: "11px",
    color: "#b45309",
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    borderRadius: "999px",
    padding: "2px 8px",
  },
  sidebarText: {
    fontSize: "13px",
    lineHeight: "1.8",
    color: "#667085",
  },
  sidebarLoading: {
    fontSize: "13px",
    color: "#6b7280",
    padding: "8px 0",
  },
  sidebarEmpty: {
    fontSize: "13px",
    color: "#6b7280",
    padding: "8px 0",
  },
  sideStockList: {
    display: "grid",
    gap: "8px",
  },
  sideStockItem: {
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
  sideStockLeft: {
    display: "grid",
    gap: "3px",
  },
  sideStockSymbol: {
    fontSize: "12px",
    color: "#667085",
    fontWeight: "800",
  },
  sideStockName: {
    fontSize: "14px",
    color: "#111827",
    fontWeight: "800",
  },
  sideStockRatePositive: {
    fontSize: "13px",
    color: "#e03131",
    fontWeight: "900",
    flexShrink: 0,
  },
  content: {
    display: "grid",
    gap: "18px",
  },
  previewGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "18px",
  },
  previewCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
    padding: "20px",
    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.04)",
  },
  previewCardSoft: {
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "18px",
  },
  previewHeader: {
    marginBottom: "12px",
  },
  previewBadge: {
    display: "inline-block",
    fontSize: "12px",
    fontWeight: "800",
    color: "#e03131",
    marginBottom: "6px",
  },
  previewBadgeAlt: {
    display: "inline-block",
    fontSize: "12px",
    fontWeight: "800",
    color: "#1d4ed8",
    marginBottom: "6px",
  },
  previewTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "800",
    color: "#111827",
  },
  postPreviewList: {
    display: "grid",
    gap: "10px",
  },
  postPreviewItem: {
    width: "100%",
    textAlign: "left",
    border: "1px solid #edf2f7",
    background: "#fff",
    borderRadius: "14px",
    padding: "14px",
    cursor: "pointer",
  },
  postPreviewTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "8px",
  },
  postPreviewTitleWrap: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    minWidth: 0,
  },
  postPreviewTitle: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#111827",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  postPreviewLike: {
    fontSize: "13px",
    fontWeight: "800",
    color: "#ef4444",
    flexShrink: 0,
  },
  postPreviewMeta: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    fontSize: "12px",
    color: "#6b7280",
  },
  moreLinkButton: {
    border: "none",
    background: "transparent",
    color: "#3b5bdb",
    fontSize: "13px",
    fontWeight: "800",
    cursor: "pointer",
    textAlign: "left",
    padding: "4px 2px 0",
  },
  marketSummaryCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
    padding: "20px",
    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.04)",
  },
  marketSummaryHeader: {
    marginBottom: "14px",
  },
  marketSummaryTitle: {
    margin: "0 0 6px",
    fontSize: "20px",
    fontWeight: "800",
    color: "#111827",
  },
  marketSummaryDesc: {
    margin: 0,
    fontSize: "14px",
    lineHeight: "1.7",
    color: "#667085",
  },
  hotStockGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "12px",
  },
  hotStockCard: {
    textAlign: "left",
    border: "1px solid #edf2f7",
    background: "#fff",
    borderRadius: "16px",
    padding: "16px",
    cursor: "pointer",
  },
  hotStockCardActive: {
    border: "1px solid #3b5bdb",
    background: "#eef4ff",
    boxShadow: "inset 0 0 0 1px #3b5bdb",
  },
  hotStockTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    marginBottom: "10px",
  },
  hotStockSymbol: {
    fontSize: "12px",
    fontWeight: "800",
    color: "#667085",
  },
  hotStockRate: {
    fontSize: "13px",
    fontWeight: "900",
  },
  hotStockName: {
    fontSize: "18px",
    fontWeight: "900",
    color: "#111827",
    marginBottom: "8px",
  },
  hotStockPrice: {
    fontSize: "14px",
    fontWeight: "800",
    color: "#374151",
  },
  stockSection: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
    padding: "20px",
    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.04)",
  },
  sectionHeader: {
    marginBottom: "14px",
  },
  sectionTitle: {
    margin: "0 0 6px",
    fontSize: "20px",
    fontWeight: "800",
    color: "#111827",
  },
  sectionDesc: {
    margin: 0,
    fontSize: "14px",
    lineHeight: "1.7",
    color: "#667085",
  },
  searchWrap: {
    marginBottom: "16px",
  },
  searchInput: {
    width: "100%",
    height: "46px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    padding: "0 14px",
    fontSize: "14px",
    outline: "none",
    background: "#fff",
  },
  stockTabWrap: {
    marginBottom: "18px",
    padding: "18px",
    borderRadius: "18px",
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
  },
  stockTabGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
  },
  stockTabButton: {
    height: "40px",
    padding: "0 16px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#374151",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
  },
  stockTabButtonActive: {
    background: "#1f2937",
    color: "#fff",
    border: "1px solid #1f2937",
  },
  selectedBoardCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
    padding: "22px",
  },
  selectedBoardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "18px",
  },
  selectedBoardBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px 10px",
    borderRadius: "999px",
    background: "#eef2ff",
    color: "#4c6ef5",
    fontSize: "12px",
    fontWeight: "800",
    marginBottom: "10px",
  },
  selectedBoardTitle: {
    margin: "0 0 8px",
    fontSize: "28px",
    fontWeight: "900",
    color: "#111827",
    letterSpacing: "-0.02em",
  },
  selectedBoardDesc: {
    margin: 0,
    fontSize: "14px",
    color: "#667085",
    lineHeight: "1.7",
  },
  selectedBoardMoreButton: {
    height: "42px",
    padding: "0 16px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#374151",
    fontSize: "14px",
    fontWeight: "800",
    cursor: "pointer",
  },
  stockPreviewGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "18px",
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
  sectionLoading: {
    padding: "18px 0",
    fontSize: "14px",
    color: "#6b7280",
  },
  sectionEmpty: {
    padding: "18px 0",
    fontSize: "14px",
    color: "#6b7280",
  },
};

export default CommunityPage;