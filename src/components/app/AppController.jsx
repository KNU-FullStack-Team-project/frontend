import React, { useEffect, useState } from "react";

import HomePage from "../../pages/HomePage";
import StockPage from "../../pages/StockPage";
import ContestPage from "../../pages/ContestPage";
import ContestDetailPage from "../../pages/ContestDetailPage";
import MyPage from "../../pages/MyPage";
import AuthPage from "../../pages/AuthPage";
import AdminPage from "../../pages/AdminPage";

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

const ADMIN_EMAIL = "admin@knu.com";

const AppController = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState("home");
  const [pendingPage, setPendingPage] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedCompetitionId, setSelectedCompetitionId] = useState(null);
  const [authMode, setAuthMode] = useState("login");

  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");

    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setCurrentUser(parsedUser);
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = async (form) => {
    try {
      const response = await fetch("http://localhost:8081/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        alert(errorText || "로그인에 실패했습니다.");
        return;
      }

      const data = await response.json();

      const normalizedUser = {
        ...data,
        role:
          data?.role?.toLowerCase?.() ||
          (data?.email?.toLowerCase?.() === ADMIN_EMAIL ? "admin" : "user"),
      };

      setCurrentUser(normalizedUser);
      setIsLoggedIn(true);
      localStorage.setItem("currentUser", JSON.stringify(normalizedUser));

      if (pendingPage) {
        setCurrentPage(pendingPage);
        setPendingPage(null);
      } else {
        setCurrentPage("mypage");
      }
    } catch (error) {
      console.error("로그인 오류:", error);
      alert("서버와 연결할 수 없습니다.");
    }
  };

  const handleSignup = async (form) => {
    try {
      const res = await fetch("http://localhost:8081/users/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
          nickname: form.nickname.trim(),
          marketingConsent: form.marketingConsent,
        }),
      });

      const data = await res.text();

      if (data === "회원가입 완료") {
        setAuthMode("login");
        setCurrentPage("auth");
        return "success";
      } else {
        alert(data);
        return "fail";
      }
    } catch (error) {
      console.error(error);
      alert("회원가입 중 오류가 발생했습니다.");
      return "fail";
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    setCurrentUser(null);
    setIsLoggedIn(false);
    setCurrentPage("home");
  };

  const handleMovePage = (page) => {
    const protectedPages = ["mypage", "admin"];

    if (!isLoggedIn && protectedPages.includes(page)) {
      setPendingPage(page);
      setAuthMode("login");
      setCurrentPage("auth");
      return;
    }

    if (page === "admin" && currentUser?.role !== "admin") {
      return;
    }

    setCurrentPage(page);
  };

  const handleOpenLogin = () => {
    setPendingPage(null);
    setAuthMode("login");
    setCurrentPage("auth");
  };

  const handleSelectCompetition = (competitionId) => {
    setSelectedCompetitionId(competitionId);
    setCurrentPage("contestDetail");
  };

  const handleBackToContestList = () => {
    setCurrentPage("contest");
  };

  if (currentPage === "auth") {
    return (
      <AuthPage
        title={pageTexts.auth.title}
        description={pageTexts.auth.description}
        onLogin={handleLogin}
        onSignup={handleSignup}
        initialMode={authMode}
        onChangeMode={setAuthMode}
      />
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case "stock":
        return <StockPage isLoggedIn={isLoggedIn} user={currentUser} />;

      case "contest":
        return (
          <ContestPage
            isLoggedIn={isLoggedIn}
            currentUser={currentUser}
            onSelectCompetition={handleSelectCompetition}
          />
        );

      case "contestDetail":
        return (
          <ContestDetailPage
            competitionId={selectedCompetitionId}
            isLoggedIn={isLoggedIn}
            currentUser={currentUser}
            onBack={handleBackToContestList}
          />
        );

      case "mypage":
        return <MyPage currentUser={currentUser} />;

      case "admin":
        return <AdminPage />;

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
        isAdmin={currentUser?.role === "admin"}
        onOpenLogin={handleOpenLogin}
        onLogout={handleLogout}
      />

      <main className="site-main">{renderPage()}</main>
    </div>
  );
};

export default AppController;