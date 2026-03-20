import React from "react";

const StockPage = () => {
  return (
    <div className="content-card">
      <h3>주식 페이지</h3>
      <p className="page-desc">
        종목 검색, 시세 확인, 매수/매도 UI가 들어갈 영역입니다.
      </p>

      <div className="stock-grid">
        <div className="mini-stock-card">
          <h4>삼성전자</h4>
          <p>72,300원</p>
          <span className="up">+1.42%</span>
        </div>
        <div className="mini-stock-card">
          <h4>SK하이닉스</h4>
          <p>188,000원</p>
          <span className="up">+2.31%</span>
        </div>
        <div className="mini-stock-card">
          <h4>NAVER</h4>
          <p>205,000원</p>
          <span className="down">-0.82%</span>
        </div>
      </div>
    </div>
  );
};

export default StockPage;
