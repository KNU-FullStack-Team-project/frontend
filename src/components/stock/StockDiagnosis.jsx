import React, { useEffect, useState } from 'react';
import './StockDiagnosis.css';

const StockDiagnosis = ({ symbol }) => {
    const [diagnosis, setDiagnosis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!symbol) return;

        const fetchDiagnosis = async () => {
            setLoading(true);
            try {
                const response = await fetch(`http://localhost:8081/api/stocks/${symbol}/diagnosis`);
                if (!response.ok) throw new Error("데이터 로드 실패");
                const data = await response.json();
                setDiagnosis(data);
            } catch (err) {
                console.error("진단 정보 로드 실패:", err);
                setError("진단 정보를 불러올 수 없습니다.");
            } finally {
                setLoading(false);
            }
        };

        fetchDiagnosis();
    }, [symbol]);

    if (loading) return <div className="diagnosis-container-simple loading">분석 중...</div>;
    if (error) return <div className="diagnosis-container-simple error">{error}</div>;
    if (!diagnosis || diagnosis.signal === 'INSUFFICIENT_DATA') {
        return <div className="diagnosis-container-simple empty">데이터 부족으로 진단 불가</div>;
    }

    const getSignalColor = (signal) => {
        switch (signal) {
            case 'STRONG_BUY': return '#ef4444'; 
            case 'BUY': return '#f97316';
            case 'SELL': return '#3b82f6'; 
            case 'STRONG_SELL': return '#2563eb';
            default: return '#6b7280';
        }
    };

    const getSignalText = (signal) => {
        switch (signal) {
            case 'STRONG_BUY': return '강한 매수';
            case 'BUY': return '매수';
            case 'SELL': return '매도';
            case 'STRONG_SELL': return '강한 매도';
            case 'HOLD': return '관망';
            default: return '중립';
        }
    };

    return (
        <div className="diagnosis-container-simple">
            <div className="diagnosis-header-simple">
                <span className="title">기술적 분석 진단</span>
                <div className="result-area">
                    <span className="signal" style={{ color: getSignalColor(diagnosis.signal) }}>
                        {getSignalText(diagnosis.signal)}
                    </span>
                    <span className="score">({diagnosis.totalScore > 0 ? '+' : ''}{diagnosis.totalScore}점)</span>
                </div>
            </div>

            <div className="diagnosis-list-simple">
                {diagnosis.details && diagnosis.details.map((detail, idx) => (
                    <div key={idx} className="diagnosis-row">
                        <span className="label">{detail.indicator}</span>
                        <span className="content">{detail.analysis}</span>
                        <span className={`score ${detail.score > 0 ? 'plus' : detail.score < 0 ? 'minus' : ''}`}>
                            {detail.score > 0 ? '+' : ''}{detail.score}
                        </span>
                    </div>
                ))}
            </div>

            <div className="diagnosis-guide" style={{ 
                fontSize: '11px', 
                color: '#6b7280', 
                backgroundColor: '#f9fafb', 
                padding: '10px', 
                borderRadius: '8px',
                marginTop: '16px',
                lineHeight: '1.5'
            }}>
                <div style={{ fontWeight: '700', marginBottom: '4px', color: '#374151' }}>💡 진단 가이드</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2px' }}>
                    <span>• <b>이동평균:</b> 주가 추세 및 지지/저항 확인</span>
                    <span>• <b>RSI:</b> 과매수/과매도 구간 측정</span>
                    <span>• <b>MACD:</b> 추세의 전환점 포착</span>
                    <span>• <b>볼린저:</b> 밴드 이탈(%B) 및 중심선 추세 진단</span>
                </div>
            </div>
        </div>
    );
};

export default StockDiagnosis;
