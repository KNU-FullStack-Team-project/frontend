import React, { useEffect, useMemo, useState } from "react";

const CommunityPostDetailPage = ({
  postId,
  currentUser,
  isLoggedIn,
  onBack,
}) => {
  const [postDetail, setPostDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState("");

  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    content: "",
  });

  const fetchPostDetail = async () => {
    if (!postId) return;

    try {
      setLoading(true);

      const token = localStorage.getItem("accessToken");

      const response = await fetch(`/api/community/posts/${postId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error("게시글 상세 정보를 불러오지 못했습니다.");
      }

      const data = await response.json();
      setPostDetail(data);
    } catch (error) {
      console.error("게시글 상세 조회 오류:", error);
      setPostDetail(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostDetail();
  }, [postId]);

  useEffect(() => {
    if (postDetail) {
      setEditForm({
        title: postDetail.title || "",
        content: postDetail.content || "",
      });
    }
  }, [postDetail]);

  const canManagePost = useMemo(() => {
    if (!currentUser || !postDetail) return false;
    return (
      currentUser.role === "admin" ||
      currentUser.userId === postDetail.userId
    );
  }, [currentUser, postDetail]);

  const canDeleteComment = (commentUserId) => {
    if (!currentUser) return false;
    return (
      currentUser.role === "admin" ||
      currentUser.userId === commentUserId
    );
  };

  const handleSubmitComment = async () => {
    if (!isLoggedIn || !currentUser?.userId) {
      alert("로그인 후 댓글을 작성할 수 있습니다.");
      return;
    }

    if (!commentContent.trim()) {
      alert("댓글 내용을 입력해주세요.");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        alert("로그인 토큰이 없습니다.");
        return;
      }

      const response = await fetch(`/api/community/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: commentContent.trim(),
        }),
      });

      const text = await response.text();

      if (!response.ok) {
        alert(text || "댓글 작성에 실패했습니다.");
        return;
      }

      alert("댓글이 작성되었습니다.");
      setCommentContent("");
      fetchPostDetail();
    } catch (error) {
      console.error("댓글 작성 오류:", error);
      alert("댓글 작성 중 오류가 발생했습니다.");
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStartEdit = () => {
    setEditForm({
      title: postDetail?.title || "",
      content: postDetail?.content || "",
    });
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditForm({
      title: postDetail?.title || "",
      content: postDetail?.content || "",
    });
    setIsEditMode(false);
  };

  const handleUpdatePost = async () => {
    if (!editForm.title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    if (!editForm.content.trim()) {
      alert("내용을 입력해주세요.");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        alert("로그인 토큰이 없습니다.");
        return;
      }

      const response = await fetch(`/api/community/posts/${postId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editForm.title.trim(),
          content: editForm.content.trim(),
        }),
      });

      const text = await response.text();

      if (!response.ok) {
        alert(text || "게시글 수정에 실패했습니다.");
        return;
      }

      alert("게시글이 수정되었습니다.");
      setIsEditMode(false);
      fetchPostDetail();
    } catch (error) {
      console.error("게시글 수정 오류:", error);
      alert("게시글 수정 중 오류가 발생했습니다.");
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm("게시글을 삭제하시겠습니까?")) return;

    try {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        alert("로그인 토큰이 없습니다.");
        return;
      }

      const response = await fetch(`/api/community/posts/${postId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await response.text();

      if (!response.ok) {
        alert(text || "게시글 삭제에 실패했습니다.");
        return;
      }

      alert("게시글이 삭제되었습니다.");
      onBack();
    } catch (error) {
      console.error("게시글 삭제 오류:", error);
      alert("게시글 삭제 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("댓글을 삭제하시겠습니까?")) return;

    try {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        alert("로그인 토큰이 없습니다.");
        return;
      }

      const response = await fetch(`/api/community/comments/${commentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await response.text();

      if (!response.ok) {
        alert(text || "댓글 삭제에 실패했습니다.");
        return;
      }

      alert("댓글이 삭제되었습니다.");
      fetchPostDetail();
    } catch (error) {
      console.error("댓글 삭제 오류:", error);
      alert("댓글 삭제 중 오류가 발생했습니다.");
    }
  };

  if (!postId) {
    return (
      <section style={styles.page}>
        <div style={styles.emptyCard}>
          <p style={styles.emptyTitle}>선택된 게시글이 없습니다.</p>
          <p style={styles.emptyText}>게시글 목록에서 다시 선택해주세요.</p>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section style={styles.page}>
        <div style={styles.emptyCard}>
          <p style={styles.emptyText}>게시글을 불러오는 중입니다...</p>
        </div>
      </section>
    );
  }

  if (!postDetail) {
    return (
      <section style={styles.page}>
        <div style={styles.emptyCard}>
          <p style={styles.emptyTitle}>게시글을 불러오지 못했습니다.</p>
          <p style={styles.emptyText}>잠시 후 다시 시도해주세요.</p>
        </div>
      </section>
    );
  }

  return (
    <section style={styles.page}>
      <button type="button" onClick={onBack} style={styles.backButton}>
        ← 게시글 목록으로 돌아가기
      </button>

      <div style={styles.detailCard}>
        <div style={styles.stockBadgeWrap}>
          <span style={styles.stockBadge}>
            {postDetail.stockName || postDetail.stockCode || "종목 커뮤니티"}
          </span>
        </div>

        {isEditMode ? (
          <>
            <input
              type="text"
              name="title"
              value={editForm.title}
              onChange={handleEditChange}
              placeholder="제목을 입력하세요."
              style={styles.titleInput}
            />

            <div style={styles.metaRow}>
              <span style={styles.nickname}>
                {postDetail.nickname}
                {postDetail.hasBoughtStock ? "★" : ""}
              </span>
              <span>
                {postDetail.createdAt
                  ? new Date(postDetail.createdAt).toLocaleString("ko-KR")
                  : "-"}
              </span>
              <span>조회 {postDetail.viewCount ?? 0}</span>
              <span>댓글 {postDetail.commentCount ?? 0}</span>
            </div>

            <textarea
              name="content"
              value={editForm.content}
              onChange={handleEditChange}
              placeholder="내용을 입력하세요."
              style={styles.editContentInput}
            />

            {canManagePost && (
              <div style={styles.actionRow}>
                <button
                  type="button"
                  onClick={handleUpdatePost}
                  style={styles.actionButton}
                >
                  저장
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  style={styles.subActionButton}
                >
                  취소
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <h1 style={styles.title}>{postDetail.title}</h1>

            <div style={styles.metaRow}>
              <span style={styles.nickname}>
                {postDetail.nickname}
                {postDetail.hasBoughtStock ? "★" : ""}
              </span>
              <span>
                {postDetail.createdAt
                  ? new Date(postDetail.createdAt).toLocaleString("ko-KR")
                  : "-"}
              </span>
              <span>조회 {postDetail.viewCount ?? 0}</span>
              <span>댓글 {postDetail.commentCount ?? 0}</span>
            </div>

            {canManagePost && (
              <div style={styles.actionRow}>
                <button
                  type="button"
                  onClick={handleStartEdit}
                  style={styles.actionButton}
                >
                  수정
                </button>
                <button
                  type="button"
                  onClick={handleDeletePost}
                  style={styles.deleteButton}
                >
                  삭제
                </button>
              </div>
            )}

            <div style={styles.contentBox}>{postDetail.content}</div>
          </>
        )}
      </div>

      <div style={styles.commentWriteCard}>
        <h3 style={styles.sectionTitle}>댓글 작성</h3>
        <textarea
          value={commentContent}
          onChange={(e) => setCommentContent(e.target.value)}
          placeholder="댓글을 입력하세요."
          style={styles.commentInput}
        />
        <div style={styles.writeActionRow}>
          <button
            type="button"
            onClick={handleSubmitComment}
            style={styles.writeButton}
          >
            댓글 등록
          </button>
        </div>
      </div>

      <div style={styles.commentListCard}>
        <div style={styles.listTitleRow}>
          <h3 style={styles.sectionTitle}>댓글 목록</h3>
          <span style={styles.postCount}>
            총 {postDetail.comments?.length ?? 0}개
          </span>
        </div>

        {!Array.isArray(postDetail.comments) || postDetail.comments.length === 0 ? (
          <div style={styles.emptyInner}>아직 댓글이 없습니다.</div>
        ) : (
          <div style={styles.commentList}>
            {postDetail.comments.map((comment) => (
              <div key={comment.commentId} style={styles.commentItem}>
                <div style={styles.commentTop}>
                  <span style={styles.nickname}>{comment.nickname}</span>
                  <div style={styles.commentTopRight}>
                    <span style={styles.commentDate}>
                      {comment.createdAt
                        ? new Date(comment.createdAt).toLocaleString("ko-KR")
                        : "-"}
                    </span>

                    {canDeleteComment(comment.userId) && (
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(comment.commentId)}
                        style={styles.commentDeleteButton}
                      >
                        삭제
                      </button>
                    )}
                  </div>
                </div>
                <div style={styles.commentContent}>{comment.content}</div>
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
  detailCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "24px",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.04)",
    marginBottom: "20px",
  },
  stockBadgeWrap: {
    marginBottom: "12px",
  },
  stockBadge: {
    display: "inline-block",
    padding: "6px 12px",
    borderRadius: "999px",
    background: "#eef2ff",
    color: "#4c6ef5",
    fontSize: "12px",
    fontWeight: "800",
  },
  title: {
    margin: "0 0 14px",
    fontSize: "30px",
    fontWeight: "800",
    color: "#111827",
    lineHeight: "1.4",
    textAlign: "left",
  },
  titleInput: {
    width: "100%",
    height: "48px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    padding: "0 14px",
    fontSize: "24px",
    fontWeight: "700",
    marginBottom: "14px",
    outline: "none",
  },
  metaRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "14px",
    fontSize: "13px",
    color: "#6b7280",
    marginBottom: "20px",
  },
  nickname: {
    fontWeight: "800",
    color: "#374151",
  },
  actionRow: {
    display: "flex",
    gap: "8px",
    justifyContent: "flex-end",
    marginBottom: "16px",
  },
  actionButton: {
    padding: "10px 14px",
    borderRadius: "10px",
    border: "none",
    background: "#111827",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "13px",
  },
  subActionButton: {
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#374151",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "13px",
  },
  deleteButton: {
    padding: "10px 14px",
    borderRadius: "10px",
    border: "none",
    background: "#dc2626",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "13px",
  },
  contentBox: {
    borderTop: "1px solid #f1f3f5",
    paddingTop: "20px",
    whiteSpace: "pre-wrap",
    fontSize: "15px",
    lineHeight: "1.8",
    color: "#111827",
    minHeight: "180px",
    textAlign: "left",
  },
  editContentInput: {
    width: "100%",
    minHeight: "220px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    padding: "14px",
    fontSize: "15px",
    resize: "vertical",
    outline: "none",
    marginBottom: "12px",
    fontFamily: "inherit",
    lineHeight: "1.8",
    textAlign: "left",
  },
  commentWriteCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "20px",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.04)",
    marginBottom: "20px",
  },
  commentListCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "20px",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.04)",
  },
  sectionTitle: {
    margin: "0 0 14px",
    fontSize: "20px",
    fontWeight: "800",
    color: "#111827",
  },
  commentInput: {
    width: "100%",
    minHeight: "120px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    padding: "14px",
    fontSize: "14px",
    resize: "vertical",
    outline: "none",
    marginBottom: "12px",
    fontFamily: "inherit",
    textAlign: "left",
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
  commentList: {
    display: "grid",
    gap: "12px",
  },
  commentItem: {
    border: "1px solid #ececec",
    borderRadius: "14px",
    padding: "16px",
    background: "#fafafa",
  },
  commentTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "10px",
    fontSize: "13px",
    color: "#6b7280",
  },
  commentTopRight: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  commentDate: {
    color: "#6b7280",
  },
  commentDeleteButton: {
    padding: "6px 10px",
    borderRadius: "8px",
    border: "1px solid #fecaca",
    background: "#fff5f5",
    color: "#dc2626",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "12px",
  },
  commentContent: {
    whiteSpace: "pre-wrap",
    fontSize: "14px",
    lineHeight: "1.7",
    color: "#111827",
    textAlign: "left",
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

export default CommunityPostDetailPage;