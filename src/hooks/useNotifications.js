import { useState, useEffect, useCallback } from "react";
import { EventSourcePolyfill } from "event-source-polyfill";

const useNotifications = (user) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const userId = user?.id || user?.userId;
  const token = user?.token;

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(
        `/api/notifications/${userId}`
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
    try {
      const res = await fetch(
        `/api/notifications/unread-count/${userId}`
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

    const sseUrl = `/api/notifications/subscribe/${userId}${token ? `?token=${token}` : ""}`;
 
     const eventSource = new EventSourcePolyfill(sseUrl, {
       withCredentials: true,
       heartbeatTimeout: 1860000,
     });

    eventSource.addEventListener("connect", () => {
      // console.log("SSE Connected:", event.data);
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
    try {
      await fetch(
        `/api/notifications/${notificationId}/read`,
        {
          method: "POST"
        }
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
    try {
      await fetch(
        `/api/notifications/read-all/${userId}`,
        {
          method: "POST"
        }
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
