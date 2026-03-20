import React from "react";
import AppButton from "../common/AppButton";
import InfoCard from "../common/InfoCard";
import SectionTitle from "../common/SectionTitle";

const HomePage = ({ isLoggedIn, onOpenLogin }) => {
  if (!isLoggedIn) {
    return (
      <div className="landing-page">
        <section className="landing-hero">
          <div className="landing-badge">Mock Invest</div>
          <h1 className="landing-title">가볍게 시작하는 모의투자</h1>
          <p className="landing-description">
            실제 돈 없이 투자 감각을 익히고, 다양한 전략을 연습해보세요.
          </p>
          <div className="landing-actions">
            <AppButton variant="primary" onClick={onOpenLogin}>
              로그인하고 시작하기
            </AppButton>
          </div>
        </section>

        <section className="landing-section">
          <SectionTitle>서비스 소개</SectionTitle>
          <div className="stock-grid">
            <div className="mini-stock-card">
              <h4>모의 매매</h4>
              <p>실전처럼 사고 팔며 투자 흐름을 익혀보세요.</p>
            </div>
            <div className="mini-stock-card">
              <h4>대회 참여</h4>
              <p>다른 사용자와 수익률을 비교하며 경쟁해보세요.</p>
            </div>
            <div className="mini-stock-card">
              <h4>포트폴리오 확인</h4>
              <p>내 투자 결과를 한눈에 정리해서 볼 수 있습니다.</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="dashboard-grid">
      <InfoCard title="총 자산" value="₩12,450,000" />
      <InfoCard title="보유 현금" value="₩4,800,000" />
      <InfoCard title="평가 손익" value="+₩350,000" valueClassName="up" />
      <InfoCard title="수익률" value="+2.89%" valueClassName="up" />

      <div className="content-card large">
        <SectionTitle>관심 종목</SectionTitle>
        <ul className="stock-list">
          <li>
            <span>삼성전자</span>
            <strong className="up">+1.42%</strong>
          </li>
          <li>
            <span>SK하이닉스</span>
            <strong className="up">+2.31%</strong>
          </li>
          <li>
            <span>NAVER</span>
            <strong className="down">-0.82%</strong>
          </li>
          <li>
            <span>카카오</span>
            <strong className="up">+0.56%</strong>
          </li>
        </ul>
      </div>

      <div className="content-card large">
        <SectionTitle>보유 종목</SectionTitle>
        <table className="stock-table">
          <thead>
            <tr>
              <th>종목명</th>
              <th>보유수량</th>
              <th>평균단가</th>
              <th>현재가</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>삼성전자</td>
              <td>15주</td>
              <td>71,200원</td>
              <td>72,300원</td>
            </tr>
            <tr>
              <td>현대차</td>
              <td>5주</td>
              <td>242,000원</td>
              <td>247,000원</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HomePage;
