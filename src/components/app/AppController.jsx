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
import ReportListPage from "../../pages/ReportListPage";
import RankingPage from "../../pages/RankingPage";
import CommunityPage from "../../pages/CommunityPage";
import StockCommunityPage from "../../pages/StockCommunityPage";
import FreeBoardPage from "../../pages/FreeBoardPage";
import NoticeBoardPage from "../../pages/NoticeBoardPage";
import CommunityPostDetailPage from "../../pages/CommunityPostDetailPage";
import CommunityPostWritePage from "../../pages/CommunityPostWritePage";

import TopNav from "../../layout/TopNav";

import "../../auth.css";

const pageTexts = {
  home: {
    title: "모의투자 플랫폼",
    description: "안전하게 연습하고, 실전 감각까지 익혀보세요.",
  },
  stock: {
    title: "주식",
    description: "종목 정보와 시장 흐름을 확인해보세요.",
  },
  contest: {
    title: "대회",
    description: "대회와 참가자 정보를 확인해보세요.",
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
  userActivity: {
    title: "유저 활동 로그",
    description: "기존 데이터 기준으로 유저 활동을 확인합니다.",
  },
  reportList: {
    title: "신고 관리",
    description: "신고된 게시글과 댓글을 확인하고 처리합니다.",
  },
  community: {
    title: "커뮤니티",
    description: "게시판과 종목별 커뮤니티를 탐색해보세요.",
  },
  stockCommunity: {
    title: "종목 커뮤니티",
    description: "선택한 종목 게시판의 글 목록을 확인하세요.",
  },
  freeBoard: {
    title: "자유게시판",
    description: "종목과 관계없는 자유로운 소통 공간입니다.",
  },
  noticeBoard: {
    title: "공지사항",
    description: "운영 공지 및 안내사항을 확인해보세요.",
  },
  communityPostDetail: {
    title: "게시글 상세",
    description: "게시글 내용과 댓글을 확인해보세요.",
  },
  communityPostWrite: {
    title: "게시글 작성",
    description: "새 게시글을 작성해보세요.",
  },
  accountSettings: {
    title: "계정 설정",
    description: "내 계정 정보와 프로필을 관리합니다.",
  },
  admin: {
    title: "관리자 페이지",
    description: "서비스 운영과 사용자/신고 내역을 관리합니다.",
  },
};

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
  const [selectedCommunityBoardType, setSelectedCommunityBoardType] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [loginCaptchaRequired, setLoginCaptchaRequired] = useState(false);
  const [loginCaptchaResetKey, setLoginCaptchaResetKey] = useState(0);
  const [loginErrorMessage, setLoginErrorMessage] = useState("");

  const inactivityTimerRef = useRef(null);
  const autoLogoutTimeoutRef = useRef(null);

  const handleLogout = useCallback(() => {
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
    setSelectedCommunityBoardType(null);
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
    if (!isLoggedIn) return;

    resetInactivityTimer();

    try {
      const savedUserStr = localStorage.getItem("currentUser");
      if (!savedUserStr) return;

      const savedUser = JSON.parse(savedUserStr);
      const currentToken = localStorage.getItem("accessToken") || savedUser?.token;

      if (!currentToken || !savedUser?.email) return;

      const res = await fetch("http://localhost:8081/users/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({ email: savedUser.email }),
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
  }, [isLoggedIn, resetInactivityTimer, handleUpdateCurrentUser]);

  const handleLogin = async (form) => {
    try {
      if (loginCaptchaRequired && !form.captchaToken) {
        setLoginErrorMessage("reCAPTCHA 인증을 완료해 주세요.");
        return;
      }

      const res = await fetch("http://localhost:8081/users/login", {
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
        setLoginErrorMessage(data?.message || "로그인에 실패했습니다.");
      }
    } catch (error) {
      console.error("로그인 fetch 중 에러 발생:", error);
      setLoginErrorMessage("로그인 오류");
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
              imageError || "회원가입은 완료됐지만 프로필 사진 저장에 실패했습니다."
            );
          }
        }

        alert("회원가입이 완료되었습니다. 로그인해 주세요.");
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

    if (page === "userActivity") {
      setSelectedActivityUser(null);
    }

    if (page === "ranking") {
      setSelectedCompetitionId(null);
    }

    if (page === "community") {
      setSelectedCommunitySymbol(null);
      setSelectedCommunityPostId(null);
      setSelectedCommunityBoardType(null);
    }

    setCurrentPage(page);
  };

  const handleOpenLogin = () => {
    setAuthMode("login");
    setLoginErrorMessage("");
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
    setSelectedCommunityBoardType("stock");
    setSelectedCommunityPostId(null);
    setCurrentPage("stockCommunity");
  };

  const handleMoveToFreeBoard = () => {
    setSelectedCommunityBoardType("free");
    setSelectedCommunitySymbol(null);
    setSelectedCommunityPostId(null);
    setCurrentPage("freeBoard");
  };

  const handleMoveToNoticeBoard = () => {
    setSelectedCommunityBoardType("notice");
    setSelectedCommunitySymbol(null);
    setSelectedCommunityPostId(null);
    setCurrentPage("noticeBoard");
  };

  const handleBackToCommunityMain = () => {
    setCurrentPage("community");
    setSelectedCommunitySymbol(null);
    setSelectedCommunityPostId(null);
    setSelectedCommunityBoardType(null);
  };

  const handleOpenCommunityPostDetail = (postId) => {
    setSelectedCommunityPostId(postId);
    setCurrentPage("communityPostDetail");
  };

  const handleBackToCommunityBoard = () => {
    if (selectedCommunityBoardType === "free") {
      setCurrentPage("freeBoard");
    } else if (selectedCommunityBoardType === "notice") {
      setCurrentPage("noticeBoard");
    } else {
      setCurrentPage("stockCommunity");
    }
    setSelectedCommunityPostId(null);
  };

  const handleOpenCommunityWritePage = () => {
    setCurrentPage("communityPostWrite");
  };

  const handleBackToCommunityListFromWrite = () => {
    if (selectedCommunityBoardType === "free") {
      setCurrentPage("freeBoard");
    } else if (selectedCommunityBoardType === "notice") {
      setCurrentPage("noticeBoard");
    } else {
      setCurrentPage("stockCommunity");
    }
  };

  const handleCommunityPostCreated = () => {
    if (selectedCommunityBoardType === "free") {
      setCurrentPage("freeBoard");
    } else if (selectedCommunityBoardType === "notice") {
      setCurrentPage("noticeBoard");
    } else {
      setCurrentPage("stockCommunity");
    }
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

      case "community":
        return (
          <CommunityPage
            onSelectNoticeBoard={handleMoveToNoticeBoard}
            onSelectFreeBoard={handleMoveToFreeBoard}
            onSelectStockCommunity={handleMoveToStockCommunity}
          />
        );

      case "noticeBoard":
        return (
          <NoticeBoardPage
            onBack={handleBackToCommunityMain}
            onSelectPost={handleOpenCommunityPostDetail}
          />
        );

      case "freeBoard":
        return (
          <FreeBoardPage
            currentUser={currentUser}
            isLoggedIn={isLoggedIn}
            onBack={handleBackToCommunityMain}
            onSelectPost={handleOpenCommunityPostDetail}
            onWritePost={handleOpenCommunityWritePage}
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
            onWritePost={handleOpenCommunityWritePage}
          />
        );

      case "communityPostDetail":
        return (
          <CommunityPostDetailPage
            postId={selectedCommunityPostId}
            currentUser={currentUser}
            isLoggedIn={isLoggedIn}
            boardType={selectedCommunityBoardType || "stock"}
            onBack={handleBackToCommunityBoard}
          />
        );

      case "communityPostWrite":
        return (
          <CommunityPostWritePage
            boardType={selectedCommunityBoardType || "stock"}
            symbol={selectedCommunitySymbol}
            currentUser={currentUser}
            isLoggedIn={isLoggedIn}
            onBack={handleBackToCommunityListFromWrite}
            onSuccess={handleCommunityPostCreated}
          />
        );

      case "reportList":
        return (
          <ReportListPage
            currentUser={currentUser}
            onBack={() => setCurrentPage("admin")}
          />
        );

      case "mypage":
        return (
          <MyPage
            currentUser={currentUser}
            selectedUser={selectedMyPageUser}
            viewedUser={selectedMyPageUser}
            onOpenUserActivity={(user) => {
              setSelectedActivityUser(user);
              setCurrentPage("userActivity");
            }}
            onOpenAccountSettings={() => setCurrentPage("accountSettings")}
            onMoveAccountSettings={() => setCurrentPage("accountSettings")}
          />
        );

      case "accountSettings":
        return (
          <AccountSettingsPage
            currentUser={currentUser}
            onBack={() => setCurrentPage("mypage")}
            onBackToMyPage={() => setCurrentPage("mypage")}
            onUpdateCurrentUser={handleUpdateCurrentUser}
            onLogout={handleLogout}
          />
        );

      case "admin":
        return (
          <AdminPage
            currentUser={currentUser}
            onOpenReportList={() => {
              setCurrentPage("reportList");
            }}
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
            selectedUser={selectedActivityUser}
            targetUser={selectedActivityUser}
            onBack={() =>
              currentUser?.role === "admin"
                ? setCurrentPage("admin")
                : setCurrentPage("mypage")
            }
          />
        );

      case "home":
      default:
        return <HomePage isLoggedIn={isLoggedIn} currentUser={currentUser} />;
    }
  };

  return (
    <div className="app-shell">
      <TopNav
        currentPage={currentPage}
        onMovePage={handleMovePage}
        isLoggedIn={isLoggedIn}
        isAdmin={currentUser?.role === "admin"}
        currentUser={currentUser}
        onOpenLogin={handleOpenLogin}
        onLogout={handleLogout}
      />

      <main className="app-main main-content">
        <div className="container">
          {currentPage !== "auth" && (
            <div className="page-hero">
              <h1>{pageTexts[currentPage]?.title || ""}</h1>
              <p>{pageTexts[currentPage]?.description || ""}</p>
            </div>
          )}

          {renderPage()}
        </div>
      </main>
    </div>
  );
};

export default AppController;