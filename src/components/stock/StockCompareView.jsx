import React, { useState, useEffect, useCallback } from "react";
import StockCompareChart from "./StockCompareChart";

const COLORS = ["#4874d4", "#f59e0b", "#10b981", "#ef4444"];

const StockCompareView = ({ onClose, initialStock }) => {
  const [selectedStocks, setSelectedStocks] = useState([]); // 최대 4개
  const [period, setPeriod] = useState("1M");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [chartData, setChartData] = useState(null);

  // 초기 종목이 넘어온 경우 자동 추가
  useEffect(() => {
    if (initialStock && initialStock.symbol && initialStock.name) {
      setSelectedStocks([{ symbol: initialStock.symbol, name: initialStock.name }]);
    }
  }, [initialStock]);

  // 종목 검색
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchKeyword.trim()) {
      setSearchResults(null);
      return;
    }

    try {
      setIsSearching(true);
      const response = await fetch(`/api/stocks/search?keyword=${encodeURIComponent(searchKeyword)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      }
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (!searchKeyword.trim()) {
      setSearchResults(null);
    }
  }, [searchKeyword]);

  // 비교 종목 추가
  const handleAddStock = (stock) => {
    if (selectedStocks.find(s => s.symbol === stock.symbol)) {
      alert("이미 추가된 종목입니다.");
      return;
    }
    if (selectedStocks.length >= 4) {
      alert("비교 대상은 최대 4개까지 선택 가능합니다.");
      return;
    }
    setSelectedStocks([...selectedStocks, { symbol: stock.symbol, name: stock.name }]);
    setSearchKeyword("");
    setSearchResults(null);
  };

  // 비교 종목 제거
  const handleRemoveStock = (symbol) => {
    setSelectedStocks(selectedStocks.filter(s => s.symbol !== symbol));
  };

  // 데이터 가져오기 및 차트 데이터 정제
  const fetchCompareData = useCallback(async () => {
    if (selectedStocks.length === 0) {
      setChartData(null);
      return;
    }

    setIsLoadingData(true);
    try {
      // 모든 종목의 과거 시세를 병렬로 요청
      const responses = await Promise.all(
        selectedStocks.map(s => fetch(`/api/stocks/${s.symbol}/history?period=${period}`).then(res => res.json()))
      );

      // 1. 모든 날짜를 수집하여 통합 날짜 배열 생성 (오름차순)
      const allDatesSet = new Set();
      responses.forEach(resData => {
        if (Array.isArray(resData)) {
          resData.forEach(d => {
            if (d.date) allDatesSet.add(d.date);
          });
        }
      });
      const unifiedDates = Array.from(allDatesSet).sort();

      if (unifiedDates.length === 0) {
        setChartData(null);
        return;
      }

      // 2. 각 종목별로 시리즈 데이터 생성 (기준일 대비 수익률)
      const series = selectedStocks.map((stock, i) => {
        const rawData = responses[i] || [];
        // 날짜별 종가 맵핑
        const priceMap = {};
        rawData.forEach(d => {
          if (d.date && d.close) {
            priceMap[d.date] = parseFloat(d.close);
          }
        });

        // 기준 가격 찾기 (해당 기간의 가장 빠른 날짜의 종가)
        let basePrice = null;
        for (const date of unifiedDates) {
          if (priceMap[date]) {
            basePrice = priceMap[date];
            break;
          }
        }

        // 통합 날짜 배열에 맞춰 수익률 계산
        const returnRates = unifiedDates.map(date => {
          const currentPrice = priceMap[date];
          if (!currentPrice || !basePrice) return null;
          return ((currentPrice - basePrice) / basePrice) * 100;
        });

        return {
          symbol: stock.symbol,
          name: stock.name,
          color: COLORS[i],
          data: returnRates
        };
      });

      setChartData({
        dates: unifiedDates,
        series: series
      });

    } catch (error) {
      console.error("Failed to fetch compare data:", error);
      alert("데이터를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoadingData(false);
    }
  }, [selectedStocks, period]);

  // 종목이나 기간이 바뀔 때마다 데이터 갱신
  useEffect(() => {
    if (selectedStocks.length > 0) {
      fetchCompareData();
    } else {
      setChartData(null);
    }
  }, [selectedStocks, period, fetchCompareData]);

  return (
    <div className="content-card" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 헤더 부분 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#111827", margin: 0 }}>📊 종목 수익률 비교</h2>
          <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "4px" }}>
            최대 4개 종목의 기간별 누적 수익률을 겹쳐서 비교해 보세요.
          </p>
        </div>
        <button 
          onClick={onClose}
          style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontWeight: "600" }}
        >
          돌아가기
        </button>
      </div>

      {/* 컨트롤 영역 (검색 및 기간 선택) */}
      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "flex-start" }}>
        
        {/* 종목 검색바 */}
        <div style={{ flex: 1, minWidth: "300px", position: "relative" }}>
          <form onSubmit={handleSearch} style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              placeholder="비교할 종목명 또는 코드를 검색하세요"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              disabled={selectedStocks.length >= 4}
              style={{ flex: 1, padding: "10px 16px", borderRadius: "8px", border: "1px solid #d1d5db", outline: "none" }}
            />
            <button 
              type="submit" 
              disabled={selectedStocks.length >= 4 || !searchKeyword.trim()}
              style={{ padding: "0 20px", borderRadius: "8px", background: "#111827", color: "#fff", border: "none", cursor: "pointer" }}
            >
              검색
            </button>
          </form>

          {/* 검색 결과 드롭다운 */}
          {isSearching && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", marginTop: "4px", padding: "12px 16px", color: "#6b7280", zIndex: 50 }}>
              검색 중...
            </div>
          )}

          {!isSearching && searchResults && searchResults.length > 0 && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", marginTop: "4px", maxHeight: "250px", overflowY: "auto", zIndex: 50, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}>
              {searchResults.map(stock => (
                <div 
                  key={stock.symbol}
                  onClick={() => handleAddStock(stock)}
                  style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#f9fafb"}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#fff"}
                >
                  <span style={{ fontWeight: "600", color: "#111827" }}>{stock.name}</span>
                  <span style={{ fontSize: "12px", color: "#6b7280" }}>{stock.symbol}</span>
                </div>
              ))}
            </div>
          )}
          {!isSearching && searchResults && searchResults.length === 0 && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", marginTop: "4px", padding: "12px 16px", color: "#6b7280", zIndex: 50 }}>
              검색 결과가 없습니다.
            </div>
          )}
        </div>

        {/* 기간 선택 버튼들 */}
        <div style={{ display: "flex", gap: "6px", background: "#f3f4f6", padding: "4px", borderRadius: "8px" }}>
          {[
            { code: "1M", label: "1개월" },
            { code: "3M", label: "3개월" },
            { code: "6M", label: "6개월" },
            { code: "1Y", label: "1년" },
          ].map(p => (
            <button
              key={p.code}
              onClick={() => setPeriod(p.code)}
              style={{
                padding: "6px 16px",
                borderRadius: "6px",
                border: "none",
                fontSize: "13px",
                fontWeight: period === p.code ? "700" : "500",
                background: period === p.code ? "#fff" : "transparent",
                color: period === p.code ? "#111827" : "#6b7280",
                boxShadow: period === p.code ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                cursor: "pointer"
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 선택된 종목 태그 표시 */}
      {selectedStocks.length > 0 && (
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {selectedStocks.map((stock, idx) => (
            <div key={stock.symbol} style={{ display: "flex", alignItems: "center", gap: "8px", background: "#f9fafb", border: `1px solid ${COLORS[idx]}`, padding: "6px 12px", borderRadius: "20px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: COLORS[idx] }}></span>
              <span style={{ fontSize: "14px", fontWeight: "600", color: "#111827" }}>{stock.name}</span>
              <button 
                onClick={() => handleRemoveStock(stock.symbol)}
                style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: "2px" }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 차트 영역 */}
      <div style={{ height: "500px", marginTop: "10px" }}>
        {isLoadingData ? (
          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb", borderRadius: "12px", color: "#6b7280", flexDirection: "column", gap: "12px" }}>
            <div className="loading-spinner"></div>
            <div>데이터를 불러오는 중입니다...</div>
          </div>
        ) : chartData ? (
          <StockCompareChart data={chartData} period={period} height={450} width={900} />
        ) : (
          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb", borderRadius: "12px", color: "#9ca3af", border: "1px dashed #d1d5db" }}>
            {selectedStocks.length === 0 ? "비교할 종목을 검색하여 추가해 주세요. (최대 4개)" : "해당 기간의 데이터가 충분하지 않습니다."}
          </div>
        )}
      </div>

    </div>
  );
};

export default StockCompareView;
