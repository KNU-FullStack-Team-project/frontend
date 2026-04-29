import React, { useState, useEffect, useRef, useCallback } from "react";

import Modal from "../common/Modal";
import StockDetail from "../components/stock/StockDetail";
import StockCompareView from "../components/stock/StockCompareView";

const StockRow = ({
  stock,
  favorites,
  toggleFavorite,
  openAlertSettings,
  handleStockClick,
  getTradingAmountLabel,
}) => {
  return (
    <div
      className="stock-list-item clickable"
      onClick={() => handleStockClick(stock)}
    >
      <div className="favorite-actions" style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
        <button
          className={`favorite-btn ${favorites.has(stock.symbol) ? "active" : ""}`}
          onClick={(e) => toggleFavorite(e, stock.symbol)}
        >
          {favorites.has(stock.symbol) ? "❤️" : "🤍"}
        </button>
        {favorites.has(stock.symbol) && (
          <button
            className="alert-settings-btn"
            onClick={(e) => openAlertSettings(e, stock.symbol)}
            style={{ 
              border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px',
              padding: '4px', borderRadius: '4px', transition: 'background 0.2s'
            }}
            title="알림 설정"
          >
            🔔
          </button>
        )}
      </div>


      <div className="stock-name-section">
        <span className="stock-name-text">{stock.name}</span>
      </div>

      <div className="stock-price-section">
        {stock.currentPrice === "0" || !stock.currentPrice ? (
          <span style={{ color: "#9ca3af", fontSize: "12px", fontWeight: "500" }}>시세 확인 중...</span>
        ) : (
          `${parseInt(stock.currentPrice).toLocaleString()}원`
        )}
      </div>

      <div className="stock-rate-section">
        <span
          className={`rate-text ${stock.currentPrice === "0"
            ? ""
            : parseFloat(stock.changeRate) >= 0
              ? "up"
              : "down"
            }`}
        >
          {stock.currentPrice === "0"
            ? ""
            : `${parseFloat(stock.changeRate) >= 0 ? "+" : ""}${stock.changeRate}%`}
        </span>
      </div>

      <div className="stock-volume-section">
        {getTradingAmountLabel(stock.currentPrice, stock.volume)}
      </div>
    </div>
  );
};

const StockPage = ({ user, onOpenCommunity, onActivity }) => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStock, setSelectedStock] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [favorites, setFavorites] = useState(new Set());
  const [favoriteStocksData, setFavoriteStocksData] = useState([]);
  const [heldStocksData, setHeldStocksData] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFavoritesLoading, setIsFavoritesLoading] = useState(false);
  const [isHoldingsLoading, setIsHoldingsLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [industries, setIndustries] = useState([]);
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [compareInitialStock, setCompareInitialStock] = useState(null);
  const observerTarget = useRef(null);

  const handleStockClick = (stock) => {
    setSelectedStock(stock);
    setIsModalOpen(true);
  };

  const fetchStocks = useCallback(async (pageNum = 1, isReset = false, industry = null, stockType = null) => {
    try {
      setLoading(true);
      const industryParam = industry ? `&industry=${encodeURIComponent(industry)}` : "";
      const typeParam = stockType ? `&stockType=${encodeURIComponent(stockType)}` : "";
      const response = await fetch(
        `/api/stocks?page=${pageNum}&size=20${industryParam}${typeParam}`,
      );
      if (!response.ok) throw new Error("Stock list fetch failed");

      const data = await response.json();

      if (isReset || pageNum === 1) {
        setStocks(data.content);
      } else {
        setStocks((prev) => {
          // 1. 기존 목록의 내용을 새로 받아온 데이터로 업데이트 (Partial Update)
          const newItemsMap = new Map(data.content.map((item) => [item.symbol, item]));
          const updatedStocks = prev.map((oldItem) => {
            const newItem = newItemsMap.get(oldItem.symbol);
            return newItem ? { ...oldItem, ...newItem } : oldItem;
          });

          // 2. 만약 기존 목록에 없던 새 종목이 있다면 추가 (Pagination)
          const existingSymbols = new Set(updatedStocks.map((s) => s.symbol));
          const appendStocks = data.content.filter(
            (s) => !existingSymbols.has(s.symbol),
          );

          return [...updatedStocks, ...appendStocks];
        });
      }

      setHasMore(data.content.length > 0 && data.currentPage < data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchIndustries = useCallback(async () => {
    try {
      const response = await fetch("/api/stocks/industries");
      if (response.ok) {
        const data = await response.json();
        // 숫자로만 된 업종 코드(예: 001, 002 등)는 제외하고 한글/영문 이름만 표시
        const filteredIndustries = data.filter(industry => isNaN(industry));
        setIndustries(filteredIndustries);
      }
    } catch (err) {
      console.error("Failed to fetch industries:", err);
    }
  }, []);

  const fetchFavorites = useCallback(async () => {
    const userId = user?.userId || user?.id;
    if (!userId) return;

    try {
      const response = await fetch(
        `/api/favorites?userId=${userId}`
      );

      if (response.ok) {
        const data = await response.json();
        setFavorites(new Set(data));
      }
    } catch (err) {
      console.error("Failed to fetch favorites:", err);
    }
  }, [user]);

  const fetchFavoriteDetails = useCallback(async () => {
    const userId = user?.userId || user?.id;
    if (!userId) return;

    try {
      setIsFavoritesLoading(true);
      const response = await fetch(
        `/api/favorites/details?userId=${userId}`
      );

      if (response.ok) {
        const data = await response.json();
        setFavoriteStocksData(data);
      }
    } catch (err) {
      console.error("Failed to fetch favorite details:", err);
    } finally {
      setIsFavoritesLoading(false);
    }
  }, [user]);

  const fetchHeldStocks = useCallback(async () => {
    const accountId = user?.accountId;

    if (!accountId) return;

    try {
      setIsHoldingsLoading(true);
      const response = await fetch(
        `/api/orders/holdings?accountId=${accountId}`
      );

      if (response.ok) {
        const data = await response.json();
        setHeldStocksData(data);
      }
    } catch (err) {
      console.error("Failed to fetch held stocks:", err);
    } finally {
      setIsHoldingsLoading(false);
    }
  }, [user]);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    const currentKeyword = searchKeyword.trim();
    if (!currentKeyword) {
      setSearchResults(null);
      return;
    }

    try {
      setIsSearching(true);
      const response = await fetch(
        `/api/stocks/search?keyword=${encodeURIComponent(
          currentKeyword,
        )}`,
      );
      if (response.ok) {
        const data = await response.json();
        // [수정] 레이스 컨디션 방지: 검색 결과가 도착했을 때의 키워드가 현재 검색어와 같을 때만 업데이트
        if (searchKeyword.trim() === currentKeyword) {
          setSearchResults(data);
        }
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

  const prevUserEmailRef = useRef(null);

  useEffect(() => {
    // 사용자가 실제로 바뀌었을 때만 리스트와 즐겨찾기를 다시 불러옵니다.
    if (prevUserEmailRef.current !== user?.email) {
      setPage(1);
      setSelectedIndustry(null);
      setSelectedType(null);
      fetchStocks(1, true, null, null);
      fetchIndustries();

      const userId = user?.userId || user?.id;

      if (userId) {
        fetchFavorites();
      } else {
        const savedFavs = localStorage.getItem("favoriteStocks");
        if (savedFavs) {
          setFavorites(new Set(JSON.parse(savedFavs)));
        }
      }
      prevUserEmailRef.current = user?.email;
    }
  }, [user?.email, fetchStocks, fetchFavorites, fetchIndustries]);

  useEffect(() => {
    if (activeTab === "favorites") {
      fetchFavoriteDetails();
    }
  }, [activeTab, fetchFavoriteDetails]);

  useEffect(() => {
    if (activeTab === "holdings") {
      fetchHeldStocks();
    }
  }, [activeTab, fetchHeldStocks]);

  // 주식 상세(그래프) 모달이 열려있을 때 자동 로그아웃 방지 (하트비트)
  useEffect(() => {
    let interval;
    if (isModalOpen && user && onActivity) {
      // 30초마다 활동 타이머 리셋
      interval = setInterval(() => {
        onActivity();
      }, 30000);
    }
    return () => clearInterval(interval);
  }, [isModalOpen, user?.email, onActivity]);

  useEffect(() => {
    if (activeTab !== "all") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchStocks(nextPage, false, selectedIndustry, selectedType);
        }
      },
      { threshold: 0.1 },
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
    // [수정] searchResults, selectedIndustry, selectedType을 의존성에 추가하여 필터/검색 변경 시 관찰자 재설정 보장
  }, [hasMore, loading, page, fetchStocks, activeTab, searchResults, selectedIndustry, selectedType]);

  // 시세 미수집 종목(0원)이 있을 경우 자동으로 정보를 다시 불러오는 로직 (지능형 자동 갱신)
  useEffect(() => {
    // [수정] 검색 중이거나 다른 탭일 때는 자동 갱신을 멈춰 리소스 낭비 및 레이스 컨디션 방지
    if (activeTab !== "all" || loading || stocks.length === 0 || searchResults !== null) return;

    const hasIncompleteData = stocks.some(
      (s) => s.currentPrice === "0" || !s.currentPrice || s.currentPrice === "null"
    );

    if (hasIncompleteData) {
      const timer = setTimeout(() => {
        // [수정] isReset을 false로 넘겨 기존 목록을 유지하면서 데이터만 보정합니다.
        fetchStocks(page, false, selectedIndustry, selectedType);
      }, 3500); // 3.5초 대기 후 재시도

      return () => clearTimeout(timer);
    }
    // [수정] 의존성 배열 보완
  }, [stocks, loading, page, fetchStocks, activeTab, searchResults, selectedIndustry, selectedType]);

  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [selectedSymbolForAlert, setSelectedSymbolForAlert] = useState(null);
  const [tempBuyLevel, setTempBuyLevel] = useState("NONE");
  const [tempSellLevel, setTempSellLevel] = useState("NONE");

  const toggleFavorite = async (e, symbol) => {
    e.stopPropagation();
    const userId = user?.userId || user?.id;

    if (!userId) {
      alert("로그인이 필요한 기능입니다.");
      return;
    }

    if (favorites.has(symbol)) {
      // 즉시 해제
      const newFavs = new Set(favorites);
      newFavs.delete(symbol);
      setFavorites(newFavs);

      try {
        await fetch(`/api/favorites/${symbol}?userId=${userId}`, { method: "DELETE" });
        if (activeTab === "favorites") fetchFavoriteDetails();
      } catch (err) {
        console.error(err);
      }
    } else {
      // 즉시 등록 (알림은 기본 NONE)
      const newFavs = new Set(favorites);
      newFavs.add(symbol);
      setFavorites(newFavs);

      try {
        await fetch(
          `/api/favorites/${symbol}?userId=${userId}&buyAlertLevel=NONE&sellAlertLevel=NONE`,
          { method: "POST" }
        );
        if (activeTab === "favorites") fetchFavoriteDetails();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const openAlertSettings = (e, symbol) => {
    e.stopPropagation();
    setSelectedSymbolForAlert(symbol);
    setTempBuyLevel("NONE"); // 실제 구현 시에는 현재 설정값을 가져오는 API가 있으면 더 좋습니다.
    setTempSellLevel("NONE");
    setAlertModalOpen(true);
  };

  const confirmUpdateAlert = async () => {
    const symbol = selectedSymbolForAlert;
    const userId = user?.userId || user?.id;
    if (!symbol || !userId) return;

    setAlertModalOpen(false);

    try {
      // 기존에 등록된 상태이므로 UPDATE(PUT) 요청을 보냅니다.
      const response = await fetch(
        `/api/favorites/${symbol}/alert?userId=${userId}&buyAlertLevel=${tempBuyLevel}&sellAlertLevel=${tempSellLevel}`,
        { method: "PUT" }
      );

      if (response.ok) {
        alert("알림 설정이 저장되었습니다.");
      }
    } catch (err) {
      console.error("Failed to update alert:", err);
      alert("알림 설정 저장에 실패했습니다.");
    }
  };

  const getTradingAmountLabel = (price, volume) => {
    if (!price || !volume || isNaN(parseInt(price)) || isNaN(parseInt(volume)) || price === "0") return "-";

    try {
      // 큰 숫자를 다루기 위해 BigInt 사용 (정밀도 유지)
      const amount = BigInt(parseInt(price)) * BigInt(parseInt(volume));

      if (amount >= 100000000n) {
        return (Number(amount) / 100000000).toFixed(1) + "억원";
      } else if (amount >= 10000n) {
        return (Number(amount) / 10000).toLocaleString() + "만원";
      }
      return Number(amount).toLocaleString() + "원";
    } catch {
      return "0원";
    }
  };

  if (loading && page === 1 && stocks.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">주식 정보를 업데이트하는 중입니다...</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <div style={styles.heroBadge}>STOCK</div>
        <h1 style={styles.heroTitle}>주식 시장</h1>
        <p style={styles.heroText}>
          종목 정보를 확인하고, 나만의 거래 전략을 세워보세요.
        </p>
      </div>


      {isCompareMode ? (
        <StockCompareView 
          initialStock={compareInitialStock} 
          onClose={() => {
            setIsCompareMode(false);
            setCompareInitialStock(null);
          }} 
        />
      ) : (
      <div className="content-card">
        <div className="section-header">
          <h3>실시간 주식 정보</h3>
        </div>

        <div className="search-container" style={{ marginBottom: "20px" }}>
          <form
            onSubmit={handleSearch}
            style={{ display: "flex", gap: "10px", width: "100%" }}
          >
            <input
              type="text"
              className="search-input"
              placeholder="종목명 또는 종목코드를 입력하세요"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              style={{
                flex: 1,
                padding: "12px 16px",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                fontSize: "14px",
                outline: "none",
              }}
            />
            <button
              type="submit"
              className="search-btn"
              style={{
                padding: "0 24px",
                borderRadius: "12px",
                border: "none",
                background: "#111827",
                color: "#fff",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              검색
            </button>
            {searchResults !== null && (
              <button
                type="button"
                onClick={() => {
                  setSearchKeyword("");
                  setSearchResults(null);
                }}
                style={{
                  padding: "0 16px",
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                초기화
              </button>
            )}
          </form>
        </div>

        {/* 업종별 필터 버튼 영역 */}
        {industries.length > 0 && (
          <div className="industry-filter-container" style={{
            marginBottom: "20px",
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            padding: "10px",
            backgroundColor: "#f9fafb",
            borderRadius: "12px",
            border: "1px solid #f3f4f6"
          }}>
            {industries.map((industry) => (
              <button
                key={industry}
                onClick={() => {
                  setSelectedIndustry(industry);
                  setPage(1);
                  fetchStocks(1, true, industry, selectedType);
                }}
                style={{
                  padding: "6px 14px",
                  borderRadius: "20px",
                  border: selectedIndustry === industry ? "none" : "1px solid #e5e7eb",
                  backgroundColor: selectedIndustry === industry ? "#4874d4" : "#fff",
                  color: selectedIndustry === industry ? "#fff" : "#4b5563",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                {industry}
              </button>
            ))}
          </div>
        )}

        {/* 종목 구분 필터 버튼 영역 (새로 추가) */}
        <div className="type-filter-container" style={{
          marginBottom: "20px",
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          padding: "10px",
          backgroundColor: "#f0f4ff",
          borderRadius: "12px",
          border: "1px solid #dbeafe"
        }}>
          {["전체", "보통주", "우선주"].map((type) => (
            <button
              key={type}
              onClick={() => {
                const typeValue = type === "전체" ? null : type;
                setSelectedType(typeValue);
                setPage(1);
                fetchStocks(1, true, selectedIndustry, typeValue);
              }}
              style={{
                padding: "6px 14px",
                borderRadius: "20px",
                border: (selectedType === type || (type === "전체" && selectedType === null)) ? "none" : "1px solid #d1d5db",
                backgroundColor: (selectedType === type || (type === "전체" && selectedType === null)) ? "#1e40af" : "#fff",
                color: (selectedType === type || (type === "전체" && selectedType === null)) ? "#fff" : "#374151",
                fontSize: "13px",
                fontWeight: "700",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              {type}
            </button>
          ))}
        </div>


        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div className="stock-tabs" style={{ marginBottom: 0 }}>
            <button
              className={`stock-tab ${activeTab === "all" && searchResults === null ? "active" : ""
                }`}
              onClick={() => {
                setActiveTab("all");
                setSearchResults(null);
                setSearchKeyword("");
              }}
            >
              전체보기
            </button>
            <button
              className={`stock-tab ${activeTab === "favorites" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("favorites");
                setSearchResults(null);
                setSearchKeyword("");
              }}
            >
              관심종목
            </button>
            <button
              className={`stock-tab ${activeTab === "holdings" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("holdings");
                setSearchResults(null);
                setSearchKeyword("");
              }}
            >
              보유 주식
            </button>
            {searchResults !== null && (
              <button className="stock-tab active" style={{ cursor: "default" }}>
                검색 결과 ({searchResults.length})
              </button>
            )}
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              className="refresh-btn"
              onClick={() => {
                setCompareInitialStock(null);
                setIsCompareMode(true);
              }}
              style={{ margin: 0, backgroundColor: "#1e40af", color: "#fff", borderColor: "#1e40af" }}
            >
              📊 종목 비교
            </button>
            <button
              className="refresh-btn"
              onClick={() => {
                setPage(1);
                fetchStocks(1, true);
              }}
              style={{ margin: 0 }}
            >
              새로고침
            </button>
          </div>
        </div>

        <div className="stock-list-container">
          <div className="stock-list-header">
            <div style={{ textAlign: "center" }}>관심</div>
            <div style={{ paddingLeft: "15px" }}>종목명</div>
            <div style={{ textAlign: "right" }}>현재가</div>
            <div style={{ textAlign: "right" }}>등락률</div>
            <div style={{ textAlign: "right", paddingRight: "10px" }}>
              거래대금
            </div>
          </div>

          {(() => {
            if (isSearching) {
              return <div className="no-data">검색 중...</div>;
            }

            if (activeTab === "favorites" && isFavoritesLoading) {
              return <div className="no-data">관심종목을 불러오는 중...</div>;
            }

            if (activeTab === "holdings" && isHoldingsLoading) {
              return <div className="no-data">보유 주식을 불러오는 중...</div>;
            }

            const displayedStocks =
              searchResults !== null
                ? searchResults
                : activeTab === "all"
                  ? stocks
                  : activeTab === "favorites"
                    ? favoriteStocksData
                    : heldStocksData;

            if (displayedStocks.length === 0) {
              return (
                <div className="no-data">
                  {searchResults !== null
                    ? "검색 결과가 없습니다."
                    : activeTab === "favorites"
                      ? "아직 관심 종목이 없습니다. 하트(❤️)를 눌러 나만의 목록을 만들어보세요!"
                      : activeTab === "holdings"
                        ? "현재 보유 중인 주식이 없습니다."
                        : "종목 정보를 가져올 수 없습니다."}
                </div>
              );
            }

            return displayedStocks.map((stock, index) => (
              <StockRow
                key={stock.symbol}
                stock={stock}
                index={index}
                favorites={favorites}
                toggleFavorite={toggleFavorite}
                openAlertSettings={openAlertSettings}
                handleStockClick={handleStockClick}
                getTradingAmountLabel={getTradingAmountLabel}
              />
            ));
          })()}

          {loading && page > 1 && (
            <div className="loading-more">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          )}

          {activeTab === "all" &&
            searchResults === null &&
            !loading &&
            hasMore && (
              <div
                ref={observerTarget}
                style={{ height: "40px", width: "100%" }}
              ></div>
            )}

          {activeTab === "all" &&
            searchResults === null &&
            !hasMore &&
            stocks.length > 0 && (
              <div className="end-of-list">모든 종목을 불러왔습니다.</div>
            )}
        </div>

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={selectedStock?.name}
        >
          <StockDetail
            stock={selectedStock}
            user={user}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
            openAlertSettings={openAlertSettings}
            onOpenCommunity={onOpenCommunity}
            onOpenCompare={() => {
              setCompareInitialStock(selectedStock);
              setIsModalOpen(false);
              setIsCompareMode(true);
            }}
          />
        </Modal>

        {/* 관심종목 알림 설정 모달 */}
        <Modal
          isOpen={alertModalOpen}
          onClose={() => setAlertModalOpen(false)}
          title="관심종목 알림 설정"
        >
          <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#374151', marginBottom: '10px' }}>📉 매수 타이밍 알림</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                {["NONE", "BUY", "STRONG_BUY"].map(lvl => (
                  <button
                    key={lvl}
                    onClick={() => setTempBuyLevel(lvl)}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid',
                      borderColor: tempBuyLevel === lvl ? '#ef4444' : '#e5e7eb',
                      background: tempBuyLevel === lvl ? '#fef2f2' : 'white',
                      color: tempBuyLevel === lvl ? '#ef4444' : '#6b7280',
                      fontSize: '13px', fontWeight: '600', cursor: 'pointer'
                    }}
                  >
                    {lvl === "NONE" ? "안함" : lvl === "BUY" ? "매수 이상" : "강한 매수"}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '28px' }}>
              <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#374151', marginBottom: '10px' }}>📈 매도 타이밍 알림</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                {["NONE", "SELL", "STRONG_SELL"].map(lvl => (
                  <button
                    key={lvl}
                    onClick={() => setTempSellLevel(lvl)}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid',
                      borderColor: tempSellLevel === lvl ? '#2563eb' : '#e5e7eb',
                      background: tempSellLevel === lvl ? '#eff6ff' : 'white',
                      color: tempSellLevel === lvl ? '#2563eb' : '#6b7280',
                      fontSize: '13px', fontWeight: '600', cursor: 'pointer'
                    }}
                  >
                    {lvl === "NONE" ? "안함" : lvl === "SELL" ? "매도 이상" : "강한 매도"}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={confirmUpdateAlert}
              style={{ 
                width: '100%', padding: '14px', borderRadius: '12px', border: 'none', 
                background: '#111827', color: 'white', fontWeight: 'bold', cursor: 'pointer',
                fontSize: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              알림 설정 저장 완료
            </button>
          </div>
        </Modal>
      </div>
      )}
    </div>
  );
};

const styles = {
  page: {
    maxWidth: "1440px",
    margin: "0 auto",
    padding: "28px 20px 56px",
  },
  hero: {
    background: "linear-gradient(135deg, #4874d4, #c6d2e7)",
    border: "none",
    borderRadius: "24px",
    padding: "50px 30px",
    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.1)",
    marginBottom: "20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    position: "relative",
    color: "white",
  },
  heroBadge: {
    display: "inline-block",
    padding: "6px 14px",
    borderRadius: "999px",
    background: "rgba(255, 255, 255, 0.2)",
    color: "#fff",
    fontSize: "12px",
    fontWeight: "800",
    marginBottom: "12px",
    backdropFilter: "blur(4px)",
  },
  heroTitle: {
    margin: "0 0 10px",
    fontSize: "36px",
    fontWeight: "800",
    color: "#fff",
  },
  heroText: {
    margin: 0,
    fontSize: "15px",
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: "1.6",
    maxWidth: "800px",
  },
};

export default StockPage;
