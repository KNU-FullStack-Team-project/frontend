import React, { useEffect, useMemo, useState } from "react";

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
    } catch (e) {
      console.error(e);
      setStockInfo(null);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [symbol]);

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
        if (recommendFilter === "5") return likeCount >= 5;
        if (recommendFilter === "10") return likeCount >= 10;
        return true;
      })
      .filter((post) => {
        if (!keyword.trim()) return true;

        const value = keyword.toLowerCase();

        if (searchType === "title") {
          return post.title?.toLowerCase().includes(value);
        }

        if (searchType === "nickname") {
          return post.nickname?.toLowerCase().includes(value);
        }

        return true;
      });
  }, [posts, recommendFilter, searchType, keyword]);

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
        <div>
          <div style={styles.heroBadge}>STOCK COMMUNITY</div>
          <h1 style={styles.heroTitle}>
            {stockInfo?.stockName || stockInfo?.name || symbol} 커뮤니티
          </h1>
          <p style={styles.heroDesc}>
            종목에 대한 의견, 매수/매도 관점, 시장 반응을 자유롭게 공유해보세요.
          </p>
        </div>

        <div style={styles.heroRight}>
          <div style={styles.heroSymbol}>{stockInfo?.stockCode || stockInfo?.symbol || symbol}</div>
          <div style={styles.heroPrice}>
            {stockInfo?.currentPrice
              ? `${Number(stockInfo.currentPrice).toLocaleString("ko-KR")}원`
              : "-"}
          </div>
          <div
            style={{
              ...styles.heroChange,
              color:
                Number(stockInfo?.changeRate) >= 0 ? "#e03131" : "#1971c2",
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
        </div>
      </div>

      <div style={styles.listCard}>
        <div style={styles.listHeaderRow}>
          <h3 style={styles.sectionTitle}>게시글 목록</h3>
          <span style={styles.postCount}>총 {filteredPosts.length}개</span>
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
              {filteredPosts.length === 0 ? (
                <tr>
                  <td colSpan="6" style={styles.emptyTableCell}>
                    게시글이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredPosts.map((post) => (
                  <tr
                    key={post.postId}
                    style={styles.tr}
                    onClick={() => onSelectPost?.(post.postId)}
                  >
                    <td style={styles.td}>{post.postId}</td>
                    <td style={{ ...styles.td, textAlign: "left" }}>
                      <span style={styles.titleCell}>
                        {post.title}
                        <span style={styles.commentCount}>
                          [{post.commentCount ?? 0}]
                        </span>
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
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={styles.pagination}>
          <button type="button" style={styles.pageButton}>
            {"<"}
          </button>
          <button type="button" style={{ ...styles.pageButton, ...styles.pageButtonActive }}>
            1
          </button>
          <button type="button" style={styles.pageButton}>
            2
          </button>
          <button type="button" style={styles.pageButton}>
            {">"}
          </button>
        </div>
      </div>
    </section>
  );
};

const styles = {
  page: {
    maxWidth: "1180px",
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
    marginBottom: "14px",
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
  commentCount: {
    marginLeft: "6px",
    color: "#2563eb",
    fontWeight: "700",
  },
  nickname: {
    fontWeight: "700",
    color: "#374151",
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
};

export default StockCommunityPage;