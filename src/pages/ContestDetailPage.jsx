import React, { useEffect, useState } from "react";

const ContestDetailPage = ({
  competitionId,
  isLoggedIn,
  currentUser,
  onBack,
}) => {
  const [competition, setCompetition] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [participantLoading, setParticipantLoading] = useState(false);
  const [joining, setJoining] = useState(false);

  const isAdmin = currentUser?.role === "admin";

  useEffect(() => {
    if (!competitionId) return;

    setLoading(true);

    fetch(`http://localhost:8081/api/competitions/${competitionId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("대회 상세 정보를 불러오지 못했습니다.");
        }
        return res.json();
      })
      .then((data) => {
        setCompetition(data);
      })
      .catch((err) => {
        console.error("대회 상세 조회 오류:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [competitionId]);

  useEffect(() => {
    if (!competitionId || !isAdmin) {
      setParticipants([]);
      return;
    }

    setParticipantLoading(true);

    fetch(`http://localhost:8081/api/competitions/${competitionId}/participants`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("참가자 목록을 불러오지 못했습니다.");
        }
        return res.json();
      })
      .then((data) => {
        setParticipants(data);
      })
      .catch((err) => {
        console.error("참가자 목록 조회 오류:", err);
        setParticipants([]);
      })
      .finally(() => {
        setParticipantLoading(false);
      });
  }, [competitionId, isAdmin]);

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
          backgroundColor: "#e8f7ee",
          color: "#1f7a45",
        };
      case "SCHEDULED":
        return {
          backgroundColor: "#eef2ff",
          color: "#3b5bdb",
        };
      case "ENDED":
        return {
          backgroundColor: "#f1f3f5",
          color: "#495057",
        };
      default:
        return {
          backgroundColor: "#f1f3f5",
          color: "#495057",
        };
    }
  };

  const formatDate = (dateTimeString) => {
    if (!dateTimeString) return "-";
    return new Date(dateTimeString).toLocaleString("ko-KR");
  };

  const formatMoney = (amount) => {
    if (amount == null) return "-";
    return Number(amount).toLocaleString("ko-KR") + "원";
  };

  const handleJoin = async () => {
  if (joining) return;

  if (!isLoggedIn) {
    alert("로그인 후 참가할 수 있습니다.");
    return;
  }

  if (!currentUser?.userId) {
    alert("사용자 정보가 없습니다.");
    return;
  }

  setJoining(true); // 🔥 요청 시작

  try {
    const response = await fetch(
      `http://localhost:8081/api/competitions/${competitionId}/join?userId=${currentUser.userId}`,
      {
        method: "POST",
      }
    );

    const text = await response.text();

    if (!response.ok) {
      alert(text || "대회 참가에 실패했습니다.");
      return;
    }

    alert(text || "대회 참가 완료!");
    onBack();
  } catch (error) {
    console.error("대회 참가 오류:", error);
    alert("참가 처리 중 오류가 발생했습니다.");
  } finally {
    setJoining(false);
  }
};

  if (loading) {
    return <p>대회 정보를 불러오는 중입니다...</p>;
  }

  if (!competition) {
    return <p>대회 정보를 찾을 수 없습니다.</p>;
  }

  return (
    <section
      style={{
        maxWidth: "960px",
        margin: "0 auto",
        padding: "24px 20px 60px",
      }}
    >
      <button
        type="button"
        onClick={onBack}
        style={{
          marginBottom: "20px",
          cursor: "pointer",
          border: "none",
          background: "transparent",
          fontSize: "14px",
          color: "#555",
        }}
      >
        ← 목록으로 돌아가기
      </button>

      <div
        style={{
          background: "linear-gradient(135deg, #111 0%, #2b2b2b 100%)",
          color: "#fff",
          borderRadius: "24px",
          padding: "32px",
          boxShadow: "0 18px 40px rgba(0,0,0,0.15)",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "8px 14px",
            borderRadius: "999px",
            fontSize: "13px",
            fontWeight: "700",
            marginBottom: "18px",
            ...getStatusStyle(competition.status),
          }}
        >
          {formatStatus(competition.status)}
        </div>

        <h1
          style={{
            margin: "0 0 12px",
            fontSize: "32px",
            fontWeight: "800",
          }}
        >
          {competition.title}
        </h1>

        <p
          style={{
            margin: 0,
            color: "rgba(255,255,255,0.82)",
            fontSize: "16px",
            lineHeight: "1.7",
          }}
        >
          {competition.description}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "28px",
        }}
      >
        <InfoCard label="시작일" value={formatDate(competition.startAt)} />
        <InfoCard label="종료일" value={formatDate(competition.endAt)} />
        <InfoCard
          label="초기 시드머니"
          value={formatMoney(competition.initialSeedMoney)}
        />
        <InfoCard
          label="최대 참가자 수"
          value={`${competition.maxParticipants ?? "-"}명`}
        />
        <InfoCard
          label="현재 참가자 수"
          value={`${competition.participantCount ?? 0}명`}
        />
      </div>

      {isAdmin && (
        <div
          style={{
            backgroundColor: "#fff",
            border: "1px solid #ececec",
            borderRadius: "20px",
            padding: "24px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
            marginBottom: "24px",
          }}
        >
          <h3
            style={{
              marginTop: 0,
              marginBottom: "16px",
              fontSize: "20px",
            }}
          >
            참가자 목록
          </h3>

          {participantLoading ? (
            <p style={{ color: "#666", margin: 0 }}>
              참가자 정보를 불러오는 중입니다...
            </p>
          ) : participants.length === 0 ? (
            <p style={{ color: "#666", margin: 0 }}>
              현재 참가한 사용자가 없습니다.
            </p>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {participants.map((participant) => (
                <div
                  key={`${participant.userId}-${participant.accountId}`}
                  style={{
                    border: "1px solid #ececec",
                    borderRadius: "14px",
                    padding: "16px",
                    backgroundColor: "#fafafa",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "10px",
                      gap: "12px",
                      flexWrap: "wrap",
                    }}
                  >
                    <strong style={{ fontSize: "16px", color: "#111" }}>
                      {participant.nickname}
                    </strong>

                    <span
                      style={{
                        padding: "6px 10px",
                        borderRadius: "999px",
                        backgroundColor: "#f1f3f5",
                        fontSize: "12px",
                        fontWeight: "700",
                        color: "#495057",
                      }}
                    >
                      {participant.status}
                    </span>
                  </div>

                  <div style={{ fontSize: "14px", color: "#555", lineHeight: "1.7" }}>
                    <div>이메일: {participant.email}</div>
                    <div>계좌 ID: {participant.accountId}</div>
                    <div>참가일: {formatDate(participant.joinedAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!isAdmin && (
        <div
          style={{
            backgroundColor: "#fff",
            border: "1px solid #ececec",
            borderRadius: "20px",
            padding: "24px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
          }}
        >
          <h3
            style={{
              marginTop: 0,
              marginBottom: "10px",
              fontSize: "20px",
            }}
          >
            지금 참가하시겠어요?
          </h3>

          <p
            style={{
              marginTop: 0,
              marginBottom: "20px",
              color: "#666",
              lineHeight: "1.6",
            }}
          >
            참가하면 대회 전용 계좌가 생성되고, 해당 대회에서 모의투자를 진행할 수 있습니다.
          </p>

          <button
  type="button"
  onClick={handleJoin}
  disabled={joining} // 🔥 핵심
  style={{
    padding: "14px 22px",
    border: "none",
    borderRadius: "12px",
    backgroundColor: joining ? "#999" : "#111", // 시각적으로도 표시
    color: "#fff",
    cursor: joining ? "not-allowed" : "pointer",
    fontWeight: "700",
    fontSize: "15px",
    boxShadow: "0 10px 20px rgba(0,0,0,0.12)",
  }}
>
  {joining ? "참가 중..." : "참가하기"} {/* UX 개선 */}
</button>
        </div>
      )}
    </section>
  );
};

const InfoCard = ({ label, value }) => {
  return (
    <div
      style={{
        backgroundColor: "#fff",
        border: "1px solid #ececec",
        borderRadius: "18px",
        padding: "20px",
        boxShadow: "0 8px 18px rgba(0,0,0,0.05)",
      }}
    >
      <div
        style={{
          fontSize: "13px",
          color: "#777",
          marginBottom: "10px",
          fontWeight: "600",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "18px",
          fontWeight: "800",
          color: "#111",
          wordBreak: "keep-all",
        }}
      >
        {value}
      </div>
    </div>
  );
};

export default ContestDetailPage;