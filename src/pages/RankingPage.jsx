import React, { useEffect, useMemo, useState } from "react";

const RankingPage = ({ selectedCompetitionId, currentUser, isLoggedIn }) => {
  const [competitions, setCompetitions] = useState([]);
  const [myCompetitions, setMyCompetitions] = useState([]);
  const [selectedId, setSelectedId] = useState(selectedCompetitionId ?? null);
  const [ranking, setRanking] = useState([]);

  const [competitionLoading, setCompetitionLoading] = useState(true);
  const [rankingLoading, setRankingLoading] = useState(false);

  const [competitionError, setCompetitionError] = useState("");
  const [rankingError, setRankingError] = useState("");

  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [showOnlyJoined, setShowOnlyJoined] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");

  useEffect(() => {
    if (selectedCompetitionId) {
      setSelectedId(selectedCompetitionId);
    }
  }, [selectedCompetitionId]);

  useEffect(() => {
    if (!isLoggedIn || !currentUser?.userId) {
      setMyCompetitions([]);
      return;
    }

    fetch(
      `/api/competitions/my?userId=${currentUser.userId}`
    )
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("내 참가 대회를 불러오지 못했습니다.");
        }
        return res.json();
      })
      .then((data) => {
        setMyCompetitions(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("내 참가 대회 조회 오류:", err);
        setMyCompetitions([]);
      });
  }, [isLoggedIn, currentUser]);

  useEffect(() => {
    setCompetitionLoading(true);
    setCompetitionError("");

    fetch("/api/competitions")
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("대회 목록을 불러오지 못했습니다.");
        }
        return res.json();
      })
      .then((data) => {
        const safeData = Array.isArray(data) ? data : [];
        setCompetitions(safeData);

        if (selectedCompetitionId) {
          setSelectedId(selectedCompetitionId);
          return;
        }

        if (safeData.length === 0) {
          setSelectedId(null);
          return;
        }

        const ongoing = safeData.filter((c) => c.status === "ONGOING");
        const ended = safeData.filter((c) => c.status === "ENDED");
        const scheduled = safeData.filter((c) => c.status === "SCHEDULED");

        if (ongoing.length > 0) {
          setSelectedId(ongoing[ongoing.length - 1].competitionId);
        } else if (ended.length > 0) {
          setSelectedId(ended[ended.length - 1].competitionId);
        } else if (scheduled.length > 0) {
          setSelectedId(scheduled[scheduled.length - 1].competitionId);
        } else {
          setSelectedId(null);
        }
      })
      .catch((err) => {
        console.error("대회 목록 조회 오류:", err);
        setCompetitions([]);
        setCompetitionError(
          err.message || "대회 목록 조회 중 오류가 발생했습니다.",
        );
      })
      .finally(() => {
        setCompetitionLoading(false);
      });
  }, [selectedCompetitionId]);

  useEffect(() => {
    if (!selectedId) {
      setRanking([]);
      setRankingError("");
      return;
    }

    setRankingLoading(true);
    setRankingError("");

    fetch(`/api/competitions/${selectedId}/ranking`)
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "랭킹 정보를 불러오지 못했습니다.");
        }
        return res.json();
      })
      .then((data) => {
        setRanking(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("랭킹 조회 오류:", err);
        setRanking([]);
        setRankingError(err.message || "랭킹 조회 중 오류가 발생했습니다.");
      })
      .finally(() => {
        setRankingLoading(false);
      });
  }, [selectedId]);

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

  const filteredCompetitions = useMemo(() => {
    return competitions.filter((contest) => {
      const matchesStatus =
        selectedStatus === "ALL" ? true : contest.status === selectedStatus;

      const matchesJoined = !showOnlyJoined
        ? true
        : myCompetitions.includes(contest.competitionId);

      const keyword = searchKeyword.trim().toLowerCase();
      const matchesKeyword =
        keyword.length === 0
          ? true
          : `${contest.title ?? ""} ${contest.description ?? ""}`
            .toLowerCase()
            .includes(keyword);

      return matchesStatus && matchesKeyword && matchesJoined;
    });
  }, [
    competitions,
    selectedStatus,
    searchKeyword,
    showOnlyJoined,
    myCompetitions,
  ]);

  const selectedCompetition = useMemo(() => {
    return competitions.find((c) => c.competitionId === selectedId) ?? null;
  }, [competitions, selectedId]);

  useEffect(() => {
    if (filteredCompetitions.length === 0) return;

    const existsInFiltered = filteredCompetitions.some(
      (contest) => contest.competitionId === selectedId,
    );

    if (!existsInFiltered) {
      setSelectedId(filteredCompetitions[0].competitionId);
    }
  }, [filteredCompetitions, selectedId]);

  const top3 = ranking.slice(0, 3);
  const others = ranking.slice(3);

  const resetFilters = () => {
    setSelectedStatus("ALL");
    setShowOnlyJoined(false);
    setSearchKeyword("");
  };

  const renderTopCard = (user, displayRank) => {
    const medalStyle =
      displayRank === 1
        ? styles.firstCard
        : displayRank === 2
          ? styles.secondCard
          : styles.thirdCard;

    return (
      <div key={displayRank} style={{ ...styles.topCard, ...medalStyle }}>
        <div style={styles.topRankBadge}>{displayRank}위</div>
        <div style={styles.profileCircle}>
          {user?.profileImageUrl ? (
            <img
              src={`${user.profileImageUrl}`}
              alt={user.nickname}
              style={styles.profileImage}
            />
          ) : (
            <span style={styles.profileFallback}>
              {(user?.nickname || "?").charAt(0)}
            </span>
          )}
        </div>
        <div style={styles.topNickname}>{user?.nickname || "-"}</div>
        <div
          className={user?.returnRate > 0 ? "up" : user?.returnRate < 0 ? "down" : ""}
          style={styles.topReturnRate}
        >
          {user?.returnRate != null
            ? `${user.returnRate > 0 ? "+" : ""}${Number(user.returnRate).toFixed(2)}%`
            : "-"}
        </div>
        <div
          className={user?.profitAmount > 0 ? "up" : user?.profitAmount < 0 ? "down" : ""}
          style={styles.topProfit}
        >
          {user?.profitAmount != null ? formatMoney(user.profitAmount) : "-"}
        </div>
      </div>
    );
  };

  if (competitionLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">대회 목록을 불러오는 중입니다...</div>
      </div>
    );
  }

  return (
    <section style={styles.page}>
      <div style={styles.hero}>
        <div style={styles.heroContentLeft}>
          <div style={styles.heroBadge}>RANKING</div>
          <h1 style={styles.heroTitle}>대회 랭킹</h1>
          <p style={styles.heroText}>
            실시간 수익률 랭킹을 확인하고, 상위 랭커들의 투자 전략을 배워보세요.
          </p>
        </div>
        <div style={styles.heroContentRight}>
          {isLoggedIn && currentUser?.profileImageUrl && (
            <img
              src={`${currentUser.profileImageUrl}`}
              alt="내 프로필"
              style={styles.userProfileImage}
            />
          )}
        </div>
      </div>


      <div style={styles.filterPanel}>
        <div style={styles.filterRow}>
          <div style={styles.filterLabel}>상태</div>
          <div style={styles.chipGroup}>
            {[
              { value: "ALL", label: "전체" },
              { value: "ONGOING", label: "진행중" },
              { value: "ENDED", label: "종료" },
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
              onClick={() => {
                if (!isLoggedIn) {
                  alert("로그인 후 이용해주세요.");
                  return;
                }
                setShowOnlyJoined(true);
              }}
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

      {competitionError ? (
        <div style={styles.emptyCard}>
          <p style={styles.emptyTitle}>대회 목록을 불러오지 못했습니다.</p>
          <p style={styles.emptyText}>{competitionError}</p>
        </div>
      ) : (
        <>
          <div style={styles.resultHeader}>
            <div style={styles.resultCount}>
              선택 가능 대회 <strong>{filteredCompetitions.length}</strong>건
            </div>
          </div>

          {filteredCompetitions.length === 0 ? (
            <div style={styles.emptyCard}>
              <div style={styles.emptyIcon}>📭</div>
              <p style={styles.emptyTitle}>조건에 맞는 대회가 없습니다.</p>
              <p style={styles.emptyText}>
                필터를 바꾸거나 검색어를 다시 입력해보세요.
              </p>
            </div>
          ) : (
            <div style={styles.competitionSelectorWrap}>
              {filteredCompetitions.map((contest) => (
                <button
                  key={contest.competitionId}
                  type="button"
                  onClick={() => setSelectedId(contest.competitionId)}
                  style={{
                    ...styles.competitionSelectorButton,
                    ...(selectedId === contest.competitionId
                      ? styles.competitionSelectorButtonActive
                      : {}),
                  }}
                >
                  <div style={styles.competitionSelectorTitle}>
                    {contest.title}
                  </div>
                  <div style={styles.competitionSelectorMeta}>
                    {formatStatus(contest.status)} ·{" "}
                    {formatDate(contest.startAt)}
                  </div>
                </button>
              ))}
            </div>
          )}

          {selectedCompetition && (
            <div style={styles.summaryCard}>
              <div style={styles.summaryTop}>
                <div>
                  <div style={styles.summaryCategory}>선택된 대회</div>
                  <h2 style={styles.summaryTitle}>
                    {selectedCompetition.title}
                  </h2>
                </div>
                <span
                  style={{
                    ...styles.statusBadge,
                    ...getStatusStyle(selectedCompetition.status),
                  }}
                >
                  {formatStatus(selectedCompetition.status)}
                </span>
              </div>

              <div style={styles.summaryGrid}>
                <div style={styles.summaryItem}>
                  <div style={styles.summaryLabel}>기간</div>
                  <div style={styles.summaryValue}>
                    {formatDate(selectedCompetition.startAt)} -{" "}
                    {formatDate(selectedCompetition.endAt)}
                  </div>
                </div>

                <div style={styles.summaryItem}>
                  <div style={styles.summaryLabel}>초기 시드머니</div>
                  <div style={styles.summaryValue}>
                    {formatMoney(selectedCompetition.initialSeedMoney)}
                  </div>
                </div>

                <div style={styles.summaryItem}>
                  <div style={styles.summaryLabel}>참가자 수</div>
                  <div style={styles.summaryValue}>
                    {Number(selectedCompetition.participantCount ?? 0)}명
                  </div>
                </div>
              </div>
            </div>
          )}

          {rankingLoading ? (
            <div style={styles.emptyCard}>
              <p style={styles.emptyText}>랭킹을 불러오는 중입니다...</p>
            </div>
          ) : rankingError ? (
            <div style={styles.emptyCard}>
              <p style={styles.emptyTitle}>랭킹 정보를 불러오지 못했습니다.</p>
              <p style={styles.emptyText}>{rankingError}</p>
            </div>
          ) : ranking.length === 0 ? (
            <div style={styles.emptyCard}>
              <div style={styles.emptyIcon}>📊</div>
              <p style={styles.emptyTitle}>표시할 랭킹 데이터가 없습니다.</p>
              <p style={styles.emptyText}>
                아직 랭킹 API가 준비되지 않았거나 참가자가 없습니다.
              </p>
            </div>
          ) : (
            <>
              <div style={styles.top3Wrap}>
                {top3[1] && renderTopCard(top3[1], 2)}
                {top3[0] && renderTopCard(top3[0], 1)}
                {top3[2] && renderTopCard(top3[2], 3)}
              </div>

              <div style={styles.listCard}>
                <div style={styles.listHeader}>
                  <span>순위</span>
                  <span>참가자</span>
                  <span>수익률</span>
                  <span>평가손익</span>
                </div>

                {(others.length > 0 ? others : top3.slice(0)).map(
                  (user, index) => {
                    const rank = others.length > 0 ? index + 4 : index + 1;
                    const isMe =
                      isLoggedIn &&
                      currentUser?.userId &&
                      user?.userId === currentUser.userId;

                    return (
                      <div
                        key={`${user?.userId ?? "user"}-${rank}`}
                        style={{
                          ...styles.listRow,
                          ...(isMe ? styles.myRow : {}),
                        }}
                      >
                        <span style={styles.rankCell}>{rank}</span>
                        <span style={styles.nameCell}>
                          {user?.nickname ?? "-"}
                        </span>
                        <span
                          className={user?.returnRate > 0 ? "up" : user?.returnRate < 0 ? "down" : ""}
                          style={styles.rateCell}
                        >
                          {user?.returnRate != null
                            ? `${user.returnRate > 0 ? "+" : ""}${Number(user.returnRate).toFixed(2)}%`
                            : "-"}
                        </span>
                        <span
                          className={user?.profitAmount > 0 ? "up" : user?.profitAmount < 0 ? "down" : ""}
                          style={styles.profitCell}
                        >
                          {user?.returnRate != null
                            ? formatMoney(user.profitAmount)
                            : "-"}
                        </span>
                      </div>
                    );
                  },
                )}
              </div>
            </>
          )}
        </>
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
  heroDesc: {
    margin: 0,
    fontSize: "15px",
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: "1.6",
    maxWidth: "800px",
  },
  heroContentLeft: {
    flex: 1,
  },
  heroContentRight: {
    display: "flex",
    alignItems: "center",
  },
  userProfileCircle: {
    width: "65px",
    height: "65px",
    borderRadius: "50%",
    background: "#eef2ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "3px solid #f3f4f6",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    overflow: "hidden",
  },
  userProfileImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  userProfileFallback: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#4c6ef5",
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
  competitionSelectorWrap: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "12px",
    marginBottom: "20px",
  },
  competitionSelectorButton: {
    textAlign: "left",
    padding: "14px 16px",
    borderRadius: "14px",
    border: "1px solid #d1d5db",
    background: "#fff",
    cursor: "pointer",
  },
  competitionSelectorButtonActive: {
    border: "2px solid #4c6ef5",
    background: "#eef2ff",
  },
  competitionSelectorTitle: {
    fontSize: "14px",
    fontWeight: "800",
    color: "#111827",
    marginBottom: "6px",
  },
  competitionSelectorMeta: {
    fontSize: "12px",
    color: "#6b7280",
  },
  summaryCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "20px",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.04)",
    marginBottom: "22px",
  },
  summaryTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-start",
    marginBottom: "18px",
  },
  summaryCategory: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#4c6ef5",
    marginBottom: "8px",
  },
  summaryTitle: {
    margin: 0,
    fontSize: "26px",
    fontWeight: "800",
    color: "#111827",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "14px",
  },
  summaryItem: {
    background: "#f9fafb",
    border: "1px solid #eef2f7",
    borderRadius: "14px",
    padding: "14px",
  },
  summaryLabel: {
    fontSize: "12px",
    color: "#6b7280",
    fontWeight: "700",
    marginBottom: "8px",
  },
  summaryValue: {
    fontSize: "15px",
    color: "#111827",
    fontWeight: "800",
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
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
  },
  top3Wrap: {
    display: "grid",
    gridTemplateColumns: "1fr 1.15fr 1fr",
    gap: "16px",
    alignItems: "end",
    marginBottom: "22px",
  },
  topCard: {
    background: "#fff",
    borderRadius: "20px",
    padding: "20px 16px",
    textAlign: "center",
    border: "1px solid #e5e7eb",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
  },
  firstCard: {
    minHeight: "280px",
    border: "2px solid #ffd43b",
  },
  secondCard: {
    minHeight: "240px",
    border: "2px solid #ced4da",
  },
  thirdCard: {
    minHeight: "220px",
    border: "2px solid #e0a458",
  },
  topRankBadge: {
    display: "inline-block",
    padding: "6px 12px",
    borderRadius: "999px",
    background: "#111827",
    color: "#fff",
    fontSize: "12px",
    fontWeight: "800",
    marginBottom: "16px",
  },
  profileCircle: {
    width: "76px",
    height: "76px",
    borderRadius: "999px",
    overflow: "hidden",
    background: "#eef2ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 14px",
  },
  profileImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  profileFallback: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#4c6ef5",
  },
  topNickname: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#111827",
    marginBottom: "10px",
  },
  topReturnRate: {
    fontSize: "28px",
    fontWeight: "900",
    marginBottom: "8px",
  },
  topProfit: {
    fontSize: "14px",
    color: "#6b7280",
    fontWeight: "700",
  },
  listCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    overflow: "hidden",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.04)",
  },
  listHeader: {
    display: "grid",
    gridTemplateColumns: "80px 1.5fr 1fr 1fr",
    gap: "12px",
    padding: "16px 18px",
    background: "#f9fafb",
    fontSize: "13px",
    fontWeight: "800",
    color: "#374151",
    borderBottom: "1px solid #e5e7eb",
  },
  listRow: {
    display: "grid",
    gridTemplateColumns: "80px 1.5fr 1fr 1fr",
    gap: "12px",
    padding: "16px 18px",
    borderBottom: "1px solid #f3f4f6",
    alignItems: "center",
  },
  myRow: {
    background: "#eef2ff",
  },
  rankCell: {
    fontWeight: "800",
    color: "#111827",
  },
  nameCell: {
    fontWeight: "700",
    color: "#111827",
  },
  rateCell: {
    fontWeight: "800",
  },
  profitCell: {
    fontWeight: "700",
    color: "#374151",
  },
};

export default RankingPage;
