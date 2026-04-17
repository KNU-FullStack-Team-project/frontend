import React, { useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Sector,
} from "recharts";

const COLORS = [
  "#aa3bff",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#06b6d4",
  "#8b5cf6",
];

const CHART_ENTRANCE_ANIMATION = "portfolio-chart-spin-in 850ms cubic-bezier(0.22, 1, 0.36, 1)";

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;

    return (
      <div className="chart-tooltip">
        <p className="tooltip-label">{data.name}</p>
        <div className="divider" style={{ margin: "8px 0" }}></div>
        <p className="tooltip-value">{data.formattedValue}</p>
        <p
          className="tooltip-percent"
          style={{ fontSize: "12px", opacity: 0.7, marginTop: "4px" }}
        >
          비중: {data.percent ? data.percent.toFixed(1) : 0}%
        </p>
      </div>
    );
  }

  return null;
};

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
      <text
        x={cx}
        y={cy - 10}
        dy={8}
        textAnchor="middle"
        fill="#0f172a"
        style={{ fontSize: "16px", fontWeight: "800" }}
      >
        {payload.name}
      </text>
      <text
        x={cx}
        y={cy + 15}
        dy={8}
        textAnchor="middle"
        fill="#64748b"
        style={{ fontSize: "14px", fontWeight: "600" }}
      >
        {`${percent.toFixed(1)}%`}
      </text>

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
  const [activeIndex, setActiveIndex] = useState(-1);

  const chartData = useMemo(() => {
    if (!holdings || holdings.length === 0) return [];

    const getNumericValue = (item) => {
      let value = 0;

      if (item.holdingValueRaw !== undefined && item.holdingValueRaw !== null) {
        value = Number(item.holdingValueRaw);
      } else if (item.holdingValue) {
        const cleanStr = String(item.holdingValue).replace(/[^0-9.]/g, "");
        value = parseFloat(cleanStr) || 0;
      }

      return Number.isNaN(value) ? 0 : value;
    };

    const sortedHoldings = [...holdings].sort(
      (a, b) => getNumericValue(b) - getNumericValue(a)
    );

    const topCount = 5;
    const processedData = sortedHoldings.slice(0, topCount).map((item) => ({
      name: item.stockName,
      value: getNumericValue(item),
      formattedValue: item.holdingValue,
    }));

    if (sortedHoldings.length > topCount) {
      const otherValue = sortedHoldings
        .slice(topCount)
        .reduce((acc, item) => acc + getNumericValue(item), 0);

      if (otherValue > 0) {
        processedData.push({
          name: "기타",
          value: otherValue,
          formattedValue: `₩${otherValue.toLocaleString()}`,
        });
      }
    }

    const total = processedData.reduce((acc, curr) => acc + curr.value, 0);

    return processedData
      .map((item) => ({
        ...item,
        percent: total > 0 ? (item.value / total) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [holdings]);

  if (chartData.length === 0) {
    return (
      <div
        className="empty-chart-container"
        style={{
          height: "300px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px dashed var(--border)",
          borderRadius: "12px",
        }}
      >
        <p>보유 중인 주식이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="portfolio-chart-wrapper">
      <style>
        {`
          @keyframes portfolio-chart-spin-in {
            0% {
              opacity: 0;
              transform: translateZ(0) rotate(-18deg) scale(0.96);
            }
            100% {
              opacity: 1;
              transform: translateZ(0) rotate(0deg) scale(1);
            }
          }
        `}
      </style>
      <ResponsiveContainer width="100%" height={360}>
        <div
          key={chartData.map((item) => item.name).join("-")}
          style={{
            width: "100%",
            height: "100%",
            opacity: 1,
            transform: "translateZ(0) rotate(0deg) scale(1)",
            transformOrigin: "50% 50%",
            animation: CHART_ENTRANCE_ANIMATION,
            willChange: "transform, opacity",
            backfaceVisibility: "hidden",
            perspective: "1000px",
          }}
        >
          <PieChart>
            <Pie
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={90}
              outerRadius={125}
              startAngle={90}
              endAngle={-270}
              paddingAngle={0}
              dataKey="value"
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(-1)}
              isAnimationActive={false}
              cornerRadius={0}
              stroke="none"
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  style={{ cursor: "pointer", outline: "none" }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </div>
      </ResponsiveContainer>

      <div className="custom-chart-legend" style={{ marginTop: "30px" }}>
        {chartData.map((item, index) => (
          <div
            key={`legend-${index}`}
            className={`legend-item ${activeIndex === index ? "active" : ""}`}
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(-1)}
            style={{
              cursor: "pointer",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              transform:
                activeIndex === index
                  ? "scale(1.08) translateY(-2px)"
                  : "scale(1)",
              opacity: activeIndex === index ? 1 : 0.7,
            }}
          >
            <span
              className="legend-color"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            ></span>
            <span
              className="legend-name"
              style={{ fontWeight: activeIndex === index ? "800" : "500" }}
            >
              {item.name}
            </span>
            <span className="legend-percent">{item.percent.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PortfolioChart;
