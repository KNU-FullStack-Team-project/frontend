import React, { useState, useEffect, useRef, useCallback } from "react";

import Modal from "../common/Modal";
import StockDetail from "../components/stock/StockDetail";

const StockPage = ({ user }) => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStock, setSelectedStock] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [favorites, setFavorites] = useState(new Set());
  const [activeTab, setActiveTab] = useState("all"); // 'all' or 'favorites'
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef(null);

  const handleStockClick = (stock) => {
    setSelectedStock(stock);
    setIsModalOpen(true);
  };

  const fetchStocks = useCallback(async (pageNum = 1, isReset = false) => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:8081/api/stocks?page=${pageNum}&size=20`,
      );
      if (!response.ok) throw new Error("Stock list fetch failed");
      const data = await response.json();
      
      if (isReset) {
        setStocks(data.content);
      } else {
        setStocks((prev) => {
          // 중복 방지를 위한 간단한 로직
          const existingSymbols = new Set(prev.map(s => s.symbol));
          const newStocks = data.content.filter(s => !existingSymbols.has(s.symbol));
          return [...prev, ...newStocks];
        });
      }
      
      setHasMore(data.content.length > 0 && data.currentPage < data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFavorites = useCallback(async () => {
    const userId = user?.userId || user?.id;
    if (!userId) return;
    try {
      const response = await fetch(
        `http://localhost:8081/api/favorites?userId=${userId}`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        },
      );
      if (response.ok) {
        const data = await response.json();
        setFavorites(new Set(data));
      }
    } catch (err) {
      console.error("Failed to fetch favorites:", err);
    }
  }, [user?.userId, user?.id, user?.token]);

  useEffect(() => {
    setPage(1);
    fetchStocks(1, true);
    
    const userId = user?.userId || user?.id;
    if (userId) {
      fetchFavorites();
    } else {
      const savedFavs = localStorage.getItem("favoriteStocks");
      if (savedFavs) {
        setFavorites(new Set(JSON.parse(savedFavs)));
      }
    }
  }, [user?.userId, user?.id, fetchStocks, fetchFavorites]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchStocks(nextPage, false);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [hasMore, loading, page, fetchStocks]);

  const toggleFavorite = async (e, symbol) => {
    e.stopPropagation();

    const userId = user?.userId || user?.id;
    if (!userId) {
      // 로그인하지 않은 경우 기존 로컬스토리지 방식 유지
      const newFavs = new Set(favorites);
      if (newFavs.has(symbol)) {
        newFavs.delete(symbol);
      } else {
        newFavs.add(symbol);
      }
      setFavorites(newFavs);
      localStorage.setItem(
        "favoriteStocks",
        JSON.stringify(Array.from(newFavs)),
      );
      alert("로그인이 필요한 기능입니다. (현재는 로컬에만 저장됩니다)");
      return;
    }

    // 낙관적 업데이트 (Optimistic Update): UI를 먼저 변경
    const isFavorite = favorites.has(symbol);
    const newFavs = new Set(favorites);
    if (isFavorite) {
      newFavs.delete(symbol);
    } else {
      newFavs.add(symbol);
    }
    setFavorites(newFavs);

    try {
      const method = isFavorite ? "DELETE" : "POST";
      const response = await fetch(
        `http://localhost:8081/api/favorites/${symbol}?userId=${userId}`,
        {
          method: method,
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("서버 응답 오류");
      }
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
      // 에러 발생 시 원래 상태로 복구
      const revertFavs = new Set(favorites);
      if (isFavorite) {
        revertFavs.add(symbol);
      } else {
        revertFavs.delete(symbol);
      }
      setFavorites(revertFavs);
      alert("관심종목 반영에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const getTradingAmountLabel = (price, volume) => {
    if (!price || !volume) return "0원";
    const amount = parseInt(price) * parseInt(volume);

    if (amount >= 100000000) {
      return (amount / 100000000).toFixed(1) + "억원";
    } else if (amount >= 10000) {
      return (amount / 10000).toLocaleString() + "만원";
    }
    return amount.toLocaleString() + "원";
  };

  if (loading && page === 1 && stocks.length === 0)
    return (
      <div className="loading-spinner">주식 정보를 업데이트하는 중...</div>
    );

  return (
    <div className="content-card">
      <div className="section-header">
        <h3>실시간 주식 정보</h3>
        <button className="refresh-btn" onClick={fetchStocks}>
          새로고침
        </button>
      </div>

      <p className="page-desc">
        현재 시장의 실시간 시세를 확인하세요. 종목을 클릭하면 상세 차트와 함께
        매수/매도를 진행할 수 있습니다.
      </p>

      <div className="stock-tabs">
        <button
          className={`stock-tab ${activeTab === "all" ? "active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          전체보기
        </button>
        <button
          className={`stock-tab ${activeTab === "favorites" ? "active" : ""}`}
          onClick={() => setActiveTab("favorites")}
        >
          관심종목
        </button>
      </div>

      <div className="stock-list-container">
        <div className="stock-list-header">
          <div style={{ textAlign: "center" }}>관심</div>
          <div style={{ textAlign: "center" }}>순번</div>
          <div style={{ paddingLeft: "15px" }}>종목명</div>
          <div style={{ textAlign: "right" }}>현재가</div>
          <div style={{ textAlign: "right" }}>등락률</div>
          <div style={{ textAlign: "right", paddingRight: "10px" }}>
            거래대금
          </div>
        </div>

        {(() => {
          const displayedStocks =
            activeTab === "all"
              ? stocks
              : stocks.filter((s) => favorites.has(s.symbol));

          if (displayedStocks.length === 0) {
            return (
              <div className="no-data">
                {activeTab === "favorites"
                  ? "관심종목이 없습니다. 별표를 눌러 추가해보세요!"
                  : "종목 정보를 가져올 수 없습니다."}
              </div>
            );
          }

          return displayedStocks.map((stock, index) => (
            <div
              key={stock.symbol}
              className="stock-list-item clickable"
              onClick={() => handleStockClick(stock)}
            >
              <button
                className={`favorite-btn ${favorites.has(stock.symbol) ? "active" : ""}`}
                onClick={(e) => toggleFavorite(e, stock.symbol)}
              >
                {favorites.has(stock.symbol) ? "❤️" : "🤍"}
              </button>

              <div className="stock-index">{index + 1}</div>

              <div className="stock-name-section">
                <span className="stock-name-text">{stock.name}</span>
              </div>

              <div className="stock-price-section">
                {parseInt(stock.currentPrice).toLocaleString()}원
              </div>

              <div className="stock-rate-section">
                <span
                  className={`rate-text ${parseFloat(stock.changeRate) >= 0 ? "up" : "down"}`}
                >
                  {parseFloat(stock.changeRate) >= 0 ? "+" : ""}
                  {stock.changeRate}%
                </span>
              </div>

              <div className="stock-volume-section">
                {getTradingAmountLabel(stock.currentPrice, stock.volume)}
              </div>
            </div>
          ));
        })()}

        {loading && page > 1 && (
          <div className="loading-more">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        )}
        
        {/* 무한 스크롤 트리거 요소 */}
        {!loading && hasMore && (
          <div ref={observerTarget} style={{ height: "40px", width: "100%" }}></div>
        )}

        {!hasMore && stocks.length > 0 && activeTab === "all" && (
          <div className="end-of-list">모든 종목을 불러왔습니다.</div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedStock?.name}
      >
        <StockDetail stock={selectedStock} user={user} />
      </Modal>
    </div>
  );
};

export default StockPage;
