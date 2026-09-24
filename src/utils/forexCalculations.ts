import { Candle, PairSymbol } from "../types";

export const PIP_FACTORS: Record<PairSymbol, number> = {
  "USD/JPY": 0.01,
  "EUR/USD": 0.0001,
};

export const PRICE_PRECISIONS: Record<PairSymbol, number> = {
  "USD/JPY": 3,
  "EUR/USD": 5,
};

/**
 * Calculate pips between two prices
 */
export function calculatePips(pair: PairSymbol, priceA: number, priceB: number, type: "BUY" | "SELL"): number {
  const pipFactor = PIP_FACTORS[pair];
  const diff = type === "BUY" ? priceB - priceA : priceA - priceB;
  return parseFloat((diff / pipFactor).toFixed(2));
}

/**
 * Calculate monetary profit from pips and lots
 */
export function calculatePnl(pair: PairSymbol, pips: number, lots: number, currentPrice: number): number {
  // 1 standard lot (1.0) = 100,000 units
  // For EUR/USD: 1 pip = $10 per standard lot
  // For USD/JPY: 1 pip = 1,000 JPY / current USDJPY rate per standard lot
  let pipValuePerStandardLot = 10; // USD
  if (pair === "USD/JPY") {
    pipValuePerStandardLot = currentPrice > 0 ? (1000 / currentPrice) : 6.6;
  }
  const dollarPnl = pips * lots * pipValuePerStandardLot;
  return parseFloat(dollarPnl.toFixed(2));
}

/**
 * Timeframe interval in milliseconds
 */
export function getTimeframeMs(timeframe: string): number {
  switch (timeframe) {
    case "30S":
      return 30 * 1000;
    case "1M":
    case "M1":
      return 60 * 1000;
    case "5M":
    case "M5":
      return 5 * 60 * 1000;
    case "10M":
    case "M10":
      return 10 * 60 * 1000;
    case "15M":
    case "M15":
      return 15 * 60 * 1000;
    case "30M":
    case "M30":
      return 30 * 60 * 1000;
    case "1H":
    case "H1":
      return 60 * 60 * 1000;
    case "4H":
    case "H4":
      return 4 * 60 * 60 * 1000;
    default:
      return 5 * 60 * 1000;
  }
}

/**
 * Calculate automated SL, TP1, TP2, TP3 targets according to the strategy mode
 * - 5-Min Pro Scalp: Fast execution, tight SL (10-12p), TP1 (+14p locks BE), TP2 (+28p), TP3 (+50p)
 * - 10-Min Pro Trend: Institutional trend expansion, SL (18-20p), TP1 (+24p locks BE), TP2 (+55p), TP3 (+105p)
 */
export function calculateStrategyTargets(
  pair: PairSymbol,
  entryPrice: number,
  type: "BUY" | "SELL",
  atrPips: number,
  strategyMode?: string,
  customSlPips?: number,
  spreadPips?: number
) {
  const pipFactor = PIP_FACTORS[pair];
  const isJpy = pair === "USD/JPY";

  let slPips = isJpy ? Math.max(16, Math.round(atrPips * 1.1)) : Math.max(12, Math.round(atrPips * 1.0));
  let tp1Pips = isJpy ? Math.max(18, Math.round(atrPips * 1.1)) : Math.max(14, Math.round(atrPips * 1.1));
  let tp2Pips = Math.round(tp1Pips * 2.1);
  let tp3Pips = Math.round(tp1Pips * 4.2);

  // Professional Top-Trader Strategy Modifiers
  if (strategyMode === "MASTER_AI_COUNCIL_SYNTHESIS") {
    // 5 Masters Synthesis (ICT + Jim Simons + Wyckoff + Druckenmiller + Tudor Jones)
    slPips = 0.05; // Master guaranteed 0.05-pip risk clamp
    tp1Pips = isJpy ? 18 : 16; // Locks BE immediately at TP1
    tp2Pips = isJpy ? 45 : 38; // Trailing SL to TP1
    tp3Pips = isJpy ? 110 : 95; // Macro Runner
  } else if (strategyMode === "INTELLIGENT_10M_SNIPER_005") {
    // Ultra-Tight 0.05 Pip Institutional Sniper Stop Loss (0.05 pip = 0.5 pipette micro-tick)
    slPips = 0.05; // Exact 0.05 Pip Stop Loss
    tp1Pips = isJpy ? 18 : 16; // 1:360 R:R -> Triggers Auto Break-Even immediately!
    tp2Pips = isJpy ? 45 : 40; // Institutional liquidity pool
    tp3Pips = isJpy ? 105 : 90; // Macro Runner
  } else if (strategyMode === "PRO_5M_SCALP") {
    // 5-Min ICT Smart Money Scalp (High frequency, surgical targets, rapid BE lock)
    slPips = isJpy ? 12 : 9;
    tp1Pips = isJpy ? 15 : 13; // Immediately banks 40-50% & slides SL to BE + 1 pip!
    tp2Pips = isJpy ? 30 : 25;
    tp3Pips = isJpy ? 55 : 45;
  } else if (strategyMode === "PRO_10M_TREND") {
    // 10-Min Institutional Trend Expansion (Structural swing ride, massive pip yield)
    slPips = isJpy ? 20 : 16;
    tp1Pips = isJpy ? 24 : 20; // Locks Break-Even once trend leg establishes
    tp2Pips = isJpy ? 55 : 45;
    tp3Pips = isJpy ? 110 : 90;
  } else if (strategyMode === "HIGH_PIP_RUNNER") {
    slPips = isJpy ? 22 : 18;
    tp1Pips = isJpy ? 20 : 16;
    tp2Pips = isJpy ? 60 : 50;
    tp3Pips = isJpy ? 130 : 110;
  }

  // Override with custom SL if explicitly specified (e.g. 0.05 pip or custom value)
  if (customSlPips !== undefined && customSlPips > 0) {
    slPips = customSlPips;
  }

  // Ensure precision accommodates sub-pip micro-ticks (e.g. 0.05 pip = 0.0005 for JPY, 0.000005 for EUR)
  const precision = slPips < 0.1 ? (isJpy ? 4 : 6) : PRICE_PRECISIONS[pair];

  // Raw institutional ECN spread compensation:
  // For BUY: entered at Ask, exit is evaluated at Bid (entryPrice - spread).
  // The Stop Loss and TP are anchored to the exit reference price so initial entry spread does not prematurely stop out the trade.
  const actualSpreadPips = spreadPips !== undefined ? spreadPips : 0.2;
  const spreadDelta = actualSpreadPips * pipFactor;
  const exitRef = type === "BUY" ? entryPrice - spreadDelta : entryPrice + spreadDelta;

  if (type === "BUY") {
    return {
      slPips,
      tp1Pips,
      tp2Pips,
      tp3Pips,
      sl: parseFloat((exitRef - slPips * pipFactor).toFixed(precision)),
      tp1: parseFloat((exitRef + tp1Pips * pipFactor).toFixed(precision)),
      tp2: parseFloat((exitRef + tp2Pips * pipFactor).toFixed(precision)),
      tp3: parseFloat((exitRef + tp3Pips * pipFactor).toFixed(precision)),
    };
  } else {
    return {
      slPips,
      tp1Pips,
      tp2Pips,
      tp3Pips,
      sl: parseFloat((exitRef + slPips * pipFactor).toFixed(precision)),
      tp1: parseFloat((exitRef - tp1Pips * pipFactor).toFixed(precision)),
      tp2: parseFloat((exitRef - tp2Pips * pipFactor).toFixed(precision)),
      tp3: parseFloat((exitRef - tp3Pips * pipFactor).toFixed(precision)),
    };
  }
}

/**
 * Format price for clean display with fractional pipette and sub-pip precision
 */
export function formatPrice(pair: PairSymbol, price: number, forceDecimals?: number): string {
  if (price === undefined || price === null || isNaN(price)) {
    return "--";
  }
  if (forceDecimals !== undefined) {
    return price.toFixed(forceDecimals);
  }
  const basePrecision = PRICE_PRECISIONS[pair] ?? 3;
  const maxPrecision = pair === "USD/JPY" ? 4 : 6;
  const fixedMax = price.toFixed(maxPrecision);
  const fixedBase = price.toFixed(basePrecision);
  if (parseFloat(fixedMax) !== parseFloat(fixedBase)) {
    return fixedMax;
  }
  return fixedBase;
}

/**
 * Generate initial realistic candlestick history tailored to timeframe
 */
export function generateInitialCandles(
  pair: PairSymbol,
  count = 90,
  timeframe = "5M",
  anchorPrice?: number
): Candle[] {
  const candles: Candle[] = [];
  const targetEndPrice = anchorPrice || (pair === "USD/JPY" ? 157.433 : 1.08745);
  const now = Date.now();
  const timeframeMs = getTimeframeMs(timeframe);

  // Scale delta and volatility according to timeframe
  let baseCycle = pair === "USD/JPY" ? 0.04 : 0.0003;
  let baseNoise = pair === "USD/JPY" ? 0.025 : 0.0002;

  if (timeframe === "30S") {
    baseCycle *= 0.25;
    baseNoise *= 0.35;
  } else if (timeframe === "1M" || timeframe === "M1") {
    baseCycle *= 0.5;
    baseNoise *= 0.6;
  } else if (timeframe === "5M" || timeframe === "M5") {
    baseCycle *= 1.0;
    baseNoise *= 1.0;
  } else if (timeframe === "10M" || timeframe === "M10") {
    baseCycle *= 1.4;
    baseNoise *= 1.3;
  } else if (timeframe === "15M" || timeframe === "M15") {
    baseCycle *= 1.8;
    baseNoise *= 1.6;
  } else if (timeframe === "30M" || timeframe === "M30") {
    baseCycle *= 2.2;
    baseNoise *= 2.0;
  } else if (timeframe === "1H" || timeframe === "H1") {
    baseCycle *= 2.8;
    baseNoise *= 2.5;
  } else if (timeframe === "4H" || timeframe === "H4") {
    baseCycle *= 3.8;
    baseNoise *= 3.2;
  }

  // Generate continuous candle delta sequence backwards from targetEndPrice
  let runningClose = targetEndPrice;
  const tempBars: Array<{
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }> = [];

  for (let i = 0; i < count; i++) {
    // Harmonic wave cycle + realistic micro random walk
    const cycle = Math.sin(i / 7) * baseCycle;
    const noise = (Math.random() - 0.48) * baseNoise;
    const delta = cycle * 0.4 + noise;

    const close = runningClose;
    const open = parseFloat((close - delta).toFixed(PRICE_PRECISIONS[pair]));
    const wickHigh = Math.abs((Math.random() * 0.7 + 0.1) * baseNoise);
    const wickLow = Math.abs((Math.random() * 0.7 + 0.1) * baseNoise);
    const high = parseFloat((Math.max(open, close) + wickHigh).toFixed(PRICE_PRECISIONS[pair]));
    const low = parseFloat((Math.min(open, close) - wickLow).toFixed(PRICE_PRECISIONS[pair]));
    const volume = Math.floor(700 + Math.random() * 2400);

    tempBars.unshift({ open, high, low, close, volume });
    // Next previous candle closed at this candle's open (continuous trading flow)
    runningClose = open;
  }

  // Assign precise timestamps (increments of timeframeMs, latest is now)
  for (let i = 0; i < count; i++) {
    const timestamp = now - (count - 1 - i) * timeframeMs;
    const date = new Date(timestamp);
    const timeStr =
      timeframe === "30S"
        ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
        : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    candles.push({
      time: timeStr,
      timestamp,
      ...tempBars[i],
    });
  }

  // Calculate quick EMAs
  let ema20 = candles[0].close;
  let ema50 = candles[0].close;
  const k20 = 2 / (20 + 1);
  const k50 = 2 / (50 + 1);

  candles.forEach((c) => {
    ema20 = c.close * k20 + ema20 * (1 - k20);
    ema50 = c.close * k50 + ema50 * (1 - k50);
    c.ema20 = parseFloat(ema20.toFixed(PRICE_PRECISIONS[pair]));
    c.ema50 = parseFloat(ema50.toFixed(PRICE_PRECISIONS[pair]));
  });

  return candles;
}
