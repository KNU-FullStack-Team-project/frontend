import React, { useEffect, useState } from "react";

const CommunityPostWritePage = ({
  symbol,
  currentUser,
  isLoggedIn,
  onBack,
  onSuccess,
}) => {
  const [stockInfo, setStockInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    content: "",
  });

  useEffect(() => {
    const fetchStockInfo = async () => {
      if (!symbol) return;

      try {
        setLoading(true);
        const response = await fetch(`http://localhost:8081/api/stocks/${symbol}`);

        if (!response.ok) {
          throw new Error("종목 정보를 불러오지 못했습니다.");
        }

        const data = await response.json();
        setStockInfo(data);
      } catch (error) {
        console.error("종목 정보 조회 오류:", error);
        setStockInfo(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStockInfo();
  }, [symbol]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!isLoggedIn || !currentUser?.userId) {
      alert("로그인 후 글을 작성할 수 있습니다.");
      return;
    }

    if (!symbol) {
      alert("종목 정보가 없습니다.");
      return;
    }

    if (!form.title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    if (!form.content.trim()) {
      alert("내용을 입력해주세요.");
      return;
    }

    const token = localStorage.getItem("accessToken") || currentUser?.token;

    if (!token) {
      alert("로그인 토큰이 없습니다.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        `http://localhost:8081/api/community/stocks/${symbol}/posts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: form.title.trim(),
            content: form.content.trim(),
          }),
        }
      );

      const text = await response.text();

      if (!response.ok) {
        alert(text || "게시글 작성에 실패했습니다.");
        return;
      }

      alert("게시글이 작성되었습니다.");

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("게시글 작성 오류:", error);
      alert("게시글 작성 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!symbol) {
    return (
      <section style={styles.page}>
        <div style={styles.emptyCard}>
          <p style={styles.emptyTitle}>선택된 종목이 없습니다.</p>
          <p style={styles.emptyText}>종목 커뮤니티에서 다시 진입해주세요.</p>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section style={styles.page}>
        <div style={styles.emptyCard}>
          <p style={styles.emptyText}>글쓰기 화면을 준비하는 중입니다...</p>
        </div>
      </section>
    );
  }

  return (
    <section style={styles.page}>
      <button type="button" onClick={onBack} style={styles.backButton}>
        ← 게시글 목록으로 돌아가기
      </button>

      <div style={styles.headerCard}>
        <div>
          <div style={styles.badge}>WRITE POST</div>
          <h1 style={styles.pageTitle}>
            {stockInfo?.name || symbol} 게시글 작성
          </h1>
          <p style={styles.pageDesc}>
            이 종목에 대한 의견, 분석, 매수/매도 관점을 자유롭게 작성해보세요.
          </p>
        </div>

        <div style={styles.stockBox}>
          <div style={styles.stockSymbol}>{stockInfo?.symbol || symbol}</div>
          <div style={styles.stockPrice}>
            {stockInfo?.currentPrice
              ? `${Number(stockInfo.currentPrice).toLocaleString("ko-KR")}원`
              : "-"}
          </div>
        </div>
      </div>

      <div style={styles.formCard}>
        <div style={styles.formRow}>
          <label style={styles.label}>제목</label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="제목을 입력하세요."
            style={styles.titleInput}
            maxLength={100}
          />
        </div>

        <div style={styles.formRow}>
          <label style={styles.label}>내용</label>
          <textarea
            name="content"
            value={form.content}
            onChange={handleChange}
            placeholder="이 종목에 대한 의견을 작성해보세요."
            style={styles.contentInput}
          />
        </div>

        <div style={styles.actionRow}>
          <button
            type="button"
            onClick={onBack}
            style={styles.cancelButton}
            disabled={submitting}
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            style={styles.submitButton}
            disabled={submitting}
          >
            {submitting ? "등록 중..." : "등록하기"}
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
  headerCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
    padding: "28px 30px",
    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.05)",
    marginBottom: "20px",
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  badge: {
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
  pageTitle: {
    margin: "0 0 8px",
    fontSize: "30px",
    fontWeight: "800",
    color: "#111827",
  },
  pageDesc: {
    margin: 0,
    fontSize: "14px",
    color: "#6b7280",
    lineHeight: "1.6",
  },
  stockBox: {
    minWidth: "180px",
    textAlign: "right",
  },
  stockSymbol: {
    fontSize: "13px",
    color: "#6b7280",
    fontWeight: "700",
    marginBottom: "8px",
  },
  stockPrice: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#111827",
  },
  formCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "20px",
    padding: "24px",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.04)",
  },
  formRow: {
    marginBottom: "18px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontSize: "14px",
    fontWeight: "700",
    color: "#374151",
  },
  titleInput: {
    width: "100%",
    height: "48px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    padding: "0 14px",
    fontSize: "14px",
    outline: "none",
  },
  contentInput: {
    width: "100%",
    minHeight: "300px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    padding: "14px",
    fontSize: "14px",
    resize: "vertical",
    outline: "none",
    fontFamily: "inherit",
  },
  actionRow: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
  },
  cancelButton: {
    padding: "12px 18px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#374151",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "14px",
  },
  submitButton: {
    padding: "12px 18px",
    borderRadius: "12px",
    border: "none",
    background: "#111827",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "14px",
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

export default CommunityPostWritePage;