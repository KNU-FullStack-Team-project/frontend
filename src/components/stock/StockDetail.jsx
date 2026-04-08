import React, { useState, useEffect } from "react";
import CandleChart from "./CandleChart";
import AppButton from "../../common/AppButton";
import AppInput from "../../common/AppInput";

const cleanNumber = (val) => {
  if (!val) return 0;
  if (typeof val === "number") return val;
  return parseInt(String(val).replace(/,/g, "")) || 0;
};

const StockDetail = ({ stock, user, onOpenCommunity }) => {
  const [candles, setCandles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [orderSide, setOrderSide] = useState("BUY");
  const [orderType, setOrderType] = useState("MARKET");
  const [targetPrice, setTargetPrice] = useState(0);
  const [period, setPeriod] = useState("1M");
  const [accountData, setAccountData] = useState(null);
  const [detailTab, setDetailTab] = useState("trade");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (stock) {
      const price = cleanNumber(stock.currentPrice);
      if (orderType === "MARKET") {
        setTargetPrice(price);
      } else if (targetPrice === 0) {
        setTargetPrice(price);
      }
    }
  }, [stock, orderType, targetPrice]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `http://localhost:8081/api/stocks/${stock.symbol}/history?period=${period}`
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

  const fetchAccountData = React.useCallback(async () => {
    if (!user?.email) return;

    const token = localStorage.getItem("accessToken") || user?.token;
    if (!token) return;

    try {
      const response = await fetch(
        `http://localhost:8081/api/accounts/my/dashboard?email=${user.email}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAccountData(data);
      }
    } catch (err) {
      console.error("Failed to fetch account data:", err);
    }
  }, [user?.email, user?.token]);

  useEffect(() => {
    fetchAccountData();
  }, [fetchAccountData]);

  const handleOrder = async () => {
    const token = localStorage.getItem("accessToken") || user?.token;

    if (!user || !token) {
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
      const current = cleanNumber(stock.currentPrice);
      const base = cleanNumber(stock.basePrice) || current;
      const lower = base * 0.7;
      const upper = base * 1.3;

      if (targetPrice < lower || targetPrice > upper) {
        alert(
          `지정가는 전일 종가 기준 ±30% 이내여야 합니다.\n(가능 범위: ${Math.floor(
            lower
          ).toLocaleString()} ~ ${Math.ceil(upper).toLocaleString()})`
        );
        return;
      }
    }

    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const requestId = crypto.randomUUID(); // 고유 요청 ID 생성

      const response = await fetch("http://localhost:8081/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          accountId: accountData.id || accountData.accountId || 1,
          stockCode: stock.symbol,
          orderSide,
          orderType,
          quantity: parseInt(quantity),
          price: targetPrice,
          requestId, // 생성된 ID 전송
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
    } finally {
      setIsSubmitting(false);
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
        : accountData.holdings?.find((h) => h.stockName === stock.name)
            ?.quantity || 0;

    if (orderSide === "BUY") {
      const maxQty = Math.floor(available / targetPrice);
      setQuantity(Math.max(1, Math.floor(maxQty * ratio)));
    } else {
      setQuantity(Math.max(1, Math.floor(available * ratio)));
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
            {cleanNumber(stock.currentPrice).toLocaleString()}원
          </span>
          <div
            className={`price-change ${
              parseFloat(stock.changeRate || 0) >= 0 ? "up" : "down"
            }`}
          >
            {parseFloat(stock.changeRate || 0) >= 0 ? "▲" : "▼"}{" "}
            {stock.changeAmount || 0} ({stock.changeRate || 0}%)
          </div>
        </div>
        <div className="stat-pill">
          거래량: {cleanNumber(stock.volume).toLocaleString()}
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
            border:
              detailTab === "trade"
                ? "1px solid #111827"
                : "1px solid #d1d5db",
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
          <div className="chart-container detail-card">
            <div className="section-header">
              <h4 className="section-title">차트</h4>
              <div className="period-tabs">
                {[
                  { code: "1D", label: "일" },
                  { code: "1W", label: "주" },
                  { code: "1M", label: "월" },
                  { code: "1Y", label: "년" },
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
                className={`tab-btn sell ${
                  orderSide === "SELL" ? "active" : ""
                }`}
                onClick={() => setOrderSide("SELL")}
              >
                매도
              </button>
            </div>

            <div className="order-type-tabs">
              <button
                className={`type-tab ${
                  orderType === "MARKET" ? "active" : ""
                }`}
                onClick={() => setOrderType("MARKET")}
              >
                시장가
              </button>
              <button
                className={`type-tab ${
                  orderType === "LIMIT" ? "active" : ""
                }`}
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
                  >
                    -
                  </button>
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
                  >
                    +
                  </button>
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
                <button
                  className="control-btn"
                  onClick={() => handleQuantityChange(-1)}
                >
                  -
                </button>
                <button
                  className="control-btn"
                  onClick={() => handleQuantityChange(1)}
                >
                  +
                </button>
              </div>

              <div className="ratio-btn-group">
                <button className="ratio-btn" onClick={() => applyRatio(0.1)}>
                  10%
                </button>
                <button className="ratio-btn" onClick={() => applyRatio(0.25)}>
                  25%
                </button>
                <button className="ratio-btn" onClick={() => applyRatio(0.5)}>
                  50%
                </button>
                <button className="ratio-btn" onClick={() => applyRatio(1)}>
                  최대
                </button>
              </div>

              <div className="order-summary">
                <div className="summary-row">
                  <span>
                    {orderSide === "BUY" ? "주문 가능 금액" : "보유 수량"}
                  </span>
                  <span>
                    {orderSide === "BUY"
                      ? accountData?.cashBalance || "조회 중..."
                      : (accountData?.holdings?.find(
                          (h) => h.stockName === stock.name
                        )?.quantity || 0) + "주"}
                  </span>
                </div>
                <div className="summary-row">
                  <span>총 주문 금액</span>
                  <span className={orderSide === "BUY" ? "up" : "down"}>
                    {(
                      Number(targetPrice || 0) * (Number(quantity) || 0)
                    ).toLocaleString()}
                    원
                  </span>
                </div>
              </div>

              <AppButton
                variant={orderSide === "BUY" ? "primary" : "danger"}
                fullWidth
                onClick={handleOrder}
                disabled={isSubmitting}
              >
                {isSubmitting ? "처리 중..." : `${stock.name} ${orderSide === "BUY" ? "매수하기" : "매도하기"}`}
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
              <div
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  marginBottom: "6px",
                }}
              >
                종목명
              </div>
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: "800",
                  color: "#111827",
                }}
              >
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
              <div
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  marginBottom: "6px",
                }}
              >
                종목코드
              </div>
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: "800",
                  color: "#111827",
                }}
              >
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
              <div
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  marginBottom: "6px",
                }}
              >
                현재가
              </div>
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: "800",
                  color: "#111827",
                }}
              >
                {cleanNumber(stock.currentPrice).toLocaleString()}원
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