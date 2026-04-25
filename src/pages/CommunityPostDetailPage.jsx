import React, { useEffect, useMemo, useState } from "react";
import RichTextEditor from "../components/community/RichTextEditor";

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
  boardType = "stock",
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
  const [editAttachedFiles, setEditAttachedFiles] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);

  const [isLiking, setIsLiking] = useState(false);
  const [isDisliking, setIsDisliking] = useState(false);

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
        `/api/community/posts/${postId}`,
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
      await fetch(`/api/community/posts/${postId}/view`, {
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
      setEditAttachedFiles(postDetail.attachments || []);
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

  const boardBadgeText = useMemo(() => {
    if (postDetail?.isNotice) return "공지";
    if (boardType === "free") return "자유게시판";
    if (boardType === "discussion") return "토론게시판";
    return postDetail?.stockName || postDetail?.stockCode || "종목 커뮤니티";
  }, [boardType, postDetail]);

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

  const toPlainText = (html) =>
    (html || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").trim();

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

    if (postDetail?.votedByCurrentUser || postDetail?.likedByCurrentUser) {
      alert("이미 추천 또는 비추천한 게시글입니다.");
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
        `/api/community/posts/${postId}/like`,
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
        votedByCurrentUser: true,
        myVoteType: "LIKE",
      }));

      alert("추천이 반영되었습니다.");
    } catch (error) {
      console.error("추천 오류:", error);
      alert("추천 중 오류가 발생했습니다.");
    } finally {
      setIsLiking(false);
    }
  };

  const handleDislikePost = async () => {
    if (!isLoggedIn || !currentUser?.userId) {
      alert("로그인 후 비추천할 수 있습니다.");
      return;
    }

    if (isMyPost) {
      alert("본인 글은 비추천할 수 없습니다.");
      return;
    }

    if (postDetail?.votedByCurrentUser || postDetail?.likedByCurrentUser) {
      alert("이미 추천 또는 비추천한 게시글입니다.");
      return;
    }

    try {
      setIsDisliking(true);

      const token = localStorage.getItem("accessToken") || currentUser?.token;

      if (!token) {
        alert("로그인 토큰이 없습니다.");
        return;
      }

      const response = await fetch(
        `/api/community/posts/${postId}/dislike`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const text = await response.text();

      if (!response.ok) {
        alert(text || "비추천에 실패했습니다.");
        return;
      }

      setPostDetail((prev) => ({
        ...prev,
        dislikeCount: (prev?.dislikeCount || 0) + 1,
        votedByCurrentUser: true,
        myVoteType: "DISLIKE",
      }));

      alert("비추천이 반영되었습니다.");
    } catch (error) {
      console.error("비추천 오류:", error);
      alert("비추천 중 오류가 발생했습니다.");
    } finally {
      setIsDisliking(false);
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
          ? `/api/community/posts/${reportTarget.targetId}/report`
          : `/api/community/comments/${reportTarget.targetId}/report`;

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

      alert(
        reportTarget.type === "post"
          ? "게시글 신고가 접수되었습니다."
          : "댓글 신고가 접수되었습니다."
      );
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
        `/api/community/posts/${postId}/comments`,
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
    setEditAttachedFiles(postDetail?.attachments || []);
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditForm({
      title: postDetail?.title || "",
      content: postDetail?.content || "",
      isNotice: !!postDetail?.isNotice,
    });
    setEditAttachedFiles(postDetail?.attachments || []);
    setIsEditMode(false);
  };

  const uploadImage = async (file) => {
    const token = localStorage.getItem("accessToken") || currentUser?.token;
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/community/uploads/images", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
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

    try {
      setUploadingFile(true);

      const token = localStorage.getItem("accessToken") || currentUser?.token;
      const uploadedResults = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/community/uploads/files", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || `${file.name} 업로드 실패`);
        }

        uploadedResults.push(await response.json());
      }

      setEditAttachedFiles((prev) => [...prev, ...uploadedResults]);
    } catch (error) {
      console.error(error);
      alert(error.message || "파일 업로드 중 오류가 발생했습니다.");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleRemoveAttachedFile = (attachmentId) => {
    setEditAttachedFiles((prev) => prev.filter((file) => file.attachmentId !== attachmentId));
  };

  const handleUpdatePost = async () => {
    if (!editForm.title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    if (!toPlainText(editForm.content)) {
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
        `/api/community/posts/${postId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: editForm.title.trim(),
            content: editForm.content,
            isNotice: editForm.isNotice,
            attachmentIds: editAttachedFiles.map((file) => file.attachmentId),
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
        `/api/community/posts/${postId}`,
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
      onBack?.();
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
        `/api/community/comments/${commentId}`,
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
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">게시글을 불러오는 중입니다...</div>
      </div>
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
          <div style={styles.detailTopBar}>
            <div style={styles.stockBadgeWrap}>
              <span style={styles.stockBadge}>{boardBadgeText}</span>
              {postDetail.isNotice && <span style={styles.noticeBadge}>공지</span>}
            </div>

            {canReportPost && !isEditMode && (
              <button
                type="button"
                onClick={openPostReportModal}
                style={styles.reportButtonTop}
              >
                신고
              </button>
            )}
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
                <span>비추천 {postDetail.dislikeCount ?? 0}</span>
              </div>

              <RichTextEditor
                value={editForm.content}
                onChange={(html) =>
                  setEditForm((prev) => ({
                    ...prev,
                    content: html,
                  }))
                }
                onUploadImage={uploadImage}
                minHeight={320}
              />

              <div style={styles.attachSection}>
                <div style={styles.attachHeader}>
                  <strong>첨부파일</strong>
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

                {editAttachedFiles.length > 0 && (
                  <div style={styles.fileList}>
                    {editAttachedFiles.map((file) => (
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
                {postDetail.isNotice && (
                  <span style={styles.noticeTitlePrefix}>[공지] </span>
                )}
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
                <span>비추천 {postDetail.dislikeCount ?? 0}</span>
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

              <div
                style={styles.contentBox}
                dangerouslySetInnerHTML={{ __html: postDetail.content || "" }}
              />

              {Array.isArray(postDetail.attachments) && postDetail.attachments.length > 0 && (
                <div style={styles.attachSectionView}>
                  <h4 style={styles.attachTitle}>첨부파일</h4>
                  <div style={styles.fileList}>
                    {postDetail.attachments.map((file) => (
                      <a
                        key={file.attachmentId}
                        href={`${file.fileUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        style={styles.downloadLink}
                      >
                        {file.originalName}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div style={styles.votePanel}>
                <div style={styles.votePanelTitle}>이 게시글이 도움이 되었나요?</div>
                <div style={styles.votePanelSubtitle}>
                  추천과 비추천은 한 번 선택하면 취소하거나 변경할 수 없습니다.
                </div>

                <div style={styles.voteButtonRow}>
                  <button
                    type="button"
                    onClick={handleLikePost}
                    disabled={
                      !isLoggedIn ||
                      postDetail.votedByCurrentUser ||
                      postDetail.likedByCurrentUser ||
                      isLiking ||
                      isDisliking ||
                      isMyPost
                    }
                    style={{
                      ...styles.voteButton,
                      ...styles.likeVoteButton,
                      ...(postDetail.myVoteType === "LIKE" ? styles.likeVoteButtonSelected : {}),
                      ...((postDetail.votedByCurrentUser || postDetail.likedByCurrentUser || isMyPost)
                        ? styles.voteButtonDisabled
                        : {}),
                    }}
                  >
                    <span style={styles.voteIcon}>👍</span>
                    <span style={styles.voteText}>
                      {isMyPost
                        ? "내 글 추천 불가"
                        : postDetail.myVoteType === "LIKE"
                          ? "추천 완료"
                          : "추천"}
                    </span>
                    <span style={styles.voteCount}>{postDetail.likeCount ?? 0}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDislikePost}
                    disabled={
                      !isLoggedIn ||
                      postDetail.votedByCurrentUser ||
                      postDetail.likedByCurrentUser ||
                      isLiking ||
                      isDisliking ||
                      isMyPost
                    }
                    style={{
                      ...styles.voteButton,
                      ...styles.dislikeVoteButton,
                      ...(postDetail.myVoteType === "DISLIKE" ? styles.dislikeVoteButtonSelected : {}),
                      ...((postDetail.votedByCurrentUser || postDetail.likedByCurrentUser || isMyPost)
                        ? styles.voteButtonDisabled
                        : {}),
                    }}
                  >
                    <span style={styles.voteIcon}>👎</span>
                    <span style={styles.voteText}>
                      {isMyPost
                        ? "내 글 비추천 불가"
                        : postDetail.myVoteType === "DISLIKE"
                          ? "비추천 완료"
                          : "비추천"}
                    </span>
                    <span style={styles.voteCount}>{postDetail.dislikeCount ?? 0}</span>
                  </button>
                </div>

                {postDetail.votedByCurrentUser && (
                  <div style={styles.voteGuide}>
                    이미 {postDetail.myVoteType === "LIKE" ? "추천" : "비추천"}한 게시글입니다.
                  </div>
                )}
              </div>
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
                    <span style={styles.nickname}>
                      {comment.nickname}
                      {comment.userId === postDetail.userId && (
                        <span style={styles.authorBadge}>(작성자)</span>
                      )}
                    </span>
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
    maxWidth: "1440px",
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
  detailTopBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "12px",
    flexWrap: "wrap",
  },
  stockBadgeWrap: {
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
  authorBadge: {
    marginLeft: "6px",
    fontSize: "12px",
    fontWeight: "800",
    color: "#d9480f",
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
  votePanel: {
    margin: "38px auto 28px",
    padding: "8px 0 0",
    maxWidth: "560px",
    textAlign: "center",
  },
  votePanelTitle: {
    marginBottom: "6px",
    fontSize: "18px",
    fontWeight: "900",
    color: "#111827",
  },
  votePanelSubtitle: {
    marginBottom: "20px",
    fontSize: "12px",
    fontWeight: "700",
    color: "#6b7280",
  },
  voteButtonRow: {
    display: "flex",
    justifyContent: "center",
    gap: "16px",
    flexWrap: "wrap",
  },
  voteButton: {
    width: "160px",
    minHeight: "112px",
    borderRadius: "20px",
    border: "2px solid transparent",
    background: "#fff",
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
    gap: "4px",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.10)",
    transition: "all 0.18s ease",
  },
  likeVoteButton: {
    color: "#2563eb",
    borderColor: "#bfdbfe",
  },
  dislikeVoteButton: {
    color: "#dc2626",
    borderColor: "#fecaca",
  },
  likeVoteButtonSelected: {
    transform: "translateY(-3px)",
    background: "#eff6ff",
    borderColor: "#2563eb",
    boxShadow: "0 18px 34px rgba(37, 99, 235, 0.20)",
  },
  dislikeVoteButtonSelected: {
    transform: "translateY(-3px)",
    background: "#fef2f2",
    borderColor: "#dc2626",
    boxShadow: "0 18px 34px rgba(220, 38, 38, 0.18)",
  },
  voteButtonDisabled: {
    opacity: 0.78,
    cursor: "not-allowed",
  },
  voteIcon: {
    fontSize: "32px",
    lineHeight: 1,
  },
  voteText: {
    fontSize: "14px",
    fontWeight: "900",
  },
  voteCount: {
    fontSize: "26px",
    fontWeight: "900",
    lineHeight: 1.1,
  },
  voteGuide: {
    marginTop: "16px",
    fontSize: "12px",
    fontWeight: "800",
    color: "#4b5563",
  },
  reportButtonTop: {
    padding: "8px 13px",
    borderRadius: "999px",
    border: "1px solid #fed7aa",
    background: "#fff7ed",
    color: "#c2410c",
    cursor: "pointer",
    fontWeight: "800",
    fontSize: "12px",
    flexShrink: 0,
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
  dislikeButton: {
    padding: "10px 16px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    background: "#f1f3f5",
    color: "#495057",
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
    marginTop: "16px",
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
    fontSize: "15px",
    lineHeight: "1.8",
    color: "#111827",
    minHeight: "180px",
    textAlign: "left",
    wordBreak: "break-word",
  },
  contentImage: {
    maxWidth: "100%",
    borderRadius: "12px",
  },
  attachSection: {
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "16px",
    background: "#fafafa",
    marginTop: "16px",
  },
  attachSectionView: {
    borderTop: "1px solid #f1f3f5",
    marginTop: "24px",
    paddingTop: "20px",
  },
  attachTitle: {
    margin: "0 0 12px",
    fontSize: "16px",
    fontWeight: "800",
  },
  attachHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "10px",
  },
  attachButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: "38px",
    padding: "0 14px",
    borderRadius: "10px",
    background: "#111827",
    color: "#fff",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "700",
  },
  helperText: {
    fontSize: "13px",
    color: "#6b7280",
  },
  fileList: {
    display: "grid",
    gap: "10px",
    marginTop: "10px",
  },
  fileItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "10px 12px",
  },
  fileName: {
    fontSize: "14px",
    color: "#374151",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  removeFileButton: {
    border: "none",
    background: "#fee2e2",
    color: "#b91c1c",
    borderRadius: "8px",
    padding: "6px 10px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "700",
    flexShrink: 0,
  },
  downloadLink: {
    display: "inline-flex",
    alignItems: "center",
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1px solid #dbeafe",
    background: "#f8fbff",
    color: "#1d4ed8",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "700",
  },
  commentWriteCard: {
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
  commentInput: {
    width: "100%",
    minHeight: "110px",
    borderRadius: "14px",
    border: "1px solid #d1d5db",
    padding: "14px",
    fontSize: "14px",
    resize: "vertical",
    outline: "none",
    fontFamily: "inherit",
  },
  writeActionRow: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "12px",
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
  commentListCard: {
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
    marginBottom: "12px",
  },
  postCount: {
    fontSize: "14px",
    color: "#6b7280",
    fontWeight: "700",
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
    padding: "30px 12px",
    textAlign: "center",
    color: "#6b7280",
    fontSize: "14px",
  },
  commentList: {
    display: "grid",
    gap: "12px",
  },
  commentItem: {
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "14px 16px",
    background: "#fff",
  },
  commentTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "center",
    marginBottom: "8px",
    flexWrap: "wrap",
  },
  commentTopRight: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  commentDate: {
    fontSize: "12px",
    color: "#6b7280",
  },
  commentDeleteButton: {
    border: "none",
    background: "#fee2e2",
    color: "#b91c1c",
    borderRadius: "8px",
    padding: "6px 10px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "700",
  },
  commentReportButton: {
    border: "1px solid #fed7aa",
    background: "#fff7ed",
    color: "#c2410c",
    borderRadius: "8px",
    padding: "6px 10px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "700",
  },
  commentContent: {
    fontSize: "14px",
    color: "#374151",
    lineHeight: "1.7",
    textAlign: "left",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.52)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: "20px",
  },
  modalCard: {
    width: "100%",
    maxWidth: "640px",
    background: "#fff",
    borderRadius: "18px",
    overflow: "hidden",
    boxShadow: "0 24px 60px rgba(15, 23, 42, 0.25)",
  },
  modalHeader: {
    background: "#111827",
    color: "#fff",
    padding: "18px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    margin: 0,
    fontSize: "18px",
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