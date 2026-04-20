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

const getActionTone = (actionType) => {
  if (actionType === "LOGIN") return "success";
  if (actionType === "LOGOUT") return "muted";
  if (POST_ACTIONS.includes(actionType)) return "neutral";
  if (actionType?.startsWith("INQUIRY")) return "info";
  if (actionType?.startsWith("REPORT")) return "danger";
  if (actionType?.startsWith("NOTIFICATION")) return "warning";
  return "neutral";
};

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

  const [activeFilter, setActiveFilter] = useState("ALL");

  const filteredActivities = useMemo(
    () => activities.filter((activity) => matchesFilter(activity, activeFilter)),
    [activities, activeFilter],
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

          <div className="activity-filter-row">
            {ACTION_FILTERS.map((filter) => (
              <button
                key={filter.key}
                type="button"
                className={`activity-filter-chip ${activeFilter === filter.key ? "is-active" : ""
                  }`}
                onClick={() => setActiveFilter(filter.key)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {filteredActivities.length === 0 ? (
            <div className="activity-empty-state">
              조건에 맞는 활동 로그가 없습니다.
            </div>
          ) : (
            <div className="activity-timeline">
              {filteredActivities.map((activity, index) => {
                const isPostLinked = !!activity.postId && onOpenPost;

                return (
                  <article
                    key={`${activity.actionType}-${activity.occurredAt}-${index}`}
                    className="activity-timeline-item"
                  >
                    <div className="activity-timeline-rail">
                      <span className="activity-timeline-dot"></span>
                    </div>
                    <button
                      type="button"
                      className="activity-timeline-body activity-log-button"
                      onClick={() => {
                        if (isPostLinked) {
                          onOpenPost(activity.postId);
                        }
                      }}
                    >
                      <div className="activity-timeline-top">
                        <span
                          className={`activity-badge tone-${getActionTone(
                            activity.actionType || "",
                          )}`}
                        >
                          {activity.actionLabel || activity.actionType}
                        </span>
                        <time className="activity-time">
                          {formatDateTime(activity.occurredAt)}
                        </time>
                      </div>
                      <div className="activity-main-line">
                        <strong>{activity.targetLabel || "-"}</strong>
                      </div>
                      <p className="activity-detail">{activity.detail || "-"}</p>
                      {isPostLinked ? (
                        <div className="activity-link-hint">클릭해서 해당 게시글 열기</div>
                      ) : null}
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
};

export default UserActivityPage;
