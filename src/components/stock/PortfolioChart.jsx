import React, { useMemo, useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Sector
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

// 활성 섹션(Hover시) 렌더링 함수 - 각지게(cornerRadius: 0) 수정
const renderActiveShape = (props) => {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    percent,
  } = props;

  return (
    <g>
      {/* 중앙 텍스트 표시 */}
      <text x={cx} y={cy - 10} dy={8} textAnchor="middle" fill="#0f172a" style={{ fontSize: "16px", fontWeight: "800" }}>
        {payload.name}
      </text>
      <text x={cx} y={cy + 15} dy={8} textAnchor="middle" fill="#64748b" style={{ fontSize: "14px", fontWeight: "600" }}>
        {`${percent.toFixed(1)}%`}
      </text>
      
      {/* 섹터 강조 (살짝 더 크게) */}
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        cornerRadius={0}
      />
      {/* 바깥쪽 테두리 효과 */}
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 12}
        outerRadius={outerRadius + 15}
        fill={fill}
        opacity={0.3}
        cornerRadius={0}
      />
    </g>
  );
};

const PortfolioChart = ({ holdings }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [sweepProgress, setSweepProgress] = useState(0); // 0 to 1

  const chartData = useMemo(() => {
    if (!holdings || holdings.length === 0) return [];

    const getNumericValue = (item) => {
      let val = 0;
      if (item.holdingValueRaw !== undefined && item.holdingValueRaw !== null) {
        val = Number(item.holdingValueRaw);
      } else if (item.holdingValue) {
        const cleanStr = String(item.holdingValue).replace(/[^0-9.]/g, "");
        val = parseFloat(cleanStr) || 0;
      }
      return isNaN(val) ? 0 : val;
    };

    const sortedHoldings = [...holdings].sort((a, b) => {
      return getNumericValue(b) - getNumericValue(a);
    });

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

    const total = processedData.reduce((acc, curr) => acc + curr.value, 0);

    return processedData
      .map(item => ({
        ...item,
        percent: total > 0 ? (item.value / total) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value); 
  }, [holdings]);

  // 고성능 수동 스윕 애니메이션 (0.0 -> 1.0)
  useEffect(() => {
    let animationFrame;
    let startTime;
    const duration = 1800; // 전체 원이 그려지는 시간 (1.8초)

    const animate = (time) => {
      if (!startTime) startTime = time;
      const progress = Math.min((time - startTime) / duration, 1);
      
      // 약간의 가속도 효과 (easeOutQuart)
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      setSweepProgress(easeProgress);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    setSweepProgress(0);
    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <div className="empty-chart-container" style={{ height: "300px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed var(--border)", borderRadius: "12px" }}>
        <p>보유 중인 주식이 없습니다.</p>
      </div>
    );
  }

  const totalValue = chartData.reduce((acc, curr) => acc + curr.value, 0);
  const currentTotalAngle = sweepProgress * 360; // 0 to 360

  return (
    <div className="portfolio-chart-wrapper" key={chartData.map(d => d.name).join("-")}>
      <ResponsiveContainer width="100%" height={360}>
        <PieChart>
          {chartData.map((entry, index) => {
            let startAccumulator = 0;
            for (let i = 0; i < index; i++) {
              startAccumulator += (chartData[i].value / totalValue) * 360;
            }
            
            // 현재 스윕 각도(시계 바늘 위치)가 이 조각의 시작점보다 뒤에 있을 때만 렌더링 시작
            if (currentTotalAngle < startAccumulator) return null;

            const fullAngleSize = (entry.value / totalValue) * 360;
            // 이 조각이 현재 스윕 범위 내에서 어디까지 그려져야 하는지 계산
            const visibleAngleSize = Math.min(fullAngleSize, currentTotalAngle - startAccumulator);
            
            const startAngle = 90 - startAccumulator;
            const endAngle = 90 - startAccumulator - visibleAngleSize;

            return (
              <Pie
                key={`pie-${index}`}
                activeIndex={activeIndex === index ? 0 : -1}
                activeShape={renderActiveShape}
                data={[entry]}
                cx="50%"
                cy="50%"
                innerRadius={90}
                outerRadius={125}
                startAngle={startAngle}
                endAngle={endAngle} // 실시간으로 변하는 끝 각도
                paddingAngle={0}
                dataKey="value"
                onMouseEnter={() => setActiveIndex(index)}
                isAnimationActive={false} // 수동 애니메이션이므로 Recharts 기본 애니메이션은 끔
                cornerRadius={0}
                stroke="none"
              >
                <Cell fill={COLORS[index % COLORS.length]} style={{ cursor: "pointer", outline: "none" }} />
              </Pie>
            );
          })}
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      <div className="custom-chart-legend" style={{ marginTop: "30px" }}>
        {chartData.map((item, index) => {
          let startAccumulator = 0;
          for (let i = 0; i < index; i++) {
            startAccumulator += (chartData[i].value / totalValue) * 360;
          }
          const isVisible = currentTotalAngle >= startAccumulator;

          return (
            <div 
              key={`legend-${index}`} 
              className={`legend-item ${activeIndex === index ? "active" : ""}`}
              onMouseEnter={() => isVisible && setActiveIndex(index)}
              style={{ 
                cursor: "pointer", 
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                transform: activeIndex === index ? "scale(1.08) translateY(-2px)" : "scale(1)",
                opacity: isVisible ? (activeIndex === index ? 1 : 0.7) : 0,
                visibility: isVisible ? "visible" : "hidden",
                pointerEvents: isVisible ? "auto" : "none"
              }}
            >
              <span 
                className="legend-color" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              ></span>
              <span className="legend-name" style={{ fontWeight: activeIndex === index ? "800" : "500" }}>{item.name}</span>
              <span className="legend-percent">{item.percent.toFixed(1)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PortfolioChart;
