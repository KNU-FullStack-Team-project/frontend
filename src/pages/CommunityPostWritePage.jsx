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
    isNotice: false,
  });

  const isAdmin = currentUser?.role === "admin";

  useEffect(() => {
    const fetchStockInfo = async () => {
      if (!symbol) return;

      try {
        setLoading(true);
        const response = await fetch(`http://localhost:8081/api/stocks/${symbol}`);

        if (!response.ok) throw new Error();

        const data = await response.json();
        setStockInfo(data);
      } catch (error) {
        console.error(error);
        setStockInfo(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStockInfo();
  }, [symbol]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async () => {
    if (!isLoggedIn || !currentUser?.userId) {
      alert("로그인 후 글을 작성할 수 있습니다.");
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
            isNotice: form.isNotice,
          }),
        }
      );

      const text = await response.text();

      if (!response.ok) {
        alert(text);
        return;
      }

      alert("게시글 작성 완료");
      onSuccess?.();
    } catch (e) {
      console.error(e);
      alert("에러 발생");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 40 }}>로딩중...</div>;
  }

  return (
    <section style={styles.page}>
      <button onClick={onBack} style={styles.backButton}>
        ← 목록으로
      </button>

      {/*  헤더 */}
      <div style={styles.headerCard}>
        <div>
          <div style={styles.badge}>WRITE</div>
          <h1 style={styles.title}>
            {stockInfo?.name || symbol} 게시글 작성
          </h1>
          <p style={styles.desc}>
            분석, 의견, 매매 전략을 자유롭게 공유하세요
          </p>

          <div style={styles.tip}>
            💡 좋은 글은 더 많은 추천을 받습니다
          </div>
        </div>

        <div style={styles.stockBox}>
          <div>{stockInfo?.symbol || symbol}</div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>
            {stockInfo?.currentPrice
              ? `${stockInfo.currentPrice.toLocaleString()}원`
              : "-"}
          </div>
        </div>
      </div>

      {/*  폼 */}
      <div style={styles.formCard}>
        {/* 제목 */}
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="제목 입력"
          style={styles.titleInput}
        />

        {/* 관리자 공지 */}
        {isAdmin && (
          <div style={styles.noticeBox}>
            <label>
              <input
                type="checkbox"
                name="isNotice"
                checked={form.isNotice}
                onChange={handleChange}
              />
              공지글 등록
            </label>
          </div>
        )}

        {/* 내용 */}
        <textarea
          name="content"
          value={form.content}
          onChange={handleChange}
          placeholder="내용 입력"
          style={styles.textarea}
        />

        {/* 버튼 */}
        <div style={styles.btnRow}>
          <button onClick={onBack} style={styles.cancel}>
            취소
          </button>
          <button onClick={handleSubmit} style={styles.submit}>
            등록
          </button>
        </div>
      </div>
    </section>
  );
};

const styles = {
  page: {
    maxWidth: 1000,
    margin: "0 auto",
    padding: 30,
    background: "#f8fafc",
  },

  backButton: {
    marginBottom: 10,
    border: "none",
    background: "none",
    cursor: "pointer",
  },

  headerCard: {
    background: "linear-gradient(135deg, #4874d4, #c6d2e7)",
    color: "white",
    padding: 30,
    borderRadius: 20,
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  badge: {
    fontSize: 12,
    background: "#4f46e5",
    padding: "4px 10px",
    borderRadius: 20,
    display: "inline-block",
  },

  title: {
    fontSize: 28,
    fontWeight: 800,
  },

  desc: {
    fontSize: 14,
    color: "#d1d5db",
  },

  tip: {
    marginTop: 10,
    fontSize: 13,
    color: "#fbbf24",
  },

  stockBox: {
    textAlign: "right",
  },

  formCard: {
    background: "white",
    padding: 20,
    borderRadius: 20,
  },

  titleInput: {
    width: "100%",
    height: 50,
    marginBottom: 15,
    padding: 10,
    borderRadius: 10,
    border: "1px solid #ddd",
  },

  noticeBox: {
    background: "#fff7ed",
    padding: 10,
    borderRadius: 10,
    marginBottom: 15,
  },

  textarea: {
    width: "100%",
    height: 250,
    padding: 10,
    borderRadius: 10,
    border: "1px solid #ddd",
  },

  btnRow: {
    marginTop: 20,
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
  },

  cancel: {
    padding: "10px 15px",
    border: "1px solid #ddd",
    borderRadius: 10,
    cursor: "pointer",
  },

  submit: {
    padding: "10px 15px",
    background: "#111827",
    color: "white",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
  },
};

export default CommunityPostWritePage;