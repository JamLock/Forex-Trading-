import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory cache for live interbank rates
  let cachedRates: {
    usdjpy: number | null;
    eurusd: number | null;
    updatedAt: number;
    source: string;
  } = {
    usdjpy: 154.825,
    eurusd: 1.08745,
    updatedAt: Date.now(),
    source: "System Seed",
  };

  // 1. Health Check Endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      uptime: process.uptime(),
      serverTime: new Date().toISOString(),
      service: "ApexFX Institutional Trading Server",
      port: PORT,
      features: [
        "Vite SPA Middleware",
        "Interbank Rate Proxy",
        "Webhook Order Bridge",
        "MetaTrader 4/5 EA Relay",
      ],
    });
  });

  // 2. Server-side Live Forex Rates Proxy (bypasses browser CORS & network blocks)
  app.get("/api/rates", async (req, res) => {
    try {
      const now = Date.now();
      // Cache for 10 seconds to avoid upstream rate limits
      if (now - cachedRates.updatedAt < 10000 && cachedRates.usdjpy && cachedRates.eurusd) {
        return res.json({
          status: "ok",
          ...cachedRates,
          cached: true,
        });
      }

      const [ujRes, euRes] = await Promise.allSettled([
        fetch("https://api.frankfurter.dev/v1/latest?base=USD&symbols=JPY", {
          headers: { "User-Agent": "ApexFX-Quant/2.0" },
        }),
        fetch("https://api.frankfurter.dev/v1/latest?base=EUR&symbols=USD", {
          headers: { "User-Agent": "ApexFX-Quant/2.0" },
        }),
      ]);

      if (ujRes.status === "fulfilled" && ujRes.value.ok) {
        const ujData = (await ujRes.value.json()) as { rates?: { JPY?: number } };
        if (ujData.rates?.JPY) {
          cachedRates.usdjpy = parseFloat(ujData.rates.JPY.toFixed(3));
        }
      }

      if (euRes.status === "fulfilled" && euRes.value.ok) {
        const euData = (await euRes.value.json()) as { rates?: { USD?: number } };
        if (euData.rates?.USD) {
          cachedRates.eurusd = parseFloat(euData.rates.USD.toFixed(5));
        }
      }

      cachedRates.updatedAt = now;
      cachedRates.source = "European Central Bank / Interbank Live Feed";

      res.json({
        status: "ok",
        ...cachedRates,
        cached: false,
      });
    } catch (err: any) {
      res.json({
        status: "fallback",
        ...cachedRates,
        error: err?.message || "Rate fetch error",
      });
    }
  });

  // 3. Webhook Receiver Endpoint for TradingView / External Signals
  app.post("/api/webhook", (req, res) => {
    const payload = req.body;
    console.log("[ApexFX Webhook Received]", new Date().toISOString(), payload);
    res.json({
      status: "received",
      packetId: `PKT-SRV-${Date.now().toString().slice(-6)}`,
      receivedAt: new Date().toISOString(),
      payload,
    });
  });

  // 4. Server-Side Broker Order Relay (bypasses browser CORS & mixed-content HTTP/HTTPS blocks)
  app.post("/api/relay", async (req, res) => {
    const { targetUrl, secret, orderPacket } = req.body;

    if (!targetUrl || typeof targetUrl !== "string") {
      return res.status(400).json({ status: "error", message: "Missing targetUrl" });
    }

    try {
      const response = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Apex-Auth": secret || "default-secret",
        },
        body: JSON.stringify(orderPacket),
      });

      const responseText = await response.text();
      res.json({
        status: "relayed",
        remoteStatus: response.status,
        response: responseText,
      });
    } catch (err: any) {
      res.status(502).json({
        status: "relay_failed",
        error: err?.message || "Failed to reach destination broker endpoint",
      });
    }
  });

  // 5. Vite Middleware for Dev, Static Serving for Production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ApexFX Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
