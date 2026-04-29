import React, { useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 10;
const BOARD_NOTICE_PREVIEW_COUNT = 1;

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
  const [freeBoardNoticePosts, setFreeBoardNoticePosts] = useState([]);
  const [globalNotices, setGlobalNotices] = useState([]);
  const [commentedPosts, setCommentedPosts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingCommentedPosts, setLoadingCommentedPosts] = useState(false);

  const [searchType, setSearchType] = useState("title");
  const [keyword, setKeyword] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAllFreeBoardNotices, setShowAllFreeBoardNotices] = useState(false);

  const currentUserId = currentUser?.userId ?? currentUser?.id ?? null;

  const isBoardNoticePost = (post) => {
    return (
      post?.isNotice === true ||
      post?.is_notice === 1 ||
      post?.is_notice === true ||
      post?.notice === true ||
      post?.noticeYn === "Y"
    );
  };

  const sortByLatest = (list) =>
    [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const fetchFreePosts = async () => {
    const response = await fetch("/api/community/boards/free/posts");
    if (!response.ok) {
      throw new Error("자유게시판 목록을 불러오지 못했습니다.");
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  };

  const fetchGlobalNotices = async () => {
    try {
      const response = await fetch("/api/community/notices");
      if (!response.ok) {
        throw new Error("전역 공지를 불러오지 못했습니다.");
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn("전역 공지 조회 실패:", error);
      return [];
    }
  };

  const fetchFreeBoardNoticesOptional = async () => {
    try {
      const response = await fetch("/api/community/boards/free/notices");

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error("자유게시판 공지를 불러오지 못했습니다.");
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn("자유게시판 공지 전용 API 미사용, fallback으로 처리:", error);
      return null;
    }
  };

  const fetchCommentedPosts = async (basePosts = posts) => {
    if (!isLoggedIn || !currentUserId) {
      setCommentedPosts([]);
      return;
    }

    try {
      setLoadingCommentedPosts(true);

      const response = await fetch(
        "/api/community/boards/free/posts/commented-by-me"
      );

      if (response.status === 404) {
        const fallback = basePosts.filter((post) => post.commentedByCurrentUser);
        setCommentedPosts(fallback);
        return;
      }

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

      const [postList, globalNoticeList, freeBoardNoticeData] = await Promise.all([
        fetchFreePosts(),
        fetchGlobalNotices(),
        fetchFreeBoardNoticesOptional(),
      ]);

      setPosts(postList);
      setGlobalNotices(sortByLatest(globalNoticeList));
      setCurrentPage(1);
      setShowAllFreeBoardNotices(false);

      if (Array.isArray(freeBoardNoticeData)) {
        setFreeBoardNoticePosts(sortByLatest(freeBoardNoticeData));
      } else {
        setFreeBoardNoticePosts(
          sortByLatest(postList.filter((post) => isBoardNoticePost(post)))
        );
      }

      fetchCommentedPosts(postList);
    } catch (e) {
      console.error(e);
      setPosts([]);
      setFreeBoardNoticePosts([]);
      setGlobalNotices([]);
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

  const latestGlobalNotice = useMemo(() => {
    return globalNotices.length > 0 ? globalNotices[0] : null;
  }, [globalNotices]);

  const freeBoardNoticePreview = useMemo(() => {
    return freeBoardNoticePosts.slice(0, BOARD_NOTICE_PREVIEW_COUNT);
  }, [freeBoardNoticePosts]);

  const hiddenFreeBoardNoticeCount = Math.max(
    0,
    freeBoardNoticePosts.length - BOARD_NOTICE_PREVIEW_COUNT
  );

  const displayedFreeBoardNotices = useMemo(() => {
    return showAllFreeBoardNotices
      ? freeBoardNoticePosts
      : freeBoardNoticePreview;
  }, [showAllFreeBoardNotices, freeBoardNoticePosts, freeBoardNoticePreview]);

  const normalPosts = useMemo(() => {
    return posts.filter((post) => !isBoardNoticePost(post));
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

        if (filterType === "5") return likeCount >= 5;
        if (filterType === "10") return likeCount >= 10;
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

  const renderBoardNoticeItem = (post, index) => (
    <button
      key={post.postId}
      type="button"
      style={styles.boardNoticeItem}
      onClick={() => onSelectPost?.(post.postId)}
    >
      <div style={styles.boardNoticeLeft}>
        <span style={styles.boardNoticeIndex}>{index + 1}</span>
        <div style={styles.boardNoticeTextWrap}>
          <div style={styles.boardNoticeTitle}>{post.title}</div>
          <div style={styles.boardNoticeMeta}>
            <span>{post.nickname}</span>
            <span>{formatDateTime(post.createdAt)}</span>
            <span>댓글 {post.commentCount ?? 0}</span>
          </div>
        </div>
      </div>
    </button>
  );

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
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">자유게시판을 불러오는 중입니다...</div>
      </div>
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
              className="side-menu-btn notice"
              onClick={onSelectNoticeBoard}
            >
              공지사항
            </button>
            <button type="button" className="side-menu-btn active">
              자유게시판
            </button>
            <button
              type="button"
              className="side-menu-btn"
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
          {latestGlobalNotice && (
            <button
              type="button"
              style={styles.globalNoticeBanner}
              onClick={() => onSelectPost?.(latestGlobalNotice.postId)}
            >
              <span style={styles.globalNoticeBadge}>전역공지</span>
              <span style={styles.globalNoticeTitle}>
                {latestGlobalNotice.title}
              </span>
              <span style={styles.globalNoticeDate}>
                {formatDateTime(latestGlobalNotice.createdAt)}
              </span>
            </button>
          )}

          <div style={styles.boardNoticeCard}>
            <div style={styles.boardNoticeCardTop}>
              <span style={styles.boardNoticeCardLabel}>📌 자유게시판 공지</span>
              {freeBoardNoticePosts.length > BOARD_NOTICE_PREVIEW_COUNT && (
                <button
                  type="button"
                  style={styles.boardNoticeToggleButton}
                  onClick={() =>
                    setShowAllFreeBoardNotices((prev) => !prev)
                  }
                >
                  {showAllFreeBoardNotices
                    ? "접기"
                    : `공지 전체보기${hiddenFreeBoardNoticeCount > 0 ? ` (+${hiddenFreeBoardNoticeCount})` : ""}`}
                </button>
              )}
            </div>

            {displayedFreeBoardNotices.length === 0 ? (
              <div style={styles.boardNoticeEmpty}>
                등록된 자유게시판 공지가 없습니다.
              </div>
            ) : (
              <div style={styles.boardNoticeList}>
                {displayedFreeBoardNotices.map(renderBoardNoticeItem)}
              </div>
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
              자유게시판 공지가 상단에 기본 노출되며, 더 많은 공지는 같은 페이지에서 펼쳐서 볼 수 있습니다.
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
    border: "1px solid #bfdbfe",
    background: "#eff6ff",
    color: "#1e40af",
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
  globalNoticeBanner: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    border: "1px solid #dbeafe",
    background: "linear-gradient(135deg, #eff6ff 0%, #f8fbff 100%)",
    borderRadius: "16px",
    padding: "14px 16px",
    cursor: "pointer",
    textAlign: "left",
    boxShadow: "0 8px 20px rgba(37, 99, 235, 0.06)",
  },
  globalNoticeBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "72px",
    height: "28px",
    borderRadius: "999px",
    background: "#dbeafe",
    color: "#1d4ed8",
    fontSize: "12px",
    fontWeight: "900",
    flexShrink: 0,
  },
  globalNoticeTitle: {
    flex: 1,
    fontSize: "14px",
    fontWeight: "800",
    color: "#111827",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  globalNoticeDate: {
    fontSize: "12px",
    color: "#6b7280",
    fontWeight: "700",
    flexShrink: 0,
  },
  boardNoticeCard: {
    background: "linear-gradient(135deg, #fffaf0 0%, #fff7ed 100%)",
    border: "1px solid #fed7aa",
    borderRadius: "18px",
    padding: "18px",
    boxShadow: "0 10px 24px rgba(217, 119, 6, 0.08)",
  },
  boardNoticeCardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "12px",
    flexWrap: "wrap",
  },
  boardNoticeCardLabel: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: "28px",
    padding: "0 12px",
    borderRadius: "999px",
    background: "#1d4ed8",
    color: "#ffffff",
    fontSize: "12px",
    fontWeight: "900",
    letterSpacing: "0.02em",
  },
  boardNoticeToggleButton: {
    border: "none",
    background: "transparent",
    color: "#c2410c",
    fontSize: "13px",
    fontWeight: "800",
    cursor: "pointer",
    padding: 0,
  },
  boardNoticeList: {
    display: "grid",
    gap: "10px",
  },
  boardNoticeItem: {
    width: "100%",
    border: "1px solid #fde6b3",
    background: "#ffffff",
    borderRadius: "14px",
    padding: "12px 14px",
    cursor: "pointer",
    textAlign: "left",
    boxShadow: "0 4px 10px rgba(15, 23, 42, 0.03)",
  },
  boardNoticeLeft: {
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
  },
  boardNoticeIndex: {
    minWidth: "26px",
    height: "26px",
    borderRadius: "999px",
    background: "#fff0d9",
    color: "#d9480f",
    fontSize: "12px",
    fontWeight: "900",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  boardNoticeTextWrap: {
    minWidth: 0,
    display: "grid",
    gap: "6px",
    width: "100%",
  },
  boardNoticeTitle: {
    fontSize: "14px",
    fontWeight: "900",
    color: "#111827",
    lineHeight: "1.5",
  },
  boardNoticeMeta: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    fontSize: "12px",
    color: "#92400e",
  },
  boardNoticeEmpty: {
    fontSize: "14px",
    color: "#9a3412",
    padding: "10px 0",
    fontWeight: "700",
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
    padding: "12px 14px",
  },
  listCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "18px",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.04)",
  },
  listHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "center",
    marginBottom: "12px",
    flexWrap: "wrap",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "800",
    color: "#111827",
  },
  postCount: {
    fontSize: "13px",
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
  tr: {
    cursor: "pointer",
    borderBottom: "1px solid #f1f5f9",
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
  popularRow: {
    background: "#f8fbff",
  },
  bestRow: {
    background: "#fff7ed",
  },
  emptyCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "32px",
    textAlign: "center",
  },
  emptyText: {
    margin: 0,
    fontSize: "14px",
    color: "#6b7280",
  },
  emptyTableCell: {
    textAlign: "center",
    padding: "32px 12px",
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
};

export default FreeBoardPage;