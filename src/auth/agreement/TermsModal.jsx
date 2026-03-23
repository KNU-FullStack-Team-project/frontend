import React from "react";
import AppButton from "../../common/AppButton";

const TermsModal = ({ open, title, content, onClose, onAgree }) => {
  if (!open) return null;

  return (
    <div className="terms-modal-overlay" onClick={onClose}>
      <div className="terms-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="terms-modal-header">
          <h3>{title}</h3>
          <button
            type="button"
            className="terms-modal-close"
            onClick={onClose}
            aria-label="약관 팝업 닫기"
          >
            ×
          </button>
        </div>

        <div className="terms-modal-body">
          <pre className="terms-modal-text">{content}</pre>
        </div>

        <div className="terms-modal-footer">
          <AppButton variant="danger" onClick={onClose}>
            닫기
          </AppButton>
          <AppButton onClick={onAgree}>동의하고 체크하기</AppButton>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;
