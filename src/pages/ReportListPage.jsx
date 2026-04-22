import React, { useEffect, useState } from "react";

const ReportListPage = ({ currentUser, onBack }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadReports = async () => {
      try {
        const response = await fetch("/api/admin/reports", {
          headers: {
            Authorization: `Bearer ${currentUser?.token}`,
          },
        });

        if (!response.ok) {
          throw new Error("신고 목록을 불러오지 못했습니다.");
        }

        setReports(await response.json());
      } catch (loadError) {
        setError(loadError.message || "신고 목록을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, [currentUser?.token]);

  return (
    <div className="content-card">
      <div className="user-activity-header">
        <div>
          <h3>신고목록</h3>
          <p className="page-desc">게시글과 댓글 신고 내용을 확인합니다.</p>
        </div>
        <button type="button" className="btn-cancel" onClick={onBack}>
          관리자 페이지로
        </button>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">신고 목록을 불러오는 중입니다...</div>
        </div>
      ) : null}

      {!loading && error ? <p className="page-desc">{error}</p> : null}

      {!loading && !error ? (
        <div className="admin-table-wrap">
          <table className="stock-table admin-table">
            <thead>
              <tr>
                <th>시각</th>
                <th>구분</th>
                <th>게시글</th>
                <th>신고 내용</th>
                <th>신고자</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 ? (
                <tr>
                  <td colSpan="6">접수된 신고가 없습니다.</td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={`${report.reportType}-${report.reportId}`}>
                    <td>{report.createdAt?.replace("T", " ") || "-"}</td>
                    <td>{report.reportType === "POST" ? "게시글" : "댓글"}</td>
                    <td>{report.postTitle || "-"}</td>
                    <td>
                      <div>{report.reason || "-"}</div>
                      <div className="report-detail-text">
                        {report.detail || report.targetContent || "-"}
                      </div>
                    </td>
                    <td>
                      <div>{report.reporterNickname || "-"}</div>
                      <div className="report-sub-text">{report.reporterEmail || "-"}</div>
                    </td>
                    <td>{report.reportStatus || "-"}</td>
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

export default ReportListPage;
