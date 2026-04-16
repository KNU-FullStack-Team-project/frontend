import React, { useState } from "react";
import AppButton from "../common/AppButton";
import useNotifications from "../hooks/useNotifications";
import NotificationDropdown from "../components/notification/NotificationDropdown";
import InquiryModal from "../components/inquiry/InquiryModal";

const menus = [
  { key: "home", label: "홈" },
  { key: "stock", label: "주식" },
  { key: "contest", label: "대회" },
  { key: "ranking", label: "랭킹" },
  { key: "community", label: "커뮤니티" },
  { key: "mypage", label: "마이페이지" },
];

const TopNav = ({
  currentPage,
  onMovePage,
  isLoggedIn,
  isAdmin,
  currentUser,
  onOpenLogin,
  onLogout,
}) => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(
    currentUser?.id || currentUser?.userId
  );

  return (
    <header className="top-nav">
      <div className="top-nav-inner">
        <div
          className="top-nav-logo"
          onClick={() => onMovePage("home")}
          style={{ cursor: "pointer" }}
        >
          Mock Invest
        </div>

        <nav className="top-nav-menu">
          {menus.map((menu) => (
            <button
              key={menu.key}
              className={`top-nav-link ${
                currentPage === menu.key ? "active" : ""
              }`}
              onClick={() => onMovePage(menu.key)}
              type="button"
            >
              {menu.label}
            </button>
          ))}
        </nav>

        <div className="top-nav-right">
          {isLoggedIn ? (
            <div className="nav-user-actions" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <button 
                className="inquiry-trigger" 
                onClick={() => setIsInquiryOpen(true)}
                title="1:1 문의하기"
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  fontSize: '20px', 
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                ✉️
              </button>

              <div className="notification-wrapper" style={{ position: 'relative' }}>
                <button 
                  className="notification-trigger" 
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer', 
                    fontSize: '20px', 
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  🔔
                  {unreadCount > 0 && (
                    <span className="unread-badge" style={{
                      position: 'absolute',
                      top: '-5px',
                      right: '-5px',
                      background: '#ff3b30',
                      color: '#fff',
                      fontSize: '10px',
                      borderRadius: '50%',
                      padding: '2px 5px',
                      minWidth: '15px',
                      textAlign: 'center'
                    }}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
                
                {isNotifOpen && (
                  <NotificationDropdown 
                    notifications={notifications}
                    onMarkAsRead={markAsRead}
                    onMarkAllAsRead={markAllAsRead}
                    onClose={() => setIsNotifOpen(false)}
                  />
                )}
              </div>

              <InquiryModal 
                isOpen={isInquiryOpen} 
                onClose={() => setIsInquiryOpen(false)} 
              />

              {isAdmin ? (
                <AppButton
                  variant="primary"
                  onClick={() => onMovePage("admin")}
                >
                  관리자
                </AppButton>
              ) : null}

              <AppButton variant="danger" onClick={onLogout}>
                로그아웃
              </AppButton>
            </div>
          ) : (
            <AppButton variant="primary" onClick={onOpenLogin}>
              로그인
            </AppButton>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopNav;