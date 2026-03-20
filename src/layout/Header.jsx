import React from "react";
import AppButton from "../common/AppButton";

const Header = ({ title, description, isLoggedIn, onLogout, onOpenLogin }) => {
  return (
    <header className="main-header">
      <div>
        <h1 className="header-title">{title}</h1>
        <p className="header-subtitle">{description}</p>
      </div>

      <div className="header-right">
        <input className="header-search" placeholder="종목 검색" />

        {isLoggedIn ? (
          <AppButton variant="danger" onClick={onLogout}>
            로그아웃
          </AppButton>
        ) : (
          <AppButton variant="primary" onClick={onOpenLogin}>
            로그인
          </AppButton>
        )}
      </div>
    </header>
  );
};

export default Header;
