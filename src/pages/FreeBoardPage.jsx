import React, { useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 10;

const FreeBoardPage = ({
  currentUser,
  isLoggedIn,
  onBack,
  onSelectPost,
  onWritePost,
  onOpenStockBoardLobby,
  onSelectNoticeBoard,
}) => {
  const [posts, setPosts] = useState([]);
  const [noticePosts, setNoticePosts] = useState([]);
  const [commentedPosts, setCommentedPosts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingCommentedPosts, setLoadingCommentedPosts] = useState(false);

  const [searchType, setSearchType] = useState("title");
  const [keyword, setKeyword] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const currentUserId = currentUser?.userId ?? currentUser?.id ?? null;

  const sortByLatest = (list) =>
    [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const fetchFreePosts = async () => {
    const response = await fetch("http://localhost:8081/api/community/boards/free/posts");
    if (!response.ok) {
      throw new Error("자유게시판 목록을 불러오지 못했습니다.");
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  };

  const fetchNotices = async () => {
    const response = await fetch("http://localhost:8081/api/community/notices");
    if (!response.ok) {
      throw new Error("공지사항 목록을 불러오지 못했습니다.");
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  };

  const fetchCommentedPosts = async (basePosts = posts) => {
    if (!isLoggedIn || !currentUserId) {
      setCommentedPosts([]);
      return;
    }

    const token = localStorage.getItem("accessToken") || currentUser?.token;

    try {
      setLoadingCommentedPosts(true);

      const response = await fetch(
        "http://localhost:8081/api/community/boards/free/posts/commented-by-me",
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (!response.ok) {
        throw new Error("내 댓글 글 목록 API 미지원");
      }

      const data = await response.json();
      setCommentedPosts(Array.isArray(data) ? data : []);
    } catch (error) {
      const fallback = basePosts.filter((post) => post.commentedByCurrentUser);
      setCommentedPosts(fallback);
    } finally {
      setLoadingCommentedPosts(false);
    }
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);

      const [freePostData, noticeData] = await Promise.all([
        fetchFreePosts(),
        fetchNotices(),
      ]);

      const postList = Array.isArray(freePostData) ? freePostData : [];
      setPosts(postList);
      setNoticePosts(Array.isArray(noticeData) ? noticeData : []);
      setCurrentPage(1);
      fetchCommentedPosts(postList);
    } catch (e) {
      console.error(e);
      setPosts([]);
      setNoticePosts([]);
      setCurrentPage(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, searchType, keyword]);

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

  const globalNotice = useMemo(() => {
    return sortByLatest(noticePosts)[0] || null;
  }, [noticePosts]);

  const freeBoardRuleNotice = useMemo(() => {
    return sortByLatest(posts.filter((post) => post.isNotice))[0] || null;
  }, [posts]);

  const normalPosts = useMemo(() => {
    return posts.filter((post) => !post.isNotice);
  }, [posts]);

  const commentedPostIdSet = useMemo(() => {
    const ids = new Set();

    commentedPosts.forEach((post) => {
      if (post?.postId != null) ids.add(post.postId);
    });

    posts.forEach((post) => {
      if (post?.commentedByCurrentUser && post?.postId != null) {
        ids.add(post.postId);
      }
    });

    return ids;
  }, [commentedPosts, posts]);

  const filteredPosts = useMemo(() => {
    return normalPosts
      .filter((post) => {
        const likeCount = post.likeCount ?? 0;

        if (filterType === "5") {
          return likeCount >= 5;
        }

        if (filterType === "10") {
          return likeCount >= 10;
        }

        if (filterType === "my") {
          return currentUserId != null && post.userId === currentUserId;
        }

        if (filterType === "commented") {
          return commentedPostIdSet.has(post.postId);
        }

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
  }, [normalPosts, filterType, currentUserId, commentedPostIdSet, keyword, searchType]);

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

  const handleRequireLoginFilter = (nextFilter) => {
    if ((nextFilter === "my" || nextFilter === "commented") && !isLoggedIn) {
      alert("로그인 후 이용할 수 있습니다.");
      return;
    }
    setFilterType(nextFilter);
  };

  const getRowStyle = (post) => {
    if ((post.likeCount ?? 0) >= 10) {
      return {
        ...styles.tr,
        ...styles.bestRow,
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

  const renderFixedNoticeCard = (label, post, emptyText) => {
    return (
      <button
        type="button"
        style={{
          ...styles.fixedNoticeCard,
          ...(post ? {} : styles.fixedNoticeCardDisabled),
        }}
        onClick={() => {
          if (post?.postId) {
            onSelectPost?.(post.postId);
          }
        }}
        disabled={!post}
      >
        <div style={styles.fixedNoticeTop}>
          <span style={styles.fixedNoticeLabel}>{label}</span>
          {post?.createdAt && (
            <span style={styles.fixedNoticeDate}>
              {formatDateTime(post.createdAt)}
            </span>
          )}
        </div>
        <div style={styles.fixedNoticeTitle}>
          {post?.title || emptyText}
        </div>
        {post && (
          <div style={styles.fixedNoticeMeta}>
            <span>{post.nickname}</span>
            <span>댓글 {post.commentCount ?? 0}</span>
            <span>조회 {post.viewCount ?? 0}</span>
          </div>
        )}
      </button>
    );
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
            ...((post.likeCount ?? 0) >= 5 ? styles.popularTitle : {}),
          }}
        >
          {post.title}
          {(post.likeCount ?? 0) >= 10 ? (
            <span style={styles.bestBadge}>10추</span>
          ) : (post.likeCount ?? 0) >= 5 ? (
            <span style={styles.popularBadge}>5추+</span>
          ) : null}
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
      <section style={styles.page}>
        <div style={styles.emptyCard}>
          <p style={styles.emptyText}>자유게시판을 불러오는 중입니다...</p>
        </div>
      </section>
    );
  }

  return (
    <section style={styles.page}>
      <div style={styles.hero}>
        <div style={styles.heroBadge}>COMMUNITY</div>
        <h1 style={styles.heroTitle}>자유게시판</h1>
        <p style={styles.heroText}>
          커뮤니티에 들어오면 바로 자유게시판 글을 보고, 종목게시판 버튼을 눌러 원하는 종목 게시판으로 이동할 수 있습니다.
        </p>
      </div>

      <div style={styles.pageLayout}>
        <aside style={styles.sidebar}>
          <div style={styles.sidebarCard}>
            <div style={styles.sidebarTitle}>게시판</div>
            <button
              type="button"
              style={styles.sideMenuButtonNotice}
              onClick={onSelectNoticeBoard}
            >
              공지사항
            </button>
            <button type="button" style={styles.sideMenuButtonActive}>
              자유게시판
            </button>
            <button
              type="button"
              style={styles.sideMenuButton}
              onClick={onOpenStockBoardLobby}
            >
              종목게시판
            </button>
          </div>

          <div style={styles.sidebarCard}>
            <div style={styles.sidebarTitle}>종목게시판 안내</div>
            <div style={styles.sidebarGuide}>
              종목게시판에서는 원하는 종목을 박스형 목록에서 선택한 뒤, 해당 종목 게시판으로 이동할 수 있습니다.
            </div>
            <button
              type="button"
              style={styles.stockLobbyButton}
              onClick={onOpenStockBoardLobby}
            >
              종목게시판 보러가기 →
            </button>
          </div>
        </aside>

        <div style={styles.content}>

          <div style={styles.fixedNoticeGrid}>
            {renderFixedNoticeCard(
              "최신 공지",
              globalNotice,
              "등록된 전체 공지가 없습니다."
            )}
            {renderFixedNoticeCard(
              "자유게시판 이용수칙",
              freeBoardRuleNotice,
              "등록된 자유게시판 공지가 없습니다."
            )}
          </div>

          <div style={styles.toolbarCard}>
            <div style={styles.filterGroup}>
              <button
                type="button"
                onClick={() => handleRequireLoginFilter("all")}
                style={{
                  ...styles.filterButton,
                  ...(filterType === "all" ? styles.filterButtonActive : {}),
                }}
              >
                전체
              </button>

              <button
                type="button"
                onClick={() => handleRequireLoginFilter("5")}
                style={{
                  ...styles.filterButton,
                  ...(filterType === "5" ? styles.filterButtonActive : {}),
                }}
              >
                5추+
              </button>

              <button
                type="button"
                onClick={() => handleRequireLoginFilter("10")}
                style={{
                  ...styles.filterButton,
                  ...(filterType === "10" ? styles.filterButtonActive : {}),
                }}
              >
                10추+
              </button>

              <button
                type="button"
                onClick={() => handleRequireLoginFilter("my")}
                style={{
                  ...styles.filterButton,
                  ...(filterType === "my" ? styles.filterButtonActive : {}),
                }}
              >
                내 글
              </button>

              <button
                type="button"
                onClick={() => handleRequireLoginFilter("commented")}
                style={{
                  ...styles.filterButton,
                  ...(filterType === "commented"
                    ? styles.filterButtonActive
                    : {}),
                }}
              >
                내 댓글
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
                  fetchAllData();
                  setCurrentPage(1);
                }}
                style={styles.refreshButton}
              >
                새로고침
              </button>
            </div>
          </div>

          {filterType === "commented" && (
            <div style={styles.filterGuide}>
              {loadingCommentedPosts
                ? "내가 댓글을 작성한 글을 불러오는 중입니다."
                : "내가 댓글을 작성한 글만 보고 있습니다."}
            </div>
          )}

          {filterType === "my" && (
            <div style={styles.filterGuide}>내가 작성한 글만 보고 있습니다.</div>
          )}

          <div style={styles.listCard}>
            <div style={styles.listHeaderRow}>
              <h3 style={styles.sectionTitle}>게시글 목록</h3>
              <span style={styles.postCount}>총 {filteredPosts.length}개</span>
            </div>

            <div style={styles.noticeGuide}>
              전체 최신 공지 1개와 자유게시판 공지 1개는 상단에 고정되고, 일반 글만 아래 리스트에 표시됩니다.
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
  sidebarGuide: {
    fontSize: "13px",
    color: "#6b7280",
    lineHeight: "1.7",
    marginBottom: "12px",
  },
  stockLobbyButton: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "none",
    background: "#111827",
    color: "#fff",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
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
  content: {
    display: "grid",
    gap: "18px",
  },
  fixedNoticeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "16px",
  },
  fixedNoticeCard: {
    textAlign: "left",
    border: "1px solid #fed7aa",
    background: "#fffaf5",
    borderRadius: "18px",
    padding: "18px",
    cursor: "pointer",
  },
  fixedNoticeCardDisabled: {
    cursor: "default",
    opacity: 0.7,
  },
  fixedNoticeTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "10px",
  },
  fixedNoticeLabel: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: "26px",
    padding: "0 10px",
    borderRadius: "999px",
    background: "#fff0d9",
    color: "#d9480f",
    fontSize: "12px",
    fontWeight: "800",
  },
  fixedNoticeDate: {
    fontSize: "12px",
    color: "#6b7280",
    fontWeight: "700",
  },
  fixedNoticeTitle: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#111827",
    lineHeight: "1.5",
    marginBottom: "10px",
  },
  fixedNoticeMeta: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    fontSize: "12px",
    color: "#6b7280",
  },
  toolbarCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "16px 18px",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.04)",
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
  filterGuide: {
    fontSize: "13px",
    color: "#6b7280",
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "10px 12px",
    fontWeight: "700",
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
  tr: {
    cursor: "pointer",
    borderBottom: "1px solid #f1f5f9",
  },
  popularRow: {
    background: "#f8fbff",
  },
  bestRow: {
    background: "#fff7ed",
  },
  td: {
    padding: "14px 12px",
    fontSize: "14px",
    color: "#374151",
    textAlign: "center",
    verticalAlign: "middle",
  },
  titleCell: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
    fontWeight: "700",
    color: "#111827",
  },
  popularTitle: {
    color: "#1d4ed8",
  },
  popularBadge: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: "999px",
    background: "#dbeafe",
    color: "#1d4ed8",
    fontSize: "11px",
    fontWeight: "800",
  },
  bestBadge: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: "999px",
    background: "#fff0d9",
    color: "#d9480f",
    fontSize: "11px",
    fontWeight: "800",
  },
  commentCount: {
    color: "#6b7280",
    fontSize: "13px",
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

export default FreeBoardPage;