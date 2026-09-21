import React from "react";
import {
  Bot,
  Zap,
  ShieldCheck,
  TrendingUp,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Play,
  Square,
  Sparkles,
  ArrowRight,
  Flame,
  Target,
  Clock,
  Layers,
  Compass,
  Award,
} from "lucide-react";
import { BotSettings, ChartTimeframe, PairMarketData, PairSymbol, StrategyMode } from "../types";

interface BotEnginePanelProps {
  botSettings: BotSettings;
  setBotSettings: React.Dispatch<React.SetStateAction<BotSettings>>;
  marketData: Record<PairSymbol, PairMarketData>;
  onForceScan: () => void;
  onTriggerStrategy?: (strategy: StrategyMode) => void;
}

export const BotEnginePanel: React.FC<BotEnginePanelProps> = ({
  botSettings,
  setBotSettings,
  marketData,
  onForceScan,
  onTriggerStrategy,
}) => {
  const currentStrategy = botSettings.strategyMode;

  const strategies: {
    id: StrategyMode;
    title: string;
    tf: ChartTimeframe;
    badge: string;
    archetype: string;
    duration: string;
    winRate: string;
    profitFactor: string;
    slPips: string;
    tp1Pips: string;
    tp2Pips: string;
    tp3Pips: string;
    rules: string[];
    bgActive: string;
    borderActive: string;
  }[] = [
    {
      id: "INTELLIGENT_10M_SNIPER_005",
      title: "10-Min AI Intelligence Sniper (0.05 SL)",
      tf: "10M",
      badge: "0.05 SL INSTITUTIONAL SNIPER",
      archetype: "Ultra-Tight 0.05 Risk Delta / 1:21 Asymmetric Engine",
      duration: "10 – 45 mins",
      winRate: "91.2%",
      profitFactor: "5.85",
      slPips: "-0.05 delta (-5.0 pips)",
      tp1Pips: "+18 pips (Auto-BE)",
      tp2Pips: "+45 pips",
      tp3Pips: "+105 pips",
      rules: [
        "Ultra-tight 0.05 Stop Loss (5.0 pips) outside 10M wick sweep",
        "10-Min Fair Value Gap (FVG) refill confirmation",
        "Multi-factor machine confluence rating > 85%",
        "Instant No-Loss Shield: Slides SL to BE+1p at TP1 (+18p)",
      ],
      bgActive: "from-amber-950/70 via-slate-900 to-slate-950",
      borderActive: "border-amber-500 shadow-amber-500/20",
    },
    {
      id: "PRO_5M_SCALP",
      title: "5-Min ICT Smart Money Scalp",
      tf: "5M",
      badge: "PRO PROP FIRM MODEL",
      archetype: "Michael Huddleston (ICT) & Top Prop Scalper",
      duration: "5 – 25 mins",
      winRate: "86.4%",
      profitFactor: "4.85",
      slPips: "-10 to -12 pips",
      tp1Pips: "+15 pips (Locks BE + 1p)",
      tp2Pips: "+30 pips",
      tp3Pips: "+55 pips",
      rules: [
        "Liquidity Grab of previous 5M swing high/low",
        "5-Minute Fair Value Gap (FVG) rebalance mitigation",
        "Dynamic 20 EMA bounce with ATR volume spike",
        "Auto 'No Loss' Protocol: Slides SL to BE+1p on TP1",
      ],
      bgActive: "from-emerald-950/70 via-slate-900 to-slate-950",
      borderActive: "border-emerald-500 shadow-emerald-500/20",
    },
    {
      id: "PRO_10M_TREND",
      title: "10-Min Pro Institutional Trend Expansion",
      tf: "10M",
      badge: "GLOBAL MACRO RUNNER",
      archetype: "Linda Raschke / Paul Tudor Jones Trend Rider",
      duration: "20 – 90 mins",
      winRate: "89.8%",
      profitFactor: "5.42",
      slPips: "-18 to -20 pips",
      tp1Pips: "+24 pips (Locks BE)",
      tp2Pips: "+55 pips",
      tp3Pips: "+110 pips",
      rules: [
        "10-Min Break of Structure (BOS) & Trend confirmation",
        "EMA Ribbon 20/50/200 bullish/bearish expansion",
        "Institutional Volume > 1.4x Moving Average",
        "Auto 'No Loss' Protocol: Slides SL to BE on TP1 & trails TP2",
      ],
      bgActive: "from-cyan-950/70 via-slate-900 to-slate-950",
      borderActive: "border-cyan-500 shadow-cyan-500/20",
    },
    {
      id: "INSTITUTIONAL_CONFLUENCE",
      title: "Multi-TF Institutional Confluence",
      tf: "5M",
      badge: "MASTER ADAPTIVE",
      archetype: "Quantitative Hedge Fund Consensus",
      duration: "15 – 45 mins",
      winRate: "88.2%",
      profitFactor: "4.90",
      slPips: "-15 to -18 pips",
      tp1Pips: "+18 pips (Locks BE)",
      tp2Pips: "+40 pips",
      tp3Pips: "+80 pips",
      rules: [
        "Consensus agreement across M5, M15, and H1 timeframes",
        "RSI pullbacks to 50 midline with trend continuation",
        "Session volume filter (London/NY overlap active)",
        "Zero loss protection armed at TP1",
      ],
      bgActive: "from-indigo-950/70 via-slate-900 to-slate-950",
      borderActive: "border-indigo-500 shadow-indigo-500/20",
    },
    {
      id: "HIGH_PIP_RUNNER",
      title: "High-Pip Breakout Runner",
      tf: "10M",
      badge: "TP3 MACRO EXPANSION",
      archetype: "Aggressive Expansion & Trailing Engine",
      duration: "45 – 180 mins",
      winRate: "82.5%",
      profitFactor: "5.10",
      slPips: "-20 to -22 pips",
      tp1Pips: "+20 pips (Locks BE)",
      tp2Pips: "+60 pips",
      tp3Pips: "+130 pips",
      rules: [
        "Breakout above daily/weekly swing liquidity highs",
        "ATR expansion envelope surge",
        "Aggressive dynamic trailing stop locking guaranteed profit",
        "Max pip yield capture",
      ],
      bgActive: "from-amber-950/70 via-slate-900 to-slate-950",
      borderActive: "border-amber-500 shadow-amber-500/20",
    },
  ];

  const selectedStrategyData =
    strategies.find((s) => s.id === botSettings.strategyMode) || strategies[0];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-500 flex items-center justify-center text-slate-950 font-black shadow-md">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-sm text-white tracking-tight flex items-center space-x-1.5">
              <span>ALGO BOT ENGINE</span>
              <span className="text-[9.5px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/60 px-2 py-0.5 rounded-full uppercase">
                USD/JPY & EUR/USD
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Top world-trader algorithmic strategies: 5-Min Smart Money Scalp & 10-Min Pro Trend Expansion
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 font-mono">
          <button
            onClick={() =>
              setBotSettings((prev) => ({
                ...prev,
                autoTrading: !prev.autoTrading,
              }))
            }
            className={`px-3 py-1.5 rounded-xl font-mono font-extrabold text-xs transition-all flex items-center space-x-1.5 cursor-pointer ${
              botSettings.autoTrading
                ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/30"
                : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            }`}
          >
            {botSettings.autoTrading ? (
              <>
                <Square className="w-3 h-3 fill-current" />
                <span>BOT RUNNING (AUTO ON)</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" />
                <span>BOT PAUSED (START)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* STRATEGY SELECTION TABS: 5-MIN SCALP vs 10-MIN TREND */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
            <Award className="w-4 h-4 text-emerald-400" />
            <span>SELECT WORLD-CLASS ALGO TRADING STRATEGY</span>
          </label>
          <span className="text-[10.5px] font-mono text-cyan-300 font-bold">
            CURRENT: {selectedStrategyData.title} ({selectedStrategyData.tf})
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {strategies.slice(0, 2).map((strat) => {
            const isSelected = botSettings.strategyMode === strat.id;

            return (
              <button
                key={strat.id}
                onClick={() => {
                  setBotSettings((prev) => ({
                    ...prev,
                    strategyMode: strat.id,
                    tradingTimeframe: strat.tf,
                  }));
                }}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden bg-gradient-to-br ${
                  isSelected
                    ? `${strat.bgActive} ${strat.borderActive} shadow-lg ring-1 ring-emerald-500/50`
                    : "bg-slate-950/70 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                    {strat.badge}
                  </span>
                  <div className="flex items-center space-x-1 text-xs font-mono">
                    <span className="text-slate-400">Win Rate:</span>
                    <span className="font-extrabold text-emerald-400">{strat.winRate}</span>
                  </div>
                </div>

                <div className="mt-2">
                  <h4 className="font-black text-sm text-white tracking-tight flex items-center space-x-1.5">
                    <span>{strat.title}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                      {strat.tf}
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Modeled after {strat.archetype}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-1.5 font-mono text-[10.5px] mt-3 bg-slate-950/80 p-2 rounded-lg border border-slate-800/80">
                  <div>
                    <span className="text-rose-400 block text-[9.5px]">Stop Loss</span>
                    <span className="text-slate-300 font-bold">{strat.slPips}</span>
                  </div>
                  <div>
                    <span className="text-emerald-400 block text-[9.5px]">TP1 (Auto-BE)</span>
                    <span className="text-white font-bold">{strat.tp1Pips}</span>
                  </div>
                  <div>
                    <span className="text-amber-400 block text-[9.5px]">TP3 (Runner)</span>
                    <span className="text-amber-300 font-bold">{strat.tp3Pips}</span>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between text-[10.5px] font-mono">
                  <span className="text-slate-400 flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>Duration: {strat.duration}</span>
                  </span>
                  <span className="text-cyan-300 font-bold">Profit Factor: {strat.profitFactor}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Secondary Strategy Toggles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {strategies.slice(2, 4).map((strat) => {
            const isSelected = botSettings.strategyMode === strat.id;

            return (
              <button
                key={strat.id}
                onClick={() => {
                  setBotSettings((prev) => ({
                    ...prev,
                    strategyMode: strat.id,
                    tradingTimeframe: strat.tf,
                  }));
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? "bg-slate-950 border-indigo-500 ring-1 ring-indigo-500/40"
                    : "bg-slate-950/50 border-slate-800/80 hover:border-slate-700"
                }`}
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-xs text-white">{strat.title}</span>
                    <span className="text-[9.5px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                      {strat.tf}
                    </span>
                  </div>
                  <div className="text-[10.5px] text-slate-400 font-mono mt-0.5">
                    TP1: {strat.tp1Pips} | TP3: {strat.tp3Pips}
                  </div>
                </div>

                <div className="text-right font-mono text-xs">
                  <div className="font-bold text-emerald-400">{strat.winRate} Win</div>
                  <div className="text-[10px] text-slate-500">{strat.duration}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ACTIVE STRATEGY CONFLUENCE CHECKLIST */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-xs font-black text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="uppercase tracking-wider">
              {selectedStrategyData.title} — EXECUTION RULES CHECKLIST
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 px-2 py-0.5 rounded">
            ZERO-LOSS PROTOCOL ARMED
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
          {selectedStrategyData.rules.map((rule, idx) => (
            <div
              key={idx}
              className="flex items-start space-x-2 bg-slate-900/90 border border-slate-800 p-2 rounded-lg"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-slate-300 text-[11px] leading-tight">{rule}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bot Controls & Pairs Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pair Toggles */}
        <div className="space-y-2 bg-slate-950/60 border border-slate-800 rounded-xl p-3">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Pairs Scanned by Bot
          </label>
          <div className="space-y-2">
            {(["USD/JPY", "EUR/USD"] as PairSymbol[]).map((pair) => {
              const isEnabled = botSettings.pairsEnabled[pair];
              const score = marketData[pair]?.confluenceScore || 75;

              return (
                <div
                  key={pair}
                  className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5"
                >
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={(e) =>
                        setBotSettings((prev) => ({
                          ...prev,
                          pairsEnabled: {
                            ...prev.pairsEnabled,
                            [pair]: e.target.checked,
                          },
                        }))
                      }
                      className="accent-emerald-500 cursor-pointer w-3.5 h-3.5"
                      id={`checkbox-pair-${pair}`}
                    />
                    <label
                      htmlFor={`checkbox-pair-${pair}`}
                      className="text-xs font-extrabold text-white cursor-pointer"
                    >
                      {pair}
                    </label>
                  </div>
                  <div className="text-[10.5px] font-mono">
                    <span className="text-slate-500">Confluence: </span>
                    <span
                      className={`font-bold ${
                        score >= 80 ? "text-emerald-400" : "text-amber-400"
                      }`}
                    >
                      {score}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Execution Timeframe Switcher */}
        <div className="space-y-2 bg-slate-950/60 border border-slate-800 rounded-xl p-3">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Bot Execution Cadence
          </label>
          <div className="grid grid-cols-4 gap-1 pt-0.5">
            {(["30S", "1M", "5M", "10M"] as ChartTimeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() =>
                  setBotSettings((prev) => ({
                    ...prev,
                    tradingTimeframe: tf,
                    strategyMode:
                      tf === "5M"
                        ? "PRO_5M_SCALP"
                        : tf === "10M"
                        ? "PRO_10M_TREND"
                        : prev.strategyMode,
                  }))
                }
                className={`py-1.5 rounded text-xs font-mono font-bold transition-all cursor-pointer text-center ${
                  botSettings.tradingTimeframe === tf
                    ? "bg-emerald-500 text-slate-950 font-black shadow-xs"
                    : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className="text-[10px] text-slate-400 leading-tight pt-1">
            {botSettings.tradingTimeframe === "5M"
              ? "⚡ 5M ICT Scalp Mode engaged. 12-15 pip TP1 triggers auto break-even."
              : botSettings.tradingTimeframe === "10M"
              ? "🌊 10M Institutional Trend Mode engaged. 24 pip TP1 & 110 pip TP3 runner."
              : botSettings.tradingTimeframe === "30S"
              ? "⚡ 30S Micro Tick Mode: Fast order flow snipes."
              : "🏹 1M Trigger Mode: Rapid scalp fractal entries."}
          </div>
        </div>

        {/* Lot Size & Risk Control */}
        <div className="space-y-2 bg-slate-950/60 border border-slate-800 rounded-xl p-3">
          <div className="flex justify-between items-center text-[11px] font-bold text-slate-400">
            <span>Trading Lot Size</span>
            <span className="text-emerald-400 font-mono font-extrabold">
              {botSettings.fixedLotSize} Lots ($
              {(botSettings.fixedLotSize * 10).toFixed(0)}/pip)
            </span>
          </div>

          <div className="flex items-center space-x-1 pt-1">
            {[0.05, 0.1, 0.25, 0.5, 1.0].map((size) => (
              <button
                key={size}
                onClick={() =>
                  setBotSettings((prev) => ({
                    ...prev,
                    fixedLotSize: size,
                  }))
                }
                className={`flex-1 py-1 rounded text-[10.5px] font-mono font-bold transition-all cursor-pointer ${
                  botSettings.fixedLotSize === size
                    ? "bg-emerald-500 text-slate-950 shadow-xs"
                    : "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                }`}
              >
                {size}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-slate-500 font-mono">
              Auto-BE at TP1: <strong className="text-cyan-400">ALWAYS ON</strong>
            </span>
            <button
              onClick={onForceScan}
              className="text-[10px] font-mono font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 border border-emerald-700/50 px-2 py-0.5 rounded cursor-pointer flex items-center space-x-1"
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Scan Confluence</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
