import React from "react";
import OrderHistory from "../components/stock/OrderHistory";

const MyPage = ({ user }) => {
  // 계좌 ID를 유저 ID와 동일하다고 가정 (실제 프로덕션에서는 계좌 조회 API 필요 가능)
  const accountId = user?.id || 1;

  return (
    <div className="mypage-container">
      <div className="content-card">
        <h3>마이페이지</h3>
        <p className="page-desc">
          내 정보, 투자 내역, 관심 종목, 프로필 수정 영역입니다.
        </p>

        <div className="mypage-info">
          <div className="mypage-row">
            <span>닉네임</span>
            <strong>{user?.nickname || "강원준"}</strong>
          </div>
          <div className="mypage-row">
            <span>이메일</span>
            <strong>{user?.email || "test@email.com"}</strong>
          </div>
          <div className="mypage-row">
            <span>가입일</span>
            <strong>2026-03-18</strong>
          </div>
        </div>
      </div>

      {/* 주문 내역 컴포넌트 */}
      <OrderHistory accountId={accountId} />
    </div>
  );
};

export default MyPage;
