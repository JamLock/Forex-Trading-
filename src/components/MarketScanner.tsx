import React from "react";
import {
  Radar,
  Sparkles,
  Zap,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
} from "lucide-react";
import { AlgoSignal, PairMarketData, PairSymbol } from "../types";
import { formatPrice } from "../utils/forexCalculations";

interface MarketScannerProps {
  signals: AlgoSignal[];
  marketData: Record<PairSymbol, PairMarketData>;
  onExecuteSignal: (signal: AlgoSignal) => void;
}

export const MarketScanner: React.FC<MarketScannerProps> = ({
  signals,
  marketData,
  onExecuteSignal,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <Radar className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: "6s" }} />
          <h3 className="font-extrabold text-sm text-white tracking-tight">
            QUANTITATIVE SIGNAL RADAR (USD/JPY & EUR/USD)
          </h3>
        </div>
        <span className="text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/50 px-2 py-0.5 rounded">
          LIVE ALGO RADAR
        </span>
      </div>

      {/* Signal Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {signals.map((sig) => {
          const isBuy = sig.type === "BUY";

          return (
            <div
              key={sig.id}
              className={`p-4 rounded-xl border transition-all space-y-3 ${
                isBuy
                  ? "bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/40 border-emerald-700/60"
                  : "bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950/40 border-rose-700/60"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-black text-sm text-white">{sig.pair}</span>
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded font-mono ${
                      isBuy
                        ? "bg-emerald-500 text-slate-950"
                        : "bg-rose-500 text-white"
                    }`}
                  >
                    {sig.type} SIGNAL
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 text-xs font-mono">
                  <span className="text-slate-400">Score:</span>
                  <span className="font-bold text-cyan-300 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800/40">
                    {sig.confluence}%
                  </span>
                </div>
              </div>

              {/* Price Targets Grid */}
              <div className="grid grid-cols-4 gap-1.5 font-mono text-[10px] bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                <div>
                  <span className="text-slate-500 block">Entry:</span>
                  <span className="text-white font-bold">
                    {formatPrice(sig.pair, sig.entryPrice)}
                  </span>
                </div>
                <div>
                  <span className="text-rose-400 block">SL:</span>
                  <span className="text-rose-300 font-bold">
                    {formatPrice(sig.pair, sig.sl)}
                  </span>
                </div>
                <div>
                  <span className="text-emerald-400 block">TP1 (BE):</span>
                  <span className="text-emerald-300 font-bold">
                    {formatPrice(sig.pair, sig.tp1)}
                  </span>
                </div>
                <div>
                  <span className="text-amber-400 block">TP3 (Run):</span>
                  <span className="text-amber-300 font-bold">
                    {formatPrice(sig.pair, sig.tp3)}
                  </span>
                </div>
              </div>

              {/* Confluence Criteria list */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Confluence Factors:
                </span>
                <div className="flex flex-wrap gap-1">
                  {sig.reasons.map((r, i) => (
                    <span
                      key={i}
                      className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono"
                    >
                      ✓ {r}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-400 font-mono flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{sig.time}</span>
                </span>

                <button
                  onClick={() => onExecuteSignal(sig)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold font-mono transition-all cursor-pointer flex items-center space-x-1 ${
                    isBuy
                      ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950"
                      : "bg-rose-500 hover:bg-rose-400 text-white"
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Execute Signal Now</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
