import React, { useEffect, useState, useRef, useCallback } from "react";

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
import CommunityPostWritePage from "../../pages/CommunityPostWritePage";

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
  ranking: {
    title: "대회 랭킹",
    description: "현재 진행 중인 대회의 순위를 확인하세요.",
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

  // --- 자동 로그아웃 (인액티비티 타이머) 로직 ---
  const inactivityTimerRef = useRef(null);
  const autoLogoutTimeoutRef = useRef(null);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);

    if (isLoggedIn) {
      // 활동이 감지되면 인액티비티 타이머 리셋 (30분)
      inactivityTimerRef.current = setTimeout(
        () => {
          alert(
            "30분 동안 활동이 없어 보안을 위해 자동으로 로그아웃되었습니다.",
          );
          handleLogout();
        },
        30 * 60 * 1000,
      ); // 30분
    }
  }, [isLoggedIn]);

  useEffect(() => {
    const activityEvents = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
    ];

    if (isLoggedIn) {
      resetInactivityTimer();
      activityEvents.forEach((event) =>
        window.addEventListener(event, resetInactivityTimer),
      );
    }

    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      activityEvents.forEach((event) =>
        window.removeEventListener(event, resetInactivityTimer),
      );
    };
  }, [isLoggedIn, resetInactivityTimer]);

  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    const savedToken = localStorage.getItem("accessToken");

    try {
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        const token = savedToken || parsedUser?.token;

        if (parsedUser && token) {
          const isExpired = checkTokenExpiration(token);

          if (isExpired) {
            handleLogout();
          } else {
            const restoredUser = { ...parsedUser, token };
            setCurrentUser(restoredUser);
            setIsLoggedIn(true);
            localStorage.setItem("currentUser", JSON.stringify(restoredUser));
            localStorage.setItem("accessToken", token);
            setupAutoLogout(token);
          }
        }
      }
    } catch (e) {
      console.error("Local storage user parsing error:", e);
      localStorage.removeItem("currentUser");
      localStorage.removeItem("accessToken");
    }
  }, []);

  const checkTokenExpiration = (token) => {
    try {
      if (!token || token.split(".").length !== 3) return true;
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(window.atob(base64));
      return payload.exp * 1000 < Date.now();
    } catch (e) {
      return true;
    }
  };

  const setupAutoLogout = (token) => {
    // 기존에 예약된 로그아웃 타이머가 있다면 제거 (중복 방지)
    if (autoLogoutTimeoutRef.current)
      clearTimeout(autoLogoutTimeoutRef.current);

    try {
      if (!token || token.split(".").length !== 3) return;
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(window.atob(base64));
      const remainingTime = payload.exp * 1000 - Date.now();

      if (remainingTime > 0) {
        autoLogoutTimeoutRef.current = setTimeout(() => {
          alert("세션이 만료되어 자동으로 로그아웃되었습니다.");
          handleLogout();
        }, remainingTime);
      }
    } catch (e) {
      console.error("자동 로그아웃 설정 오류:", e);
    }
  };

  const handleUpdateCurrentUser = useCallback((updates) => {
    setCurrentUser((prev) => {
      if (!prev) return prev;
      const nextUser = { ...prev, ...updates };
      localStorage.setItem("currentUser", JSON.stringify(nextUser));
      return nextUser;
    });
  }, []);

  // 주식 상세창 등에서 호출할 하트비트 (세션 연장) 로직
  const handleHeartbeat = useCallback(async () => {
    if (!isLoggedIn || !currentUser) return;

    // 1. 프론트엔드 미활동 타이머(30분) 리셋
    resetInactivityTimer();

    // 2. 백엔드 토큰 만료 연장
    try {
      const currentToken =
        localStorage.getItem("accessToken") || currentUser?.token;
      const res = await fetch("http://localhost:8081/users/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("accessToken", data.token);
        handleUpdateCurrentUser({ token: data.token });
        setupAutoLogout(data.token);
        console.log("Heartbeat: Backend session extended.");
      }
    } catch (e) {
      console.error("Heartbeat backend sync failed:", e);
    }
  }, [isLoggedIn, currentUser, resetInactivityTimer, handleUpdateCurrentUser]);

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

      let data = null;
      let responseText = "";

      const contentType = res.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        data = await res.json();
      } else {
        responseText = await res.text();
      }

      if (!res.ok) {
        alert(data?.message || responseText || "로그인에 실패했습니다.");
        return;
      }

      if (data?.message === "로그인 성공") {
        const token = data.token || "";

        const loginUser = {
          userId: data.id || data.userId,
          email: data.email,
          nickname: data.nickname,
          role: data.role === "ADMIN" ? "admin" : "user",
          accountId: data.accountId,
          profileImageUrl: data.profileImageUrl,
          token,
        };

        setCurrentUser(loginUser);
        setIsLoggedIn(true);

        localStorage.setItem("currentUser", JSON.stringify(loginUser));
        localStorage.setItem("accessToken", token);

        if (token) {
          setupAutoLogout(token);
        }

        if (pendingPage) {
          setCurrentPage(pendingPage);
          setPendingPage(null);
        } else {
          setCurrentPage("home");
        }
      } else {
        alert(data?.message || "로그인 실패");
      }
    } catch (error) {
      console.error("로그인 fetch 중 에러 발생:", error);
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
            },
          );

          if (!imageResponse.ok) {
            const imageError = await imageResponse.text();
            alert(
              imageError ||
                "회원가입은 완료됐지만 프로필 사진 저장에 실패했습니다.",
            );
          }
        }

        alert("회원가입이 완료되었습니다. 로그인해 주세요.");
        setAuthMode("login");
        setCurrentPage("auth");
        return "success";
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
    if (!isLoggedIn) {
      setPendingPage("ranking");
      setSelectedCompetitionId(competitionId);
      setAuthMode("login");
      setCurrentPage("auth");
      return;
    }

    if (status === "SCHEDULED") {
      alert("예정된 대회는 랭킹을 조회할 수 없습니다.");
      return;
    }

    setSelectedCompetitionId(competitionId);
    setCurrentPage("ranking");
  };

  const handleMovePage = (page) => {
    const publicPages = ["home", "stock", "auth"];
    const isPublic = publicPages.includes(page);

    if (!isLoggedIn && !isPublic) {
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
    if (!isLoggedIn) {
      setPendingPage("contestDetail");
      setSelectedCompetitionId(competitionId);
      setAuthMode("login");
      setCurrentPage("auth");
      return;
    }
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
      const token = localStorage.getItem("accessToken") || currentUser?.token;

      const res = await fetch(
        `http://localhost:8081/api/admin/competitions/${competitionId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
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
  ///////////////
  const handleOpenCommunityWritePage = () => {
    setCurrentPage("communityPostWrite");
  };

  const handleBackToCommunityListFromWrite = () => {
    setCurrentPage("stockCommunity");
  };

  const handleCommunityPostCreated = () => {
    setCurrentPage("stockCommunity");
  };
  //////////

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
            onActivity={handleHeartbeat}
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
            isLoggedIn={isLoggedIn}
            currentUser={currentUser}
            selectedCompetitionId={selectedCompetitionId}
            onBack={() => setCurrentPage("contest")}
          />
        );

      case "community":
        return (
          <CommunityPage onSelectStockCommunity={handleMoveToStockCommunity} />
        );

      case "stockCommunity":
        return (
          <StockCommunityPage
            symbol={selectedCommunitySymbol}
            currentUser={currentUser}
            isLoggedIn={isLoggedIn}
            onBack={handleBackToCommunityMain}
            onSelectPost={handleOpenCommunityPostDetail}
            onWritePost={handleOpenCommunityWritePage}
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
            onMoveAccountSettings={() => {
              setCurrentPage("accountSettings");
            }}
          />
        );

      case "accountSettings":
        return (
          <AccountSettingsPage
            currentUser={currentUser}
            onLogout={handleLogout}
            onBackToMyPage={() => handleMovePage("mypage")}
            onUpdateCurrentUser={handleUpdateCurrentUser}
          />
        );

      case "admin":
        return (
          <AdminPage
            currentUser={currentUser}
            onOpenUserMyPage={(user) => {
              setSelectedMyPageUser(user);
              setCurrentPage("mypage");
            }}
          />
        );

      case "home":
      default:
        return (
          <HomePage
            isLoggedIn={isLoggedIn}
            onOpenLogin={handleOpenLogin}
            currentUser={currentUser}
          />
        );
      case "communityPostWrite":
        return (
          <CommunityPostWritePage
            symbol={selectedCommunitySymbol}
            currentUser={currentUser}
            isLoggedIn={isLoggedIn}
            onBack={handleBackToCommunityListFromWrite}
            onSuccess={handleCommunityPostCreated}
          />
        );
    }
  };

  return (
    <div className="app-container">
      <TopNav
        isLoggedIn={isLoggedIn}
        isAdmin={currentUser?.role === "admin"}
        currentUser={currentUser}
        currentPage={currentPage}
        onMovePage={handleMovePage}
        onOpenLogin={handleOpenLogin}
        onLogout={handleLogout}
      />
      <main className="main-content">
        <div className="container">
          {currentPage !== "home" && (
            <header className="page-header">
              <h2 className="page-title">
                {pageTexts[currentPage]?.title || "페이지"}
              </h2>
              <p className="page-description">
                {pageTexts[currentPage]?.description || ""}
              </p>
            </header>
          )}
          {renderPage()}
        </div>
      </main>
    </div>
  );
};

export default AppController;
