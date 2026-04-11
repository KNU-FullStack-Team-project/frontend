import React, { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from "recharts";

const COLORS = [
  "#aa3bff", // 메인 액센트 (보라)
  "#3b82f6", // 블루
  "#10b981", // 그린
  "#f59e0b", // 오렌지
  "#ef4444", // 레드
  "#ec4899", // 핑크
  "#06b6d4", // 시안
  "#8b5cf6", // 바이올렛
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="chart-tooltip">
        <p className="tooltip-label">{data.name}</p>
        <div className="divider" style={{ margin: "8px 0" }}></div>
        <p className="tooltip-value">{data.formattedValue}</p>
        <p className="tooltip-percent" style={{ fontSize: "12px", opacity: 0.7, marginTop: "4px" }}>
            비중: {data.percent ? data.percent.toFixed(1) : 0}%
        </p>
      </div>
    );
  }
  return null;
};

const PortfolioChart = ({ holdings }) => {
  const chartData = useMemo(() => {
    if (!holdings || holdings.length === 0) return [];

    // 데이터에서 숫자를 안전하게 추출하는 헬퍼 함수
    const getNumericValue = (item) => {
      let val = 0;
      if (item.holdingValueRaw !== undefined && item.holdingValueRaw !== null) {
        val = Number(item.holdingValueRaw);
      } else if (item.holdingValue) {
        // 모든 기호 제거 후 숫자만 추출
        const cleanStr = String(item.holdingValue).replace(/[^0-9.]/g, "");
        val = parseFloat(cleanStr) || 0;
      }
      return isNaN(val) ? 0 : val;
    };

    // 1. 전체 보유 가치 기준으로 내림차순 정렬 (순수 숫자 기준)
    const sortedHoldings = [...holdings].sort((a, b) => {
      return getNumericValue(b) - getNumericValue(a);
    });

    // 2. 상위 5개는 그대로 유지, 나머지는 '기타'로 합산
    const topCount = 5;
    let processedData = sortedHoldings.slice(0, topCount).map(item => ({
      name: item.stockName,
      value: getNumericValue(item),
      formattedValue: item.holdingValue
    }));

    if (sortedHoldings.length > topCount) {
      const otherValue = sortedHoldings.slice(topCount).reduce((acc, item) => {
        return acc + getNumericValue(item);
      }, 0);

      if (otherValue > 0) {
        processedData.push({
          name: "기타",
          value: otherValue,
          formattedValue: `₩${otherValue.toLocaleString()}`
        });
      }
    }

    // 3. 비중 계산을 위한 전체 합계
    const total = processedData.reduce((acc, curr) => acc + curr.value, 0);

    // 4. 최종 정렬 (비중 순서로 다시 한번 확실하게 정렬)
    return processedData
      .map(item => ({
        ...item,
        percent: total > 0 ? (item.value / total) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value); 
  }, [holdings]);

  if (chartData.length === 0) {
    return (
      <div className="empty-chart-container" style={{ height: "300px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed var(--border)", borderRadius: "12px" }}>
        <p>보유 중인 주식이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="portfolio-chart-wrapper">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={5}
            dataKey="value"
            animationBegin={0}
            animationDuration={800}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]} 
                stroke="none"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* 커스텀 범례 섹션: 배열 순서대로 수동으로 렌더링하여 순서 100% 보장 */}
      <div className="custom-chart-legend">
        {chartData.map((item, index) => (
          <div key={`legend-${index}`} className="legend-item">
            <span 
              className="legend-color" 
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            ></span>
            <span className="legend-name">{item.name}</span>
            <span className="legend-percent">{item.percent.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PortfolioChart;
