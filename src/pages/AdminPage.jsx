import React, { useEffect, useState } from "react";

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await fetch("http://localhost:8081/api/admin/users");
        if (!response.ok) {
          throw new Error("failed");
        }

        setUsers(await response.json());
      } catch {
        setError("유저 정보를 불러오지 못했습니다.");
      }
    };

    loadUsers();
  }, []);

  return (
    <div className="content-card">
      <h3>관리자 페이지</h3>
      <p className="page-desc">유저 계정 정보</p>

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
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="6">데이터 없음</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.email}</td>
                    <td>{user.nickname}</td>
                    <td>{user.role}</td>
                    <td>{user.status}</td>
                    <td>{user.accountCount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
};

export default AdminPage;
