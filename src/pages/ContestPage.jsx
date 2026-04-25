import React, { useEffect, useMemo, useState } from "react";

const ContestPage = ({
  onSelectCompetition,
  onViewRanking,
  currentUser,
  isLoggedIn,
  onCreateCompetition,
  onEditCompetition,
  onDeleteCompetition,
  onToggleCompetitionVisibility,
}) => {
  const [contestList, setContestList] = useState([]);
  const [myCompetitions, setMyCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingCompetitionId, setDeletingCompetitionId] = useState(null);
  const [togglingCompetitionId, setTogglingCompetitionId] = useState(null);

  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [showOnlyJoined, setShowOnlyJoined] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");

  const isAdmin = currentUser?.role === "admin";

  const fetchCompetitions = () => {
    setLoading(true);

    fetch("/api/competitions", {
      headers: {
        Authorization: `Bearer ${currentUser?.token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("대회 목록을 불러오지 못했습니다.");
        }
        return res.json();
      })
      .then((data) => {
        setContestList(data);
      })
      .catch((err) => {
        console.error("대회 목록 조회 오류:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCompetitions();
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !currentUser?.userId) {
      setMyCompetitions([]);
      return;
    }

    fetch(
      `/api/competitions/my?userId=${currentUser.userId}`,
      {
        headers: {
          Authorization: `Bearer ${currentUser?.token}`,
        },
      },
    )
      .then((res) => {
        if (!res.ok) {
          throw new Error("내 참가 대회를 불러오지 못했습니다.");
        }
        return res.json();
      })
      .then((data) => {
        setMyCompetitions(data);
      })
      .catch((err) => {
        console.error("내 참가 대회 조회 오류:", err);
        setMyCompetitions([]);
      });
  }, [isLoggedIn, currentUser]);

  const formatStatus = (status) => {
    switch (status) {
      case "ONGOING":
        return "진행중";
      case "SCHEDULED":
        return "예정";
      case "ENDED":
        return "종료";
      case "CANCELED":
        return "취소";
      default:
        return status;
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "ONGOING":
        return {
          background: "#eaf7ee",
          color: "#1f7a45",
          border: "1px solid #ccebd6",
        };
      case "SCHEDULED":
        return {
          background: "#eef2ff",
          color: "#3b5bdb",
          border: "1px solid #dbe4ff",
        };
      case "ENDED":
        return {
          background: "#f3f4f6",
          color: "#4b5563",
          border: "1px solid #e5e7eb",
        };
      case "CANCELED":
        return {
          background: "#fff5f5",
          color: "#c92a2a",
          border: "1px solid #ffc9c9",
        };
      default:
        return {
          background: "#f3f4f6",
          color: "#4b5563",
          border: "1px solid #e5e7eb",
        };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("ko-KR");
  };

  const formatMoney = (value) => {
    if (value == null) return "-";
    return `${Number(value).toLocaleString("ko-KR")}원`;
  };

  const filteredContestList = useMemo(() => {
    return contestList.filter((contest) => {
      const matchesJoined = !showOnlyJoined
        ? true
        : myCompetitions.includes(contest.competitionId);

      const matchesStatus =
        selectedStatus === "ALL" ? true : contest.status === selectedStatus;

      const keyword = searchKeyword.trim().toLowerCase();
      const matchesKeyword =
        keyword.length === 0
          ? true
          : `${contest.title ?? ""} ${contest.description ?? ""}`
            .toLowerCase()
            .includes(keyword);

      return matchesJoined && matchesStatus && matchesKeyword;
    });
  }, [
    contestList,
    myCompetitions,
    selectedStatus,
    showOnlyJoined,
    searchKeyword,
  ]);

  const resetFilters = () => {
    setSelectedStatus("ALL");
    setShowOnlyJoined(false);
    setSearchKeyword("");
  };

  if (loading) {
    return (
      <section style={styles.page}>
        <div style={styles.hero}>
          <div>
            <div style={styles.heroBadge}>COMPETITION</div>
            <h1 style={styles.heroTitle}>모의투자 대회</h1>
            <p style={styles.heroText}>다양한 대회를 탐색하고 참여해보세요.</p>
          </div>
        </div>

        <div style={styles.emptyCard}>
          <p style={styles.emptyText}>대회 목록을 불러오는 중입니다...</p>
        </div>
      </section>
    );
  }

  return (
    <section style={styles.page}>
      <div style={styles.hero}>
        <div>
          <div style={styles.heroBadge}>COMPETITION</div>
          <h1 style={styles.heroTitle}>모의투자 대회</h1>
          <p style={styles.heroText}>
            대회 일정과 참가 현황을 확인하고, 원하는 대회에 참여해보세요.
          </p>
        </div>

        {isAdmin && (
          <button onClick={onCreateCompetition} style={styles.createButton}>
            + 대회 생성
          </button>
        )}
      </div>

      <div style={styles.guideBox}>
        <div style={styles.guideTitle}>안내</div>
        <div style={styles.guideText}>
          진행중/예정/종료/취소 상태별로 대회를 확인할 수 있고, 참가한 대회만 따로
          모아볼 수 있습니다. 검색창에서 대회명 또는 설명으로 원하는 대회를
          빠르게 찾을 수 있습니다.
        </div>
      </div>

      <div style={styles.filterPanel}>
        <div style={styles.filterRow}>
          <div style={styles.filterLabel}>상태</div>
          <div style={styles.chipGroup}>
            {[
              { value: "ALL", label: "전체" },
              { value: "ONGOING", label: "진행중" },
              { value: "SCHEDULED", label: "예정" },
              { value: "ENDED", label: "종료" },
              { value: "CANCELED", label: "취소" },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setSelectedStatus(item.value)}
                style={{
                  ...styles.chipButton,
                  ...(selectedStatus === item.value
                    ? styles.chipButtonActive
                    : {}),
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.filterRow}>
          <div style={styles.filterLabel}>참가 여부</div>
          <div style={styles.chipGroup}>
            <button
              type="button"
              onClick={() => setShowOnlyJoined(false)}
              style={{
                ...styles.chipButton,
                ...(!showOnlyJoined ? styles.chipButtonActive : {}),
              }}
            >
              전체 대회
            </button>
            <button
              type="button"
              onClick={() => setShowOnlyJoined(true)}
              style={{
                ...styles.chipButton,
                ...(showOnlyJoined ? styles.chipButtonActive : {}),
              }}
            >
              참가한 대회만
            </button>
          </div>
        </div>

        <div style={styles.filterRow}>
          <div style={styles.filterLabel}>검색</div>
          <div style={styles.searchArea}>
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="대회명 또는 설명을 입력하세요."
              style={styles.searchInput}
            />
            <button
              type="button"
              onClick={resetFilters}
              style={styles.resetButton}
            >
              초기화
            </button>
          </div>
        </div>
      </div>

      <div style={styles.resultHeader}>
        <div style={styles.resultCount}>
          전체 <strong>{filteredContestList.length}</strong>건
        </div>
      </div>

      {filteredContestList.length === 0 ? (
        <div style={styles.emptyCard}>
          <div style={styles.emptyIcon}>📭</div>
          <p style={styles.emptyTitle}>조건에 맞는 대회가 없습니다.</p>
          <p style={styles.emptyText}>
            필터를 바꾸거나 검색어를 다시 입력해보세요.
          </p>
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredContestList.map((contest) => {
            const isJoined = myCompetitions.includes(contest.competitionId);

            const participantCount = Number(contest.participantCount ?? 0);
            const maxParticipants = Number(contest.maxParticipants ?? 0);
            const hasParticipantLimit = maxParticipants > 0;
            const percent = hasParticipantLimit
              ? Math.min((participantCount / maxParticipants) * 100, 100)
              : null;

            return (
              <div
                key={contest.competitionId}
                onClick={() => onSelectCompetition(contest.competitionId)}
                style={styles.card}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow =
                    "0 20px 40px rgba(15, 23, 42, 0.10)";
                  e.currentTarget.style.borderColor = "#dbe4ff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 10px 24px rgba(15, 23, 42, 0.06)";
                  e.currentTarget.style.borderColor = "#e5e7eb";
                }}
              >
                <div style={styles.cardTopRow}>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <span
                      style={{
                        ...styles.statusBadge,
                        ...getStatusStyle(contest.status),
                      }}
                    >
                      {formatStatus(contest.status)}
                    </span>

                    {isJoined && <span style={styles.joinedBadge}>참가중</span>}

                    {isAdmin && contest.isPublic === false && (
                      <span style={styles.privateBadge}>비공개</span>
                    )}
                  </div>
                </div>

                <div style={styles.categoryText}>모의투자 대회</div>

                <h3 style={styles.cardTitle}>{contest.title}</h3>

                <p style={styles.cardDescription}>
                  {contest.description || "대회 설명이 없습니다."}
                </p>

                <div style={styles.infoList}>
                  <div style={styles.infoItem}>
                    <span style={styles.infoItemLabel}>기간</span>
                    <span style={styles.infoItemValue}>
                      {formatDate(contest.startAt)} - {formatDate(contest.endAt)}
                    </span>
                  </div>

                  <div style={styles.infoItem}>
                    <span style={styles.infoItemLabel}>초기 시드머니</span>
                    <span style={styles.infoItemValue}>
                      {formatMoney(contest.initialSeedMoney)}
                    </span>
                  </div>

                  <div style={styles.infoItem}>
                    <span style={styles.infoItemLabel}>참가 현황</span>
                    <span style={styles.infoItemValue}>
                      {participantCount}명
                      {maxParticipants > 0 ? ` / ${maxParticipants}명` : ""}
                    </span>
                  </div>
                </div>

                {hasParticipantLimit ? (
                  <div style={styles.progressWrap}>
                    <div style={styles.progressHeader}>
                      <span style={styles.progressLabel}>참가율</span>
                      <span style={styles.progressValue}>
                        {Math.round(percent)}%
                      </span>
                    </div>

                    <div style={styles.progressBar}>
                      <div
                        style={{
                          ...styles.progressFill,
                          width: `${percent}%`,
                          background:
                            percent >= 100
                              ? "linear-gradient(90deg, #ff8787 0%, #fa5252 100%)"
                              : percent >= 70
                                ? "linear-gradient(90deg, #ffd43b 0%, #fab005 100%)"
                                : "linear-gradient(90deg, #748ffc 0%, #4c6ef5 100%)",
                        }}
                      />
                    </div>

                    <div style={styles.progressFooter}>
                      <span>{participantCount} / {maxParticipants}</span>
                      <span>
                        {percent >= 100
                          ? "정원 마감"
                          : percent >= 70
                            ? "참가 활발"
                            : "참가 가능"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div style={styles.noLimitBox}>
                    <span style={styles.noLimitLabel}>정원 제한 없음</span>
                    <span style={styles.noLimitValue}>현재 {participantCount}명 참가 중</span>
                  </div>
                )}

                <div style={styles.actionRow}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCompetition(contest.competitionId);
                    }}
                    style={styles.detailButtonPrimary}
                  >
                    상세보기
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();

                      if (contest.status === "SCHEDULED" || contest.status === "CANCELED") {
                        alert("예정/취소된 대회는 랭킹을 조회할 수 없습니다.");
                        return;
                      }

                      if (onViewRanking) {
                        onViewRanking(contest.competitionId);
                      }
                    }}
                    style={{
                      ...styles.rankingButton,
                      ...((contest.status === "SCHEDULED" || contest.status === "CANCELED")
                        ? {
                          backgroundColor: "#ccc",
                          cursor: "not-allowed",
                        }
                        : {}),
                    }}
                    disabled={contest.status === "SCHEDULED" || contest.status === "CANCELED"}
                  >
                    랭킹보기
                  </button>
                </div>

                {isAdmin && (
                  <div style={styles.adminButtonRow}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditCompetition(contest.competitionId);
                      }}
                      style={styles.editButton}
                    >
                      수정
                    </button>

                    <button
                      onClick={async (e) => {
                        e.stopPropagation();

                        try {
                          setTogglingCompetitionId(contest.competitionId);

                          const success = await onToggleCompetitionVisibility(
                            contest.competitionId,
                            !contest.isPublic,
                          );

                          if (success) {
                            fetchCompetitions();
                          }
                        } finally {
                          setTogglingCompetitionId(null);
                        }
                      }}
                      disabled={togglingCompetitionId === contest.competitionId}
                      style={{
                        ...styles.visibilityButton,
                        ...(contest.isPublic
                          ? styles.visibilityButtonHide
                          : styles.visibilityButtonShow),
                      }}
                    >
                      {togglingCompetitionId === contest.competitionId
                        ? "변경 중..."
                        : contest.isPublic
                          ? "비공개"
                          : "공개"}
                    </button>

                    <button
                      onClick={async (e) => {
                        e.stopPropagation();

                        const confirmDelete =
                          window.confirm("정말 삭제 처리하시겠습니까?");
                        if (!confirmDelete) return;

                        try {
                          setDeletingCompetitionId(contest.competitionId);

                          const success = await onDeleteCompetition(
                            contest.competitionId,
                          );

                          if (success) {
                            fetchCompetitions();
                          }
                        } finally {
                          setDeletingCompetitionId(null);
                        }
                      }}
                      disabled={deletingCompetitionId === contest.competitionId}
                      style={{
                        ...styles.deleteButton,
                        ...(deletingCompetitionId === contest.competitionId
                          ? styles.deleteButtonDisabled
                          : {}),
                      }}
                    >
                      {deletingCompetitionId === contest.competitionId
                        ? "처리 중..."
                        : "삭제"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

const styles = {
  page: {
    maxWidth: "1440px",
    margin: "0 auto",
    padding: "28px 20px 56px",
  },
  hero: {
    background: "linear-gradient(135deg, #4874d4, #c6d2e7)",
    border: "none",
    borderRadius: "24px",
    padding: "50px 30px",
    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.1)",
    marginBottom: "20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    position: "relative",
    color: "white",
  },
  heroBadge: {
    display: "inline-block",
    padding: "6px 14px",
    borderRadius: "999px",
    background: "rgba(255, 255, 255, 0.2)",
    color: "#fff",
    fontSize: "12px",
    fontWeight: "800",
    marginBottom: "12px",
    backdropFilter: "blur(4px)",
  },
  heroTitle: {
    margin: "0 0 10px",
    fontSize: "36px",
    fontWeight: "800",
    color: "#fff",
  },
  heroText: {
    margin: 0,
    fontSize: "15px",
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: "1.6",
    maxWidth: "800px",
  },
  createButton: {
    padding: "12px 18px",
    borderRadius: "12px",
    border: "none",
    background: "#111827",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "14px",
    whiteSpace: "nowrap",
  },
  guideBox: {
    border: "1px solid #d1d5db",
    background: "#fafafa",
    borderRadius: "14px",
    padding: "16px 18px",
    marginBottom: "18px",
  },
  guideTitle: {
    fontSize: "14px",
    fontWeight: "800",
    color: "#374151",
    marginBottom: "8px",
  },
  guideText: {
    fontSize: "14px",
    color: "#6b7280",
    lineHeight: "1.7",
  },
  filterPanel: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "20px",
    marginBottom: "18px",
  },
  filterRow: {
    display: "grid",
    gridTemplateColumns: "100px 1fr",
    gap: "14px",
    alignItems: "center",
    marginBottom: "16px",
  },
  filterLabel: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#374151",
  },
  chipGroup: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  chipButton: {
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#374151",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px",
  },
  chipButtonActive: {
    background: "#4c6ef5",
    color: "#fff",
    border: "1px solid #4c6ef5",
  },
  searchArea: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  searchInput: {
    flex: 1,
    minWidth: "260px",
    height: "42px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    padding: "0 14px",
    fontSize: "14px",
    outline: "none",
    background: "#fff",
  },
  resetButton: {
    height: "42px",
    padding: "0 16px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#374151",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "13px",
  },
  resultHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "14px",
  },
  resultCount: {
    fontSize: "14px",
    color: "#4b5563",
  },
  emptyCard: {
    backgroundColor: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "52px 24px",
    textAlign: "center",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.04)",
  },
  emptyIcon: {
    fontSize: "34px",
    marginBottom: "10px",
  },
  emptyTitle: {
    margin: "0 0 8px",
    fontSize: "18px",
    fontWeight: "700",
    color: "#111827",
  },
  emptyText: {
    margin: 0,
    fontSize: "14px",
    color: "#6b7280",
    lineHeight: "1.6",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "16px",
  },
  card: {
    background: "#fff",
    borderRadius: "16px",
    padding: "16px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.06)",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  cardTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "14px",
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
  },
  joinedBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
    background: "#111827",
    color: "#fff",
    border: "1px solid #111827",
  },
  privateBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
    background: "#fff7ed",
    color: "#c2410c",
    border: "1px solid #fed7aa",
  },
  categoryText: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#4c6ef5",
    marginBottom: "8px",
  },
  cardTitle: {
    margin: "0 0 8px",
    fontSize: "20px",
    fontWeight: "800",
    color: "#111827",
    lineHeight: "1.35",
    wordBreak: "keep-all",
  },
  cardDescription: {
    margin: "0 0 12px",
    fontSize: "13px",
    color: "#6b7280",
    lineHeight: "1.7",
    minHeight: "38px",
  },
  infoList: {
    display: "grid",
    gap: "8px",
    marginBottom: "16px",
  },
  infoItem: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    paddingBottom: "8px",
    borderBottom: "1px solid #f0f2f5",
  },
  infoItemLabel: {
    fontSize: "13px",
    color: "#6b7280",
    fontWeight: "700",
    flexShrink: 0,
  },
  infoItemValue: {
    fontSize: "13px",
    color: "#111827",
    fontWeight: "700",
    textAlign: "right",
  },
  noLimitBox: {
    marginTop: "4px",
    padding: "14px",
    borderRadius: "14px",
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  noLimitLabel: {
    fontSize: "13px",
    fontWeight: "800",
    color: "#374151",
  },
  noLimitValue: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#4c6ef5",
  },
  progressWrap: {
    marginTop: "4px",
    padding: "12px",
    borderRadius: "14px",
    background: "#f9fafb",
    border: "1px solid #eef2f7",
  },
  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },
  progressLabel: {
    fontSize: "13px",
    color: "#475467",
    fontWeight: "700",
  },
  progressValue: {
    fontSize: "15px",
    color: "#111827",
    fontWeight: "800",
  },
  progressBar: {
    height: "10px",
    background: "#e5e7eb",
    borderRadius: "999px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: "999px",
    transition: "width 0.3s ease",
  },
  progressFooter: {
    marginTop: "8px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "12px",
    color: "#6b7280",
    gap: "8px",
    flexWrap: "wrap",
  },
  actionRow: {
    marginTop: "12px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
  },
  detailButtonPrimary: {
    height: "40px",
    borderRadius: "12px",
    border: "none",
    background: "#4c6ef5",
    color: "#fff",
    fontWeight: "800",
    fontSize: "13px",
    cursor: "pointer",
  },
  rankingButton: {
    height: "40px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#111827",
    fontWeight: "800",
    fontSize: "13px",
    cursor: "pointer",
  },
  adminButtonRow: {
    marginTop: "12px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "8px",
  },
  editButton: {
    height: "40px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    backgroundColor: "#fff",
    color: "#111827",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "13px",
  },
  visibilityButton: {
    height: "40px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "13px",
  },
  visibilityButtonHide: {
    background: "#fff7ed",
    color: "#c2410c",
    border: "1px solid #fed7aa",
  },
  visibilityButtonShow: {
    background: "#eff6ff",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
  },
  deleteButton: {
    height: "40px",
    borderRadius: "10px",
    border: "none",
    background: "#ef4444",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "13px",
  },
  deleteButtonDisabled: {
    background: "#fca5a5",
    cursor: "not-allowed",
    opacity: 0.9,
    boxShadow: "none",
  },
};

export default ContestPage;