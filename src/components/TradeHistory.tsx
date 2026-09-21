import React from "react";
import {
  Award,
  TrendingUp,
  CheckCircle2,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Download,
} from "lucide-react";
import { AccountStats, TradeHistoryItem } from "../types";
import { formatPrice } from "../utils/forexCalculations";

interface TradeHistoryProps {
  history: TradeHistoryItem[];
  account: AccountStats;
  onClearHistory: () => void;
}

export const TradeHistory: React.FC<TradeHistoryProps> = ({
  history,
  account,
  onClearHistory,
}) => {
  const winRate =
    account.totalTrades > 0
      ? ((account.winCount / account.totalTrades) * 100).toFixed(1)
      : "100.0";

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4 p-5">
      {/* Performance Summary Metrics Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="font-extrabold text-sm text-white tracking-tight flex items-center space-x-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span>ALGO BOT TRADE PERFORMANCE & JOURNAL</span>
          </h3>
          <p className="text-[11px] text-slate-400">
            Verified execution metrics powered by automated TP1-BreakEven Capital Preservation
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {history.length > 0 && (
            <button
              onClick={onClearHistory}
              className="text-[11px] font-mono text-slate-400 hover:text-white bg-slate-800 px-2.5 py-1 rounded transition-colors cursor-pointer"
            >
              Reset Journal
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-xs">
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-0.5">
          <span className="text-[10px] text-slate-400 font-bold uppercase">
            Net Pip Capture
          </span>
          <div className="text-lg font-black text-emerald-400">
            +{account.totalPips.toFixed(1)} Pips
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-0.5">
          <span className="text-[10px] text-slate-400 font-bold uppercase">
            Win Rate
          </span>
          <div className="text-lg font-black text-cyan-300">{winRate}%</div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-0.5">
          <span className="text-[10px] text-slate-400 font-bold uppercase">
            Trades Executed
          </span>
          <div className="text-lg font-black text-white">
            {account.totalTrades}
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-0.5">
          <span className="text-[10px] text-slate-400 font-bold uppercase">
            No-Loss BE Closes
          </span>
          <div className="text-lg font-black text-amber-400">
            {account.beCount} Safe
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-0.5">
          <span className="text-[10px] text-slate-400 font-bold uppercase">
            Profit Factor
          </span>
          <div className="text-lg font-black text-emerald-400">
            {account.profitFactor.toFixed(2)}x
          </div>
        </div>
      </div>

      {/* History Ledger Table */}
      {history.length === 0 ? (
        <div className="py-8 text-center text-slate-500 font-mono text-xs">
          No trade history yet. As the Algo Bot takes TP1, TP2, TP3 or locks Break-Even, closed records appear here.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-3 py-2">Ticket</th>
                <th className="px-3 py-2">Pair & Type</th>
                <th className="px-3 py-2">Volume</th>
                <th className="px-3 py-2">Open Price</th>
                <th className="px-3 py-2">Close Price</th>
                <th className="px-3 py-2">Exit Milestone</th>
                <th className="px-3 py-2">Pips</th>
                <th className="px-3 py-2 text-right">Net Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {history.map((item) => {
                const isProfit = item.profit > 0;
                const isBe = item.exitReason === "BREAKEVEN";

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-3 py-2.5 text-slate-400">
                      #{item.ticket}
                    </td>

                    <td className="px-3 py-2.5 font-bold text-white">
                      <span className="mr-1.5">{item.pair}</span>
                      <span
                        className={`text-[9.5px] px-1 py-0.5 rounded ${
                          item.type === "BUY"
                            ? "bg-emerald-950 text-emerald-300"
                            : "bg-rose-950 text-rose-300"
                        }`}
                      >
                        {item.type}
                      </span>
                    </td>

                    <td className="px-3 py-2.5 text-slate-300">{item.lots}</td>

                    <td className="px-3 py-2.5 text-slate-400">
                      {formatPrice(item.pair, item.openPrice)}
                    </td>

                    <td className="px-3 py-2.5 text-slate-200">
                      {formatPrice(item.pair, item.closePrice)}
                    </td>

                    <td className="px-3 py-2.5">
                      {item.exitReason === "TP1_PARTIAL" && (
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/50 text-[10px]">
                          🎯 TP1 Scalp (40% Closed + BE Moved)
                        </span>
                      )}
                      {item.exitReason === "TP2_PARTIAL" && (
                        <span className="px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-700/50 text-[10px]">
                          🚀 TP2 Swing (30% Closed + Trailed)
                        </span>
                      )}
                      {item.exitReason === "TP3_FULL" && (
                        <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-600/50 text-[10px] font-bold">
                          💎 TP3 Max Runner Hit
                        </span>
                      )}
                      {item.exitReason === "BREAKEVEN" && (
                        <span className="px-2 py-0.5 rounded bg-yellow-950 text-yellow-300 border border-yellow-600/50 text-[10px] font-bold flex items-center space-x-1 w-max">
                          <ShieldCheck className="w-3 h-3 text-yellow-400" />
                          <span>NO LOSS (Break-Even Triggered)</span>
                        </span>
                      )}
                      {item.exitReason === "STOP_LOSS" && (
                        <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-700/50 text-[10px]">
                          🛑 Stop Loss (Before TP1)
                        </span>
                      )}
                      {item.exitReason === "MANUAL" && (
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                          Manual Close
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-2.5 font-bold">
                      <span
                        className={
                          item.pips >= 0 ? "text-emerald-400" : "text-rose-400"
                        }
                      >
                        {item.pips >= 0 ? "+" : ""}
                        {Math.abs(item.pips) < 0.1 ? item.pips.toFixed(2) : item.pips.toFixed(1)}
                      </span>
                    </td>

                    <td className="px-3 py-2.5 text-right font-black">
                      <span
                        className={
                          isProfit
                            ? "text-emerald-400"
                            : isBe
                            ? "text-yellow-400"
                            : "text-rose-400"
                        }
                      >
                        {isProfit ? "+" : ""}${item.profit.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
