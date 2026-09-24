import React from "react";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  TrendingUp,
  TrendingDown,
  Layers,
  Sparkles,
  Lock,
  Scissors,
} from "lucide-react";
import { PairSymbol, Position } from "../types";
import { formatPrice } from "../utils/forexCalculations";

interface PositionsTableProps {
  positions: Position[];
  onClosePosition: (id: string, reason?: string) => void;
  onPartialClose: (id: string, percent: number) => void;
  onMoveToBreakeven: (id: string) => void;
}

export const PositionsTable: React.FC<PositionsTableProps> = ({
  positions,
  onClosePosition,
  onPartialClose,
  onMoveToBreakeven,
}) => {
  const totalFloatingPips = positions.reduce((acc, p) => acc + p.pips, 0);
  const totalFloatingPnl = positions.reduce((acc, p) => acc + p.pnl, 0);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Header Bar */}
      <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
          <h3 className="font-extrabold text-sm text-white tracking-tight">
            ACTIVE OPEN POSITIONS ({positions.length})
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
            LIVE FLOATING
          </span>
        </div>

        <div className="flex items-center space-x-4 font-mono text-xs">
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400">Total Floating:</span>
            <span
              className={`font-black ${
                totalFloatingPips >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {totalFloatingPips >= 0 ? "+" : ""}
              {totalFloatingPips.toFixed(1)} Pips
            </span>
          </div>

          <div className="h-3 w-px bg-slate-800"></div>

          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400">Floating P&L:</span>
            <span
              className={`font-black text-sm ${
                totalFloatingPnl >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {totalFloatingPnl >= 0 ? "+" : ""}${totalFloatingPnl.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {positions.length === 0 ? (
        <div className="py-12 text-center text-slate-500 font-mono text-xs space-y-2">
          <div className="text-2xl">⚡</div>
          <p>No open positions in market.</p>
          <p className="text-[11px] text-slate-600">
            Algo Bot will automatically trigger orders when confluence criteria is met, or execute manually above.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-2.5">Ticket</th>
                <th className="px-4 py-2.5">Pair & Type</th>
                <th className="px-4 py-2.5">Volume</th>
                <th className="px-4 py-2.5">Open Price</th>
                <th className="px-4 py-2.5">Current Price</th>
                <th className="px-4 py-2.5">Stop Loss / No-Loss</th>
                <th className="px-4 py-2.5">Targets (TP1 / TP2 / TP3)</th>
                <th className="px-4 py-2.5">Floating Pips</th>
                <th className="px-4 py-2.5">Profit (USD)</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {positions.map((pos, idx) => {
                const isBuy = pos.type === "BUY";
                const inProfit = pos.pnl >= 0;

                return (
                  <tr
                    key={`${pos.id || 'pos'}-${pos.ticket || idx}-${idx}`}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Ticket */}
                    <td className="px-4 py-3 text-slate-400 font-bold">
                      #{pos.ticket}
                    </td>

                    {/* Pair & Type */}
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-extrabold text-white">
                          {pos.pair}
                        </span>
                        <span
                          className={`text-[9.5px] px-1.5 py-0.5 rounded font-black ${
                            isBuy
                              ? "bg-emerald-950 text-emerald-300 border border-emerald-700/60"
                              : "bg-rose-950 text-rose-300 border border-rose-700/60"
                          }`}
                        >
                          {pos.type}
                        </span>
                      </div>
                      <span className="text-[9.5px] text-slate-500 block">
                        {pos.strategyTag}
                      </span>
                    </td>

                    {/* Volume */}
                    <td className="px-4 py-3 text-slate-200">
                      <div>
                        <strong>{pos.lots}</strong> Lots
                      </div>
                      {pos.lots < pos.initialLots && (
                        <span className="text-[9.5px] text-cyan-400">
                          (Partially Banked)
                        </span>
                      )}
                    </td>

                    {/* Open Price */}
                    <td className="px-4 py-3 text-slate-300">
                      {formatPrice(pos.pair, pos.openPrice)}
                    </td>

                    {/* Current Price */}
                    <td className="px-4 py-3 font-bold text-white">
                      {formatPrice(pos.pair, pos.currentPrice)}
                    </td>

                    {/* SL / No Loss */}
                    <td className="px-4 py-3">
                      {pos.isBreakeven ? (
                        <div className="inline-flex items-center space-x-1 px-2 py-1 rounded bg-amber-950/70 border border-amber-500/60 text-amber-300 font-bold text-[10px]">
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>NO LOSS (BE @ {formatPrice(pos.pair, pos.sl)})</span>
                        </div>
                      ) : (
                        <div className="text-rose-400">
                          <span>SL: {formatPrice(pos.pair, pos.sl)}</span>
                          <button
                            onClick={() => onMoveToBreakeven(pos.id)}
                            className="block text-[9.5px] text-cyan-400 hover:underline cursor-pointer mt-0.5"
                          >
                            🛡️ Move to BE
                          </button>
                        </div>
                      )}
                    </td>

                    {/* TP Progress */}
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-1 text-[10px]">
                        {/* TP1 */}
                        <span
                          className={`px-1.5 py-0.5 rounded font-bold ${
                            pos.tp1Hit
                              ? "bg-emerald-500 text-slate-950"
                              : "bg-slate-800 text-slate-400"
                          }`}
                          title={`TP1: ${formatPrice(pos.pair, pos.tp1)}`}
                        >
                          TP1 {pos.tp1Hit ? "✓" : ""}
                        </span>

                        {/* TP2 */}
                        <span
                          className={`px-1.5 py-0.5 rounded font-bold ${
                            pos.tp2Hit
                              ? "bg-teal-500 text-slate-950"
                              : "bg-slate-800 text-slate-400"
                          }`}
                          title={`TP2: ${formatPrice(pos.pair, pos.tp2)}`}
                        >
                          TP2 {pos.tp2Hit ? "✓" : ""}
                        </span>

                        {/* TP3 */}
                        <span
                          className={`px-1.5 py-0.5 rounded font-bold ${
                            pos.tp3Hit
                              ? "bg-amber-400 text-slate-950"
                              : "bg-slate-800 text-slate-400"
                          }`}
                          title={`TP3: ${formatPrice(pos.pair, pos.tp3)}`}
                        >
                          TP3 {pos.tp3Hit ? "✓" : ""}
                        </span>
                      </div>
                    </td>

                    {/* Floating Pips */}
                    <td className="px-4 py-3 font-bold text-sm">
                      <span
                        className={
                          pos.pips >= 0 ? "text-emerald-400" : "text-rose-400"
                        }
                      >
                        {pos.pips >= 0 ? "+" : ""}
                        {Math.abs(pos.pips) < 0.1 ? pos.pips.toFixed(2) : pos.pips.toFixed(1)}
                      </span>
                    </td>

                    {/* Profit USD */}
                    <td className="px-4 py-3 font-black text-sm">
                      <span
                        className={
                          pos.pnl >= 0 ? "text-emerald-400" : "text-rose-400"
                        }
                      >
                        {pos.pnl >= 0 ? "+" : ""}${pos.pnl.toFixed(2)}
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => onPartialClose(pos.id, 50)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] font-bold transition-colors cursor-pointer flex items-center space-x-1"
                          title="Bank 50% partial profit now"
                        >
                          <Scissors className="w-3 h-3" />
                          <span>Close 50%</span>
                        </button>

                        <button
                          onClick={() => onClosePosition(pos.id, "MANUAL")}
                          className="px-2 py-1 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/60 rounded text-[10px] font-bold transition-colors cursor-pointer flex items-center space-x-1"
                          title="Close full position"
                        >
                          <X className="w-3 h-3" />
                          <span>Close</span>
                        </button>
                      </div>
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
