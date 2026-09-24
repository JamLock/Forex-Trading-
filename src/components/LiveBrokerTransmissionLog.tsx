import React from "react";
import {
  Radio,
  Server,
  Send,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Zap,
  RotateCw,
  ExternalLink,
} from "lucide-react";
import { BrokerBridgeConfig, LiveBrokerPacket } from "../types";
import { DEFAULT_BROKER_CONFIG } from "../utils/liveBrokerService";

interface LiveBrokerTransmissionLogProps {
  packets: LiveBrokerPacket[];
  config?: BrokerBridgeConfig;
  onOpenModal: () => void;
  onSyncRealRates: () => void;
  isSyncing: boolean;
  rateSource: string;
}

export const LiveBrokerTransmissionLog: React.FC<LiveBrokerTransmissionLogProps> = ({
  packets = [],
  config: propConfig,
  onOpenModal,
  onSyncRealRates,
  isSyncing,
  rateSource,
}) => {
  const config = { ...DEFAULT_BROKER_CONFIG, ...(propConfig || {}) };
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3 font-mono text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
          <span className="font-extrabold text-white text-xs tracking-tight">
            LIVE BROKER ROUTER & TELEMETRY
          </span>
          <span
            className={`text-[9.5px] px-2 py-0.5 rounded font-bold ${
              config.environment === "LIVE_BROKER"
                ? "bg-emerald-500 text-slate-950"
                : "bg-cyan-950 text-cyan-300 border border-cyan-700/50"
            }`}
          >
            {config.environment === "LIVE_BROKER" ? "LIVE BROKER ACTIVE" : "REAL FEED (PAPER)"}
          </span>
        </div>

        <div className="flex items-center space-x-2 text-[11px]">
          <button
            type="button"
            onClick={onSyncRealRates}
            disabled={isSyncing}
            className="flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors cursor-pointer"
            title="Poll real live market exchange rates now"
          >
            <RotateCw className={`w-3 h-3 ${isSyncing ? "animate-spin text-emerald-400" : ""}`} />
            <span>{isSyncing ? "Polling..." : "Sync FX Rates"}</span>
          </button>

          <button
            type="button"
            onClick={onOpenModal}
            className="flex items-center space-x-1 px-2.5 py-1 bg-emerald-950 text-emerald-300 hover:bg-emerald-900 rounded border border-emerald-700/60 transition-colors cursor-pointer"
          >
            <Server className="w-3 h-3" />
            <span>Broker Settings</span>
          </button>
        </div>
      </div>

      {/* Connection summary line */}
      <div className="flex flex-wrap items-center justify-between text-[10.5px] text-slate-400 bg-slate-950/70 px-3 py-1.5 rounded-lg border border-slate-800">
        <div>
          Feed Source: <span className="text-emerald-400 font-bold">{rateSource}</span>
        </div>
        <div>
          Webhook:{" "}
          <span className={config.webhookUrl ? "text-cyan-300" : "text-slate-500"}>
            {config.webhookUrl ? config.webhookUrl.slice(0, 30) + "..." : "Local Direct Loop"}
          </span>
        </div>
        <div>
          Telegram:{" "}
          <span className={config.telegramAlertsEnabled ? "text-emerald-400" : "text-slate-500"}>
            {config.telegramAlertsEnabled ? "Connected (Armed)" : "Standby"}
          </span>
        </div>
      </div>

      {/* Packet Stream */}
      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
        {packets.length === 0 ? (
          <div className="text-slate-500 py-4 text-center text-[11px]">
            Ready to route live execution packets.
          </div>
        ) : (
          packets.slice(0, 6).map((packet) => (
            <div
              key={packet.id}
              className="flex items-center justify-between bg-slate-950/90 border border-slate-850 px-2.5 py-1.5 rounded text-[10.5px]"
            >
              <div className="flex items-center space-x-2 truncate pr-2">
                <span className="text-slate-500">{packet.timestamp}</span>
                <span
                  className={`font-bold px-1 rounded text-[9.5px] ${
                    packet.type === "EXECUTION"
                      ? "text-emerald-400 bg-emerald-950/60"
                      : packet.type === "MODIFICATION"
                      ? "text-amber-400 bg-amber-950/60"
                      : "text-cyan-400 bg-cyan-950/60"
                  }`}
                >
                  {packet.type}
                </span>
                <span className="text-slate-300 truncate">{packet.payload}</span>
              </div>
              <span className="text-emerald-400 font-bold text-[9.5px] shrink-0">
                ✓ {packet.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
