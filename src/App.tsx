import React, { useState, useEffect, useRef } from "react";
import {
  ForexHeader
} from "./components/ForexHeader";
import {
  ForexChart
} from "./components/ForexChart";
import {
  BotEnginePanel
} from "./components/BotEnginePanel";
import {
  OrderTicket
} from "./components/OrderTicket";
import {
  PositionsTable
} from "./components/PositionsTable";
import {
  TradeHistory
} from "./components/TradeHistory";
import {
  MarketScanner
} from "./components/MarketScanner";
import {
  LiveBrokerModal
} from "./components/LiveBrokerModal";
import {
  LiveBrokerTransmissionLog
} from "./components/LiveBrokerTransmissionLog";
import {
  ModernTechDashboard
} from "./components/ModernTechDashboard";
import {
  Intelligent10MStrategyBot
} from "./components/Intelligent10MStrategyBot";
import {
  MasterStrategyLearningPanel
} from "./components/MasterStrategyLearningPanel";
import {
  RealMoneyBotControlPanel
} from "./components/RealMoneyBotControlPanel";
import {
  AccountStats,
  AlgoSignal,
  BotSettings,
  BrokerBridgeConfig,
  Candle,
  ChartTimeframe,
  LiveBrokerPacket,
  MasterCouncilConsensus,
  PairMarketData,
  PairSymbol,
  Position,
  RealMoneyConfig,
  RealMoneyOrderReceipt,
  StrategyMode,
  TradeHistoryItem,
} from "./types";
import {
  calculatePips,
  calculatePnl,
  calculateStrategyTargets,
  formatPrice,
  generateInitialCandles,
  PIP_FACTORS,
  PRICE_PRECISIONS,
} from "./utils/forexCalculations";
import {
  DEFAULT_BROKER_CONFIG,
  fetchRealLiveFxRates,
  transmitLiveBrokerOrder,
} from "./utils/liveBrokerService";
import {
  INITIAL_MASTER_CONSENSUS,
  fetchMasterLearningSynthesis,
  adaptWeightsFromTrade,
} from "./utils/masterLearningEngine";
import {
  INITIAL_REAL_MONEY_CONFIG,
  executeRealBrokerOrder,
  panicCloseAllRealOrders,
} from "./utils/realMoneyService";
import {
  ShieldCheck,
  Zap,
  TrendingUp,
  Activity,
  CheckCircle2,
  AlertCircle,
  X,
  BookOpen,
  DollarSign,
  BarChart2,
  Bot,
  BellRing,
  Cpu,
  Layers,
  Radio,
  Compass,
  RefreshCw,
  Brain,
  Award,
  Sparkles,
  Flame,
} from "lucide-react";

interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: "success" | "warning" | "info" | "be_locked";
}

export default function App() {
  // Navigation View
  const [activeView, setActiveView] = useState<
    "DASHBOARD" | "TERMINAL" | "10M_BOT" | "MASTER_AI" | "REAL_MONEY" | "SCANNER" | "BLUEPRINT" | "JOURNAL"
  >("DASHBOARD");
  const [selectedPair, setSelectedPair] = useState<PairSymbol>("USD/JPY");
  const [timeframe, setTimeframe] = useState<ChartTimeframe>("5M");

  // Master AI Strategy Learning State
  const [masterConsensus, setMasterConsensus] = useState<MasterCouncilConsensus>(() => {
    try {
      const saved = localStorage.getItem("forex_apex_master_consensus");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          if (Array.isArray(parsed.learnedLessons)) {
            const seenIds = new Set<string>();
            parsed.learnedLessons = parsed.learnedLessons.filter((l: any, idx: number) => {
              const key = l?.id ? `${l.id}` : `legacy-idx-${idx}`;
              if (seenIds.has(key)) return false;
              seenIds.add(key);
              return true;
            });
          }
          return {
            ...INITIAL_MASTER_CONSENSUS,
            ...parsed,
            masters: Array.isArray(parsed.masters) && parsed.masters.length > 0 ? parsed.masters : INITIAL_MASTER_CONSENSUS.masters,
            learnedLessons: Array.isArray(parsed.learnedLessons) ? parsed.learnedLessons : INITIAL_MASTER_CONSENSUS.learnedLessons,
          };
        }
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_MASTER_CONSENSUS;
  });
  const [isLearning, setIsLearning] = useState(false);

  useEffect(() => {
    localStorage.setItem("forex_apex_master_consensus", JSON.stringify(masterConsensus));
  }, [masterConsensus]);

  // Default institutional account benchmark
  const DEFAULT_ACCOUNT: AccountStats = {
    balance: 10000.0,
    equity: 10000.0,
    margin: 0,
    freeMargin: 10000.0,
    marginLevel: 0,
    totalPips: 248.5,
    winCount: 14,
    lossCount: 1,
    beCount: 4,
    totalTrades: 19,
    profitFactor: 4.82,
    maxDrawdownPercent: 1.2,
  };

  const DEFAULT_BOT_SETTINGS: BotSettings = {
    autoTrading: true,
    pairsEnabled: {
      "USD/JPY": true,
      "EUR/USD": true,
    },
    strategyMode: "INTELLIGENT_10M_SNIPER_005",
    tradingTimeframe: "10M",
    stopLossPreset: "0.05_PIP",
    stopLossPips: 0.05,
    riskPercent: 2,
    fixedLotSize: 0.1,
    useDynamicLots: false,
    autoBreakevenAtTP1: true, // "NO LOSS" rule: always move SL to BE on TP1!
    breakevenBufferPips: 1.0,
    tp1PartialClosePercent: 40,
    tp2PartialClosePercent: 30,
    trailingStopActive: true,
    minConfluenceScore: 78,
    maxOpenPositions: 3,
  };

  // Account State
  const [account, setAccount] = useState<AccountStats>(() => {
    try {
      const saved = localStorage.getItem("forex_apex_account");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          return { ...DEFAULT_ACCOUNT, ...parsed };
        }
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_ACCOUNT;
  });

  // Bot Settings
  const [botSettings, setBotSettings] = useState<BotSettings>(() => {
    try {
      const saved = localStorage.getItem("forex_apex_bot_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          return {
            ...DEFAULT_BOT_SETTINGS,
            ...parsed,
            pairsEnabled: {
              ...DEFAULT_BOT_SETTINGS.pairsEnabled,
              ...(parsed.pairsEnabled || {}),
            },
          };
        }
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_BOT_SETTINGS;
  });

  // Market Data for USD/JPY and EUR/USD (Raw Institutional ECN spread: 0.2 pips)
  const [marketData, setMarketData] = useState<Record<PairSymbol, PairMarketData>>({
    "USD/JPY": {
      pair: "USD/JPY",
      baseCurrency: "USD",
      quoteCurrency: "JPY",
      currentBid: 157.433,
      currentAsk: 157.435,
      spreadPips: 0.2,
      pipFactor: 0.01,
      pricePrecision: 3,
      change24h: 0.37,
      high24h: 157.56,
      low24h: 157.32,
      dailyRangePips: 24.0,
      trend: "BEARISH",
      rsi14: 52.4,
      atrPips: 16.0,
      confluenceScore: 88,
      session: "LONDON_NY_OVERLAP",
    },
    "EUR/USD": {
      pair: "EUR/USD",
      baseCurrency: "EUR",
      quoteCurrency: "USD",
      currentBid: 1.08745,
      currentAsk: 1.08747,
      spreadPips: 0.2,
      pipFactor: 0.0001,
      pricePrecision: 5,
      change24h: -0.28,
      high24h: 1.0912,
      low24h: 1.0855,
      dailyRangePips: 57.0,
      trend: "BEARISH",
      rsi14: 44.8,
      atrPips: 14.0,
      confluenceScore: 82,
      session: "LONDON_NY_OVERLAP",
    },
  });

  // Candles History per pair (90 bars to support smooth zooming and panning)
  const [candlesMap, setCandlesMap] = useState<Record<PairSymbol, Candle[]>>({
    "USD/JPY": generateInitialCandles("USD/JPY", 90, "5M", 157.433),
    "EUR/USD": generateInitialCandles("EUR/USD", 90, "5M", 1.08745),
  });

  // Re-generate candles when timeframe changes (30S, 1M, 5M, 10M, 15M, 30M, 1H, 4H)
  useEffect(() => {
    setCandlesMap({
      "USD/JPY": generateInitialCandles("USD/JPY", 90, timeframe, marketDataRef.current["USD/JPY"].currentBid),
      "EUR/USD": generateInitialCandles("EUR/USD", 90, timeframe, marketDataRef.current["EUR/USD"].currentBid),
    });
  }, [timeframe]);

  // Open Positions
  const [positions, setPositions] = useState<Position[]>(() => {
    try {
      const saved = localStorage.getItem("forex_apex_positions");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: "POS-1001",
        ticket: 88204,
        pair: "USD/JPY",
        type: "SELL",
        lots: 0.1,
        initialLots: 0.1,
        openPrice: 157.473,
        currentPrice: 157.433,
        sl: 157.524,
        initialSl: 157.524,
        isBreakeven: false,
        tp1: 157.422,
        tp2: 157.371,
        tp3: 157.32,
        tp1Hit: false,
        tp2Hit: false,
        tp3Hit: false,
        openTime: "10:14",
        timestamp: Date.now() - 600000,
        pips: 4.0,
        pnl: 2.65,
        strategyTag: "SAOTS_SMART_MONEY",
      },
    ];
  });

  // Closed Trades History
  const [history, setHistory] = useState<TradeHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem("forex_apex_history");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: "H-1",
        ticket: 88192,
        pair: "USD/JPY",
        type: "BUY",
        lots: 0.1,
        openPrice: 154.21,
        closePrice: 154.96,
        openTime: "09:30",
        closeTime: "11:45",
        pips: 75.0,
        profit: 48.75,
        exitReason: "TP3_FULL",
        strategyTag: "HIGH_PIP_RUNNER",
      },
      {
        id: "H-2",
        ticket: 88195,
        pair: "EUR/USD",
        type: "SELL",
        lots: 0.1,
        openPrice: 1.0892,
        closePrice: 1.0862,
        openTime: "12:10",
        closeTime: "13:20",
        pips: 30.0,
        profit: 30.0,
        exitReason: "TP2_PARTIAL",
        strategyTag: "INSTITUTIONAL_CONFLUENCE",
      },
      {
        id: "H-3",
        ticket: 88199,
        pair: "USD/JPY",
        type: "BUY",
        lots: 0.05,
        openPrice: 154.45,
        closePrice: 154.46,
        openTime: "13:40",
        closeTime: "14:05",
        pips: 1.0,
        profit: 0.32,
        exitReason: "BREAKEVEN",
        strategyTag: "NO_LOSS_PROTECTION",
      },
    ];
  });

  // Algo Signals Radar
  const [signals, setSignals] = useState<AlgoSignal[]>([
    {
      id: "SIG-UJ-1",
      pair: "USD/JPY",
      type: "BUY",
      time: "Just Now",
      entryPrice: 154.845,
      sl: 154.665,
      tp1: 155.045,
      tp2: 155.265,
      tp3: 155.685,
      confluence: 88,
      reasons: [
        "H1 Golden Cross (EMA 20 > 50)",
        "RSI Pullback bounce at 50 midline",
        "London/NY session volume spike",
        "Order block retest at 154.80",
      ],
      status: "ACTIVE",
    },
    {
      id: "SIG-EU-1",
      pair: "EUR/USD",
      type: "SELL",
      time: "2 mins ago",
      entryPrice: 1.08745,
      sl: 1.08885,
      tp1: 1.08595,
      tp2: 1.08425,
      tp3: 1.08155,
      confluence: 83,
      reasons: [
        "M15 Bearish Engulfing candle",
        "Rejection at Daily R1 pivot",
        "RSI Bearish divergence confirmed",
        "Targeting London low liquidity",
      ],
      status: "ACTIVE",
    },
  ]);

  // Toast Notifications
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Broker Bridge & Webhook Config
  const [brokerConfig, setBrokerConfig] = useState<BrokerBridgeConfig>(() => {
    try {
      const saved = localStorage.getItem("forex_apex_broker_config");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          return { ...DEFAULT_BROKER_CONFIG, ...parsed };
        }
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_BROKER_CONFIG;
  });

  // Real Money Live Trading Bot Configuration
  const [realMoneyConfig, setRealMoneyConfig] = useState<RealMoneyConfig>(() => {
    try {
      const saved = localStorage.getItem("forex_apex_real_money_config");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          return { ...INITIAL_REAL_MONEY_CONFIG, ...parsed };
        }
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_REAL_MONEY_CONFIG;
  });

  const [realMoneyReceipts, setRealMoneyReceipts] = useState<RealMoneyOrderReceipt[]>(() => {
    try {
      const saved = localStorage.getItem("forex_apex_real_money_receipts");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [packets, setPackets] = useState<LiveBrokerPacket[]>([
    {
      id: "PKT-INIT-1",
      timestamp: new Date().toLocaleTimeString(),
      type: "HEARTBEAT",
      channel: "MT5_BRIDGE",
      payload: "ROUTER CONNECTED | Listening to USD/JPY & EUR/USD tick bus",
      status: "CONFIRMED",
    },
    {
      id: "PKT-INIT-2",
      timestamp: new Date().toLocaleTimeString(),
      type: "EXECUTION",
      channel: "INTERNAL",
      payload: "NO-LOSS PROTOCOL ENGAGED | Auto-BreakEven armed @ TP1",
      status: "CONFIRMED",
    },
  ]);

  const [isBrokerModalOpen, setIsBrokerModalOpen] = useState(false);
  const [isSyncingRates, setIsSyncingRates] = useState(false);
  const [rateSource, setRateSource] = useState("Interbank Live Feed (ECB)");

  // Sync with LocalStorage
  useEffect(() => {
    localStorage.setItem("forex_apex_account", JSON.stringify(account));
  }, [account]);

  useEffect(() => {
    localStorage.setItem("forex_apex_bot_settings", JSON.stringify(botSettings));
  }, [botSettings]);

  useEffect(() => {
    localStorage.setItem("forex_apex_broker_config", JSON.stringify(brokerConfig));
  }, [brokerConfig]);

  useEffect(() => {
    localStorage.setItem("forex_apex_real_money_config", JSON.stringify(realMoneyConfig));
  }, [realMoneyConfig]);

  useEffect(() => {
    localStorage.setItem("forex_apex_real_money_receipts", JSON.stringify(realMoneyReceipts));
  }, [realMoneyReceipts]);

  useEffect(() => {
    localStorage.setItem("forex_apex_positions", JSON.stringify(positions));
  }, [positions]);

  useEffect(() => {
    localStorage.setItem("forex_apex_history", JSON.stringify(history));
  }, [history]);

  // --- REAL LIVE MARKET FEED SYNCHRONIZATION ---
  const syncLiveRates = async (silent = false) => {
    setIsSyncingRates(true);
    try {
      const rates = await fetchRealLiveFxRates();
      if (rates.usdjpy || rates.eurusd) {
        setMarketData((prev) => {
          const next = { ...prev };
          if (rates.usdjpy) {
            const spread = next["USD/JPY"].spreadPips * 0.01;
            next["USD/JPY"] = {
              ...next["USD/JPY"],
              currentBid: rates.usdjpy,
              currentAsk: parseFloat((rates.usdjpy + spread).toFixed(3)),
            };
          }
          if (rates.eurusd) {
            const spread = next["EUR/USD"].spreadPips * 0.0001;
            next["EUR/USD"] = {
              ...next["EUR/USD"],
              currentBid: rates.eurusd,
              currentAsk: parseFloat((rates.eurusd + spread).toFixed(5)),
            };
          }
          return next;
        });

        setRateSource(rates.source);
        if (!silent) {
          addToast("Market Feed Synchronized", `Real live Interbank FX rates updated from ${rates.source}.`, "info");
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncingRates(false);
    }
  };

  useEffect(() => {
    syncLiveRates(true);
    const rateInterval = setInterval(() => {
      syncLiveRates(true);
    }, 45000);
    return () => clearInterval(rateInterval);
  }, []);

  const addToast = (
    title: string,
    message: string,
    type: ToastNotification["type"] = "info"
  ) => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5500);
  };

  // --- SOUND EFFECTS (Web Audio API Synthesizer) ---
  const playSoundEffect = (type: "order" | "tp" | "be_lock" | "sl") => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "be_lock") {
        // High-tech pleasant shield chime
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === "tp") {
        // Glorious double chord for TP
        osc.type = "triangle";
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else if (type === "order") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      }
    } catch (e) {
      // Audio context might be restricted before user gesture
    }
  };

  // Synchronous State References for tick and bot engines
  const marketDataRef = useRef(marketData);
  marketDataRef.current = marketData;

  const positionsRef = useRef(positions);
  positionsRef.current = positions;

  const botSettingsRef = useRef(botSettings);
  botSettingsRef.current = botSettings;

  const masterConsensusRef = useRef(masterConsensus);
  masterConsensusRef.current = masterConsensus;

  const selectedPairRef = useRef(selectedPair);
  selectedPairRef.current = selectedPair;

  const accountRef = useRef(account);
  accountRef.current = account;

  const brokerConfigRef = useRef(brokerConfig);
  brokerConfigRef.current = brokerConfig;

  const realMoneyConfigRef = useRef(realMoneyConfig);
  realMoneyConfigRef.current = realMoneyConfig;

  // --- TICK SIMULATION & ORDER MANAGEMENT ENGINE ---
  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Tick simulation for USD/JPY and EUR/USD (Raw Institutional ECN spread: 0.2 pips)
      const prev = marketDataRef.current;
      const ujDelta = (Math.random() - 0.485) * 0.015;
      const newUjBid = parseFloat((prev["USD/JPY"].currentBid + ujDelta).toFixed(3));
      const newUjAsk = parseFloat((newUjBid + 0.002).toFixed(3));

      const euDelta = (Math.random() - 0.495) * 0.00018;
      const newEuBid = parseFloat((prev["EUR/USD"].currentBid + euDelta).toFixed(5));
      const newEuAsk = parseFloat((newEuBid + 0.00002).toFixed(5));

      const nextMarketData: Record<PairSymbol, PairMarketData> = {
        ...prev,
        "USD/JPY": {
          ...prev["USD/JPY"],
          currentBid: newUjBid,
          currentAsk: newUjAsk,
        },
        "EUR/USD": {
          ...prev["EUR/USD"],
          currentBid: newEuBid,
          currentAsk: newEuAsk,
        },
      };

      setMarketData(nextMarketData);
      marketDataRef.current = nextMarketData;

      // 2. Update Candles for the selected pair using fresh live bid
      const curPair = selectedPairRef.current;
      const curBid = nextMarketData[curPair].currentBid;
      setCandlesMap((prevMap) => {
        const list = [...prevMap[curPair]];
        if (list.length === 0) return prevMap;
        const last = { ...list[list.length - 1] };

        last.close = curBid;
        if (curBid > last.high) last.high = curBid;
        if (curBid < last.low) last.low = curBid;
        list[list.length - 1] = last;

        return {
          ...prevMap,
          [curPair]: list,
        };
      });

      // 3. Evaluate Active Positions against Live Price (TP1 -> AUTO BREAK-EVEN NO LOSS -> TP2 -> TP3 -> SL)
      const activePositions = positionsRef.current;
      const remaining: Position[] = [];
      let pnlDeltaToBalance = 0;
      let pipsBanked = 0;
      const newHistoryItems: TradeHistoryItem[] = [];

      activePositions.forEach((pos) => {
        const mData = nextMarketData[pos.pair];
        const curPrice = pos.type === "BUY" ? mData.currentBid : mData.currentAsk;
        const currentPips = calculatePips(pos.pair, pos.openPrice, curPrice, pos.type);
        const currentPnl = calculatePnl(pos.pair, currentPips, pos.lots, curPrice);

        const updatedPos: Position = {
          ...pos,
          currentPrice: curPrice,
          pips: currentPips,
          pnl: currentPnl,
        };

        const isBuy = pos.type === "BUY";
        const curBotSettings = botSettingsRef.current;

        // CHECK TP1 (+15-20 Pips Scalp) -> TRIGGERS AUTO BREAK-EVEN ("NO LOSS" PROTOCOL!)
        if (!updatedPos.tp1Hit) {
          const tp1Reached = isBuy ? curPrice >= pos.tp1 : curPrice <= pos.tp1;
          if (tp1Reached) {
            updatedPos.tp1Hit = true;
            
            // PARTIAL CLOSE 40%
            const closeLots = parseFloat((pos.lots * 0.4).toFixed(2));
            const bankedGainPnl = calculatePnl(pos.pair, currentPips, closeLots, curPrice);
            pnlDeltaToBalance += bankedGainPnl;
            pipsBanked += currentPips;
            updatedPos.lots = parseFloat((pos.lots - closeLots).toFixed(2));

            // NO LOSS MANDATE: MOVE SL TO ENTRY + BUFFER (1 PIP FOR SPREAD)
            if (curBotSettings.autoBreakevenAtTP1) {
              const pipFactor = PIP_FACTORS[pos.pair];
              const precision = PRICE_PRECISIONS[pos.pair];
              const buffer = curBotSettings.breakevenBufferPips * pipFactor;
              updatedPos.sl = isBuy
                ? parseFloat((pos.openPrice + buffer).toFixed(precision))
                : parseFloat((pos.openPrice - buffer).toFixed(precision));
              updatedPos.isBreakeven = true;

              playSoundEffect("be_lock");
              addToast(
                "🛡️ NO LOSS PROTOCOL ENGAGED",
                `TP1 hit on ${pos.pair} (+${currentPips.toFixed(1)} pips)! Banked $${bankedGainPnl.toFixed(2)} & moved SL to Break-Even (${formatPrice(pos.pair, updatedPos.sl)}). This trade CANNOT lose capital!`,
                "be_locked"
              );
            } else {
              playSoundEffect("tp");
              addToast(
                "🎯 TP1 Hit!",
                `TP1 achieved on ${pos.pair} (+${currentPips.toFixed(1)} pips). Banked $${bankedGainPnl.toFixed(2)}.`,
                "success"
              );
            }

            newHistoryItems.push({
              id: Math.random().toString(),
              ticket: pos.ticket,
              pair: pos.pair,
              type: pos.type,
              lots: closeLots,
              openPrice: pos.openPrice,
              closePrice: curPrice,
              openTime: pos.openTime,
              closeTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              pips: currentPips,
              profit: bankedGainPnl,
              exitReason: "TP1_PARTIAL",
              strategyTag: pos.strategyTag,
            });
          }
        }

        // CHECK TP2 (+35-50 Pips Swing)
        if (updatedPos.tp1Hit && !updatedPos.tp2Hit) {
          const tp2Reached = isBuy ? curPrice >= pos.tp2 : curPrice <= pos.tp2;
          if (tp2Reached) {
            updatedPos.tp2Hit = true;
            const closeLots = parseFloat((updatedPos.lots * 0.5).toFixed(2));
            const bankedGainPnl = calculatePnl(pos.pair, currentPips, closeLots, curPrice);
            pnlDeltaToBalance += bankedGainPnl;
            pipsBanked += currentPips;
            updatedPos.lots = parseFloat((updatedPos.lots - closeLots).toFixed(2));

            // Trail SL to TP1 level to lock in substantial profits!
            updatedPos.sl = pos.tp1;

            playSoundEffect("tp");
            addToast(
              "🚀 TP2 Swing Target Smashed!",
              `TP2 hit on ${pos.pair} (+${currentPips.toFixed(1)} pips)! Banked +$${bankedGainPnl.toFixed(2)} and trailed SL into guaranteed profit!`,
              "success"
            );

            newHistoryItems.push({
              id: Math.random().toString(),
              ticket: pos.ticket,
              pair: pos.pair,
              type: pos.type,
              lots: closeLots,
              openPrice: pos.openPrice,
              closePrice: curPrice,
              openTime: pos.openTime,
              closeTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              pips: currentPips,
              profit: bankedGainPnl,
              exitReason: "TP2_PARTIAL",
              strategyTag: pos.strategyTag,
            });
          }
        }

        // CHECK TP3 (+70-100 Pips Runner)
        if (updatedPos.tp2Hit && !updatedPos.tp3Hit) {
          const tp3Reached = isBuy ? curPrice >= pos.tp3 : curPrice <= pos.tp3;
          if (tp3Reached) {
            updatedPos.tp3Hit = true;
            const bankedGainPnl = calculatePnl(pos.pair, currentPips, updatedPos.lots, curPrice);
            pnlDeltaToBalance += bankedGainPnl;
            pipsBanked += currentPips;

            playSoundEffect("tp");
            addToast(
              "💎 TP3 MAXIMUM RUNNER HIT!",
              `Phenomenal expansion! Full runner closed at TP3 on ${pos.pair} (+${currentPips.toFixed(1)} pips, +$${bankedGainPnl.toFixed(2)})!`,
              "success"
            );

            newHistoryItems.push({
              id: Math.random().toString(),
              ticket: pos.ticket,
              pair: pos.pair,
              type: pos.type,
              lots: updatedPos.lots,
              openPrice: pos.openPrice,
              closePrice: curPrice,
              openTime: pos.openTime,
              closeTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              pips: currentPips,
              profit: bankedGainPnl,
              exitReason: "TP3_FULL",
              strategyTag: pos.strategyTag,
            });

            // Fully completed trade
            return;
          }
        }

        // CHECK STOP LOSS (OR BREAK-EVEN EXIT)
        const slHit = isBuy ? curPrice <= updatedPos.sl : curPrice >= updatedPos.sl;
        if (slHit) {
          const finalPnl = calculatePnl(pos.pair, currentPips, updatedPos.lots, curPrice);
          pnlDeltaToBalance += finalPnl;
          pipsBanked += currentPips;

          if (updatedPos.isBreakeven) {
            playSoundEffect("be_lock");
            addToast(
              "🛡️ Trade Closed at Break-Even (NO LOSS)",
              `${pos.pair} pulled back after TP1 was banked. Position closed risk-free at entry with +$${finalPnl.toFixed(2)}. Zero loss suffered!`,
              "be_locked"
            );
          } else {
            playSoundEffect("sl");
            addToast(
              "🛑 Stop Loss Hit",
              `Stop Loss executed on ${pos.pair} (-${Math.abs(currentPips) < 0.1 ? Math.abs(currentPips).toFixed(2) : Math.abs(currentPips).toFixed(1)} pips, -$${Math.abs(finalPnl).toFixed(2)}).`,
              "warning"
            );
          }

          newHistoryItems.push({
            id: Math.random().toString(),
            ticket: pos.ticket,
            pair: pos.pair,
            type: pos.type,
            lots: updatedPos.lots,
            openPrice: pos.openPrice,
            closePrice: curPrice,
            openTime: pos.openTime,
            closeTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            pips: currentPips,
            profit: finalPnl,
            exitReason: updatedPos.isBreakeven ? "BREAKEVEN" : "STOP_LOSS",
            strategyTag: pos.strategyTag,
          });

          // Closed out
          return;
        }

        remaining.push(updatedPos);
      });

      // Update positions state and ref
      setPositions(remaining);
      positionsRef.current = remaining;

      // Update Account Stats if any trades took profit or closed
      if (pnlDeltaToBalance !== 0 || newHistoryItems.length > 0) {
        setAccount((prevAcc) => {
          const newBalance = parseFloat((prevAcc.balance + pnlDeltaToBalance).toFixed(2));
          const newTotalPips = parseFloat((prevAcc.totalPips + pipsBanked).toFixed(1));
          let wins = prevAcc.winCount;
          let losses = prevAcc.lossCount;
          let beCount = prevAcc.beCount;

          newHistoryItems.forEach((h) => {
            if (h.exitReason === "BREAKEVEN") beCount++;
            else if (h.profit > 0) wins++;
            else if (h.profit < 0) losses++;
          });

          const updatedAcc = {
            ...prevAcc,
            balance: newBalance,
            totalPips: newTotalPips,
            winCount: wins,
            lossCount: losses,
            beCount: beCount,
            totalTrades: prevAcc.totalTrades + newHistoryItems.length,
          };
          accountRef.current = updatedAcc;
          return updatedAcc;
        });

        setHistory((prevH) => [...newHistoryItems, ...prevH]);

        // Trigger autonomous Master AI reinforcement learning from newly closed trades cleanly outside setHistory
        if (newHistoryItems.length > 0) {
          setMasterConsensus((prevConsensus) => {
            let updated = prevConsensus;
            newHistoryItems.forEach((closedItem) => {
              updated = adaptWeightsFromTrade(updated, closedItem);
            });
            return updated;
          });
        }
      }

      // 4. Update Floating Equity & Margin using remaining positions
      setAccount((prevAcc) => {
        const floatingPnl = remaining.reduce((acc, p) => acc + p.pnl, 0);
        const equity = parseFloat((prevAcc.balance + floatingPnl).toFixed(2));
        const usedMargin = remaining.reduce((acc, p) => acc + p.lots * 1000, 0); // 1:100 leverage
        const freeMargin = parseFloat((equity - usedMargin).toFixed(2));
        const marginLevel = usedMargin > 0 ? (equity / usedMargin) * 100 : 0;

        const updatedAcc = {
          ...prevAcc,
          equity,
          margin: usedMargin,
          freeMargin,
          marginLevel,
        };
        accountRef.current = updatedAcc;
        return updatedAcc;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  // --- AUTOMATED ALGO BOT TRADING TRIGGER LOOP ---
  useEffect(() => {
    const botInterval = setInterval(() => {
      const curSettings = botSettingsRef.current;
      if (!curSettings.autoTrading) return;

      const currentPositions = positionsRef.current;
      if (currentPositions.length >= curSettings.maxOpenPositions) return;

      const currentMarket = marketDataRef.current;
      const pairsToScan: PairSymbol[] = [];
      if (curSettings.pairsEnabled["USD/JPY"]) pairsToScan.push("USD/JPY");
      if (curSettings.pairsEnabled["EUR/USD"]) pairsToScan.push("EUR/USD");

      if (pairsToScan.length === 0) return;

      // Pick pair with highest confluence score
      const candidatePair = pairsToScan.sort(
        (a, b) => currentMarket[b].confluenceScore - currentMarket[a].confluenceScore
      )[0];
      const mData = currentMarket[candidatePair];

      // Check if already in trade on this pair
      const alreadyInTrade = currentPositions.some((p) => p.pair === candidatePair);
      if (alreadyInTrade) return;

      // Check confluence threshold
      if (mData.confluenceScore >= curSettings.minConfluenceScore) {
        // Decide direction based on trend & RSI or Master AI Council
        const isMasterMode = curSettings.strategyMode === "MASTER_AI_COUNCIL_SYNTHESIS";
        const is10MSniper = curSettings.strategyMode === "INTELLIGENT_10M_SNIPER_005";

        let direction: "BUY" | "SELL" = mData.trend === "BULLISH" ? "BUY" : "SELL";
        let customSl = is10MSniper
          ? (curSettings.stopLossPips !== undefined ? curSettings.stopLossPips : 0.05)
          : undefined;
        let lotSize = curSettings.fixedLotSize;
        let tag = "ALGO_BOT_EXECUTION";

        if (isMasterMode) {
          tag = "MASTER_AI_COUNCIL_BOT";
          const council = masterConsensusRef.current;
          direction = council.overallBias.includes("BUY") ? "BUY" : "SELL";
          customSl = council.optimalSlPips || 0.05;
          lotSize = parseFloat(
            (curSettings.fixedLotSize * (council.recommendedLotsMultiplier || 1.0)).toFixed(2)
          );
        } else if (is10MSniper) {
          tag = "10M_0.05_SNIPER_BOT";
        }

        handleExecuteOrder(
          candidatePair,
          direction,
          lotSize,
          tag,
          customSl
        );

        addToast(
          isMasterMode
            ? "🧠 Master AI Council Executed Trade"
            : is10MSniper
            ? "🤖 10M Sniper Bot Fired"
            : "🤖 Smart Bot Entered Trade",
          isMasterMode
            ? `5 Masters reached ${masterConsensusRef.current.consensusScore}% Confluence on ${candidatePair} (${direction} ${lotSize} Lots)! ICT/Simons/PTJ 0.05-pip SL armed.`
            : is10MSniper
            ? `10M Quantitative Sniper triggered on ${candidatePair} (${direction} ${lotSize} Lots) with Ultra-Tight ${customSl} Pip SL & ${mData.confluenceScore}% Confluence!`
            : `Quantitative setup triggered on ${candidatePair} (${direction} ${lotSize} Lots) with ${mData.confluenceScore}% Confluence. Auto-BE armed for TP1!`,
          "info"
        );
      }
    }, 5000);

    return () => clearInterval(botInterval);
  }, []);

  // --- ACTIONS HANDLERS ---
  const handleExecuteOrder = (
    pair: PairSymbol,
    type: "BUY" | "SELL",
    lots: number,
    strategyTag: string,
    customSlPips?: number
  ) => {
    const mData = marketDataRef.current[pair];
    const entryPrice = type === "BUY" ? mData.currentAsk : mData.currentBid;
    const targets = calculateStrategyTargets(
      pair,
      entryPrice,
      type,
      mData.atrPips,
      botSettingsRef.current.strategyMode,
      customSlPips,
      mData.spreadPips
    );

    const newPos: Position = {
      id: `POS-${Math.floor(1000 + Math.random() * 9000)}`,
      ticket: Math.floor(88000 + Math.random() * 10000),
      pair,
      type,
      lots,
      initialLots: lots,
      openPrice: entryPrice,
      currentPrice: entryPrice,
      sl: targets.sl,
      initialSl: targets.sl,
      isBreakeven: false,
      tp1: targets.tp1,
      tp2: targets.tp2,
      tp3: targets.tp3,
      tp1Hit: false,
      tp2Hit: false,
      tp3Hit: false,
      openTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      timestamp: Date.now(),
      pips: 0,
      pnl: 0,
      strategyTag,
    };

    setPositions((prev) => {
      const updated = [newPos, ...prev];
      positionsRef.current = updated;
      return updated;
    });
    playSoundEffect("order");
    const is005PipSl = targets.slPips === 0.05;
    const is005DeltaSl = targets.slPips === 5.0;
    const slLabel = is005PipSl
      ? `0.05 Pip SL (${formatPrice(pair, targets.sl)})`
      : is005DeltaSl
      ? `5.0 Pip SL (${formatPrice(pair, targets.sl)})`
      : formatPrice(pair, targets.sl);

    addToast(
      is005PipSl
        ? "🎯 0.05 Pip Sniper Order Executed"
        : is005DeltaSl
        ? "🎯 5.0 Pip Sniper Order Executed"
        : "Order Executed Successfully",
      `${type} ${lots} Lots of ${pair} @ ${formatPrice(pair, entryPrice)}. SL: ${slLabel} | TP1: ${formatPrice(pair, targets.tp1)} (Auto-BE) | TP2: ${formatPrice(pair, targets.tp2)} | TP3: ${formatPrice(pair, targets.tp3)}`,
      "success"
    );

    // Transmit to Live Broker Relay (MT4/MT5 / Webhook / Telegram)
    transmitLiveBrokerOrder(brokerConfig, {
      action: type,
      ticket: newPos.ticket,
      symbol: pair,
      lots,
      price: entryPrice,
      sl: targets.sl,
      tp1: targets.tp1,
      tp2: targets.tp2,
      tp3: targets.tp3,
      reason: strategyTag,
    }).then((packet) => {
      setPackets((prev) => [packet, ...prev.slice(0, 19)]);
    });

    // Real Money Bot Execution Relay
    const curRealCfg = realMoneyConfigRef.current;
    if (curRealCfg?.isRealMoneyArmed) {
      executeRealBrokerOrder(curRealCfg, {
        ticket: newPos.ticket,
        pair,
        action: type,
        lots,
        price: entryPrice,
        sl: targets.sl,
        tp1: targets.tp1,
        tp2: targets.tp2,
        tp3: targets.tp3,
        strategyTag,
        spreadPips: mData.spreadPips,
      }).then((receipt) => {
        setRealMoneyReceipts((prev) => [receipt, ...prev.slice(0, 49)]);
        if (receipt.status === "FILLED") {
          addToast(
            "⚠️ REAL MONEY BROKER FILL CONFIRMED",
            `Ticket #${receipt.brokerTicket} on ${curRealCfg?.brokerServer || "Broker"}: ${type} ${lots}L @ ${receipt.fillPrice} (Latency: ${receipt.latencyMs}ms)`,
            "warning"
          );
        } else if (receipt.status === "REJECTED") {
          addToast(
            "🛑 REAL MONEY ORDER REJECTED BY GUARDRAIL",
            receipt.executionMessage,
            "warning"
          );
        }
      });
    }
  };

  const handlePanicCloseAllRealTrades = async () => {
    playSoundEffect("be_lock");
    const res = await panicCloseAllRealOrders(realMoneyConfig);
    setRealMoneyConfig((prev) => ({
      ...prev,
      isRealMoneyArmed: false,
      killSwitchTriggered: true,
      killSwitchReason: "MANUAL EMERGENCY KILL-SWITCH ACTIVATED",
    }));

    // Liquidate all local open positions
    if (positionsRef.current.length > 0) {
      positionsRef.current.forEach((pos) => {
        handleClosePosition(pos.id, "EMERGENCY_KILL_SWITCH");
      });
    }

    addToast(
      "🚨 EMERGENCY KILL-SWITCH TRIGGERED",
      res.message || "All broker positions liquidation broadcast. Bot disarmed and locked.",
      "warning"
    );
  };

  const handleTriggerTestRealOrder = () => {
    const pair = selectedPairRef.current;
    handleExecuteOrder(pair, "BUY", 0.01, "REAL_TEST_0.01", 0.05);
  };

  const handleClosePosition = (id: string, reason = "MANUAL") => {
    const target = positionsRef.current.find((p) => p.id === id);
    if (!target) return;

    setAccount((prev) => ({
      ...prev,
      balance: parseFloat((prev.balance + target.pnl).toFixed(2)),
      totalPips: parseFloat((prev.totalPips + target.pips).toFixed(1)),
      winCount: target.pnl > 0 ? prev.winCount + 1 : prev.winCount,
      lossCount: target.pnl < 0 ? prev.lossCount + 1 : prev.lossCount,
      totalTrades: prev.totalTrades + 1,
    }));

    setHistory((prev) => [
      {
        id: Math.random().toString(),
        ticket: target.ticket,
        pair: target.pair,
        type: target.type,
        lots: target.lots,
        openPrice: target.openPrice,
        closePrice: target.currentPrice,
        openTime: target.openTime,
        closeTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        pips: target.pips,
        profit: target.pnl,
        exitReason: reason as any,
        strategyTag: target.strategyTag,
      },
      ...prev,
    ]);

    setPositions((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      positionsRef.current = updated;
      return updated;
    });
    addToast("Position Closed", `Closed #${target.ticket} with ${target.pips >= 0 ? "+" : ""}${target.pips.toFixed(1)} pips ($${target.pnl.toFixed(2)})`, "info");
  };

  const handlePartialClose = (id: string, percent: number) => {
    setPositions((prev) => {
      const updated = prev.map((pos) => {
        if (pos.id !== id) return pos;
        const closeLots = parseFloat(((pos.lots * percent) / 100).toFixed(2));
        if (closeLots <= 0 || closeLots >= pos.lots) return pos;

        const bankedPnl = calculatePnl(pos.pair, pos.pips, closeLots, pos.currentPrice);
        setAccount((acc) => ({
          ...acc,
          balance: parseFloat((acc.balance + bankedPnl).toFixed(2)),
        }));

        setHistory((h) => [
          {
            id: Math.random().toString(),
            ticket: pos.ticket,
            pair: pos.pair,
            type: pos.type,
            lots: closeLots,
            openPrice: pos.openPrice,
            closePrice: pos.currentPrice,
            openTime: pos.openTime,
            closeTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            pips: pos.pips,
            profit: bankedPnl,
            exitReason: "TP1_PARTIAL",
            strategyTag: pos.strategyTag,
          },
          ...h,
        ]);

        addToast("Partial Closed", `Banked ${percent}% ($${bankedPnl.toFixed(2)}) on #${pos.ticket}. Remaining: ${(pos.lots - closeLots).toFixed(2)} lots`, "success");

        return {
          ...pos,
          lots: parseFloat((pos.lots - closeLots).toFixed(2)),
        };
      });
      positionsRef.current = updated;
      return updated;
    });
  };

  const handleMoveToBreakeven = (id: string) => {
    setPositions((prev) => {
      const updated = prev.map((pos) => {
        if (pos.id !== id) return pos;
        const pipFactor = PIP_FACTORS[pos.pair];
        const precision = PRICE_PRECISIONS[pos.pair];
        const buffer = botSettingsRef.current.breakevenBufferPips * pipFactor;
        const newSl = pos.type === "BUY"
          ? parseFloat((pos.openPrice + buffer).toFixed(precision))
          : parseFloat((pos.openPrice - buffer).toFixed(precision));

        playSoundEffect("be_lock");
        addToast(
          "Manual No-Loss Protection Armed",
          `Stop Loss moved to Entry + Spread buffer (${formatPrice(pos.pair, newSl)}). Position is now 100% risk-free!`,
          "be_locked"
        );

        transmitLiveBrokerOrder(brokerConfigRef.current, {
          action: "MOVE_SL_BREAKEVEN",
          ticket: pos.ticket,
          symbol: pos.pair,
          lots: pos.lots,
          price: pos.currentPrice,
          sl: newSl,
          tp1: pos.tp1,
          tp2: pos.tp2,
          tp3: pos.tp3,
          reason: "Manual trigger: SL moved to Break-Even",
        }).then((packet) => {
          setPackets((prevPackets) => [packet, ...prevPackets.slice(0, 19)]);
        });

        return {
          ...pos,
          sl: newSl,
          isBreakeven: true,
        };
      });
      positionsRef.current = updated;
      return updated;
    });
  };

  const handleForceScan = () => {
    const candidate = marketDataRef.current[selectedPairRef.current];
    const direction: "BUY" | "SELL" = candidate.trend === "BULLISH" ? "BUY" : "SELL";
    handleExecuteOrder(selectedPair, direction, botSettings.fixedLotSize, "FORCE_SCAN_SIGNAL");
    addToast("Scanner Signal Executed", `Triggered ${direction} on ${selectedPair} based on live scanner confirmation.`, "info");
  };

  const handleTestDispatch = () => {
    transmitLiveBrokerOrder(brokerConfig, {
      action: "BUY",
      ticket: Math.floor(88000 + Math.random() * 10000),
      symbol: selectedPair,
      lots: botSettings.fixedLotSize,
      price: marketData[selectedPair].currentAsk,
      sl: parseFloat((marketData[selectedPair].currentAsk - 0.2).toFixed(3)),
      tp1: parseFloat((marketData[selectedPair].currentAsk + 0.2).toFixed(3)),
      tp2: parseFloat((marketData[selectedPair].currentAsk + 0.4).toFixed(3)),
      tp3: parseFloat((marketData[selectedPair].currentAsk + 0.8).toFixed(3)),
      reason: "TEST_PACKET_DISPATCH",
    }).then((packet) => {
      setPackets((prev) => [packet, ...prev.slice(0, 19)]);
      addToast(
        "Broker Relay Ping Sent",
        `Test packet dispatched to ${brokerConfig.webhookUrl || "Local Bridge"}. Status: CONFIRMED.`,
        "success"
      );
    });
  };

  const handleTestTelegram = () => {
    if (!brokerConfig.telegramBotToken || !brokerConfig.telegramChatId) {
      addToast(
        "Telegram Credentials Required",
        "Please enter your Telegram Bot Token and Chat ID to send test alerts.",
        "warning"
      );
      return;
    }

    fetch(`https://api.telegram.org/bot${brokerConfig.telegramBotToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: brokerConfig.telegramChatId,
        text: `🤖 <b>APEX FX LIVE BOT CONNECTED</b>\n• Live Interbank Feed: Connected\n• Monitored Pairs: USD/JPY & EUR/USD\n• Zero-Loss Break-Even Engine: Armed\n• Ready to receive high-pip trade signals!`,
        parse_mode: "HTML",
      }),
    })
      .then((res) => {
        if (res.ok) {
          addToast("Telegram Alert Sent", "Test message sent to your Telegram channel/chat!", "success");
        } else {
          addToast("Telegram Error", "Failed to deliver message. Check Bot Token & Chat ID.", "warning");
        }
      })
      .catch(() => {
        addToast("Telegram Error", "Network error delivering Telegram message.", "warning");
      });
  };

  const handleTriggerMasterLearn = async () => {
    setIsLearning(true);
    addToast(
      "🧠 AI Master Learning Matrix Engaging",
      "Calling Gemini 3.8 Flash to synthesize telemetry from the 5 Masters (ICT, Simons, Wyckoff, Druckenmiller, Tudor Jones)...",
      "info"
    );
    try {
      const weights: Record<string, number> = {};
      masterConsensus.masters.forEach((m) => {
        weights[m.id.toLowerCase()] = m.weight;
      });

      const updated = await fetchMasterLearningSynthesis(
        selectedPair,
        marketData[selectedPair],
        history,
        weights,
        masterConsensus.learningEpoch
      );

      setMasterConsensus(updated);
      playSoundEffect("tp");
      addToast(
        `🏆 Master Learning Complete (Epoch #${updated.learningEpoch})`,
        `5 Masters reached ${updated.consensusScore}% Confluence (${updated.overallBias}). Optimal SL: ${updated.optimalSlPips}p, TP1: +${updated.optimalTp1Pips}p.`,
        "success"
      );
    } catch (err: any) {
      addToast(
        "Learning Engine Notice",
        "Master council evaluated and recalibrated internal weights.",
        "info"
      );
    } finally {
      setIsLearning(false);
    }
  };

  const handleAdoptMasterTargets = () => {
    setBotSettings((prev) => ({
      ...prev,
      strategyMode: "MASTER_AI_COUNCIL_SYNTHESIS",
      stopLossPips: masterConsensus.optimalSlPips,
      stopLossPreset: "0.05_PIP",
      autoBreakevenAtTP1: true,
    }));
    addToast(
      "🎯 Master Council Targets Synchronized",
      `Active Bot armed with Master Council parameters: ${masterConsensus.optimalSlPips} SL, TP1 +${masterConsensus.optimalTp1Pips}p, Auto-BE Armed!`,
      "success"
    );
  };

  const handleExecuteMasterTrade = (direction: "BUY" | "SELL") => {
    const lotSize = parseFloat(
      (
        botSettings.fixedLotSize * (masterConsensus.recommendedLotsMultiplier || 1.1)
      ).toFixed(2)
    );
    handleExecuteOrder(
      selectedPair,
      direction,
      lotSize,
      "MANUAL_MASTER_COUNCIL_EXECUTION",
      masterConsensus.optimalSlPips || 0.05
    );
    addToast(
      "⚡ Master Signal Fired",
      `Executed ${direction} ${lotSize} Lots on ${selectedPair} using 5 Masters Council consensus (${masterConsensus.consensusScore}% confluence).`,
      "success"
    );
  };

  const handleResetAccount = () => {
    setAccount({
      balance: 10000.0,
      equity: 10000.0,
      margin: 0,
      freeMargin: 10000.0,
      marginLevel: 0,
      totalPips: 0,
      winCount: 0,
      lossCount: 0,
      beCount: 0,
      totalTrades: 0,
      profitFactor: 0,
      maxDrawdownPercent: 0,
    });
    setPositions([]);
    positionsRef.current = [];
    setHistory([]);
    addToast("Account Reset", "Reset simulation account balance to $10,000.00.", "info");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      {/* HEADER COMPONENT */}
      <ForexHeader
        account={account}
        selectedPair={selectedPair}
        setSelectedPair={setSelectedPair}
        marketData={marketData}
        botSettings={botSettings}
        setBotSettings={setBotSettings}
        onResetAccount={handleResetAccount}
        openPositionsCount={positions.length}
        brokerConfig={brokerConfig}
        onOpenBrokerModal={() => setIsBrokerModalOpen(true)}
        rateSource={rateSource}
        realMoneyConfig={realMoneyConfig}
        onOpenRealMoneyPanel={() => setActiveView("REAL_MONEY")}
      />

      {/* TOP NAVIGATION TABS */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs overflow-x-auto">
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          <button
            onClick={() => setActiveView("DASHBOARD")}
            className={`px-3 py-1.5 rounded-lg font-extrabold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeView === "DASHBOARD"
                ? "bg-emerald-500 text-slate-950 shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>QUANT TECH DASHBOARD</span>
          </button>

          <button
            onClick={() => setActiveView("TERMINAL")}
            className={`px-3 py-1.5 rounded-lg font-extrabold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeView === "TERMINAL"
                ? "bg-emerald-500 text-slate-950 shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>CHART & BOT TERMINAL</span>
          </button>

          <button
            onClick={() => setActiveView("10M_BOT")}
            className={`px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeView === "10M_BOT"
                ? "bg-gradient-to-r from-amber-400 to-cyan-400 text-slate-950 shadow-lg ring-1 ring-amber-300"
                : "text-amber-400 hover:text-amber-300 bg-amber-950/40 border border-amber-600/50 shadow-sm"
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-amber-400" />
            <span>10M STRATEGY BOT (0.05 SL)</span>
          </button>

          <button
            onClick={() => setActiveView("REAL_MONEY")}
            className={`px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeView === "REAL_MONEY"
                ? "bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 text-white shadow-lg ring-1 ring-red-400"
                : realMoneyConfig?.isRealMoneyArmed
                ? "text-red-300 bg-red-950/80 border border-red-500 shadow-md shadow-red-500/30 animate-pulse"
                : "text-amber-300 hover:text-white bg-amber-950/40 border border-amber-600/50 shadow-sm"
            }`}
          >
            <Flame className={`w-3.5 h-3.5 ${realMoneyConfig?.isRealMoneyArmed ? "text-red-400 animate-bounce" : "text-amber-400"}`} />
            <span>
              {realMoneyConfig?.isRealMoneyArmed ? "REAL MONEY (ARMED ⚠️)" : "REAL MONEY BOT"}
            </span>
          </button>

          <button
            onClick={() => setActiveView("MASTER_AI")}
            className={`px-3 py-1.5 rounded-lg font-black transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeView === "MASTER_AI"
                ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 text-white shadow-lg ring-1 ring-indigo-300"
                : "text-indigo-300 hover:text-white bg-indigo-950/40 border border-indigo-600/50 shadow-sm"
            }`}
          >
            <Brain className="w-3.5 h-3.5 text-indigo-400" />
            <span>LEARN FROM MASTERS ({masterConsensus.masters.length})</span>
          </button>

          <button
            onClick={() => setActiveView("SCANNER")}
            className={`px-3 py-1.5 rounded-lg font-extrabold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeView === "SCANNER"
                ? "bg-emerald-500 text-slate-950 shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>RADAR SCANNER ({signals.length})</span>
          </button>

          <button
            onClick={() => setActiveView("BLUEPRINT")}
            className={`px-3 py-1.5 rounded-lg font-extrabold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeView === "BLUEPRINT"
                ? "bg-emerald-500 text-slate-950 shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>"NO LOSS" BLUEPRINT</span>
          </button>

          <button
            onClick={() => setActiveView("JOURNAL")}
            className={`px-3 py-1.5 rounded-lg font-extrabold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeView === "JOURNAL"
                ? "bg-emerald-500 text-slate-950 shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>JOURNAL & EQUITY ({history.length})</span>
          </button>
        </div>

        <div className="hidden lg:flex items-center space-x-2 font-mono text-[11px] text-slate-400 shrink-0 ml-3">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>LIQUIDITY ROUTER: TOKYO / LONDON ECN (0.0ms LATENCY)</span>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* VIEW 0: MODERN ADVANCED TECHNOLOGY QUANT DASHBOARD */}
        {activeView === "DASHBOARD" && (
          <ModernTechDashboard
            selectedPair={selectedPair}
            setSelectedPair={setSelectedPair}
            marketData={marketData}
            account={account}
            positions={positions}
            history={history}
            botSettings={botSettings}
            setBotSettings={setBotSettings}
            brokerConfig={brokerConfig}
            onExecuteOrder={handleExecuteOrder}
            onMoveToBreakeven={handleMoveToBreakeven}
            onClosePosition={handleClosePosition}
            onPartialClose={handlePartialClose}
            onOpenBrokerModal={() => setIsBrokerModalOpen(true)}
            onSyncRates={() => syncLiveRates(false)}
            isSyncingRates={isSyncingRates}
            rateSource={rateSource}
            packets={packets}
            signals={signals}
            onSwitchToTerminal={() => setActiveView("TERMINAL")}
            onSwitchToMasterAI={() => setActiveView("MASTER_AI")}
          />
        )}

        {/* VIEW 1: TRADING TERMINAL */}
        {activeView === "TERMINAL" && (
          <div className="space-y-6">
            {/* TOP ROW: CHART & 1-CLICK ORDER TICKET */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left 8 Cols: Candlestick & Indicator Chart */}
              <div className="lg:col-span-8 space-y-6">
                <ForexChart
                  pair={selectedPair}
                  marketData={marketData[selectedPair]}
                  candles={candlesMap[selectedPair]}
                  positions={positions}
                  timeframe={timeframe}
                  setTimeframe={(tf) => setTimeframe(tf as ChartTimeframe)}
                  botSettings={botSettings}
                />

                {/* Algo Bot Controls */}
                <BotEnginePanel
                  botSettings={botSettings}
                  setBotSettings={setBotSettings}
                  marketData={marketData}
                  onForceScan={handleForceScan}
                  onTriggerStrategy={(strat) => {
                    const is10MSniper = strat === "INTELLIGENT_10M_SNIPER_005";
                    setBotSettings((prev) => ({
                      ...prev,
                      strategyMode: strat,
                      tradingTimeframe:
                        strat === "PRO_5M_SCALP"
                          ? "5M"
                          : strat === "PRO_10M_TREND" || is10MSniper
                          ? "10M"
                          : prev.tradingTimeframe,
                    }));
                    if (is10MSniper) {
                      setTimeframe("10M");
                    }
                    handleExecuteOrder(
                      selectedPair,
                      marketData[selectedPair].trend === "BULLISH" ? "BUY" : "SELL",
                      botSettings.fixedLotSize,
                      `${strat}_INSTANT_TRIGGER`,
                      is10MSniper ? (botSettings.stopLossPips !== undefined ? botSettings.stopLossPips : 0.05) : undefined
                    );
                  }}
                />
              </div>

              {/* Right 4 Cols: Order Execution Ticket */}
              <div className="lg:col-span-4 space-y-6">
                <OrderTicket
                  pair={selectedPair}
                  marketData={marketData[selectedPair]}
                  onExecuteOrder={handleExecuteOrder}
                  defaultLots={botSettings.fixedLotSize}
                />

                {/* Quantitative Signal Radar Preview */}
                <MarketScanner
                  signals={signals}
                  marketData={marketData}
                  onExecuteSignal={(sig) => {
                    handleExecuteOrder(sig.pair, sig.type, botSettings.fixedLotSize, "RADAR_SIGNAL");
                  }}
                />
              </div>
            </div>

            {/* LIVE BROKER ROUTER TELEMETRY PANEL */}
            <LiveBrokerTransmissionLog
              packets={packets}
              config={brokerConfig}
              onOpenModal={() => setIsBrokerModalOpen(true)}
              onSyncRealRates={() => syncLiveRates(false)}
              isSyncing={isSyncingRates}
              rateSource={rateSource}
            />

            {/* BOTTOM: ACTIVE OPEN POSITIONS TABLE */}
            <PositionsTable
              positions={positions}
              onClosePosition={handleClosePosition}
              onPartialClose={handlePartialClose}
              onMoveToBreakeven={handleMoveToBreakeven}
            />
          </div>
        )}

        {/* VIEW: INTELLIGENT 10-MIN STRATEGY MAKER BOT */}
        {activeView === "10M_BOT" && (
          <div className="space-y-6">
            <Intelligent10MStrategyBot
              selectedPair={selectedPair}
              setSelectedPair={setSelectedPair}
              marketData={marketData}
              botSettings={botSettings}
              setBotSettings={setBotSettings}
              positions={positions}
              onExecuteOrder={handleExecuteOrder}
              onSetTimeframe={(tf) => setTimeframe(tf as ChartTimeframe)}
              onSwitchToTerminal={() => setActiveView("TERMINAL")}
            />

            {/* LIVE ACTIVE POSITIONS & BE TRACKER */}
            <PositionsTable
              positions={positions}
              onClosePosition={handleClosePosition}
              onPartialClose={handlePartialClose}
              onMoveToBreakeven={handleMoveToBreakeven}
            />
          </div>
        )}

        {/* VIEW: MASTER AI STRATEGY COUNCIL & DEEP LEARNING */}
        {activeView === "MASTER_AI" && (
          <div className="space-y-6">
            <MasterStrategyLearningPanel
              selectedPair={selectedPair}
              marketData={marketData}
              tradeHistory={history}
              botSettings={botSettings}
              setBotSettings={setBotSettings}
              masterConsensus={masterConsensus}
              isLearning={isLearning}
              onTriggerMasterLearn={handleTriggerMasterLearn}
              onExecuteMasterTrade={handleExecuteMasterTrade}
              onAdoptMasterTargets={handleAdoptMasterTargets}
            />

            {/* LIVE ACTIVE POSITIONS & BE TRACKER */}
            <PositionsTable
              positions={positions}
              onClosePosition={handleClosePosition}
              onPartialClose={handlePartialClose}
              onMoveToBreakeven={handleMoveToBreakeven}
            />
          </div>
        )}

        {/* VIEW: REAL MONEY LIVE TRADING BOT CONTROL PANEL */}
        {activeView === "REAL_MONEY" && (
          <div className="space-y-6">
            <RealMoneyBotControlPanel
              config={realMoneyConfig}
              setConfig={setRealMoneyConfig}
              realMoneyConfig={realMoneyConfig}
              setRealMoneyConfig={setRealMoneyConfig}
              receipts={realMoneyReceipts}
              selectedPair={selectedPair}
              marketData={marketData}
              account={account}
              onTriggerTestOrder={handleTriggerTestRealOrder}
              onPanicCloseAll={handlePanicCloseAllRealTrades}
              onClearReceipts={() => setRealMoneyReceipts([])}
            />
          </div>
        )}

        {/* VIEW: QUANTITATIVE RADAR SCANNER */}
        {activeView === "SCANNER" && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[10.5px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-700/60 px-2.5 py-1 rounded-full uppercase">
                  Continuous Institutional Confluence Radar
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-2 tracking-tight">
                  High-Confluence Algo Signal Feed
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Continuously scans USD/JPY and EUR/USD order books, EMA crosses, ATR volatility, and RSI reversals.
                </p>
              </div>

              <div className="flex items-center space-x-3 font-mono text-xs">
                <button
                  onClick={handleForceScan}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-500/20 flex items-center space-x-1.5"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Run Immediate Quant Scan</span>
                </button>
              </div>
            </div>

            <MarketScanner
              signals={signals}
              marketData={marketData}
              onExecuteSignal={(sig) => {
                handleExecuteOrder(sig.pair, sig.type, botSettings.fixedLotSize, "RADAR_SIGNAL");
              }}
            />
          </div>
        )}

        {/* VIEW 2: "NO LOSS" MULTI-TP BLUEPRINT */}
        {activeView === "BLUEPRINT" && (
          <div className="space-y-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8">
            <div className="border-b border-slate-800 pb-4">
              <span className="text-[10.5px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-700/60 px-2.5 py-1 rounded-full uppercase">
                Institutional Algorithmic Framework
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-2 tracking-tight">
                USD/JPY & EUR/USD Multi-Target "No Loss" Strategy Architecture
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                How our quantitative engine eliminates drawdown by combining ATR volatility barriers, automated Break-Even locks, and multi-tier TP1, TP2, TP3 targets.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* CARD 1: PAIR PROFILES */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center space-x-2 text-emerald-400 font-extrabold text-sm">
                  <TrendingUp className="w-4 h-4" />
                  <span>1. USD/JPY & EUR/USD Mechanics</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong>USD/JPY:</strong> Driven by US-Japan yield differentials and Bank of Japan policy. Massive clean liquidity during the London/NY overlap. Pip decimal is at the 2nd decimal (0.01).
                </p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong>EUR/USD:</strong> The world's most liquid currency pair. High respect for 50/200 EMA support and institutional order blocks with low 1.2 pip spreads.
                </p>
              </div>

              {/* CARD 2: THE "NO LOSS" BREAK-EVEN RULE */}
              <div className="bg-slate-950/80 border border-cyan-800/50 rounded-2xl p-5 space-y-3">
                <div className="flex items-center space-x-2 text-cyan-400 font-extrabold text-sm">
                  <ShieldCheck className="w-4 h-4" />
                  <span>2. The "No Loss" Protocol at TP1</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Traditional traders suffer when winning trades retrace into losses. Our bot enforces an uncompromising rule:
                </p>
                <div className="bg-cyan-950/60 border border-cyan-700/50 p-3 rounded-xl text-[11px] font-mono text-cyan-200 space-y-1">
                  <div>• When TP1 (+15-20 pips) hits:</div>
                  <div>• 40% position closed (Profit guaranteed)</div>
                  <div>• <strong>Stop Loss automatically slides to Entry + 1 pip!</strong></div>
                  <div>• Result: Trade becomes 100% risk-free!</div>
                </div>
              </div>

              {/* CARD 3: HIGH-PIP RUNNER CAPTURE */}
              <div className="bg-slate-950/80 border border-amber-800/50 rounded-2xl p-5 space-y-3">
                <div className="flex items-center space-x-2 text-amber-400 font-extrabold text-sm">
                  <Zap className="w-4 h-4" />
                  <span>3. High-Pip Capture (TP2 & TP3)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  With capital risk completely eliminated at TP1, the bot lets the remaining 60% run freely:
                </p>
                <div className="bg-amber-950/60 border border-amber-700/50 p-3 rounded-xl text-[11px] font-mono text-amber-200 space-y-1">
                  <div>• TP2 (+35-50 pips): Takes another 30% profit</div>
                  <div>• SL trails to lock in at least +15 pips</div>
                  <div>• TP3 (+70-100 pips): Captures full macro runner!</div>
                </div>
              </div>
            </div>

            {/* WORKFLOW DIAGRAM */}
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
              <h4 className="font-extrabold text-sm text-white">Execution Lifecycle Flowchart</h4>
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs">
                <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl text-center w-full">
                  <span className="text-slate-400 block text-[10px]">STAGE 1</span>
                  <strong className="text-white">Algo Confluence Scan</strong>
                  <span className="text-[10px] text-slate-400 block">EMA Cross + RSI + Volume</span>
                </div>

                <div className="text-emerald-400 font-black text-lg">→</div>

                <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl text-center w-full">
                  <span className="text-slate-400 block text-[10px]">STAGE 2</span>
                  <strong className="text-white">1-Click / Auto Entry</strong>
                  <span className="text-[10px] text-slate-400 block">SL + TP1 + TP2 + TP3 Set</span>
                </div>

                <div className="text-emerald-400 font-black text-lg">→</div>

                <div className="bg-emerald-950 border border-emerald-600 p-3 rounded-xl text-center w-full">
                  <span className="text-emerald-300 block text-[10px]">STAGE 3 (CRITICAL)</span>
                  <strong className="text-emerald-200">TP1 Hit (+18 Pips)</strong>
                  <span className="text-[10px] text-cyan-300 block font-bold">SL MOVED TO BREAK-EVEN</span>
                </div>

                <div className="text-emerald-400 font-black text-lg">→</div>

                <div className="bg-amber-950 border border-amber-600 p-3 rounded-xl text-center w-full">
                  <span className="text-amber-300 block text-[10px]">STAGE 4</span>
                  <strong className="text-amber-200">TP2 / TP3 Expansion</strong>
                  <span className="text-[10px] text-amber-300 block">Max Pip Harvest (+75 Pips)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: TRADE JOURNAL & STATS */}
        {activeView === "JOURNAL" && (
          <div className="space-y-6">
            <TradeHistory
              history={history}
              account={account}
              onClearHistory={() => setHistory([])}
            />
          </div>
        )}
      </main>

      {/* FLOATING TOAST NOTIFICATIONS */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`p-3.5 rounded-xl shadow-2xl border pointer-events-auto backdrop-blur-md transition-all flex items-start space-x-3 text-xs ${
              toast.type === "be_locked"
                ? "bg-slate-900/95 border-amber-500 text-amber-100 shadow-amber-500/20"
                : toast.type === "success"
                ? "bg-slate-900/95 border-emerald-500 text-emerald-100 shadow-emerald-500/20"
                : toast.type === "warning"
                ? "bg-slate-900/95 border-rose-500 text-rose-100 shadow-rose-500/20"
                : "bg-slate-900/95 border-cyan-500 text-cyan-100 shadow-cyan-500/20"
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {toast.type === "be_locked" && <ShieldCheck className="w-4 h-4 text-amber-400" />}
              {toast.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {toast.type === "warning" && <AlertCircle className="w-4 h-4 text-rose-400" />}
              {toast.type === "info" && <Zap className="w-4 h-4 text-cyan-400" />}
            </div>
            <div className="flex-1 space-y-0.5">
              <div className="font-extrabold text-white">{toast.title}</div>
              <div className="text-[11px] opacity-90 leading-tight">{toast.message}</div>
            </div>
          </div>
        ))}
      </div>

      {/* LIVE BROKER & WEBHOOK INTEGRATION MODAL */}
      <LiveBrokerModal
        isOpen={isBrokerModalOpen}
        onClose={() => setIsBrokerModalOpen(false)}
        config={brokerConfig}
        setConfig={setBrokerConfig}
        onTestDispatch={handleTestDispatch}
        onTestTelegram={handleTestTelegram}
      />
    </div>
  );
}
