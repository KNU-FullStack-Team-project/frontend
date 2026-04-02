import React, { useEffect, useMemo, useState } from "react";

const ContestPage = ({
  onSelectCompetition,
  currentUser,
  isLoggedIn,
  onCreateCompetition,
  onEditCompetition,
  onDeleteCompetition,
}) => {
  const [contestList, setContestList] = useState([]);
  const [myCompetitions, setMyCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOnlyJoined, setShowOnlyJoined] = useState(false);
  const [deletingCompetitionId, setDeletingCompetitionId] = useState(null);

  const isAdmin = currentUser?.role === "admin";

  const fetchCompetitions = () => {
    setLoading(true);

    fetch("http://localhost:8081/api/competitions")
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
      `http://localhost:8081/api/competitions/my?userId=${currentUser.userId}`
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
      default:
        return status;
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "ONGOING":
        return {
          background: "linear-gradient(135deg, #e8f7ee 0%, #d3f9d8 100%)",
          color: "#1f7a45",
        };
      case "SCHEDULED":
        return {
          background: "linear-gradient(135deg, #eef2ff 0%, #dbe4ff 100%)",
          color: "#3b5bdb",
        };
      case "ENDED":
        return {
          background: "linear-gradient(135deg, #f1f3f5 0%, #e9ecef 100%)",
          color: "#555",
        };
      default:
        return {
          background: "linear-gradient(135deg, #f1f3f5 0%, #e9ecef 100%)",
          color: "#555",
        };
    }
  };

  const filteredContestList = useMemo(() => {
    if (!showOnlyJoined) return contestList;
    return contestList.filter((contest) =>
      myCompetitions.includes(contest.competitionId)
    );
  }, [contestList, myCompetitions, showOnlyJoined]);

  if (loading) {
    return (
      <section style={styles.page}>
        <div style={styles.hero}>
          <div>
            <div style={styles.heroBadge}>COMPETITION</div>
            <h1 style={styles.heroTitle}>모의투자 대회</h1>
            <p style={styles.heroText}>
              다양한 대회에 참여하고 다른 참가자들과 수익률을 비교해보세요.
            </p>
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
            다양한 모의투자 대회에 참여하고 수익률을 비교해보세요.
          </p>
        </div>

        {isAdmin && (
          <button onClick={onCreateCompetition} style={styles.createButton}>
            + 대회 생성
          </button>
        )}
      </div>

      <div style={styles.toolbar}>
        <button
          onClick={() => setShowOnlyJoined((prev) => !prev)}
          style={{
            ...styles.filterButton,
            ...(showOnlyJoined ? styles.filterButtonActive : {}),
          }}
        >
          {showOnlyJoined ? "전체 대회 보기" : "참가한 대회만 보기"}
        </button>
      </div>

      {filteredContestList.length === 0 ? (
        <div style={styles.emptyCard}>
          <div style={styles.emptyIcon}>📭</div>
          <p style={styles.emptyTitle}>
            {showOnlyJoined
              ? "참가한 대회가 없습니다."
              : "현재 등록된 대회가 없습니다."}
          </p>
          <p style={styles.emptyText}>
            {showOnlyJoined
              ? "다른 대회에 참가하면 여기에서 바로 확인할 수 있어요."
              : "새로운 대회를 생성하거나 잠시 후 다시 확인해보세요."}
          </p>
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredContestList.map((contest) => {
            const isJoined = myCompetitions.includes(contest.competitionId);

            const participantCount = Number(contest.participantCount ?? 0);
            const maxParticipants = Number(contest.maxParticipants ?? 0);

            const percent =
              maxParticipants > 0
                ? Math.min((participantCount / maxParticipants) * 100, 100)
                : 0;

            return (
              <div
                key={contest.competitionId}
                onClick={() => onSelectCompetition(contest.competitionId)}
                style={styles.card}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-6px)";
                  e.currentTarget.style.boxShadow =
                    "0 22px 40px rgba(15, 23, 42, 0.12)";
                  e.currentTarget.style.borderColor = "#dbe4ff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 12px 28px rgba(15, 23, 42, 0.08)";
                  e.currentTarget.style.borderColor = "#edf1f5";
                }}
              >
                <div
                  style={{
                    ...styles.statusBadge,
                    ...getStatusStyle(contest.status),
                  }}
                >
                  {formatStatus(contest.status)}
                </div>

                {isJoined && <div style={styles.joinedBadge}>참가중</div>}

                <div style={styles.cardTopAccent} />

                <h3 style={styles.cardTitle}>{contest.title}</h3>

                <p style={styles.cardDescription}>
                  {contest.description || "대회 설명이 없습니다."}
                </p>

                <div style={styles.infoRow}>
                  <div style={styles.infoPill}>
                    <span style={styles.infoIcon}>👥</span>
                    <span>{participantCount}명 참여</span>
                  </div>

                  <div style={styles.infoPillLight}>
                    {maxParticipants > 0
                      ? `정원 ${maxParticipants}명`
                      : "정원 미설정"}
                  </div>
                </div>

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
                            ? "linear-gradient(90deg, #ff6b6b 0%, #e03131 100%)"
                            : percent >= 70
                            ? "linear-gradient(90deg, #fcc419 0%, #f08c00 100%)"
                            : "linear-gradient(90deg, #748ffc 0%, #4c6ef5 100%)",
                      }}
                    />
                  </div>

                  <div style={styles.progressFooter}>
                    <span>
                      {maxParticipants > 0
                        ? `${participantCount} / ${maxParticipants}`
                        : `${participantCount}명 참가`}
                    </span>
                    <span>
                      {percent >= 100
                        ? "마감 임박"
                        : percent >= 70
                        ? "참가 열기 높음"
                        : "참가 가능"}
                    </span>
                  </div>
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

                        const confirmDelete = window.confirm(
                          "정말 삭제하시겠습니까?"
                        );
                        if (!confirmDelete) return;

                        try {
                          setDeletingCompetitionId(contest.competitionId);

                          const success = await onDeleteCompetition(
                            contest.competitionId
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
                        ? "삭제 중..."
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
    maxWidth: "1180px",
    margin: "0 auto",
    padding: "28px 20px 56px",
  },
  hero: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "16px",
    padding: "28px 30px",
    borderRadius: "28px",
    background:
      "linear-gradient(135deg, #ffffff 0%, #f8faff 45%, #eef3ff 100%)",
    border: "1px solid #edf1f5",
    boxShadow: "0 16px 32px rgba(15, 23, 42, 0.06)",
    marginBottom: "22px",
  },
  heroBadge: {
    display: "inline-block",
    padding: "6px 12px",
    borderRadius: "999px",
    background: "#eef2ff",
    color: "#4c6ef5",
    fontSize: "12px",
    fontWeight: "800",
    letterSpacing: "0.08em",
    marginBottom: "12px",
  },
  heroTitle: {
    margin: "0 0 10px",
    fontSize: "34px",
    fontWeight: "800",
    color: "#111827",
  },
  heroText: {
    margin: 0,
    fontSize: "15px",
    lineHeight: "1.7",
    color: "#667085",
  },
  createButton: {
    padding: "12px 18px",
    borderRadius: "14px",
    border: "none",
    background: "linear-gradient(135deg, #111827 0%, #1f2937 100%)",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "14px",
    boxShadow: "0 10px 20px rgba(17, 24, 39, 0.18)",
    whiteSpace: "nowrap",
  },
  toolbar: {
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: "20px",
  },
  filterButton: {
    padding: "11px 16px",
    borderRadius: "12px",
    border: "1px solid #dbe1ea",
    backgroundColor: "#fff",
    color: "#111827",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "14px",
    boxShadow: "0 6px 16px rgba(15, 23, 42, 0.04)",
  },
  filterButtonActive: {
    background: "linear-gradient(135deg, #111827 0%, #374151 100%)",
    color: "#fff",
    border: "1px solid transparent",
  },
  emptyCard: {
    backgroundColor: "#fff",
    border: "1px solid #edf1f5",
    borderRadius: "24px",
    padding: "52px 24px",
    textAlign: "center",
    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
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
    color: "#667085",
    lineHeight: "1.6",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "22px",
  },
  card: {
    background: "linear-gradient(180deg, #ffffff 0%, #fcfdff 100%)",
    borderRadius: "24px",
    padding: "22px",
    border: "1px solid #edf1f5",
    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.08)",
    cursor: "pointer",
    transition: "all 0.22s ease",
    position: "relative",
    minHeight: "290px",
    overflow: "hidden",
  },
  cardTopAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "5px",
    background: "linear-gradient(90deg, #748ffc 0%, #4c6ef5 100%)",
  },
  statusBadge: {
    position: "absolute",
    top: "18px",
    right: "18px",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
    boxShadow: "0 6px 14px rgba(0,0,0,0.04)",
  },
  joinedBadge: {
    position: "absolute",
    top: "18px",
    left: "18px",
    background: "linear-gradient(135deg, #111827 0%, #374151 100%)",
    color: "#fff",
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
    boxShadow: "0 8px 16px rgba(17, 24, 39, 0.14)",
  },
  cardTitle: {
    marginTop: "42px",
    marginBottom: "12px",
    fontSize: "27px",
    fontWeight: "800",
    color: "#111827",
    lineHeight: "1.3",
    wordBreak: "keep-all",
  },
  cardDescription: {
    fontSize: "14px",
    color: "#667085",
    lineHeight: "1.7",
    minHeight: "48px",
    marginBottom: "18px",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "16px",
  },
  infoPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 12px",
    borderRadius: "999px",
    background: "#f5f7fb",
    color: "#334155",
    fontSize: "13px",
    fontWeight: "700",
  },
  infoPillLight: {
    display: "inline-flex",
    alignItems: "center",
    padding: "8px 12px",
    borderRadius: "999px",
    background: "#eef2ff",
    color: "#4c6ef5",
    fontSize: "13px",
    fontWeight: "700",
  },
  infoIcon: {
    fontSize: "12px",
  },
  progressWrap: {
    marginTop: "4px",
    padding: "14px",
    borderRadius: "18px",
    background: "#f8fafc",
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
    height: "11px",
    background: "#e9edf5",
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
    color: "#667085",
    gap: "8px",
    flexWrap: "wrap",
  },
  adminButtonRow: {
    marginTop: "16px",
    display: "flex",
    gap: "8px",
  },
  editButton: {
    padding: "9px 14px",
    borderRadius: "10px",
    border: "1px solid #dbe1ea",
    backgroundColor: "#fff",
    color: "#111827",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "13px",
  },
  deleteButton: {
    padding: "9px 14px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(135deg, #fa5252 0%, #e03131 100%)",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "13px",
    boxShadow: "0 8px 18px rgba(224, 49, 49, 0.18)",
  },
  deleteButtonDisabled: {
    background: "#f1a8a8",
    cursor: "not-allowed",
    opacity: 0.85,
    boxShadow: "none",
  },
};

export default ContestPage;