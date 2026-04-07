import React, { useState, useEffect } from "react";
import CandleChart from "./CandleChart";
import AppButton from "../../common/AppButton";
import AppInput from "../../common/AppInput";

const cleanNumber = (val) => {
  if (!val) return 0;
  if (typeof val === "number") return val;
  return parseInt(String(val).replace(/,/g, "")) || 0;
};

const StockDetail = ({ stock, user }) => {
  const [candles, setCandles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [orderSide, setOrderSide] = useState("BUY");
  const [orderType, setOrderType] = useState("MARKET");
  const [targetPrice, setTargetPrice] = useState(0);
  const [period, setPeriod] = useState("1M");
  const [accountData, setAccountData] = useState(null);

  useEffect(() => {
    if (stock) {
      const price = cleanNumber(stock.currentPrice);
      if (orderType === "MARKET") {
        setTargetPrice(price);
      } else if (targetPrice === 0) {
        setTargetPrice(price);
      }
    }
  }, [stock, orderType]);

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
        `http://localhost:8081/api/accounts/my/dashboard?email=${user.email}`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        },
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
  }, [user?.email, user?.token]);

  const handleOrder = async () => {
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    if (!accountData) {
      alert("계좌 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    if (!quantity || quantity <= 0) {
      alert("수량을 입력해주세요.");
      return;
    }

    if (orderType === "LIMIT") {
      const current = Number(stock.currentPrice);
      const base = Number(stock.basePrice) || current;
      const lower = base * 0.7;
      const upper = base * 1.3;
      if (targetPrice < lower || targetPrice > upper) {
        alert(`지정가는 전일 종가 기준 ±30% 이내여야 합니다.\n(가능 범위: ${Math.floor(lower).toLocaleString()} ~ ${Math.ceil(upper).toLocaleString()})`);
        return;
      }
    }

    try {
      const response = await fetch("http://localhost:8081/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          accountId: accountData.id || accountData.accountId || 1,
          stockCode: stock.symbol,
          orderSide,
          orderType,
          quantity: parseInt(quantity),
          price: targetPrice
        }),
      });

      if (!response.ok) {
        const msg = await response.text();
        throw new Error(msg);
      }

      alert(
        `${stock.name} ${quantity}주 ${orderSide === "BUY" ? "매수" : "매도"} 주문이 성공적으로 접수되었습니다.`,
      );
      fetchAccountData();
    } catch (err) {
      alert("주문 실패: " + err.message);
    }
  };

  const handleQuantityChange = (delta) => {
    setQuantity((prev) => Math.max(1, parseInt(prev || 0) + delta));
  };

  const handlePriceChange = (delta) => {
    setTargetPrice((prev) => Math.max(0, parseInt(prev || 0) + delta));
  };

  const applyRatio = (ratio) => {
    if (!accountData || !targetPrice) return;
    const available =
      orderSide === "BUY"
        ? accountData.rawCashBalance
        : (accountData.holdings.find((h) => h.stockName === stock.name)
            ?.quantity || 0);

    if (orderSide === "BUY") {
      const maxQty = Math.floor(available / targetPrice);
      setQuantity(Math.floor(maxQty * ratio));
    } else {
      setQuantity(Math.floor(available * ratio));
    }
  };

  if (!stock) return null;

  return (
    <div className="stock-detail-content">
      <div className="stock-detail-header">
        <div className="price-section">
          <span className="price-big">
            {cleanNumber(stock.currentPrice).toLocaleString()}원
          </span>
          <div
            className={`price-change ${parseFloat(stock.changeRate || 0) >= 0 ? "up" : "down"}`}
          >
            {parseFloat(stock.changeRate || 0) >= 0 ? "▲" : "▼"} {stock.changeAmount || 0}{" "}
            ({stock.changeRate || 0}%)
          </div>
        </div>
        <div className="stat-pill">
          거래량: {cleanNumber(stock.volume).toLocaleString()}
        </div>
      </div>

      <div className="detail-main-layout">
        <div className="chart-container detail-card">
          <div className="section-header">
            <h4 className="section-title">차트</h4>
            <div className="period-tabs">
              {[
                { code: "1D", label: "일" },
                { code: "1W", label: "주" },
                { code: "1M", label: "월" },
                { code: "1Y", label: "년" }
              ].map((p) => (
                <button
                  key={p.code}
                  className={`period-btn ${period === p.code ? "active" : ""}`}
                  onClick={() => setPeriod(p.code)}
                >
                  {p.label}
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

        <div className="trading-section detail-card">
          <div className="trading-form-header">
            <h4>주문하기</h4>
          </div>

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

          <div className="order-type-tabs">
            <button 
                className={`type-tab ${orderType === "MARKET" ? "active" : ""}`}
                onClick={() => setOrderType("MARKET")}
            >
                시장가
            </button>
            <button 
                className={`type-tab ${orderType === "LIMIT" ? "active" : ""}`}
                onClick={() => setOrderType("LIMIT")}
            >
                지정가
            </button>
          </div>

          <div className="trading-form">
            <div className="input-group">
              <label>가격</label>
              <div className="control-input-wrapper">
                <button 
                    className="control-btn" 
                    onClick={() => handlePriceChange(-100)}
                    disabled={orderType === "MARKET"}
                >-</button>
                <AppInput
                    type="number"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(Number(e.target.value))}
                    placeholder="가격을 입력하세요"
                    disabled={orderType === "MARKET"}
                />
                <button 
                    className="control-btn" 
                    onClick={() => handlePriceChange(100)}
                    disabled={orderType === "MARKET"}
                >+</button>
              </div>
              {orderType === "LIMIT" && (
                  <span className="price-hint">
                      전일 종가 대비 ±30% 설정 가능
                  </span>
              )}
            </div>

            <div className="input-with-controls">
              <AppInput
                label="수량 (주)"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                name="quantity"
                placeholder="수량 입력"
              />
              <button className="control-btn" onClick={() => handleQuantityChange(-1)}>-</button>
              <button className="control-btn" onClick={() => handleQuantityChange(1)}>+</button>
            </div>

            <div className="ratio-btn-group">
              <button className="ratio-btn" onClick={() => applyRatio(0.1)}>10%</button>
              <button className="ratio-btn" onClick={() => applyRatio(0.25)}>25%</button>
              <button className="ratio-btn" onClick={() => applyRatio(0.5)}>50%</button>
              <button className="ratio-btn" onClick={() => applyRatio(1)}>최대</button>
            </div>

            <div className="order-summary">
              <div className="summary-row">
                <span>{orderSide === "BUY" ? "주문 가능 금액" : "보유 수량"}</span>
                <span>
                  {orderSide === "BUY"
                    ? (accountData?.cashBalance || "조회 중...")
                    : ((accountData?.holdings?.find((h) => h.stockName === stock.name)?.quantity || 0) + "주")}
                </span>
              </div>
              <div className="summary-row">
                <span>총 주문 금액</span>
                <span className={orderSide === "BUY" ? "up" : "down"}>
                  {(Number(targetPrice || 0) * (Number(quantity) || 0)).toLocaleString()}원
                </span>
              </div>
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
