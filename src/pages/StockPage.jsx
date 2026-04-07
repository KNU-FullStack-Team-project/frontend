import React, { useState, useEffect, useRef, useCallback } from "react";

import Modal from "../common/Modal";
import StockDetail from "../components/stock/StockDetail";

const StockRow = ({ stock, index, favorites, toggleFavorite, handleStockClick, getTradingAmountLabel }) => {
  const [localStock, setLocalStock] = useState(stock);
  const rowRef = useRef(null);

  useEffect(() => {
    setLocalStock(stock);
  }, [stock]);

  useEffect(() => {
    if (localStock.currentPrice !== "0") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetch(`http://localhost:8081/api/stocks/${localStock.symbol}`)
            .then((res) => {
              if (!res.ok) throw new Error("Failed");
              return res.json();
            })
            .then((data) => {
              if (data && data.currentPrice && data.currentPrice !== "0") {
                setLocalStock(data);
              }
            })
            .catch((err) => console.error("Lazy load failed:", err));
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = rowRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }
    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [localStock.currentPrice, localStock.symbol]);

  return (
    <div
      ref={rowRef}
      className="stock-list-item clickable"
      onClick={() => handleStockClick(localStock)}
    >
      <button
        className={`favorite-btn ${
          favorites.has(localStock.symbol) ? "active" : ""
        }`}
        onClick={(e) => toggleFavorite(e, localStock.symbol)}
      >
        {favorites.has(localStock.symbol) ? "❤️" : "🤍"}
      </button>

      <div className="stock-index">{index + 1}</div>

      <div className="stock-name-section">
        <span className="stock-name-text">{localStock.name}</span>
      </div>

      <div className="stock-price-section">
        {localStock.currentPrice === "0" 
          ? <span style={{ color: "#9ca3af", fontSize: "12px" }}>조회 중...</span>
          : `${parseInt(localStock.currentPrice).toLocaleString()}원`}
      </div>

      <div className="stock-rate-section">
        <span
          className={`rate-text ${
            localStock.currentPrice === "0" 
              ? "" 
              : parseFloat(localStock.changeRate) >= 0 ? "up" : "down"
          }`}
        >
          {localStock.currentPrice === "0" 
            ? "" 
            : `${parseFloat(localStock.changeRate) >= 0 ? "+" : ""}${localStock.changeRate}%`}
        </span>
      </div>

      <div className="stock-volume-section">
        {getTradingAmountLabel(localStock.currentPrice, localStock.volume)}
      </div>
    </div>
  );
};

const StockPage = ({ user, onOpenCommunity }) => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStock, setSelectedStock] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [favorites, setFavorites] = useState(new Set());
  const [favoriteStocksData, setFavoriteStocksData] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFavoritesLoading, setIsFavoritesLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const observerTarget = useRef(null);

  const handleStockClick = (stock) => {
    setSelectedStock(stock);
    setIsModalOpen(true);
  };

  const fetchStocks = useCallback(async (pageNum = 1, isReset = false) => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:8081/api/stocks?page=${pageNum}&size=20`
      );
      if (!response.ok) throw new Error("Stock list fetch failed");

      const data = await response.json();

      if (isReset) {
        setStocks(data.content);
      } else {
        setStocks((prev) => {
          const existingSymbols = new Set(prev.map((s) => s.symbol));
          const newStocks = data.content.filter(
            (s) => !existingSymbols.has(s.symbol)
          );
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
    const token = localStorage.getItem("accessToken") || user?.token;

    if (!userId || !token) return;

    try {
      const response = await fetch(
        `http://localhost:8081/api/favorites?userId=${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
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
    const token = localStorage.getItem("accessToken") || user?.token;

    if (!userId || !token) return;

    try {
      setIsFavoritesLoading(true);
      const response = await fetch(
        `http://localhost:8081/api/favorites/details?userId=${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
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

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchKeyword.trim()) {
      setSearchResults(null);
      return;
    }

    try {
      setIsSearching(true);
      const response = await fetch(
        `http://localhost:8081/api/stocks/search?keyword=${encodeURIComponent(
          searchKeyword
        )}`
      );
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

  useEffect(() => {
    setPage(1);
    fetchStocks(1, true);

    const userId = user?.userId || user?.id;
    const token = localStorage.getItem("accessToken") || user?.token;

    if (userId && token) {
      fetchFavorites();
    } else {
      const savedFavs = localStorage.getItem("favoriteStocks");
      if (savedFavs) {
        setFavorites(new Set(JSON.parse(savedFavs)));
      }
    }
  }, [user, fetchStocks, fetchFavorites]);

  useEffect(() => {
    if (activeTab === "favorites") {
      fetchFavoriteDetails();
    }
  }, [activeTab, fetchFavoriteDetails]);

  useEffect(() => {
    if (activeTab !== "all") return;

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
  }, [hasMore, loading, page, fetchStocks, activeTab]);

  const toggleFavorite = async (e, symbol) => {
    e.stopPropagation();

    const userId = user?.userId || user?.id;
    const token = localStorage.getItem("accessToken") || user?.token;

    if (!userId || !token) {
      const newFavs = new Set(favorites);
      if (newFavs.has(symbol)) {
        newFavs.delete(symbol);
      } else {
        newFavs.add(symbol);
      }
      setFavorites(newFavs);
      localStorage.setItem(
        "favoriteStocks",
        JSON.stringify(Array.from(newFavs))
      );
      alert("로그인이 필요한 기능입니다. (현재는 로컬에만 저장됩니다)");
      return;
    }

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
          method,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("서버 응답 오류");
      }

      if (activeTab === "favorites") {
        fetchFavoriteDetails();
      }
    } catch (err) {
      console.error("Failed to toggle favorite:", err);

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

  if (loading && page === 1 && stocks.length === 0) {
    return (
      <div className="loading-spinner">주식 정보를 업데이트하는 중...</div>
    );
  }

  return (
    <div className="content-card">
      <div className="section-header">
        <h3>실시간 주식 정보</h3>
        <button
          className="refresh-btn"
          onClick={() => {
            setPage(1);
            fetchStocks(1, true);
          }}
        >
          새로고침
        </button>
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

      <p className="page-desc">
        현재 시장의 실시간 시세를 확인하세요. 종목을 클릭하면 상세 차트와 함께
        매수/매도를 진행할 수 있습니다.
      </p>

      <div className="stock-tabs">
        <button
          className={`stock-tab ${
            activeTab === "all" && searchResults === null ? "active" : ""
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
        {searchResults !== null && (
          <button className="stock-tab active" style={{ cursor: "default" }}>
            검색 결과 ({searchResults.length})
          </button>
        )}
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
          if (isSearching) {
            return <div className="no-data">검색 중...</div>;
          }

          if (activeTab === "favorites" && isFavoritesLoading) {
            return <div className="no-data">관심종목을 불러오는 중...</div>;
          }

          const displayedStocks =
            searchResults !== null
              ? searchResults
              : activeTab === "all"
              ? stocks
              : favoriteStocksData;

          if (displayedStocks.length === 0) {
            return (
              <div className="no-data">
                {searchResults !== null
                  ? "검색 결과가 없습니다."
                  : activeTab === "favorites"
                  ? "관심종목이 없습니다. 별표를 눌러 추가해보세요!"
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

        {activeTab === "all" && searchResults === null && !loading && hasMore && (
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
          onOpenCommunity={onOpenCommunity}
        />
      </Modal>
    </div>
  );
};

export default StockPage;