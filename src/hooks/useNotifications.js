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

    // 초기 데이터 로딩 (비동기 호출)
    const loadInitialData = async () => {
      await Promise.all([fetchNotifications(), fetchUnreadCount()]);
    };
    loadInitialData();

    // SSE 연결 설정
    const token = localStorage.getItem("accessToken");
    if (!token) return; // 토큰이 없으면 연결 시도 안 함

    const sseUrl = `http://localhost:8081/api/notifications/subscribe/${userId}`;

    // event-source-polyfill을 사용하여 헤더에 토큰을 포함시킵니다.
    const eventSource = new EventSourcePolyfill(sseUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      heartbeatTimeout: 1860000, // 31분 (서버 타임아웃 30분보다 약간 길게 설정)
    });

    eventSource.addEventListener("connect", (event) => {
      console.log("SSE Connected:", event.data);
    });

    eventSource.addEventListener("notification", (event) => {
      const newNotification = JSON.parse(event.data);
      setNotifications((prev) => [newNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // 브라우저 기본 알람 표시 (권한이 있을 경우)
      if (Notification.permission === "granted") {
        new Notification("주식 알람", { body: newNotification.message });
      }
    });

    eventSource.onerror = (error) => {
      // 인증 에러(401, 403)인 경우에만 로그를 남기고 연결을 종료합니다.
      if (error.status === 401 || error.status === 403) {
        console.error("SSE connection closed due to authentication error");
        eventSource.close();
      }
      // 일반적인 타임아웃이나 일시적 연결 끊김은 polyfill이 자동 재연결하므로 콘솔에 찍지 않습니다.
    };

    return () => {
      eventSource.close();
    };
  }, [userId, fetchNotifications, fetchUnreadCount]);

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
