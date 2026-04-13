import { useState, useEffect, useCallback } from "react";
import { EventSourcePolyfill } from "event-source-polyfill";

const useNotifications = (userId) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(
        `http://localhost:8081/api/notifications/${userId}`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        },
      );
      if (!res.ok) throw new Error("Failed to fetch notifications");
      const data = await res.json();
      setNotifications(data);
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    }
  }, [userId]);

  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return;
    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(
        `http://localhost:8081/api/notifications/unread-count/${userId}`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        },
      );
      if (!res.ok) throw new Error("Failed to fetch unread count");
      const count = await res.json();
      setUnreadCount(count);
    } catch (e) {
      console.error("Failed to fetch unread count", e);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const loadInitialData = async () => {
      await Promise.all([fetchNotifications(), fetchUnreadCount()]);
    };
    loadInitialData();

    const token = localStorage.getItem("accessToken");
    if (!token) return;

    const sseUrl = `http://localhost:8081/api/notifications/subscribe/${userId}`;

    const eventSource = new EventSourcePolyfill(sseUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      heartbeatTimeout: 1860000,
    });

    eventSource.addEventListener("connect", (event) => {
      console.log("SSE Connected:", event.data);
    });

    eventSource.addEventListener("notification", (event) => {
      const newNotification = JSON.parse(event.data);
      setNotifications((prev) => [newNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      eventSource.close();
    };
  }, [userId]);

  const markAsRead = async (notificationId) => {
    const token = localStorage.getItem("accessToken");
    try {
      await fetch(
        `http://localhost:8081/api/notifications/${notificationId}/read`,
        {
          method: "POST",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        },
      );

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (e) {
      console.error("Failed to mark notification as read", e);
    }
  };

  const markAllAsRead = async () => {
    const token = localStorage.getItem("accessToken");
    try {
      await fetch(
        `http://localhost:8081/api/notifications/read-all/${userId}`,
        {
          method: "POST",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        },
      );

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error("Failed to mark all as read", e);
    }
  };

  return { notifications, unreadCount, markAsRead, markAllAsRead };
};

export default useNotifications;
