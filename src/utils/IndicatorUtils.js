/**
 * 기술적 보조지표 계산 유틸리티
 */

/**
 * 단순 이동평균선(SMA) 계산
 */
export const calculateSMA = (data, period) => {
  const result = new Array(data.length).fill(null);
  if (!data || data.length < period) return result;

  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += parseFloat(data[i - j].close || 0);
    }
    result[i] = sum / period;
  }
  return result;
};

/**
 * 지수 이동평균선(EMA) 계산
 */
export const calculateEMA = (data, period) => {
  const result = new Array(data.length).fill(null);
  if (!data || data.length < period) return result;

  const k = 2 / (period + 1);
  
  // 첫 값은 SMA로 취급
  let smaSum = 0;
  for (let i = 0; i < period; i++) {
    smaSum += parseFloat(data[i].close || 0);
  }
  let prevEMA = smaSum / period;
  result[period - 1] = prevEMA;

  for (let i = period; i < data.length; i++) {
    const close = parseFloat(data[i].close || 0);
    const ema = close * k + prevEMA * (1 - k);
    result[i] = ema;
    prevEMA = ema;
  }
  return result;
};

/**
 * 볼린저 밴드 계산
 */
export const calculateBollingerBands = (data, period = 20, stdDevMult = 2) => {
  const middle = new Array(data.length).fill(null);
  const upper = new Array(data.length).fill(null);
  const lower = new Array(data.length).fill(null);
  
  if (!data || data.length < period) return { middle, upper, lower };

  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    const slice = [];
    for (let j = 0; j < period; j++) {
      const val = parseFloat(data[i - j].close || 0);
      sum += val;
      slice.push(val);
    }
    const avg = sum / period;
    middle[i] = avg;

    const squareDiffs = slice.map(v => Math.pow(v - avg, 2));
    const variance = (squareDiffs.reduce((a, b) => a + b, 0)) / period;
    const stdDev = Math.sqrt(variance);

    upper[i] = avg + (stdDev * stdDevMult);
    lower[i] = avg - (stdDev * stdDevMult);
  }

  return { middle, upper, lower };
};

/**
 * RSI(상대강도지수) 계산
 */
export const calculateRSI = (data, period = 14) => {
  const rsi = new Array(data.length).fill(null);
  if (!data || data.length <= period) return rsi;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = parseFloat(data[i].close) - parseFloat(data[i - 1].close);
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  const getRSI = (ag, al) => {
    if (al === 0) return 100;
    const rs = ag / al;
    return 100 - (100 / (1 + rs));
  };

  rsi[period] = getRSI(avgGain, avgLoss);

  for (let i = period + 1; i < data.length; i++) {
    const diff = parseFloat(data[i].close) - parseFloat(data[i - 1].close);
    const gain = diff >= 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    rsi[i] = getRSI(avgGain, avgLoss);
  }

  return rsi;
};

/**
 * MACD 계산
 */
export const calculateMACD = (data, short = 12, long = 26, signal = 9) => {
  const macdLine = new Array(data.length).fill(null);
  const signalLine = new Array(data.length).fill(null);
  const histogram = new Array(data.length).fill(null);

  if (!data || data.length < long) return { macdLine, signalLine, histogram };

  const emaShort = calculateEMA(data, short);
  const emaLong = calculateEMA(data, long);

  for (let i = 0; i < data.length; i++) {
    if (emaShort[i] !== null && emaLong[i] !== null) {
      macdLine[i] = emaShort[i] - emaLong[i];
    }
  }

  // 시그널 선 계산을 위해 유효한 MACD 값들만 추출
  const validMacdLine = [];
  const validIndices = [];
  for (let i = 0; i < macdLine.length; i++) {
    if (macdLine[i] !== null) {
      validMacdLine.push({ close: macdLine[i] });
      validIndices.push(i);
    }
  }

  if (validMacdLine.length >= signal) {
    const signalLineValid = calculateEMA(validMacdLine, signal);
    for (let i = 0; i < signalLineValid.length; i++) {
      if (signalLineValid[i] !== null) {
        const originalIdx = validIndices[i];
        signalLine[originalIdx] = signalLineValid[i];
      }
    }
  }

  for (let i = 0; i < data.length; i++) {
    if (macdLine[i] !== null && signalLine[i] !== null) {
      histogram[i] = macdLine[i] - signalLine[i];
    }
  }

  return { macdLine, signalLine, histogram };
};
