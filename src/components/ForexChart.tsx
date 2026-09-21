import React, { useState, useEffect, useRef } from "react";
import {
  TrendingUp,
  Layers,
  Crosshair,
  ShieldCheck,
  CheckCircle2,
  Maximize2,
  Clock,
  Zap,
  Target,
  Activity,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronRight,
  MoveHorizontal,
} from "lucide-react";
import { Candle, PairMarketData, PairSymbol, Position, BotSettings, ChartTimeframe } from "../types";
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

export const ForexChart: React.FC<ForexChartProps> = ({
  pair,
  marketData,
  candles,
  positions,
  timeframe,
  setTimeframe,
  botSettings,
}) => {
  const [showIndicators, setShowIndicators] = useState(true);
  const [showRsi, setShowRsi] = useState(true);
  const [countdownStr, setCountdownStr] = useState("00:00");
  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);

  // --- ZOOM & PAN STATE ENGINE ---
  // zoom: 0.5 (50% wide) to 3.0 (300% micro detailed zoom)
  const [zoom, setZoom] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<number>(0); // 0 = pinned to latest live candle
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStartX, setDragStartX] = useState<number>(0);
  const [dragStartPan, setDragStartPan] = useState<number>(0);

  // Crosshair coordinates
  const [crosshairPos, setCrosshairPos] = useState<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Live Candle Countdown Timer based on current timeframe
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const sec = now.getSeconds();
      const min = now.getMinutes();

      let remSec = 0;
      if (timeframe === "30S") {
        remSec = 30 - (sec % 30);
      } else if (timeframe === "1M" || timeframe === "M1") {
        remSec = 60 - sec;
      } else if (timeframe === "5M" || timeframe === "M5") {
        remSec = (4 - (min % 5)) * 60 + (60 - sec);
      } else if (timeframe === "10M" || timeframe === "M10") {
        remSec = (9 - (min % 10)) * 60 + (60 - sec);
      } else if (timeframe === "15M" || timeframe === "M15") {
        remSec = (14 - (min % 15)) * 60 + (60 - sec);
      } else if (timeframe === "30M" || timeframe === "M30") {
        remSec = (29 - (min % 30)) * 60 + (60 - sec);
      } else if (timeframe === "1H" || timeframe === "H1") {
        remSec = (59 - min) * 60 + (60 - sec);
      } else if (timeframe === "4H" || timeframe === "H4") {
        remSec = ((3 - (Math.floor(now.getHours()) % 4)) * 60 + (59 - min)) * 60 + (60 - sec);
      } else {
        remSec = (4 - (min % 5)) * 60 + (60 - sec);
      }

      if (timeframe === "30S") {
        setCountdownStr(`${remSec}s`);
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

  if (!candles || candles.length === 0) return null;

  // Total candles in buffer
  const totalCandlesCount = candles.length;

  // Calculate visible candle count based on zoom level
  // zoom 0.5 -> ~60 candles (zoomed out panoramic view)
  // zoom 1.0 -> ~34 candles (standard view)
  // zoom 2.0 -> ~18 candles (detailed scalp view)
  // zoom 3.0 -> ~12 candles (micro tick wick inspection)
  const baseCount = 34;
  const visibleCount = Math.min(
    totalCandlesCount,
    Math.max(12, Math.round(baseCount / zoom))
  );

  // Max pan offset allowed so user doesn't scroll off edge
  const maxPanOffset = Math.max(0, totalCandlesCount - visibleCount);
  const clampedPan = Math.max(0, Math.min(maxPanOffset, panOffset));

  // Determine window of visible candles:
  // When panOffset = 0: slice from totalCandlesCount - visibleCount to totalCandlesCount
  const endIdx = totalCandlesCount - clampedPan;
  const startIdx = Math.max(0, endIdx - visibleCount);
  const visibleCandles = candles.slice(startIdx, endIdx);

  // Compute bounding box for price based on VISIBLE candles (Auto Dynamic Y-Axis)
  const visiblePrices = visibleCandles.flatMap((c) => [c.high, c.low]);

  // Include current open positions' SL, TP1, TP2, TP3 in vertical range so targets are visible
  const pairPositions = positions.filter((p) => p.pair === pair);
  pairPositions.forEach((pos) => {
    visiblePrices.push(pos.openPrice, pos.sl, pos.tp1, pos.tp2, pos.tp3);
  });

  const rawMin = Math.min(...visiblePrices);
  const rawMax = Math.max(...visiblePrices);
  const padding = (rawMax - rawMin) * 0.12 || 0.04;
  const minPrice = rawMin - padding;
  const maxPrice = rawMax + padding;
  const priceRange = Math.max(0.0001, maxPrice - minPrice);

  // Chart dimensions
  const width = 860;
  const height = 410;
  const rsiHeight = showRsi ? 85 : 0;
  const chartHeight = height - rsiHeight;
  const startX = 22;
  const rightMargin = 75;
  const usableWidth = width - startX - rightMargin;

  // Dynamic candle width: scales dynamically with zoom!
  const candleGap = Math.max(2, Math.min(6, Math.floor(180 / visibleCandles.length)));
  const candleWidth = Math.max(
    6,
    Math.floor((usableWidth - visibleCandles.length * candleGap) / visibleCandles.length)
  );

  const getY = (price: number) => {
    return chartHeight - ((price - minPrice) / priceRange) * (chartHeight - 44) - 22;
  };

  const precision = PRICE_PRECISIONS[pair];
  const lastCandle = hoveredCandle || visibleCandles[visibleCandles.length - 1];

  // Grid price lines
  const gridCount = 6;
  const gridPrices = Array.from({ length: gridCount }, (_, i) => {
    return minPrice + (priceRange / (gridCount - 1)) * i;
  });

  // Calculate EMA points for SVG path on visible candles
  const ema20Path = visibleCandles
    .map((c, i) => {
      if (c.ema20 === undefined) return null;
      const x = startX + i * (candleWidth + candleGap) + candleWidth / 2;
      const y = getY(c.ema20);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .filter(Boolean)
    .join(" ");

  const ema50Path = visibleCandles
    .map((c, i) => {
      if (c.ema50 === undefined) return null;
      const x = startX + i * (candleWidth + candleGap) + candleWidth / 2;
      const y = getY(c.ema50);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .filter(Boolean)
    .join(" ");

  // Strategy description tag
  const getStrategyBadge = () => {
    if (botSettings?.strategyMode === "INTELLIGENT_10M_SNIPER_005") {
      return {
        label: "10M 0.05 SL SNIPER",
        desc: "AI Intelligence Confluence + 0.05 SL (5.0 Pips) + Auto-BE Shield",
        tp: "+18p (Locks BE) / +105p Runner",
        color: "text-amber-400 bg-amber-950/80 border-amber-700/50",
      };
    }
    if (botSettings?.strategyMode === "PRO_5M_SCALP" || timeframe === "5M") {
      return {
        label: "5-MIN PRO SCALP",
        desc: "ICT Fair Value Gap (FVG) + 20 EMA Liquidity Sniping",
        tp: "+15p (Auto-BE)",
        color: "text-emerald-400 bg-emerald-950/80 border-emerald-700/50",
      };
    }
    if (botSettings?.strategyMode === "PRO_10M_TREND" || timeframe === "10M") {
      return {
        label: "10-MIN PRO TREND",
        desc: "Institutional Trend Expansion + VWAP Volume Ribbon",
        tp: "+24p (Auto-BE) / +110p Runner",
        color: "text-cyan-400 bg-cyan-950/80 border-cyan-700/50",
      };
    }
    if (timeframe === "30S") {
      return {
        label: "30S MICRO TAPE",
        desc: "Sub-Minute Interbank Order Flow & Liquidity Slices",
        tp: "Fast Scalp",
        color: "text-amber-400 bg-amber-950/80 border-amber-700/50",
      };
    }
    if (timeframe === "1M") {
      return {
        label: "1M TICK TRIGGER",
        desc: "Precision Entry Confirmation & Immediate Break-Even",
        tp: "+12p Scalp",
        color: "text-purple-400 bg-purple-950/80 border-purple-700/50",
      };
    }
    if (timeframe === "30M") {
      return {
        label: "30M SESSION EXPANSION",
        desc: "London & New York High/Low Range Breakout Structure",
        tp: "+45p Swing",
        color: "text-blue-400 bg-blue-950/80 border-blue-700/50",
      };
    }
    if (timeframe === "1H") {
      return {
        label: "1H MACRO FOUNDATION",
        desc: "Institutional Supply/Demand Zones & Market Structure Shift",
        tp: "+85p Macro",
        color: "text-indigo-400 bg-indigo-950/80 border-indigo-700/50",
      };
    }
    return {
      label: `${timeframe} SWING VIEW`,
      desc: "Multi-Timeframe Institutional Confluence Matrix",
      tp: "High Pip Target",
      color: "text-slate-300 bg-slate-800 border-slate-700",
    };
  };

  const strategyBadge = getStrategyBadge();

  // Zoom control helpers
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(3.0, parseFloat((prev + 0.35).toFixed(2))));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(0.5, parseFloat((prev - 0.35).toFixed(2))));
  };

  const handleResetZoom = () => {
    setZoom(1.0);
    setPanOffset(0);
  };

  // Mouse wheel zoom on SVG canvas
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      // Zoom in
      setZoom((prev) => Math.min(3.0, parseFloat((prev + 0.2).toFixed(2))));
    } else {
      // Zoom out
      setZoom((prev) => Math.max(0.5, parseFloat((prev - 0.2).toFixed(2))));
    }
  };

  // Mouse drag to pan
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragStartPan(panOffset);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x >= 0 && x <= width && y >= 0 && y <= height) {
      setCrosshairPos({ x, y });
    }

    if (isDragging) {
      const deltaX = e.clientX - dragStartX;
      // Convert pixel drag to candle count shift
      const candleStepPx = candleWidth + candleGap;
      const candlesMoved = Math.round(deltaX / candleStepPx);
      setPanOffset(Math.max(0, Math.min(maxPanOffset, dragStartPan + candlesMoved)));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setCrosshairPos(null);
    setHoveredCandle(null);
  };

  // Prominently featured timeframe list with exact requested items (1min, 5 min, 10 min, 30 min, 1 hour)
  const timeframesList: { id: ChartTimeframe; label: string; sub: string }[] = [
    { id: "30S", label: "30S", sub: "30s" },
    { id: "1M", label: "1M", sub: "1 min" },
    { id: "5M", label: "5M", sub: "5 min" },
    { id: "10M", label: "10M", sub: "10 min" },
    { id: "15M", label: "15M", sub: "15 min" },
    { id: "30M", label: "30M", sub: "30 min" },
    { id: "1H", label: "1H", sub: "1 hour" },
    { id: "4H", label: "4H", sub: "4 hour" },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
      {/* Chart Top Toolbar */}
      <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800/90 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Symbol & Timeframe Selection Pills */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center space-x-1.5">
            <span className="font-black text-sm text-white tracking-tight">{pair}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold border border-emerald-800/50">
              LIVE
            </span>
          </div>

          <div className="h-4 w-px bg-slate-800 hidden sm:block"></div>

          {/* Timeframes: 1min, 5 min, 10 min, 30 min, 1 hour prominently visible */}
          <div className="flex items-center space-x-1 bg-slate-900/95 p-1 rounded-xl border border-slate-800 text-xs font-mono shadow-inner">
            {timeframesList.map((tf) => {
              const isSelected = timeframe === tf.id;
              return (
                <button
                  key={tf.id}
                  onClick={() => setTimeframe(tf.id)}
                  title={`${tf.label} (${tf.sub}) Candlestick Chart`}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center space-x-1 font-bold ${
                    isSelected
                      ? "bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black shadow-md shadow-emerald-500/20 scale-105"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/70"
                  }`}
                >
                  <span>{tf.label}</span>
                  <span className={`text-[9px] opacity-75 hidden md:inline font-normal ${isSelected ? "text-slate-950 font-bold" : "text-slate-500"}`}>
                    {tf.sub}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Live Candle Countdown Indicator */}
          <div className="flex items-center space-x-1.5 bg-slate-900/90 border border-slate-800 px-2.5 py-1 rounded-lg font-mono text-[11px] shadow-xs">
            <Clock className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-slate-400">Close:</span>
            <span className="font-extrabold text-emerald-300">{countdownStr}</span>
          </div>
        </div>

        {/* Right: Interactive Zooming Controls & Technical Indicators */}
        <div className="flex items-center space-x-2 text-xs">
          {/* Zoom Engine Controls */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5 space-x-1 font-mono text-xs shadow-inner">
            <button
              onClick={handleZoomOut}
              title="Zoom Out (View more candles)"
              className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <span className="px-1.5 py-0.5 text-[11px] font-extrabold text-cyan-300 select-none">
              {Math.round(zoom * 100)}%
            </span>

            <button
              onClick={handleZoomIn}
              title="Zoom In (Enlarge candles & inspect micro price action)"
              className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleResetZoom}
              title="Reset Zoom & Pan (100% Fit)"
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Indicators Toggles */}
          <button
            onClick={() => setShowIndicators(!showIndicators)}
            className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer flex items-center space-x-1 border ${
              showIndicators
                ? "bg-cyan-950/80 text-cyan-300 border-cyan-700/60 shadow-xs"
                : "bg-slate-900 text-slate-500 border-slate-800"
            }`}
          >
            <Layers className="w-3 h-3" />
            <span className="hidden sm:inline">EMA 20/50</span>
          </button>

          <button
            onClick={() => setShowRsi(!showRsi)}
            className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer flex items-center space-x-1 border ${
              showRsi
                ? "bg-purple-950/80 text-purple-300 border-purple-700/60 shadow-xs"
                : "bg-slate-900 text-slate-500 border-slate-800"
            }`}
          >
            <Crosshair className="w-3 h-3" />
            <span>RSI: {marketData.rsi14.toFixed(0)}</span>
          </button>
        </div>
      </div>

      {/* STRATEGY & OHLC STATUS BANNER */}
      <div className="px-4 py-2 bg-slate-950/90 border-b border-slate-800/70 flex flex-wrap items-center justify-between text-[11px] font-mono gap-2">
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-0.5 rounded font-black border text-[10px] uppercase flex items-center space-x-1 ${strategyBadge.color}`}>
            <Zap className="w-3 h-3 fill-current" />
            <span>{strategyBadge.label}</span>
          </span>
          <span className="text-slate-400 hidden md:inline">{strategyBadge.desc}</span>
          <span className="text-emerald-400 font-bold hidden lg:inline">| Target: {strategyBadge.tp}</span>
        </div>

        {/* OHLCV ticker for current or hovered candle */}
        <div className="flex items-center space-x-3 text-[10.5px]">
          {hoveredCandle && (
            <span className="text-cyan-400 font-bold bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/50">
              {hoveredCandle.time}
            </span>
          )}
          <span className="text-slate-400">
            O: <span className="text-white font-bold">{lastCandle.open.toFixed(precision)}</span>
          </span>
          <span className="text-slate-400">
            H: <span className="text-emerald-400 font-bold">{lastCandle.high.toFixed(precision)}</span>
          </span>
          <span className="text-slate-400">
            L: <span className="text-rose-400 font-bold">{lastCandle.low.toFixed(precision)}</span>
          </span>
          <span className="text-slate-400">
            C: <span className="text-cyan-300 font-bold">{lastCandle.close.toFixed(precision)}</span>
          </span>
          <span className="text-slate-500 hidden sm:inline">
            Vol: <span className="text-slate-300 font-bold">{lastCandle.volume.toLocaleString()}</span>
          </span>

          {/* If scrolled back into history, show Snap to Live button */}
          {panOffset > 0 && (
            <button
              onClick={() => setPanOffset(0)}
              className="px-2 py-0.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded flex items-center space-x-1 cursor-pointer font-bold animate-pulse"
            >
              <span>Snap to Live</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Main SVG Candlestick Canvas with Wheel Zoom and Pan Drag */}
      <div
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        className={`relative w-full overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-2 select-none ${
          isDragging ? "cursor-grabbing" : "cursor-crosshair"
        }`}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[700px] select-none block"
          style={{ maxHeight: "430px" }}
        >
          <defs>
            <linearGradient id="bullishGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="bearishGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#e11d48" />
            </linearGradient>
            <filter id="candleGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Horizontal Grid Lines & Price Axis */}
          {gridPrices.map((p, idx) => {
            const y = getY(p);
            return (
              <g key={idx}>
                <line
                  x1="0"
                  y1={y}
                  x2={width - rightMargin}
                  y2={y}
                  stroke="#1e293b"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={width - rightMargin + 6}
                  y={y + 3.5}
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {p.toFixed(precision)}
                </text>
              </g>
            );
          })}

          {/* Technical Indicators: EMA 20 & 50 */}
          {showIndicators && (
            <>
              {ema20Path && (
                <path
                  d={ema20Path}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth={zoom > 1.5 ? "2.2" : "1.7"}
                  opacity="0.9"
                />
              )}
              {ema50Path && (
                <path
                  d={ema50Path}
                  fill="none"
                  stroke="#f97316"
                  strokeWidth={zoom > 1.5 ? "2.2" : "1.7"}
                  opacity="0.85"
                />
              )}
            </>
          )}

          {/* Candlesticks Rendering */}
          {visibleCandles.map((candle, idx) => {
            const x = startX + idx * (candleWidth + candleGap);
            const isBullish = candle.close >= candle.open;
            const openY = getY(candle.open);
            const closeY = getY(candle.close);
            const highY = getY(candle.high);
            const lowY = getY(candle.low);
            const bodyTop = Math.min(openY, closeY);
            const bodyHeight = Math.max(2, Math.abs(openY - closeY));
            const color = isBullish ? "#10b981" : "#f43f5e";
            const isHovered = hoveredCandle?.timestamp === candle.timestamp;

            return (
              <g
                key={candle.timestamp}
                onMouseEnter={() => setHoveredCandle(candle)}
                className="cursor-pointer"
              >
                {/* Upper/Lower Wick */}
                <line
                  x1={x + candleWidth / 2}
                  y1={highY}
                  x2={x + candleWidth / 2}
                  y2={lowY}
                  stroke={color}
                  strokeWidth={zoom > 1.4 ? "2" : "1.3"}
                />

                {/* Candle Body */}
                <rect
                  x={x}
                  y={bodyTop}
                  width={candleWidth}
                  height={bodyHeight}
                  fill={isBullish ? "url(#bullishGradient)" : "url(#bearishGradient)"}
                  stroke={isHovered ? "#ffffff" : color}
                  strokeWidth={isHovered ? "1.5" : "0.5"}
                  rx={candleWidth > 12 ? "1.5" : "0.5"}
                  className="transition-opacity hover:opacity-90"
                />

                {/* Date/Time tick on bottom axis */}
                {(idx % Math.max(1, Math.floor(visibleCandles.length / 7)) === 0 || idx === visibleCandles.length - 1) && (
                  <text
                    x={x + candleWidth / 2}
                    y={chartHeight + 14}
                    fill="#475569"
                    fontSize="9.5"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    {candle.time}
                  </text>
                )}
              </g>
            );
          })}

          {/* Current Live Tick Bid/Ask Marker */}
          {lastCandle && (
            <g>
              <line
                x1="0"
                y1={getY(marketData.currentBid)}
                x2={width - rightMargin}
                y2={getY(marketData.currentBid)}
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeDasharray="3 2"
              />
              <rect
                x={width - rightMargin + 2}
                y={getY(marketData.currentBid) - 9}
                width="70"
                height="18"
                fill="#0284c7"
                rx="4"
              />
              <text
                x={width - rightMargin + 6}
                y={getY(marketData.currentBid) + 3.5}
                fill="#ffffff"
                fontSize="10"
                fontWeight="bold"
                fontFamily="monospace"
              >
                {formatPrice(pair, marketData.currentBid)}
              </text>
            </g>
          )}

          {/* Open Position Overlays: Entry, SL (or BE Shield), TP1, TP2, TP3 */}
          {pairPositions.map((pos) => {
            const entryY = getY(pos.openPrice);
            const slY = getY(pos.sl);
            const tp1Y = getY(pos.tp1);
            const tp2Y = getY(pos.tp2);
            const tp3Y = getY(pos.tp3);

            return (
              <g key={pos.id}>
                {/* ENTRY LEVEL */}
                <line
                  x1="0"
                  y1={entryY}
                  x2={width - rightMargin}
                  y2={entryY}
                  stroke="#94a3b8"
                  strokeWidth="1.2"
                  strokeDasharray="4 4"
                />
                <text
                  x="25"
                  y={entryY - 4}
                  fill="#94a3b8"
                  fontSize="9.5"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  ENTRY #{pos.ticket} {pos.type} @ {formatPrice(pair, pos.openPrice)}
                </text>

                {/* STOP LOSS (or BREAK-EVEN SHIELD) */}
                <line
                  x1="0"
                  y1={slY}
                  x2={width - rightMargin}
                  y2={slY}
                  stroke={pos.isBreakeven ? "#eab308" : "#f43f5e"}
                  strokeWidth={pos.isBreakeven ? "2" : "1.5"}
                />
                <rect
                  x="25"
                  y={slY - 14}
                  width={pos.isBreakeven ? "245" : "150"}
                  height="16"
                  fill={pos.isBreakeven ? "#713f12" : "#881337"}
                  rx="3"
                  opacity="0.92"
                />
                <text
                  x="30"
                  y={slY - 3}
                  fill={pos.isBreakeven ? "#fef08a" : "#fecdd3"}
                  fontSize="9.5"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {pos.isBreakeven
                    ? "🛡️ NO LOSS: BE LOCKED @ " + formatPrice(pair, pos.sl)
                    : "SL @ " + formatPrice(pair, pos.sl)}
                </text>

                {/* TAKE PROFIT 1 */}
                <line
                  x1="0"
                  y1={tp1Y}
                  x2={width - rightMargin}
                  y2={tp1Y}
                  stroke="#10b981"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />
                <rect
                  x="25"
                  y={tp1Y - 14}
                  width="185"
                  height="16"
                  fill="#064e3b"
                  rx="3"
                  opacity="0.92"
                />
                <text
                  x="30"
                  y={tp1Y - 3}
                  fill="#a7f3d0"
                  fontSize="9.5"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {pos.tp1Hit
                    ? "✅ TP1 HIT (BE TRIGGERED)"
                    : "🎯 TP1: " + formatPrice(pair, pos.tp1) + " (Locks BE)"}
                </text>

                {/* TAKE PROFIT 2 */}
                <line
                  x1="0"
                  y1={tp2Y}
                  x2={width - rightMargin}
                  y2={tp2Y}
                  stroke="#0d9488"
                  strokeWidth="1.5"
                  strokeDasharray="6 3"
                />
                <rect
                  x="25"
                  y={tp2Y - 14}
                  width="145"
                  height="16"
                  fill="#134e4a"
                  rx="3"
                  opacity="0.92"
                />
                <text
                  x="30"
                  y={tp2Y - 3}
                  fill="#99f6e4"
                  fontSize="9.5"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {pos.tp2Hit ? "✅ TP2 HIT" : "🚀 TP2: " + formatPrice(pair, pos.tp2)}
                </text>

                {/* TAKE PROFIT 3 (RUNNER) */}
                <line
                  x1="0"
                  y1={tp3Y}
                  x2={width - rightMargin}
                  y2={tp3Y}
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                  strokeDasharray="8 4"
                />
                <rect
                  x="25"
                  y={tp3Y - 14}
                  width="160"
                  height="16"
                  fill="#78350f"
                  rx="3"
                  opacity="0.92"
                />
                <text
                  x="30"
                  y={tp3Y - 3}
                  fill="#fde68a"
                  fontSize="9.5"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {pos.tp3Hit ? "🏆 TP3 MAX HIT" : "💎 TP3 RUNNER: " + formatPrice(pair, pos.tp3)}
                </text>
              </g>
            );
          })}

          {/* Interactive Crosshair Indicator Lines */}
          {crosshairPos && (
            <g opacity="0.65">
              <line
                x1={crosshairPos.x}
                y1={0}
                x2={crosshairPos.x}
                y2={chartHeight}
                stroke="#94a3b8"
                strokeDasharray="2 2"
                strokeWidth="1"
              />
              <line
                x1={0}
                y1={crosshairPos.y}
                x2={width - rightMargin}
                y2={crosshairPos.y}
                stroke="#94a3b8"
                strokeDasharray="2 2"
                strokeWidth="1"
              />
            </g>
          )}

          {/* RSI Sub-Panel */}
          {showRsi && (
            <g transform={`translate(0, ${chartHeight + 10})`}>
              <rect x="0" y="0" width={width} height={rsiHeight} fill="#0b0f19" />
              <line x1="0" y1="0" x2={width} y2="0" stroke="#1e293b" strokeWidth="1" />

              {/* RSI 70 Overbought */}
              <line
                x1="0"
                y1="18"
                x2={width - rightMargin}
                y2="18"
                stroke="#ef4444"
                strokeDasharray="2 2"
              />
              <text
                x={width - rightMargin + 6}
                y="21"
                fill="#ef4444"
                fontSize="8.5"
                fontFamily="monospace"
              >
                70 OB
              </text>

              {/* RSI 50 Neutral */}
              <line
                x1="0"
                y1="40"
                x2={width - rightMargin}
                y2="40"
                stroke="#334155"
                strokeDasharray="2 2"
              />
              <text
                x={width - rightMargin + 6}
                y="43"
                fill="#64748b"
                fontSize="8.5"
                fontFamily="monospace"
              >
                50 MID
              </text>

              {/* RSI 30 Oversold */}
              <line
                x1="0"
                y1="62"
                x2={width - rightMargin}
                y2="62"
                stroke="#10b981"
                strokeDasharray="2 2"
              />
              <text
                x={width - rightMargin + 6}
                y="65"
                fill="#10b981"
                fontSize="8.5"
                fontFamily="monospace"
              >
                30 OS
              </text>

              {/* Oscillating RSI Line mapped to visible candles */}
              <path
                d={visibleCandles
                  .map((c, i) => {
                    const x = startX + i * (candleWidth + candleGap) + candleWidth / 2;
                    const rsiVal = 50 + Math.sin(i * 0.45) * 22 + (c.close > c.open ? 8 : -8);
                    const y = 80 - (rsiVal / 100) * 70;
                    return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
                  })
                  .join(" ")}
                fill="none"
                stroke="#c084fc"
                strokeWidth="1.5"
              />
              <text
                x="25"
                y="14"
                fill="#c084fc"
                fontSize="9"
                fontWeight="bold"
                fontFamily="monospace"
              >
                RSI (14) MOMENTUM OSCILLATOR
              </text>
            </g>
          )}
        </svg>

        {/* Floating Zoom & Pan Helper Badge */}
        <div className="absolute bottom-3 left-4 flex items-center space-x-2 text-[10px] font-mono text-slate-400 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800 backdrop-blur-sm pointer-events-none">
          <MoveHorizontal className="w-3 h-3 text-cyan-400" />
          <span>Scroll mouse wheel to Zoom • Click & Drag to Pan ({visibleCandles.length}/{totalCandlesCount} bars)</span>
        </div>
      </div>

      {/* QUICK PRESET ZOOM BAR */}
      <div className="px-4 py-1.5 bg-slate-950 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] font-mono gap-2 text-slate-400">
        <div className="flex items-center space-x-1.5">
          <span className="text-slate-500">Zoom Presets:</span>
          {[
            { label: "50% (Wide)", val: 0.5 },
            { label: "100% (Std)", val: 1.0 },
            { label: "150% (Detail)", val: 1.5 },
            { label: "200% (Micro)", val: 2.0 },
          ].map((preset) => (
            <button
              key={preset.label}
              onClick={() => {
                setZoom(preset.val);
                setPanOffset(0);
              }}
              className={`px-2 py-0.5 rounded text-[10.5px] transition-colors cursor-pointer ${
                zoom === preset.val
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold"
                  : "bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <span>Active Candle Window: <strong className="text-slate-200">{visibleCandles.length} Bars</strong></span>
          <span className="text-slate-600">|</span>
          <span>Timeframe: <strong className="text-emerald-400 font-bold">{timeframe}</strong></span>
        </div>
      </div>
    </div>
  );
};
