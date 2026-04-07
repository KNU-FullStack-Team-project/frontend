import React, { useState, useRef, useMemo, useEffect } from "react";

const cleanNumber = (val) => {
  if (!val) return 0;
  if (typeof val === "number") return val;
  return parseInt(String(val).replace(/,/g, "")) || 0;
};

const CandleChart = ({ data, width = 800, height = 500 }) => {
  const [hoverIdx, setHoverIdx] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);
  const [containerWidth, setContainerWidth] = useState(width); 
  const containerRef = useRef(null);

  if (!data || data.length === 0) {
    return (
      <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", color: "#888" }}>
        차트 데이터를 불러올 수 없습니다.
      </div>
    );
  }

  // KIS 데이터는 최신순(내림차순)이므로 시간순(오름차순)으로 반환
  const sortedData = useMemo(() => [...data].reverse(), [data]);

  const margin = { top: 30, right: 70, bottom: 40, left: 10 };
  const candleWidth = 24; 
  const totalChartWidth = sortedData.length * candleWidth;
  const svgWidth = totalChartWidth + margin.left + margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  const volumeHeight = chartHeight * 0.2;

  const priceRangeData = useMemo(() => {
    const prices = sortedData.flatMap((d) => [parseFloat(d.high), parseFloat(d.low)]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const headRoom = (maxPrice - minPrice) * 0.1;
    return {
      min: minPrice - headRoom,
      max: maxPrice + headRoom,
      range: (maxPrice - minPrice) + 2 * headRoom
    };
  }, [sortedData]);

  const maxVolume = useMemo(() => Math.max(...sortedData.map(d => parseFloat(d.volume))), [sortedData]);

  const getY = (price) => {
    return (chartHeight - volumeHeight - 10) * (1 - (price - priceRangeData.min) / priceRangeData.range) + margin.top;
  };

  const getVolY = (vol) => {
    return height - margin.bottom - (vol / maxVolume) * volumeHeight;
  };

  const currentPrice = parseFloat(sortedData[sortedData.length - 1].close);
  const currentY = getY(currentPrice);

  // 캔들 및 거래량 막대 렌더링 최적화 (useMemo 사용)
  const chartElements = useMemo(() => {
    return (
      <>
        {/* 그리드 라인 (수평) */}
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
          const price = priceRangeData.min + p * priceRangeData.range;
          const y = getY(price);
          return (
            <line
              key={`grid-${i}`}
              x1={margin.left}
              y1={y}
              x2={svgWidth - margin.right}
              y2={y}
              stroke="#e5e7eb"
              strokeWidth="0.5"
              strokeDasharray="4,4"
            />
          );
        })}

        {/* 현재가 라인 */}
        <line
          x1={margin.left}
          y1={currentY}
          x2={svgWidth - margin.right}
          y2={currentY}
          stroke="var(--accent)"
          strokeWidth="1"
          strokeDasharray="2,2"
        />

        {/* 거래량 막대 */}
        {sortedData.map((d, i) => {
          const x = margin.left + i * candleWidth;
          const isUp = parseFloat(d.close) >= parseFloat(d.open);
          const volY = getVolY(parseFloat(d.volume));
          return (
            <rect
              key={`vol-${i}`}
              x={x + candleWidth * 0.2}
              y={volY}
              width={candleWidth * 0.6}
              height={height - margin.bottom - volY}
              fill={isUp ? "#f43f5e33" : "#3b82f633"}
            />
          );
        })}

        {/* 캔들 */}
        {sortedData.map((d, i) => {
          const x = margin.left + i * candleWidth;
          const open = parseFloat(d.open);
          const close = parseFloat(d.close);
          const high = parseFloat(d.high);
          const low = parseFloat(d.low);

          const isUp = close >= open;
          const color = isUp ? "#f43f5e" : "#3b82f6";

          const yOpen = getY(open);
          const yClose = getY(close);
          const yHigh = getY(high);
          const yLow = getY(low);

          return (
            <g key={i}>
              <line
                x1={x + candleWidth / 2}
                y1={yHigh}
                x2={x + candleWidth / 2}
                y2={yLow}
                stroke={color}
                strokeWidth="1.2"
              />
              <rect
                x={x + candleWidth * 0.15}
                y={Math.min(yOpen, yClose)}
                width={Math.max(1, candleWidth * 0.7)}
                height={Math.max(1, Math.abs(yOpen - yClose))}
                fill={isUp ? "url(#upGradient)" : "url(#downGradient)"}
                stroke={color}
                strokeWidth="0.5"
                rx={1}
              />
            </g>
          );
        })}
      </>
    );
  }, [sortedData, candleWidth, priceRangeData, currentY, height, margin.bottom, margin.left, svgWidth, volumeHeight]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollLeft = containerRef.current.scrollWidth;
      setScrollLeftState(containerRef.current.scrollLeft);
    }
    
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        setContainerWidth(entries[0].contentRect.width);
      }
    });
    
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    return () => observer.disconnect();
  }, [width]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - containerRef.current.offsetLeft);
    setScrollLeftState(containerRef.current.scrollLeft);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      e.preventDefault();
      const x = e.pageX - containerRef.current.offsetLeft;
      const walk = (x - startX) * 2.5; 
      containerRef.current.scrollLeft = scrollLeftState - walk;
      setScrollLeftState(containerRef.current.scrollLeft);
      return;
    }

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const curScroll = containerRef.current.scrollLeft;
    const x = e.clientX - rect.left + curScroll - margin.left;
    const y = e.clientY - rect.top;

    if (x >= 0 && x <= totalChartWidth) {
      const idx = Math.floor(x / candleWidth);
      if (idx >= 0 && idx < sortedData.length) {
        setHoverIdx(idx);
        setMousePos({ x: e.clientX - rect.left, y });
        setScrollLeftState(curScroll); 
      }
    } else {
      setHoverIdx(null);
    }
  };

  return (
    <div
      className={`candle-chart-wrapper ${isDragging ? "dragging" : ""}`}
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        width: "100%", 
        height,
        overflowX: "hidden",
        cursor: isDragging ? "grabbing" : "grab",
        position: "relative",
        background: "var(--bg)",
        borderRadius: "12px",
        border: "1px solid var(--border)",
        padding: "10px",
        boxSizing: "border-box" 
      }}
    >
      <svg width={svgWidth} height={height} style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="upGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="downGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {chartElements}

        {/* X축 (일자) */}
        {sortedData.filter((_, idx) => idx % Math.max(1, Math.floor(sortedData.length / 6)) === 0).map((d, i) => {
          const idx = sortedData.indexOf(d);
          const x = margin.left + idx * candleWidth;
          return (
            <text
              key={i}
              x={x + candleWidth / 2}
              y={height - 15}
              textAnchor="middle"
              fontSize="11"
              fill="#9ca3af"
              className="chart-axis-label"
            >
              {d.time ? `${d.time.substring(0, 2)}:${d.time.substring(2, 4)}` : `${d.date.substring(4, 6)}.${d.date.substring(6, 8)}`}
            </text>
          );
        })}

        {/* 우측 가격 축 */}
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
          const price = priceRangeData.min + p * priceRangeData.range;
          const y = getY(price);
          return (
            <text
              key={`axis-${i}`}
              x={scrollLeftState + containerWidth - margin.right + 8}
              y={y}
              fontSize="11"
              fill="#9ca3af"
              alignmentBaseline="middle"
              className="chart-axis-label"
            >
              {Math.round(price).toLocaleString()}
            </text>
          );
        })}

        {/* 현재가 라벨 고정 */}
        <rect
          x={scrollLeftState + containerWidth - margin.right + 2}
          y={currentY - 10}
          width={65}
          height={20}
          rx={4}
          fill="var(--accent)"
        />
        <text
          x={scrollLeftState + containerWidth - margin.right + 34}
          y={currentY}
          textAnchor="middle"
          alignmentBaseline="middle"
          fill="white"
          fontSize="11"
          fontWeight="600"
        >
          {currentPrice.toLocaleString()}
        </text>

        {/* 크로스헤어 */}
        {hoverIdx !== null && (
          <g pointerEvents="none">
            <line
              x1={margin.left + hoverIdx * candleWidth + candleWidth / 2}
              y1={margin.top}
              x2={margin.left + hoverIdx * candleWidth + candleWidth / 2}
              y2={height - margin.bottom}
              stroke="#9ca3af"
              strokeWidth="1"
              strokeDasharray="4,4"
            />
          </g>
        )}
      </svg>

      {/* 툴팁 */}
      {hoverIdx !== null && (
        <div
          className="chart-tooltip"
          style={{
            left: (mousePos.x + 210 > containerWidth ? mousePos.x - 220 : mousePos.x + 20) + scrollLeftState,
            top: mousePos.y > height / 2 ? mousePos.y - 150 : mousePos.y + 20,
            pointerEvents: "none",
            userSelect: "none"
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 5 }}>
            {sortedData[hoverIdx].date.replace(/(\d{4})(\d{2})(\d{2})/, "$1.$2.$3")}
            {sortedData[hoverIdx].time && ` ${sortedData[hoverIdx].time.substring(0, 2)}:${sortedData[hoverIdx].time.substring(2, 4)}`}
          </div>
          <div className="tooltip-row">
            <span className="tooltip-label">시가</span>
            <span className="tooltip-value">{cleanNumber(sortedData[hoverIdx].open).toLocaleString()}</span>
          </div>
          <div className="tooltip-row">
            <span className="tooltip-label">최고</span>
            <span className="tooltip-value" style={{ color: "#f43f5e" }}>{cleanNumber(sortedData[hoverIdx].high).toLocaleString()}</span>
          </div>
          <div className="tooltip-row">
            <span className="tooltip-label">최저</span>
            <span className="tooltip-value" style={{ color: "#3b82f6" }}>{cleanNumber(sortedData[hoverIdx].low).toLocaleString()}</span>
          </div>
          <div className="tooltip-row">
            <span className="tooltip-label">종가</span>
            <span className="tooltip-value">{cleanNumber(sortedData[hoverIdx].close).toLocaleString()}</span>
          </div>
          <div className="tooltip-row">
            <span className="tooltip-label">거래량</span>
            <span className="tooltip-value">{cleanNumber(sortedData[hoverIdx].volume).toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandleChart;
