import React, { useState, useEffect } from "react";
import CandleChart from "./CandleChart";
import AppButton from "../../common/AppButton";
import AppInput from "../../common/AppInput";

const StockDetail = ({ stock, user, onOpenCommunity }) => {
  const [candles, setCandles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [orderSide, setOrderSide] = useState("BUY");
  const [period, setPeriod] = useState("1M");
  const [accountData, setAccountData] = useState(null);
  const [detailTab, setDetailTab] = useState("trade");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/stocks/${stock.symbol}/history?period=${period}`
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

    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      const response = await fetch(`/api/accounts/my/dashboard?email=${user.email}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

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

    if (quantity <= 0) {
      alert("수량은 1주 이상이어야 합니다.");
      return;
    }

    if (
      orderSide === "BUY" &&
      accountData &&
      parseInt(stock.currentPrice) * quantity > accountData.rawCashBalance
    ) {
      alert("잔고가 부족합니다.");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          accountId: accountData.id || accountData.accountId || 1,
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
        `${stock.name} ${quantity}주 ${
          orderSide === "BUY" ? "매수" : "매도"
        } 주문이 성공적으로 접수되었습니다.`
      );
      fetchAccountData();
    } catch (err) {
      alert("주문 실패: " + err.message);
    }
  };

  const handleMoveCommunity = () => {
    if (!stock?.symbol) {
      alert("종목 정보가 없습니다.");
      return;
    }

    if (onOpenCommunity) {
      onOpenCommunity(stock.symbol);
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
            className={`price-change ${
              parseFloat(stock.changeRate) >= 0 ? "up" : "down"
            }`}
          >
            {parseFloat(stock.changeRate) >= 0 ? "▲" : "▼"} {stock.changeAmount} (
            {stock.changeRate}%)
          </div>
        </div>
        <div className="stat-pill">
          거래량: {parseInt(stock.volume).toLocaleString()}
        </div>
      </div>

      <div className="divider" />

      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "18px",
          borderBottom: "1px solid #e5e7eb",
          paddingBottom: "12px",
        }}
      >
        <button
          type="button"
          onClick={() => setDetailTab("trade")}
          style={{
            padding: "10px 16px",
            borderRadius: "10px",
            border: detailTab === "trade" ? "1px solid #111827" : "1px solid #d1d5db",
            background: detailTab === "trade" ? "#111827" : "#fff",
            color: detailTab === "trade" ? "#fff" : "#374151",
            cursor: "pointer",
            fontWeight: "700",
            fontSize: "14px",
          }}
        >
          거래
        </button>

        <button
          type="button"
          onClick={() => setDetailTab("community")}
          style={{
            padding: "10px 16px",
            borderRadius: "10px",
            border:
              detailTab === "community"
                ? "1px solid #111827"
                : "1px solid #d1d5db",
            background: detailTab === "community" ? "#111827" : "#fff",
            color: detailTab === "community" ? "#fff" : "#374151",
            cursor: "pointer",
            fontWeight: "700",
            fontSize: "14px",
          }}
        >
          커뮤니티
        </button>
      </div>

      {detailTab === "trade" ? (
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
                  <span>{orderSide === "BUY" ? "주문 가능 금액" : "보유 수량"}</span>
                  <strong>
                    {orderSide === "BUY"
                      ? accountData
                        ? accountData.cashBalance
                        : "조회 중..."
                      : accountData
                      ? (accountData.holdings.find(
                          (h) => h.stockName === stock.name
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
      ) : (
        <div
          style={{
            background: "#fafafa",
            border: "1px solid #e5e7eb",
            borderRadius: "16px",
            padding: "24px",
          }}
        >
          <div
            style={{
              fontSize: "20px",
              fontWeight: "800",
              color: "#111827",
              marginBottom: "10px",
            }}
          >
            {stock.name} 커뮤니티
          </div>

          <div
            style={{
              fontSize: "14px",
              color: "#6b7280",
              lineHeight: "1.7",
              marginBottom: "18px",
            }}
          >
            이 종목에 대한 투자 의견, 매수/매도 관점, 뉴스 해석, 실시간 반응을
            확인할 수 있습니다.
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "12px",
              marginBottom: "18px",
            }}
          >
            <div
              style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "14px",
              }}
            >
              <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "6px" }}>
                종목명
              </div>
              <div style={{ fontSize: "15px", fontWeight: "800", color: "#111827" }}>
                {stock.name}
              </div>
            </div>

            <div
              style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "14px",
              }}
            >
              <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "6px" }}>
                종목코드
              </div>
              <div style={{ fontSize: "15px", fontWeight: "800", color: "#111827" }}>
                {stock.symbol}
              </div>
            </div>

            <div
              style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "14px",
              }}
            >
              <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "6px" }}>
                현재가
              </div>
              <div style={{ fontSize: "15px", fontWeight: "800", color: "#111827" }}>
                {parseInt(stock.currentPrice).toLocaleString()}원
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleMoveCommunity}
            style={{
              padding: "12px 18px",
              borderRadius: "12px",
              border: "none",
              background: "#111827",
              color: "#fff",
              cursor: "pointer",
              fontWeight: "700",
              fontSize: "14px",
            }}
          >
            {stock.name} 커뮤니티로 이동
          </button>
        </div>
      )}
    </div>
  );
};

export default StockDetail;