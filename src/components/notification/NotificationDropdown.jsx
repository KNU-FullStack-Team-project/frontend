import React from 'react';

const NotificationDropdown = ({ notifications, onMarkAsRead, onMarkAllAsRead, onClose }) => {
    return (
        <div className="notification-dropdown">
            <div className="notification-header">
                <h3>알림함</h3>
                <button className="read-all-btn" onClick={onMarkAllAsRead}>모두 읽음</button>
            </div>
            <div className="notification-list">
                {notifications.length === 0 ? (
                    <div className="no-notifications">새로운 알림이 없습니다.</div>
                ) : (
                    notifications.map((n) => (
                        <div 
                            key={n.id} 
                            className={`notification-item ${n.isRead === 1 ? 'read' : 'unread'}`}
                            onClick={() => n.isRead === 0 && onMarkAsRead(n.id)}
                        >
                            <div className="notification-header-row">
                                <span className="notification-type">{n.type === 'ORDER_COMPLETED' ? '체결' : '목표가'}</span>
                                <span className="notification-time">
                                    {new Date(n.createdAt).toLocaleString('ko-KR', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                            </div>
                            <div className="notification-title">{n.title}</div>
                            <div className="notification-message">{n.message}</div>
                        </div>
                    ))
                )}
            </div>
            <div className="notification-footer">
                <button onClick={onClose}>닫기</button>
            </div>

            <style jsx>{`
                .notification-dropdown {
                    position: absolute;
                    top: 55px;
                    right: 0;
                    width: 340px;
                    background: var(--bg, #fff);
                    border-radius: 14px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.12), 0 0 1px rgba(0,0,0,0.1);
                    z-index: 1000;
                    overflow: hidden;
                    border: 1px solid var(--border, #e5e4e7);
                    animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-12px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .notification-header {
                    padding: 16px 20px;
                    background: #fafafa;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid var(--border, #e5e4e7);
                }
                .notification-header h3 {
                    margin: 0;
                    font-size: 16px;
                    font-weight: 700;
                    color: var(--text-h, #08060d);
                }
                .read-all-btn {
                    background: none;
                    border: none;
                    color: var(--accent, #aa3bff);
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 600;
                    padding: 4px 8px;
                    border-radius: 6px;
                    transition: background 0.15s;
                }
                .read-all-btn:hover {
                    background: var(--accent-bg, rgba(170, 59, 255, 0.1));
                }
                .notification-list {
                    max-height: 440px;
                    overflow-y: auto;
                    scrollbar-width: thin;
                    scrollbar-color: var(--border) transparent;
                }
                .notification-list::-webkit-scrollbar {
                    width: 5px;
                }
                .notification-list::-webkit-scrollbar-thumb {
                    background: var(--border);
                    border-radius: 10px;
                }
                .no-notifications {
                    padding: 60px 20px;
                    text-align: center;
                    color: var(--text, #6b6375);
                    font-size: 14px;
                    opacity: 0.7;
                }
                .notification-item {
                    padding: 16px 20px;
                    border-bottom: 1px solid var(--border, #e5e4e7);
                    cursor: pointer;
                    transition: background 0.15s;
                    position: relative;
                }
                .notification-item:last-child {
                    border-bottom: none;
                }
                .notification-item:hover {
                    background: #f9f9fb;
                }
                .notification-item.unread {
                    background: rgba(170, 59, 255, 0.03);
                }
                .notification-item.unread:hover {
                    background: rgba(170, 59, 255, 0.06);
                }
                .notification-item.unread::before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 0;
                    bottom: 0;
                    width: 3px;
                    background: var(--accent, #aa3bff);
                }
                .notification-header-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }
                .notification-type {
                    font-size: 11px;
                    color: var(--accent, #aa3bff);
                    font-weight: 700;
                    background: var(--accent-bg, rgba(170, 59, 255, 0.1));
                    padding: 2px 8px;
                    border-radius: 4px;
                    letter-spacing: -0.2px;
                }
                .notification-title {
                    font-size: 14px;
                    font-weight: 700;
                    color: var(--text-h, #08060d);
                    margin-bottom: 6px;
                }
                .notification-message {
                    font-size: 13px;
                    color: var(--text, #6b6375);
                    line-height: 1.5;
                    margin-bottom: 4px;
                }
                .notification-time {
                    font-size: 10px;
                    color: var(--text, #6b6375);
                    opacity: 0.6;
                }
                .notification-footer {
                    padding: 12px;
                    text-align: center;
                    background: #fafafa;
                    border-top: 1px solid var(--border, #e5e4e7);
                }
                .notification-footer button {
                    background: none;
                    border: none;
                    color: var(--text, #6b6375);
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 500;
                    padding: 6px 12px;
                    border-radius: 6px;
                    transition: background 0.15s;
                }
                .notification-footer button:hover {
                    background: var(--border);
                }
            `}</style>
        </div>
    );
};

export default NotificationDropdown;
