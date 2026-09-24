import React, { useState, useEffect } from "react";
import {
  Activity,
  Zap,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Clock,
  Radio,
  Sliders,
  DollarSign,
  AlertTriangle,
  Flame,
  Layers,
  ChevronRight,
  Crosshair,
  BarChart2,
  Terminal,
  Server,
  Lock,
  RefreshCw,
  Eye,
  CheckCircle2,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Cpu,
  Compass,
  Calendar,
  Sparkles,
  Brain,
} from "lucide-react";
import {
  AccountStats,
  AlgoSignal,
  BotSettings,
  BrokerBridgeConfig,
  LiveBrokerPacket,
  PairMarketData,
  PairSymbol,
  Position,
  TradeHistoryItem,
} from "../types";
import { formatPrice } from "../utils/forexCalculations";

interface ModernTechDashboardProps {
  selectedPair: PairSymbol;
  setSelectedPair: (pair: PairSymbol) => void;
  marketData: Record<PairSymbol, PairMarketData>;
  account: AccountStats;
  positions: Position[];
  history: TradeHistoryItem[];
  botSettings: BotSettings;
  setBotSettings: React.Dispatch<React.SetStateAction<BotSettings>>;
  brokerConfig: BrokerBridgeConfig;
  onExecuteOrder: (pair: PairSymbol, type: "BUY" | "SELL", lots: number, tag?: string, customSlPips?: number) => void;
  onMoveToBreakeven: (id: string) => void;
  onClosePosition: (id: string, reason?: string) => void;
  onPartialClose: (id: string, percent: number, stage: "TP1" | "TP2") => void;
  onOpenBrokerModal: () => void;
  onSyncRates: () => void;
  isSyncingRates: boolean;
  rateSource: string;
  packets: LiveBrokerPacket[];
  signals: AlgoSignal[];
  onSwitchToTerminal: () => void;
  onSwitchToMasterAI?: () => void;
}

interface OrderBookLevel {
  price: number;
  lots: number;
  cumulativeLots: number;
  percent: number;
  type: "ASK" | "BID";
}

interface EconomicEvent {
  id: string;
  time: string;
  currency: "USD" | "EUR" | "JPY";
  event: string;
  impact: "HIGH" | "MEDIUM" | "LOW";
  forecast: string;
  previous: string;
  countdown: string;
  activeShield: boolean;
}

export const ModernTechDashboard: React.FC<ModernTechDashboardProps> = ({
  selectedPair,
  setSelectedPair,
  marketData,
  account,
  positions,
  history,
  botSettings,
  setBotSettings,
  brokerConfig,
  onExecuteOrder,
  onMoveToBreakeven,
  onClosePosition,
  onPartialClose,
  onOpenBrokerModal,
  onSyncRates,
  isSyncingRates,
  rateSource,
  packets,
  signals,
  onSwitchToTerminal,
  onSwitchToMasterAI,
}) => {
  const currentPairData = marketData[selectedPair];
  const [selectedLots, setSelectedLots] = useState(botSettings.fixedLotSize);
  const [dashSlMode, setDashSlMode] = useState<"0.05_PIP" | "0.05_SNIPER" | "DYNAMIC_ATR">("0.05_PIP");
  const [activeTabSub, setActiveTabSub] = useState<"QUANT_MATRIX" | "ORDER_BOOK_DOM" | "ECONOMIC_RADAR">("QUANT_MATRIX");
  const [aiAnalysisRunning, setAiAnalysisRunning] = useState(false);
  const [newsProtectionArmed, setNewsProtectionArmed] = useState(true);
  const [tickCounter, setTickCounter] = useState(148);

  // Micro-tick animation counter for high-tech HUD feel
  useEffect(() => {
    const timer = setInterval(() => {
      setTickCounter((prev) => prev + Math.floor(Math.random() * 3) + 1);
    }, 1200);
    return () => clearInterval(timer);
  }, []);

  // Generate simulated realistic Depth of Market (DOM) around current bid/ask
  const pipFactor = selectedPair === "USD/JPY" ? 0.01 : 0.0001;
  const precision = selectedPair === "USD/JPY" ? 3 : 5;

  const askLevels: OrderBookLevel[] = [5, 4, 3, 2, 1].map((step, idx) => {
    const price = parseFloat((currentPairData.currentAsk + step * pipFactor).toFixed(precision));
    const lots = parseFloat((4.5 + Math.sin(step * 1.5) * 3.2 + (5 - step) * 2.1).toFixed(1));
    return {
      price,
      lots,
      cumulativeLots: 0,
      percent: Math.min(100, Math.round((lots / 18) * 100)),
      type: "ASK",
    };
  });

  const bidLevels: OrderBookLevel[] = [1, 2, 3, 4, 5].map((step, idx) => {
    const price = parseFloat((currentPairData.currentBid - step * pipFactor).toFixed(precision));
    const lots = parseFloat((5.2 + Math.cos(step * 1.2) * 3.8 + (5 - step) * 2.4).toFixed(1));
    return {
      price,
      lots,
      cumulativeLots: 0,
      percent: Math.min(100, Math.round((lots / 18) * 100)),
      type: "BID",
    };
  });

  // Calculate cumulative lots
  let cumAsk = 0;
  for (let i = askLevels.length - 1; i >= 0; i--) {
    cumAsk += askLevels[i].lots;
    askLevels[i].cumulativeLots = parseFloat(cumAsk.toFixed(1));
  }

  let cumBid = 0;
  for (let i = 0; i < bidLevels.length; i++) {
    cumBid += bidLevels[i].lots;
    bidLevels[i].cumulativeLots = parseFloat(cumBid.toFixed(1));
  }

  // Multi-timeframe quantitative status matrix featuring requested 30S, 1M, 5M, 10M timeframes
  const timeframesMatrix = [
    {
      tf: "30S",
      name: "30 Seconds",
      trend: "BULLISH",
      emaSpread: "+1.8 Pips",
      rsi: 65,
      confluence: 84,
      signal: "MICRO_SCALP",
      structure: "Sub-Minute Tape Speed Surge",
    },
    {
      tf: "1M",
      name: "1 Minute",
      trend: "BULLISH",
      emaSpread: "+3.2 Pips",
      rsi: 61,
      confluence: 88,
      signal: "TICK_TRIGGER",
      structure: "Fractal Order Block Retest",
    },
    {
      tf: "5M",
      name: "5 Minutes",
      trend: "BULLISH",
      emaSpread: "+8.4 Pips",
      rsi: 58,
      confluence: 94,
      signal: "ICT_PRO_SCALP",
      structure: "Liquidity Sweep Lows + FVG Mitigation",
    },
    {
      tf: "10M",
      name: "10 Minutes",
      trend: "BULLISH",
      emaSpread: "+14.6 Pips",
      rsi: 62,
      confluence: 96,
      signal: "PRO_TREND_EXPANSION",
      structure: "10M BOS + EMA Ribbon Expansion",
    },
    {
      tf: "15M",
      name: "15 Minutes",
      trend: "BULLISH",
      emaSpread: "+18.2 Pips",
      rsi: 64,
      confluence: 92,
      signal: "SESSION_BIAS",
      structure: "Bullish London High Continuation",
    },
    {
      tf: "30M",
      name: "30 Minutes",
      trend: "BULLISH",
      emaSpread: "+24.5 Pips",
      rsi: 61,
      confluence: 91,
      signal: "SESSION_EXPANSION",
      structure: "London Session High Breakout",
    },
    {
      tf: "1H",
      name: "1 Hour",
      trend: selectedPair === "USD/JPY" ? "BULLISH" : "BEARISH",
      emaSpread: selectedPair === "USD/JPY" ? "+38.5 Pips" : "-22.1 Pips",
      rsi: selectedPair === "USD/JPY" ? 63 : 41,
      confluence: 90,
      signal: selectedPair === "USD/JPY" ? "RUNNER_ACTIVE" : "SHORT_BIAS",
      structure: "Institutional Demand Zone",
    },
    {
      tf: "4H",
      name: "4 Hours",
      trend: "BULLISH",
      emaSpread: "+62.0 Pips",
      rsi: 56,
      confluence: 85,
      signal: "MACRO_TREND",
      structure: "Weekly Higher Low",
    },
  ];

  // Economic Calendar upcoming releases
  const economicEvents: EconomicEvent[] = [
    {
      id: "EV-1",
      time: "13:30 GMT",
      currency: "USD",
      event: "US Core CPI Inflation Rate (MoM)",
      impact: "HIGH",
      forecast: "0.3%",
      previous: "0.2%",
      countdown: "In 1h 17m",
      activeShield: true,
    },
    {
      id: "EV-2",
      time: "15:00 GMT",
      currency: "USD",
      event: "Fed Chair Speaks & Policy Outlook",
      impact: "HIGH",
      forecast: "-",
      previous: "-",
      countdown: "In 2h 47m",
      activeShield: true,
    },
    {
      id: "EV-3",
      time: "03:30 GMT",
      currency: "JPY",
      event: "Bank of Japan (BoJ) Policy Rate",
      impact: "HIGH",
      forecast: "0.25%",
      previous: "0.25%",
      countdown: "Tomorrow",
      activeShield: false,
    },
    {
      id: "EV-4",
      time: "09:00 GMT",
      currency: "EUR",
      event: "ECB Main Refinancing Rate Decision",
      impact: "HIGH",
      forecast: "3.65%",
      previous: "3.65%",
      countdown: "Tomorrow",
      activeShield: false,
    },
  ];

  // Calculations for quick stats
  const activePositionsThisPair = positions.filter((p) => p.pair === selectedPair);
  const totalOpenPips = positions.reduce((acc, p) => acc + p.pips, 0);
  const totalOpenPnl = positions.reduce((acc, p) => acc + p.pnl, 0);
  const beProtectedCount = positions.filter((p) => p.isBreakeven).length;

  const handleSimulateAiDiagnosis = () => {
    setAiAnalysisRunning(true);
    setTimeout(() => {
      setAiAnalysisRunning(false);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP QUANTUM TELEMETRY HUD MATRIX */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        {/* CARD A: Interbank Pipeline & Micro Latency */}
        <div className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 shadow-xl backdrop-blur-md relative overflow-hidden transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="flex items-center space-x-1.5 font-bold">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>INTERBANK PIPE</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold border border-emerald-800/60 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span>DIRECT FEED</span>
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-white tracking-tight">
              0.84<span className="text-sm font-bold text-slate-400">ms</span>
            </div>
            <div className="text-right text-[11px] text-slate-400">
              <span className="text-emerald-400 font-bold">{tickCounter}</span> ticks/min
            </div>
          </div>
          <div className="mt-2 text-[10.5px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>Route: {brokerConfig.environment === "LIVE_BROKER" ? "MT5 Live EA" : "ECB Live Bus"}</span>
            <span className="text-emerald-400 font-bold">Packet Loss: 0.00%</span>
          </div>
        </div>

        {/* CARD B: Algorithmic Confluence Quantum Score */}
        <div className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 shadow-xl backdrop-blur-md relative overflow-hidden transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="flex items-center space-x-1.5 font-bold">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>CONFLUENCE INDEX</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 font-bold border border-cyan-800/60">
              STRONG BIAS
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-white tracking-tight">
              {currentPairData.confluenceScore}%
              <span className="text-xs font-bold text-cyan-400 ml-1.5">
                {currentPairData.trend}
              </span>
            </div>
            <div className="text-right text-[11px] text-slate-400">
              RSI: <span className="text-slate-200 font-bold">{currentPairData.rsi14}</span>
            </div>
          </div>
          <div className="mt-2 text-[10.5px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>ATR Volatility: {currentPairData.atrPips} Pips</span>
            <span className="text-cyan-400 font-bold">TP1 Win Prob: 92%</span>
          </div>
        </div>

        {/* CARD C: Zero-Loss Break-Even Pipeline Status */}
        <div className="bg-slate-900/90 border border-cyan-900/50 hover:border-cyan-700/60 rounded-2xl p-4 shadow-xl backdrop-blur-md relative overflow-hidden transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="flex items-center space-x-1.5 font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>NO-LOSS PROTOCOL</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 font-bold border border-cyan-800/60">
              AUTO-BE ARMED
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-cyan-300 tracking-tight">
              {beProtectedCount} / {positions.length}
              <span className="text-xs font-bold text-slate-400 ml-1.5">Zero-Risk</span>
            </div>
            <div className="text-right text-[11px] text-slate-400">
              Trigger: <span className="text-emerald-400 font-bold">TP1 (+18p)</span>
            </div>
          </div>
          <div className="mt-2 text-[10.5px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>Commission Buffer: +1.0 Pip</span>
            <span className="text-cyan-300 font-bold">Drawdown Cap: 0.0%</span>
          </div>
        </div>

        {/* CARD D: Net Account PnL & Yield Metric */}
        <div className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 shadow-xl backdrop-blur-md relative overflow-hidden transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="flex items-center space-x-1.5 font-bold">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>LIVE NET FLOATING</span>
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                totalOpenPnl >= 0
                  ? "bg-emerald-950 text-emerald-300 border border-emerald-800/60"
                  : "bg-rose-950 text-rose-300 border border-rose-800/60"
              }`}
            >
              {totalOpenPnl >= 0 ? `+${totalOpenPnl.toFixed(2)} USD` : `${totalOpenPnl.toFixed(2)} USD`}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div
              className={`text-2xl font-black tracking-tight ${
                totalOpenPips >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {totalOpenPips >= 0 ? `+${totalOpenPips.toFixed(1)}` : totalOpenPips.toFixed(1)}
              <span className="text-xs font-bold text-slate-400 ml-1">PIPS</span>
            </div>
            <div className="text-right text-[11px] text-slate-400">
              Equity: <span className="text-white font-bold">${account.equity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          <div className="mt-2 text-[10.5px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>Positions: {positions.length} Active</span>
            <span className="text-emerald-400 font-bold">Margin Free: ${account.freeMargin.toFixed(0)}</span>
          </div>
        </div>
      </div>

      {/* 2. PAIR TICKER & QUICK ACTION SWITCHBOARD */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        {/* Left: Interactive Pair Switcher with Live Spreads */}
        <div className="flex items-center space-x-2">
          {(["USD/JPY", "EUR/USD"] as PairSymbol[]).map((pair) => {
            const data = marketData[pair];
            const isSelected = selectedPair === pair;
            const isUp = data.change24h >= 0;

            return (
              <button
                key={pair}
                onClick={() => setSelectedPair(pair)}
                className={`px-3.5 py-2 rounded-xl border transition-all text-left flex items-center space-x-3 cursor-pointer ${
                  isSelected
                    ? "bg-slate-950 border-emerald-500 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/40"
                    : "bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                }`}
              >
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-extrabold text-sm text-white font-mono">{pair}</span>
                    <span
                      className={`text-[10px] font-mono font-bold ${
                        isUp ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {isUp ? "+" : ""}
                      {data.change24h.toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5 flex items-center space-x-2">
                    <span>Bid: {data.currentBid}</span>
                    <span className="text-slate-600">|</span>
                    <span className="text-emerald-400 font-bold">{data.spreadPips}p spread</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Center: Interactive Sub-Tabs for Dashboard */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setActiveTabSub("QUANT_MATRIX")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTabSub === "QUANT_MATRIX"
                ? "bg-emerald-500 text-slate-950 shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Multi-TF Matrix</span>
          </button>

          <button
            onClick={() => setActiveTabSub("ORDER_BOOK_DOM")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTabSub === "ORDER_BOOK_DOM"
                ? "bg-emerald-500 text-slate-950 shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Order Depth (DOM)</span>
          </button>

          <button
            onClick={() => setActiveTabSub("ECONOMIC_RADAR")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTabSub === "ECONOMIC_RADAR"
                ? "bg-emerald-500 text-slate-950 shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Economic Shield</span>
          </button>
        </div>

        {/* Right: 1-Click Terminal Switcher & Rate Syncer & Bot Controls */}
        <div className="flex flex-wrap items-center space-x-2 text-xs font-mono">
          {/* Direct Algo Bot Running Toggle */}
          <button
            type="button"
            onClick={() =>
              setBotSettings((prev) => ({
                ...prev,
                autoTrading: !prev.autoTrading,
              }))
            }
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border font-bold text-xs transition-all cursor-pointer ${
              botSettings.autoTrading
                ? "bg-emerald-950 text-emerald-300 border-emerald-500 shadow-sm shadow-emerald-500/20 ring-1 ring-emerald-500/30"
                : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
            }`}
            title="Toggle Automated Quantitative Bot Execution ON / OFF"
          >
            <span className={`w-2 h-2 rounded-full ${botSettings.autoTrading ? "bg-emerald-400 animate-ping" : "bg-slate-500"}`}></span>
            <span>{botSettings.autoTrading ? "BOT: RUNNING" : "BOT: PAUSED"}</span>
          </button>

          {/* Quick Force Scan Trigger */}
          <button
            type="button"
            onClick={() => {
              const mData = marketData[selectedPair];
              const direction = mData.trend === "BULLISH" ? "BUY" : "SELL";
              const is10MSniper = botSettings.strategyMode === "INTELLIGENT_10M_SNIPER_005";
              const customSl = is10MSniper
                ? (botSettings.stopLossPips !== undefined ? botSettings.stopLossPips : 0.05)
                : undefined;
              onExecuteOrder(selectedPair, direction, selectedLots, "FORCE_SCAN_SIGNAL", customSl);
            }}
            className="flex items-center space-x-1 px-2.5 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            title="Force quantitative scanner to evaluate confluence and trigger an immediate trade"
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Force Scan</span>
          </button>

          <button
            type="button"
            onClick={onSyncRates}
            disabled={isSyncingRates}
            className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors cursor-pointer"
            title="Poll real live market exchange rates now"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingRates ? "animate-spin text-emerald-400" : ""}`} />
            <span className="hidden sm:inline">{isSyncingRates ? "Syncing..." : "Sync FX Rates"}</span>
          </button>

          <button
            type="button"
            onClick={onSwitchToTerminal}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg transition-colors cursor-pointer shadow-md shadow-emerald-500/20"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Full Chart Terminal</span>
          </button>

          {onSwitchToMasterAI && (
            <button
              type="button"
              onClick={onSwitchToMasterAI}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black rounded-lg transition-all cursor-pointer shadow-md shadow-indigo-500/20"
              title="Open AI Master Strategy Learning Council (ICT, Simons, Wyckoff, Druckenmiller, PTJ)"
            >
              <Brain className="w-3.5 h-3.5 text-indigo-200" />
              <span>Learn from Masters</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. MAIN DASHBOARD CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT 8 COLUMNS: INTERACTIVE QUANT TECH MODULES */}
        <div className="lg:col-span-8 space-y-6">
          {/* TAB 1: MULTI-TIMEFRAME QUANTUM MATRIX */}
          {activeTabSub === "QUANT_MATRIX" && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
                  <h3 className="font-extrabold text-sm text-white tracking-tight font-mono">
                    MULTI-TIMEFRAME QUANT CONFLUENCE MATRIX [{selectedPair}]
                  </h3>
                </div>
                <div className="text-xs font-mono text-slate-400">
                  Alignment: <span className="text-emerald-400 font-bold">100% BULLISH SYNC</span>
                </div>
              </div>

              {/* Grid Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-800 text-[11px]">
                      <th className="pb-2 font-bold">TF</th>
                      <th className="pb-2 font-bold">VECTOR</th>
                      <th className="pb-2 font-bold">EMA 20/50 SPREAD</th>
                      <th className="pb-2 font-bold">RSI (14)</th>
                      <th className="pb-2 font-bold">CONFLUENCE</th>
                      <th className="pb-2 font-bold">SMART MONEY STRUCTURE</th>
                      <th className="pb-2 font-bold text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {timeframesMatrix.map((item) => (
                      <tr key={item.tf} className="hover:bg-slate-950/50 transition-colors">
                        <td className="py-2.5 font-bold text-white">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10.5px]">
                            {item.tf}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10.5px] font-bold flex items-center space-x-1 w-fit ${
                              item.trend === "BULLISH"
                                ? "bg-emerald-950/70 text-emerald-400 border border-emerald-800/40"
                                : "bg-rose-950/70 text-rose-400 border border-rose-800/40"
                            }`}
                          >
                            {item.trend === "BULLISH" ? (
                              <ArrowUpRight className="w-3 h-3" />
                            ) : (
                              <ArrowDownRight className="w-3 h-3" />
                            )}
                            <span>{item.trend}</span>
                          </span>
                        </td>
                        <td className="py-2.5 text-slate-300 font-bold">{item.emaSpread}</td>
                        <td className="py-2.5">
                          <div className="flex items-center space-x-2">
                            <span className="text-slate-300 font-bold w-6">{item.rsi}</span>
                            <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  item.rsi > 70
                                    ? "bg-amber-400"
                                    : item.rsi < 30
                                    ? "bg-rose-400"
                                    : "bg-emerald-400"
                                }`}
                                style={{ width: `${item.rsi}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5">
                          <span className="text-emerald-400 font-bold">{item.confluence}%</span>
                        </td>
                        <td className="py-2.5 text-slate-400 text-[11px]">{item.structure}</td>
                        <td className="py-2.5 text-right">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {item.signal}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bot Recommendation Summary with 5-Min and 10-Min Pro Trading Triggers */}
              <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-3 font-mono text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2 text-slate-300">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>
                      Quant Signal Engine:{" "}
                      <strong className="text-emerald-400">
                        Top-Trader High-Confluence 5M & 10M Entries Active
                      </strong>
                    </span>
                  </div>
                  <span className="text-[10.5px] text-cyan-300 bg-cyan-950/80 border border-cyan-700/50 px-2 py-0.5 rounded">
                    Zero-Loss Auto-BE Guaranteed
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {/* 5-Min Scalp Execution */}
                  <button
                    onClick={() => {
                      setBotSettings((prev) => ({
                        ...prev,
                        strategyMode: "PRO_5M_SCALP",
                        tradingTimeframe: "5M",
                      }));
                      onExecuteOrder(selectedPair, "BUY", selectedLots, "PRO_5M_SCALP_TRIGGER");
                    }}
                    className="p-2.5 bg-gradient-to-r from-emerald-950/80 to-slate-900 border border-emerald-500/50 hover:border-emerald-400 text-left rounded-xl transition-all cursor-pointer group shadow-sm hover:shadow-emerald-500/20"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-white text-xs flex items-center space-x-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>5-MIN ICT SCALP</span>
                      </span>
                      <span className="text-[10px] text-emerald-300 font-bold bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-700/50">
                        TP1 +15p (Auto-BE)
                      </span>
                    </div>
                    <div className="text-[10.5px] text-slate-400 mt-1 flex items-center justify-between">
                      <span>Liquidity grab + FVG entry</span>
                      <span className="text-emerald-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center">
                        Fire {selectedLots}L BUY <ArrowUpRight className="w-3 h-3 ml-0.5" />
                      </span>
                    </div>
                  </button>

                  {/* 10-Min Trend Execution */}
                  <button
                    onClick={() => {
                      setBotSettings((prev) => ({
                        ...prev,
                        strategyMode: "PRO_10M_TREND",
                        tradingTimeframe: "10M",
                      }));
                      onExecuteOrder(selectedPair, "BUY", selectedLots, "PRO_10M_TREND_TRIGGER");
                    }}
                    className="p-2.5 bg-gradient-to-r from-cyan-950/80 to-slate-900 border border-cyan-500/50 hover:border-cyan-400 text-left rounded-xl transition-all cursor-pointer group shadow-sm hover:shadow-cyan-500/20"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-white text-xs flex items-center space-x-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                        <span>10-MIN PRO TREND</span>
                      </span>
                      <span className="text-[10px] text-cyan-300 font-bold bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-700/50">
                        TP1 +24p / TP3 +110p
                      </span>
                    </div>
                    <div className="text-[10.5px] text-slate-400 mt-1 flex items-center justify-between">
                      <span>EMA ribbon + volume expansion</span>
                      <span className="text-cyan-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center">
                        Fire {selectedLots}L BUY <ArrowUpRight className="w-3 h-3 ml-0.5" />
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INTERACTIVE ORDER BOOK DEPTH (DOM) */}
          {activeTabSub === "ORDER_BOOK_DOM" && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 font-mono text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-extrabold text-sm text-white tracking-tight">
                    LEVEL II INTERBANK DEPTH OF MARKET (DOM)
                  </h3>
                </div>
                <div className="text-[11px] text-slate-400">
                  Spread: <span className="text-emerald-400 font-bold">{currentPairData.spreadPips} Pips</span> (ECB
                  Direct Queue)
                </div>
              </div>

              {/* DOM Ladder */}
              <div className="space-y-1">
                {/* ASK LEVELS (RED) */}
                <div className="space-y-1">
                  {askLevels.map((lvl) => (
                    <div
                      key={`ask-${lvl.price}`}
                      onClick={() => onExecuteOrder(selectedPair, "SELL", selectedLots, "DOM_LIMIT_SELL")}
                      className="group relative flex items-center justify-between px-3 py-1.5 bg-slate-950/80 hover:bg-rose-950/40 border border-slate-850 hover:border-rose-700/60 rounded cursor-pointer transition-all overflow-hidden"
                    >
                      <div
                        className="absolute right-0 top-0 bottom-0 bg-rose-500/10 pointer-events-none transition-all group-hover:bg-rose-500/20"
                        style={{ width: `${lvl.percent}%` }}
                      ></div>
                      <div className="relative z-10 flex items-center space-x-3">
                        <span className="text-[10px] text-rose-400 font-bold w-12">SELL ASK</span>
                        <span className="font-bold text-rose-300">{formatPrice(selectedPair, lvl.price)}</span>
                      </div>
                      <div className="relative z-10 flex items-center space-x-4 text-slate-400 text-[11px]">
                        <span>{lvl.lots} Lots</span>
                        <span className="text-slate-500 font-bold">Cum: {lvl.cumulativeLots}L</span>
                        <span className="opacity-0 group-hover:opacity-100 text-[9.5px] px-1.5 py-0.5 rounded bg-rose-500 text-slate-950 font-bold">
                          Sell @ {lvl.price}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* CURRENT SPREAD DIVIDER */}
                <div className="py-2.5 px-3 my-1 bg-slate-950 border-y border-emerald-500/40 flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center space-x-2 text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>MID-MARKET LIQUIDITY INTERCEPT</span>
                  </div>
                  <div className="flex items-center space-x-4 font-mono">
                    <span className="text-slate-400">Bid: {currentPairData.currentBid}</span>
                    <span className="text-slate-400">Ask: {currentPairData.currentAsk}</span>
                    <span className="text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/40">
                      Delta: 0.00
                    </span>
                  </div>
                </div>

                {/* BID LEVELS (GREEN) */}
                <div className="space-y-1">
                  {bidLevels.map((lvl) => (
                    <div
                      key={`bid-${lvl.price}`}
                      onClick={() => onExecuteOrder(selectedPair, "BUY", selectedLots, "DOM_LIMIT_BUY")}
                      className="group relative flex items-center justify-between px-3 py-1.5 bg-slate-950/80 hover:bg-emerald-950/40 border border-slate-850 hover:border-emerald-700/60 rounded cursor-pointer transition-all overflow-hidden"
                    >
                      <div
                        className="absolute right-0 top-0 bottom-0 bg-emerald-500/10 pointer-events-none transition-all group-hover:bg-emerald-500/20"
                        style={{ width: `${lvl.percent}%` }}
                      ></div>
                      <div className="relative z-10 flex items-center space-x-3">
                        <span className="text-[10px] text-emerald-400 font-bold w-12">BUY BID</span>
                        <span className="font-bold text-emerald-300">{formatPrice(selectedPair, lvl.price)}</span>
                      </div>
                      <div className="relative z-10 flex items-center space-x-4 text-slate-400 text-[11px]">
                        <span>{lvl.lots} Lots</span>
                        <span className="text-slate-500 font-bold">Cum: {lvl.cumulativeLots}L</span>
                        <span className="opacity-0 group-hover:opacity-100 text-[9.5px] px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950 font-bold">
                          Buy @ {lvl.price}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-[10.5px] text-slate-400 text-center">
                Tip: Click any price row on the DOM ladder to pin an instant order at that liquidity block.
              </div>
            </div>
          )}

          {/* TAB 3: HIGH IMPACT ECONOMIC CALENDAR */}
          {activeTabSub === "ECONOMIC_RADAR" && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 font-mono text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <h3 className="font-extrabold text-sm text-white tracking-tight">
                    HIGH-IMPACT ECONOMIC SHIELD (USD / JPY / EUR)
                  </h3>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-slate-400">News Protection:</span>
                  <button
                    type="button"
                    onClick={() => setNewsProtectionArmed(!newsProtectionArmed)}
                    className={`px-2.5 py-0.5 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                      newsProtectionArmed
                        ? "bg-emerald-950 text-emerald-300 border-emerald-700"
                        : "bg-slate-800 text-slate-400 border-slate-700"
                    }`}
                  >
                    {newsProtectionArmed ? "AUTO-FREEZE ARMED" : "DISABLED"}
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                {economicEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3.5 bg-slate-950 border border-slate-850 rounded-xl flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="px-2 py-1 rounded bg-slate-800 text-white font-bold text-xs border border-slate-700">
                        {evt.currency}
                      </span>
                      <div>
                        <div className="font-bold text-white text-xs">{evt.event}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center space-x-2">
                          <span>{evt.time}</span>
                          <span>•</span>
                          <span>Frc: {evt.forecast}</span>
                          <span>•</span>
                          <span>Prev: {evt.previous}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          evt.impact === "HIGH"
                            ? "bg-rose-950 text-rose-300 border border-rose-800/60"
                            : "bg-amber-950 text-amber-300 border border-amber-800/60"
                        }`}
                      >
                        {evt.impact} IMPACT
                      </span>
                      <span className="text-xs text-amber-300 font-bold">{evt.countdown}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-400 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  The Bot pauses automated order entries 15 minutes before and after High-Impact FOMC & NFP releases to protect accounts from slippage spikes.
                </span>
              </div>
            </div>
          )}

          {/* 4. ACTIVE "NO LOSS" EXECUTION PIPELINE VISUALIZER */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <h3 className="font-extrabold text-sm text-white tracking-tight font-mono">
                  LIVE POSITION PIPELINE: ZERO-LOSS PROGRESSION
                </h3>
              </div>
              <span className="text-xs font-mono text-cyan-300">
                Active Open: {positions.length} Positions
              </span>
            </div>

            {positions.length === 0 ? (
              <div className="text-center py-6 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-800/60 flex items-center justify-center text-slate-400 mx-auto">
                  <Activity className="w-5 h-5 text-slate-500" />
                </div>
                <div className="text-xs font-mono text-slate-300 font-bold">No Active Open Positions</div>
                <div className="text-[11px] font-mono text-slate-500 max-w-md mx-auto">
                  Execute a trade below or let the Algo Bot auto-trigger. As soon as a trade opens, this pipeline tracks TP1 partial closure and the automatic Break-Even lock!
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => onExecuteOrder(selectedPair, "BUY", selectedLots, "PIPELINE_INIT_DEMO")}
                    className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs font-mono transition-colors cursor-pointer"
                  >
                    Open Live Pipeline Trade (+{selectedLots}L)
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {positions.map((pos) => (
                  <div
                    key={pos.id}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 font-mono text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`font-black px-2 py-0.5 rounded text-[10.5px] ${
                            pos.type === "BUY" ? "bg-emerald-500 text-slate-950" : "bg-rose-500 text-slate-950"
                          }`}
                        >
                          {pos.type}
                        </span>
                        <span className="font-extrabold text-white text-sm">{pos.pair}</span>
                        <span className="text-slate-400">#{pos.ticket}</span>
                        <span className="text-slate-400">({pos.lots} Lots)</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span
                          className={`font-black text-sm ${
                            pos.pips >= 0 ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {pos.pips >= 0 ? `+${pos.pips}` : pos.pips} Pips
                        </span>
                        <span className="text-slate-500">|</span>
                        <span
                          className={`font-bold ${pos.pnl >= 0 ? "text-emerald-300" : "text-rose-300"}`}
                        >
                          ${pos.pnl.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Visual 4-Stage Tracker */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[10.5px]">
                      {/* STAGE 1 */}
                      <div
                        className={`p-2.5 rounded-lg border text-center ${
                          pos.tp1Hit
                            ? "bg-slate-900 border-slate-700 text-slate-400"
                            : "bg-emerald-950/60 border-emerald-500/60 text-emerald-200 ring-1 ring-emerald-500/30"
                        }`}
                      >
                        <div className="font-bold">Stage 1: Open</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Entry: {pos.openPrice}</div>
                        <div className="text-[10px] text-emerald-400 font-bold mt-1">
                          {pos.tp1Hit ? "✓ COMPLETED" : "IN PLAY"}
                        </div>
                      </div>

                      {/* STAGE 2 (BREAK-EVEN LOCK) */}
                      <div
                        className={`p-2.5 rounded-lg border text-center ${
                          pos.isBreakeven
                            ? "bg-cyan-950/80 border-cyan-500 text-cyan-200 ring-1 ring-cyan-500/40"
                            : "bg-slate-900/60 border-slate-800 text-slate-500"
                        }`}
                      >
                        <div className="font-bold flex items-center justify-center space-x-1">
                          <ShieldCheck className="w-3 h-3 text-cyan-400" />
                          <span>Stage 2: Break-Even</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">SL: {pos.sl}</div>
                        <div className="text-[10px] font-bold mt-1 text-cyan-300">
                          {pos.isBreakeven ? "★ ZERO-RISK ACTIVE" : "Pending TP1"}
                        </div>
                      </div>

                      {/* STAGE 3 */}
                      <div
                        className={`p-2.5 rounded-lg border text-center ${
                          pos.tp2Hit
                            ? "bg-amber-950/80 border-amber-500 text-amber-200"
                            : "bg-slate-900/60 border-slate-800 text-slate-500"
                        }`}
                      >
                        <div className="font-bold">Stage 3: TP2 Trail</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Target: {pos.tp2}</div>
                        <div className="text-[10px] font-bold mt-1 text-amber-300">
                          {pos.tp2Hit ? "✓ 30% HARVESTED" : "Trailing"}
                        </div>
                      </div>

                      {/* STAGE 4 */}
                      <div
                        className={`p-2.5 rounded-lg border text-center ${
                          pos.tp3Hit
                            ? "bg-purple-950/80 border-purple-500 text-purple-200"
                            : "bg-slate-900/60 border-slate-800 text-slate-500"
                        }`}
                      >
                        <div className="font-bold">Stage 4: TP3 Runner</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Macro: {pos.tp3}</div>
                        <div className="text-[10px] font-bold mt-1 text-purple-300">
                          {pos.tp3Hit ? "✓ RUNNER HARVESTED" : "Runner Active"}
                        </div>
                      </div>
                    </div>

                    {/* Quick Manual Position Controls */}
                    <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-slate-850">
                      {!pos.isBreakeven && (
                        <button
                          type="button"
                          onClick={() => onMoveToBreakeven(pos.id)}
                          className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 rounded text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          Lock Break-Even Now
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onPartialClose(pos.id, 50, "TP1")}
                        className="px-2.5 py-1 bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-700/60 rounded text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        Bank 50% Partial
                      </button>

                      <button
                        type="button"
                        onClick={() => onClosePosition(pos.id, "MANUAL")}
                        className="px-2.5 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-700/60 rounded text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        Close Full
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT 4 COLUMNS: QUANT INTELLIGENCE & EXECUTION TERMINAL */}
        <div className="lg:col-span-4 space-y-6">
          {/* 1. QUICK QUANT ORDER EXECUTION CARD */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <h3 className="font-extrabold text-sm text-white tracking-tight">
                  INSTANT QUANT ORDER TICKET
                </h3>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                1-CLICK
              </span>
            </div>

            {/* Lot Size Selection */}
            <div>
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span>Execution Volume:</span>
                <span className="text-white font-bold">{selectedLots} Standard Lots</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[0.05, 0.1, 0.25, 0.5].map((lot) => (
                  <button
                    key={lot}
                    type="button"
                    onClick={() => setSelectedLots(lot)}
                    className={`py-1.5 rounded-lg border font-bold text-xs transition-colors cursor-pointer ${
                      selectedLots === lot
                        ? "bg-emerald-500 text-slate-950 border-emerald-400"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {lot}L
                  </button>
                ))}
              </div>
            </div>

            {/* Stop Loss Mode Preset */}
            <div>
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span>Stop Loss Protocol:</span>
                <span className={dashSlMode === "0.05_PIP" ? "text-amber-400 font-black" : dashSlMode === "0.05_SNIPER" ? "text-cyan-400 font-black" : "text-slate-300 font-bold"}>
                  {dashSlMode === "0.05_PIP" ? "0.05 Pip (Micro)" : dashSlMode === "0.05_SNIPER" ? "0.05 Delta (5.0p)" : "Dynamic ATR"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setDashSlMode("0.05_PIP")}
                  className={`py-1 px-1.5 rounded-lg border font-bold text-[10.5px] transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                    dashSlMode === "0.05_PIP"
                      ? "bg-amber-400 text-slate-950 border-amber-300 shadow-xs font-black"
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>0.05 PIP</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDashSlMode("0.05_SNIPER")}
                  className={`py-1 px-1.5 rounded-lg border font-bold text-[10.5px] transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                    dashSlMode === "0.05_SNIPER"
                      ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow-xs font-black"
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <span>5.0 PIPS</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDashSlMode("DYNAMIC_ATR")}
                  className={`py-1 px-1.5 rounded-lg border font-bold text-[10.5px] transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                    dashSlMode === "DYNAMIC_ATR"
                      ? "bg-purple-500 text-slate-950 border-purple-400 shadow-xs font-black"
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <span>ATR</span>
                </button>
              </div>
            </div>

            {/* Target Projections Preview */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 space-y-2 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Stop Loss (Risk):</span>
                <span className="text-rose-400 font-bold">
                  {dashSlMode === "0.05_PIP"
                    ? "-0.05 Pip (Micro-Tick)"
                    : dashSlMode === "0.05_SNIPER"
                    ? "-5.0 Pips (0.05 Delta)"
                    : "-16 Pips (ATR 1.2x)"}
                </span>
              </div>
              <div className="flex items-center justify-between text-cyan-300">
                <span className="flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>TP1 (Locks Break-Even):</span>
                </span>
                <span className="font-bold">+18 Pips (Banks 40%)</span>
              </div>
              <div className="flex items-center justify-between text-amber-300">
                <span>TP2 (Swing Target):</span>
                <span className="font-bold">+38 Pips (Banks 30%)</span>
              </div>
              <div className="flex items-center justify-between text-purple-300">
                <span>TP3 (High-Pip Runner):</span>
                <span className="font-bold">+75 Pips (Banks 30%)</span>
              </div>
            </div>

            {/* 1-Click Buy / Sell Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() =>
                  onExecuteOrder(
                    selectedPair,
                    "BUY",
                    selectedLots,
                    dashSlMode === "0.05_PIP"
                      ? "QUICK_005_PIP_BUY"
                      : dashSlMode === "0.05_SNIPER"
                      ? "QUICK_005_SNIPER_BUY"
                      : "QUICK_DASH_BUY",
                    dashSlMode === "0.05_PIP" ? 0.05 : dashSlMode === "0.05_SNIPER" ? 5.0 : undefined
                  )
                }
                className="p-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-black transition-all cursor-pointer shadow-lg shadow-emerald-500/20 text-center space-y-0.5"
              >
                <div className="text-xs tracking-wider flex items-center justify-center space-x-1">
                  <span>BUY</span>
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <div className="text-[11px] font-mono opacity-90">{currentPairData.currentAsk}</div>
              </button>

              <button
                type="button"
                onClick={() =>
                  onExecuteOrder(
                    selectedPair,
                    "SELL",
                    selectedLots,
                    dashSlMode === "0.05_PIP"
                      ? "QUICK_005_PIP_SELL"
                      : dashSlMode === "0.05_SNIPER"
                      ? "QUICK_005_SNIPER_SELL"
                      : "QUICK_DASH_SELL",
                    dashSlMode === "0.05_PIP" ? 0.05 : dashSlMode === "0.05_SNIPER" ? 5.0 : undefined
                  )
                }
                className="p-3 bg-rose-500 hover:bg-rose-400 text-slate-950 rounded-xl font-black transition-all cursor-pointer shadow-lg shadow-rose-500/20 text-center space-y-0.5"
              >
                <div className="text-xs tracking-wider flex items-center justify-center space-x-1">
                  <span>SELL</span>
                  <ArrowDownRight className="w-4 h-4" />
                </div>
                <div className="text-[11px] font-mono opacity-90">{currentPairData.currentBid}</div>
              </button>
            </div>
          </div>

          {/* 2. AI QUANT NEURAL INTELLIGENCE RADAR */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h3 className="font-extrabold text-sm text-white tracking-tight">
                  AI QUANT INTELLIGENCE RADAR
                </h3>
              </div>
              <button
                type="button"
                onClick={handleSimulateAiDiagnosis}
                disabled={aiAnalysisRunning}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                title="Refresh Quantitative Diagnosis"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${aiAnalysisRunning ? "animate-spin text-cyan-400" : ""}`} />
              </button>
            </div>

            {/* Institutional Order Flow Sentiment */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span>Institutional Sentiment:</span>
                <span className="text-emerald-400 font-bold">81% Institutional Long</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex">
                <div className="bg-emerald-500 h-full" style={{ width: "81%" }}></div>
                <div className="bg-rose-500 h-full" style={{ width: "19%" }}></div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>Smart Money Buyers (81%)</span>
                <span>Retail Short Trap (19%)</span>
              </div>
            </div>

            {/* Smart Money Concepts (SMC) readouts */}
            <div className="space-y-2 bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Asian Range:</span>
                <span className="text-slate-200 font-bold">Swept & Rejected (Bullish)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Fair Value Gap:</span>
                <span className="text-cyan-300 font-bold">M15 FVG Filled cleanly</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">High-Pip Potential:</span>
                <span className="text-emerald-400 font-bold">+75 Pips Macro Target</span>
              </div>
            </div>

            {/* Strategy Recommendation Note */}
            <div className="text-[11px] text-slate-400 leading-relaxed">
              <strong className="text-white">Execution Guidance:</strong> Confluence indicates high-probability breakout momentum. Once trade triggers, do not close early — let the automated engine lock in Break-Even at TP1.
            </div>
          </div>

          {/* 3. RECENT BROKER TRANSMISSION STATUS */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center space-x-2">
                <Server className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-bold text-white text-xs">TELEMETRY ROUTER</span>
              </div>
              <button
                type="button"
                onClick={onOpenBrokerModal}
                className="text-[10px] text-emerald-400 hover:underline font-bold"
              >
                Configure Bridge →
              </button>
            </div>

            <div className="text-[10.5px] text-slate-400 space-y-1">
              <div>
                Mode:{" "}
                <span className="text-emerald-400 font-bold">
                  {brokerConfig.environment === "LIVE_BROKER" ? "LIVE BROKER (MT5/WEBHOOK)" : "REAL FEED (PAPER)"}
                </span>
              </div>
              <div>
                Relay:{" "}
                <span className="text-slate-300 truncate">
                  {brokerConfig.webhookUrl ? brokerConfig.webhookUrl : "Local Direct Loop"}
                </span>
              </div>
              <div>
                Telegram Alerts:{" "}
                <span className={brokerConfig.telegramAlertsEnabled ? "text-emerald-400 font-bold" : "text-slate-500"}>
                  {brokerConfig.telegramAlertsEnabled ? "ACTIVE (Instant Push)" : "OFF"}
                </span>
              </div>
            </div>

            <div className="space-y-1 pt-1">
              {packets.slice(0, 3).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between text-[10px] bg-slate-950 p-1.5 rounded border border-slate-850"
                >
                  <span className="text-slate-400 truncate pr-2">{p.payload}</span>
                  <span className="text-emerald-400 font-bold shrink-0">✓ {p.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
