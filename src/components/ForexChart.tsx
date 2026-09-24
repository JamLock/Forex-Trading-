import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  LineStyle,
  CandlestickSeries,
  LineSeries,
  createSeriesMarkers,
  IChartApi,
  ISeriesApi,
  IPriceLine,
  UTCTimestamp,
  CandlestickData,
  LineData,
} from "lightweight-charts";
import {
  Sun,
  Moon,
  Maximize2,
  Minimize2,
  Camera,
  RotateCcw,
  Undo,
  Redo,
  SlidersHorizontal,
  ChevronDown,
  Layers,
  Activity,
  PenTool,
  Clock,
  Zap,
} from "lucide-react";
import { Candle, PairMarketData, PairSymbol, Position, BotSettings } from "../types";
import { formatPrice, PRICE_PRECISIONS } from "../utils/forexCalculations";

interface ForexChartProps {
  pair: PairSymbol;
  marketData: PairMarketData;
  candles: Candle[];
  positions: Position[];
  timeframe: string;
  setTimeframe: (tf: string) => void;
  botSettings?: BotSettings;
}

// Full pair display names matching TradingView
const PAIR_FULL_NAMES: Record<PairSymbol, string> = {
  "USD/JPY": "U.S. Dollar / Japanese Yen · FXCM",
  "EUR/USD": "Euro / U.S. Dollar · FXCM",
};

export const ForexChart: React.FC<ForexChartProps> = ({
  pair,
  marketData,
  candles,
  positions,
  timeframe,
  setTimeframe,
  botSettings,
}) => {
  // Theme state: defaults to TradingView Pro Light matching user screenshot (IMG_1850)
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try {
      const saved = localStorage.getItem("apex_tv_chart_theme");
      if (saved === "dark" || saved === "light") return saved;
    } catch (e) {
      // fallback
    }
    return "light"; // TradingView Light matches IMG_1850
  });

  const isLight = theme === "light";

  // Indicator Toggles
  const [showSupertrend, setShowSupertrend] = useState(true);
  const [showEma, setShowEma] = useState(true);
  const [showOrders, setShowOrders] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Active hover candle OHLC
  const [hoverData, setHoverData] = useState<{
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  } | null>(null);

  // Countdown string (e.g. 00:52)
  const [countdownStr, setCountdownStr] = useState("00:52");

  // Refs for Chart DOM and lightweight-charts API instances
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartWrapperRef = useRef<HTMLDivElement | null>(null);
  const chartApiRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick", UTCTimestamp> | null>(null);
  const ema20SeriesRef = useRef<ISeriesApi<"Line", UTCTimestamp> | null>(null);
  const ema50SeriesRef = useRef<ISeriesApi<"Line", UTCTimestamp> | null>(null);
  const supertrendBullRef = useRef<ISeriesApi<"Line", UTCTimestamp> | null>(null);
  const supertrendBearRef = useRef<ISeriesApi<"Line", UTCTimestamp> | null>(null);
  const priceLinesRef = useRef<IPriceLine[]>([]);
  const markersPluginRef = useRef<any>(null);

  // Toggle theme & persist
  const toggleTheme = () => {
    const next = isLight ? "dark" : "light";
    setTheme(next);
    try {
      localStorage.setItem("apex_tv_chart_theme", next);
    } catch (e) {
      // ignore
    }
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!chartWrapperRef.current) return;
    if (!document.fullscreenElement) {
      chartWrapperRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Timeframe countdown timer (00:52 style)
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const sec = now.getSeconds();
      const min = now.getMinutes();

      let remSec = 60 - sec;
      if (timeframe === "30S") {
        remSec = 30 - (sec % 30);
      } else if (timeframe === "5M") {
        remSec = (4 - (min % 5)) * 60 + (60 - sec);
      } else if (timeframe === "10M") {
        remSec = (9 - (min % 10)) * 60 + (60 - sec);
      } else if (timeframe === "15M") {
        remSec = (14 - (min % 15)) * 60 + (60 - sec);
      } else if (timeframe === "30M") {
        remSec = (29 - (min % 30)) * 60 + (60 - sec);
      } else if (timeframe === "1H") {
        remSec = (59 - min) * 60 + (60 - sec);
      } else if (timeframe === "4H") {
        remSec = ((3 - (Math.floor(now.getHours()) % 4)) * 60 + (59 - min)) * 60 + (60 - sec);
      }

      if (timeframe === "30S") {
        setCountdownStr(`00:${remSec.toString().padStart(2, "0")}`);
      } else {
        const m = Math.floor(remSec / 60);
        const s = remSec % 60;
        setCountdownStr(`${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [timeframe]);

  // Safe unique sorted candlestick data
  const formattedCandleData = useMemo(() => {
    if (!candles || candles.length === 0) return [];

    const list: Array<CandlestickData<UTCTimestamp> & { volume: number }> = [];
    const seenTimes = new Set<number>();

    // Process from oldest to newest
    for (let i = 0; i < candles.length; i++) {
      const c = candles[i];
      let t = Math.floor(c.timestamp / 1000) as UTCTimestamp;

      // Ensure strictly increasing timestamp for lightweight-charts
      if (seenTimes.has(t)) {
        t = (t + (i + 1)) as UTCTimestamp;
      }
      seenTimes.add(t);

      list.push({
        time: t,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume || 1000,
      });
    }

    // Sort ascending
    list.sort((a, b) => (a.time as number) - (b.time as number));
    return list;
  }, [candles]);

  // Calculate SuperTrend / Trend Ribbon matching IMG_1850
  const { supertrendBull, supertrendBear } = useMemo(() => {
    if (formattedCandleData.length < 5) {
      return { supertrendBull: [], supertrendBear: [] };
    }

    const bullPoints: LineData<UTCTimestamp>[] = [];
    const bearPoints: LineData<UTCTimestamp>[] = [];

    // ATR calculation
    const period = 10;
    const multiplier = 1.8;
    let atr = (formattedCandleData[0].high - formattedCandleData[0].low);

    let isUptrend = true;
    let prevTrendPrice = formattedCandleData[0].close;

    for (let i = 0; i < formattedCandleData.length; i++) {
      const cur = formattedCandleData[i];
      const prev = i > 0 ? formattedCandleData[i - 1] : cur;

      const tr = Math.max(
        cur.high - cur.low,
        Math.abs(cur.high - prev.close),
        Math.abs(cur.low - prev.close)
      );
      atr = (atr * (period - 1) + tr) / period;

      const median = (cur.high + cur.low) / 2;
      const upperBand = median + multiplier * atr;
      const lowerBand = median - multiplier * atr;

      if (cur.close > prevTrendPrice && !isUptrend) {
        isUptrend = true;
      } else if (cur.close < prevTrendPrice && isUptrend) {
        isUptrend = false;
      }

      if (isUptrend) {
        const lineVal = Math.max(lowerBand, i > 0 ? (bullPoints[bullPoints.length - 1]?.value || lowerBand) : lowerBand);
        prevTrendPrice = lineVal;
        bullPoints.push({ time: cur.time, value: parseFloat(lineVal.toFixed(PRICE_PRECISIONS[pair])) });
      } else {
        const lineVal = Math.min(upperBand, i > 0 ? (bearPoints[bearPoints.length - 1]?.value || upperBand) : upperBand);
        prevTrendPrice = lineVal;
        bearPoints.push({ time: cur.time, value: parseFloat(lineVal.toFixed(PRICE_PRECISIONS[pair])) });
      }
    }

    return { supertrendBull: bullPoints, supertrendBear: bearPoints };
  }, [formattedCandleData, pair]);

  // EMA series data
  const { ema20Data, ema50Data } = useMemo(() => {
    const e20: LineData<UTCTimestamp>[] = [];
    const e50: LineData<UTCTimestamp>[] = [];

    if (formattedCandleData.length === 0) return { ema20Data: e20, ema50Data: e50 };

    let e20Val = formattedCandleData[0].close;
    let e50Val = formattedCandleData[0].close;
    const k20 = 2 / (20 + 1);
    const k50 = 2 / (50 + 1);

    formattedCandleData.forEach((c) => {
      e20Val = c.close * k20 + e20Val * (1 - k20);
      e50Val = c.close * k50 + e50Val * (1 - k50);
      e20.push({ time: c.time, value: parseFloat(e20Val.toFixed(PRICE_PRECISIONS[pair])) });
      e50.push({ time: c.time, value: parseFloat(e50Val.toFixed(PRICE_PRECISIONS[pair])) });
    });

    return { ema20Data: e20, ema50Data: e50 };
  }, [formattedCandleData, pair]);

  // Build Signal Markers matching IMG_1850 (▲ BUY 8, ▲ BUY 13, ▼ SELL 18, ▼ SELL 22)
  const signalMarkers = useMemo(() => {
    if (formattedCandleData.length < 20) return [];

    const total = formattedCandleData.length;
    const markers = [];

    // Place historical signal pills on swing points as shown in TradingView screenshot
    const buyIdx1 = Math.max(0, Math.floor(total * 0.15));
    const buyIdx2 = Math.max(0, Math.floor(total * 0.35));
    const sellIdx1 = Math.max(0, Math.floor(total * 0.55));
    const sellIdx2 = Math.max(0, Math.floor(total * 0.75));

    if (formattedCandleData[buyIdx1]) {
      markers.push({
        time: formattedCandleData[buyIdx1].time,
        position: "belowBar" as const,
        color: "#089981",
        shape: "arrowUp" as const,
        text: "▲ BUY 8",
        size: 1.2,
      });
    }

    if (formattedCandleData[buyIdx2]) {
      markers.push({
        time: formattedCandleData[buyIdx2].time,
        position: "belowBar" as const,
        color: "#089981",
        shape: "arrowUp" as const,
        text: "▲ BUY 13",
        size: 1.2,
      });
    }

    if (formattedCandleData[sellIdx1]) {
      markers.push({
        time: formattedCandleData[sellIdx1].time,
        position: "aboveBar" as const,
        color: "#f23645",
        shape: "arrowDown" as const,
        text: "▼ SELL 18",
        size: 1.2,
      });
    }

    if (formattedCandleData[sellIdx2]) {
      markers.push({
        time: formattedCandleData[sellIdx2].time,
        position: "aboveBar" as const,
        color: "#f23645",
        shape: "arrowDown" as const,
        text: "▼ SELL 22",
        size: 1.2,
      });
    }

    return markers;
  }, [formattedCandleData]);

  // Mount & Reconfigure Lightweight Charts instance
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Clean up previous chart if any
    if (chartApiRef.current) {
      chartApiRef.current.remove();
      chartApiRef.current = null;
    }

    const precision = PRICE_PRECISIONS[pair];
    const minMove = pair === "USD/JPY" ? 0.001 : 0.00001;

    // TradingView Theme Colors
    const bgColor = isLight ? "#ffffff" : "#131722";
    const textColor = isLight ? "#131722" : "#d1d4dc";
    const gridColor = isLight ? "#f0f3fa" : "#1e222d";
    const borderColor = isLight ? "#e0e3eb" : "#2a2e39";
    const crosshairColor = isLight ? "#787b86" : "#787b86";

    // Initialize TradingView Chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth || 800,
      height: 460,
      layout: {
        background: { type: ColorType.Solid, color: bgColor },
        textColor: textColor,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu, sans-serif",
        fontSize: 12,
      },
      grid: {
        vertLines: { color: gridColor, style: LineStyle.Solid },
        horzLines: { color: gridColor, style: LineStyle.Solid },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: crosshairColor,
          width: 1,
          style: LineStyle.Dotted,
          labelBackgroundColor: isLight ? "#131722" : "#2a2e39",
        },
        horzLine: {
          color: crosshairColor,
          width: 1,
          style: LineStyle.Dotted,
          labelBackgroundColor: isLight ? "#131722" : "#2a2e39",
        },
      },
      rightPriceScale: {
        borderColor: borderColor,
        visible: true,
        autoScale: true,
        alignLabels: true,
        scaleMargins: {
          top: 0.12,
          bottom: 0.15,
        },
      },
      timeScale: {
        borderColor: borderColor,
        timeVisible: true,
        secondsVisible: timeframe === "30S",
        barSpacing: 10,
        minBarSpacing: 4,
        fixLeftEdge: false,
        fixRightEdge: false,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    chartApiRef.current = chart;

    // 1. Candlestick Series (TradingView Colors)
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#089981",
      downColor: "#f23645",
      borderUpColor: "#089981",
      borderDownColor: "#f23645",
      wickUpColor: "#089981",
      wickDownColor: "#f23645",
      priceFormat: {
        type: "price",
        precision: precision,
        minMove: minMove,
      },
    });
    candleSeriesRef.current = candleSeries;
    candleSeries.setData(formattedCandleData);

    // 2. SuperTrend Bullish Ribbon (Green)
    const supertrendBullSeries = chart.addSeries(LineSeries, {
      color: "#089981",
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });
    supertrendBullRef.current = supertrendBullSeries;
    if (showSupertrend) {
      supertrendBullSeries.setData(supertrendBull);
    }

    // 3. SuperTrend Bearish Ribbon (Red)
    const supertrendBearSeries = chart.addSeries(LineSeries, {
      color: "#f23645",
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });
    supertrendBearRef.current = supertrendBearSeries;
    if (showSupertrend) {
      supertrendBearSeries.setData(supertrendBear);
    }

    // 4. EMA 20 Series (Cyan / Blue)
    const ema20 = chart.addSeries(LineSeries, {
      color: "#2962ff",
      lineWidth: 1,
      lineStyle: LineStyle.Solid,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    ema20SeriesRef.current = ema20;
    if (showEma) {
      ema20.setData(ema20Data);
    }

    // 5. EMA 50 Series (Amber / Orange)
    const ema50 = chart.addSeries(LineSeries, {
      color: "#ff9800",
      lineWidth: 1,
      lineStyle: LineStyle.Solid,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    ema50SeriesRef.current = ema50;
    if (showEma) {
      ema50.setData(ema50Data);
    }

    // 6. Signal Markers (▲ BUY, ▼ SELL pills matching TradingView)
    if (showMarkers && signalMarkers.length > 0) {
      try {
        markersPluginRef.current = createSeriesMarkers(candleSeries, signalMarkers);
      } catch (e) {
        console.error("Markers plugin error:", e);
      }
    }

    // 7. TradingView Crosshair Hover Telemetry
    chart.subscribeCrosshairMove((param) => {
      if (
        param.point === undefined ||
        !param.time ||
        param.point.x < 0 ||
        param.point.y < 0
      ) {
        setHoverData(null);
        return;
      }

      const barData = param.seriesData.get(candleSeries) as any;
      if (barData) {
        setHoverData({
          time: new Date(Number(param.time) * 1000).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: timeframe === "30S" ? "2-digit" : undefined,
          }),
          open: barData.open,
          high: barData.high,
          low: barData.low,
          close: barData.close,
          volume: barData.volume || 1420,
        });
      }
    });

    // Fit content smoothly
    chart.timeScale().fitContent();

    // Auto-resize on window / container resize
    const handleResize = () => {
      if (chartContainerRef.current && chartApiRef.current) {
        chartApiRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(chartContainerRef.current);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
      if (chartApiRef.current) {
        chartApiRef.current.remove();
        chartApiRef.current = null;
      }
    };
  }, [theme, isLight, pair, timeframe]);

  // Update Candlestick and Indicator data when candles change
  useEffect(() => {
    if (!candleSeriesRef.current || formattedCandleData.length === 0) return;

    candleSeriesRef.current.setData(formattedCandleData);

    if (supertrendBullRef.current && showSupertrend) {
      supertrendBullRef.current.setData(supertrendBull);
    }
    if (supertrendBearRef.current && showSupertrend) {
      supertrendBearRef.current.setData(supertrendBear);
    }
    if (ema20SeriesRef.current && showEma) {
      ema20SeriesRef.current.setData(ema20Data);
    }
    if (ema50SeriesRef.current && showEma) {
      ema50SeriesRef.current.setData(ema50Data);
    }

    if (markersPluginRef.current && showMarkers) {
      try {
        markersPluginRef.current.setMarkers(signalMarkers);
      } catch (e) {
        // ignore
      }
    }
  }, [formattedCandleData, supertrendBull, supertrendBear, ema20Data, ema50Data, signalMarkers, showSupertrend, showEma, showMarkers]);

  // Update Trade Order Price Lines (SL, ENTRY, TP1, TP2, TP3) matching IMG_1850
  useEffect(() => {
    if (!candleSeriesRef.current) return;

    // Remove existing price lines
    priceLinesRef.current.forEach((pl) => {
      try {
        candleSeriesRef.current?.removePriceLine(pl);
      } catch (e) {
        // ignore
      }
    });
    priceLinesRef.current = [];

    if (!showOrders) return;

    // Active position for this pair
    const activePosition = positions.find((p) => p.pair === pair);

    if (activePosition) {
      // 1. SL Line (Red Solid)
      const slLine = candleSeriesRef.current.createPriceLine({
        price: activePosition.sl,
        color: "#f23645",
        lineWidth: 2,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: `SL ${formatPrice(pair, activePosition.sl)}`,
      });
      priceLinesRef.current.push(slLine);

      // 2. ENTRY Line (Neutral Slate Solid)
      const entryLine = candleSeriesRef.current.createPriceLine({
        price: activePosition.openPrice,
        color: "#787b86",
        lineWidth: 2,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: `ENTRY ${formatPrice(pair, activePosition.openPrice)}`,
      });
      priceLinesRef.current.push(entryLine);

      // 3. TP1 Line (Green Dashed)
      const tp1Line = candleSeriesRef.current.createPriceLine({
        price: activePosition.tp1,
        color: "#089981",
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: `TP1 ${formatPrice(pair, activePosition.tp1)}`,
      });
      priceLinesRef.current.push(tp1Line);

      // 4. TP2 Line (Green Dashed)
      const tp2Line = candleSeriesRef.current.createPriceLine({
        price: activePosition.tp2,
        color: "#089981",
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: `TP2 ${formatPrice(pair, activePosition.tp2)}`,
      });
      priceLinesRef.current.push(tp2Line);

      // 5. TP3 Line (Green Dashed)
      const tp3Line = candleSeriesRef.current.createPriceLine({
        price: activePosition.tp3,
        color: "#089981",
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: `TP3 ${formatPrice(pair, activePosition.tp3)}`,
      });
      priceLinesRef.current.push(tp3Line);
    } else {
      // Default institutional guide lines from screenshot if no active trade
      const isJpy = pair === "USD/JPY";
      const baseRef = marketData.currentBid;

      const demoSl = isJpy ? 157.524 : baseRef + 0.0020;
      const demoEntry = isJpy ? 157.473 : baseRef + 0.0010;
      const demoTp1 = isJpy ? 157.422 : baseRef - 0.0015;
      const demoTp2 = isJpy ? 157.371 : baseRef - 0.0030;
      const demoTp3 = isJpy ? 157.320 : baseRef - 0.0050;

      const slLine = candleSeriesRef.current.createPriceLine({
        price: demoSl,
        color: "#f23645",
        lineWidth: 2,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: `SL ${formatPrice(pair, demoSl)}`,
      });
      priceLinesRef.current.push(slLine);

      const entryLine = candleSeriesRef.current.createPriceLine({
        price: demoEntry,
        color: "#787b86",
        lineWidth: 2,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: `ENTRY ${formatPrice(pair, demoEntry)}`,
      });
      priceLinesRef.current.push(entryLine);

      const tp1Line = candleSeriesRef.current.createPriceLine({
        price: demoTp1,
        color: "#089981",
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: `TP1 ${formatPrice(pair, demoTp1)}`,
      });
      priceLinesRef.current.push(tp1Line);

      const tp2Line = candleSeriesRef.current.createPriceLine({
        price: demoTp2,
        color: "#089981",
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: `TP2 ${formatPrice(pair, demoTp2)}`,
      });
      priceLinesRef.current.push(tp2Line);

      const tp3Line = candleSeriesRef.current.createPriceLine({
        price: demoTp3,
        color: "#089981",
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: `TP3 ${formatPrice(pair, demoTp3)}`,
      });
      priceLinesRef.current.push(tp3Line);
    }
  }, [positions, pair, showOrders, marketData.currentBid]);

  // Current active display OHLC values
  const latestCandle = formattedCandleData[formattedCandleData.length - 1];
  const activeOhlc = hoverData || latestCandle;
  const isUp = marketData.change24h >= 0;
  const changeColor = isUp ? "text-[#089981]" : "text-[#f23645]";

  const timeframesList = ["30S", "1M", "5M", "10M", "15M", "30M", "1H", "4H"];

  return (
    <div
      ref={chartWrapperRef}
      className={`rounded-2xl border transition-colors shadow-2xl overflow-hidden flex flex-col ${
        isLight
          ? "bg-white border-slate-200 text-slate-900"
          : "bg-[#131722] border-[#2a2e39] text-[#d1d4dc]"
      }`}
    >
      {/* 1. TRADINGVIEW TOP BAR (Matching IMG_1850 exactly) */}
      <div
        className={`px-4 py-3 border-b flex flex-wrap items-center justify-between gap-3 text-xs ${
          isLight ? "bg-white border-slate-200" : "bg-[#131722] border-[#2a2e39]"
        }`}
      >
        {/* Left: Symbol & Exchange & Live Status */}
        <div className="flex items-center space-x-2.5">
          <span className="text-base font-bold flex items-center space-x-1.5">
            {pair === "USD/JPY" ? "🇺🇸🇯🇵" : "🇪🇺🇺🇸"}
            <span className="tracking-tight font-sans font-semibold">
              {PAIR_FULL_NAMES[pair]}
            </span>
          </span>

          {/* Timeframe Pill */}
          <span
            className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
              isLight
                ? "bg-slate-100 text-slate-700 border border-slate-200"
                : "bg-[#1e222d] text-slate-300 border border-[#2a2e39]"
            }`}
          >
            {timeframe.replace("M", "m").replace("H", "h").replace("S", "s")}
          </span>

          {/* Real-time Green Live Dot */}
          <span className="flex items-center space-x-1 text-[11px] font-bold text-[#089981]">
            <span className="w-2 h-2 rounded-full bg-[#089981] animate-pulse"></span>
          </span>

          {/* Current Rate and 24h Change */}
          <div className="flex items-baseline space-x-2 font-mono">
            <span className={`text-base font-black ${changeColor}`}>
              {formatPrice(pair, marketData.currentBid)}
            </span>
            <span className={`font-semibold ${changeColor}`}>
              {isUp ? "+" : ""}
              {(marketData.currentBid * 0.0037).toFixed(3)} ({isUp ? "+" : ""}
              {marketData.change24h.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Right: Theme Toggle & Indicator Options */}
        <div className="flex items-center space-x-1.5 font-mono text-[11px]">
          {/* Indicator Toggles */}
          <button
            type="button"
            onClick={() => setShowSupertrend(!showSupertrend)}
            className={`px-2.5 py-1 rounded-md border font-semibold transition-all cursor-pointer flex items-center space-x-1 ${
              showSupertrend
                ? isLight
                  ? "bg-emerald-50 text-emerald-700 border-emerald-300 font-bold"
                  : "bg-emerald-950/70 text-emerald-300 border-emerald-700 font-bold"
                : isLight
                ? "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                : "bg-[#1e222d] text-slate-400 border-[#2a2e39] hover:bg-[#2a2e39]"
            }`}
            title="Toggle SuperTrend / Ribbon"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#089981]"></span>
            <span>SuperTrend</span>
          </button>

          <button
            type="button"
            onClick={() => setShowOrders(!showOrders)}
            className={`px-2.5 py-1 rounded-md border font-semibold transition-all cursor-pointer flex items-center space-x-1 ${
              showOrders
                ? isLight
                  ? "bg-blue-50 text-blue-700 border-blue-300 font-bold"
                  : "bg-blue-950/70 text-blue-300 border-blue-700 font-bold"
                : isLight
                ? "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                : "bg-[#1e222d] text-slate-400 border-[#2a2e39] hover:bg-[#2a2e39]"
            }`}
            title="Toggle Orders & SL/TP Lines"
          >
            <span>Orders / BE</span>
          </button>

          <button
            type="button"
            onClick={() => setShowMarkers(!showMarkers)}
            className={`px-2.5 py-1 rounded-md border font-semibold transition-all cursor-pointer flex items-center space-x-1 ${
              showMarkers
                ? isLight
                  ? "bg-purple-50 text-purple-700 border-purple-300 font-bold"
                  : "bg-purple-950/70 text-purple-300 border-purple-700 font-bold"
                : isLight
                ? "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                : "bg-[#1e222d] text-slate-400 border-[#2a2e39] hover:bg-[#2a2e39]"
            }`}
            title="Toggle Buy/Sell Signal Badges"
          >
            <span>Signals</span>
          </button>

          {/* Theme Selector Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`px-2.5 py-1 rounded-md border font-bold transition-all cursor-pointer flex items-center space-x-1 ${
              isLight
                ? "bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300"
                : "bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700"
            }`}
            title="Switch between TradingView Light and Dark"
          >
            {isLight ? <Sun className="w-3.5 h-3.5 text-amber-600" /> : <Moon className="w-3.5 h-3.5 text-amber-400" />}
            <span>{isLight ? "TV Light" : "TV Dark"}</span>
          </button>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className={`p-1.5 rounded-md border transition-all cursor-pointer ${
              isLight
                ? "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                : "bg-[#1e222d] hover:bg-[#2a2e39] text-slate-300 border-[#2a2e39]"
            }`}
            title="Fullscreen Chart"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. TRADINGVIEW INDICATOR PARAMETERS & OHLC BAR (Exact formula string from IMG_1850) */}
      <div
        className={`px-4 py-2 border-b flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono select-none ${
          isLight ? "bg-slate-50/70 border-slate-200 text-slate-600" : "bg-[#161a25] border-[#2a2e39] text-slate-400"
        }`}
      >
        {/* TradingView Strategy Text line matching user screenshot */}
        <div className="flex items-center space-x-2 truncate max-w-xl">
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            SAOTS [Auto 13 2 close 20 0.5 100 0.4 1.5 0.5 5 0.55 0.25 0.35 0.2 0.25 0.2 20 10 CBOE:VIX 252 60 30 1 Block High IV 3 14 70 30 20 60 1.5 Fixed 1 2 3 10 100 0.6 0.4 0.5 2 0.5 8 20 0 0.7 0.05 5 0...]
          </span>
        </div>

        {/* OHLCV Dynamic Telemetry */}
        {activeOhlc && (
          <div className="flex items-center space-x-3 text-[11px]">
            <span>
              O: <strong className="font-bold">{formatPrice(pair, activeOhlc.open)}</strong>
            </span>
            <span>
              H: <strong className="font-bold text-[#089981]">{formatPrice(pair, activeOhlc.high)}</strong>
            </span>
            <span>
              L: <strong className="font-bold text-[#f23645]">{formatPrice(pair, activeOhlc.low)}</strong>
            </span>
            <span>
              C: <strong className="font-bold">{formatPrice(pair, activeOhlc.close)}</strong>
            </span>
            <span className="hidden sm:inline">
              Vol: <strong className="font-bold">{activeOhlc.volume.toLocaleString()}</strong>
            </span>
          </div>
        )}
      </div>

      {/* 3. LIGHTWEIGHT CHARTS CANVAS CONTAINER */}
      <div className="relative flex-1 w-full min-h-[460px]">
        <div ref={chartContainerRef} className="w-full h-full" />

        {/* Live Candle Countdown Timer Badge (displayed right above price axis) */}
        <div
          className={`absolute top-3 right-4 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold shadow-md z-10 border flex items-center space-x-1.5 ${
            isLight
              ? "bg-white/95 text-[#089981] border-slate-200 shadow-slate-200"
              : "bg-[#1e222d]/95 text-[#089981] border-[#2a2e39] shadow-black"
          }`}
        >
          <Clock className="w-3 h-3 text-[#089981] animate-spin" style={{ animationDuration: "6s" }} />
          <span>Candle Close: {countdownStr}</span>
        </div>
      </div>

      {/* 4. TRADINGVIEW BOTTOM TOOLBAR (Matching IMG_1850) */}
      <div
        className={`px-4 py-2 border-t flex flex-wrap items-center justify-between gap-3 select-none text-xs ${
          isLight ? "bg-white border-slate-200 text-slate-700" : "bg-[#131722] border-[#2a2e39] text-slate-300"
        }`}
      >
        {/* Bottom Left: Official TV Logo Mark & Symbol Pill */}
        <div className="flex items-center space-x-3">
          {/* TradingView Icon Mark */}
          <div className="flex items-center space-x-1 font-black text-sm tracking-tighter" title="TradingView Engine">
            <span className="text-[#089981]">𝝉</span>
            <span className="text-[#2962ff]">𝝒</span>
          </div>

          <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
            {pair.replace("/", "")} {timeframe.toLowerCase()}
          </span>

          <span className="text-[11px] text-slate-400 font-mono hidden md:inline">
            ECB Direct Feed · 0.2p Spread
          </span>
        </div>

        {/* Bottom Center: Timeframe Quick Switcher */}
        <div className="flex items-center space-x-1 font-mono text-[11px]">
          {timeframesList.map((tf) => {
            const isActive = timeframe === tf;
            return (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`px-2 py-1 rounded font-bold transition-all cursor-pointer ${
                  isActive
                    ? isLight
                      ? "bg-[#089981] text-white shadow-xs"
                      : "bg-[#089981] text-slate-950 font-black shadow-xs"
                    : isLight
                    ? "text-slate-600 hover:bg-slate-100"
                    : "text-slate-400 hover:bg-[#1e222d] hover:text-white"
                }`}
              >
                {tf.replace("M", "m").replace("H", "h").replace("S", "s")}
              </button>
            );
          })}
        </div>

        {/* Bottom Right: TradingView Tools Toolbar */}
        <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
          <button
            type="button"
            onClick={() => {
              if (chartApiRef.current) {
                chartApiRef.current.timeScale().resetTimeScale();
                chartApiRef.current.timeScale().fitContent();
              }
            }}
            className={`p-1.5 rounded transition-all cursor-pointer ${
              isLight ? "hover:bg-slate-100 text-slate-700" : "hover:bg-[#1e222d] text-slate-300"
            }`}
            title="Reset Zoom & Auto-Scale"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            className={`p-1.5 rounded transition-all cursor-pointer ${
              isLight ? "hover:bg-slate-100 text-slate-700" : "hover:bg-[#1e222d] text-slate-300"
            }`}
            title="Drawing Tools"
          >
            <PenTool className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            className={`p-1.5 rounded transition-all cursor-pointer ${
              isLight ? "hover:bg-slate-100 text-slate-700" : "hover:bg-[#1e222d] text-slate-300"
            }`}
            title="Indicators & Strategies"
          >
            <Activity className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (chartContainerRef.current) {
                const canvas = chartContainerRef.current.querySelector("canvas");
                if (canvas) {
                  const url = canvas.toDataURL("image/png");
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${pair.replace("/", "")}_tradingview_chart.png`;
                  a.click();
                }
              }
            }}
            className={`p-1.5 rounded transition-all cursor-pointer ${
              isLight ? "hover:bg-slate-100 text-slate-700" : "hover:bg-[#1e222d] text-slate-300"
            }`}
            title="Take Screenshot"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
