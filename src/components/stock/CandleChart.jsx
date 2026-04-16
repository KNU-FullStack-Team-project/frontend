import React, { useState, useRef, useMemo, useEffect } from "react";
import * as Indicators from "../../utils/IndicatorUtils";

const cleanNumber = (val) => {
  if (!val) return 0;
  if (typeof val === "number") return val;
  return parseInt(String(val).replace(/,/g, "")) || 0;
};

const CandleChart = ({ data, indicators = {}, width = 800, height = 500 }) => {
  const [hoverIdx, setHoverIdx] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);
  const [containerWidth, setContainerWidth] = useState(width); 
  const containerRef = useRef(null);

  const sortedData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    try {
      return [...data].reverse();
    } catch (e) {
      return [];
    }
  }, [data]);

  // 보조지표 계산 (Memoized)
  const computedIndicators = useMemo(() => {
    if (sortedData.length === 0) return {};
    return {
      ma5: indicators.ma ? Indicators.calculateSMA(sortedData, 5) : null,
      ma20: indicators.ma ? Indicators.calculateSMA(sortedData, 20) : null,
      ma60: indicators.ma ? Indicators.calculateSMA(sortedData, 60) : null,
      bb: indicators.bb ? Indicators.calculateBollingerBands(sortedData, 20, 2) : null,
      rsi: indicators.rsi ? Indicators.calculateRSI(sortedData, 14) : null,
      macd: indicators.macd ? Indicators.calculateMACD(sortedData, 12, 26, 9) : null,
    };
  }, [sortedData, indicators]);

  const margin = { top: 30, right: 70, bottom: 40, left: 10 };
  const candleWidth = 24; 

  // 하단 패널(RSI, MACD) 존재 여부에 따른 레이아웃 계산
  const hasBottomIndicator = indicators.rsi || indicators.macd;
  const bottomPanelCount = (indicators.rsi ? 1 : 0) + (indicators.macd ? 1 : 0);
  const bottomPanelHeight = 100; // 패널 당 높이 상향 조정 (80 -> 100)
  const totalBottomHeight = bottomPanelCount * (bottomPanelHeight + 30);
  
  const mainChartHeight = height - margin.top - margin.bottom - (totalBottomHeight > 0 ? totalBottomHeight : 0);
  const volumeHeight = mainChartHeight * 0.15;

  const priceRangeData = useMemo(() => {
    if (sortedData.length === 0) return { min: 0, max: 0, range: 1 };
    
    let prices = sortedData.flatMap((d) => [parseFloat(d.high) || 0, parseFloat(d.low) || 0]);
    
    if (indicators.bb && computedIndicators.bb) {
      computedIndicators.bb.upper.forEach(v => { if (v !== null) prices.push(v); });
      computedIndicators.bb.lower.forEach(v => { if (v !== null) prices.push(v); });
    }

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const headRoom = (maxPrice - minPrice) * 0.1 || 10;
    return {
      min: minPrice - headRoom,
      max: maxPrice + headRoom,
      range: (maxPrice - minPrice) + 2 * headRoom
    };
  }, [sortedData, indicators.bb, computedIndicators.bb]);

  const maxVolume = useMemo(() => {
    if (sortedData.length === 0) return 1;
    return Math.max(...sortedData.map(d => parseFloat(d.volume) || 0)) || 1;
  }, [sortedData]);

  const totalChartWidth = sortedData.length * candleWidth;
  const svgWidth = totalChartWidth + margin.left + margin.right;

  const getY = (price) => {
    if (priceRangeData.range === 0) return margin.top;
    return (mainChartHeight - volumeHeight - 10) * (1 - (price - priceRangeData.min) / priceRangeData.range) + margin.top;
  };

  const getVolY = (vol) => {
    if (maxVolume === 0) return mainChartHeight + margin.top;
    return mainChartHeight + margin.top - (vol / maxVolume) * volumeHeight;
  };

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
  }, [width, data, indicators]); // indicators 변경 시에도 스크롤 상황 확인

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", color: "#888" }}>
        차트 데이터를 불러올 수 없습니다.
      </div>
    );
  }

  const currentPrice = parseFloat(sortedData[sortedData.length - 1].close) || 0;
  const currentY = getY(currentPrice);

  const renderPath = (points, color, strokeWidth = 1.5) => {
    if (!points || points.length < 2) return null;
    let d = "";
    let first = true;
    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        if (p === null) {
            first = true;
            continue;
        }
        const x = margin.left + i * candleWidth + candleWidth / 2;
        const y = getY(p);
        if (first) {
            d += `M ${x} ${y}`;
            first = false;
        } else {
            d += ` L ${x} ${y}`;
        }
    }
    return d ? <path d={d} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" vectorEffect="non-scaling-stroke" /> : null;
  };

  const chartElements = (
    <>
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

      <line
        x1={margin.left}
        y1={currentY}
        x2={svgWidth - margin.right}
        y2={currentY}
        stroke="#111827"
        strokeWidth="1"
        strokeDasharray="2,2"
      />

      {/* 볼린저 밴드 영역 채우기 */}
      {indicators.bb && computedIndicators.bb && (
        <path
          d={(() => {
              const { upper, lower } = computedIndicators.bb;
              let forward = "";
              let backward = "";
              let startIdx = -1;
              
              for(let i=0; i<upper.length; i++) {
                  if (upper[i] !== null && lower[i] !== null) {
                      const x = margin.left + i * candleWidth + candleWidth / 2;
                      if (startIdx === -1) {
                          forward = `M ${x} ${getY(upper[i])}`;
                          backward = `L ${x} ${getY(lower[i])}`;
                          startIdx = i;
                      } else {
                          forward += ` L ${x} ${getY(upper[i])}`;
                          backward = `L ${x} ${getY(lower[i])} ` + backward;
                      }
                  }
              }
              return startIdx !== -1 ? forward + " " + backward + " Z" : "";
          })()}
          fill="#e5e7eb"
          fillOpacity={0.3}
        />
      )}

      {/* 거래량 */}
      {sortedData.map((d, i) => {
        const x = margin.left + i * candleWidth;
        const isUp = parseFloat(d.close) >= parseFloat(d.open);
        const volY = getVolY(parseFloat(d.volume) || 0);
        return (
          <rect
            key={`vol-${i}`}
            x={x + candleWidth * 0.2}
            y={volY}
            width={candleWidth * 0.6}
            height={Math.max(0, mainChartHeight + margin.top - volY)}
            fill={isUp ? "#f43f5e33" : "#3b82f633"}
          />
        );
      })}

      {/* 캔들 */}
      {sortedData.map((d, i) => {
        const x = margin.left + i * candleWidth;
        const open = parseFloat(d.open) || 0;
        const close = parseFloat(d.close) || 0;
        const high = parseFloat(d.high) || 0;
        const low = parseFloat(d.low) || 0;
        const isUp = close >= open;
        const color = isUp ? "#f43f5e" : "#3b82f6";
        const yOpen = getY(open);
        const yClose = getY(close);
        const yHigh = getY(high);
        const yLow = getY(low);

        return (
          <g key={i}>
            <line x1={x + candleWidth / 2} y1={yHigh} x2={x + candleWidth / 2} y2={yLow} stroke={color} strokeWidth="1.2" />
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

      {/* 이동평균선 */}
      {indicators.ma && (
        <>
          {renderPath(computedIndicators.ma5, "#ff3b30", 1.2)}
          {renderPath(computedIndicators.ma20, "#ffcc00", 1.2)}
          {renderPath(computedIndicators.ma60, "#5856d6", 1.2)}
        </>
      )}
      
      {/* 볼린저 밴드 라인 */}
      {indicators.bb && computedIndicators.bb && (
        <>
          {renderPath(computedIndicators.bb.upper, "#94a3b8", 1.2)}
          {renderPath(computedIndicators.bb.lower, "#94a3b8", 1.2)}
        </>
      )}
    </>
  );

  const renderBottomIndicators = () => {
    let currentBaseY = mainChartHeight + margin.top + 30;
    const panels = [];

    if (indicators.rsi && computedIndicators.rsi) {
      const rsiY = currentBaseY;
      const getRsiY = (val) => rsiY + bottomPanelHeight * (1 - val / 100);
      
      panels.push(
        <g key="rsi-panel">
          <text x={margin.left} y={rsiY - 5} fontSize="11" fontWeight="700" fill="#666">RSI (14)</text>
          <rect x={margin.left} y={rsiY} width={svgWidth - margin.right - margin.left} height={bottomPanelHeight} fill="#f9fafb" rx={4} />
          {/* 가이드라인 */}
          {[30, 70].map(v => (
            <line key={v} x1={margin.left} y1={getRsiY(v)} x2={svgWidth - margin.right} y2={getRsiY(v)} stroke={v === 70 ? "#fca5a5" : "#93c5fd"} strokeWidth="0.5" strokeDasharray="2,2" />
          ))}
          
          <path
            d={computedIndicators.rsi.reduce((acc, p, i) => {
              if (p === null) return acc;
              const x = margin.left + i * candleWidth + candleWidth / 2;
              const y = getRsiY(p);
              return acc === "" ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
            }, "")}
            fill="none"
            stroke="#8b5cf6"
            strokeWidth="1.2"
          />
        </g>
      );
      currentBaseY += bottomPanelHeight + 35;
    }

    if (indicators.macd && computedIndicators.macd) {
      const macdY = currentBaseY;
      const { macdLine, signalLine, histogram } = computedIndicators.macd;
      
      const validMacds = [...macdLine, ...signalLine, ...histogram].filter(v => v !== null);
      const maxAbs = validMacds.length > 0 ? Math.max(...validMacds.map(v => Math.abs(v))) : 1;
      const rangeM = maxAbs * 1.5 || 1; // 여유 공간 포함
      
      const getMacdY = (val) => macdY + bottomPanelHeight/2 - (val / rangeM) * (bottomPanelHeight/2);

      panels.push(
        <g key="macd-panel">
          <text x={margin.left} y={macdY - 5} fontSize="11" fontWeight="700" fill="#666">MACD (12, 26, 9)</text>
          <rect x={margin.left} y={macdY} width={svgWidth - margin.right - margin.left} height={bottomPanelHeight} fill="#f9fafb" rx={4} />
          <line x1={margin.left} y1={macdY + bottomPanelHeight/2} x2={svgWidth - margin.right} y2={macdY + bottomPanelHeight/2} stroke="#e5e7eb" strokeWidth="1" />
          
          {/* 히스토그램 */}
          {histogram.map((val, i) => {
            if (val === null) return null;
            const x = margin.left + i * candleWidth + candleWidth / 2;
            const y0 = macdY + bottomPanelHeight/2;
            const y1 = getMacdY(val);
            return (
              <line key={i} x1={x} y1={y0} x2={x} y2={y1} stroke={val >= 0 ? "#f43f5e" : "#3b82f6"} strokeWidth="4" strokeOpacity="0.6" />
            );
          })}
          
          {/* 선들 */}
          {(() => {
              const dMacd = macdLine.reduce((acc, p, i) => {
                  if (p === null) return acc;
                  const x = margin.left + i * candleWidth + candleWidth / 2;
                  const y = getMacdY(p);
                  return acc === "" ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
              }, "");
              const dSignal = signalLine.reduce((acc, p, i) => {
                  if (p === null) return acc;
                  const x = margin.left + i * candleWidth + candleWidth / 2;
                  const y = getMacdY(p);
                  return acc === "" ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
              }, "");
              return (
                  <>
                      {dMacd && <path d={dMacd} fill="none" stroke="#2563eb" strokeWidth="1.2" />}
                      {dSignal && <path d={dSignal} fill="none" stroke="#ea580c" strokeWidth="1.2" />}
                  </>
              );
          })()}
        </g>
      );
    }

    return panels;
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - containerRef.current.offsetLeft);
    setScrollLeftState(containerRef.current.scrollLeft);
  };

  const handleMouseUp = () => setIsDragging(false);

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
        background: "#fff",
        borderRadius: "12px",
        border: "1px solid #e5e7eb",
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
        {renderBottomIndicators()}

        {/* X축 */}
        {sortedData.filter((_, idx) => idx % Math.max(1, Math.floor(sortedData.length / 6)) === 0).map((d, i) => {
          const idx = sortedData.indexOf(d);
          const x = margin.left + idx * candleWidth;
          return (
            <text key={i} x={x + candleWidth / 2} y={height - 5} textAnchor="middle" fontSize="10" fill="#9ca3af">
              {d.time ? `${d.time.substring(0, 2)}:${d.time.substring(2, 4)}` : `${d.date.substring(4, 6)}.${d.date.substring(6, 8)}`}
            </text>
          );
        })}

        {/* 가격 축 */}
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
          const price = priceRangeData.min + p * priceRangeData.range;
          const y = getY(price);
          return (
            <text key={`axis-${i}`} x={scrollLeftState + containerWidth - margin.right + 8} y={y} fontSize="10" fill="#9ca3af" alignmentBaseline="middle">
              {Math.round(price).toLocaleString()}
            </text>
          );
        })}

        {/* 현재가 라벨 */}
        <rect x={scrollLeftState + containerWidth - margin.right + 2} y={currentY - 10} width={65} height={20} rx={4} fill="#111827" />
        <text x={scrollLeftState + containerWidth - margin.right + 34} y={currentY} textAnchor="middle" alignmentBaseline="middle" fill="white" fontSize="10" fontWeight="600">
          {currentPrice.toLocaleString()}
        </text>

        {hoverIdx !== null && (
          <g pointerEvents="none">
            <line x1={margin.left + hoverIdx * candleWidth + candleWidth / 2} y1={margin.top} x2={margin.left + hoverIdx * candleWidth + candleWidth / 2} y2={height - margin.bottom} stroke="#9ca3af" strokeWidth="1" strokeDasharray="4,4" />
          </g>
        )}
      </svg>

      {hoverIdx !== null && (
        <div
          className="chart-tooltip"
          style={{
            left: (mousePos.x + 210 > containerWidth ? mousePos.x - 220 : mousePos.x + 20) + scrollLeftState,
            top: mousePos.y > height / 2 ? mousePos.y - 150 : mousePos.y + 20,
            background: "rgba(17, 24, 39, 0.9)",
            color: "#fff",
            padding: "10px",
            borderRadius: "8px",
            fontSize: "12px",
            position: "absolute",
            zIndex: 10,
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            pointerEvents: "none"
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 5 }}>
            {sortedData[hoverIdx].date.replace(/(\d{4})(\d{2})(\d{2})/, "$1.$2.$3")}
            {sortedData[hoverIdx].time && ` ${sortedData[hoverIdx].time.substring(0, 2)}:${sortedData[hoverIdx].time.substring(2, 4)}`}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', marginBottom: '4px' }}>
            <span>시가</span>
            <span>{cleanNumber(sortedData[hoverIdx].open).toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', marginBottom: '4px' }}>
            <span>최고</span>
            <span style={{ color: "#f43f5e" }}>{cleanNumber(sortedData[hoverIdx].high).toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', marginBottom: '4px' }}>
            <span>최저</span>
            <span style={{ color: "#3b82f6" }}>{cleanNumber(sortedData[hoverIdx].low).toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', marginBottom: '4px' }}>
            <span>종가</span>
            <span>{cleanNumber(sortedData[hoverIdx].close).toLocaleString()}</span>
          </div>
          {computedIndicators.ma5 && computedIndicators.ma5[hoverIdx] && (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', color: '#ff3b30' }}>
              <span>MA5</span>
              <span>{Math.round(computedIndicators.ma5[hoverIdx]).toLocaleString()}</span>
            </div>
          )}
          {computedIndicators.rsi && computedIndicators.rsi[hoverIdx] && (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', color: '#8b5cf6', borderTop: '1px solid #444', marginTop: '4px', paddingTop: '4px' }}>
              <span>RSI (14)</span>
              <span>{computedIndicators.rsi[hoverIdx].toFixed(2)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CandleChart;
