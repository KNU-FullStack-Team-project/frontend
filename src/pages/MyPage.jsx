import React from "react";

const MyPage = () => {
  return (
    <div className="content-card">
      <h3>마이페이지</h3>
      <p className="page-desc">
        내 정보, 투자 내역, 관심 종목, 프로필 수정 영역입니다.
      </p>

      <div className="mypage-info">
        <div className="mypage-row">
          <span>닉네임</span>
          <strong>강원준</strong>
        </div>
        <div className="mypage-row">
          <span>이메일</span>
          <strong>test@email.com</strong>
        </div>
        <div className="mypage-row">
          <span>가입일</span>
          <strong>2026-03-18</strong>
        </div>
      </div>
    </div>
  );
};

export default MyPage;
