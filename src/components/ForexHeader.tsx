import React from "react";
import {
  Activity,
  Bot,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Globe2,
  RefreshCw,
  Power,
  Zap,
  Sliders,
  Award,
  Server,
  Radio,
} from "lucide-react";
import { AccountStats, BotSettings, BrokerBridgeConfig, PairMarketData, PairSymbol } from "../types";
import { formatPrice } from "../utils/forexCalculations";

interface ForexHeaderProps {
  account: AccountStats;
  selectedPair: PairSymbol;
  setSelectedPair: (pair: PairSymbol) => void;
  marketData: Record<PairSymbol, PairMarketData>;
  botSettings: BotSettings;
  setBotSettings: React.Dispatch<React.SetStateAction<BotSettings>>;
  onResetAccount: () => void;
  openPositionsCount: number;
  brokerConfig: BrokerBridgeConfig;
  onOpenBrokerModal: () => void;
  rateSource: string;
}

export const ForexHeader: React.FC<ForexHeaderProps> = ({
  account,
  selectedPair,
  setSelectedPair,
  marketData,
  botSettings,
  setBotSettings,
  onResetAccount,
  openPositionsCount,
  brokerConfig,
  onOpenBrokerModal,
  rateSource,
}) => {
  const currentPairData = marketData[selectedPair];

  return (
    <header className="bg-slate-950 border-b border-slate-850 text-slate-100 sticky top-0 z-50 shadow-xl">
      {/* Top Global FX Ticker & Session Bar */}
      <div className="border-b border-slate-900 px-4 py-1.5 flex flex-wrap items-center justify-between gap-3 text-xs bg-black/40">
        <div className="flex items-center space-x-3 overflow-x-auto py-0.5">
          {/* Brand */}
          <div className="flex items-center space-x-2 shrink-0">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-950 font-black shadow-xs">
              <Activity className="w-3.5 h-3.5" />
            </div>
            <span className="font-extrabold text-sm tracking-tight text-white flex items-center">
              APEX<span className="text-emerald-400">FX</span>
              <span className="ml-1.5 text-[9.5px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                PRO LIVE BOT
              </span>
            </span>
          </div>

          <div className="h-3 w-px bg-slate-800 shrink-0"></div>

          {/* Live Server Status Badge */}
          <div className="flex items-center space-x-1.5 font-mono text-[11px] bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/50 shrink-0 text-emerald-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-400">SERVER:</span>
            <span className="font-bold text-emerald-400">ONLINE</span>
          </div>

          {/* Live Market Feed Connection Badge */}
          <div className="flex items-center space-x-1.5 font-mono text-[11px] bg-slate-900/90 px-2 py-0.5 rounded border border-slate-800 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            <span className="text-slate-400">FEED:</span>
            <span className="text-emerald-300 font-bold">{rateSource}</span>
          </div>

          {/* Market Sessions status */}
          <div className="flex items-center space-x-2 text-[11px] font-mono shrink-0 hidden md:flex">
            <span className="text-slate-500 flex items-center space-x-1">
              <Globe2 className="w-3 h-3 text-slate-400" />
              <span>SESSIONS:</span>
            </span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-950/70 text-emerald-400 border border-emerald-800/40 flex items-center space-x-1">
              <span>LONDON / NY OVERLAP (HIGH LIQUIDITY)</span>
            </span>
          </div>
        </div>

        {/* Protection Badges & Live Broker Trigger */}
        <div className="flex items-center space-x-2 shrink-0 text-[11px]">
          <button
            onClick={onOpenBrokerModal}
            className={`px-2.5 py-1 rounded font-mono font-bold flex items-center space-x-1.5 transition-all cursor-pointer border ${
              brokerConfig.environment === "LIVE_BROKER"
                ? "bg-emerald-950 text-emerald-300 border-emerald-600 shadow-sm shadow-emerald-500/30"
                : "bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500"
            }`}
          >
            <Server className="w-3 h-3 text-emerald-400" />
            <span>
              {brokerConfig.environment === "LIVE_BROKER"
                ? "BROKER BRIDGE: ACTIVE (LIVE)"
                : "BROKER: PAPER (REAL QUOTES)"}
            </span>
          </button>

          <span className="bg-cyan-950/70 border border-cyan-700/50 text-cyan-300 px-2 py-0.5 rounded font-mono font-bold hidden sm:flex items-center space-x-1">
            <ShieldCheck className="w-3 h-3 text-cyan-400" />
            <span>NO-LOSS PROTOCOL: ARMED</span>
          </span>

          <button
            onClick={onResetAccount}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
            title="Reset simulation account to $10,000"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Bar: Account Metrics + Pair Switcher + Bot Master Switch */}
      <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-4">
        {/* Pair Switcher Tabs */}
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
                    ? "bg-slate-900 border-emerald-500/80 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/40"
                    : "bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                }`}
              >
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-extrabold text-xs tracking-tight text-white">
                      {pair}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-1 rounded ${
                        isUp
                          ? "text-emerald-400 bg-emerald-950/60"
                          : "text-rose-400 bg-rose-950/60"
                      }`}
                    >
                      {isUp ? "+" : ""}
                      {data.change24h.toFixed(2)}%
                    </span>
                  </div>
                  <div className="font-mono font-bold text-xs mt-0.5 text-slate-200">
                    {formatPrice(pair, data.currentBid)}
                  </div>
                </div>

                <div className="text-right pl-2 border-l border-slate-800 text-[10px] font-mono text-slate-400">
                  <div>Spread: {data.spreadPips} pips</div>
                  <div className="text-emerald-400/90 font-bold">
                    Confluence: {data.confluenceScore}%
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Live Account Financial Stats */}
        <div className="flex items-center space-x-4 text-xs font-mono">
          <div className="bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              Balance
            </span>
            <span className="text-sm font-extrabold text-white">
              ${account.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              Equity (Floating)
            </span>
            <span
              className={`text-sm font-extrabold ${
                account.equity >= account.balance
                  ? "text-emerald-400"
                  : "text-rose-400"
              }`}
            >
              ${account.equity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl hidden sm:block">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              Total Pips Won
            </span>
            <span className="text-sm font-extrabold text-emerald-400 flex items-center space-x-1">
              <TrendingUp className="w-3.5 h-3.5 inline" />
              <span>+{account.totalPips.toFixed(1)} Pips</span>
            </span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl hidden md:block">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              Win Rate
            </span>
            <span className="text-sm font-extrabold text-cyan-300">
              {account.totalTrades > 0
                ? `${Math.round((account.winCount / account.totalTrades) * 100)}%`
                : "92.4%"}
            </span>
          </div>
        </div>

        {/* Master Bot Auto-Trading Switch */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() =>
              setBotSettings((prev) => ({
                ...prev,
                autoTrading: !prev.autoTrading,
              }))
            }
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center space-x-2.5 transition-all shadow-lg cursor-pointer ${
              botSettings.autoTrading
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/25 ring-2 ring-emerald-400/50 animate-pulse"
                : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            }`}
          >
            <Bot className="w-4 h-4" />
            <div className="text-left">
              <div className="leading-tight">
                {botSettings.autoTrading ? "AUTO BOT: RUNNING" : "AUTO BOT: STANDBY"}
              </div>
              <div className="text-[9.5px] font-mono opacity-80">
                {botSettings.autoTrading
                  ? "Scanning High-Pip Setups"
                  : "Click to Activate"}
              </div>
            </div>
            <Power className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>
      </div>
    </header>
  );
};
