import React, { useEffect, useMemo, useState } from "react";
import AppButton from "../common/AppButton";
import UserProfileModal from "../components/community/UserProfileModal";

const ROLE_OPTIONS = ["USER", "ADMIN"];
const STATUS_OPTIONS = ["ACTIVE", "SUSPENDED"];

const formatDateTime = (value) => {
  if (!value) return "-";

  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    return value.replace("T", " ");
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(parsed);
};

const AdminPage = ({
  onOpenUserMyPage,
  onOpenUserActivity,
  onOpenPost,
  currentUser,
}) => {
  const [users, setUsers] = useState([]);
  const [editedUsers, setEditedUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState(null);
  const [error, setError] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [activeTab, setActiveTab] = useState("users");
  const [loginLogs, setLoginLogs] = useState([]);
  const [loginLogLoading, setLoginLogLoading] = useState(false);
  const [loginLogError, setLoginLogError] = useState("");
  const [loginLogSearchKeyword, setLoginLogSearchKeyword] = useState("");
  const [reports, setReports] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");
  const [reportSearchKeyword, setReportSearchKeyword] = useState("");
  const [communityUsers, setCommunityUsers] = useState([]);
  const [communityUserLoading, setCommunityUserLoading] = useState(false);
  const [communityUserError, setCommunityUserError] = useState("");
  const [communityUserSearchKeyword, setCommunityUserSearchKeyword] = useState("");
  const [selectedProfileUserId, setSelectedProfileUserId] = useState(null);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await fetch("/api/admin/users", {
        });

        if (!response.ok) {
          throw new Error("회원 정보를 불러오지 못했습니다.");
        }

        const userList = await response.json();
        setUsers(userList);
        setEditedUsers(
          userList.reduce((acc, user) => {
            acc[user.id] = {
              role: user.role || "USER",
              status: user.status || "ACTIVE",
              suspensionHours: undefined,
              suspensionReason: "",
            };
            return acc;
          }, {}),
        );
      } catch (loadError) {
        setError(loadError.message || "회원 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  useEffect(() => {
    if (activeTab !== "loginLogs") {
      return;
    }

    const loadLoginLogs = async () => {
      setLoginLogLoading(true);
      setLoginLogError("");

      try {
        const response = await fetch("/api/admin/account-logs");

        if (!response.ok) {
          throw new Error("계정 기록을 불러오지 못했습니다.");
        }

        setLoginLogs(await response.json());
      } catch (loadError) {
        setLoginLogError(loadError.message || "계정 기록을 불러오지 못했습니다.");
      } finally {
        setLoginLogLoading(false);
      }
    };

    loadLoginLogs();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "reports") {
      return;
    }

    const loadReports = async () => {
      setReportLoading(true);
      setReportError("");

      try {
        const response = await fetch("/api/admin/reports");

        if (!response.ok) {
          throw new Error("신고 목록을 불러오지 못했습니다.");
        }

        setReports(await response.json());
      } catch (loadError) {
        setReportError(loadError.message || "신고 목록을 불러오지 못했습니다.");
      } finally {
        setReportLoading(false);
      }
    };

    loadReports();
  }, [activeTab]);



  useEffect(() => {
    if (activeTab !== "community") {
      return;
    }

    const loadCommunityUsers = async () => {
      setCommunityUserLoading(true);
      setCommunityUserError("");

      try {
        const response = await fetch("/api/admin/community/users", {
          credentials: "include",
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || "커뮤니티 활동 정보를 불러오지 못했습니다.");
        }

        const data = await response.json();
        setCommunityUsers(Array.isArray(data) ? data : []);
      } catch (loadError) {
        setCommunityUserError(loadError.message || "커뮤니티 활동 정보를 불러오지 못했습니다.");
        setCommunityUsers([]);
      } finally {
        setCommunityUserLoading(false);
      }
    };

    loadCommunityUsers();
  }, [activeTab]);

  const handleUserFieldChange = (userId, field, value) => {
    setEditedUsers((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: value,
      },
    }));
  };

  const handleStatusChange = (user, status) => {
    if (status !== "SUSPENDED" || user.status === "SUSPENDED") {
      handleUserFieldChange(user.id, "status", status);
      return;
    }

    const input = window.prompt(
      "정지 기간을 시간 단위로 입력해주세요. 예: 0.1, 1, 24 / 영구정지는 -1",
      "1",
    );

    if (input === null) {
      return;
    }

    const hours = Number(input);
    if (!Number.isFinite(hours) || hours === 0 || hours < -1) {
      alert("정지 기간은 -1 또는 0이 아닌 양수 시간으로 입력해주세요.");
      return;
    }

    const reason = window.prompt("밴 사유를 입력해주세요.", "");
    if (reason === null) {
      return;
    }

    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      alert("밴 사유를 입력해주세요.");
      return;
    }

    setEditedUsers((prev) => ({
      ...prev,
      [user.id]: {
        ...prev[user.id],
        status,
        suspensionHours: hours,
        suspensionReason: trimmedReason,
      },
    }));
  };

  const handleApplyUser = async (userId) => {
    const nextUser = editedUsers[userId];
    if (!nextUser || savingUserId) {
      return;
    }

    setSavingUserId(userId);

    try {
      const response = await fetch(
        `/api/admin/users/${userId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(nextUser),
        },
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "회원 정보 저장에 실패했습니다.");
      }

      const savedUser = await response.json();
      setUsers((prevUsers) =>
        prevUsers.map((user) => (user.id === userId ? savedUser : user)),
      );
      setEditedUsers((prev) => ({
        ...prev,
        [userId]: {
          role: savedUser.role || "USER",
          status: savedUser.status || "ACTIVE",
          suspensionHours: undefined,
          suspensionReason: "",
        },
      }));
      alert("회원 정보가 저장되었습니다.");
    } catch (saveError) {
      alert(saveError.message || "회원 정보 저장에 실패했습니다.");
    } finally {
      setSavingUserId(null);
    }
  };


  const handleOpenUserProfile = (userId) => {
    if (!userId) return;
    setSelectedProfileUserId(userId);
  };

  const handleCloseUserProfile = () => {
    setSelectedProfileUserId(null);
  };

  const handleMoveUserMyPageFromProfile = (profile) => {
    if (onOpenUserMyPage) {
      onOpenUserMyPage({
        id: profile.userId,
        userId: profile.userId,
        email: profile.email,
        nickname: profile.nickname,
        profileImageUrl: profile.profileImageUrl,
        role: profile.role,
        status: profile.status,
      });
    }
    handleCloseUserProfile();
  };

  const filteredUsers = users.filter((user) => {
    const keyword = searchKeyword.trim().toLowerCase();

    if (!keyword) {
      return true;
    }

    return (
      String(user.id).includes(keyword) ||
      (user.email || "").toLowerCase().includes(keyword) ||
      (user.nickname || "").toLowerCase().includes(keyword)
    );
  });

  const filteredLoginLogs = useMemo(() => {
    const keyword = loginLogSearchKeyword.trim().toLowerCase();

    if (!keyword) {
      return loginLogs;
    }

    return loginLogs.filter((log) =>
      [
        formatDateTime(log.occurredAt),
        log.occurredAt,
        log.nickname,
        log.loginId,
        log.actionLabel,
        log.detail,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  }, [loginLogs, loginLogSearchKeyword]);

  const filteredReports = useMemo(() => {
    const keyword = reportSearchKeyword.trim().toLowerCase();

    if (!keyword) {
      return reports;
    }

    return reports.filter((report) =>
      [
        report.createdAt,
        report.reportType,
        report.postTitle,
        report.reason,
        report.detail,
        report.targetContent,
        report.reporterNickname,
        report.reporterEmail,
        report.reportStatus,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  }, [reports, reportSearchKeyword]);



  const filteredCommunityUsers = useMemo(() => {
    const keyword = communityUserSearchKeyword.trim().toLowerCase();

    if (!keyword) {
      return communityUsers;
    }

    return communityUsers.filter((user) =>
      [
        user.userId,
        user.email,
        user.nickname,
        user.role,
        user.status,
        user.levelName,
        ...(user.badges || []).map((badge) => badge.label),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  }, [communityUsers, communityUserSearchKeyword]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">회원 정보를 불러오는 중입니다...</div>
      </div>
    );
  }

  return (
    <div className="content-card">
      <h3>관리자 페이지</h3>

      {error ? <p className="page-desc">{error}</p> : null}

      {!error ? (
        <div className="admin-table-wrap">
          <div className="admin-toolbar">
            <div className="admin-toolbar-actions">
              <button
                type="button"
                className={`admin-toolbar-button ${activeTab === "users" ? "is-active" : ""
                  }`}
                onClick={() => {
                  setActiveTab("users");
                  setSearchKeyword("");
                }}
              >
                전체보기
              </button>
              <button
                type="button"
                className={`admin-toolbar-button ${activeTab === "reports" ? "is-active" : ""
                  }`}
                onClick={() => {
                  setActiveTab("reports");
                  setReportSearchKeyword("");
                }}
              >
                신고목록
              </button>
              <button
                type="button"
                className={`admin-toolbar-button ${activeTab === "loginLogs" ? "is-active" : ""
                  }`}
                onClick={() => {
                  setActiveTab("loginLogs");
                  setLoginLogSearchKeyword("");
                }}
              >
                계정기록
              </button>
              <button
                type="button"
                className={`admin-toolbar-button ${activeTab === "community" ? "is-active" : ""
                  }`}
                onClick={() => {
                  setActiveTab("community");
                  setCommunityUserSearchKeyword("");
                }}
              >
                커뮤니티활동
              </button>
            </div>
            {activeTab === "users" ? (
              <div className="admin-search-wrap">
                <input
                  type="text"
                  className="admin-search-input"
                  placeholder="유저 검색"
                  value={searchKeyword}
                  onChange={(event) => setSearchKeyword(event.target.value)}
                />
              </div>
            ) : activeTab === "loginLogs" ? (
              <div className="admin-search-wrap">
                <input
                  type="text"
                  className="admin-search-input"
                  placeholder="날짜, 닉네임, 아이디, 기록, 사유 검색"
                  value={loginLogSearchKeyword}
                  onChange={(event) =>
                    setLoginLogSearchKeyword(event.target.value)
                  }
                />
              </div>
            ) : activeTab === "community" ? (
              <div className="admin-search-wrap">
                <input
                  type="text"
                  className="admin-search-input"
                  placeholder="닉네임, 이메일, 레벨, 뱃지 검색"
                  value={communityUserSearchKeyword}
                  onChange={(event) => setCommunityUserSearchKeyword(event.target.value)}
                />
              </div>
            ) : (
              <div className="admin-search-wrap">
                <input
                  type="text"
                  className="admin-search-input"
                  placeholder="제목, 사유, 신고자 검색"
                  value={reportSearchKeyword}
                  onChange={(event) => setReportSearchKeyword(event.target.value)}
                />
              </div>
            )}
          </div>

          {activeTab === "loginLogs" ? (
            <table className="stock-table admin-table">
              <thead>
                <tr>
                  <th>날짜</th>
                  <th>닉네임</th>
                  <th>아이디</th>
                  <th>기록</th>
                  <th>상세</th>
                </tr>
              </thead>
              <tbody>
                {loginLogLoading ? (
                  <tr>
                    <td colSpan="5">계정 기록을 불러오는 중입니다.</td>
                  </tr>
                ) : loginLogError ? (
                  <tr>
                    <td colSpan="5">{loginLogError}</td>
                  </tr>
                ) : filteredLoginLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5">조회된 계정 기록이 없습니다.</td>
                  </tr>
                ) : (
                  filteredLoginLogs.map((log, index) => (
                    <tr key={`${log.occurredAt}-${log.loginId}-${index}`}>
                      <td>{formatDateTime(log.occurredAt)}</td>
                      <td>{log.nickname || "-"}</td>
                      <td>{log.loginId || "-"}</td>
                      <td>{log.actionLabel || "-"}</td>
                      <td>{log.detail || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : activeTab === "reports" ? (
            <table className="stock-table admin-table">
              <thead>
                <tr>
                  <th>시각</th>
                  <th>구분</th>
                  <th>게시글</th>
                  <th>신고 내용</th>
                  <th>신고자</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {reportLoading ? (
                  <tr>
                    <td colSpan="6">신고 목록을 불러오는 중입니다.</td>
                  </tr>
                ) : reportError ? (
                  <tr>
                    <td colSpan="6">{reportError}</td>
                  </tr>
                ) : filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan="6">조회된 신고가 없습니다.</td>
                  </tr>
                ) : (
                  filteredReports.map((report) => (
                    <tr key={`${report.reportType}-${report.reportId}`}>
                      <td>{report.createdAt?.replace("T", " ") || "-"}</td>
                      <td>{report.reportType === "POST" ? "게시글" : "댓글"}</td>
                      <td>
                        {report.postId && onOpenPost ? (
                          <button
                            type="button"
                            className="activity-table-link"
                            onClick={() => onOpenPost(report.postId)}
                          >
                            {report.postTitle || `게시글 #${report.postId}`}
                          </button>
                        ) : (
                          report.postTitle || "-"
                        )}
                      </td>
                      <td>
                        <div>{report.reason || "-"}</div>
                        <div className="report-detail-text">
                          {report.detail || report.targetContent || "-"}
                        </div>
                      </td>
                      <td>
                        <div>{report.reporterNickname || "-"}</div>
                        <div className="report-sub-text">
                          {report.reporterEmail || "-"}
                        </div>
                      </td>
                      <td>{report.reportStatus || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : activeTab === "community" ? (
            <table className="stock-table admin-table">
              <thead>
                <tr>
                  <th>유저</th>
                  <th>레벨</th>
                  <th>뱃지</th>
                  <th>게시글</th>
                  <th>댓글</th>
                  <th>받은 추천</th>
                  <th>신고</th>
                  <th>주문</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {communityUserLoading ? (
                  <tr>
                    <td colSpan="9">커뮤니티 활동 정보를 불러오는 중입니다.</td>
                  </tr>
                ) : communityUserError ? (
                  <tr>
                    <td colSpan="9">{communityUserError}</td>
                  </tr>
                ) : filteredCommunityUsers.length === 0 ? (
                  <tr>
                    <td colSpan="9">조회된 커뮤니티 활동 정보가 없습니다.</td>
                  </tr>
                ) : (
                  filteredCommunityUsers.map((user) => (
                    <tr key={user.userId}>
                      <td>
                        <button
                          type="button"
                          className="activity-table-link"
                          onClick={() => handleOpenUserProfile(user.userId)}
                        >
                          {user.nickname || "-"}
                        </button>
                        <div className="report-sub-text">{user.email || "-"}</div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                          <img
                            src={user.levelImageUrl || `/assets/community-badges/level-${user.communityLevel || 1}.png`}
                            alt={`Lv.${user.communityLevel}`}
                            style={{ width: "28px", height: "28px", borderRadius: "999px", objectFit: "cover" }}
                          />
                          <strong>{`Lv.${user.communityLevel || 1}`}</strong>
                        </div>
                        <div className="report-sub-text">{user.levelName || "-"}</div>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "center", flexWrap: "wrap" }}>
                          {(user.badges || []).length === 0 ? (
                            <span className="report-sub-text">-</span>
                          ) : (
                            user.badges.map((badge) => (
                              <img
                                key={badge.code}
                                src={badge.imageUrl}
                                alt={badge.label}
                                title={badge.label}
                                style={{ width: "28px", height: "28px", borderRadius: "999px", objectFit: "cover" }}
                              />
                            ))
                          )}
                        </div>
                      </td>
                      <td>{user.postCount ?? 0}</td>
                      <td>{user.commentCount ?? 0}</td>
                      <td>{user.receivedLikeCount ?? 0}</td>
                      <td>{user.reportCount ?? 0}</td>
                      <td>{user.orderCount ?? 0}</td>
                      <td>{user.status || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="stock-table admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Email</th>
                  <th>Nickname</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Accounts</th>
                  <th>Logs</th>
                  <th>Apply</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="8">조회된 회원이 없습니다.</td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const isQuitUser = user.status === "QUIT";
                    const editedUser = editedUsers[user.id] || {
                      role: user.role || "USER",
                      status: user.status || "ACTIVE",
                      suspensionHours: undefined,
                      suspensionReason: "",
                    };
                    const isChanged =
                      !isQuitUser &&
                      (editedUser.role !== user.role ||
                        editedUser.status !== user.status);

                    return (
                      <tr key={user.id}>
                        <td>{user.id}</td>
                        <td>{user.email}</td>
                        <td>
                          <AppButton
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              onOpenUserMyPage && onOpenUserMyPage(user)
                            }
                          >
                            {user.nickname}
                          </AppButton>
                        </td>
                        <td>
                          <select
                            value={editedUser.role}
                            disabled={isQuitUser}
                            onChange={(event) =>
                              handleUserFieldChange(
                                user.id,
                                "role",
                                event.target.value,
                              )
                            }
                            style={{
                              padding: "4px 8px",
                              borderRadius: "8px",
                              border: "1px solid #d1d5db",
                              fontSize: "12px",
                              fontWeight: "600",
                              outline: "none",
                              cursor: "pointer",
                              background: "#f9fafb",
                            }}
                          >
                            {ROLE_OPTIONS.map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <select
                            value={isQuitUser ? "QUIT" : editedUser.status}
                            disabled={isQuitUser}
                            onChange={(event) =>
                              handleStatusChange(user, event.target.value)
                            }
                            style={{
                              padding: "4px 8px",
                              borderRadius: "8px",
                              border: "1px solid #d1d5db",
                              fontSize: "12px",
                              fontWeight: "600",
                              outline: "none",
                              cursor: "pointer",
                              background: "#f9fafb",
                            }}
                          >
                            {isQuitUser ? (
                              <option value="QUIT">QUIT</option>
                            ) : (
                              STATUS_OPTIONS.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))
                            )}
                          </select>
                          {user.status === "SUSPENDED" ? (
                            <>
                              <div className="report-sub-text">
                                {user.suspendedUntil
                                  ? `해제 예정: ${formatDateTime(user.suspendedUntil)}`
                                  : "영구 정지"}
                              </div>
                              {user.suspensionReason ? (
                                <div className="report-sub-text">
                                  사유: {user.suspensionReason}
                                </div>
                              ) : null}
                            </>
                          ) : null}
                          {editedUser.status === "SUSPENDED" &&
                          editedUser.suspensionHours ? (
                            <div className="report-sub-text">
                              {editedUser.suspensionHours === -1
                                ? "설정: 영구 정지"
                                : `설정: ${editedUser.suspensionHours}시간 정지`}
                            </div>
                          ) : null}
                          {editedUser.status === "SUSPENDED" &&
                          editedUser.suspensionReason ? (
                            <div className="report-sub-text">
                              설정 사유: {editedUser.suspensionReason}
                            </div>
                          ) : null}
                        </td>
                        <td>{user.accountCount ?? 0}</td>
                        <td>
                          <AppButton
                            size="sm"
                            onClick={() =>
                              onOpenUserActivity && onOpenUserActivity(user)
                            }
                          >
                            로그
                          </AppButton>
                        </td>
                        <td>
                          <AppButton
                            size="sm"
                            onClick={() => handleApplyUser(user.id)}
                            disabled={
                              isQuitUser || !isChanged || savingUserId === user.id
                            }
                          >
                            {savingUserId === user.id ? "저장 중" : "적용"}
                          </AppButton>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      ) : null}

      <UserProfileModal
        userId={selectedProfileUserId}
        onClose={handleCloseUserProfile}
        onMoveMyPage={handleMoveUserMyPageFromProfile}
      />
    </div>
  );
};

export default AdminPage;
