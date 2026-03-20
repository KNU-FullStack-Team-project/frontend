import React from "react";

const ContestPage = () => {
  return (
    <div className="content-card">
      <h3>대회 페이지</h3>
      <p className="page-desc">
        모의투자 대회 목록, 랭킹, 참가 신청 기능이 들어갈 영역입니다.
      </p>

      <div className="contest-box">
        <div className="contest-item">
          <h4>2026 봄 모의투자 대회</h4>
          <p>기간: 2026.03.20 ~ 2026.04.20</p>
        </div>
        <div className="contest-item">
          <h4>대학생 투자 랭킹전</h4>
          <p>기간: 2026.04.01 ~ 2026.05.01</p>
        </div>
      </div>
    </div>
  );
};

export default ContestPage;
