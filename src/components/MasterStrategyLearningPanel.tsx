import React, { useState } from "react";
import {
  Brain,
  Sparkles,
  Award,
  Zap,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Flame,
  Target,
  BarChart3,
  Scale,
  Compass,
  Cpu,
  Layers,
  ChevronRight,
  Check,
  Lock,
} from "lucide-react";
import {
  BotSettings,
  MasterCouncilConsensus,
  MasterTraderId,
  MasterTraderProfile,
  PairMarketData,
  PairSymbol,
  TradeHistoryItem,
} from "../types";

interface MasterStrategyLearningPanelProps {
  selectedPair: PairSymbol;
  marketData: Record<PairSymbol, PairMarketData>;
  tradeHistory: TradeHistoryItem[];
  botSettings: BotSettings;
  setBotSettings: React.Dispatch<React.SetStateAction<BotSettings>>;
  masterConsensus: MasterCouncilConsensus;
  isLearning: boolean;
  onTriggerMasterLearn: () => void;
  onExecuteMasterTrade: (direction: "BUY" | "SELL") => void;
  onAdoptMasterTargets: () => void;
}

export const MasterStrategyLearningPanel: React.FC<MasterStrategyLearningPanelProps> = ({
  selectedPair,
  marketData,
  tradeHistory,
  botSettings,
  setBotSettings,
  masterConsensus,
  isLearning,
  onTriggerMasterLearn,
  onExecuteMasterTrade,
  onAdoptMasterTargets,
}) => {
  const [selectedMasterId, setSelectedMasterId] = useState<MasterTraderId>("ICT");
  const [viewMode, setViewMode] = useState<"COUNCIL" | "LEARNING_LOG" | "WEIGHT_TUNER">("COUNCIL");

  const currentPairData = marketData[selectedPair];
  const isMasterStrategyActive = botSettings.strategyMode === "MASTER_AI_COUNCIL_SYNTHESIS";

  const selectedMaster = masterConsensus.masters.find((m) => m.id === selectedMasterId) || masterConsensus.masters[0];

  // Colors per master
  const masterColorMap: Record<
    MasterTraderId,
    { border: string; bg: string; text: string; glow: string; badge: string }
  > = {
    ICT: {
      border: "border-cyan-500",
      bg: "bg-cyan-950/30",
      text: "text-cyan-400",
      glow: "shadow-cyan-500/20",
      badge: "bg-cyan-900/50 text-cyan-300 border-cyan-700/50",
    },
    SIMONS: {
      border: "border-purple-500",
      bg: "bg-purple-950/30",
      text: "text-purple-400",
      glow: "shadow-purple-500/20",
      badge: "bg-purple-900/50 text-purple-300 border-purple-700/50",
    },
    WYCKOFF: {
      border: "border-amber-500",
      bg: "bg-amber-950/30",
      text: "text-amber-400",
      glow: "shadow-amber-500/20",
      badge: "bg-amber-900/50 text-amber-300 border-amber-700/50",
    },
    DRUCKENMILLER: {
      border: "border-emerald-500",
      bg: "bg-emerald-950/30",
      text: "text-emerald-400",
      glow: "shadow-emerald-500/20",
      badge: "bg-emerald-900/50 text-emerald-300 border-emerald-700/50",
    },
    TUDOR_JONES: {
      border: "border-rose-500",
      bg: "bg-rose-950/30",
      text: "text-rose-400",
      glow: "shadow-rose-500/20",
      badge: "bg-rose-900/50 text-rose-300 border-rose-700/50",
    },
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Master Strategy Learning Engine */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/30 p-5 md:p-6 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                <Brain className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                <span>AI Master Learning Matrix</span>
              </span>
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                <Cpu className="w-3 h-3 text-cyan-400" />
                <span>Epoch #{masterConsensus.learningEpoch}</span>
              </span>
              {masterConsensus.isAiOptimized && (
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/60">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>Gemini 3.8 Intelligence Synced</span>
                </span>
              )}
            </div>

            <h2 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Autonomous Master Strategy Engine</span>
              <span className="text-sm font-normal font-mono px-2 py-0.5 bg-slate-800 text-cyan-400 rounded border border-slate-700">
                {selectedPair}
              </span>
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Synthesizing real-time price action with proprietary wisdom from 5 legendary masters:{" "}
              <strong className="text-cyan-300">Michael J. Huddleston (ICT)</strong>,{" "}
              <strong className="text-purple-300">Jim Simons (Quant)</strong>,{" "}
              <strong className="text-amber-300">Richard Wyckoff</strong>,{" "}
              <strong className="text-emerald-300">Stanley Druckenmiller</strong>, and{" "}
              <strong className="text-rose-300">Paul Tudor Jones</strong>.
            </p>
          </div>

          {/* Action Hub */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onTriggerMasterLearn}
              disabled={isLearning}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg ${
                isLearning
                  ? "bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-indigo-500/25 ring-1 ring-indigo-400/40"
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isLearning ? "animate-spin text-indigo-400" : ""}`} />
              <span>{isLearning ? "Synthesizing Lessons..." : "Learn & Optimize Now"}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setBotSettings((prev) => ({
                  ...prev,
                  strategyMode: "MASTER_AI_COUNCIL_SYNTHESIS",
                }));
                onAdoptMasterTargets();
              }}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                isMasterStrategyActive
                  ? "bg-emerald-950 text-emerald-300 border border-emerald-500 shadow-md shadow-emerald-500/20 ring-1 ring-emerald-500/40"
                  : "bg-slate-800/90 hover:bg-slate-750 text-slate-200 border border-slate-700"
              }`}
            >
              {isMasterStrategyActive ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Master Mode: ACTIVE</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Arm Master Mode</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Real-time Consensus Bar */}
        <div className="mt-5 pt-5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Council Bias</span>
            <div className="flex items-center space-x-1.5 mt-1">
              {masterConsensus.overallBias.includes("BUY") ? (
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-rose-400" />
              )}
              <span
                className={`text-sm font-black font-mono ${
                  masterConsensus.overallBias.includes("BUY") ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {masterConsensus.overallBias.replace("_", " ")}
              </span>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Confluence Rating</span>
            <div className="flex items-center space-x-1.5 mt-1">
              <span className="text-base font-black font-mono text-cyan-300">{masterConsensus.consensusScore}%</span>
              <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full"
                  style={{ width: `${masterConsensus.consensusScore}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Optimal SL Clamp</span>
            <div className="flex items-center space-x-1 mt-1">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-black font-mono text-amber-300">
                {masterConsensus.optimalSlPips} pips
              </span>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">TP Targets (BE Auto)</span>
            <span className="text-sm font-black font-mono text-emerald-400 block mt-1">
              +{masterConsensus.optimalTp1Pips}p / +{masterConsensus.optimalTp2Pips}p / +{masterConsensus.optimalTp3Pips}p
            </span>
          </div>

          <div className="col-span-2 sm:col-span-4 lg:col-span-1 bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Quick Action</span>
              <span className="text-xs font-bold text-slate-200">Execute Signal</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => onExecuteMasterTrade("BUY")}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold font-mono transition-colors cursor-pointer"
              >
                BUY
              </button>
              <button
                type="button"
                onClick={() => onExecuteMasterTrade("SELL")}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-bold font-mono transition-colors cursor-pointer"
              >
                SELL
              </button>
            </div>
          </div>
        </div>

        {/* Master AI Synthesis Quote */}
        {masterConsensus.aiSynthesis && (
          <div className="mt-4 p-3.5 rounded-xl bg-slate-950/80 border border-indigo-500/20 text-xs text-slate-300 flex items-start space-x-2.5">
            <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-indigo-300 font-mono uppercase tracking-wider mr-1.5">
                Executive Synthesis:
              </span>
              <span>{masterConsensus.aiSynthesis}</span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setViewMode("COUNCIL")}
          className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold font-mono transition-colors cursor-pointer ${
            viewMode === "COUNCIL"
              ? "bg-slate-800 text-cyan-300 border border-slate-700"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>The 5 Masters Council ({masterConsensus.masters.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode("LEARNING_LOG")}
          className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold font-mono transition-colors cursor-pointer ${
            viewMode === "LEARNING_LOG"
              ? "bg-slate-800 text-cyan-300 border border-slate-700"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Brain className="w-3.5 h-3.5" />
          <span>Master Learning Memory ({masterConsensus.learnedLessons.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode("WEIGHT_TUNER")}
          className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold font-mono transition-colors cursor-pointer ${
            viewMode === "WEIGHT_TUNER"
              ? "bg-slate-800 text-cyan-300 border border-slate-700"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Neural Confluence Weights</span>
        </button>
      </div>

      {/* Tab 1: The 5 Masters Council View */}
      {viewMode === "COUNCIL" && (
        <div className="space-y-6">
          {/* Master Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {masterConsensus.masters.map((master) => {
              const colors = masterColorMap[master.id] || masterColorMap.ICT;
              const isSelected = selectedMasterId === master.id;

              return (
                <div
                  key={master.id}
                  onClick={() => setSelectedMasterId(master.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? `${colors.bg} ${colors.border} ${colors.glow} ring-1 ring-cyan-500/40`
                      : "bg-slate-900/70 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${colors.badge}`}>
                      {master.id}
                    </span>
                    <span
                      className={`text-xs font-black font-mono ${
                        master.bias === "BULLISH" ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {master.bias}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-100 mt-2 line-clamp-1">{master.name}</h3>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{master.title}</p>

                  <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400 text-[10px]">Conviction</span>
                      <span className="font-bold text-slate-200">{master.conviction}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-400 rounded-full"
                        style={{ width: `${master.conviction}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono pt-1">
                      <span className="text-slate-400 text-[10px]">Neural Weight</span>
                      <span className="font-bold text-indigo-300">{(master.weight * 100).toFixed(0)}%</span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400 text-[10px]">Historical Win</span>
                      <span className="font-bold text-emerald-400">{master.recentWinRate}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Selected Master Spotlight */}
          {selectedMaster && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-700/60">
                      MASTER DEEP DIVE: {selectedMaster.id}
                    </span>
                    <h3 className="text-lg font-black text-white">{selectedMaster.name}</h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{selectedMaster.title}</p>
                </div>

                <div className="flex items-center space-x-3 text-xs font-mono">
                  <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 mr-2 text-[10px]">PHILOSOPHY:</span>
                    <span className="text-slate-200 font-bold">{selectedMaster.corePhilosophy}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Active Detected Setup */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 flex items-center space-x-1.5">
                    <Target className="w-3.5 h-3.5" />
                    <span>Real-Time Detected Signature</span>
                  </span>
                  <p className="text-sm font-medium text-slate-200 leading-relaxed">{selectedMaster.setup}</p>
                  <div className="pt-2 text-xs font-mono text-slate-400">
                    <span className="text-amber-400">Tactical Guidance:</span> {selectedMaster.guidance}
                  </div>
                </div>

                {/* Core Signature Concepts */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400 flex items-center space-x-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Master Rule-Set Built Into Bot</span>
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-300 font-mono">
                    {selectedMaster.signatureConcepts?.map((concept, idx) => (
                      <li key={idx} className="flex items-center space-x-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{concept}</span>
                      </li>
                    )) || (
                      <>
                        <li className="flex items-center space-x-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Strict algorithmic stop loss protection</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Liquidity sweep validation before market entry</span>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Master Learning Memory Log */}
      {viewMode === "LEARNING_LOG" && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Brain className="w-4 h-4 text-cyan-400" />
                <span>Autonomous Trade Experience & Learning Memory</span>
              </h3>
              <p className="text-xs text-slate-400">
                Every trade outcome reinforces the neural confluence weights and parameter calibrations.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-mono text-xs border border-slate-700">
              Total Recorded Lessons: {masterConsensus.learnedLessons.length}
            </span>
          </div>

          <div className="space-y-3">
            {masterConsensus.learnedLessons.map((lesson, idx) => (
              <div
                key={`${lesson.id || 'lesson'}-${lesson.epoch || idx}-${idx}`}
                className="bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-slate-750 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-700/60">
                      Epoch #{lesson.epoch}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-cyan-300">
                      {lesson.master}
                    </span>
                    <h4 className="text-sm font-bold text-slate-100">{lesson.title}</h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{lesson.insight}</p>
                </div>

                <div className="md:text-right shrink-0">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                    Learned Adjustment
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-800/50 inline-block mt-0.5">
                    {lesson.adjustment}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Neural Confluence Weights Tuner */}
      {viewMode === "WEIGHT_TUNER" && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Adaptive Neural Confluence Weight Distribution</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              The bot dynamically weights each Master based on rolling win rates, market volatility, and session characteristics.
            </p>
          </div>

          <div className="space-y-4">
            {masterConsensus.masters.map((master) => (
              <div key={master.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-slate-200">{master.name}</span>
                    <span className="text-xs font-mono text-slate-400 block">{master.title}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-mono font-black text-cyan-300">
                      {(master.weight * 100).toFixed(0)}%
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 block">
                      {master.recentWinRate}% Win Rate
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 rounded-full"
                    style={{ width: `${master.weight * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3 text-xs text-slate-300">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>
                Weights automatically adapt after every closed trade based on reinforcement learning principles.
              </span>
            </div>
            <button
              type="button"
              onClick={onAdoptMasterTargets}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold font-mono transition-colors cursor-pointer shrink-0"
            >
              Apply Weights to Active Bot
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
