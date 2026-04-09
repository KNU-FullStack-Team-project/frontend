import { useState, useEffect, useCallback } from 'react';

const useNotifications = (userId) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = useCallback(async () => {
        if (!userId) return;
        try {
            const res = await fetch(`http://localhost:8081/api/notifications/${userId}`);
            const data = await res.json();
            setNotifications(data);
        } catch (e) {
            console.error('알림 목록 조회 실패:', e);
        }
    }, [userId]);

    const fetchUnreadCount = useCallback(async () => {
        if (!userId) return;
        try {
            const res = await fetch(`http://localhost:8081/api/notifications/unread-count/${userId}`);
            const count = await res.json();
            setUnreadCount(count);
        } catch (e) {
            console.error('안읽은 알림수 조회 실패:', e);
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
        const eventSource = new EventSource(`http://localhost:8081/api/notifications/subscribe/${userId}`);

        eventSource.addEventListener('connect', (event) => {
            console.log('SSE Connected:', event.data);
        });

        eventSource.addEventListener('notification', (event) => {
            const newNotification = JSON.parse(event.data);
            setNotifications((prev) => [newNotification, ...prev]);
            setUnreadCount((prev) => prev + 1);
            
            // 브라우저 기본 알람 표시 (권한이 있을 경우)
            if (Notification.permission === 'granted') {
                new Notification('주식 알람', { body: newNotification.message });
            }
        });

        eventSource.onerror = (error) => {
            console.error('SSE Error:', error);
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, [userId, fetchNotifications, fetchUnreadCount]);

    const markAsRead = async (notificationId) => {
        try {
            await fetch(`http://localhost:8081/api/notifications/${notificationId}/read`, { method: 'POST' });
            setNotifications((prev) =>
                prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (e) {
            console.error('알림 읽음 처리 실패:', e);
        }
    };

    const markAllAsRead = async () => {
        try {
            await fetch(`http://localhost:8081/api/notifications/read-all/${userId}`, { method: 'POST' });
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (e) {
            console.error('모든 알림 읽음 처리 실패:', e);
        }
    };

    return { notifications, unreadCount, markAsRead, markAllAsRead };
};

export default useNotifications;
