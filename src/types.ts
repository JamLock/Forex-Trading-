export type PairSymbol = "USD/JPY" | "EUR/USD";

export interface Candle {
  time: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ema20?: number;
  ema50?: number;
}

export interface Position {
  id: string;
  ticket: number;
  pair: PairSymbol;
  type: "BUY" | "SELL";
  lots: number;
  initialLots: number;
  openPrice: number;
  currentPrice: number;
  sl: number;
  initialSl: number;
  isBreakeven: boolean; // "No Loss" active: SL moved to entry + spread
  tp1: number;
  tp2: number;
  tp3: number;
  tp1Hit: boolean;
  tp2Hit: boolean;
  tp3Hit: boolean;
  openTime: string;
  timestamp: number;
  pips: number;
  pnl: number;
  strategyTag: string;
}

export interface TradeHistoryItem {
  id: string;
  ticket: number;
  pair: PairSymbol;
  type: "BUY" | "SELL";
  lots: number;
  openPrice: number;
  closePrice: number;
  openTime: string;
  closeTime: string;
  pips: number;
  profit: number;
  exitReason: "TP1_PARTIAL" | "TP2_PARTIAL" | "TP3_FULL" | "BREAKEVEN" | "MANUAL" | "STOP_LOSS";
  strategyTag: string;
}

export interface PairMarketData {
  pair: PairSymbol;
  baseCurrency: string;
  quoteCurrency: string;
  currentBid: number;
  currentAsk: number;
  spreadPips: number;
  pipFactor: number; // 0.01 for USD/JPY, 0.0001 for EUR/USD
  pricePrecision: number; // 3 for JPY (pipette), 5 for EUR/USD
  change24h: number;
  high24h: number;
  low24h: number;
  dailyRangePips: number;
  trend: "BULLISH" | "BEARISH" | "RANGING";
  rsi14: number;
  atrPips: number;
  confluenceScore: number;
  session: "TOKYO" | "LONDON" | "NEW_YORK" | "LONDON_NY_OVERLAP";
}

export type StrategyMode =
  | "MASTER_AI_COUNCIL_SYNTHESIS"
  | "INTELLIGENT_10M_SNIPER_005"
  | "PRO_5M_SCALP"
  | "PRO_10M_TREND"
  | "INSTITUTIONAL_CONFLUENCE"
  | "HIGH_PIP_RUNNER"
  | "TREND_SCALPER";

export type MasterTraderId = "ICT" | "SIMONS" | "WYCKOFF" | "DRUCKENMILLER" | "TUDOR_JONES";

export interface MasterTraderProfile {
  id: MasterTraderId;
  name: string;
  title: string;
  corePhilosophy: string;
  bias: "BULLISH" | "BEARISH" | "NEUTRAL";
  conviction: number;
  setup: string;
  weight: number;
  recentWinRate: number;
  guidance: string;
  signatureConcepts: string[];
}

export interface MasterLearningLesson {
  id: string;
  epoch: number;
  master: string;
  title: string;
  insight: string;
  adjustment: string;
  timestamp?: string;
}

export interface MasterCouncilConsensus {
  overallBias: "STRONG_BUY" | "ACCUMULATE_LONG" | "NEUTRAL_WAIT" | "DISTRIBUTE_SHORT" | "STRONG_SELL";
  consensusScore: number;
  recommendedLotsMultiplier: number;
  optimalSlPips: number;
  optimalTp1Pips: number;
  optimalTp2Pips: number;
  optimalTp3Pips: number;
  aiSynthesis: string;
  learningEpoch: number;
  lastOptimizedTime: string;
  isAiOptimized: boolean;
  masters: MasterTraderProfile[];
  learnedLessons: MasterLearningLesson[];
}

export type ChartTimeframe = "30S" | "1M" | "5M" | "10M" | "15M" | "30M" | "1H" | "4H";

export type StopLossPreset = "0.05_PIP" | "0.05_SNIPER" | "0.10_TIGHT" | "DYNAMIC_ATR" | "CUSTOM";

export interface Strategy10MConfig {
  stopLossMode: StopLossPreset;
  stopLossValue: number; // 0.05 default (0.05 pip)
  enableFvgRetest: boolean; // Fair Value Gap
  enableLiquiditySweep: boolean; // Asian/London High & Low sweep
  enableEmaRibbon: boolean; // 10M EMA 20/50/200 trend flow
  enableVolumeClimax: boolean; // Volume surge > 1.35x
  minIntelligenceConfidence: number; // 80% to 95%
  autoBreakEvenAtTP1: boolean; // Move SL to BE instantly at TP1
  riskRewardTier: "SNIPER_1_4" | "INSTITUTIONAL_1_9" | "RUNNER_1_18";
}

export interface BotSettings {
  autoTrading: boolean;
  pairsEnabled: {
    "USD/JPY": boolean;
    "EUR/USD": boolean;
  };
  strategyMode: StrategyMode;
  tradingTimeframe: ChartTimeframe;
  stopLossPreset?: StopLossPreset;
  stopLossPips?: number;
  strategy10MConfig?: Strategy10MConfig;
  riskPercent: number; // 1% to 5%
  fixedLotSize: number; // 0.1 standard default
  useDynamicLots: boolean;
  autoBreakevenAtTP1: boolean; // "NO LOSS" rule: always slide SL to BE on TP1
  breakevenBufferPips: number; // +1.0 pip to cover commissions/spread
  tp1PartialClosePercent: number; // 40%
  tp2PartialClosePercent: number; // 30%
  trailingStopActive: boolean;
  minConfluenceScore: number; // 75%
  maxOpenPositions: number; // 3
  masterWeights?: {
    ict: number;
    simons: number;
    wyckoff: number;
    druckenmiller: number;
    tudorJones: number;
  };
  masterLearningActive?: boolean;
}

export interface AlgoSignal {
  id: string;
  pair: PairSymbol;
  type: "BUY" | "SELL";
  time: string;
  entryPrice: number;
  sl: number;
  tp1: number;
  tp2: number;
  tp3: number;
  confluence: number;
  reasons: string[];
  status: "ACTIVE" | "EXECUTED" | "EXPIRED";
}

export interface AccountStats {
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  totalPips: number;
  winCount: number;
  lossCount: number;
  beCount: number;
  totalTrades: number;
  profitFactor: number;
  maxDrawdownPercent: number;
}

export type ExecutionEnvironment = "LIVE_BROKER" | "PAPER_LIVE_FEED";

export type RealMoneyBrokerType =
  | "METATRADER_5"
  | "METATRADER_4"
  | "OANDA_V20"
  | "CTRADER"
  | "PINECONNECTOR"
  | "CUSTOM_WEBHOOK";

export interface RealMoneyConfig {
  isRealMoneyArmed: boolean;
  brokerType: RealMoneyBrokerType;
  brokerServer: string; // e.g., "ICMarketsSC-Live", "OANDA-v20-Live", "Pepperstone-Edge-01"
  accountNumber: string;
  apiKeyOrToken: string;
  bridgeEndpointUrl: string; // e.g. "http://127.0.0.1:8080/trade" or "https://api-fxtrade.oanda.com"
  bridgeSecret: string;
  // Capital Protection Guardrails
  maxDailyLossUsd: number;
  maxRealLotCap: number;
  maxOpenRealTrades: number;
  maxSlippagePips: number;
  spreadFilterPips: number;
  newsFilterActive: boolean;
  telegramTradeAlerts: boolean;
  telegramBotToken: string;
  telegramChatId: string;
  connectionStatus: "CONNECTED" | "DISCONNECTED" | "CONNECTING" | "ERROR";
  lastPingLatencyMs: number;
  realAccountBalance?: number;
  realAccountEquity?: number;
  realAccountCurrency?: string;
  realDailyLossToday: number;
  killSwitchTriggered: boolean;
  killSwitchReason?: string;
}

export interface RealMoneyOrderReceipt {
  id: string;
  timestamp: string;
  brokerTicket: string | number;
  pair: PairSymbol;
  action: "BUY" | "SELL" | "CLOSE" | "BREAKEVEN_LOCK";
  lots: number;
  fillPrice: number;
  slippagePips: number;
  sl: number;
  tp1: number;
  tp2: number;
  tp3: number;
  broker: string;
  latencyMs: number;
  status: "FILLED" | "REJECTED" | "QUEUED";
  executionMessage: string;
}

export interface BrokerBridgeConfig {
  environment: ExecutionEnvironment;
  brokerType: "MT5_MT4_BRIDGE" | "OANDA_REST" | "WEBHOOK_CUSTOM" | "CTRADER";
  webhookUrl: string;
  webhookSecret: string;
  telegramBotToken: string;
  telegramChatId: string;
  telegramAlertsEnabled: boolean;
  maxSlippagePips: number;
  newsFilterActive: boolean;
  maxDailyDrawdownPercent: number;
  isConnected: boolean;
  lastHeartbeat: string;
}

export interface LiveBrokerPacket {
  id: string;
  timestamp: string;
  type: "DISPATCH" | "EXECUTION" | "HEARTBEAT" | "MODIFICATION" | "ERROR";
  channel: "MT5_BRIDGE" | "TELEGRAM" | "REST_API" | "INTERNAL";
  payload: string;
  status: "SENT" | "CONFIRMED" | "REJECTED";
}
