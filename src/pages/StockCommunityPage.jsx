import React, { useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 10;

const StockCommunityPage = ({
  symbol,
  currentUser,
  isLoggedIn,
  onBack,
  onSelectPost,
  onWritePost,
}) => {
  const [stockInfo, setStockInfo] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchType, setSearchType] = useState("title");
  const [keyword, setKeyword] = useState("");
  const [recommendFilter, setRecommendFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchData = async () => {
    if (!symbol) return;

    try {
      setLoading(true);

      const [stockResponse, postResponse] = await Promise.all([
        fetch(`http://localhost:8081/api/stocks/${symbol}`),
        fetch(`http://localhost:8081/api/community/stocks/${symbol}/posts`),
      ]);

      if (!stockResponse.ok) {
        throw new Error("종목 정보를 불러오지 못했습니다.");
      }

      if (!postResponse.ok) {
        throw new Error("게시글 목록을 불러오지 못했습니다.");
      }

      const stockData = await stockResponse.json();
      const postData = await postResponse.json();

      setStockInfo(stockData);
      setPosts(Array.isArray(postData) ? postData : []);
      setCurrentPage(1);
    } catch (e) {
      console.error(e);
      setStockInfo(null);
      setPosts([]);
      setCurrentPage(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [symbol]);

  useEffect(() => {
    setCurrentPage(1);
  }, [recommendFilter, searchType, keyword]);

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

  const filteredPosts = useMemo(() => {
    return posts
      .filter((post) => {
        const likeCount = post.likeCount ?? 0;

        if (recommendFilter === "notice") {
          return post.isNotice;
        }

        if (recommendFilter === "5") {
          return !post.isNotice && likeCount >= 5;
        }

        if (recommendFilter === "10") {
          return !post.isNotice && likeCount >= 10;
        }

        return true;
      })
      .filter((post) => {
        if (!keyword.trim()) return true;

        const value = keyword.toLowerCase();

        if (recommendFilter === "notice") {
          return (
            post.title?.toLowerCase().includes(value) ||
            post.nickname?.toLowerCase().includes(value)
          );
        }

        if (searchType === "title") {
          return post.title?.toLowerCase().includes(value);
        }

        if (searchType === "nickname") {
          return post.nickname?.toLowerCase().includes(value);
        }

        return true;
      });
  }, [posts, recommendFilter, searchType, keyword]);

  const noticePosts = useMemo(() => {
    return filteredPosts.filter((post) => post.isNotice);
  }, [filteredPosts]);

  const normalPosts = useMemo(() => {
    return filteredPosts.filter((post) => !post.isNotice);
  }, [filteredPosts]);

  const totalPages = useMemo(() => {
    if (recommendFilter === "notice") return 1;
    return Math.max(1, Math.ceil(normalPosts.length / PAGE_SIZE));
  }, [recommendFilter, normalPosts]);

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedNormalPosts = useMemo(() => {
    if (recommendFilter === "notice") return [];
    const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    return normalPosts.slice(startIndex, endIndex);
  }, [recommendFilter, normalPosts, safeCurrentPage]);

  const pageNumbers = useMemo(() => {
    if (recommendFilter === "notice") return [1];

    const pages = [];
    for (let i = 1; i <= totalPages; i += 1) {
      pages.push(i);
    }
    return pages;
  }, [recommendFilter, totalPages]);

  const getTotalDisplayCount = () => {
    if (recommendFilter === "notice") return noticePosts.length;
    if (recommendFilter === "all") return noticePosts.length + normalPosts.length;
    return normalPosts.length;
  };

  const getRowStyle = (post) => {
    if (post.isNotice) {
      return {
        ...styles.tr,
        ...styles.noticeRow,
      };
    }

    if ((post.likeCount ?? 0) >= 5) {
      return {
        ...styles.tr,
        ...styles.popularRow,
      };
    }

    return styles.tr;
  };

  const renderPostRow = (post) => (
    <tr
      key={post.postId}
      style={getRowStyle(post)}
      onClick={() => onSelectPost?.(post.postId)}
    >
      <td style={styles.td}>{post.postId}</td>
      <td style={{ ...styles.td, textAlign: "left" }}>
        <span
          style={{
            ...styles.titleCell,
            ...(post.isNotice ? styles.noticeTitle : {}),
            ...((post.likeCount ?? 0) >= 5 && !post.isNotice
              ? styles.popularTitle
              : {}),
          }}
        >
          {post.isNotice && <span style={styles.noticeBadge}>공지</span>}
          {post.title}
          {(post.likeCount ?? 0) >= 5 && !post.isNotice && (
            <span style={styles.popularBadge}>인기</span>
          )}
          <span style={styles.commentCount}>[{post.commentCount ?? 0}]</span>
        </span>
      </td>
      <td style={styles.td}>
        <span style={styles.nickname}>
          {post.nickname}
          {post.hasBoughtStock ? "★" : ""}
        </span>
      </td>
      <td style={styles.td}>{formatDateTime(post.createdAt)}</td>
      <td style={styles.td}>{post.viewCount ?? 0}</td>
      <td style={styles.td}>{post.likeCount ?? 0}</td>
    </tr>
  );

  if (!symbol) {
    return (
      <section style={styles.page}>
        <div style={styles.emptyCard}>
          <p style={styles.emptyTitle}>선택된 종목이 없습니다.</p>
          <p style={styles.emptyText}>커뮤니티 메인에서 종목을 선택해주세요.</p>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section style={styles.page}>
        <div style={styles.emptyCard}>
          <p style={styles.emptyText}>종목 커뮤니티를 불러오는 중입니다...</p>
        </div>
      </section>
    );
  }

  return (
    <section style={styles.page}>
      <button type="button" onClick={onBack} style={styles.backButton}>
        ← 커뮤니티 메인으로 돌아가기
      </button>

      <div style={styles.heroCard}>
        <div style={styles.heroLeft}>
          <div style={styles.heroBadge}>STOCK COMMUNITY</div>
          <h1 style={styles.heroTitle}>
            {stockInfo?.stockName || stockInfo?.name || symbol} 커뮤니티
          </h1>
          <p style={styles.heroDesc}>
            종목에 대한 의견, 매수/매도 관점, 시장 반응을 자유롭게 공유해보세요.
          </p>
        </div>

        <div style={styles.heroRight}>
          <div style={styles.heroSymbol}>
            {stockInfo?.stockCode || stockInfo?.symbol || symbol}
          </div>
          <div style={styles.heroPrice}>
            {stockInfo?.currentPrice
              ? `${Number(stockInfo.currentPrice).toLocaleString("ko-KR")}원`
              : "-"}
          </div>
          <div
            style={{
              ...styles.heroChange,
              color: Number(stockInfo?.changeRate) >= 0 ? "#e03131" : "#1971c2",
            }}
          >
            {stockInfo?.changeRate != null
              ? `${Number(stockInfo.changeRate) >= 0 ? "+" : ""}${stockInfo.changeRate}%`
              : "-"}
          </div>
        </div>
      </div>

      <div style={styles.toolbarCard}>
        <div style={styles.filterGroup}>
          <button
            type="button"
            onClick={() => setRecommendFilter("all")}
            style={{
              ...styles.filterButton,
              ...(recommendFilter === "all" ? styles.filterButtonActive : {}),
            }}
          >
            전체
          </button>

          <button
            type="button"
            onClick={() => setRecommendFilter("notice")}
            style={{
              ...styles.filterButton,
              ...(recommendFilter === "notice" ? styles.filterButtonActive : {}),
            }}
          >
            공지
          </button>

          <button
            type="button"
            onClick={() => setRecommendFilter("5")}
            style={{
              ...styles.filterButton,
              ...(recommendFilter === "5" ? styles.filterButtonActive : {}),
            }}
          >
            5추+
          </button>

          <button
            type="button"
            onClick={() => setRecommendFilter("10")}
            style={{
              ...styles.filterButton,
              ...(recommendFilter === "10" ? styles.filterButtonActive : {}),
            }}
          >
            10추+
          </button>
        </div>

        <div style={styles.searchGroup}>
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            style={styles.searchSelect}
          >
            <option value="title">제목</option>
            <option value="nickname">작성자</option>
          </select>

          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="검색어를 입력하세요"
            style={styles.searchInput}
          />

          <button
            type="button"
            onClick={() => {
              if (!isLoggedIn) {
                alert("로그인 후 글을 작성할 수 있습니다.");
                return;
              }
              onWritePost?.();
            }}
            style={styles.writeButton}
          >
            글쓰기
          </button>
          <button
  type="button"
  onClick={() => {
    fetchData();
    setCurrentPage(1);
  }}
  style={styles.refreshButton}
>
  새로고침
</button>
        </div>
      </div>

      <div style={styles.listCard}>
        <div style={styles.listHeaderRow}>
          <h3 style={styles.sectionTitle}>게시글 목록</h3>
          <span style={styles.postCount}>총 {getTotalDisplayCount()}개</span>
        </div>

        <div style={styles.noticeGuide}>
          {recommendFilter === "notice"
            ? "공지사항 전체 목록입니다."
            : "공지사항은 항상 상단에 최대 3개까지 고정되며, 일반 게시글만 10개씩 페이지 처리됩니다."}
        </div>

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.theadRow}>
                <th style={{ ...styles.th, width: "90px" }}>번호</th>
                <th style={{ ...styles.th, textAlign: "left" }}>제목</th>
                <th style={{ ...styles.th, width: "140px" }}>작성자</th>
                <th style={{ ...styles.th, width: "170px" }}>작성일시</th>
                <th style={{ ...styles.th, width: "90px" }}>조회</th>
                <th style={{ ...styles.th, width: "90px" }}>추천</th>
              </tr>
            </thead>
            <tbody>
              {recommendFilter === "notice" ? (
                noticePosts.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={styles.emptyTableCell}>
                      게시글이 없습니다.
                    </td>
                  </tr>
                ) : (
                  noticePosts.map(renderPostRow)
                )
              ) : noticePosts.length === 0 && paginatedNormalPosts.length === 0 ? (
                <tr>
                  <td colSpan="6" style={styles.emptyTableCell}>
                    게시글이 없습니다.
                  </td>
                </tr>
              ) : (
                <>
                  {recommendFilter === "all" &&
                    noticePosts.length > 0 &&
                    noticePosts.map(renderPostRow)}

                  {paginatedNormalPosts.length > 0 && (
                    <tr>
                      <td colSpan="6" style={styles.dividerCell}>
                        일반 게시글
                      </td>
                    </tr>
                  )}

                  {paginatedNormalPosts.map(renderPostRow)}
                </>
              )}
            </tbody>
          </table>
        </div>

        {recommendFilter !== "notice" && totalPages > 1 && (
          <div style={styles.pagination}>
            <button
              type="button"
              style={styles.pageButton}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={safeCurrentPage === 1}
            >
              {"<"}
            </button>

            {pageNumbers.map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => setCurrentPage(pageNumber)}
                style={{
                  ...styles.pageButton,
                  ...(safeCurrentPage === pageNumber
                    ? styles.pageButtonActive
                    : {}),
                }}
              >
                {pageNumber}
              </button>
            ))}

            <button
              type="button"
              style={styles.pageButton}
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={safeCurrentPage === totalPages}
            >
              {">"}
            </button>
          </div>
        )}
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
  backButton: {
    marginBottom: "16px",
    cursor: "pointer",
    border: "none",
    background: "transparent",
    fontSize: "14px",
    color: "#555",
  },
  heroCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
    padding: "28px 30px",
    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.05)",
    marginBottom: "18px",
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  heroBadge: {
    display: "inline-block",
    padding: "6px 12px",
    borderRadius: "999px",
    background: "#eef2ff",
    color: "#4c6ef5",
    fontSize: "12px",
    fontWeight: "800",
    marginBottom: "12px",
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
    lineHeight: "1.6",
  },
  heroRight: {
    textAlign: "right",
    minWidth: "180px",
  },
  heroLeft: {
  flex: 1,
  textAlign: "center",
  },
  heroSymbol: {
    fontSize: "13px",
    color: "#6b7280",
    fontWeight: "700",
    marginBottom: "8px",
  },
  heroPrice: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#111827",
    marginBottom: "6px",
  },
  heroChange: {
    fontSize: "15px",
    fontWeight: "800",
  },
  toolbarCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "16px 18px",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.04)",
    marginBottom: "18px",
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
    alignItems: "center",
  },
  filterGroup: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  filterButton: {
    padding: "9px 14px",
    borderRadius: "999px",
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#374151",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
  },
  filterButtonActive: {
    background: "#111827",
    color: "#fff",
    border: "1px solid #111827",
  },
  searchGroup: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    alignItems: "center",
  },
  searchSelect: {
    height: "40px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    padding: "0 12px",
    fontSize: "14px",
    outline: "none",
    background: "#fff",
  },
  searchInput: {
    height: "40px",
    minWidth: "240px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    padding: "0 12px",
    fontSize: "14px",
    outline: "none",
  },
  writeButton: {
    padding: "10px 16px",
    borderRadius: "10px",
    border: "none",
    background: "#111827",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "14px",
  },
  listCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "20px",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.04)",
  },
  listHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "10px",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "800",
    color: "#111827",
  },
  postCount: {
    fontSize: "14px",
    color: "#6b7280",
    fontWeight: "700",
  },
  noticeGuide: {
    marginBottom: "14px",
    fontSize: "13px",
    color: "#92400e",
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    borderRadius: "10px",
    padding: "10px 12px",
    fontWeight: "700",
  },
  tableWrap: {
    overflowX: "auto",
    borderRadius: "14px",
    border: "1px solid #ececec",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    background: "#fff",
  },
  theadRow: {
    background: "#f8fafc",
  },
  th: {
    padding: "14px 12px",
    fontSize: "13px",
    fontWeight: "800",
    color: "#475569",
    textAlign: "center",
    borderBottom: "1px solid #e5e7eb",
  },
  tr: {
    cursor: "pointer",
    borderBottom: "1px solid #f1f5f9",
  },
  noticeRow: {
    background: "#fff7e6",
  },
  popularRow: {
    background: "#f8fbff",
  },
  td: {
    padding: "15px 12px",
    fontSize: "14px",
    color: "#111827",
    textAlign: "center",
    verticalAlign: "middle",
  },
  titleCell: {
    fontWeight: "700",
    color: "#111827",
  },
  noticeTitle: {
    fontWeight: "800",
    color: "#d9480f",
  },
  popularTitle: {
    fontWeight: "800",
    color: "#1d4ed8",
    fontSize: "15px",
  },
  noticeBadge: {
    display: "inline-block",
    marginRight: "8px",
    padding: "2px 8px",
    borderRadius: "999px",
    background: "#fff0d9",
    color: "#d9480f",
    fontSize: "12px",
    fontWeight: "800",
  },
  popularBadge: {
    display: "inline-block",
    marginLeft: "8px",
    padding: "2px 8px",
    borderRadius: "999px",
    background: "#e7f0ff",
    color: "#1d4ed8",
    fontSize: "12px",
    fontWeight: "800",
  },
  commentCount: {
    marginLeft: "6px",
    color: "#2563eb",
    fontWeight: "700",
  },
  nickname: {
    fontWeight: "700",
    color: "#374151",
  },
  dividerCell: {
    background: "#f8fafc",
    color: "#64748b",
    fontWeight: "800",
    fontSize: "12px",
    textAlign: "left",
    padding: "10px 14px",
    borderTop: "1px solid #e5e7eb",
    borderBottom: "1px solid #e5e7eb",
  },
  emptyTableCell: {
    textAlign: "center",
    padding: "40px 20px",
    color: "#6b7280",
    fontSize: "14px",
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    gap: "8px",
    marginTop: "18px",
    flexWrap: "wrap",
  },
  pageButton: {
    minWidth: "36px",
    height: "36px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#374151",
    cursor: "pointer",
    fontWeight: "700",
  },
  pageButtonActive: {
    background: "#111827",
    color: "#fff",
    border: "1px solid #111827",
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
  refreshButton: {
  padding: "10px 16px",
  borderRadius: "10px",
  border: "1px solid #d1d5db",
  background: "#fff",
  color: "#111827",
  cursor: "pointer",
  fontWeight: "700",
  fontSize: "14px",
},
};

export default StockCommunityPage;