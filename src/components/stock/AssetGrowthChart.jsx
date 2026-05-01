import React, { useMemo } from "react";

const AssetGrowthChart = ({ data }) => {
  const margin = { top: 20, right: 30, bottom: 30, left: 60 };
  const width = 800;
  const height = 300;

  const chartData = useMemo(() => {
    if (!data || data.length < 2) return null;
    
    const assets = data.map(d => Number(d.totalAsset));
    const minAsset = Math.min(...assets);
    const maxAsset = Math.max(...assets);
    const range = maxAsset - minAsset || 1;
    
    // 약간의 여백 추가
    const padding = range * 0.1;
    const yMin = minAsset - padding;
    const yMax = maxAsset + padding;
    const yRange = yMax - yMin;

    const points = data.map((d, i) => {
      const x = margin.left + (i * (width - margin.left - margin.right) / (data.length - 1));
      const y = height - margin.bottom - ((Number(d.totalAsset) - yMin) * (height - margin.top - margin.bottom) / yRange);
      return { x, y, date: d.date, value: d.totalAsset };
    });

    return { points, yMin, yMax };
  }, [data]);

  if (!data || data.length < 2) {
    return (
      <div style={{ 
        height: height, 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        background: "#f9fafb", 
        borderRadius: "12px",
        color: "#9ca3af",
        fontSize: "14px",
        border: "1px dashed #e5e7eb"
      }}>
        데이터가 충분하지 않습니다. (최소 2일 이상의 데이터가 필요합니다)
      </div>
    );
  }

  const { points, yMin, yMax } = chartData;
  const pathData = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaData = `${pathData} L ${points[points.length - 1].x} ${height - margin.bottom} L ${points[0].x} ${height - margin.bottom} Z`;

  return (
    <div className="asset-growth-chart" style={{ width: "100%", overflow: "hidden" }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto" }}>
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4874d4" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#4874d4" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* 배경 그리드 */}
        {[0, 0.5, 1].map((p, i) => {
          const y = margin.top + p * (height - margin.top - margin.bottom);
          const val = yMax - p * (yMax - yMin);
          return (
            <g key={i}>
              <line 
                x1={margin.left} y1={y} x2={width - margin.right} y2={y} 
                stroke="#f3f4f6" strokeWidth="1" 
              />
              <text x={margin.left - 10} y={y} textAnchor="end" alignmentBaseline="middle" fontSize="10" fill="#9ca3af">
                {(val / 10000).toLocaleString()}만
              </text>
            </g>
          );
        })}

        {/* 자산 곡선 영역 */}
        <path d={areaData} fill="url(#areaGradient)" />
        
        {/* 자산 곡선 라인 */}
        <path d={pathData} fill="none" stroke="#4874d4" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />

        {/* 포인트 점 */}
        {points.map((p, i) => (
          <circle 
            key={i} cx={p.x} cy={p.y} r="4" fill="#fff" stroke="#4874d4" strokeWidth="2" 
            style={{ cursor: "pointer" }}
          >
            <title>{`${p.date}: ${Number(p.value).toLocaleString()}원`}</title>
          </circle>
        ))}

        {/* X축 라벨 (첫날과 마지막날) */}
        <text x={points[0].x} y={height - 5} textAnchor="start" fontSize="10" fill="#9ca3af">{points[0].date}</text>
        <text x={points[points.length - 1].x} y={height - 5} textAnchor="end" fontSize="10" fill="#9ca3af">{points[points.length - 1].date}</text>
      </svg>
    </div>
  );
};

export default AssetGrowthChart;
