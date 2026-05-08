import React, { useEffect, useMemo, useState } from "react";

const ASSET_BASE_PATH = "/assets/community-badges/";

const BADGE_FALLBACK_IMAGE = `${ASSET_BASE_PATH}badge-popular.png`;

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const formatNumber = (value) => Number(value ?? 0).toLocaleString("ko-KR");

const normalizeImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")) {
    return url;
  }
  return `/${url}`;
};

const UserProfileModal = ({ userId, onClose, onMoveMyPage }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) return;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");
        setProfile(null);

        const response = await fetch(`/api/community/users/${userId}/profile`, {
          credentials: "include",
        });

        const contentType = response.headers.get("content-type") || "";
        const data = contentType.includes("application/json")
          ? await response.json()
          : await response.text();

        if (!response.ok) {
          throw new Error(typeof data === "string" ? data : "프로필 정보를 불러오지 못했습니다.");
        }

        setProfile(data);
      } catch (fetchError) {
        console.error("프로필 조회 오류:", fetchError);
        setError(fetchError.message || "프로필 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  const levelImageUrl = useMemo(() => {
    const level = profile?.communityLevel || 1;
    return profile?.levelImageUrl || `${ASSET_BASE_PATH}level-${level}.png`;
  }, [profile]);

  const profileImageUrl = normalizeImageUrl(profile?.profileImageUrl);

  if (!userId) return null;

  return (
    <div style={styles.overlay} onMouseDown={onClose}>
      <div style={styles.card} onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" style={styles.closeButton} onClick={onClose}>
          ✕
        </button>

        {loading ? (
          <div style={styles.loadingBox}>
            <div style={styles.loadingIcon}>⌛</div>
            <div style={styles.loadingText}>프로필 정보를 불러오는 중입니다...</div>
          </div>
        ) : error ? (
          <div style={styles.errorBox}>
            <div style={styles.errorTitle}>프로필 조회 실패</div>
            <div style={styles.errorText}>{error}</div>
            <button type="button" style={styles.secondaryButton} onClick={onClose}>
              닫기
            </button>
          </div>
        ) : profile ? (
          <>
            <div style={styles.header}>
              <div style={styles.avatarWrap}>
                {profileImageUrl ? (
                  <img src={profileImageUrl} alt="프로필" style={styles.avatarImage} />
                ) : (
                  <span style={styles.avatarText}>{profile.nickname?.[0] || "U"}</span>
                )}
                <img src={levelImageUrl} alt={`Lv.${profile.communityLevel}`} style={styles.levelIcon} />
              </div>

              <div style={styles.userMainInfo}>
                <div style={styles.levelLabel}>Lv.{profile.communityLevel} {profile.levelName}</div>
                <h2 style={styles.nickname}>{profile.nickname}</h2>
                <div style={styles.joinedAt}>가입일 {formatDate(profile.createdAt)}</div>
              </div>
            </div>

            <div style={styles.scoreCard}>
              <div>
                <div style={styles.scoreLabel}>활동 점수</div>
                <div style={styles.scoreValue}>{formatNumber(profile.activityScore)}점</div>
              </div>
              <div style={styles.roleBadge}>{profile.role === "ADMIN" ? "운영진" : "커뮤니티 멤버"}</div>
            </div>

            <div style={styles.statsGrid}>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>게시글</span>
                <strong style={styles.statValue}>{formatNumber(profile.postCount)}</strong>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>댓글</span>
                <strong style={styles.statValue}>{formatNumber(profile.commentCount)}</strong>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>받은 추천</span>
                <strong style={styles.statValue}>{formatNumber(profile.receivedLikeCount)}</strong>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>주문 수</span>
                <strong style={styles.statValue}>{formatNumber(profile.orderCount)}</strong>
              </div>
            </div>

            <div style={styles.section}>
              <div style={styles.sectionTitle}>대회 기록</div>
              <div style={styles.competitionGrid}>
                <div style={styles.competitionItem}>
                  <span style={styles.competitionIcon}>🏆</span>
                  <span style={styles.competitionLabel}>참가</span>
                  <strong style={styles.competitionValue}>{formatNumber(profile.competitionParticipationCount)}회</strong>
                </div>
                <div style={styles.competitionItem}>
                  <span style={styles.competitionIcon}>🥇</span>
                  <span style={styles.competitionLabel}>우승</span>
                  <strong style={styles.competitionValue}>{formatNumber(profile.competitionFirstCount)}회</strong>
                </div>
                <div style={styles.competitionItem}>
                  <span style={styles.competitionIcon}>🥈</span>
                  <span style={styles.competitionLabel}>준우승</span>
                  <strong style={styles.competitionValue}>{formatNumber(profile.competitionSecondCount)}회</strong>
                </div>
                <div style={styles.competitionItem}>
                  <span style={styles.competitionIcon}>🥉</span>
                  <span style={styles.competitionLabel}>3등</span>
                  <strong style={styles.competitionValue}>{formatNumber(profile.competitionThirdCount)}회</strong>
                </div>
                <div style={styles.competitionItemWide}>
                  <span style={styles.competitionIcon}>⭐</span>
                  <span style={styles.competitionLabel}>TOP3 입상</span>
                  <strong style={styles.competitionValue}>{formatNumber(profile.competitionTop3Count)}회</strong>
                </div>
              </div>
            </div>

            <div style={styles.section}>
              <div style={styles.sectionTitle}>대표 뱃지</div>
              {profile.badges?.length > 0 ? (
                <div style={styles.badgeGrid}>
                  {profile.badges.map((badge) => (
                    <div key={badge.code} style={styles.badgeItem} title={badge.description}>
                      <img
                        src={badge.imageUrl || BADGE_FALLBACK_IMAGE}
                        alt={badge.label}
                        style={styles.badgeIcon}
                      />
                      <span style={styles.badgeLabel}>{badge.label}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={styles.emptyBadge}>아직 획득한 뱃지가 없습니다.</div>
              )}
            </div>

            <div style={styles.footer}>
              <button type="button" style={styles.secondaryButton} onClick={onClose}>
                닫기
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    background: "rgba(15, 23, 42, 0.58)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    backdropFilter: "blur(4px)",
  },
  card: {
    width: "min(560px, 100%)",
    maxHeight: "90vh",
    overflowY: "auto",
    background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
    borderRadius: "28px",
    border: "1px solid rgba(226, 232, 240, 0.9)",
    boxShadow: "0 24px 70px rgba(15, 23, 42, 0.28)",
    padding: "26px",
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    right: "18px",
    top: "18px",
    width: "34px",
    height: "34px",
    borderRadius: "999px",
    border: "1px solid #e5e7eb",
    background: "#fff",
    color: "#64748b",
    cursor: "pointer",
    fontWeight: "800",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    paddingRight: "32px",
  },
  avatarWrap: {
    position: "relative",
    width: "96px",
    height: "96px",
    flex: "0 0 auto",
  },
  avatarImage: {
    width: "96px",
    height: "96px",
    borderRadius: "28px",
    objectFit: "cover",
    border: "3px solid #fff",
    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.18)",
  },
  avatarText: {
    width: "96px",
    height: "96px",
    borderRadius: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #4c6ef5, #7950f2)",
    color: "#fff",
    fontSize: "34px",
    fontWeight: "900",
    border: "3px solid #fff",
    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.18)",
  },
  levelIcon: {
    position: "absolute",
    right: "-10px",
    bottom: "-10px",
    width: "44px",
    height: "44px",
    borderRadius: "999px",
    objectFit: "cover",
    background: "#fff",
    border: "2px solid #fff",
    boxShadow: "0 8px 18px rgba(15, 23, 42, 0.2)",
  },
  userMainInfo: {
    minWidth: 0,
  },
  levelLabel: {
    display: "inline-flex",
    padding: "6px 10px",
    borderRadius: "999px",
    background: "#eef2ff",
    color: "#4c6ef5",
    fontSize: "12px",
    fontWeight: "900",
    marginBottom: "8px",
  },
  nickname: {
    margin: "0 0 6px",
    fontSize: "26px",
    fontWeight: "900",
    color: "#111827",
    wordBreak: "break-all",
  },
  joinedAt: {
    color: "#64748b",
    fontSize: "13px",
    fontWeight: "700",
  },
  scoreCard: {
    marginTop: "22px",
    padding: "16px",
    borderRadius: "20px",
    background: "linear-gradient(135deg, #111827, #334155)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },
  scoreLabel: {
    fontSize: "12px",
    color: "#cbd5e1",
    fontWeight: "800",
  },
  scoreValue: {
    marginTop: "4px",
    fontSize: "22px",
    fontWeight: "900",
  },
  roleBadge: {
    padding: "8px 12px",
    borderRadius: "999px",
    background: "rgba(255, 255, 255, 0.14)",
    color: "#fff",
    fontSize: "12px",
    fontWeight: "900",
    whiteSpace: "nowrap",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "10px",
    marginTop: "14px",
  },
  statItem: {
    padding: "14px 10px",
    borderRadius: "16px",
    background: "#fff",
    border: "1px solid #e5e7eb",
    textAlign: "center",
  },
  statLabel: {
    display: "block",
    color: "#64748b",
    fontSize: "12px",
    fontWeight: "800",
    marginBottom: "6px",
  },
  statValue: {
    color: "#111827",
    fontSize: "18px",
    fontWeight: "900",
  },
  section: {
    marginTop: "20px",
  },
  sectionTitle: {
    fontSize: "15px",
    fontWeight: "900",
    color: "#111827",
    marginBottom: "10px",
  },
  competitionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "10px",
  },
  competitionItem: {
    padding: "12px 8px",
    borderRadius: "16px",
    background: "#fff",
    border: "1px solid #e5e7eb",
    textAlign: "center",
  },
  competitionItemWide: {
    gridColumn: "span 4",
    padding: "13px 14px",
    borderRadius: "16px",
    background: "linear-gradient(135deg, #fffbeb, #fff7ed)",
    border: "1px solid #fed7aa",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
  },
  competitionIcon: {
    display: "block",
    fontSize: "20px",
    marginBottom: "5px",
  },
  competitionLabel: {
    display: "block",
    color: "#64748b",
    fontSize: "11px",
    fontWeight: "900",
  },
  competitionValue: {
    display: "block",
    marginTop: "4px",
    color: "#111827",
    fontSize: "16px",
    fontWeight: "900",
  },
  badgeGrid: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  badgeItem: {
    width: "74px",
    padding: "10px 6px",
    borderRadius: "16px",
    background: "#fff",
    border: "1px solid #e5e7eb",
    textAlign: "center",
  },
  badgeIcon: {
    width: "42px",
    height: "42px",
    objectFit: "cover",
    borderRadius: "999px",
    display: "block",
    margin: "0 auto 6px",
  },
  badgeLabel: {
    display: "block",
    color: "#374151",
    fontSize: "11px",
    fontWeight: "900",
    lineHeight: "1.3",
  },
  emptyBadge: {
    padding: "18px",
    borderRadius: "16px",
    background: "#fff",
    border: "1px dashed #cbd5e1",
    color: "#64748b",
    fontSize: "13px",
    fontWeight: "700",
    textAlign: "center",
  },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "22px",
    flexWrap: "wrap",
  },
  primaryButton: {
    padding: "11px 16px",
    borderRadius: "12px",
    border: "none",
    background: "#4c6ef5",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "900",
    fontSize: "14px",
  },
  secondaryButton: {
    padding: "11px 16px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#374151",
    cursor: "pointer",
    fontWeight: "900",
    fontSize: "14px",
  },
  loadingBox: {
    padding: "64px 20px",
    textAlign: "center",
  },
  loadingIcon: {
    fontSize: "34px",
    marginBottom: "12px",
  },
  loadingText: {
    color: "#475569",
    fontSize: "14px",
    fontWeight: "800",
  },
  errorBox: {
    padding: "40px 20px",
    textAlign: "center",
  },
  errorTitle: {
    color: "#dc2626",
    fontSize: "18px",
    fontWeight: "900",
    marginBottom: "8px",
  },
  errorText: {
    color: "#64748b",
    fontSize: "14px",
    marginBottom: "18px",
  },
};

export default UserProfileModal;
