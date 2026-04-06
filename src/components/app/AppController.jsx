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
import RankingPage from "../../pages/RankingPage"; // 🔥 추가

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
  const [authMode, setAuthMode] = useState("login");

  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    try {
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);

        // 자동 로그아웃 체크: 토큰 만료 여부 확인
        if (parsedUser && parsedUser.token) {
          const isExpired = checkTokenExpiration(parsedUser.token);
          if (isExpired) {
            handleLogout();
          } else {
            setCurrentUser(parsedUser);
            setIsLoggedIn(true);
            setupAutoLogout(parsedUser.token);
          }
        }
      }
    } catch (e) {
      console.error("Local storage user parsing error:", e);
      localStorage.removeItem("currentUser");
    }
  }, []);

  // 토큰 만료 여부 확인 (JWT 디코딩 로직 포함)
  const checkTokenExpiration = (token) => {
    try {
      if (!token || token.split(".").length !== 3) return true;
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(window.atob(base64));
      return payload.exp * 1000 < Date.now();
    } catch (e) {
      return true; // 에러 시 만료된 것으로 처리
    }
  };

  // 자동 로그아웃 타이머 설정
  const setupAutoLogout = (token) => {
    try {
      if (!token || token.split(".").length !== 3) return;
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(window.atob(base64));
      const remainingTime = payload.exp * 1000 - Date.now();
      if (remainingTime > 0) {
        setTimeout(() => {
          alert("세션이 만료되어 자동으로 로그아웃되었습니다.");
          handleLogout();
        }, remainingTime);
      }
    } catch (e) {}
  };

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

      if (!res.ok) {
        const responseText = await res.text();
        alert(responseText || "로그인에 실패했습니다.");
        return;
      }

      const data = await res.json();

      if (data.message === "로그인 성공") {
        const loginUser = {
          userId: data.id || data.userId, // 백엔드에서 id로 보낼 경우를 대비
          email: data.email,
          nickname: data.nickname,
          role: data.role === "ADMIN" ? "admin" : "user",
          accountId: data.accountId, // 계좌 ID 저장
          token: data.token, // 서버에서 받은 JWT 저장
        };

        setCurrentUser(loginUser);
        setIsLoggedIn(true);
        localStorage.setItem("currentUser", JSON.stringify(loginUser));
        setupAutoLogout(data.token); // 로그인 성공 시 타이머 시작

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
        return "success"; // SignupForm에서 성공 처리를 인식할 수 있도록 반환
      } else {
        alert(data);
      }
    } catch (error) {
      alert("회원가입 오류");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    setCurrentUser(null);
    setIsLoggedIn(false);
    setCurrentPage("home");
    setSelectedCompetitionId(null);
    setSelectedMyPageUser(null);
  };

  //랭킹페이지 이동 함수
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
    // 공개 페이지: 홈, 주식, 인증(로그인/회원가입)
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

    // 🔥 랭킹 메뉴 클릭 시 기본 상태 초기화
    if (page === "ranking") {
      setSelectedCompetitionId(null);
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
      const res = await fetch(
        `http://localhost:8081/api/admin/competitions/${competitionId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${currentUser?.token}` },
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
            onCreateCompetition={handleCreateCompetition}
            onEditCompetition={handleEditCompetition}
            onDeleteCompetition={handleDeleteCompetition}
            onViewRanking={handleViewRanking} // 🔥 추가
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
          />
        );

      case "admin":
        return <AdminPage currentUser={currentUser} />;

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
