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
        return { backgroundColor: "#e8f7ee", color: "#1f7a45" };
      case "SCHEDULED":
        return { backgroundColor: "#eef2ff", color: "#3b5bdb" };
      case "ENDED":
        return { backgroundColor: "#f1f3f5", color: "#555" };
      default:
        return { backgroundColor: "#f1f3f5", color: "#555" };
    }
  };

  const filteredContestList = useMemo(() => {
    if (!showOnlyJoined) return contestList;
    return contestList.filter((contest) =>
      myCompetitions.includes(contest.competitionId)
    );
  }, [contestList, myCompetitions, showOnlyJoined]);

  return (
    <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "20px" }}>
      <p style={{ marginBottom: "20px", color: "#666" }}>
        다양한 모의투자 대회에 참여하고 수익률을 비교해보세요.
      </p>

      {isAdmin && (
        <div style={{ marginBottom: "20px", textAlign: "right" }}>
          <button
            onClick={onCreateCompetition}
            style={{
              padding: "10px 16px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: "#111",
              color: "#fff",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            + 대회 생성
          </button>
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "20px",
        }}
      >
        <button
          onClick={() => setShowOnlyJoined((prev) => !prev)}
          style={{
            padding: "10px 16px",
            borderRadius: "10px",
            border: "1px solid #ddd",
            backgroundColor: showOnlyJoined ? "#111" : "#fff",
            color: showOnlyJoined ? "#fff" : "#111",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          {showOnlyJoined ? "전체 대회 보기" : "참가한 대회만 보기"}
        </button>
      </div>

      {loading ? (
        <p>대회 목록을 불러오는 중입니다...</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "20px",
          }}
        >
          {filteredContestList.map((contest) => {
            const isJoined = myCompetitions.includes(contest.competitionId);

            const percent =
              contest.maxParticipants && contest.participantCount
                ? Math.min(
                    (contest.participantCount / contest.maxParticipants) * 100,
                    100
                  )
                : 0;

            return (
              <div
                key={contest.competitionId}
                onClick={() => onSelectCompetition(contest.competitionId)}
                style={{
                  background: "#fff",
                  borderRadius: "20px",
                  padding: "20px",
                  border: "1px solid #eee",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  position: "relative",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "translateY(-4px)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "translateY(0)")
                }
              >
                <div
                  style={{
                    position: "absolute",
                    top: "16px",
                    right: "16px",
                    padding: "6px 10px",
                    borderRadius: "999px",
                    fontSize: "12px",
                    fontWeight: "700",
                    ...getStatusStyle(contest.status),
                  }}
                >
                  {formatStatus(contest.status)}
                </div>

                {isJoined && (
                  <div
                    style={{
                      position: "absolute",
                      top: "16px",
                      left: "16px",
                      background: "#111",
                      color: "#fff",
                      padding: "6px 10px",
                      borderRadius: "999px",
                      fontSize: "12px",
                      fontWeight: "700",
                    }}
                  >
                    참가중
                  </div>
                )}

                <h3 style={{ marginTop: "40px" }}>{contest.title}</h3>

                <p style={{ fontSize: "14px", color: "#666" }}>
                  {contest.description}
                </p>

                <div style={{ fontSize: "13px", marginBottom: "8px" }}>
                  👥 {contest.participantCount ?? 0}명 참여
                </div>

                <div
                  style={{
                    height: "8px",
                    background: "#eee",
                    borderRadius: "10px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${percent}%`,
                      height: "100%",
                      background: "#111",
                    }}
                  />
                </div>

                <div style={{ fontSize: "12px", marginTop: "5px" }}>
                  참가율 {Math.round(percent)}%
                </div>

                {isAdmin && (
                  <div
                    style={{
                      marginTop: "12px",
                      display: "flex",
                      gap: "8px",
                    }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditCompetition(contest.competitionId);
                      }}
                      style={{
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: "1px solid #ddd",
                        backgroundColor: "#fff",
                        cursor: "pointer",
                        fontWeight: "600",
                      }}
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

                        const success = await onDeleteCompetition(
                          contest.competitionId
                        );

                        if (success) {
                          fetchCompetitions();
                        }
                      }}
                      style={{
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: "none",
                        backgroundColor: "#e03131",
                        color: "#fff",
                        cursor: "pointer",
                        fontWeight: "600",
                      }}
                    >
                      삭제
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

export default ContestPage;