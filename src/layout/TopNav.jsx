import React from "react";
import AppButton from "../common/AppButton";

const menus = [
  { key: "home", label: "홈" },
  { key: "stock", label: "주식" },
  { key: "contest", label: "대회" },
  { key: "mypage", label: "마이페이지" },
];

const TopNav = ({
  currentPage,
  onMovePage,
  isLoggedIn,
  isAdmin,
  onOpenLogin,
  onLogout,
}) => {
  return (
    <header className="top-nav">
      <div className="top-nav-inner">
        <div className="top-nav-logo" onClick={() => onMovePage("home")}>
          Mock Invest
        </div>

        <nav className="top-nav-menu">
          {menus.map((menu) => (
            <button
              key={menu.key}
              className={`top-nav-link ${currentPage === menu.key ? "active" : ""}`}
              onClick={() => onMovePage(menu.key)}
            >
              {menu.label}
            </button>
          ))}
        </nav>

        <div className="top-nav-right">
          {isLoggedIn ? (
            <>
              {isAdmin ? (
                <AppButton variant="primary" onClick={() => onMovePage("admin")}>
                  관리자
                </AppButton>
              ) : null}
              <AppButton variant="danger" onClick={onLogout}>
                로그아웃
              </AppButton>
            </>
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
