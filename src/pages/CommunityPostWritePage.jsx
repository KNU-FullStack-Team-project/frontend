import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import CommunityQuillEditor from "../components/community/CommunityQuillEditor";

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
  const [noticeTarget, setNoticeTarget] = useState("none");
  const [attachedFiles, setAttachedFiles] = useState([]);

  const isAdmin = currentUser?.role === "admin";
  const isStockBoard = boardType === "stock";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: "",
      content: "",
    },
  });

  const title = watch("title");
  const content = watch("content");

  const pageTitle = isStockBoard
    ? `${stockInfo?.name || stockInfo?.stockName || symbol} 게시글 작성`
    : "자유게시판 글쓰기";

  const pageDesc = isStockBoard
    ? "분석, 의견, 매매 전략을 자유롭게 공유하세요."
    : "자유롭게 글을 작성하고 다른 사용자와 의견을 나눠보세요.";

  const plainContent = useMemo(() => {
    return (content || "")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .trim();
  }, [content]);

  const contentLength = plainContent.length;

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

        if (!response.ok) {
          throw new Error("종목 정보를 불러오지 못했습니다.");
        }

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
const getSubmitConfig = () => {
    if (!isAdmin || noticeTarget === "none") {
      return {
        submitUrl: isStockBoard
          ? `/api/community/stocks/${symbol}/posts`
          : "/api/community/boards/free/posts",
        payloadIsNotice: false,
      };
    }

    if (noticeTarget === "global") {
      return {
        submitUrl: "/api/community/notices",
        payloadIsNotice: true,
      };
    }

    if (noticeTarget === "free") {
      return {
        submitUrl: "/api/community/boards/free/posts",
        payloadIsNotice: true,
      };
    }

    if (noticeTarget === "stock") {
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
    : `/api/community/boards/free/posts`,
  payloadIsNotice: false,
};
  };

  const uploadImage = async (file) => {
    if (!isLoggedIn || !currentUser?.userId) {
      throw new Error("로그인 후 이미지를 업로드할 수 있습니다.");
    }
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/community/uploads/images", {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "이미지 업로드 실패");
    }

    return response.json();
  };

  const uploadOneFile = async (file) => {
    if (!isLoggedIn || !currentUser?.userId) {
      throw new Error("로그인 후 파일을 첨부할 수 있습니다.");
    }
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/community/uploads/files", {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `${file.name} 업로드 실패`);
    }

    return response.json();
  };

  const handleUploadFiles = async (files) => {
    const selectedFiles = Array.from(files || []);
    if (!selectedFiles.length) return;

    try {
      setUploadingFile(true);

      const uploadedResults = [];

      for (const file of selectedFiles) {
        const uploaded = await uploadOneFile(file);
        uploadedResults.push(uploaded);
      }

      setAttachedFiles((prev) => {
        // 중복 업로드 방지 (ID 기준 필터링)
        const newFiles = uploadedResults.filter(
          (uploaded) => !prev.some((f) => f.attachmentId === uploaded.attachmentId)
        );
        return [...prev, ...newFiles];
      });
      toast.success(`${uploadedResults.length}개 파일이 첨부되었습니다.`);
    } catch (error) {
      console.error(error);
      toast.error(error.message || "파일 업로드 중 오류가 발생했습니다.");
    } finally {
      setUploadingFile(false);
    }
  };

  const onDrop = async (acceptedFiles) => {
    await handleUploadFiles(acceptedFiles);
  };

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true,
    multiple: true,
  });

  const handleRemoveAttachedFile = (attachmentId) => {
    setAttachedFiles((prev) =>
      prev.filter((file) => file.attachmentId !== attachmentId)
    );
  };

  const handleNoticeTargetChange = (target) => {
    setNoticeTarget((prev) => (prev === target ? "none" : target));
  };

  const onSubmit = async (data) => {
    if (!isLoggedIn || !currentUser?.userId) {
      toast.error("로그인 후 글을 작성할 수 있습니다.");
      return;
    }

    if (!data.title?.trim()) {
      toast.error("제목을 입력해주세요.");
      return;
    }

    if (!plainContent) {
      toast.error("내용을 입력해주세요.");
      return;
    }
    try {
      setSubmitting(true);

      const { submitUrl, payloadIsNotice } = getSubmitConfig();

      const response = await fetch(submitUrl, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: data.title.trim(),
          content: data.content,
          isNotice: payloadIsNotice,
          attachmentIds: attachedFiles.map((file) => file.attachmentId),
        }),
      });

      const text = await response.text();

      if (!response.ok) {
        toast.error(text || "게시글 작성에 실패했습니다.");
        return;
      }

      toast.success("게시글 작성 완료");
      onSuccess?.();
    } catch (error) {
      console.error(error);
      toast.error(error.message || "게시글 작성 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatFileSize = (size) => {
    const bytes = Number(size || 0);

    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <section style={styles.page}>
        <div style={styles.loadingCard}>로딩중...</div>
      </section>
    );
  }

  return (
    <section style={styles.page}>
      <button type="button" onClick={onBack} style={styles.backButton}>
        ← 목록으로
      </button>

      <div style={styles.headerCard}>
        <div style={styles.badge}>WRITE</div>
        <h1 style={styles.title}>{pageTitle}</h1>
        <p style={styles.desc}>{pageDesc}</p>

        <div style={styles.tip}>
          글꼴, 글크기, 굵기, 색상, 정렬, 링크, 이미지, 파일 첨부를 사용할 수 있습니다.
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

      <form onSubmit={handleSubmit(onSubmit)} style={styles.formCard}>
        <div>
          <input
            {...register("title", {
              required: "제목을 입력해주세요.",
              maxLength: {
                value: 200,
                message: "제목은 200자 이하로 입력해주세요.",
              },
            })}
            placeholder="제목 입력"
            style={{
              ...styles.titleInput,
              ...(errors.title ? styles.inputError : {}),
            }}
          />

          <div style={styles.titleMeta}>
            <span style={errors.title ? styles.errorText : styles.helperText}>
              {errors.title?.message || "제목은 최대 200자까지 입력할 수 있습니다."}
            </span>
            <span style={styles.helperText}>{title?.length || 0}/200</span>
          </div>
        </div>

        {isAdmin && (
          <div style={styles.noticeBox}>
            <div style={styles.noticeTitle}>관리자 공지 등록</div>

            <div style={styles.noticeOptionRow}>
              <label style={styles.noticeOption}>
                <input
                  type="checkbox"
                  checked={noticeTarget === "global"}
                  onChange={() => handleNoticeTargetChange("global")}
                />
                전역공지
              </label>

              <label style={styles.noticeOption}>
                <input
                  type="checkbox"
                  checked={noticeTarget === "free"}
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
                  checked={noticeTarget === "stock"}
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

        <div>
          <CommunityQuillEditor
            value={content || ""}
            onChange={(html) =>
              setValue("content", html, {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
            onUploadImage={uploadImage}
            placeholder="내용을 입력하세요. 이미지도 본문 안에 삽입할 수 있습니다."
            minHeight={360}
          />

          <div style={styles.editorMeta}>
            <span style={styles.helperText}>본문 {contentLength}자</span>
            <span style={styles.helperText}>
              글꼴, 글크기, 굵기, 정렬, 링크, 이미지 삽입 가능
            </span>
          </div>
        </div>

        <div
          {...getRootProps()}
          style={{
            ...styles.dropzone,
            ...(isDragActive ? styles.dropzoneActive : {}),
          }}
        >
          <input {...getInputProps()} />

          <div style={styles.dropzoneContent}>
            <div style={styles.dropzoneTitle}>
              {isDragActive ? "여기에 파일을 놓으세요" : "파일 첨부"}
            </div>

            <div style={styles.dropzoneText}>
              파일을 드래그하거나 버튼을 눌러 첨부할 수 있습니다.
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation(); // 상위 div로의 이벤트 전파 차단
                open();
              }}
              style={styles.attachButton}
              disabled={uploadingFile}
            >
              {uploadingFile ? "업로드 중..." : "파일 선택"}
            </button>
          </div>
        </div>

        {attachedFiles.length > 0 && (
          <div style={styles.fileList}>
            {attachedFiles.map((file) => (
              <div key={file.attachmentId} style={styles.fileItem}>
                <div style={styles.fileInfo}>
                  <span style={styles.fileIcon}>
                    {file.fileType === "IMAGE" ? "🖼️" : "📎"}
                  </span>
                  <div style={styles.fileTextBox}>
                    <span style={styles.fileName}>{file.originalName}</span>
                    <span style={styles.fileSize}>
                      {formatFileSize(file.fileSize)}
                    </span>
                  </div>
                </div>

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

        <div style={styles.btnRow}>
          <button type="button" onClick={onBack} style={styles.cancel}>
            취소
          </button>

          <button type="submit" style={styles.submit} disabled={submitting}>
            {submitting ? "등록 중..." : "등록"}
          </button>
        </div>
      </form>
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
  loadingCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 40,
    textAlign: "center",
    color: "#6b7280",
    fontWeight: 700,
  },
  backButton: {
    marginBottom: 10,
    border: "none",
    background: "none",
    cursor: "pointer",
    color: "#374151",
    fontWeight: 700,
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
    opacity: 0.95,
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
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
  },
  titleInput: {
    width: "100%",
    height: 50,
    padding: "0 14px",
    borderRadius: 12,
    border: "1px solid #ddd",
    fontSize: 16,
    outline: "none",
  },
  inputError: {
    borderColor: "#ef4444",
    background: "#fff5f5",
  },
  titleMeta: {
    marginTop: 8,
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
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
  editorMeta: {
    marginTop: 8,
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  dropzone: {
    border: "1.5px dashed #cbd5e1",
    borderRadius: 16,
    background: "#f8fafc",
    padding: 18,
    transition: "all 0.15s ease",
  },
  dropzoneActive: {
    borderColor: "#4c6ef5",
    background: "#eef2ff",
  },
  dropzoneContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    flexWrap: "wrap",
  },
  dropzoneTitle: {
    fontSize: 15,
    fontWeight: 900,
    color: "#111827",
  },
  dropzoneText: {
    flex: 1,
    fontSize: 13,
    color: "#6b7280",
    minWidth: 220,
  },
  attachButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: 38,
    padding: "0 14px",
    borderRadius: 10,
    border: "none",
    background: "#111827",
    color: "#fff",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 700,
  },
  helperText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: 600,
  },
  errorText: {
    fontSize: 12,
    color: "#ef4444",
    fontWeight: 700,
  },
  fileList: {
    display: "grid",
    gap: 10,
  },
  fileItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "12px 14px",
  },
  fileInfo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    minWidth: 0,
  },
  fileIcon: {
    fontSize: 20,
  },
  fileTextBox: {
    display: "grid",
    gap: 2,
    minWidth: 0,
  },
  fileName: {
    fontSize: 14,
    color: "#374151",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontWeight: 700,
  },
  fileSize: {
    fontSize: 12,
    color: "#9ca3af",
    fontWeight: 600,
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