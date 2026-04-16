import React, { useState, useEffect, useRef, useCallback } from "react";

import Modal from "../common/Modal";
import StockDetail from "../components/stock/StockDetail";

const StockRow = ({
  stock,
  index,
  favorites,
  toggleFavorite,
  handleStockClick,
  getTradingAmountLabel,
}) => {
  return (
    <div
      className="stock-list-item clickable"
      onClick={() => handleStockClick(stock)}
    >
      <button
        className={`favorite-btn ${
          favorites.has(stock.symbol) ? "active" : ""
        }`}
        onClick={(e) => toggleFavorite(e, stock.symbol)}
      >
        {favorites.has(stock.symbol) ? "❤️" : "🤍"}
      </button>

      <div className="stock-index">{index + 1}</div>

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
          className={`rate-text ${
            stock.currentPrice === "0"
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
        `http://localhost:8081/api/stocks?page=${pageNum}&size=20`,
      );
      if (!response.ok) throw new Error("Stock list fetch failed");

      const data = await response.json();

      if (isReset) {
        setStocks(data.content);
      } else {
        setStocks((prev) => {
          const existingSymbols = new Set(prev.map((s) => s.symbol));
          const newStocks = data.content.filter(
            (s) => !existingSymbols.has(s.symbol),
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
        },
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
        },
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
          searchKeyword,
        )}`,
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

  const prevUserEmailRef = useRef(null);

  useEffect(() => {
    // 사용자가 실제로 바뀌었을 때만 리스트와 즐겨찾기를 다시 불러옵니다.
    // 토큰 갱신 등의 사소한 currentUser 변경으로 인한 무한 루프를 방지합니다.
    if (prevUserEmailRef.current !== user?.email) {
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
      prevUserEmailRef.current = user?.email;
    }
  }, [user?.email, fetchStocks, fetchFavorites]);

  useEffect(() => {
    if (activeTab === "favorites") {
      fetchFavoriteDetails();
    }
  }, [activeTab, fetchFavoriteDetails]);

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
          fetchStocks(nextPage, false);
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
  }, [hasMore, loading, page, fetchStocks, activeTab]);

  // 시세 미수집 종목(0원)이 있을 경우 자동으로 정보를 다시 불러오는 로직 (지능형 자동 갱신)
  useEffect(() => {
    if (activeTab !== "all" || loading || stocks.length === 0) return;

    const hasIncompleteData = stocks.some(
      (s) => s.currentPrice === "0" || !s.currentPrice || s.currentPrice === "null"
    );

    if (hasIncompleteData) {
      const timer = setTimeout(() => {
        // 현재 페이지의 정보를 다시 요청하여 캐시된 시세를 가져옵니다.
        // 백엔드에서는 이미 리스트 요청 시 우선순위 큐에 등록했으므로, 
        // 몇 초 뒤에 다시 요청하면 정보가 채워져 있을 확률이 높습니다.
        fetchStocks(page, true);
      }, 3500); // 3.5초 대기 후 재시도

      return () => clearTimeout(timer);
    }
  }, [stocks, loading, page, fetchStocks, activeTab]);

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
        JSON.stringify(Array.from(newFavs)),
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
        },
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
    } catch (e) {
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
          onOpenCommunity={onOpenCommunity}
        />
      </Modal>
    </div>
  </div>
  );
};

const styles = {
  page: {
    maxWidth: "1180px",
    margin: "0 auto",
    padding: "28px 20px 56px",
  },
  hero: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: "16px",
    padding: "40px 30px",
    borderRadius: "24px",
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.05)",
    marginBottom: "16px",
  },
  heroBadge: {
    display: "inline-block",
    padding: "6px 12px",
    borderRadius: "999px",
    background: "#eef2ff",
    color: "#4c6ef5",
    fontSize: "12px",
    fontWeight: "800",
    letterSpacing: "0.06em",
    marginBottom: "4px",
  },
  heroTitle: {
    margin: 0,
    fontSize: "32px",
    fontWeight: "800",
    color: "#111827",
  },
  heroText: {
    margin: 0,
    fontSize: "15px",
    lineHeight: "1.7",
    color: "#6b7280",
    maxWidth: "600px",
  },
};

export default StockPage;
