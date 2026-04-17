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

const InquiryModal = ({ isOpen, onClose }) => {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 모두 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("accessToken"); // Assuming JWT token is stored here
      const response = await fetch("http://localhost:8081/api/inquiries", {
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
        onClose();
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="1:1 문의하기">
      <form className="inquiry-form" onSubmit={handleSubmit}>
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
            maxLength={1800} // Stay safe within VARCHAR2(2000)
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
            onClick={onClose}
            disabled={isSubmitting}
          >
            취소
          </AppButton>
          <AppButton 
            type="submit" 
            variant="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "전송 중..." : "전송하기"}
          </AppButton>
        </div>
      </form>
    </Modal>
  );
};

export default InquiryModal;
