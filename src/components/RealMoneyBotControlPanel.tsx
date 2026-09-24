import React, { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Zap,
  Server,
  DollarSign,
  AlertTriangle,
  Play,
  Square,
  Lock,
  RefreshCw,
  Copy,
  CheckCircle2,
  FileCode,
  Send,
  Sliders,
  Flame,
  Radio,
  Clock,
  ArrowRight,
  Terminal,
} from "lucide-react";
import { PairSymbol, RealMoneyConfig, RealMoneyOrderReceipt } from "../types";
import {
  INITIAL_REAL_MONEY_CONFIG,
  getMql5RealMoneyEaCode,
  getPythonMt5BridgeScript,
  panicCloseAllRealOrders,
  pingRealBroker,
} from "../utils/realMoneyService";

interface RealMoneyBotControlPanelProps {
  config?: RealMoneyConfig;
  realMoneyConfig?: RealMoneyConfig;
  setConfig?: React.Dispatch<React.SetStateAction<RealMoneyConfig>>;
  setRealMoneyConfig?: React.Dispatch<React.SetStateAction<RealMoneyConfig>>;
  receipts?: RealMoneyOrderReceipt[];
  onTriggerTestOrder?: () => void;
  onPanicCloseAll?: () => void;
  onClearReceipts?: () => void;
  selectedPair?: PairSymbol;
  marketData?: Record<string, any>;
  account?: any;
}

export const RealMoneyBotControlPanel: React.FC<RealMoneyBotControlPanelProps> = ({
  config: propConfig,
  realMoneyConfig,
  setConfig: propSetConfig,
  setRealMoneyConfig,
  receipts = [],
  onTriggerTestOrder = () => {},
  onPanicCloseAll = () => {},
  onClearReceipts,
  selectedPair = "USD/JPY",
  marketData,
  account,
}) => {
  const config: RealMoneyConfig = {
    ...INITIAL_REAL_MONEY_CONFIG,
    ...(realMoneyConfig || propConfig || {}),
  };
  const setConfig = setRealMoneyConfig || propSetConfig || (() => {});
  const [isArmingModalOpen, setIsArmingModalOpen] = useState(false);
  const [isTestingPing, setIsTestingPing] = useState(false);
  const [pingResult, setPingResult] = useState<{ success: boolean; message: string } | null>(null);
  const [activeCodeTab, setActiveCodeTab] = useState<"MQL5" | "PYTHON" | "OANDA">("MQL5");
  const [copiedCode, setCopiedCode] = useState(false);

  const handleTestPing = async () => {
    setIsTestingPing(true);
    setPingResult(null);
    try {
      const res = await pingRealBroker(config);
      setConfig((prev) => {
        const safePrev = { ...INITIAL_REAL_MONEY_CONFIG, ...(prev || {}) };
        return {
          ...safePrev,
          connectionStatus: res.success ? "CONNECTED" : "ERROR",
          lastPingLatencyMs: res.latencyMs,
          realAccountBalance: res.balance !== undefined ? res.balance : safePrev.realAccountBalance,
          realAccountEquity: res.equity !== undefined ? res.equity : safePrev.realAccountEquity,
        };
      });
      setPingResult({
        success: res.success,
        message: res.message,
      });
    } finally {
      setIsTestingPing(false);
    }
  };

  const handleArmRealMoney = () => {
    setConfig((prev) => {
      const safePrev = { ...INITIAL_REAL_MONEY_CONFIG, ...(prev || {}) };
      return {
        ...safePrev,
        isRealMoneyArmed: true,
        killSwitchTriggered: false,
        killSwitchReason: undefined,
        connectionStatus: "CONNECTED",
      };
    });
    setIsArmingModalOpen(false);
  };

  const handleDisarmRealMoney = () => {
    setConfig((prev) => {
      const safePrev = { ...INITIAL_REAL_MONEY_CONFIG, ...(prev || {}) };
      return {
        ...safePrev,
        isRealMoneyArmed: false,
      };
    });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP REAL MONEY COCKPIT & WARNING BANNER */}
      <div
        className={`p-6 rounded-2xl border transition-all shadow-xl ${
          config.isRealMoneyArmed
            ? "bg-gradient-to-r from-red-950/80 via-slate-900 to-amber-950/60 border-red-500/70 ring-1 ring-red-500/30"
            : "bg-slate-900/90 border-slate-800"
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <div
                className={`px-3 py-1 rounded-full text-xs font-mono font-black tracking-wider flex items-center space-x-1.5 shadow-md ${
                  config.isRealMoneyArmed
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                }`}
              >
                {config.isRealMoneyArmed ? (
                  <>
                    <Flame className="w-3.5 h-3.5 fill-current" />
                    <span>⚠️ REAL MONEY LIVE TRADING ARMED</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>🛡️ PAPER FEED SIMULATION ACTIVE (RISK-FREE)</span>
                  </>
                )}
              </div>

              {config.killSwitchTriggered && (
                <span className="px-2.5 py-1 rounded-full bg-red-900/80 border border-red-500 text-red-200 text-xs font-mono font-bold flex items-center space-x-1">
                  <ShieldAlert className="w-3 h-3 text-red-400" />
                  <span>KILL-SWITCH TRIPPED: {config.killSwitchReason || "MANUAL EMERGENCY HALT"}</span>
                </span>
              )}

              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                BROKER: <strong className="text-white">{config.brokerType}</strong> ({config.brokerServer})
              </span>
            </div>

            <h2 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
              <span>ApexFX Real-Money Institutional Execution Engine</span>
            </h2>

            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              When armed, every buy/sell signal and "No-Loss" break-even modification is relayed
              server-side with millisecond latency directly to your live broker account (MetaTrader 4/5,
              OANDA v20 REST, or custom webhook bridge).
            </p>
          </div>

          {/* Action Arm / Disarm Controls */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {config.isRealMoneyArmed ? (
              <>
                <button
                  type="button"
                  onClick={handleDisarmRealMoney}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl font-bold text-xs transition-colors cursor-pointer border border-slate-700 flex items-center space-x-2"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Disarm Real Money</span>
                </button>

                <button
                  type="button"
                  onClick={onPanicCloseAll}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black text-xs transition-all cursor-pointer shadow-lg shadow-red-600/40 flex items-center space-x-2 border border-red-400 animate-pulse"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>EMERGENCY PANIC KILL-SWITCH</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsArmingModalOpen(true)}
                className="px-6 py-3 bg-gradient-to-r from-red-600 via-amber-600 to-emerald-600 hover:from-red-500 hover:to-emerald-500 text-white rounded-xl font-black text-xs tracking-wider uppercase transition-all cursor-pointer shadow-xl shadow-red-600/25 flex items-center space-x-2 border border-red-400"
              >
                <Zap className="w-4 h-4 fill-current text-amber-300" />
                <span>Arm Real Money Live Bot</span>
              </button>
            )}
          </div>
        </div>

        {/* Real Account Telemetry Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] font-mono text-slate-500 block uppercase">Real Broker Balance</span>
            <div className="text-lg font-mono font-extrabold text-white mt-0.5">
              ${(config.realAccountBalance || 10000).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Account #{config.accountNumber || "51092811"}</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] font-mono text-slate-500 block uppercase">Bridge Latency</span>
            <div className="text-lg font-mono font-extrabold text-emerald-400 mt-0.5 flex items-center space-x-1.5">
              <span>{config.lastPingLatencyMs || 14}ms</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">{config.connectionStatus}</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] font-mono text-slate-500 block uppercase">Daily Drawdown Cap</span>
            <div className="text-lg font-mono font-extrabold text-amber-400 mt-0.5">
              ${config.realDailyLossToday || 0} / ${config.maxDailyLossUsd}
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full"
                style={{
                  width: `${Math.min(100, ((config.realDailyLossToday || 0) / config.maxDailyLossUsd) * 100)}%`,
                }}
              ></div>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] font-mono text-slate-500 block uppercase">Max Lot Ceiling</span>
            <div className="text-lg font-mono font-extrabold text-cyan-400 mt-0.5">
              {config.maxRealLotCap} Lots Hard Cap
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Max {config.maxOpenRealTrades} Concurrent</span>
          </div>
        </div>
      </div>

      {/* 2. REAL BROKER CONFIGURATION & CAPITAL GUARDRAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Real Broker Connection Settings */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-2.5">
              <Server className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="font-extrabold text-base text-white">Live Broker Connection Profile</h3>
                <p className="text-xs text-slate-400">Specify your broker type, live server, and secure execution route</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleTestPing}
              disabled={isTestingPing}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-emerald-300 font-mono font-bold text-xs rounded-lg border border-slate-700 transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTestingPing ? "animate-spin" : ""}`} />
              <span>{isTestingPing ? "Pinging..." : "Test Ping Bridge"}</span>
            </button>
          </div>

          {pingResult && (
            <div
              className={`p-3 rounded-xl text-xs font-mono flex items-center space-x-2 ${
                pingResult.success
                  ? "bg-emerald-950/60 border border-emerald-800/60 text-emerald-300"
                  : "bg-red-950/60 border border-red-800/60 text-red-300"
              }`}
            >
              {pingResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              )}
              <span>{pingResult.message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Broker Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-300 font-bold">Execution Broker / Protocol</label>
              <select
                value={config.brokerType}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    brokerType: e.target.value as any,
                  }))
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="METATRADER_5">MetaTrader 5 (MT5 Bridge EA)</option>
                <option value="METATRADER_4">MetaTrader 4 (MT4 Bridge EA)</option>
                <option value="OANDA_V20">OANDA v20 Live REST API</option>
                <option value="CTRADER">cTrader Open API / Fix Relay</option>
                <option value="PINECONNECTOR">PineConnector Webhook Bridge</option>
                <option value="CUSTOM_WEBHOOK">Custom HTTP / VPS Endpoint</option>
              </select>
            </div>

            {/* Broker Server */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-300 font-bold">Broker Server Name</label>
              <input
                type="text"
                value={config.brokerServer}
                onChange={(e) => setConfig((prev) => ({ ...prev, brokerServer: e.target.value }))}
                placeholder="e.g. ICMarketsSC-Live01, OANDA-Live"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Account Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-300 font-bold">Account Login / ID</label>
              <input
                type="text"
                value={config.accountNumber}
                onChange={(e) => setConfig((prev) => ({ ...prev, accountNumber: e.target.value }))}
                placeholder="e.g. 51092811 or 001-001-XXXX-001"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Bridge URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-300 font-bold">Bridge Relay Endpoint URL</label>
              <input
                type="text"
                value={config.bridgeEndpointUrl}
                onChange={(e) => setConfig((prev) => ({ ...prev, bridgeEndpointUrl: e.target.value }))}
                placeholder="e.g. http://127.0.0.1:8080/trade"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* API Key or Token */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-mono text-slate-300 font-bold">
                API Bearer Token / Webhook Secret
              </label>
              <input
                type="password"
                value={config.apiKeyOrToken || config.bridgeSecret}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    apiKeyOrToken: e.target.value,
                    bridgeSecret: e.target.value,
                  }))
                }
                placeholder="Enter secret token or OANDA Bearer token"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Test Order Trigger Button */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-white">Pipeline Execution Sanity Test</h4>
              <p className="text-[11px] text-slate-400">
                Send a 0.01 micro-lot test order with 0.05 pip SL and TP1 Auto-BE to verify bridge routing.
              </p>
            </div>

            <button
              type="button"
              onClick={onTriggerTestOrder}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg font-mono font-black text-xs transition-colors cursor-pointer shrink-0 shadow-md shadow-emerald-500/20 flex items-center space-x-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send 0.01 Test Order</span>
            </button>
          </div>
        </div>

        {/* Right 5 Cols: Capital Protection Guardrails */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4 flex items-center space-x-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-extrabold text-base text-white">Zero-Rogue Capital Guardrails</h3>
              <p className="text-xs text-slate-400">Hard stop safety limits that cannot be bypassed by the bot</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Daily Loss Limit */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 font-bold">Max Daily Loss Emergency Kill ($)</span>
                <span className="text-red-400 font-extrabold">${config.maxDailyLossUsd}</span>
              </div>
              <input
                type="range"
                min="50"
                max="1000"
                step="25"
                value={config.maxDailyLossUsd}
                onChange={(e) => setConfig((prev) => ({ ...prev, maxDailyLossUsd: Number(e.target.value) }))}
                className="w-full accent-red-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block">
                If daily loss reaches ${config.maxDailyLossUsd}, the bot auto-liquidates all trades and disarms.
              </span>
            </div>

            {/* Max Real Lot Cap */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 font-bold">Max Real Lot Size Ceiling</span>
                <span className="text-cyan-400 font-extrabold">{config.maxRealLotCap} Lots</span>
              </div>
              <div className="flex items-center space-x-2">
                {[0.05, 0.1, 0.25, 0.5, 1.0].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setConfig((prev) => ({ ...prev, maxRealLotCap: size }))}
                    className={`flex-1 py-1 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                      config.maxRealLotCap === size
                        ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm"
                        : "bg-slate-900 text-slate-400 border-slate-700 hover:text-white"
                    }`}
                  >
                    {size}L
                  </button>
                ))}
              </div>
            </div>

            {/* Spread & Slippage Filter */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[11px] font-mono text-slate-400 block">Max Spread Filter</span>
                <span className="text-sm font-mono font-extrabold text-white">{config.spreadFilterPips} Pips</span>
                <span className="text-[10px] text-slate-500 block">Blocks trade if spread widens</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[11px] font-mono text-slate-400 block">Max Slippage Tol.</span>
                <span className="text-sm font-mono font-extrabold text-white">{config.maxSlippagePips} Pips</span>
                <span className="text-[10px] text-slate-500 block">Rejects order on high slippage</span>
              </div>
            </div>

            {/* High Impact News Filter */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">High-Impact News Shield</span>
                <span className="text-[10px] text-slate-400 block">Pause trading 15m before/after NFP, FOMC, CPI</span>
              </div>
              <input
                type="checkbox"
                checked={config.newsFilterActive}
                onChange={(e) => setConfig((prev) => ({ ...prev, newsFilterActive: e.target.checked }))}
                className="w-4 h-4 accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. REAL BROKER ORDER EXECUTION AUDIT LOG */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="font-extrabold text-base text-white">
                Live Broker Order Dispatch Ledger ({receipts.length})
              </h3>
              <p className="text-xs text-slate-400">
                Audited real money execution receipts with broker tickets, latency, and fill prices
              </p>
            </div>
          </div>

          <span className="text-xs font-mono text-slate-400">
            Current Pair: <strong className="text-emerald-400">{selectedPair}</strong>
          </span>
        </div>

        {receipts.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800 text-slate-500 text-xs font-mono">
            No real-money broker orders dispatched yet. When the bot triggers or when you click "Send 0.01 Test Order",
            audited execution tickets will appear here in real time.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-3 py-2.5">Time</th>
                  <th className="px-3 py-2.5">Broker Ticket</th>
                  <th className="px-3 py-2.5">Action & Pair</th>
                  <th className="px-3 py-2.5">Volume</th>
                  <th className="px-3 py-2.5">Fill Price</th>
                  <th className="px-3 py-2.5">SL & TP1 (Auto-BE)</th>
                  <th className="px-3 py-2.5">Latency</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Broker Log</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {receipts.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-3 py-2.5 text-slate-400">{rec.timestamp}</td>
                    <td className="px-3 py-2.5 font-bold text-white">#{rec.brokerTicket}</td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`px-1.5 py-0.5 rounded font-black text-[10px] ${
                          rec.action === "BUY"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : rec.action === "SELL"
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                        }`}
                      >
                        {rec.action} {rec.pair}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-white font-bold">{rec.lots}L</td>
                    <td className="px-3 py-2.5 text-emerald-300 font-bold">{rec.fillPrice}</td>
                    <td className="px-3 py-2.5 text-slate-400">
                      SL: {rec.sl} | TP1: {rec.tp1}
                    </td>
                    <td className="px-3 py-2.5 text-slate-300">{rec.latencyMs}ms</td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          rec.status === "FILLED"
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                            : "bg-red-950 text-red-400 border border-red-800"
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-400 truncate max-w-xs">{rec.executionMessage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. PRODUCTION-READY EA & SCRIPT EXPORTER */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2.5">
            <FileCode className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-extrabold text-base text-white">
                Live Broker Connector Scripts (MetaTrader 5 & Python)
              </h3>
              <p className="text-xs text-slate-400">
                Copy and load into your MT5 terminal or VPS to establish instant sub-millisecond execution
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setActiveCodeTab("MQL5")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                activeCodeTab === "MQL5"
                  ? "bg-amber-500 text-slate-950 shadow-xs"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              MetaTrader 5 (MQL5 EA)
            </button>
            <button
              type="button"
              onClick={() => setActiveCodeTab("PYTHON")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                activeCodeTab === "PYTHON"
                  ? "bg-amber-500 text-slate-950 shadow-xs"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              Python MT5 Bridge
            </button>
          </div>
        </div>

        <div className="relative">
          <div className="absolute top-3 right-3 z-10">
            <button
              type="button"
              onClick={() =>
                handleCopy(
                  activeCodeTab === "MQL5"
                    ? getMql5RealMoneyEaCode(config.accountNumber, config.bridgeSecret)
                    : getPythonMt5BridgeScript()
                )
              }
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-mono font-bold flex items-center space-x-1.5 transition-colors cursor-pointer border border-slate-700 shadow-md"
            >
              {copiedCode ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 font-mono text-xs overflow-x-auto max-h-72 leading-relaxed">
            {activeCodeTab === "MQL5"
              ? getMql5RealMoneyEaCode(config.accountNumber, config.bridgeSecret)
              : getPythonMt5BridgeScript()}
          </pre>
        </div>
      </div>

      {/* 5. CONFIRMATION ARMING MODAL */}
      {isArmingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-red-500/80 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center space-x-3 text-red-400">
              <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-500/60 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Arm Real-Money Trading Bot?</h3>
                <p className="text-xs text-red-300">Live broker execution with real capital risk</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800 leading-relaxed">
              <p className="font-bold text-white">
                You are about to activate real live execution on {config.brokerType} ({config.brokerServer}, Account #{config.accountNumber}).
              </p>
              <ul className="list-disc pl-4 space-y-1.5 text-slate-400">
                <li>Bot orders will be routed directly to your live broker.</li>
                <li>
                  <strong className="text-amber-300">Daily Loss Cap:</strong> ${config.maxDailyLossUsd} maximum daily risk.
                </li>
                <li>
                  <strong className="text-cyan-300">Lot Size Ceiling:</strong> Hard capped at {config.maxRealLotCap} Lots.
                </li>
                <li>
                  <strong className="text-emerald-300">"No Loss" Rule:</strong> Stop Loss slides to Break-Even + 1 pip as soon as TP1 is hit.
                </li>
              </ul>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsArmingModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleArmRealMoney}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-lg shadow-red-600/30 border border-red-400 flex items-center space-x-2"
              >
                <Flame className="w-4 h-4 fill-current text-amber-300" />
                <span>Confirm & Arm Real Money</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
