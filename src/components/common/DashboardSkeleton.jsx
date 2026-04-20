import React from 'react';

const DashboardSkeleton = () => {
  return (
    <div className="mypage-skeleton-wrapper">
      {/* 상단 4개 박스 스켈레톤 */}
      <div className="mypage-skeleton-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton-box skeleton-card" style={{ borderRadius: '24px' }}></div>
        ))}
      </div>

      <div className="content-card" style={{ padding: '30px', border: '1px solid #e2e8f0', borderRadius: '24px' }}>
        <div className="skeleton-box skeleton-title"></div>
        
        <div className="portfolio-section-layout" style={{ display: 'flex', gap: '32px', marginTop: '30px' }}>
          {/* 차트 영역 스켈레톤 */}
          <div className="portfolio-chart-container" style={{ flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="skeleton-box skeleton-circle" style={{ width: '240px', height: '240px', margin: '20px 0' }}></div>
            <div style={{ width: '100%', marginTop: '20px' }}>
              {[1, 2, 3].map(i => (
                <div key={i} className="skeleton-box" style={{ height: '40px', marginBottom: '10px' }}></div>
              ))}
            </div>
          </div>

          {/* 테이블 영역 스켈레톤 */}
          <div className="portfolio-list-container" style={{ flex: '2' }}>
            <div className="skeleton-box" style={{ height: '30px', width: '200px', marginBottom: '20px' }}></div>
            <div className="mypage-table-wrap">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="mypage-skeleton-table-row">
                  <div className="skeleton-box skeleton-text"></div>
                  <div className="skeleton-box skeleton-text"></div>
                  <div className="skeleton-box skeleton-text"></div>
                  <div className="skeleton-box skeleton-text"></div>
                  <div className="skeleton-box skeleton-text"></div>
                  <div className="skeleton-box skeleton-text"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;
