import React, { useEffect, useMemo, useState } from "react";

const ACCESS_ACTIONS = ["LOGIN", "LOGOUT"];
const POST_ACTIONS = [
  "POST_CREATE",
  "POST_UPDATE",
  "POST_DELETE",
  "COMMENT_CREATE",
  "COMMENT_DELETE",
  "POST_LIKE",
];

const ACTION_FILTERS = [
  { key: "ALL", label: "전체" },
  { key: "ACCESS", label: "접속" },
  { key: "POST", label: "게시글" },
  { key: "INQUIRY", label: "문의" },
  { key: "REPORT", label: "신고" },
  { key: "NOTIFICATION", label: "알림" },
];

const matchesFilter = (activity, filter) => {
  if (filter === "ALL") return true;
  if (filter === "ACCESS") return ACCESS_ACTIONS.includes(activity.actionType);
  if (filter === "POST") return POST_ACTIONS.includes(activity.actionType);
  if (filter === "INQUIRY") return activity.actionType?.startsWith("INQUIRY");
  if (filter === "REPORT") return activity.actionType?.startsWith("REPORT");
  if (filter === "NOTIFICATION") {
    return activity.actionType?.startsWith("NOTIFICATION");
  }
  return activity.actionType === filter;
};

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

const UserActivityPage = ({ currentUser, targetUser, onBack, onOpenPost }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [activitySearchKeyword, setActivitySearchKeyword] = useState("");

  useEffect(() => {
    const loadActivities = async () => {
      if (!targetUser?.id) {
        setError("조회할 유저 정보가 없습니다.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/admin/users/${targetUser.id}/activities`,
          {
            headers: {
              Authorization: `Bearer ${currentUser?.token}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error("유저 로그를 불러오지 못했습니다.");
        }

        setActivities(await response.json());
      } catch (loadError) {
        setError(loadError.message || "유저 로그를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    loadActivities();
  }, [currentUser?.token, targetUser?.id]);

  const filteredActivities = useMemo(
    () => {
      const keyword = activitySearchKeyword.trim().toLowerCase();

      return activities
        .filter((activity) => matchesFilter(activity, activeFilter))
        .filter((activity) => {
          if (!keyword) {
            return true;
          }

          return [
            formatDateTime(activity.occurredAt),
            activity.occurredAt,
            targetUser?.nickname,
            targetUser?.email,
            activity.actionLabel,
            activity.actionType,
            activity.targetLabel,
            activity.detail,
          ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(keyword));
        });
    },
    [activities, activeFilter, activitySearchKeyword, targetUser?.email, targetUser?.nickname],
  );

  const summary = useMemo(() => {
    const total = activities.length;
    const access = activities.filter((item) =>
      ACCESS_ACTIONS.includes(item.actionType),
    ).length;
    const posts = activities.filter((item) =>
      POST_ACTIONS.includes(item.actionType),
    ).length;
    const inquiries = activities.filter((item) =>
      item.actionType?.startsWith("INQUIRY"),
    ).length;

    return { total, access, posts, inquiries };
  }, [activities]);

  return (
    <div className="content-card user-activity-card">
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

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">활동 로그를 불러오는 중입니다...</div>
        </div>
      ) : null}

      {!loading && error ? <p className="page-desc">{error}</p> : null}

      {!loading && !error ? (
        <>
          <div className="activity-summary-grid">
            <article className="activity-summary-card">
              <span className="activity-summary-label">전체 이벤트</span>
              <strong>{summary.total}</strong>
            </article>
            <article className="activity-summary-card">
              <span className="activity-summary-label">접속 기록</span>
              <strong>{summary.access}</strong>
            </article>
            <article className="activity-summary-card">
              <span className="activity-summary-label">게시글 관련</span>
              <strong>{summary.posts}</strong>
            </article>
            <article className="activity-summary-card">
              <span className="activity-summary-label">문의 관련</span>
              <strong>{summary.inquiries}</strong>
            </article>
          </div>

          <div className="activity-filter-toolbar">
            <div className="activity-filter-row">
              {ACTION_FILTERS.map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  className={`activity-filter-chip ${
                    activeFilter === filter.key ? "is-active" : ""
                  }`}
                  onClick={() => setActiveFilter(filter.key)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <div className="admin-search-wrap activity-search-wrap">
              <input
                type="text"
                className="admin-search-input"
                placeholder="검색어 입력"
                value={activitySearchKeyword}
                onChange={(event) => setActivitySearchKeyword(event.target.value)}
              />
            </div>
          </div>

          <table className="stock-table admin-table activity-table">
            <thead>
              <tr>
                <th>날짜</th>
                <th>활동</th>
                <th>대상</th>
                <th>내용</th>
              </tr>
            </thead>
            <tbody>
              {filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan="4">조건에 맞는 활동 로그가 없습니다.</td>
                </tr>
              ) : (
                filteredActivities.map((activity, index) => {
                  const isPostLinked = !!activity.postId && onOpenPost;

                  return (
                    <tr key={`${activity.actionType}-${activity.occurredAt}-${index}`}>
                      <td>{formatDateTime(activity.occurredAt)}</td>
                      <td>{activity.actionLabel || activity.actionType || "-"}</td>
                      <td>{activity.targetLabel || "-"}</td>
                      <td>
                        {isPostLinked ? (
                          <button
                            type="button"
                            className="activity-table-link"
                            onClick={() => onOpenPost(activity.postId)}
                          >
                            {activity.detail || "-"}
                          </button>
                        ) : (
                          activity.detail || "-"
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </>
      ) : null}
    </div>
  );
};

export default UserActivityPage;
