import React, { useEffect, useMemo, useState } from "react";

const REPORT_REASON_OPTIONS = [
  { value: "ABUSE", label: "욕설/비방" },
  { value: "SPAM", label: "도배" },
  { value: "ADVERTISEMENT", label: "홍보/상업성" },
  { value: "SEXUAL", label: "음란성" },
  { value: "ILLEGAL_FILMING", label: "불법촬영물" },
  { value: "ETC", label: "기타" },
];

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
    isNotice: false,
  });

  const [isLiking, setIsLiking] = useState(false);

  const [reportTarget, setReportTarget] = useState(null);
  const [reportForm, setReportForm] = useState({
    reason: "",
    detail: "",
  });
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const fetchPostDetail = async () => {
    if (!postId) return;

    try {
      setLoading(true);

      const token = localStorage.getItem("accessToken") || currentUser?.token;

      const response = await fetch(
        `http://localhost:8081/api/community/posts/${postId}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

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

  const increaseViewCount = async () => {
    if (!postId) return;

    try {
      await fetch(`http://localhost:8081/api/community/posts/${postId}/view`, {
        method: "POST",
      });
    } catch (error) {
      console.error("조회수 증가 오류:", error);
    }
  };

  useEffect(() => {
    fetchPostDetail();
    increaseViewCount();
  }, [postId]);

  useEffect(() => {
    if (postDetail) {
      setEditForm({
        title: postDetail.title || "",
        content: postDetail.content || "",
        isNotice: !!postDetail.isNotice,
      });
    }
  }, [postDetail]);

  const canManagePost = useMemo(() => {
    if (!currentUser || !postDetail) return false;
    return currentUser.role === "admin" || currentUser.userId === postDetail.userId;
  }, [currentUser, postDetail]);

  const isMyPost = useMemo(() => {
    if (!currentUser || !postDetail) return false;
    return currentUser.userId === postDetail.userId;
  }, [currentUser, postDetail]);

  const canDeleteComment = (commentUserId) => {
    if (!currentUser) return false;
    return currentUser.role === "admin" || currentUser.userId === commentUserId;
  };

  const canReportComment = (commentUserId) => {
    if (!currentUser) return false;
    return currentUser.userId !== commentUserId;
  };

  const canReportPost = useMemo(() => {
    if (!currentUser || !postDetail) return false;
    return currentUser.userId !== postDetail.userId;
  }, [currentUser, postDetail]);

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

  const openPostReportModal = () => {
    if (!isLoggedIn || !currentUser?.userId) {
      alert("로그인 후 신고할 수 있습니다.");
      return;
    }

    if (!canReportPost) {
      alert("본인 게시글은 신고할 수 없습니다.");
      return;
    }

    setReportTarget({
      type: "post",
      targetId: postId,
      title: postDetail?.title || "",
      writerNickname: postDetail?.nickname || "",
    });
    setReportForm({
      reason: "",
      detail: "",
    });
  };

  const openCommentReportModal = (comment) => {
    if (!isLoggedIn || !currentUser?.userId) {
      alert("로그인 후 신고할 수 있습니다.");
      return;
    }

    if (!canReportComment(comment.userId)) {
      alert("본인 댓글은 신고할 수 없습니다.");
      return;
    }

    setReportTarget({
      type: "comment",
      targetId: comment.commentId,
      title: comment.content || "",
      writerNickname: comment.nickname || "",
    });
    setReportForm({
      reason: "",
      detail: "",
    });
  };

  const closeReportModal = () => {
    if (isSubmittingReport) return;
    setReportTarget(null);
    setReportForm({
      reason: "",
      detail: "",
    });
  };

  const handleChangeReportForm = (e) => {
    const { name, value } = e.target;
    setReportForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLikePost = async () => {
    if (!isLoggedIn || !currentUser?.userId) {
      alert("로그인 후 추천할 수 있습니다.");
      return;
    }

    if (isMyPost) {
      alert("본인 글은 추천할 수 없습니다.");
      return;
    }

    if (postDetail?.likedByCurrentUser) {
      alert("이미 추천한 게시글입니다.");
      return;
    }

    try {
      setIsLiking(true);

      const token = localStorage.getItem("accessToken") || currentUser?.token;

      if (!token) {
        alert("로그인 토큰이 없습니다.");
        return;
      }

      const response = await fetch(
        `http://localhost:8081/api/community/posts/${postId}/like`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const text = await response.text();

      if (!response.ok) {
        alert(text || "추천에 실패했습니다.");
        return;
      }

      setPostDetail((prev) => ({
        ...prev,
        likeCount: (prev?.likeCount || 0) + 1,
        likedByCurrentUser: true,
      }));

      alert("추천이 반영되었습니다.");
    } catch (error) {
      console.error("추천 오류:", error);
      alert("추천 중 오류가 발생했습니다.");
    } finally {
      setIsLiking(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!reportTarget) return;

    if (!reportForm.reason) {
      alert("신고 사유를 선택해주세요.");
      return;
    }

    try {
      setIsSubmittingReport(true);

      const token = localStorage.getItem("accessToken") || currentUser?.token;

      if (!token) {
        alert("로그인 토큰이 없습니다.");
        return;
      }

      const url =
        reportTarget.type === "post"
          ? `http://localhost:8081/api/community/posts/${reportTarget.targetId}/report`
          : `http://localhost:8081/api/community/comments/${reportTarget.targetId}/report`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reason: reportForm.reason,
          detail: reportForm.detail.trim(),
        }),
      });

      const text = await response.text();

      if (!response.ok) {
        alert(text || "신고 접수에 실패했습니다.");
        return;
      }

      alert(reportTarget.type === "post" ? "게시글 신고가 접수되었습니다." : "댓글 신고가 접수되었습니다.");
      closeReportModal();
    } catch (error) {
      console.error("신고 오류:", error);
      alert("신고 처리 중 오류가 발생했습니다.");
    } finally {
      setIsSubmittingReport(false);
    }
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
      const token = localStorage.getItem("accessToken") || currentUser?.token;

      if (!token) {
        alert("로그인 토큰이 없습니다.");
        return;
      }

      const response = await fetch(
        `http://localhost:8081/api/community/posts/${postId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content: commentContent.trim(),
          }),
        }
      );

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
    const { name, value, type, checked } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleStartEdit = () => {
    setEditForm({
      title: postDetail?.title || "",
      content: postDetail?.content || "",
      isNotice: !!postDetail?.isNotice,
    });
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditForm({
      title: postDetail?.title || "",
      content: postDetail?.content || "",
      isNotice: !!postDetail?.isNotice,
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
      const token = localStorage.getItem("accessToken") || currentUser?.token;

      if (!token) {
        alert("로그인 토큰이 없습니다.");
        return;
      }

      const response = await fetch(
        `http://localhost:8081/api/community/posts/${postId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: editForm.title.trim(),
            content: editForm.content.trim(),
            isNotice: editForm.isNotice,
          }),
        }
      );

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
      const token = localStorage.getItem("accessToken") || currentUser?.token;

      if (!token) {
        alert("로그인 토큰이 없습니다.");
        return;
      }

      const response = await fetch(
        `http://localhost:8081/api/community/posts/${postId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

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
      const token = localStorage.getItem("accessToken") || currentUser?.token;

      if (!token) {
        alert("로그인 토큰이 없습니다.");
        return;
      }

      const response = await fetch(
        `http://localhost:8081/api/community/comments/${commentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

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
    <>
      <section style={styles.page}>
        <button type="button" onClick={onBack} style={styles.backButton}>
          ← 게시글 목록으로 돌아가기
        </button>

        <div style={styles.detailCard}>
          <div style={styles.stockBadgeWrap}>
            <span style={styles.stockBadge}>
              {postDetail.stockName || postDetail.stockCode || "종목 커뮤니티"}
            </span>
            {postDetail.isNotice && <span style={styles.noticeBadge}>공지</span>}
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

              {currentUser?.role === "admin" && (
                <label style={styles.noticeCheckWrap}>
                  <input
                    type="checkbox"
                    name="isNotice"
                    checked={editForm.isNotice}
                    onChange={handleEditChange}
                  />
                  공지글로 등록
                </label>
              )}

              <div style={styles.metaRow}>
                <span style={styles.nickname}>
                  {postDetail.nickname}
                  {postDetail.hasBoughtStock ? "★" : ""}
                </span>
                <span>{formatDateTime(postDetail.createdAt)}</span>
                <span>조회 {postDetail.viewCount ?? 0}</span>
                <span>댓글 {postDetail.commentCount ?? 0}</span>
                <span>추천 {postDetail.likeCount ?? 0}</span>
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
              <h1 style={styles.title}>
                {postDetail.isNotice && <span style={styles.noticeTitlePrefix}>[공지] </span>}
                {postDetail.title}
              </h1>

              <div style={styles.metaRow}>
                <span style={styles.nickname}>
                  {postDetail.nickname}
                  {postDetail.hasBoughtStock ? "★" : ""}
                </span>
                <span>{formatDateTime(postDetail.createdAt)}</span>
                <span>조회 {postDetail.viewCount ?? 0}</span>
                <span>댓글 {postDetail.commentCount ?? 0}</span>
                <span>추천 {postDetail.likeCount ?? 0}</span>
              </div>

              <div style={styles.topActionRow}>
                <div style={styles.likeRow}>
                  <button
                    type="button"
                    onClick={handleLikePost}
                    disabled={!isLoggedIn || postDetail.likedByCurrentUser || isLiking || isMyPost}
                    style={{
                      ...styles.likeButton,
                      ...((postDetail.likedByCurrentUser || isMyPost) ? styles.likeButtonDisabled : {}),
                    }}
                  >
                    {isMyPost
                      ? "내 글은 추천 불가"
                      : postDetail.likedByCurrentUser
                      ? "추천 완료"
                      : "👍 추천하기"}
                  </button>

                  {canReportPost && (
                    <button
                      type="button"
                      onClick={openPostReportModal}
                      style={styles.reportButton}
                    >
                      신고
                    </button>
                  )}
                </div>
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
                        {formatDateTime(comment.createdAt)}
                      </span>

                      {canReportComment(comment.userId) && (
                        <button
                          type="button"
                          onClick={() => openCommentReportModal(comment)}
                          style={styles.commentReportButton}
                        >
                          신고
                        </button>
                      )}

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

      {reportTarget && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>신고하기</h3>
              <button
                type="button"
                onClick={closeReportModal}
                style={styles.modalCloseButton}
              >
                ✕
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.reportInfoRow}>
                <span style={styles.reportInfoLabel}>
                  {reportTarget.type === "post" ? "제목" : "댓글 내용"}
                </span>
                <span style={styles.reportInfoValue}>{reportTarget.title}</span>
              </div>

              <div style={styles.reportInfoRow}>
                <span style={styles.reportInfoLabel}>작성자 닉네임</span>
                <span style={styles.reportInfoValue}>{reportTarget.writerNickname}</span>
              </div>

              <div style={styles.reportInfoRow}>
                <span style={styles.reportInfoLabel}>신고자 닉네임</span>
                <span style={styles.reportInfoValue}>{currentUser?.nickname || "-"}</span>
              </div>

              <div style={styles.reportSection}>
                <div style={styles.reportLabel}>신고 사유</div>
                <div style={styles.reportReasonGrid}>
                  {REPORT_REASON_OPTIONS.map((option) => (
                    <label key={option.value} style={styles.reportReasonOption}>
                      <input
                        type="radio"
                        name="reason"
                        value={option.value}
                        checked={reportForm.reason === option.value}
                        onChange={handleChangeReportForm}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={styles.reportSection}>
                <div style={styles.reportLabel}>상세 내용</div>
                <textarea
                  name="detail"
                  value={reportForm.detail}
                  onChange={handleChangeReportForm}
                  placeholder="신고 내용을 자세히 입력해주세요. (선택)"
                  style={styles.reportTextarea}
                />
              </div>

              <div style={styles.reportGuideBox}>
                신고 게시물은 관리자 검토 후 처리되며, 허위 신고일 경우 신고자의 활동에 제한이 있을 수 있습니다.
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button
                type="button"
                onClick={handleSubmitReport}
                disabled={isSubmittingReport}
                style={styles.submitReportButton}
              >
                신고 접수
              </button>
              <button
                type="button"
                onClick={closeReportModal}
                disabled={isSubmittingReport}
                style={styles.cancelReportButton}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </>
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
    display: "flex",
    gap: "8px",
    alignItems: "center",
    flexWrap: "wrap",
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
  noticeBadge: {
    display: "inline-block",
    padding: "6px 12px",
    borderRadius: "999px",
    background: "#fff0d9",
    color: "#d9480f",
    fontSize: "12px",
    fontWeight: "800",
  },
  noticeTitlePrefix: {
    color: "#d9480f",
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
  noticeCheckWrap: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "14px",
    fontSize: "14px",
    fontWeight: "700",
    color: "#374151",
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
  topActionRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
    flexWrap: "wrap",
  },
  likeRow: {
    display: "flex",
    justifyContent: "flex-start",
    gap: "8px",
    flexWrap: "wrap",
  },
  likeButton: {
    padding: "10px 16px",
    borderRadius: "10px",
    border: "none",
    background: "#2563eb",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "13px",
  },
  likeButtonDisabled: {
    background: "#94a3b8",
    cursor: "not-allowed",
  },
  reportButton: {
    padding: "10px 16px",
    borderRadius: "10px",
    border: "1px solid #fed7aa",
    background: "#fff7ed",
    color: "#c2410c",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "13px",
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
    flexWrap: "wrap",
  },
  commentDate: {
    color: "#6b7280",
  },
  commentReportButton: {
    padding: "6px 10px",
    borderRadius: "8px",
    border: "1px solid #fed7aa",
    background: "#fff7ed",
    color: "#c2410c",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "12px",
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
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    zIndex: 9999,
  },
  modalCard: {
    width: "100%",
    maxWidth: "640px",
    background: "#fff",
    borderRadius: "20px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 30px 60px rgba(15, 23, 42, 0.25)",
    overflow: "hidden",
  },
  modalHeader: {
    padding: "18px 20px",
    background: "#1d4ed8",
    color: "#fff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "800",
  },
  modalCloseButton: {
    border: "none",
    background: "transparent",
    color: "#fff",
    fontSize: "22px",
    cursor: "pointer",
  },
  modalBody: {
    padding: "20px",
  },
  reportInfoRow: {
    display: "grid",
    gridTemplateColumns: "120px 1fr",
    gap: "12px",
    padding: "12px 0",
    borderBottom: "1px dashed #d1d5db",
    alignItems: "start",
  },
  reportInfoLabel: {
    fontSize: "14px",
    fontWeight: "800",
    color: "#111827",
  },
  reportInfoValue: {
    fontSize: "14px",
    color: "#374151",
    wordBreak: "break-word",
    lineHeight: "1.6",
  },
  reportSection: {
    marginTop: "18px",
  },
  reportLabel: {
    marginBottom: "10px",
    fontSize: "14px",
    fontWeight: "800",
    color: "#111827",
  },
  reportReasonGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "10px 14px",
  },
  reportReasonOption: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    color: "#374151",
  },
  reportTextarea: {
    width: "100%",
    minHeight: "140px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    padding: "14px",
    fontSize: "14px",
    resize: "vertical",
    outline: "none",
    fontFamily: "inherit",
    lineHeight: "1.6",
  },
  reportGuideBox: {
    marginTop: "16px",
    padding: "14px",
    borderRadius: "12px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    fontSize: "13px",
    color: "#475569",
    lineHeight: "1.7",
  },
  modalFooter: {
    padding: "18px 20px",
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    borderTop: "1px solid #e5e7eb",
    background: "#fff",
  },
  submitReportButton: {
    padding: "10px 16px",
    borderRadius: "10px",
    border: "none",
    background: "#dc2626",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "14px",
  },
  cancelReportButton: {
    padding: "10px 16px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#374151",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "14px",
  },
};

export default CommunityPostDetailPage;