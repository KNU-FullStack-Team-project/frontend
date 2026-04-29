import React, { useEffect, useMemo, useState } from "react";
import RichTextEditor from "../components/community/RichTextEditor";

const CommunityPostWritePage = ({
  boardType = "stock",
  symbol,
  currentUser,
  isLoggedIn,
  onBack,
  onSuccess,
}) => {
  const [stockInfo, setStockInfo] = useState(null);
  const [loading, setLoading] = useState(boardType === "stock");
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const [form, setForm] = useState({
    title: "",
    content: "",
    isNotice: false,
    noticeTarget: "none", // none | global | free | stock
  });

  const [attachedFiles, setAttachedFiles] = useState([]);

  const isAdmin = currentUser?.role === "admin";
  const isStockBoard = boardType === "stock";

  const pageTitle = isStockBoard
    ? `${stockInfo?.name || stockInfo?.stockName || symbol} 게시글 작성`
    : "자유게시판 글쓰기";

  const pageDesc = isStockBoard
    ? "분석, 의견, 매매 전략을 자유롭게 공유하세요."
    : "자유롭게 글을 작성하고 다른 사용자와 의견을 나눠보세요.";

  const plainContent = useMemo(() => {
    return (form.content || "")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .trim();
  }, [form.content]);

  useEffect(() => {
    if (!isStockBoard) {
      setLoading(false);
      setStockInfo(null);
      return;
    }

    const fetchStockInfo = async () => {
      if (!symbol) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/stocks/${symbol}`);

        if (!response.ok) throw new Error("종목 정보를 불러오지 못했습니다.");

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
  }, [symbol, isStockBoard]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleNoticeTargetChange = (target) => {
    setForm((prev) => {
      const nextTarget = prev.noticeTarget === target ? "none" : target;
      return {
        ...prev,
        noticeTarget: nextTarget,
        isNotice: nextTarget !== "none",
      };
    });
  };

  const getSubmitConfig = () => {
    if (!isAdmin || form.noticeTarget === "none") {
      return {
        submitUrl: isStockBoard
          ? `/api/community/stocks/${symbol}/posts`
          : "/api/community/boards/free/posts",
        payloadIsNotice: false,
      };
    }

    if (form.noticeTarget === "global") {
      return {
        submitUrl: "/api/community/notices",
        payloadIsNotice: true,
      };
    }

    if (form.noticeTarget === "free") {
      return {
        submitUrl: "/api/community/boards/free/posts",
        payloadIsNotice: true,
      };
    }

    if (form.noticeTarget === "stock") {
      if (!symbol) {
        throw new Error("종목게시판 공지는 종목 게시판에서만 작성할 수 있습니다.");
      }

      return {
        submitUrl: `/api/community/stocks/${symbol}/posts`,
        payloadIsNotice: true,
      };
    }

    return {
      submitUrl: isStockBoard
        ? `/api/community/stocks/${symbol}/posts`
        : "/api/community/boards/free/posts",
      payloadIsNotice: false,
    };
  };

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/community/uploads/images", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "이미지 업로드 실패");
    }

    return response.json();
  };

  const handleAttachFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";

    if (!files.length) return;
    if (!isLoggedIn || !currentUser?.userId) {
      alert("로그인 후 파일을 첨부할 수 있습니다.");
      return;
    }

    try {
      setUploadingFile(true);

      const uploadedResults = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/community/uploads/files", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || `${file.name} 업로드 실패`);
        }

        uploadedResults.push(await response.json());
      }

      setAttachedFiles((prev) => [...prev, ...uploadedResults]);
    } catch (error) {
      console.error(error);
      alert(error.message || "파일 업로드 중 오류가 발생했습니다.");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleRemoveAttachedFile = (attachmentId) => {
    setAttachedFiles((prev) =>
      prev.filter((file) => file.attachmentId !== attachmentId)
    );
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

    if (!plainContent) {
      alert("내용을 입력해주세요.");
      return;
    }

    try {
      setSubmitting(true);

      const { submitUrl, payloadIsNotice } = getSubmitConfig();

      const response = await fetch(submitUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: form.title.trim(),
          content: form.content,
          isNotice: payloadIsNotice,
          attachmentIds: attachedFiles.map((file) => file.attachmentId),
        }),
      });

      const text = await response.text();

      if (!response.ok) {
        alert(text || "게시글 작성에 실패했습니다.");
        return;
      }

      alert("게시글 작성 완료");
      onSuccess?.();
    } catch (e) {
      console.error(e);
      alert(e.message || "게시글 작성 중 오류가 발생했습니다.");
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

      <div style={styles.headerCard}>
        <div style={styles.badge}>WRITE</div>
        <h1 style={styles.title}>{pageTitle}</h1>
        <p style={styles.desc}>{pageDesc}</p>

        <div style={styles.tip}>
          글꼴, 색상, 크기, 정렬, 이미지, 파일 첨부를 사용할 수 있습니다.
        </div>

        {isStockBoard && (
          <div style={styles.stockBox}>
            <div>{stockInfo?.symbol || stockInfo?.stockCode || symbol}</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>
              {stockInfo?.currentPrice
                ? `${Number(stockInfo.currentPrice).toLocaleString()}원`
                : "-"}
            </div>
          </div>
        )}
      </div>

      <div style={styles.formCard}>
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="제목 입력"
          style={styles.titleInput}
        />

        {isAdmin && (
          <div style={styles.noticeBox}>
            <div style={styles.noticeTitle}>관리자 공지 등록</div>
            <div style={styles.noticeOptionRow}>
              <label style={styles.noticeOption}>
                <input
                  type="checkbox"
                  checked={form.noticeTarget === "global"}
                  onChange={() => handleNoticeTargetChange("global")}
                />
                전역공지
              </label>

              <label style={styles.noticeOption}>
                <input
                  type="checkbox"
                  checked={form.noticeTarget === "free"}
                  onChange={() => handleNoticeTargetChange("free")}
                />
                자유게시판공지
              </label>

              <label
                style={{
                  ...styles.noticeOption,
                  ...(!symbol ? styles.noticeOptionDisabled : {}),
                }}
              >
                <input
                  type="checkbox"
                  checked={form.noticeTarget === "stock"}
                  onChange={() => handleNoticeTargetChange("stock")}
                  disabled={!symbol}
                />
                종목게시판공지
              </label>
            </div>

            <div style={styles.noticeGuide}>
              한 번에 하나만 선택됩니다. 선택하지 않으면 일반글로 등록됩니다.
            </div>
          </div>
        )}

        <RichTextEditor
          value={form.content}
          onChange={(html) =>
            setForm((prev) => ({
              ...prev,
              content: html,
            }))
          }
          onUploadImage={uploadImage}
          minHeight={360}
          placeholder="내용을 입력하세요. 이미지도 본문 안에 삽입할 수 있습니다."
        />

        <div style={styles.attachSection}>
          <div style={styles.attachHeader}>
            <strong>파일 첨부</strong>
            <label style={styles.attachButton}>
              파일 선택
              <input
                type="file"
                multiple
                onChange={handleAttachFiles}
                style={{ display: "none" }}
              />
            </label>
          </div>

          {uploadingFile && <div style={styles.helperText}>파일 업로드 중...</div>}

          {attachedFiles.length > 0 && (
            <div style={styles.fileList}>
              {attachedFiles.map((file) => (
                <div key={file.attachmentId} style={styles.fileItem}>
                  <span style={styles.fileName}>{file.originalName}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachedFile(file.attachmentId)}
                    style={styles.removeFileButton}
                  >
                    제거
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={styles.btnRow}>
          <button onClick={onBack} style={styles.cancel}>
            취소
          </button>
          <button onClick={handleSubmit} style={styles.submit} disabled={submitting}>
            {submitting ? "등록 중..." : "등록"}
          </button>
        </div>
      </div>
    </section>
  );
};

const styles = {
  page: {
    maxWidth: 1100,
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
  badge: {
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
  title: {
    margin: "0 0 10px",
    fontSize: "36px",
    fontWeight: "800",
    color: "#fff",
  },
  desc: {
    margin: 0,
    fontSize: "15px",
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: "1.6",
    maxWidth: "800px",
  },
  tip: {
    marginTop: 8,
    fontSize: 13,
    color: "#fef3c7",
    opacity: 0.9,
  },
  stockBox: {
    position: "absolute",
    top: 25,
    right: 30,
    textAlign: "right",
  },
  formCard: {
    background: "white",
    padding: 24,
    borderRadius: 20,
    display: "grid",
    gap: 16,
  },
  titleInput: {
    width: "100%",
    height: 50,
    padding: 12,
    borderRadius: 12,
    border: "1px solid #ddd",
    fontSize: 16,
  },
  noticeBox: {
    background: "#fff7ed",
    padding: 12,
    borderRadius: 12,
    border: "1px solid #fed7aa",
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: 800,
    color: "#9a3412",
    marginBottom: 10,
  },
  noticeOptionRow: {
    display: "flex",
    gap: 16,
    flexWrap: "wrap",
  },
  noticeOption: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 14,
    color: "#7c2d12",
    fontWeight: 700,
  },
  noticeOptionDisabled: {
    opacity: 0.5,
  },
  noticeGuide: {
    marginTop: 10,
    fontSize: 12,
    color: "#9a3412",
  },
  attachSection: {
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 16,
    background: "#fafafa",
  },
  attachHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  attachButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: 38,
    padding: "0 14px",
    borderRadius: 10,
    background: "#111827",
    color: "#fff",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 700,
  },
  helperText: {
    fontSize: 13,
    color: "#6b7280",
  },
  fileList: {
    display: "grid",
    gap: 10,
    marginTop: 10,
  },
  fileItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: "10px 12px",
  },
  fileName: {
    fontSize: 14,
    color: "#374151",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  removeFileButton: {
    border: "none",
    background: "#fee2e2",
    color: "#b91c1c",
    borderRadius: 8,
    padding: "6px 10px",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700,
    flexShrink: 0,
  },
  btnRow: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 12,
  },
  cancel: {
    minWidth: 100,
    height: 44,
    borderRadius: 12,
    border: "1px solid #d1d5db",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 700,
  },
  submit: {
    minWidth: 120,
    height: 44,
    borderRadius: 12,
    border: "none",
    background: "#111827",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
  },
};

export default CommunityPostWritePage;