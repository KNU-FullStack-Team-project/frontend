import React, { useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 10;

const NoticeBoardPage = ({ onBack, onSelectPost }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchType, setSearchType] = useState("title");
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchData = async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/community/notices");

      if (!response.ok) {
        throw new Error("공지사항 목록을 불러오지 못했습니다.");
      }

      const data = await response.json();
      setPosts(Array.isArray(data) ? data : []);
      setCurrentPage(1);
    } catch (e) {
      console.error(e);
      setPosts([]);
      setCurrentPage(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchType, keyword]);

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
    return posts.filter((post) => {
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
  }, [posts, searchType, keyword]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredPosts.length / PAGE_SIZE));
  }, [filteredPosts]);

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedPosts = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    return filteredPosts.slice(startIndex, endIndex);
  }, [filteredPosts, safeCurrentPage]);

  const pageNumbers = useMemo(() => {
    const pages = [];
    for (let i = 1; i <= totalPages; i += 1) {
      pages.push(i);
    }
    return pages;
  }, [totalPages]);

  const renderPostRow = (post) => (
    <tr
      key={post.postId}
      style={styles.noticeRow}
      onClick={() => onSelectPost?.(post.postId)}
    >
      <td style={styles.td}>{post.postId}</td>
      <td style={{ ...styles.td, textAlign: "left" }}>
        <span style={styles.titleCell}>
          <span style={styles.noticeBadge}>공지</span>
          {post.title}
          <span style={styles.commentCount}>[{post.commentCount ?? 0}]</span>
        </span>
      </td>
      <td style={styles.td}>{post.nickname}</td>
      <td style={styles.td}>{formatDateTime(post.createdAt)}</td>
      <td style={styles.td}>{post.viewCount ?? 0}</td>
      <td style={styles.td}>{post.likeCount ?? 0}</td>
    </tr>
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">공지사항을 불러오는 중입니다...</div>
      </div>
    );
  }

  return (
    <section style={styles.page}>
      <button type="button" onClick={onBack} style={styles.backButton}>
        ← 커뮤니티 메인으로 돌아가기
      </button>

      <div style={styles.heroCard}>
        <div>
          <div style={styles.heroBadge}>NOTICE BOARD</div>
          <h1 style={styles.heroTitle}>공지사항</h1>
          <p style={styles.heroDesc}>
            운영 공지, 안내사항, 필독 내용을 모아보는 공간입니다.
          </p>
        </div>
      </div>

      <div style={styles.toolbarCard}>
        <div style={styles.filterSummary}>운영 공지 전용 게시판</div>

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
          <h3 style={styles.sectionTitle}>공지 목록</h3>
          <span style={styles.postCount}>총 {filteredPosts.length}개</span>
        </div>

        <div style={styles.noticeGuide}>
          공지사항만 별도로 모아둔 게시판입니다.
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
              {paginatedPosts.length === 0 ? (
                <tr>
                  <td colSpan="6" style={styles.emptyTableCell}>
                    게시글이 없습니다.
                  </td>
                </tr>
              ) : (
                paginatedPosts.map(renderPostRow)
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
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
                  ...(safeCurrentPage === pageNumber ? styles.pageButtonActive : {}),
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
  heroDesc: {
    margin: 0,
    fontSize: "15px",
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: "1.6",
    maxWidth: "800px",
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
  filterSummary: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#374151",
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
  refreshButton: {
    padding: "10px 16px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#374151",
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
    color: "#1e40af",
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "10px",
    padding: "10px 12px",
    fontWeight: "700",
  },
  tableWrap: {
    overflowX: "auto",
    borderRadius: "14px",
    border: "1px solid #edf2f7",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "900px",
    background: "#fff",
  },
  theadRow: {
    background: "#f8fafc",
  },
  th: {
    padding: "14px 12px",
    fontSize: "13px",
    fontWeight: "800",
    color: "#374151",
    borderBottom: "1px solid #e5e7eb",
    textAlign: "center",
  },
  noticeRow: {
    cursor: "pointer",
    background: "#eff6ff",
    borderBottom: "1px solid #dbeafe",
  },
  td: {
    padding: "14px 12px",
    fontSize: "14px",
    color: "#374151",
    borderBottom: "1px solid #f1f5f9",
    textAlign: "center",
  },
  titleCell: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: "700",
    color: "#111827",
  },
  noticeBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: "24px",
    padding: "0 12px",
    borderRadius: "999px",
    background: "#1d4ed8",
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: "800",
    flexShrink: 0,
  },
  commentCount: {
    color: "#6b7280",
    fontWeight: "700",
  },
  emptyTableCell: {
    padding: "40px 16px",
    textAlign: "center",
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
    minWidth: "38px",
    height: "38px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#374151",
    cursor: "pointer",
    fontSize: "13px",
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
  emptyText: {
    margin: 0,
    fontSize: "14px",
    color: "#6b7280",
    lineHeight: "1.6",
  },
};

export default NoticeBoardPage;