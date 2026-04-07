import React from "react";

const TermsSection = ({
  agreeAll,
  agreeService,
  agreePrivacy,
  agreeMarketing,
  onAgreeAllChange,
  onToggleService,
  onTogglePrivacy,
  onToggleMarketing,
  onOpenServiceTerms,
  onOpenPrivacyTerms,
  onOpenMarketingTerms,
}) => {
  return (
    <div className="terms-box">
      <label className="terms-row">
        <input type="checkbox" checked={agreeAll} onChange={onAgreeAllChange} />
        <span>전체 동의</span>
      </label>

      <label className="terms-row">
        <input
          type="checkbox"
          checked={agreeService}
          onChange={onToggleService}
        />
        <button
          type="button"
          className="terms-link-button"
          onClick={onOpenServiceTerms}
        >
          [필수] 서비스 이용약관 동의
        </button>
      </label>

      <label className="terms-row">
        <input
          type="checkbox"
          checked={agreePrivacy}
          onChange={onTogglePrivacy}
        />
        <button
          type="button"
          className="terms-link-button"
          onClick={onOpenPrivacyTerms}
        >
          [필수] 개인정보 처리방침 동의
        </button>
      </label>

      <label className="terms-row">
        <input
          type="checkbox"
          checked={agreeMarketing}
          onChange={onToggleMarketing}
        />
        <button
          type="button"
          className="terms-link-button"
          onClick={onOpenMarketingTerms}
        >
          [선택] 마케팅 정보 수신 동의
        </button>
      </label>
    </div>
  );
};

export default TermsSection;
