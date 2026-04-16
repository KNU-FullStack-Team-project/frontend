import React, { useEffect, useState } from "react";
import AppButton from "../common/AppButton";

const ROLE_OPTIONS = ["USER", "ADMIN"];
const STATUS_OPTIONS = ["ACTIVE", "SUSPENDED"];

const AdminPage = ({ onOpenUserMyPage, onOpenUserActivity, currentUser }) => {
  const [users, setUsers] = useState([]);
  const [editedUsers, setEditedUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await fetch("http://localhost:8081/api/admin/users", {
          headers: {
            Authorization: `Bearer ${currentUser?.token}`,
          },
        });
        if (!response.ok) {
          throw new Error("failed");
        }

        const userList = await response.json();
        setUsers(userList);
        setEditedUsers(
          userList.reduce((acc, user) => {
            acc[user.id] = {
              role: user.role || "USER",
              status: user.status || "ACTIVE",
            };
            return acc;
          }, {}),
        );
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [currentUser?.token]);

  const handleUserFieldChange = (userId, field, value) => {
    setEditedUsers((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: value,
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
        `http://localhost:8081/api/admin/users/${userId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentUser?.token}`,
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
        },
      }));
      alert("회원 정보가 저장되었습니다.");
    } catch (saveError) {
      alert(saveError.message || "회원 정보 저장에 실패했습니다.");
    } finally {
      setSavingUserId(null);
    }
  };

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
              {users.length === 0 ? (
                <tr>
                  <td colSpan="8">조회된 회원이 없습니다.</td>
                </tr>
              ) : (
                users.map((user) => {
                  const isQuitUser = user.status === "QUIT";
                  const editedUser = editedUsers[user.id] || {
                    role: user.role || "USER",
                    status: user.status || "ACTIVE",
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
                            padding: '4px 8px',
                            borderRadius: '8px',
                            border: '1px solid #d1d5db',
                            fontSize: '12px',
                            fontWeight: '600',
                            outline: 'none',
                            cursor: 'pointer',
                            background: '#f9fafb'
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
                            handleUserFieldChange(
                              user.id,
                              "status",
                              event.target.value,
                            )
                          }
                          style={{
                            padding: '4px 8px',
                            borderRadius: '8px',
                            border: '1px solid #d1d5db',
                            fontSize: '12px',
                            fontWeight: '600',
                            outline: 'none',
                            cursor: 'pointer',
                            background: '#f9fafb'
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
        </div>
      ) : null}
    </div>
  );
};

export default AdminPage;
