import React, { useEffect, useState } from "react";

const ROLE_OPTIONS = ["USER", "ADMIN"];
const STATUS_OPTIONS = ["ACTIVE", "SUSPENDED"];

const AdminPage = ({ onOpenUserMyPage }) => {
  const [users, setUsers] = useState([]);
  const [editedUsers, setEditedUsers] = useState({});
  const [savingUserId, setSavingUserId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await fetch("http://localhost:8081/api/admin/users");
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
      } catch {
        setError("사용자 정보를 불러오지 못했습니다.");
      }
    };

    loadUsers();
  }, []);

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

  return (
    <div className="content-card">
      <h3>관리자 페이지</h3>
      <p className="page-desc">회원 계정 정보를 확인하고 권한/상태를 설정합니다.</p>

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
                <th>Apply</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="7">조회된 회원이 없습니다.</td>
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
                        <button
                          type="button"
                          className="admin-user-link"
                          onClick={() =>
                            onOpenUserMyPage && onOpenUserMyPage(user)
                          }
                        >
                          {user.nickname}
                        </button>
                      </td>
                      <td>
                        <select
                          className="admin-inline-select"
                          value={editedUser.role}
                          disabled={isQuitUser}
                          onChange={(event) =>
                            handleUserFieldChange(
                              user.id,
                              "role",
                              event.target.value,
                            )
                          }
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
                          className="admin-inline-select"
                          value={isQuitUser ? "QUIT" : editedUser.status}
                          disabled={isQuitUser}
                          onChange={(event) =>
                            handleUserFieldChange(
                              user.id,
                              "status",
                              event.target.value,
                            )
                          }
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
                        <button
                          type="button"
                          className="admin-apply-button"
                          onClick={() => handleApplyUser(user.id)}
                          disabled={
                            isQuitUser || !isChanged || savingUserId === user.id
                          }
                        >
                          {savingUserId === user.id ? "저장 중" : "적용"}
                        </button>
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
