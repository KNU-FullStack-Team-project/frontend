import React from "react";
import ContestCard from "../common/ContestCard";

import contest1 from "../assets/contest1.jpg";
import contest2 from "../assets/contest2.jpg";
import contest3 from "../assets/contest3.jpg";
import contest4 from "../assets/contest4.jpg";

const contestList = [
  {
    image: contest1,
    category: "COMPETITION",
    title: "초보 투자 수익률 챌린지",
    description: "가상 자산으로 수익률을 겨루며 투자 감각을 익혀보세요.",
    teams: 12337,
    tag: "Beginner",
    status: "Ongoing",
  },
  {
    image: contest2,
    category: "COMPETITION",
    title: "가치주 발굴 모의투자 대회",
    description: "저평가 종목을 찾고 장기 투자 전략을 연습해보세요.",
    teams: 4177,
    tag: "Value Investing",
    status: "Ongoing",
  },
  {
    image: contest3,
    category: "COMPETITION",
    title: "단기 매매 트레이딩 리그",
    description: "짧은 기간 안에 시장 흐름을 읽고 빠르게 대응해보세요.",
    teams: 2017,
    tag: "Trading",
    status: "Ongoing",
  },
  {
    image: contest4,
    category: "COMPETITION",
    title: "AI 추천 종목 챌린지",
    description: "추천 종목 데이터를 참고해 나만의 포트폴리오를 구성해보세요.",
    teams: 215,
    tag: "AI Strategy",
    status: "Ongoing",
  },
];

const ContestPage = () => {
  return (
    <section>
      <p className="page-desc">
        다양한 모의투자 대회에 참여하고 다른 사용자들과 수익률을 비교해보세요.
      </p>

      <div className="contest-card-grid">
        {contestList.map((contest, index) => (
          <ContestCard
            key={index}
            image={contest.image}
            category={contest.category}
            title={contest.title}
            description={contest.description}
            teams={contest.teams}
            tag={contest.tag}
            status={contest.status}
          />
        ))}
      </div>
    </section>
  );
};

export default ContestPage;
