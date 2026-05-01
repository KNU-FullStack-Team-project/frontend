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
const ORDER_ACTIONS = ["ORDER_BUY", "ORDER_SELL"];
const PROFILE_ACTIONS = ["PROFILE_NICKNAME_UPDATE"];
const ACCOUNT_ACTIONS = ["ACCOUNT_RESET"];
const OTHER_ACTION_GROUPS = ["INQUIRY", "REPORT", "SUSPENSION"];

const ACTION_FILTERS = [
  { key: "ALL", label: "전체" },
  { key: "ACCESS", label: "접속" },
  { key: "ORDER", label: "주문" },
  { key: "POST", label: "게시글" },
  { key: "OTHER", label: "기타" },
];

const matchesFilter = (activity, filter) => {
  if (filter === "ALL") return true;
  if (filter === "ACCESS") return ACCESS_ACTIONS.includes(activity.actionType);
  if (filter === "ORDER") return ORDER_ACTIONS.includes(activity.actionType);
  if (filter === "POST") return POST_ACTIONS.includes(activity.actionType);
  if (filter === "OTHER") {
    return (
      PROFILE_ACTIONS.includes(activity.actionType) ||
      ACCOUNT_ACTIONS.includes(activity.actionType) ||
      OTHER_ACTION_GROUPS.some((group) => activity.actionType?.startsWith(group))
    );
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

const parseDetail = (detail) => {
  if (!detail) return {};

  return detail.split("; ").reduce((acc, part) => {
    const [key, ...rest] = part.split("=");
    if (!key) return acc;

    acc[key.trim()] = rest.join("=").trim();
    return acc;
  }, {});
};

const formatNotice = (value) => (value === "true" ? "공지" : "일반");

const hasNoticeChange = (values) => {
  return (
    !!values?.beforeIsNotice &&
    !!values?.afterIsNotice &&
    values.beforeIsNotice !== values.afterIsNotice
  );
};

const getNoticeChangeText = (values) =>
  `공지 변경: ${formatNotice(values.beforeIsNotice)} -> ${formatNotice(
    values.afterIsNotice,
  )}`;

const formatLogValue = (value) => {
  if (value == null || value === "" || value === "-") {
    return "-";
  }

  return value;
};

const appendChange = (changes, label, before, after) => {
  if (!before || !after || before === after) return;
  changes.push(`${label}: '${before}' -> '${after}'`);
};

const getPostUpdateSummary = (log) => {
  const values = parseDetail(log.detail);
  const changes = [];

  appendChange(changes, "제목", values.beforeTitle, values.afterTitle);

  if (hasNoticeChange(values)) {
    changes.push(getNoticeChangeText(values));
  }

  if (
    values.beforeContent &&
    values.afterContent &&
    values.beforeContent !== values.afterContent
  ) {
    changes.push("본문 변경");
  }

  const ownership =
    values.ownerAction === "true"
      ? "본인 게시글"
      : values.targetUserId
        ? `유저 #${values.targetUserId}의 게시글`
        : "게시글";

  return changes.length > 0
    ? `${ownership} 수정: ${changes.join(", ")}`
    : `${ownership} 수정`;
};

const formatAdminDetail = (log) => {
  const values = parseDetail(log.detail);

  if (log.actionType === "POST_UPDATE") {
    return getPostUpdateSummary(log);
  }

  if (log.actionType === "POST_DELETE") {
    const targetLabel = values.isNotice === "true" ? "공지" : "게시글";
    const ownership =
      values.ownerAction === "true"
        ? `본인 ${targetLabel}`
        : values.targetUserId
          ? `유저 #${values.targetUserId}의 ${targetLabel}`
          : targetLabel;
    return values.title
      ? `${ownership} 삭제: '${values.title}'`
      : `${ownership} 삭제`;
  }

  if (log.actionType === "COMMENT_DELETE") {
    const ownership =
      values.ownerAction === "true"
        ? "본인 댓글"
        : values.targetUserId
          ? `유저 #${values.targetUserId}의 댓글`
          : "댓글";
    const postText = values.postId ? `게시글 #${values.postId}에서 ` : "";
    return values.content
      ? `${postText}${ownership} 삭제: '${values.content}'`
      : `${postText}${ownership} 삭제`;
  }

  if (log.actionType === "NOTICE_CREATE") {
    const board = values.board ? `[${values.board}] ` : "";
    return values.title
      ? `${board}공지 작성: 제목 '${values.title}'${
          values.content ? `, 내용 '${values.content}'` : ""
        }`
      : `${board}공지 작성`;
  }

  if (log.actionType === "INQUIRY_REPLY") {
    const target = values.targetUserId ? `유저 #${values.targetUserId} 문의에 ` : "";
    return values.answer
      ? `${target}답변 등록: '${values.answer}'`
      : `${target}답변 등록`;
  }

  if (log.actionType === "USER_UPDATE") {
    const changes = [];

    appendChange(changes, "권한", values.beforeRole, values.afterRole);
    appendChange(changes, "상태", values.beforeStatus, values.afterStatus);

    if (values.afterStatus === "SUSPENDED") {
      if (values.afterSuspendedUntil && values.afterSuspendedUntil !== "-") {
        changes.push(`정지 해제 예정: ${values.afterSuspendedUntil}`);
      } else {
        changes.push("영구 정지");
      }

      if (values.afterSuspensionReason && values.afterSuspensionReason !== "-") {
        changes.push(`정지 사유: ${values.afterSuspensionReason}`);
      }
    } else if (
      values.beforeStatus === "SUSPENDED" &&
      values.afterStatus &&
      values.afterStatus !== "SUSPENDED"
    ) {
      changes.push("정지 해제");
    }

    return changes.length > 0
      ? `회원 #${log.targetId} 정보 변경: ${changes.join(", ")}`
      : `회원 #${log.targetId} 정보 변경`;
  }

  return log.detail || "-";
};

const formatActivityDetail = (activity) => {
  if (["POST_DELETE", "COMMENT_DELETE"].includes(activity.actionType)) {
    return formatAdminDetail(activity);
  }

  return activity.detail || "-";
};

const hasPostUpdateBody = (log) => {
  return log.actionType === "POST_UPDATE";
};

const hasLinkedPostTarget = (log) => {
  return ["POST_UPDATE", "POST_DELETE", "NOTICE_CREATE"].includes(log.actionType) && log.targetId;
};

const hasLinkedInquiryTarget = (log) => {
  return log.actionType === "INQUIRY_REPLY" && log.targetId;
};

const getUpdatePostId = (log) => log?.postId || log?.targetId || "-";

const isAdminManagedActivity = (activity) => {
  if (!["POST_UPDATE", "POST_DELETE", "COMMENT_DELETE"].includes(activity.actionType)) {
    return false;
  }

  const values = parseDetail(activity.detail);
  return values.ownerAction === "false";
};

const UserActivityPage = ({
  currentUser,
  targetUser,
  onBack,
  onOpenPost,
  onOpenInquiry,
}) => {
  const isAdminTarget =
    targetUser?.role === "admin" || targetUser?.role === "ADMIN";

  const [activeView, setActiveView] = useState("user");
  const [activities, setActivities] = useState([]);
  const [adminLogs, setAdminLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminLogLoading, setAdminLogLoading] = useState(false);
  const [error, setError] = useState("");
  const [adminLogError, setAdminLogError] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [activitySearchKeyword, setActivitySearchKeyword] = useState("");
  const [selectedUpdateLog, setSelectedUpdateLog] = useState(null);

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
            headers: currentUser?.token
              ? { Authorization: `Bearer ${currentUser.token}` }
              : undefined,
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

  useEffect(() => {
    if (!isAdminTarget) {
      setAdminLogs([]);
      setAdminLogLoading(false);
      setAdminLogError("");
      return;
    }

    const loadAdminLogs = async () => {
      setAdminLogLoading(true);
      setAdminLogError("");

      try {
        const response = await fetch("/api/admin/action-logs", {
          headers: currentUser?.token
            ? { Authorization: `Bearer ${currentUser.token}` }
            : undefined,
        });

        if (!response.ok) {
          throw new Error("관리자 기록을 불러오지 못했습니다.");
        }

        setAdminLogs(await response.json());
      } catch (loadError) {
        setAdminLogError(loadError.message || "관리자 기록을 불러오지 못했습니다.");
      } finally {
        setAdminLogLoading(false);
      }
    };

    loadAdminLogs();
  }, [currentUser?.token, isAdminTarget, targetUser?.id]);

  const filteredActivities = useMemo(() => {
    const keyword = activitySearchKeyword.trim().toLowerCase();

    return activities
      .filter((activity) => !isAdminManagedActivity(activity))
      .filter((activity) => matchesFilter(activity, activeFilter))
      .filter((activity) => {
        if (!keyword) return true;

        return [
          formatDateTime(activity.occurredAt),
          activity.occurredAt,
          targetUser?.nickname,
          targetUser?.email,
          activity.actionLabel,
          activity.actionType,
          activity.targetLabel,
          formatActivityDetail(activity),
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));
      });
  }, [
    activities,
    activeFilter,
    activitySearchKeyword,
    targetUser?.email,
    targetUser?.nickname,
  ]);

  const filteredAdminLogs = useMemo(() => {
    const keyword = activitySearchKeyword.trim().toLowerCase();
    const targetUserId = targetUser?.id != null ? String(targetUser.id) : "";

    return adminLogs
      .filter((log) => !targetUserId || String(log.adminUserId) === targetUserId)
      .filter((log) => {
        if (!keyword) return true;

        return [
          formatDateTime(log.occurredAt),
          log.occurredAt,
          log.adminUserId,
          log.actionLabel,
          log.actionType,
          log.targetLabel,
          formatAdminDetail(log),
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));
      });
  }, [activitySearchKeyword, adminLogs, targetUser?.id]);

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

  const selectedUpdateValues = selectedUpdateLog
    ? parseDetail(selectedUpdateLog.detail)
    : null;
  const selectedUpdatePostId = getUpdatePostId(selectedUpdateLog);
  const selectedUpdateHasContent =
    !!selectedUpdateValues?.beforeContent || !!selectedUpdateValues?.afterContent;
  const selectedUpdateHasNoticeChange = hasNoticeChange(selectedUpdateValues);

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
          {isAdminTarget ? (
            <div className="activity-filter-toolbar">
              <div className="activity-filter-row">
                <button
                  type="button"
                  className={`activity-filter-chip ${
                    activeView === "user" ? "is-active" : ""
                  }`}
                  onClick={() => {
                    setActiveView("user");
                    setActivitySearchKeyword("");
                    setSelectedUpdateLog(null);
                  }}
                >
                  유저 로그
                </button>
                <button
                  type="button"
                  className={`activity-filter-chip ${
                    activeView === "admin" ? "is-active" : ""
                  }`}
                  onClick={() => {
                    setActiveView("admin");
                    setActivitySearchKeyword("");
                  }}
                >
                  관리자
                </button>
              </div>
            </div>
          ) : null}

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

          {activeView === "user" && selectedUpdateLog && selectedUpdateValues ? (
            <section
              className="admin-table-wrap"
              style={{ marginBottom: "16px", padding: "16px" }}
            >
              <div className="user-activity-header" style={{ marginBottom: "12px" }}>
                <div>
                  <h4 style={{ margin: 0 }}>게시글 수정 내용</h4>
                  <p className="page-desc">
                    {formatDateTime(selectedUpdateLog.occurredAt)} · 게시글 #
                    {selectedUpdatePostId}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setSelectedUpdateLog(null)}
                >
                  닫기
                </button>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: "12px",
                }}
              >
                <article>
                  <strong>이전 내용</strong>
                  <div className="report-sub-text">
                    제목: {formatLogValue(selectedUpdateValues.beforeTitle)}
                  </div>
                  <p style={{ whiteSpace: "pre-wrap" }}>
                    {formatLogValue(selectedUpdateValues.beforeContent)}
                  </p>
                </article>
                <article>
                  <strong>이후 내용</strong>
                  <div className="report-sub-text">
                    제목: {formatLogValue(selectedUpdateValues.afterTitle)}
                  </div>
                  <p style={{ whiteSpace: "pre-wrap" }}>
                    {formatLogValue(selectedUpdateValues.afterContent)}
                  </p>
                </article>
              </div>
              {selectedUpdateHasNoticeChange ? (
                <p className="report-sub-text" style={{ marginTop: "10px" }}>
                  {getNoticeChangeText(selectedUpdateValues)}
                </p>
              ) : null}
              {!selectedUpdateHasContent ? (
                <p className="report-sub-text" style={{ marginTop: "10px" }}>
                  이 수정 로그에는 본문 기록이 없어 제목만 표시됩니다.
                </p>
              ) : null}
            </section>
          ) : null}

          {activeView === "admin" ? (
            <>
              <div className="activity-filter-toolbar">
                <div className="admin-search-wrap activity-search-wrap">
                  <input
                    type="text"
                    className="admin-search-input"
                    placeholder="행동, 대상, 내용 검색"
                    value={activitySearchKeyword}
                    onChange={(event) => setActivitySearchKeyword(event.target.value)}
                  />
                </div>
              </div>

              {selectedUpdateLog && selectedUpdateValues ? (
                <section
                  className="admin-table-wrap"
                  style={{ marginBottom: "16px", padding: "16px" }}
                >
                  <div className="user-activity-header" style={{ marginBottom: "12px" }}>
                    <div>
                      <h4 style={{ margin: 0 }}>게시글 수정 내용</h4>
                      <p className="page-desc">
                        {formatDateTime(selectedUpdateLog.occurredAt)} · 게시글 #
                        {selectedUpdatePostId}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={() => setSelectedUpdateLog(null)}
                    >
                      닫기
                    </button>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                      gap: "12px",
                    }}
                  >
                    <article>
                      <strong>이전 내용</strong>
                      <div className="report-sub-text">
                        제목: {formatLogValue(selectedUpdateValues.beforeTitle)}
                      </div>
                      <p style={{ whiteSpace: "pre-wrap" }}>
                        {formatLogValue(selectedUpdateValues.beforeContent)}
                      </p>
                    </article>
                    <article>
                      <strong>이후 내용</strong>
                      <div className="report-sub-text">
                        제목: {formatLogValue(selectedUpdateValues.afterTitle)}
                      </div>
                      <p style={{ whiteSpace: "pre-wrap" }}>
                        {formatLogValue(selectedUpdateValues.afterContent)}
                      </p>
                    </article>
                  </div>
                  {selectedUpdateHasNoticeChange ? (
                    <p className="report-sub-text" style={{ marginTop: "10px" }}>
                      {getNoticeChangeText(selectedUpdateValues)}
                    </p>
                  ) : null}
                  {!selectedUpdateHasContent ? (
                    <p className="report-sub-text" style={{ marginTop: "10px" }}>
                      이 수정 로그에는 본문 기록이 없어 제목만 표시됩니다.
                    </p>
                  ) : null}
                </section>
              ) : null}

              <table className="stock-table admin-table activity-table">
                <thead>
                  <tr>
                    <th>일시</th>
                    <th>행동</th>
                    <th>대상</th>
                    <th>내용</th>
                  </tr>
                </thead>
                <tbody>
                  {adminLogLoading ? (
                    <tr>
                      <td colSpan="4">관리자 기록을 불러오는 중입니다.</td>
                    </tr>
                  ) : adminLogError ? (
                    <tr>
                      <td colSpan="4">{adminLogError}</td>
                    </tr>
                  ) : filteredAdminLogs.length === 0 ? (
                    <tr>
                      <td colSpan="4">이 유저와 관련된 관리자 기록이 없습니다.</td>
                    </tr>
                  ) : (
                    filteredAdminLogs.map((log, index) => (
                      <tr key={`${log.actionType}-${log.occurredAt}-${index}`}>
                        <td>{formatDateTime(log.occurredAt)}</td>
                        <td>{log.actionLabel || log.actionType || "-"}</td>
                        <td>{log.targetLabel || "-"}</td>
                        <td>
                          {hasLinkedPostTarget(log) ? (
                            <button
                              type="button"
                              className="activity-table-link"
                              onClick={() =>
                                onOpenPost &&
                                onOpenPost(
                                  Number(getUpdatePostId(log)),
                                  hasPostUpdateBody(log) ? log : null,
                                )
                              }
                            >
                              {formatAdminDetail(log)}
                            </button>
                          ) : hasLinkedInquiryTarget(log) ? (
                            <button
                              type="button"
                              className="activity-table-link"
                              onClick={() => onOpenInquiry && onOpenInquiry(log.targetId)}
                            >
                              {formatAdminDetail(log)}
                            </button>
                          ) : (
                            <span>{formatAdminDetail(log)}</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </>
          ) : (
            <>
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
                    <th>일시</th>
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
                            {activity.actionType === "POST_UPDATE" ? (
                              <button
                                type="button"
                                className="activity-table-link"
                                onClick={() =>
                                  activity.postId && onOpenPost && onOpenPost(activity.postId, activity)
                                }
                              >
                                {getPostUpdateSummary(activity)}
                              </button>
                            ) : hasLinkedInquiryTarget(activity) ? (
                              <button
                                type="button"
                                className="activity-table-link"
                                onClick={() => onOpenInquiry && onOpenInquiry(activity.targetId)}
                              >
                                {activity.detail || "문의 답변 확인"}
                              </button>
                            ) : isPostLinked ? (
                              <button
                                type="button"
                                className="activity-table-link"
                                onClick={() => onOpenPost(activity.postId)}
                              >
                                {formatActivityDetail(activity)}
                              </button>
                            ) : (
                              formatActivityDetail(activity)
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </>
          )}
        </>
      ) : null}
    </div>
  );
};

export default UserActivityPage;
