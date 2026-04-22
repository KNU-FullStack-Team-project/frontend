import React, { useCallback, useEffect, useRef, useState } from "react";

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
import UserActivityPage from "../../pages/UserActivityPage";
import RankingPage from "../../pages/RankingPage";

import FreeBoardPage from "../../pages/FreeBoardPage";
import StockBoardLobbyPage from "../../pages/StockBoardLobbyPage";
import StockCommunityPage from "../../pages/StockCommunityPage";
import NoticeBoardPage from "../../pages/NoticeBoardPage";

import CommunityPostDetailPage from "../../pages/CommunityPostDetailPage";
import CommunityPostWritePage from "../../pages/CommunityPostWritePage";

import TopNav from "../../layout/TopNav";

import "../../auth.css";

const COMMUNITY_NAV_PAGES = [
  "freeBoard",
  "stockBoardLobby",
  "stockCommunity",
  "noticeBoard",
  "communityPostDetail",
  "communityPostWrite",
];

const AppController = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState("home");
  const [pendingPage, setPendingPage] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedMyPageUser, setSelectedMyPageUser] = useState(null);
  const [selectedActivityUser, setSelectedActivityUser] = useState(null);
  const [selectedCompetitionId, setSelectedCompetitionId] = useState(null);
  const [selectedCommunitySymbol, setSelectedCommunitySymbol] = useState(null);
  const [selectedCommunityPostId, setSelectedCommunityPostId] = useState(null);
  const [selectedCommunityBoardType, setSelectedCommunityBoardType] = useState("free");
  const [authMode, setAuthMode] = useState("login");
  const [socialSignupData, setSocialSignupData] = useState(null);
  const [loginCaptchaRequired, setLoginCaptchaRequired] = useState(false);
  const [loginCaptchaResetKey, setLoginCaptchaResetKey] = useState(0);
  const [loginErrorMessage, setLoginErrorMessage] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  const inactivityTimerRef = useRef(null);
  const autoLogoutTimeoutRef = useRef(null);

  const handleLogout = useCallback(() => {
    const token = localStorage.getItem("accessToken");

    if (token) {
      fetch("/api/users/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).catch(() => { });
    }

    localStorage.removeItem("currentUser");
    localStorage.removeItem("accessToken");
    setCurrentUser(null);
    setIsLoggedIn(false);
    setCurrentPage("home");
    setSelectedCompetitionId(null);
    setSelectedMyPageUser(null);
    setSelectedActivityUser(null);
    setSelectedCommunitySymbol(null);
    setSelectedCommunityPostId(null);
    setSelectedCommunityBoardType("free");
    setLoginCaptchaRequired(false);
    setLoginErrorMessage("");
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);

    if (isLoggedIn) {
      inactivityTimerRef.current = setTimeout(() => {
        alert("30분 동안 활동이 없어 자동으로 로그아웃되었습니다.");
        handleLogout();
      }, 30 * 60 * 1000);
    }
  }, [isLoggedIn, handleLogout]);

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
        window.addEventListener(event, resetInactivityTimer)
      );
    }

    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      activityEvents.forEach((event) =>
        window.removeEventListener(event, resetInactivityTimer)
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
  }, [handleLogout]);

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
    if (autoLogoutTimeoutRef.current) {
      clearTimeout(autoLogoutTimeoutRef.current);
    }

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

  const handleHeartbeat = useCallback(async () => {
    if (!isLoggedIn || !currentUser) return;

    resetInactivityTimer();

    try {
      const currentToken =
        localStorage.getItem("accessToken") || currentUser?.token;
      const res = await fetch("/api/users/refresh", {
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
      }
    } catch (e) {
      console.error("Heartbeat backend sync failed:", e);
    }
  }, [isLoggedIn, currentUser, resetInactivityTimer, handleUpdateCurrentUser]);

  const handleLogin = async (form) => {
    try {
      if (loginCaptchaRequired && !form.captchaToken) {
        setLoginErrorMessage("reCAPTCHA 인증을 완료해 주세요.");
        return;
      }

      const res = await fetch("/api/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
          captchaToken: form.captchaToken || "",
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
        setLoginCaptchaRequired(!!data?.captchaRequired);
        if (data?.captchaRequired) {
          setLoginCaptchaResetKey((prev) => prev + 1);
        }
        setLoginErrorMessage(
          data?.message || responseText || "로그인에 실패했습니다."
        );
        return;
      }

      if (res.ok && data?.token) {
        setLoginCaptchaRequired(false);
        setLoginCaptchaResetKey((prev) => prev + 1);
        setLoginErrorMessage("");
        setAuthMessage("");

        const token = data.token || "";
        const loginUser = {
          userId: data.id || data.userId,
          email: data.email,
          nickname: data.nickname,
          role: data.role === "ADMIN" ? "admin" : "user",
          accountId: data.accountId,
          profileImageUrl: data.profileImageUrl,
          isSocialLogin: !!data.socialLogin,
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
        setLoginErrorMessage(data?.message || "로그인에 실패했습니다.");
      }
    } catch (error) {
      console.error("로그인 fetch 중 에러 발생:", error);
      setLoginErrorMessage("로그인 오류");
    }
  };

  const handleGoogleLogin = async (credential) => {
    try {
      const res = await fetch("/api/users/social/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ credential }),
      });

      const contentType = res.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await res.json()
        : { message: await res.text() };

      if (!res.ok) {
        setLoginErrorMessage(data?.message || "Google 로그인에 실패했습니다.");
        return;
      }

      if (data?.signupRequired) {
        setSocialSignupData({
          credential,
          email: data.email || "",
          nickname: data.nickname || "",
          profileImageUrl: data.profileImageUrl || "",
          rejoinCandidate: !!data.rejoinCandidate,
        });
        setAuthMessage("");
        setLoginErrorMessage("");
        setAuthMode("signup");
        setCurrentPage("auth");
        return;
      }

      const loginData = data?.login || data;

      if (loginData?.token) {
        setLoginCaptchaRequired(false);
        setLoginCaptchaResetKey((prev) => prev + 1);
        setLoginErrorMessage("");
        setAuthMessage("");
        setSocialSignupData(null);

        const token = loginData.token || "";
        const loginUser = {
          userId: loginData.id || loginData.userId,
          email: loginData.email,
          nickname: loginData.nickname,
          role: loginData.role === "ADMIN" ? "admin" : "user",
          accountId: loginData.accountId,
          profileImageUrl: loginData.profileImageUrl,
          isSocialLogin: !!loginData.socialLogin,
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
        setLoginErrorMessage("Google 로그인 응답이 올바르지 않습니다.");
      }
    } catch (error) {
      console.error("Google login failed:", error);
      setLoginErrorMessage("Google 로그인 처리 중 오류가 발생했습니다.");
    }
  };

  const handleSocialSignup = async (form) => {
    try {
      const res = await fetch("/api/users/social/google/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credential: form.credential,
          nickname: form.nickname.trim(),
          marketingConsent: form.marketingConsent,
        }),
      });

      const contentType = res.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await res.json()
        : { message: await res.text() };

      if (!res.ok) {
        alert(data?.message || "간편회원가입에 실패했습니다.");
        return;
      }

      if (!data?.token) {
        alert("간편회원가입 응답이 올바르지 않습니다.");
        return;
      }

      setSocialSignupData(null);
      setLoginCaptchaRequired(false);
      setLoginCaptchaResetKey((prev) => prev + 1);
      setLoginErrorMessage("");
      setAuthMessage(data.message || "");

      const token = data.token || "";
      const loginUser = {
        userId: data.id || data.userId,
        email: data.email,
        nickname: data.nickname,
        role: data.role === "ADMIN" ? "admin" : "user",
        accountId: data.accountId,
        profileImageUrl: data.profileImageUrl,
        isSocialLogin: !!data.socialLogin,
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
    } catch (error) {
      alert("간편회원가입 오류");
    }
  };

  const handleSignup = async (form) => {
    try {
      const res = await fetch("/api/users/signup", {
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

      if (data === "회원가입 완료" || data === "재가입 완료") {
        if (form.profileImageFile) {
          const profileFormData = new FormData();
          profileFormData.append("image", form.profileImageFile);

          const params = new URLSearchParams({ email: form.email.trim() });
          const imageResponse = await fetch(
            `/api/users/profile-image?${params.toString()}`,
            {
              method: "POST",
              body: profileFormData,
            }
          );

          if (!imageResponse.ok) {
            const imageError = await imageResponse.text();
            alert(
              imageError || "회원가입은 완료됐지만 프로필 사진 저장에 실패했습니다."
            );
          }
        }

        if (data === "재가입 완료") {
          setAuthMessage("다시 돌아오신 것을 환영합니다.");
        } else {
          setAuthMessage("");
          alert("회원가입이 완료되었습니다. 로그인해 주세요.");
        }
        setSocialSignupData(null);
        setAuthMode("login");
        setCurrentPage("auth");
        return "success";
      }

      alert(data);
    } catch (error) {
      alert("회원가입 오류");
    }
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

  const handleMoveToFreeBoard = () => {
    setSelectedCommunityBoardType("free");
    setSelectedCommunitySymbol(null);
    setSelectedCommunityPostId(null);
    setCurrentPage("freeBoard");
  };

  const handleMoveToStockBoardLobby = () => {
    setSelectedCommunityBoardType("stock");
    setSelectedCommunityPostId(null);
    setCurrentPage("stockBoardLobby");
  };

  const handleMoveToStockCommunity = (stockSymbol) => {
    setSelectedCommunityBoardType("stock");
    setSelectedCommunitySymbol(stockSymbol);
    setSelectedCommunityPostId(null);
    setCurrentPage("stockCommunity");
  };

  const handleMoveToNoticeBoard = () => {
    setSelectedCommunityBoardType("notice");
    setSelectedCommunitySymbol(null);
    setSelectedCommunityPostId(null);
    setCurrentPage("noticeBoard");
  };

  const handleMovePage = (page) => {
    const targetPage = page === "community" ? "freeBoard" : page;
    const publicPages = ["home", "stock", "auth"];
    const isPublic = publicPages.includes(targetPage);

    if (!isLoggedIn && !isPublic) {
      setPendingPage(targetPage);
      setAuthMode("login");
      setCurrentPage("auth");
      return;
    }

    if (targetPage === "admin" && currentUser?.role !== "admin") return;

    if (targetPage === "freeBoard") {
      handleMoveToFreeBoard();
      return;
    }

    if (targetPage === "mypage") {
      setSelectedMyPageUser(null);
    }

    if (targetPage === "userActivity") {
      setSelectedActivityUser(null);
    }

    if (targetPage === "ranking") {
      setSelectedCompetitionId(null);
    }

    setCurrentPage(targetPage);
  };

  const handleOpenLogin = () => {
    setAuthMode("login");
    setSocialSignupData(null);
    setLoginErrorMessage("");
    setAuthMessage("");
    setCurrentPage("auth");
  };

  const handleChangeAuthMode = (nextMode) => {
    setAuthMode(nextMode);
    if (nextMode !== "signup") {
      setSocialSignupData(null);
    }
    if (nextMode !== "login") {
      setAuthMessage("");
    }
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
        `/api/admin/competitions/${competitionId}`,
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

  const handleBackFromFreeBoard = () => {
    setCurrentPage("home");
  };

  const handleBackToFreeBoard = () => {
    setSelectedCommunityBoardType("free");
    setSelectedCommunityPostId(null);
    setCurrentPage("freeBoard");
  };

  const handleOpenCommunityPostDetail = (postId) => {
    setSelectedCommunityPostId(postId);
    setCurrentPage("communityPostDetail");
  };

  const handleBackToCommunityBoard = () => {
    if (selectedCommunityBoardType === "notice") {
      setCurrentPage("noticeBoard");
    } else if (selectedCommunityBoardType === "stock") {
      if (selectedCommunitySymbol) {
        setCurrentPage("stockCommunity");
      } else {
        setCurrentPage("stockBoardLobby");
      }
    } else {
      setCurrentPage("freeBoard");
    }
    setSelectedCommunityPostId(null);
  };

  const handleOpenCommunityWritePage = () => {
    setCurrentPage("communityPostWrite");
  };

  const handleBackToCommunityListFromWrite = () => {
    if (selectedCommunityBoardType === "stock") {
      setCurrentPage("stockCommunity");
    } else {
      setCurrentPage("freeBoard");
    }
  };

  const handleCommunityPostCreated = () => {
    if (selectedCommunityBoardType === "stock") {
      setCurrentPage("stockCommunity");
    } else {
      setCurrentPage("freeBoard");
    }
  };

  if (currentPage === "auth") {
    return (
      <AuthPage
        onLogin={handleLogin}
        onGoogleLogin={handleGoogleLogin}
        onSignup={handleSignup}
        onSocialSignup={handleSocialSignup}
        socialSignupData={socialSignupData}
        initialMode={authMode}
        onChangeMode={handleChangeAuthMode}
        authMessage={authMessage}
        loginCaptchaRequired={loginCaptchaRequired}
        loginCaptchaResetKey={loginCaptchaResetKey}
        loginErrorMessage={loginErrorMessage}
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

      case "noticeBoard":
        return (
          <NoticeBoardPage
            onBack={handleBackToFreeBoard}
            onSelectPost={handleOpenCommunityPostDetail}
          />
        );

      case "freeBoard":
        return (
          <FreeBoardPage
            currentUser={currentUser}
            isLoggedIn={isLoggedIn}
            onBack={handleBackFromFreeBoard}
            onSelectPost={handleOpenCommunityPostDetail}
            onWritePost={handleOpenCommunityWritePage}
            onOpenStockBoardLobby={handleMoveToStockBoardLobby}
            onSelectNoticeBoard={handleMoveToNoticeBoard}
          />
        );

      case "stockBoardLobby":
        return (
          <StockBoardLobbyPage
            onBack={handleBackToFreeBoard}
            onMoveFreeBoard={handleMoveToFreeBoard}
            onOpenStockBoard={handleMoveToStockCommunity}
            onSelectNoticeBoard={handleMoveToNoticeBoard}
          />
        );

      case "stockCommunity":
        return (
          <StockCommunityPage
            symbol={selectedCommunitySymbol}
            currentUser={currentUser}
            isLoggedIn={isLoggedIn}
            onBack={handleMoveToStockBoardLobby}
            onSelectPost={handleOpenCommunityPostDetail}
            onWritePost={handleOpenCommunityWritePage}
            onMoveFreeBoard={handleMoveToFreeBoard}
            onOpenStockBoard={handleMoveToStockCommunity}
            onSelectNoticeBoard={handleMoveToNoticeBoard}
          />
        );

      case "communityPostDetail":
        return (
          <CommunityPostDetailPage
            postId={selectedCommunityPostId}
            currentUser={currentUser}
            isLoggedIn={isLoggedIn}
            boardType={selectedCommunityBoardType || "free"}
            onBack={handleBackToCommunityBoard}
          />
        );

      case "communityPostWrite":
        return (
          <CommunityPostWritePage
            boardType={selectedCommunityBoardType || "free"}
            symbol={selectedCommunitySymbol}
            currentUser={currentUser}
            isLoggedIn={isLoggedIn}
            onBack={handleBackToCommunityListFromWrite}
            onSuccess={handleCommunityPostCreated}
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
            onOpenUserActivity={(user) => {
              setSelectedActivityUser(user);
              setCurrentPage("userActivity");
            }}
          />
        );

      case "userActivity":
        return (
          <UserActivityPage
            currentUser={currentUser}
            targetUser={selectedActivityUser}
            onBack={() => setCurrentPage("admin")}
            onOpenPost={(postId) => {
              setSelectedCommunityPostId(postId);
              setSelectedCommunityBoardType("free");
              setCurrentPage("communityPostDetail");
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
    }
  };

  const navCurrentPage = COMMUNITY_NAV_PAGES.includes(currentPage)
    ? "community"
    : currentPage;

  return (
    <div className="app-container">
      <TopNav
        isLoggedIn={isLoggedIn}
        isAdmin={currentUser?.role === "admin"}
        currentUser={currentUser}
        currentPage={navCurrentPage}
        onMovePage={handleMovePage}
        onOpenLogin={handleOpenLogin}
        onLogout={handleLogout}
      />
      <main className="main-content">
        <div className="container">
          {renderPage()}
        </div>
      </main>
    </div>
  );
};

export default AppController;
