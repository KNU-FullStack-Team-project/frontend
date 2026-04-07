import React, { useEffect, useState } from "react";

const StockCommunityPage = ({
  symbol,
  currentUser,
  isLoggedIn,
  onBack,
  onSelectPost,
}) => {
  const [stockInfo, setStockInfo] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [writeForm, setWriteForm] = useState({
    title: "",
    content: "",
  });

  const fetchData = async () => {
    if (!symbol) return;

    try {
      setLoading(true);

      const token = localStorage.getItem("accessToken");

      const [stockResponse, postResponse] = await Promise.all([
        fetch(`/api/stocks/${symbol}`),
        fetch(`/api/community/stocks/${symbol}/posts`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
      ]);

      if (!stockResponse.ok) {
        throw new Error("종목 정보를 불러오지 못했습니다.");
      }

      if (!postResponse.ok) {
        throw new Error("커뮤니티 글 목록을 불러오지 못했습니다.");
      }

      const stockData = await stockResponse.json();
      const postData = await postResponse.json();

      setStockInfo(stockData);
      setPosts(Array.isArray(postData) ? postData : []);
    } catch (error) {
      console.error("종목 커뮤니티 조회 오류:", error);
      setStockInfo(null);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [symbol]);

  const handleWriteChange = (e) => {
    const { name, value } = e.target;
    setWriteForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitPost = async () => {
    if (!isLoggedIn || !currentUser?.userId) {
      alert("로그인 후 글을 작성할 수 있습니다.");
      return;
    }

    if (!writeForm.title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    if (!writeForm.content.trim()) {
      alert("내용을 입력해주세요.");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        alert("로그인 토큰이 없습니다.");
        return;
      }

      const response = await fetch(`/api/community/stocks/${symbol}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: writeForm.title.trim(),
          content: writeForm.content.trim(),
        }),
      });

      const text = await response.text();

      if (!response.ok) {
        alert(text || "게시글 작성에 실패했습니다.");
        return;
      }

      alert("게시글이 작성되었습니다.");
      setWriteForm({ title: "", content: "" });
      fetchData();
    } catch (error) {
      console.error("게시글 작성 오류:", error);
      alert("게시글 작성 중 오류가 발생했습니다.");
    }
  };

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

      <div style={styles.hero}>
        <div style={styles.heroTop}>
          <div>
            <div style={styles.heroBadge}>STOCK COMMUNITY</div>
            <h1 style={styles.heroTitle}>
              {stockInfo?.name || symbol} 커뮤니티
            </h1>
          </div>

          <div style={styles.heroSide}>
            <div style={styles.symbolText}>{stockInfo?.symbol || symbol}</div>
            <div style={styles.priceText}>
              {stockInfo?.currentPrice
                ? `${Number(stockInfo.currentPrice).toLocaleString("ko-KR")}원`
                : "-"}
            </div>
            <div
              style={{
                ...styles.changeRateText,
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
      </div>

      <div style={styles.writeCard}>
        <h3 style={styles.sectionTitle}>글 작성</h3>

        <input
          type="text"
          name="title"
          value={writeForm.title}
          onChange={handleWriteChange}
          placeholder="제목을 입력하세요."
          style={styles.titleInput}
        />

        <textarea
          name="content"
          value={writeForm.content}
          onChange={handleWriteChange}
          placeholder="이 종목에 대한 의견을 작성해보세요."
          style={styles.contentInput}
        />

        <div style={styles.writeActionRow}>
          <button
            type="button"
            onClick={handleSubmitPost}
            style={styles.writeButton}
          >
            등록하기
          </button>
        </div>
      </div>

      <div style={styles.listCard}>
        <div style={styles.listTitleRow}>
          <h3 style={styles.sectionTitle}>게시글 목록</h3>
          <span style={styles.postCount}>총 {posts.length}개</span>
        </div>

        {posts.length === 0 ? (
          <div style={styles.emptyInner}>
            아직 작성된 글이 없습니다. 첫 글을 남겨보세요.
          </div>
        ) : (
          <div style={styles.postList}>
            {posts.map((post) => (
              <div
                key={post.postId}
                style={styles.postItem}
                onClick={() => onSelectPost && onSelectPost(post.postId)}
              >
                <div style={styles.postHeader}>
                  <div style={styles.postTitle}>{post.title}</div>
                  <div style={styles.postMetaRight}>
                    조회 {post.viewCount ?? 0} · 댓글 {post.commentCount ?? 0}
                  </div>
                </div>

                <div style={styles.postMeta}>
                  <span style={styles.nickname}>
                    {post.nickname}
                    {post.hasBoughtStock ? "★" : ""}
                  </span>
                  <span>
                    {post.createdAt
                      ? new Date(post.createdAt).toLocaleString("ko-KR")
                      : "-"}
                  </span>
                </div>
              </div>
            ))}
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
  hero: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "24px",
    padding: "28px 30px",
    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.05)",
    marginBottom: "20px",
  },
  heroTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
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
    letterSpacing: "0.06em",
    marginBottom: "12px",
  },
  heroTitle: {
    margin: 0,
    fontSize: "32px",
    fontWeight: "800",
    color: "#111827",
  },
  heroSide: {
    textAlign: "right",
  },
  symbolText: {
    fontSize: "13px",
    color: "#6b7280",
    fontWeight: "700",
    marginBottom: "8px",
  },
  priceText: {
    fontSize: "26px",
    fontWeight: "800",
    color: "#111827",
    marginBottom: "6px",
  },
  changeRateText: {
    fontSize: "15px",
    fontWeight: "800",
  },
  writeCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "20px",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.04)",
    marginBottom: "20px",
  },
  sectionTitle: {
    margin: "0 0 14px",
    fontSize: "20px",
    fontWeight: "800",
    color: "#111827",
  },
  titleInput: {
    width: "100%",
    height: "44px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    padding: "0 14px",
    fontSize: "14px",
    marginBottom: "12px",
    outline: "none",
  },
  contentInput: {
    width: "100%",
    minHeight: "160px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    padding: "14px",
    fontSize: "14px",
    resize: "vertical",
    outline: "none",
    marginBottom: "12px",
    fontFamily: "inherit",
  },
  writeActionRow: {
    display: "flex",
    justifyContent: "flex-end",
  },
  writeButton: {
    padding: "12px 18px",
    borderRadius: "12px",
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
  listTitleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "14px",
  },
  postCount: {
    fontSize: "14px",
    color: "#6b7280",
    fontWeight: "700",
  },
  postList: {
    display: "grid",
    gap: "12px",
  },
  postItem: {
    border: "1px solid #ececec",
    borderRadius: "14px",
    padding: "16px",
    background: "#fafafa",
    cursor: "pointer",
  },
  postHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "flex-start",
    marginBottom: "10px",
    flexWrap: "wrap",
  },
  postTitle: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#111827",
    lineHeight: "1.5",
  },
  postMetaRight: {
    fontSize: "12px",
    color: "#6b7280",
    fontWeight: "600",
  },
  postMeta: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
    fontSize: "13px",
    color: "#6b7280",
  },
  nickname: {
    fontWeight: "800",
    color: "#374151",
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
  emptyInner: {
    border: "1px dashed #d1d5db",
    borderRadius: "14px",
    padding: "24px",
    textAlign: "center",
    fontSize: "14px",
    color: "#6b7280",
    background: "#fcfcfc",
  },
};

export default StockCommunityPage;