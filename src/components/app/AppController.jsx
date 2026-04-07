import React, { useEffect, useState } from "react";

import HomePage from "../../pages/HomePage";
import StockPage from "../../pages/StockPage";
import ContestPage from "../../pages/ContestPage";
import ContestDetailPage from "../../pages/ContestDetailPage";
import ContestCreatePage from "../../pages/ContestCreatePage";
import ContestEditPage from "../../pages/ContestEditPage";
import MyPage from "../../pages/MyPage";
import AccountSettingsPage from "../../pages/AccountSettingsPage";
import AuthPage from "../../pages/AuthPage";
import AdminPage from "../../pages/AdminPage";
import RankingPage from "../../pages/RankingPage";
import CommunityPage from "../../pages/CommunityPage";
import StockCommunityPage from "../../pages/StockCommunityPage";
import CommunityPostDetailPage from "../../pages/CommunityPostDetailPage";

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
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedMyPageUser, setSelectedMyPageUser] = useState(null);
  const [selectedCompetitionId, setSelectedCompetitionId] = useState(null);
  const [selectedCommunitySymbol, setSelectedCommunitySymbol] = useState(null);
  const [selectedCommunityPostId, setSelectedCommunityPostId] = useState(null);
  const [authMode, setAuthMode] = useState("login");

  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    const savedToken = localStorage.getItem("accessToken");

    if (savedUser && savedToken) {
      const parsedUser = JSON.parse(savedUser);
      setCurrentUser(parsedUser);
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = async (form) => {
    try {
      const res = await fetch("http://localhost:8081/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.message || "로그인에 실패했습니다.");
        return;
      }

      if (data.message === "로그인 성공") {
        const loginUser = {
          userId: data.userId,
          email: data.email,
          nickname: data.nickname,
          role: data.role === "ADMIN" ? "admin" : "user",
          accountId: data.accountId,
        };

        setCurrentUser(loginUser);
        setIsLoggedIn(true);

        localStorage.setItem("currentUser", JSON.stringify(loginUser));
        localStorage.setItem("accessToken", data.token || "");

        if (pendingPage) {
          setCurrentPage(pendingPage);
          setPendingPage(null);
        } else {
          setCurrentPage("home");
        }
      } else {
        alert(data.message || "로그인 실패");
      }
    } catch (error) {
      console.error("로그인 오류:", error);
      alert("로그인 오류");
    }
  };

  const handleSignup = async (form) => {
    try {
      const res = await fetch("http://localhost:8081/users/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
          nickname: form.nickname.trim(),
          marketingConsent: form.marketingConsent,
        }),
      });

      const data = await res.text();

      if (data === "회원가입 완료") {
        if (form.profileImageFile) {
          const profileFormData = new FormData();
          profileFormData.append("image", form.profileImageFile);

          const params = new URLSearchParams({ email: form.email.trim() });
          const imageResponse = await fetch(
            `http://localhost:8081/users/profile-image?${params.toString()}`,
            {
              method: "POST",
              body: profileFormData,
            }
          );

          if (!imageResponse.ok) {
            const imageError = await imageResponse.text();
            alert(
              imageError ||
                "회원가입은 완료됐지만 프로필 사진 저장에 실패했습니다."
            );
          }
        }

        alert("회원가입이 완료되었습니다. 로그인해 주세요.");
        setAuthMode("login");
        setCurrentPage("auth");
      } else {
        alert(data);
      }
    } catch (error) {
      alert("회원가입 오류");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("accessToken");
    setCurrentUser(null);
    setIsLoggedIn(false);
    setCurrentPage("home");
    setSelectedCompetitionId(null);
    setSelectedMyPageUser(null);
    setSelectedCommunitySymbol(null);
    setSelectedCommunityPostId(null);
  };

  const handleViewRanking = (competitionId, status) => {
    if (status === "SCHEDULED") {
      alert("예정된 대회는 랭킹을 조회할 수 없습니다.");
      return;
    }

    setSelectedCompetitionId(competitionId);
    setCurrentPage("ranking");
  };

  const handleMovePage = (page) => {
    const protectedPages = ["mypage", "admin"];

    if (!isLoggedIn && protectedPages.includes(page)) {
      setPendingPage(page);
      setAuthMode("login");
      setCurrentPage("auth");
      return;
    }

    if (page === "admin" && currentUser?.role !== "admin") return;

    if (page === "mypage") {
      setSelectedMyPageUser(null);
    }

    if (page === "ranking") {
      setSelectedCompetitionId(null);
    }

    if (page === "community") {
      setSelectedCommunitySymbol(null);
      setSelectedCommunityPostId(null);
    }

    setCurrentPage(page);
  };

  const handleOpenLogin = () => {
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

  const handleCreateCompetition = () => {
    setSelectedCompetitionId(null);
    setCurrentPage("contestCreate");
  };

  const handleEditCompetition = (competitionId) => {
    setSelectedCompetitionId(competitionId);
    setCurrentPage("contestEdit");
  };

  const handleCompetitionSaved = () => {
    setCurrentPage("contest");
    setSelectedCompetitionId(null);
  };

  const handleDeleteCompetition = async (competitionId) => {
    try {
      const token = localStorage.getItem("accessToken");

      const res = await fetch(
        `http://localhost:8081/api/admin/competitions/${competitionId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const text = await res.text();

      if (!res.ok) {
        alert(text || "삭제 실패");
        return false;
      }

      alert(text || "삭제 완료");
      setSelectedCompetitionId(null);
      return true;
    } catch (e) {
      alert("삭제 오류");
      return false;
    }
  };

  const handleMoveToStockCommunity = (symbol) => {
    setSelectedCommunitySymbol(symbol);
    setSelectedCommunityPostId(null);
    setCurrentPage("stockCommunity");
  };

  const handleBackToCommunityMain = () => {
    setCurrentPage("community");
    setSelectedCommunitySymbol(null);
    setSelectedCommunityPostId(null);
  };

  const handleOpenCommunityPostDetail = (postId) => {
    setSelectedCommunityPostId(postId);
    setCurrentPage("communityPostDetail");
  };

  const handleBackToStockCommunity = () => {
    setCurrentPage("stockCommunity");
    setSelectedCommunityPostId(null);
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
        return (
          <StockPage
            isLoggedIn={isLoggedIn}
            user={currentUser}
            onOpenCommunity={handleMoveToStockCommunity}
          />
        );

      case "contest":
        return (
          <ContestPage
            isLoggedIn={isLoggedIn}
            currentUser={currentUser}
            onSelectCompetition={handleSelectCompetition}
            onCreateCompetition={handleCreateCompetition}
            onEditCompetition={handleEditCompetition}
            onDeleteCompetition={handleDeleteCompetition}
            onViewRanking={handleViewRanking}
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

      case "contestCreate":
        return (
          <ContestCreatePage
            currentUser={currentUser}
            onBack={handleBackToContestList}
            onSuccess={handleCompetitionSaved}
          />
        );

      case "contestEdit":
        return (
          <ContestEditPage
            competitionId={selectedCompetitionId}
            currentUser={currentUser}
            onBack={handleBackToContestList}
            onSuccess={handleCompetitionSaved}
          />
        );

      case "ranking":
        return (
          <RankingPage
            selectedCompetitionId={selectedCompetitionId}
            currentUser={currentUser}
            isLoggedIn={isLoggedIn}
          />
        );

      case "community":
        return (
          <CommunityPage
            onSelectStockCommunity={handleMoveToStockCommunity}
          />
        );

      case "stockCommunity":
        return (
          <StockCommunityPage
            symbol={selectedCommunitySymbol}
            currentUser={currentUser}
            isLoggedIn={isLoggedIn}
            onBack={handleBackToCommunityMain}
            onSelectPost={handleOpenCommunityPostDetail}
          />
        );

      case "communityPostDetail":
        return (
          <CommunityPostDetailPage
            postId={selectedCommunityPostId}
            currentUser={currentUser}
            isLoggedIn={isLoggedIn}
            onBack={handleBackToStockCommunity}
          />
        );

      case "mypage":
        return (
          <MyPage
            currentUser={currentUser}
            viewedUser={selectedMyPageUser}
            onMoveAccountSettings={() => setCurrentPage("accountSettings")}
          />
        );

      case "accountSettings":
        return (
          <AccountSettingsPage
            currentUser={currentUser}
            onLogout={handleLogout}
            onBackToMyPage={() => setCurrentPage("mypage")}
          />
        );

      case "admin":
        return (
          <AdminPage
            onOpenUserMyPage={(user) => {
              setSelectedMyPageUser(user);
              setCurrentPage("mypage");
            }}
          />
        );

      default:
        return (
          <HomePage
            isLoggedIn={isLoggedIn}
            onOpenLogin={handleOpenLogin}
            currentUser={currentUser}
          />
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