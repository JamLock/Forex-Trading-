import React, { useState } from "react";
import {
  X,
  Radio,
  Server,
  Send,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Download,
  AlertTriangle,
  Lock,
  Globe2,
  MessageSquare,
  FileCode,
  Sparkles,
  Zap,
} from "lucide-react";
import { BrokerBridgeConfig } from "../types";
import { getMql5BridgeCode, getTradingViewPineScript } from "../utils/liveBrokerService";

interface LiveBrokerModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BrokerBridgeConfig;
  setConfig: React.Dispatch<React.SetStateAction<BrokerBridgeConfig>>;
  onTestDispatch: () => void;
  onTestTelegram: () => void;
}

export const LiveBrokerModal: React.FC<LiveBrokerModalProps> = ({
  isOpen,
  onClose,
  config,
  setConfig,
  onTestDispatch,
  onTestTelegram,
}) => {
  const [activeTab, setActiveTab] = useState<"BRIDGE_SETUP" | "MQL5_SCRIPT" | "TRADINGVIEW">("BRIDGE_SETUP");
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-750 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white tracking-tight flex items-center space-x-2">
                <span>LIVE BROKER & WEBHOOK INTEGRATION</span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    config.environment === "LIVE_BROKER"
                      ? "bg-emerald-500 text-slate-950"
                      : "bg-cyan-950 text-cyan-300 border border-cyan-700/50"
                  }`}
                >
                  {config.environment === "LIVE_BROKER" ? "LIVE EXECUTION ON" : "REAL FEED (PAPER)"}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Bridge bot orders directly to MetaTrader 4/5, OANDA, or custom Webhook listeners
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-950/60 border-b border-slate-800 px-6 py-2 flex items-center space-x-2 text-xs font-mono">
          <button
            onClick={() => setActiveTab("BRIDGE_SETUP")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === "BRIDGE_SETUP"
                ? "bg-emerald-500 text-slate-950 shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            1. Broker Webhook & Telegram Config
          </button>

          <button
            onClick={() => setActiveTab("MQL5_SCRIPT")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center space-x-1 ${
              activeTab === "MQL5_SCRIPT"
                ? "bg-emerald-500 text-slate-950 shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>2. MetaTrader 5 / 4 EA Code</span>
          </button>

          <button
            onClick={() => setActiveTab("TRADINGVIEW")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center space-x-1 ${
              activeTab === "TRADINGVIEW"
                ? "bg-emerald-500 text-slate-950 shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>3. TradingView PineScript</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {activeTab === "BRIDGE_SETUP" && (
            <div className="space-y-6">
              {/* Execution Environment Selection */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold uppercase text-slate-300 block">
                  Execution Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setConfig((prev) => ({
                        ...prev,
                        environment: "PAPER_LIVE_FEED",
                      }))
                    }
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      config.environment === "PAPER_LIVE_FEED"
                        ? "bg-cyan-950/60 border-cyan-500 ring-2 ring-cyan-500/20 text-white"
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center space-x-2 font-bold text-xs text-cyan-300">
                      <Radio className="w-3.5 h-3.5" />
                      <span>REAL MARKET FEED (PAPER MODE)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Stream real live Interbank FX prices with zero broker financial risk. Ideal for testing confluence parameters.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setConfig((prev) => ({
                        ...prev,
                        environment: "LIVE_BROKER",
                      }))
                    }
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      config.environment === "LIVE_BROKER"
                        ? "bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/20 text-white"
                        : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center space-x-2 font-bold text-xs text-emerald-400">
                      <Zap className="w-3.5 h-3.5" />
                      <span>LIVE BROKER ACTIVE (MT4/MT5 / OANDA)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Transmits live BUY/SELL orders, partial closures, and Break-Even modifications to your broker webhook.
                    </p>
                  </button>
                </div>
              </div>

              {/* Webhook Configuration Form */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-bold text-white">
                    <Server className="w-4 h-4 text-emerald-400" />
                    <span>MetaTrader / Custom Webhook Relay URL</span>
                  </div>
                  <button
                    type="button"
                    onClick={onTestDispatch}
                    className="text-[11px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/50 hover:bg-emerald-900 px-2.5 py-1 rounded cursor-pointer transition-colors"
                  >
                    Send Test Ping
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">
                      Webhook Destination URL:
                    </label>
                    <input
                      type="text"
                      value={config.webhookUrl}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          webhookUrl: e.target.value,
                        }))
                      }
                      placeholder="http://127.0.0.1:8080/apex or https://your-relay.com"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">
                      Webhook Secret Token (Optional):
                    </label>
                    <input
                      type="password"
                      value={config.webhookSecret}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          webhookSecret: e.target.value,
                        }))
                      }
                      placeholder="Enter secret passkey"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="text-[10.5px] text-slate-400 font-mono">
                  Supported formats: MT5 Webhook EA, cTrader Open API, TradingView Webhook, Python bridge.
                </div>
              </div>

              {/* Telegram Instant Mobile Notifications */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-bold text-white">
                    <MessageSquare className="w-4 h-4 text-cyan-400" />
                    <span>Telegram Real-Time Trade Alert Dispatcher</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="enable-telegram"
                      checked={config.telegramAlertsEnabled}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          telegramAlertsEnabled: e.target.checked,
                        }))
                      }
                      className="accent-emerald-500 cursor-pointer w-3.5 h-3.5"
                    />
                    <label
                      htmlFor="enable-telegram"
                      className="text-xs font-mono text-slate-300 cursor-pointer"
                    >
                      Enable Telegram
                    </label>
                    {config.telegramAlertsEnabled && (
                      <button
                        type="button"
                        onClick={onTestTelegram}
                        className="text-[11px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-700/50 hover:bg-cyan-900 px-2 py-0.5 rounded cursor-pointer transition-colors ml-2"
                      >
                        Send Test Msg
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">
                      Telegram Bot Token:
                    </label>
                    <input
                      type="text"
                      value={config.telegramBotToken}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          telegramBotToken: e.target.value,
                        }))
                      }
                      placeholder="e.g. 123456789:ABCdefGHI..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">
                      Telegram Chat ID:
                    </label>
                    <input
                      type="text"
                      value={config.telegramChatId}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          telegramChatId: e.target.value,
                        }))
                      }
                      placeholder="e.g. -1001928374 or personal chat id"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="text-[10.5px] text-slate-400 font-mono">
                  Sends instant notifications to your phone whenever an order opens, TP1 is achieved, Break-Even is locked, or TP3 hits!
                </div>
              </div>

              {/* Live Safety Protections */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Broker Safety & Execution Controls</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Max Slippage:</span>
                    <select
                      value={config.maxSlippagePips}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          maxSlippagePips: Number(e.target.value),
                        }))
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200 mt-1"
                    >
                      <option value={1}>1.0 Pip (Strict)</option>
                      <option value={2}>2.0 Pips (Recommended)</option>
                      <option value={3}>3.0 Pips (High Volatility)</option>
                    </select>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">High Impact News Filter:</span>
                    <button
                      type="button"
                      onClick={() =>
                        setConfig((prev) => ({
                          ...prev,
                          newsFilterActive: !prev.newsFilterActive,
                        }))
                      }
                      className={`w-full py-1.5 px-2 rounded border font-bold mt-1 text-center transition-all cursor-pointer ${
                        config.newsFilterActive
                          ? "bg-emerald-950 text-emerald-300 border-emerald-700"
                          : "bg-slate-900 text-slate-400 border-slate-800"
                      }`}
                    >
                      {config.newsFilterActive ? "ACTIVE (Pause on FOMC/NFP)" : "DISABLED"}
                    </button>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">Max Daily Loss Cap:</span>
                    <select
                      value={config.maxDailyDrawdownPercent}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          maxDailyDrawdownPercent: Number(e.target.value),
                        }))
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200 mt-1"
                    >
                      <option value={2}>2% Max Account Risk</option>
                      <option value={3}>3% Max Account Risk</option>
                      <option value={5}>5% Max Account Risk</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "MQL5_SCRIPT" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-white">
                    MetaTrader 5 / 4 Expert Advisor Bridge Script
                  </h4>
                  <p className="text-xs text-slate-400">
                    Copy and paste into MetaEditor in MT5 or MT4 to allow the bot to place live trades on your broker.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(getMql5BridgeCode())}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedCode ? "Copied!" : "Copy MQL5 Code"}</span>
                </button>
              </div>

              <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-96">
                <code>{getMql5BridgeCode()}</code>
              </pre>
            </div>
          )}

          {activeTab === "TRADINGVIEW" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-white">
                    TradingView Pine Script v5 Strategy
                  </h4>
                  <p className="text-xs text-slate-400">
                    Add to your TradingView chart to trigger instant alerts or connect with TradingView Webhooks.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(getTradingViewPineScript())}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedCode ? "Copied!" : "Copy Pine Script"}</span>
                </button>
              </div>

              <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-96">
                <code>{getTradingViewPineScript()}</code>
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>REAL-TIME INTERBANK SYNC ACTIVE</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
          >
            Save & Connect Bridge
          </button>
        </div>
      </div>
    </div>
  );
};
