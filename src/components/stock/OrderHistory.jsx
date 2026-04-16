import React, { useState, useEffect, useCallback } from "react";
import AppButton from "../../common/AppButton";

const TEXT = {
  loginTokenMissing: "\uB85C\uADF8\uC778 \uD1A0\uD070\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.",
  loadFailed: "\uC8FC\uBB38 \uB0B4\uC5ED\uC744 \uBD88\uB7EC\uC62C \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.",
  cancelConfirm: "\uC815\uB9D0 \uC8FC\uBB38\uC744 \uCDE8\uC18C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?",
  canceled: "\uC8FC\uBB38\uC774 \uCDE8\uC18C\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
  cancelFailed: "\uCDE8\uC18C \uC2E4\uD328: ",
  completed: "\uCCB4\uACB0",
  pending: "\uBBF8\uCCB4\uACB0",
  canceledStatus: "\uCDE8\uC18C",
  loading: "\uC8FC\uBB38 \uB0B4\uC5ED\uC744 \uBD88\uB7EC\uC624\uB294 \uC911\uC785\uB2C8\uB2E4...",
  orderHistory: "\uC8FC\uBB38 \uB0B4\uC5ED",
  orderDescSuffix:
    "\uACC4\uC88C\uC758 \uC8FC\uBB38 \uAE30\uB85D\uC785\uB2C8\uB2E4.",
  recentOrders: "\uCD5C\uADFC \uC8FC\uBB38 \uAE30\uB85D\uC785\uB2C8\uB2E4.",
  countSuffix: "\uAC74",
  refresh: "\uC0C8\uB85C\uACE0\uCE68",
  orderedAt: "\uC8FC\uBB38 \uC77C\uC2DC",
  stockName: "\uC885\uBAA9\uBA85",
  stockCode: "\uC885\uBAA9\uCF54\uB4DC",
  side: "\uAD6C\uBD84",
  quantity: "\uC218\uB7C9",
  price: "\uAC00\uACA9",
  status: "\uC0C1\uD0DC",
  action: "\uC791\uC5C5",
  noOrders: "\uC8FC\uBB38 \uB0B4\uC5ED\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.",
  noStockInfo: "\uC885\uBAA9 \uC815\uBCF4 \uC5C6\uC74C",
  buy: "\uB9E4\uC218",
  sell: "\uB9E4\uB3C4",
  shares: "\uC8FC",
  won: "\uC6D0",
  marketPrice: "\uC2DC\uC7A5\uAC00",
  cancel: "\uCDE8\uC18C",
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
