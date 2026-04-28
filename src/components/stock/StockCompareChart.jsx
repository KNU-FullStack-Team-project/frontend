import React, { useMemo, useState } from "react";

const StockCompareChart = ({ data, period, width = 800, height = 400 }) => {
  const [hoverIndex, setHoverIndex] = useState(null);
  const margin = { top: 30, right: 30, bottom: 40, left: 60 };

  const chartInfo = useMemo(() => {
    if (!data || !data.dates || data.dates.length === 0 || !data.series || data.series.length === 0) {
      return null;
    }

    // 모든 시리즈의 데이터 값 중 최소/최대값 찾기 (여백을 위해)
    let minRate = 0;
    let maxRate = 0;

    data.series.forEach(s => {
      s.data.forEach(val => {
        if (val !== null) {
          if (val < minRate) minRate = val;
          if (val > maxRate) maxRate = val;
        }
      });
    });

    const range = maxRate - minRate || 1;
    const padding = range * 0.1;
    const yMin = minRate - padding;
    const yMax = maxRate + padding;

    // Y축 그리기용 값들
    const yTicks = [yMin, yMin + (yMax - yMin) * 0.25, yMin + (yMax - yMin) * 0.5, yMin + (yMax - yMin) * 0.75, yMax];

    return { yMin, yMax, yTicks, xStep: (width - margin.left - margin.right) / Math.max(1, data.dates.length - 1) };
  }, [data, width, height]);

  if (!chartInfo) {
    return (
      <div style={{ height: height, display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb", borderRadius: "12px", color: "#9ca3af", border: "1px dashed #e5e7eb" }}>
        비교할 종목의 시세 데이터가 없습니다.
      </div>
    );
  }

  const { yMin, yMax, yTicks, xStep } = chartInfo;

  const getX = (index) => margin.left + index * xStep;
  const getY = (val) => height - margin.bottom - ((val - yMin) / (yMax - yMin)) * (height - margin.top - margin.bottom);

  // X축 날짜 라벨을 몇 개만 표시
  const xLabels = [];
  const labelCount = Math.min(6, data.dates.length);
  for (let i = 0; i < labelCount; i++) {
    const idx = Math.floor(i * (data.dates.length - 1) / Math.max(1, labelCount - 1));
    xLabels.push({ idx, date: data.dates[idx] });
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}
         onMouseLeave={() => setHoverIndex(null)}
         onMouseMove={(e) => {
           const rect = e.currentTarget.getBoundingClientRect();
           const mouseX = e.clientX - rect.left;
           const scaleX = width / rect.width; // 렌더링된 너비와 SVG viewBox 너비 비율
           const viewBoxX = mouseX * scaleX;
           const xInGraph = viewBoxX - margin.left;
           
           if (xInGraph >= -(xStep / 2) && xInGraph <= (width - margin.left - margin.right) + (xStep / 2)) {
             let idx = Math.round(xInGraph / xStep);
             idx = Math.max(0, Math.min(idx, data.dates.length - 1));
             setHoverIndex(idx);
           } else {
             setHoverIndex(null);
           }
         }}>
      
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto", overflow: "visible" }}>
        
        {/* Y축 그리드 라인 */}
        {yTicks.map((tick, i) => (
          <g key={`y-${i}`}>
            <line x1={margin.left} y1={getY(tick)} x2={width - margin.right} y2={getY(tick)} stroke="#f3f4f6" strokeWidth={tick === 0 ? "2" : "1"} />
            <text x={margin.left - 10} y={getY(tick)} fill="#9ca3af" fontSize="11" textAnchor="end" alignmentBaseline="middle">
              {tick > 0 ? "+" : ""}{tick.toFixed(1)}%
            </text>
          </g>
        ))}

        {/* X축 날짜 라벨 */}
        {xLabels.map((lbl, i) => (
          <text key={`x-${i}`} x={getX(lbl.idx)} y={height - 15} fill="#9ca3af" fontSize="11" textAnchor="middle">
            {lbl.date?.slice(4, 6)}/{lbl.date?.slice(6, 8)}
          </text>
        ))}

        {/* 각 종목별 꺾은선 그리기 */}
        {data.series.map((series, sIdx) => {
          // 데이터가 있는 점들만 필터링
          const validPoints = series.data
            .map((val, idx) => ({ val, idx }))
            .filter(p => p.val !== null);

          if (validPoints.length === 0) return null;

          const pathD = validPoints.map((p, i) => 
            `${i === 0 ? 'M' : 'L'} ${getX(p.idx)} ${getY(p.val)}`
          ).join(" ");

          return (
            <g key={series.symbol}>
              <path d={pathD} fill="none" stroke={series.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            </g>
          );
        })}

        {/* 툴팁을 위한 마우스 호버 가이드 라인과 점 */}
        {hoverIndex !== null && (
          <g>
            <line 
              x1={getX(hoverIndex)} y1={margin.top} 
              x2={getX(hoverIndex)} y2={height - margin.bottom} 
              stroke="#d1d5db" strokeWidth="1" strokeDasharray="4 4" 
            />
            {data.series.map(series => {
              const val = series.data[hoverIndex];
              if (val === null) return null;
              return (
                <circle 
                  key={`dot-${series.symbol}`} 
                  cx={getX(hoverIndex)} cy={getY(val)} 
                  r="4" fill="#fff" stroke={series.color} strokeWidth="2" 
                />
              );
            })}
          </g>
        )}
      </svg>

      {/* HTML 기반 툴팁 (SVG 위에 렌더링) */}
      {hoverIndex !== null && (
        <div style={{
          position: "absolute",
          left: Math.min(Math.max(margin.left, (hoverIndex * xStep * (100 / (width - margin.left - margin.right))) + 5), 80) + "%", // 대략적인 백분율 위치
          top: "10%",
          transform: "translateX(-50%)",
          background: "rgba(255, 255, 255, 0.95)",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          padding: "12px",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          pointerEvents: "none",
          minWidth: "160px",
          zIndex: 10
        }}>
          <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "8px", fontWeight: "600", borderBottom: "1px solid #e5e7eb", paddingBottom: "4px" }}>
            {data.dates[hoverIndex]?.slice(0,4)}년 {data.dates[hoverIndex]?.slice(4,6)}월 {data.dates[hoverIndex]?.slice(6,8)}일
          </div>
          {data.series.map(series => {
            const val = series.data[hoverIndex];
            if (val === null) return null;
            return (
              <div key={`tt-${series.symbol}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: series.color }}></span>
                  <span style={{ fontSize: "13px", fontWeight: "600", color: "#374151" }}>{series.name}</span>
                </div>
                <span style={{ fontSize: "13px", fontWeight: "700", color: val > 0 ? "#ef4444" : val < 0 ? "#3b82f6" : "#4b5563" }}>
                  {val > 0 ? "+" : ""}{val.toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StockCompareChart;
