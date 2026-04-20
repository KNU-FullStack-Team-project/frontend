import React, { useState, useEffect, useCallback } from "react";
import AppButton from "../../common/AppButton";
import "./OrderHistory.css";

const TEXT = {
  loginTokenMissing: "로그인 토큰이 없습니다.",
  loadFailed: "주문 내역을 불러올 수 없습니다.",
  cancelConfirm: "정말 주문을 취소하시겠습니까?",
  canceled: "주문이 취소되었습니다.",
  cancelFailed: "취소 실패: ",
  completed: "체결",
  pending: "미체결",
  canceledStatus: "취소",
  loading: "주문 내역을 불러오는 중입니다...",
  orderHistory: "주문 내역",
  orderDescSuffix: "계좌의 주문 기록입니다.",
  recentOrders: "최근 주문 기록입니다.",
  countSuffix: "건",
  refresh: "새로고침",
  orderedAt: "주문 일시",
  stockName: "종목명",
  stockCode: "종목코드",
  side: "구분",
  quantity: "수량",
  price: "가격",
  status: "상태",
  action: "작업",
  noOrders: "주문 내역이 없습니다.",
  noStockInfo: "종목 정보 없음",
  buy: "매수",
  sell: "매도",
  shares: "주",
  won: "원",
  marketPrice: "시장가",
  cancel: "취소",
};

const OrderHistory = ({ accountId, accountName, currentUser }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("accessToken") || currentUser?.token;

      if (!token) {
        throw new Error(TEXT.loginTokenMissing);
      }

      const response = await fetch(
        `http://localhost:8081/api/orders?accountId=${accountId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Order data fetch failed");

      const data = await response.json();
      setOrders(data);
      setError(null);
    } catch (err) {
      setError(TEXT.loadFailed);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [accountId, currentUser]);

  useEffect(() => {
    if (accountId) {
      fetchOrders();
    }
  }, [accountId, fetchOrders]);

  const handleCancel = async (orderId) => {
    if (!window.confirm(TEXT.cancelConfirm)) return;

    try {
      const token = localStorage.getItem("accessToken") || currentUser?.token;

      if (!token) {
        throw new Error(TEXT.loginTokenMissing);
      }

      const response = await fetch(
        `http://localhost:8081/api/orders/${orderId}/cancel?accountId=${accountId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorMsg = await response.text();
        throw new Error(errorMsg || "Cancel failed");
      }

      alert(TEXT.canceled);
      fetchOrders();
    } catch (err) {
      alert(TEXT.cancelFailed + err.message);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "COMPLETED":
        return "status-completed";
      case "PENDING":
      case "QUEUED":
        return "status-pending";
      case "CANCELED":
        return "status-canceled";
      default:
        return "";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "COMPLETED":
        return TEXT.completed;
      case "PENDING":
      case "QUEUED":
        return TEXT.pending;
      case "CANCELED":
        return TEXT.canceledStatus;
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">{TEXT.loading}</div>
      </div>
    );
  }

  if (error) return <div className="error-message">{error}</div>;

  return (
    <section className="content-card mypage-order-card">
      <div className="mypage-card-header">
        <div>
          <p className="mypage-eyebrow">Orders</p>
          <h2 className="mypage-title">{TEXT.orderHistory}</h2>
          <p className="mypage-subtext">
            {accountName
              ? `${accountName} ${TEXT.orderDescSuffix}`
              : TEXT.recentOrders}
          </p>
        </div>
        <div className="mypage-order-actions">
          <span className="mypage-table-count">
            {`${orders.length}${TEXT.countSuffix}`}
          </span>
          <AppButton variant="secondary" onClick={fetchOrders} size="sm">
            {TEXT.refresh}
          </AppButton>
        </div>
      </div>

      <div className="mypage-table-wrap">
        <table className="stock-table mypage-table">
          <thead>
            <tr>
              <th>{TEXT.orderedAt}</th>
              <th>{TEXT.stockName}</th>
              <th>{TEXT.stockCode}</th>
              <th>{TEXT.side}</th>
              <th>{TEXT.quantity}</th>
              <th>{TEXT.price}</th>
              <th>{TEXT.status}</th>
              <th>{TEXT.action}</th>
            </tr>
          </thead>
          <tbody>
            {!Array.isArray(orders) || orders.length === 0 ? (
              <tr>
                <td colSpan="8" className="mypage-empty-cell">
                  {TEXT.noOrders}
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order?.id}>
                  <td>
                    {order?.orderedAt
                      ? new Date(order.orderedAt).toLocaleString()
                      : "-"}
                  </td>
                  <td>{order?.stock?.stockName ?? TEXT.noStockInfo}</td>
                  <td>{order?.stock?.stockCode ?? "-"}</td>
                  <td className={order?.orderSide === "BUY" ? "up" : "down"}>
                    {order?.orderSide === "BUY" ? TEXT.buy : TEXT.sell}
                  </td>
                  <td>{`${order?.quantity?.toLocaleString() ?? 0}${TEXT.shares}`}</td>
                  <td>
                    {order?.price
                      ? `${order.price.toLocaleString()}${TEXT.won}`
                      : TEXT.marketPrice}
                  </td>
                  <td>
                    <span
                      className={`status-badge ${getStatusBadgeClass(
                        order?.orderStatus
                      )}`}
                    >
                      {getStatusText(order?.orderStatus)}
                    </span>
                  </td>
                  <td>
                    {(order?.orderStatus === "PENDING" ||
                      order?.orderStatus === "QUEUED") && (
                        <button
                          className="btn-cancel"
                          onClick={() => handleCancel(order.id)}
                        >
                          {TEXT.cancel}
                        </button>
                      )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default OrderHistory;
