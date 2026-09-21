import React, { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Zap,
  Target,
  Info,
  DollarSign,
  Lock,
} from "lucide-react";
import { PairMarketData, PairSymbol } from "../types";
import {
  calculateStrategyTargets,
  formatPrice,
  PIP_FACTORS,
} from "../utils/forexCalculations";

interface OrderTicketProps {
  pair: PairSymbol;
  marketData: PairMarketData;
  onExecuteOrder: (
    pair: PairSymbol,
    type: "BUY" | "SELL",
    lots: number,
    strategyTag: string,
    customSlPips?: number
  ) => void;
  defaultLots: number;
}

export const OrderTicket: React.FC<OrderTicketProps> = ({
  pair,
  marketData,
  onExecuteOrder,
  defaultLots,
}) => {
  const [selectedLots, setSelectedLots] = useState(defaultLots);
  const [selectedType, setSelectedType] = useState<"BUY" | "SELL">("BUY");
  const [slMode, setSlMode] = useState<"0.05_PIP" | "0.05_SNIPER" | "10_PIPS" | "DYNAMIC_ATR">("0.05_PIP");

  const customSlPips =
    slMode === "0.05_PIP"
      ? 0.05
      : slMode === "0.05_SNIPER"
      ? 5.0
      : slMode === "10_PIPS"
      ? 10.0
      : undefined;

  const targets = calculateStrategyTargets(
    pair,
    selectedType === "BUY" ? marketData.currentAsk : marketData.currentBid,
    selectedType,
    marketData.atrPips,
    undefined,
    customSlPips
  );

  const pipValue = selectedLots * (pair === "USD/JPY" ? 6.5 : 10);
  const estRisk = (targets.slPips * pipValue).toFixed(targets.slPips < 1 ? 2 : 0);
  const estTp1 = (targets.tp1Pips * pipValue).toFixed(0);
  const estTp2 = (targets.tp2Pips * pipValue).toFixed(0);
  const estTp3 = (targets.tp3Pips * pipValue).toFixed(0);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <h3 className="font-extrabold text-sm text-white tracking-tight">
            1-CLICK EXECUTION TICKET
          </h3>
        </div>
        <span className="text-[10.5px] font-mono font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
          {pair} SPREAD: {marketData.spreadPips} PIPS
        </span>
      </div>

      {/* Buy / Sell Selection Tabs */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setSelectedType("BUY")}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            selectedType === "BUY"
              ? "bg-emerald-950/80 border-emerald-500 ring-2 ring-emerald-500/30 text-white"
              : "bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-emerald-400 flex items-center space-x-1">
              <TrendingUp className="w-4 h-4" />
              <span>BUY / LONG</span>
            </span>
            <span className="text-[10px] font-mono bg-emerald-900/60 text-emerald-300 px-1.5 py-0.5 rounded">
              ASK
            </span>
          </div>
          <div className="text-xl font-black font-mono mt-1 text-white tracking-tight">
            {formatPrice(pair, marketData.currentAsk)}
          </div>
        </button>

        <button
          onClick={() => setSelectedType("SELL")}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            selectedType === "SELL"
              ? "bg-rose-950/80 border-rose-500 ring-2 ring-rose-500/30 text-white"
              : "bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-rose-400 flex items-center space-x-1">
              <TrendingDown className="w-4 h-4" />
              <span>SELL / SHORT</span>
            </span>
            <span className="text-[10px] font-mono bg-rose-900/60 text-rose-300 px-1.5 py-0.5 rounded">
              BID
            </span>
          </div>
          <div className="text-xl font-black font-mono mt-1 text-white tracking-tight">
            {formatPrice(pair, marketData.currentBid)}
          </div>
        </button>
      </div>

      {/* Lot Size Selector */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-slate-400 font-bold">Execution Volume (Lots)</span>
          <span className="font-mono font-bold text-cyan-400">
            {selectedLots} Lot{selectedLots > 1 ? "s" : ""} (~${pipValue.toFixed(1)}/pip)
          </span>
        </div>
        <div className="grid grid-cols-5 gap-1.5 font-mono text-xs">
          {[0.05, 0.1, 0.25, 0.5, 1.0].map((lot) => (
            <button
              key={lot}
              onClick={() => setSelectedLots(lot)}
              className={`py-1.5 rounded-lg border font-bold transition-all cursor-pointer ${
                selectedLots === lot
                  ? "bg-slate-800 border-cyan-500 text-cyan-300 shadow-xs"
                  : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {lot}
            </button>
          ))}
        </div>
      </div>

      {/* Stop Loss Preset Selector */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-slate-400 font-bold">Stop Loss Parameter:</span>
          <span className="font-mono font-bold text-amber-300">
            {slMode === "0.05_PIP"
              ? "0.05 Pip (Micro-Sniper)"
              : slMode === "0.05_SNIPER"
              ? "0.05 Sniper (5.0 Pips)"
              : slMode === "10_PIPS"
              ? "10.0 Pips"
              : `ATR (${marketData.atrPips} Pips)`}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1.5 font-mono text-[10.5px]">
          <button
            onClick={() => setSlMode("0.05_PIP")}
            className={`py-1.5 px-1.5 rounded-lg border font-bold transition-all cursor-pointer flex flex-col items-center ${
              slMode === "0.05_PIP"
                ? "bg-amber-950/80 border-amber-400 text-amber-300 ring-1 ring-amber-400/40 shadow-xs"
                : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <span>0.05 PIP</span>
            <span className="text-[8.5px] opacity-80">Micro SL</span>
          </button>
          <button
            onClick={() => setSlMode("0.05_SNIPER")}
            className={`py-1.5 px-1.5 rounded-lg border font-bold transition-all cursor-pointer flex flex-col items-center ${
              slMode === "0.05_SNIPER"
                ? "bg-cyan-950/70 border-cyan-400 text-cyan-300 ring-1 ring-cyan-400/30"
                : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <span>5.0 PIPS</span>
            <span className="text-[8.5px] opacity-80">0.05 Delta</span>
          </button>
          <button
            onClick={() => setSlMode("10_PIPS")}
            className={`py-1.5 px-1.5 rounded-lg border font-bold transition-all cursor-pointer flex flex-col items-center ${
              slMode === "10_PIPS"
                ? "bg-purple-950/70 border-purple-400 text-purple-300 ring-1 ring-purple-400/30"
                : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <span>10.0 PIPS</span>
            <span className="text-[8.5px] opacity-80">Tight Scalp</span>
          </button>
          <button
            onClick={() => setSlMode("DYNAMIC_ATR")}
            className={`py-1.5 px-1.5 rounded-lg border font-bold transition-all cursor-pointer flex flex-col items-center ${
              slMode === "DYNAMIC_ATR"
                ? "bg-slate-800 border-indigo-400 text-indigo-300 ring-1 ring-indigo-400/30"
                : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <span>ATR</span>
            <span className="text-[8.5px] opacity-80">{marketData.atrPips}p</span>
          </button>
        </div>
      </div>

      {/* Targets Matrix (SL, TP1, TP2, TP3) */}
      <div className="space-y-2 bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 font-mono text-[11px]">
        <div className="flex items-center justify-between text-slate-400 pb-1 border-b border-slate-800">
          <span className="font-bold uppercase tracking-wider">Level Target</span>
          <span className="font-bold uppercase tracking-wider">Price / Pips</span>
          <span className="font-bold uppercase tracking-wider">Est. P&L</span>
        </div>

        {/* SL */}
        <div className="flex items-center justify-between text-rose-400">
          <span className="font-bold flex items-center space-x-1">
            <span>🛑 Stop Loss</span>
          </span>
          <span>
            {formatPrice(pair, targets.sl)} (-{targets.slPips < 0.1 ? targets.slPips.toFixed(2) : targets.slPips.toFixed(1)} pips)
          </span>
          <span className="font-bold">-${estRisk}</span>
        </div>

        {/* TP1 with NO-LOSS TRIGGER NOTE */}
        <div className="flex items-center justify-between text-emerald-400 bg-emerald-950/40 p-1.5 rounded border border-emerald-800/30">
          <div>
            <div className="font-bold flex items-center space-x-1">
              <span>🎯 TP1 (Locks BE)</span>
            </div>
            <div className="text-[9.5px] text-cyan-300 font-sans">
              Moves SL to Entry (No Loss!)
            </div>
          </div>
          <span>
            {formatPrice(pair, targets.tp1)} (+{targets.tp1Pips} pips)
          </span>
          <span className="font-bold text-emerald-300">+${estTp1}</span>
        </div>

        {/* TP2 */}
        <div className="flex items-center justify-between text-teal-300">
          <span className="font-bold">🚀 TP2 (Trend)</span>
          <span>
            {formatPrice(pair, targets.tp2)} (+{targets.tp2Pips} pips)
          </span>
          <span className="font-bold">+${estTp2}</span>
        </div>

        {/* TP3 */}
        <div className="flex items-center justify-between text-amber-300">
          <span className="font-bold">💎 TP3 (Runner)</span>
          <span>
            {formatPrice(pair, targets.tp3)} (+{targets.tp3Pips} pips)
          </span>
          <span className="font-bold">+${estTp3}</span>
        </div>
      </div>

      {/* Main Execution Button */}
      <button
        onClick={() =>
          onExecuteOrder(
            pair,
            selectedType,
            selectedLots,
            slMode === "0.05_PIP"
              ? "0.05_PIP_SNIPER_MANUAL"
              : slMode === "0.05_SNIPER"
              ? "0.05_DELTA_MANUAL"
              : "MANUAL_CONFLUENCE",
            customSlPips
          )
        }
        className={`w-full py-3.5 rounded-xl font-black text-sm tracking-wide transition-all shadow-lg cursor-pointer flex items-center justify-center space-x-2 ${
          selectedType === "BUY"
            ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/25"
            : "bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white shadow-rose-500/25"
        }`}
      >
        <ShieldCheck className="w-4 h-4" />
        <span>
          EXECUTE {selectedType} {selectedLots} LOTS {pair} {slMode === "0.05_PIP" ? "(0.05 PIP SL)" : slMode === "0.05_SNIPER" ? "(5.0P SL)" : ""}
        </span>
      </button>

      <div className="text-[10px] text-slate-500 text-center font-mono">
        🛡️ Automatic Break-Even protocol engages instantaneously upon TP1 fulfillment.
      </div>
    </div>
  );
};
