import React, { useState, useEffect } from "react";
import Modal from "../common/Modal";
import StockDetail from "../components/stock/StockDetail";

const StockPage = ({ user }) => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStock, setSelectedStock] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchStocks = async () => {
    try {
      setLoading(true);
      // 백엔드 API 호출: 주식 리스트와 Redis 캐싱된 현재가 정보 로드
      const response = await fetch("/api/stocks?page=1&size=60");
      if (!response.ok) throw new Error("Stock list fetch failed");
      const data = await response.json();
      setStocks(data.content);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
  }, []);

  const handleStockClick = (stock) => {
    setSelectedStock(stock);
    setIsModalOpen(true);
  };

  if (loading) return <div className="loading-spinner">주식 정보를 업데이트하는 중...</div>;

  return (
    <div className="content-card">
      <div className="section-header">
        <h3>실시간 주식 정보</h3>
        <button className="refresh-btn" onClick={fetchStocks}>새로고침</button>
      </div>
      
      <p className="page-desc">
        현재 시장의 실시간 시세를 확인하세요. 종목을 클릭하면 상세 차트와 함께 매수/매도를 진행할 수 있습니다.
      </p>

      <div className="stock-grid">
        {stocks.length === 0 ? (
            <div className="no-data">종목 정보를 가져올 수 없습니다.</div>
        ) : (
            stocks.map((stock) => (
                <div 
                  key={stock.symbol} 
                  className="mini-stock-card clickable"
                  onClick={() => handleStockClick(stock)}
                >
                  <div className="card-top">
                    <h4>{stock.name}</h4>
                    <span className="stock-code">{stock.symbol}</span>
                  </div>
                  <div className="card-bottom">
                    <p className="price">{parseInt(stock.currentPrice).toLocaleString()}원</p>
                    <span className={`change-pill ${parseFloat(stock.changeRate) >= 0 ? "up" : "down"}`}>
                      {parseFloat(stock.changeRate) >= 0 ? "+" : ""}{stock.changeRate}%
                    </span>
                  </div>
                </div>
              ))
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
