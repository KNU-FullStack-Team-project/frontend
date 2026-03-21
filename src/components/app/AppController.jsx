import React, { useState } from "react";

import HomePage from "../../pages/HomePage";
import StockPage from "../../pages/StockPage";
import ContestPage from "../../pages/ContestPage";
import MyPage from "../../pages/MyPage";
import AuthPage from "../../pages/AuthPage";

import TopNav from "../../layout/TopNav";

import "../../auth.css";

const pageTexts = {
  home: {
    title: "모의투자 플랫폼",
    description: "안전하게 연습하고, 실전 감각을 키워보세요.",
  },
  stock: {
    title: "주식",
    description: "종목 정보와 시장 흐름을 확인해보세요.",
  },
  contest: {
    title: "대회",
    description: "랭킹과 대회 정보를 확인해보세요.",
  },
  mypage: {
    title: "마이페이지",
    description: "내 자산과 투자 기록을 관리해보세요.",
  },
  auth: {
    title: "모의투자 시작하기",
    description: "가상 자산으로 안전하게 투자 연습을 시작해보세요.",
  },
};

const AppController = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState("home");
  const [pendingPage, setPendingPage] = useState(null);

  const handleLogin = (form) => {
    console.log("로그인 입력값:", form);

    setIsLoggedIn(true);

    if (pendingPage) {
      setCurrentPage(pendingPage);
      setPendingPage(null);
    } else {
      setCurrentPage("home");
    }
  };

  const handleSignup = (form) => {
    console.log("회원가입 입력값:", form);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentPage("home");
  };

  const handleMovePage = (page) => {
    const protectedPages = ["mypage"];

    if (!isLoggedIn && protectedPages.includes(page)) {
      setPendingPage(page);
      setCurrentPage("auth");
      return;
    }

    setCurrentPage(page);
  };

  const handleOpenLogin = () => {
    setPendingPage(null);
    setCurrentPage("auth");
  };

  if (currentPage === "auth") {
    return (
      <AuthPage
        title={pageTexts.auth.title}
        description={pageTexts.auth.description}
        onLogin={handleLogin}
        onSignup={handleSignup}
      />
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case "stock":
        return <StockPage isLoggedIn={isLoggedIn} />;
      case "contest":
        return <ContestPage isLoggedIn={isLoggedIn} />;
      case "mypage":
        return <MyPage />;
      case "home":
      default:
        return (
          <HomePage isLoggedIn={isLoggedIn} onOpenLogin={handleOpenLogin} />
        );
    }
  };

  return (
    <div className="site-layout">
      <TopNav
        currentPage={currentPage}
        onMovePage={handleMovePage}
        isLoggedIn={isLoggedIn}
        onOpenLogin={handleOpenLogin}
        onLogout={handleLogout}
      />

      <main className="site-main">{renderPage()}</main>
    </div>
  );
};

export default AppController;
