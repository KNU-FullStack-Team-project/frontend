import React from "react";

const CandleChart = ({ data, width = 760, height = 300 }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", color: "#888" }}>
        차트 데이터를 불러올 수 없습니다.
      </div>
    );
  }

  // KIS 데이터는 최신순(내림차순)이므로 차트 렌더링을 위해 시간순(오름차순)으로 반환
  const sortedData = [...data].reverse();

  const margin = { top: 20, right: 30, bottom: 30, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // 가격 범위 계산
  const prices = sortedData.flatMap((d) => [
    parseFloat(d.high),
    parseFloat(d.low),
    parseFloat(d.open),
    parseFloat(d.close),
  ]);
  const minPrice = Math.min(...prices) * 0.99; // 아래여백 1%
  const maxPrice = Math.max(...prices) * 1.01; // 위여백 1%
  const priceRange = maxPrice - minPrice;

  // Y좌표 계산 함수
  const getY = (price) => {
    return chartHeight - ((price - minPrice) / priceRange) * chartHeight + margin.top;
  };

  const candleWidth = chartWidth / sortedData.length;

  return (
    <div className="candle-chart-wrapper" style={{ overflowX: "auto" }}>
      <svg width={width} height={height}>
        {/* 그리드 라인 */}
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
          const price = minPrice + p * priceRange;
          const y = getY(price);
          return (
            <React.Fragment key={i}>
              <line
                x1={margin.left}
                y1={y}
                x2={width - margin.right}
                y2={y}
                stroke="#e5e7eb"
                strokeDasharray="4"
              />
              <text
                x={margin.left - 10}
                y={y}
                textAnchor="end"
                fontSize="11"
                fill="#9ca3af"
                alignmentBaseline="middle"
              >
                {Math.round(price).toLocaleString()}
              </text>
            </React.Fragment>
          );
        })}

        {/* 캔들 그리기 */}
        {sortedData.map((d, i) => {
          const x = margin.left + i * candleWidth;
          const open = parseFloat(d.open);
          const close = parseFloat(d.close);
          const high = parseFloat(d.high);
          const low = parseFloat(d.low);
          
          const isUp = close >= open;
          const color = isUp ? "#f43f5e" : "#3b82f6"; // red-500 : blue-500
          
          const yOpen = getY(open);
          const yClose = getY(close);
          const yHigh = getY(high);
          const yLow = getY(low);

          return (
            <g key={i}>
              {/* 심지 (Wick) */}
              <line
                x1={x + candleWidth / 2}
                y1={yHigh}
                x2={x + candleWidth / 2}
                y2={yLow}
                stroke={color}
                strokeWidth="1.5"
              />
              {/* 몸통 (Body) */}
              <rect
                x={x + candleWidth * 0.15}
                y={Math.min(yOpen, yClose)}
                width={Math.max(1, candleWidth * 0.7)}
                height={Math.max(1, Math.abs(yOpen - yClose))}
                fill={color}
              />
            </g>
          );
        })}

        {/* X축 (일자 표시 - 간단하게 5개 정도만) */}
        {sortedData.filter((_, idx) => idx % Math.floor(sortedData.length / 4) === 0).map((d, i) => {
            const idx = sortedData.indexOf(d);
            const x = margin.left + idx * candleWidth;
            return (
                <text
                    key={i}
                    x={x + candleWidth / 2}
                    y={height - 5}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#9ca3af"
                >
                    {d.date.substring(4,6)}/{d.date.substring(6,8)}
                </text>
            );
        })}
      </svg>
    </div>
  );
};

export default CandleChart;
