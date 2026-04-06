import React, { useState, useEffect } from "react";
import CandleChart from "./CandleChart";
import AppButton from "../../common/AppButton";
import AppInput from "../../common/AppInput";

const StockDetail = ({ stock, user }) => {
  const [candles, setCandles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [orderSide, setOrderSide] = useState("BUY");
  const [period, setPeriod] = useState("1M");
  const [accountData, setAccountData] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `http://localhost:8081/api/stocks/${stock.symbol}/history?period=${period}`,
        );
        if (!response.ok) throw new Error("Failed to fetch history");
        const data = await response.json();
        setCandles(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (stock) fetchHistory();
  }, [stock, period]);

  const fetchAccountData = async () => {
    if (!user?.email) return;
    try {
      const response = await fetch(
        `/api/accounts/my/dashboard?email=${user.email}`,
      );
      if (response.ok) {
        const data = await response.json();
        setAccountData(data);
      }
    } catch (err) {
      console.error("Failed to fetch account data:", err);
    }
  };

  useEffect(() => {
    fetchAccountData();
  }, [user?.email]);

  const handleOrder = async () => {
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    if (!accountData) {
      alert("계좌 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    // 수량 확인
    if (quantity <= 0) {
      alert("수량은 1주 이상이어야 합니다.");
      return;
    }

    // 매수 시 잔고 확인
    if (
      orderSide === "BUY" &&
      accountData &&
      parseInt(stock.currentPrice) * quantity > accountData.rawCashBalance
    ) {
      alert("잔고가 부족합니다.");
      return;
    }

    try {
      const response = await fetch("http://localhost:8081/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          accountId: accountData.id || accountData.accountId || 1, // DTO 구조에 따라 조정 필요
          stockCode: stock.symbol,
          orderSide,
          orderType: "MARKET",
          quantity: parseInt(quantity),
        }),
      });

      if (!response.ok) {
        const msg = await response.text();
        throw new Error(msg);
      }

      alert(
        `${stock.name} ${quantity}주 ${orderSide === "BUY" ? "매수" : "매도"} 주문이 성공적으로 접수되었습니다.`,
      );
      fetchAccountData(); // 주문 후 잔고 갱신
    } catch (err) {
      alert("주문 실패: " + err.message);
    }
  };

  if (!stock) return null;

  return (
    <div className="stock-detail-content">
      <div className="stock-detail-header">
        <div className="price-section">
          <span className="price-big">
            {parseInt(stock.currentPrice).toLocaleString()}원
          </span>
          <div
            className={`price-change ${parseFloat(stock.changeRate) >= 0 ? "up" : "down"}`}
          >
            {parseFloat(stock.changeRate) >= 0 ? "▲" : "▼"} {stock.changeAmount}{" "}
            ({stock.changeRate}%)
          </div>
        </div>
        <div className="stat-pill">
          거래량: {parseInt(stock.volume).toLocaleString()}
        </div>
      </div>

      <div className="divider" />

      <div className="detail-main-layout">
        <div className="chart-container">
          <div className="section-header">
            <h4 className="section-title">차트</h4>
            <div className="period-tabs">
              {["1D", "1W", "1M", "6M", "1Y"].map((p) => (
                <button
                  key={p}
                  className={`period-btn ${period === p ? "active" : ""}`}
                  onClick={() => setPeriod(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          {loading ? (
            <div className="loading-placeholder">
              차트 데이터를 불러오는 중...
            </div>
          ) : (
            <CandleChart data={candles} />
          )}
        </div>

        <div className="trading-section">
          <div className="trading-tabs">
            <button
              className={`tab-btn buy ${orderSide === "BUY" ? "active" : ""}`}
              onClick={() => setOrderSide("BUY")}
            >
              매수
            </button>
            <button
              className={`tab-btn sell ${orderSide === "SELL" ? "active" : ""}`}
              onClick={() => setOrderSide("SELL")}
            >
              매도
            </button>
          </div>

          <div className="trading-form">
            <AppInput
              label="수량 (주)"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              name="quantity"
              placeholder="수량 입력"
            />
            <div className="order-info">
              <div className="info-row">
                <span>
                  {orderSide === "BUY" ? "주문 가능 금액" : "보유 수량"}
                </span>
                <strong>
                  {orderSide === "BUY"
                    ? accountData
                      ? accountData.cashBalance
                      : "조회 중..."
                    : accountData
                      ? (accountData.holdings.find(
                          (h) => h.stockName === stock.name,
                        )?.quantity || 0) + "주"
                      : "조회 중..."}
                </strong>
              </div>
            </div>
            <div className="order-preview">
              <span>주문 금액(예상)</span>
              <strong className={orderSide === "BUY" ? "up" : "down"}>
                {(parseInt(stock.currentPrice) * quantity).toLocaleString()}원
              </strong>
            </div>
            <AppButton
              variant={orderSide === "BUY" ? "primary" : "danger"}
              fullWidth
              onClick={handleOrder}
            >
              {stock.name} {orderSide === "BUY" ? "매수하기" : "매도하기"}
            </AppButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockDetail;
