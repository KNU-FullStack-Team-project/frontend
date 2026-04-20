import React, { useState } from "react";
import Modal from "../../common/Modal";
import AppButton from "../../common/AppButton";
import "./InquiryModal.css";

const CATEGORIES = [
  "계정/로그인",
  "투자 기능 문의",
  "시세/데이터 오류",
  "이용 방법 문의",
  "버그 제보",
  "기능 개선 요청",
  "운영/제재 문의",
  "기타"
];

const InquiryModal = ({ isOpen, onClose, isAdmin = false, refreshInquiryCount }) => {
  const [viewMode, setViewMode] = useState("list"); // "list", "write", "detail"
  const [inquiries, setInquiries] = useState([]);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [category, setCategory] = useState(CATEGORIES[0]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [replyContent, setReplyContent] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  // 문의 읽음 처리 API 호출
  const markAsRead = async (inquiryId) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`/api/inquiries/${inquiryId}/read`, {
        method: "POST",
        headers: {
          "Authorization": token ? `Bearer ${token}` : ""
        }
      });
      if (response.ok) {
        if (refreshInquiryCount) refreshInquiryCount();
      }
    } catch (error) {
      console.error("Failed to mark inquiry as read:", error);
    }
  };

  // 문의 내역 가져오기
  const fetchInquiries = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      // 관리자인 경우 전체 목록, 일반 사용자인 경우 본인 목록 호출
      const url = isAdmin
        ? "/api/inquiries/all"
        : "/api/inquiries/my";

      const response = await fetch(url, {
        headers: {
          "Authorization": token ? `Bearer ${token}` : ""
        }
      });
      if (response.ok) {
        const data = await response.json();
        setInquiries(data);
      }
    } catch (error) {
      console.error("Failed to fetch inquiries:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 모달이 열리면 리스트 뷰로 초기화하고 내역을 불러옴
  React.useEffect(() => {
    if (isOpen) {
      setViewMode("list");
      fetchInquiries();
    }
  }, [isOpen, isAdmin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 모두 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({ category, title, content }),
      });

      if (response.ok) {
        alert("문의가 정상적으로 접수되었습니다.");
        setTitle("");
        setContent("");
        setViewMode("list"); // 목록으로 복귀
        fetchInquiries();   // 새로고침
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.message || "문의 접수 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("Inquiry submission error:", error);
      alert("서버와 통신 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplySubmit = async () => {
    if (!replyContent.trim()) {
      alert("답변 내용을 입력해주세요.");
      return;
    }

    setIsReplying(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`/api/inquiries/${selectedInquiry.inquiryId}/reply`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({ answer: replyContent }),
      });

      if (response.ok) {
        alert("답변이 정상적으로 등록되었습니다.");
        setReplyContent("");
        setViewMode("list");
        fetchInquiries(); // 목록 새로고침
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.message || "답변 등록 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("Reply submission error:", error);
      alert("서버와 통신 중 오류가 발생했습니다.");
    } finally {
      setIsReplying(false);
    }
  };

  const handleRowClick = (item) => {
    setSelectedInquiry(item);
    setReplyContent(item.answer || ""); // 기존 답변이 있으면 세팅
    setViewMode("detail");

    // 일반 사용자이고 아직 읽지 않은 답변이 있는 경우 읽음 처리
    if (!isAdmin && !item.isReadByUser) {
      markAsRead(item.inquiryId);
      // 로컬 상태에서도 즉시 반영 (다시 목록으로 왔을 때 점이 사라지게 함)
      setInquiries(prev => prev.map(inv =>
        inv.inquiryId === item.inquiryId ? { ...inv, isReadByUser: true } : inv
      ));
    }
  };

  const renderDetailView = () => {
    if (!selectedInquiry) return null;

    return (
      <div className="inquiry-detail-container">
        <div className="inquiry-form-header">
          <button
            type="button"
            className="back-to-list"
            onClick={() => setViewMode("list")}
          >
            ← 목록으로
          </button>
          <h3>문의 상세 내용</h3>
        </div>

        <div className="detail-category-line">
          카테고리: <strong>{selectedInquiry.category}</strong>
        </div>

        <div className="detail-group">
          <div className="detail-value-title">{selectedInquiry.title}</div>
        </div>

        <div className="detail-group">
          <label>문의 내용</label>
          <div className="detail-value-content">
            {selectedInquiry.content}
          </div>
        </div>

        <div className="detail-date-line">
          작성 일시: {new Date(selectedInquiry.createdAt).toLocaleString("ko-KR")}
          {isAdmin && selectedInquiry.nickname && ` | 작성자: ${selectedInquiry.nickname}`}
        </div>

        {/* 답변 내용 영역 */}
        {(selectedInquiry.answer || isAdmin) && (
          <div className="detail-group reply-section">
            <label>관리자 답변</label>
            {selectedInquiry.answer ? (
              <div className="detail-value-answer">
                {selectedInquiry.answer}
                {selectedInquiry.answeredAt && (
                  <span className="answer-date">
                    ({new Date(selectedInquiry.answeredAt).toLocaleString("ko-KR")})
                  </span>
                )}
              </div>
            ) : isAdmin && (
              <div className="admin-reply-form">
                <textarea
                  placeholder="답변 내용을 작성하세요..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  disabled={isReplying}
                  rows={5}
                />
                <div className="reply-actions">
                  <AppButton
                    variant="primary"
                    fullWidth
                    onClick={handleReplySubmit}
                    disabled={isReplying}
                  >
                    {isReplying ? "등록 중..." : "답변 등록하기"}
                  </AppButton>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="detail-footer">
          <AppButton variant="secondary" fullWidth onClick={() => setViewMode("list")}>
            목록으로 돌아가기
          </AppButton>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (viewMode === "list") {
      return (
        <div className="inquiry-list-container">
          <div className="inquiry-list-header">
            <p className="inquiry-list-count">전체 <strong>{inquiries.length}</strong>건</p>
            {!isAdmin && (
              <AppButton
                variant="primary"
                size="small"
                onClick={() => setViewMode("write")}
              >
                + 새 문의하기
              </AppButton>
            )}
          </div>

          <div className="inquiry-scroll-area">
            {isLoading ? (
              <div className="inquiry-loading">내역을 불러오는 중...</div>
            ) : inquiries.length === 0 ? (
              <div className="inquiry-empty">
                <p>작성한 문의 내역이 없습니다.</p>
                <p className="empty-sub">궁금한 점이 있다면 언제든 문의해주세요!</p>
              </div>
            ) : (
              <div className="inquiry-list-table">
                <div className="inquiry-table-header">
                  <span className="col-category">카테고리</span>
                  <span className="col-title">제목</span>
                  <span className="col-status">상태</span>
                </div>
                <div className="inquiry-items">
                  {inquiries.map((item) => (
                    <div
                      key={item.inquiryId}
                      className={`inquiry-row ${!isAdmin && !item.isReadByUser ? 'is-unread' : ''}`}
                      onClick={() => handleRowClick(item)}
                      style={{ cursor: "pointer" }}
                    >
                      <span className="inquiry-category-tag">{item.category}</span>
                      <span className="inquiry-title-text" title={item.title}>
                        {item.title}
                        {!isAdmin && !item.isReadByUser && <span className="unread-dot"></span>}
                      </span>
                      <span className={`inquiry-status-badge ${item.status === 'OPEN' ? 'status-open' : 'status-closed'}`}>
                        {item.status === 'OPEN' ? '답변대기' : '답변완료'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="inquiry-footer">
            <AppButton variant="secondary" fullWidth onClick={onClose}>
              닫기
            </AppButton>
          </div>
        </div>
      );
    }

    if (viewMode === "detail") {
      return renderDetailView();
    }

    return (
      <form className="inquiry-form" onSubmit={handleSubmit}>
        <div className="inquiry-form-header">
          <button
            type="button"
            className="back-to-list"
            onClick={() => setViewMode("list")}
          >
            ← 목록으로
          </button>
          <h3>1:1 문의 작성</h3>
        </div>

        <div className="form-group">
          <label htmlFor="category">문의 카테고리</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={isSubmitting}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="title">제목</label>
          <input
            id="title"
            type="text"
            placeholder="제목을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            disabled={isSubmitting}
          />
        </div>

        <div className="form-group">
          <label htmlFor="content">문의 내용</label>
          <textarea
            id="content"
            placeholder="문의하실 내용을 상세히 적어주세요. (최대 600자 내외)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={1800}
            rows={8}
            disabled={isSubmitting}
          />
          <div className="char-count">
            {content.length} / 1800
          </div>
        </div>

        <div className="modal-actions">
          <AppButton
            type="button"
            variant="secondary"
            onClick={() => setViewMode("list")}
            disabled={isSubmitting}
          >
            취소
          </AppButton>
          <AppButton
            type="submit"
            variant="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "문의 중..." : "문의하기"}
          </AppButton>
        </div>
      </form>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={viewMode === "list" ? "나의 문의 센터" : "1:1 문의 작성"}>
      {renderContent()}
    </Modal>
  );
};

export default InquiryModal;
