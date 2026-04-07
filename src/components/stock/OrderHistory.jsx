import React, { useState, useEffect, useCallback } from "react";
import AppButton from "../../common/AppButton";

const OrderHistory = ({ accountId, currentUser }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);

      const token =
        localStorage.getItem("accessToken") || currentUser?.token;

      if (!token) {
        throw new Error("로그인 토큰이 없습니다.");
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
      setError("주문 내역을 불러올 수 없습니다.");
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
    if (!window.confirm("정말 주문을 취소하시겠습니까?")) return;

    try {
      const token =
        localStorage.getItem("accessToken") || currentUser?.token;

      if (!token) {
        throw new Error("로그인 토큰이 없습니다.");
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

      alert("주문이 취소되었습니다.");
      fetchOrders();
    } catch (err) {
      alert("취소 실패: " + err.message);
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
        return "체결";
      case "PENDING":
      case "QUEUED":
        return "미체결";
      case "CANCELED":
        return "취소";
      default:
        return status;
    }
  };

  if (loading) return <div className="loading-spinner">로딩 중...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="content-card large" style={{ marginTop: "20px" }}>
      <div className="section-header">
        <h4>주문 내역</h4>
        <AppButton variant="secondary" onClick={fetchOrders} size="small">
          새로고침
        </AppButton>
      </div>

      <div className="table-responsive">
        <table className="stock-table">
          <thead>
            <tr>
              <th>주문 일시</th>
              <th>종목</th>
              <th>구분</th>
              <th>수량</th>
              <th>가격</th>
              <th>상태</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {!Array.isArray(orders) || orders.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    color: "#888",
                  }}
                >
                  주문 내역이 없습니다.
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
                  <td>
                    <div className="stock-info-cell">
                      <span className="stock-name">
                        {order?.stock?.stockName ?? "알 수 없음"}
                      </span>
                      <span className="stock-code">
                        {order?.stock?.stockCode ?? "-"}
                      </span>
                    </div>
                  </td>
                  <td className={order?.orderSide === "BUY" ? "up" : "down"}>
                    {order?.orderSide === "BUY" ? "매수" : "매도"}
                  </td>
                  <td>{order?.quantity?.toLocaleString() ?? 0}주</td>
                  <td>
                    {order?.price
                      ? order.price.toLocaleString() + "원"
                      : "시장가"}
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
                        취소
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderHistory;