import React, { useEffect, useState } from "react";

const UserActivityPage = ({ currentUser, targetUser, onBack }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadActivities = async () => {
      if (!targetUser?.id) {
        setError("조회할 유저 정보가 없습니다.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:8081/api/admin/users/${targetUser.id}/activities`,
          {
            headers: {
              Authorization: `Bearer ${currentUser?.token}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error("활동 로그를 불러오지 못했습니다.");
        }

        setActivities(await response.json());
      } catch (loadError) {
        setError(loadError.message || "활동 로그를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    loadActivities();
  }, [currentUser?.token, targetUser?.id]);

  return (
    <div className="content-card">
      <div className="user-activity-header">
        <div>
          <h3>유저 활동 로그</h3>
          <p className="page-desc">
            {targetUser?.nickname} ({targetUser?.email})
          </p>
        </div>
        <button type="button" className="btn-cancel" onClick={onBack}>
          관리자 페이지로
        </button>
      </div>

      {loading ? <p className="page-desc">불러오는 중...</p> : null}
      {!loading && error ? <p className="page-desc">{error}</p> : null}

      {!loading && !error ? (
        <div className="admin-table-wrap">
          <table className="stock-table admin-table">
            <thead>
              <tr>
                <th>시각</th>
                <th>행동</th>
                <th>대상</th>
                <th>설명</th>
              </tr>
            </thead>
            <tbody>
              {activities.length === 0 ? (
                <tr>
                  <td colSpan="4">기록된 활동이 없습니다.</td>
                </tr>
              ) : (
                activities.map((activity, index) => (
                  <tr key={`${activity.actionType}-${activity.occurredAt}-${index}`}>
                    <td>{activity.occurredAt?.replace("T", " ") || "-"}</td>
                    <td>{activity.actionType}</td>
                    <td>{activity.targetTitle || activity.targetType || "-"}</td>
                    <td>{activity.description || "-"}</td>
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

export default UserActivityPage;
