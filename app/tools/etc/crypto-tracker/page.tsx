"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createChart, ColorType } from "lightweight-charts";
import type { IChartApi, ISeriesApi, Time } from "lightweight-charts";
import {
  TrendingUp, Search, RefreshCw, ChevronUp, ChevronDown,
  LayoutList, BarChart2, Wifi, WifiOff,
} from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "기타", href: "/tools/etc" },
];

/* ── 코인 메타데이터 ── */
const COIN_META: Record<string, { name: string; base: string }> = {
  BTCUSDT:  { name: "Bitcoin",           base: "BTC"  },
  ETHUSDT:  { name: "Ethereum",          base: "ETH"  },
  BNBUSDT:  { name: "BNB",               base: "BNB"  },
  SOLUSDT:  { name: "Solana",            base: "SOL"  },
  XRPUSDT:  { name: "XRP",               base: "XRP"  },
  ADAUSDT:  { name: "Cardano",           base: "ADA"  },
  AVAXUSDT: { name: "Avalanche",         base: "AVAX" },
  DOGEUSDT: { name: "Dogecoin",          base: "DOGE" },
  TRXUSDT:  { name: "TRON",              base: "TRX"  },
  TONUSDT:  { name: "Toncoin",           base: "TON"  },
  DOTUSDT:  { name: "Polkadot",          base: "DOT"  },
  SHIBUSDT: { name: "Shiba Inu",         base: "SHIB" },
  LTCUSDT:  { name: "Litecoin",          base: "LTC"  },
  LINKUSDT: { name: "Chainlink",         base: "LINK" },
  BCHUSDT:  { name: "Bitcoin Cash",      base: "BCH"  },
  XLMUSDT:  { name: "Stellar",           base: "XLM"  },
  NEARUSDT: { name: "NEAR Protocol",     base: "NEAR" },
  ATOMUSDT: { name: "Cosmos",            base: "ATOM" },
  ETCUSDT:  { name: "Ethereum Classic",  base: "ETC"  },
  FILUSDT:  { name: "Filecoin",          base: "FIL"  },
  APTUSDT:  { name: "Aptos",             base: "APT"  },
  ARBUSDT:  { name: "Arbitrum",          base: "ARB"  },
  OPUSDT:   { name: "Optimism",          base: "OP"   },
  INJUSDT:  { name: "Injective",         base: "INJ"  },
  SUIUSDT:  { name: "Sui",               base: "SUI"  },
  RUNEUSDT: { name: "THORChain",         base: "RUNE" },
  AAVEUSDT: { name: "Aave",              base: "AAVE" },
  MKRUSDT:  { name: "Maker",             base: "MKR"  },
  UNIUSDT:  { name: "Uniswap",           base: "UNI"  },
  PEPEUSDT: { name: "Pepe",              base: "PEPE" },
  LDOUSDT:  { name: "Lido DAO",          base: "LDO"  },
  STXUSDT:  { name: "Stacks",            base: "STX"  },
  SANDUSDT: { name: "The Sandbox",       base: "SAND" },
  MANAUSDT: { name: "Decentraland",      base: "MANA" },
  AXSUSDT:  { name: "Axie Infinity",     base: "AXS"  },
  VETUSDT:  { name: "VeChain",           base: "VET"  },
  HBARUSDT: { name: "Hedera",            base: "HBAR" },
  GRTUSDT:  { name: "The Graph",         base: "GRT"  },
  XTZUSDT:  { name: "Tezos",             base: "XTZ"  },
  EGLDUSDT: { name: "MultiversX",        base: "EGLD" },
  COMPUSDT: { name: "Compound",          base: "COMP" },
  GALAUSDT: { name: "Gala",              base: "GALA" },
  CHZUSDT:  { name: "Chiliz",            base: "CHZ"  },
  ALGOUSDT: { name: "Algorand",          base: "ALGO" },
  ICPUSDT:  { name: "Internet Computer", base: "ICP"  },
};

const TOP_SYMBOLS = Object.keys(COIN_META);

/* 차트 탭에 표시할 주요 코인 */
const TAB_SYMBOLS = [
  "BTCUSDT","ETHUSDT","BNBUSDT","SOLUSDT","XRPUSDT",
  "ADAUSDT","AVAXUSDT","DOGEUSDT","TRXUSDT","TONUSDT",
  "DOTUSDT","LTCUSDT","LINKUSDT","NEARUSDT","PEPEUSDT",
];

const CHART_INTERVALS = [
  { value: "1m",  label: "1M"  },
  { value: "5m",  label: "5M"  },
  { value: "15m", label: "15M" },
  { value: "30m", label: "30M" },
  { value: "1h",  label: "1H"  },
  { value: "4h",  label: "4H"  },
  { value: "1d",  label: "1D"  },
  { value: "1w",  label: "1W"  },
];

const iconUrl = (base: string) =>
  `https://assets.coincap.io/assets/icons/${base.toLowerCase()}@2x.png`;

/* ── 타입 ── */
interface CoinData {
  symbol:                      string;
  name:                        string;
  base:                        string;
  image:                       string;
  current_price:               number;
  price_change_24h:            number;
  price_change_percentage_24h: number;
  volume_base:                 number;
  quote_volume:                number;
  high_24h:                    number;
  low_24h:                     number;
  open_price:                  number;
  rank:                        number;
}

interface BinanceTicker {
  symbol:             string;
  priceChange:        string;
  priceChangePercent: string;
  lastPrice:          string;
  openPrice:          string;
  highPrice:          string;
  lowPrice:           string;
  volume:             string;
  quoteVolume:        string;
}

interface TickerInfo {
  price:  number;
  change: number;
  high:   number;
  low:    number;
  volume: number;
}

interface KlineMsg {
  t: number; o: string; h: string;
  l: string; c: string; v: string; x: boolean;
}

/* ── 포맷 헬퍼 ── */
function fmtPrice(p: number): string {
  if (p >= 10000) return "$" + p.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (p >= 100)   return "$" + p.toFixed(2);
  if (p >= 1)     return "$" + p.toFixed(4);
  if (p >= 0.001) return "$" + p.toFixed(6);
  return "$" + p.toFixed(8);
}
function fmtLarge(n: number): string {
  if (n >= 1e12) return "$" + (n / 1e12).toFixed(2) + "T";
  if (n >= 1e9)  return "$" + (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6)  return "$" + (n / 1e6).toFixed(2) + "M";
  return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}
function fmtPct(n: number): string {
  return n >= 0 ? `+${n.toFixed(2)}%` : `${n.toFixed(2)}%`;
}

function parseTicker(t: BinanceTicker, rank: number): CoinData | null {
  const meta = COIN_META[t.symbol];
  if (!meta) return null;
  const last = parseFloat(t.lastPrice);
  const open = parseFloat(t.openPrice);
  return {
    symbol:                      t.symbol,
    name:                        meta.name,
    base:                        meta.base,
    image:                       iconUrl(meta.base),
    current_price:               last,
    price_change_24h:            parseFloat(t.priceChange),
    price_change_percentage_24h: parseFloat(t.priceChangePercent),
    volume_base:                 parseFloat(t.volume),
    quote_volume:                parseFloat(t.quoteVolume),
    high_24h:                    parseFloat(t.highPrice),
    low_24h:                     parseFloat(t.lowPrice),
    open_price:                  open,
    rank,
  };
}

/* ═══════════════════════════════════════════════════════
   lightweight-charts 기반 차트 패널
   ══════════════════════════════════════════════════════ */
function ChartPanel({ initialSymbol }: { initialSymbol: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef     = useRef<IChartApi | null>(null);
  const candleRef    = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volRef       = useRef<ISeriesApi<"Histogram"> | null>(null);
  const klineWsRef   = useRef<WebSocket | null>(null);

  const [symbol,    setSymbol]    = useState(initialSymbol);
  const [interval,  setIntervalV] = useState("1h");
  const [ticker,    setTicker]    = useState<TickerInfo | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading,   setLoading]   = useState(false);

  /* initialSymbol이 바뀌면 (테이블 행 클릭) 심볼 갱신 */
  useEffect(() => { setSymbol(initialSymbol); }, [initialSymbol]);

  /* ── 차트 초기화 (마운트 시 1회) ── */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: "#0d1117" },
        textColor: "#94a3b8",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "#1e293b" },
        horzLines: { color: "#1e293b" },
      },
      crosshair: { mode: 1 },
      rightPriceScale: {
        borderColor: "#1e293b",
        textColor:   "#94a3b8",
      },
      timeScale: {
        borderColor:         "#1e293b",
        timeVisible:         true,
        secondsVisible:      false,
        rightBarStaysOnScroll: true,
        fixLeftEdge:         false,
        fixRightEdge:        false,
      },
      width:  container.clientWidth,
      height: 460,
    });

    const candle = chart.addCandlestickSeries({
      upColor:         "#10b981",
      downColor:       "#ef4444",
      borderUpColor:   "#10b981",
      borderDownColor: "#ef4444",
      wickUpColor:     "#10b981",
      wickDownColor:   "#ef4444",
    });

    const vol = chart.addHistogramSeries({
      priceFormat:  { type: "volume" },
      priceScaleId: "vol",
    });
    chart.priceScale("vol").applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 },
    });

    chartRef.current  = chart;
    candleRef.current = candle;
    volRef.current    = vol;

    const ro = new ResizeObserver(() => {
      if (container) chart.applyOptions({ width: container.clientWidth });
    });
    ro.observe(container);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current  = null;
      candleRef.current = null;
      volRef.current    = null;
    };
  }, []);

  /* ── 데이터 로드 + WS 연결 (심볼/인터벌 변경 시) ── */
  useEffect(() => {
    if (!candleRef.current || !volRef.current) return;

    /* 이전 WS 정리 */
    klineWsRef.current?.close();
    klineWsRef.current = null;
    setConnected(false);

    /* 24hr 티커 */
    fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`)
      .then(r => r.json())
      .then((d: {
        priceChangePercent: string; lastPrice: string;
        highPrice: string; lowPrice: string; quoteVolume: string;
      }) => {
        setTicker({
          price:  parseFloat(d.lastPrice),
          change: parseFloat(d.priceChangePercent),
          high:   parseFloat(d.highPrice),
          low:    parseFloat(d.lowPrice),
          volume: parseFloat(d.quoteVolume),
        });
      })
      .catch(() => {});

    /* 500개 캔들 로드 */
    setLoading(true);
    fetch(
      `https://api.binance.com/api/v3/klines` +
      `?symbol=${symbol}&interval=${interval}&limit=500`
    )
      .then(r => r.json())
      .then((data: (string | number)[][]) => {
        if (!candleRef.current || !volRef.current) return;

        const candles = data.map(k => ({
          time:  Math.floor(Number(k[0]) / 1000) as Time,
          open:  parseFloat(k[1] as string),
          high:  parseFloat(k[2] as string),
          low:   parseFloat(k[3] as string),
          close: parseFloat(k[4] as string),
        }));
        const volumes = data.map(k => ({
          time:  Math.floor(Number(k[0]) / 1000) as Time,
          value: parseFloat(k[5] as string),
          color:
            parseFloat(k[4] as string) >= parseFloat(k[1] as string)
              ? "#10b98125"
              : "#ef444425",
        }));

        candleRef.current.setData(candles);
        volRef.current.setData(volumes);
        chartRef.current?.timeScale().fitContent();
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    /* 실시간 WS 연결 */
    const ws = new WebSocket(
      `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`
    );

    ws.onopen  = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    ws.onmessage = (e: MessageEvent) => {
      try {
        const msg = JSON.parse(e.data as string) as { k?: KlineMsg };
        const k = msg.k;
        if (!k) return;

        const t = Math.floor(k.t / 1000) as Time;
        const up = parseFloat(k.c) >= parseFloat(k.o);

        /* 양 끝 update 오류 방지: try-catch로 감싸 안전하게 처리 */
        try {
          candleRef.current?.update({
            time:  t,
            open:  parseFloat(k.o),
            high:  parseFloat(k.h),
            low:   parseFloat(k.l),
            close: parseFloat(k.c),
          });
        } catch { /* 타임스탬프 순서 오류 등 무시 */ }

        try {
          volRef.current?.update({
            time:  t,
            value: parseFloat(k.v),
            color: up ? "#10b98125" : "#ef444425",
          });
        } catch { /* 무시 */ }

        setTicker(prev =>
          prev ? { ...prev, price: parseFloat(k.c) } : prev
        );
      } catch { /* JSON 파싱 오류 무시 */ }
    };

    klineWsRef.current = ws;

    return () => {
      ws.close();
      klineWsRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, interval]);

  const meta  = COIN_META[symbol] ?? { name: symbol, base: symbol.replace("USDT", "") };
  const isUp  = (ticker?.change ?? 0) >= 0;
  const clrUp = "text-emerald-400";
  const clrDn = "text-red-400";

  return (
    <div className="flex flex-col gap-4">

      {/* ── 티커 헤더 ── */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-xl border border-border bg-bg-secondary px-5 py-4">
        {/* 코인 이름 */}
        <div>
          <div className="text-xl font-bold text-text-primary">
            {meta.base}
            <span className="ml-1.5 text-sm font-normal text-text-secondary">/ USDT</span>
          </div>
          <div className="text-xs text-text-secondary">{meta.name}</div>
        </div>

        {ticker ? (
          <>
            {/* 가격 */}
            <div className={`font-mono text-3xl font-bold tabular-nums ${isUp ? clrUp : clrDn}`}>
              {fmtPrice(ticker.price)}
            </div>

            {/* 변동률 배지 */}
            <div className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-base font-semibold ${
              isUp
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-red-500/30 bg-red-500/10 text-red-400"
            }`}>
              <span>{isUp ? "▲" : "▼"}</span>
              <span>{isUp ? "+" : ""}{ticker.change.toFixed(2)}%</span>
            </div>

            {/* 스탯 */}
            <div className="ml-auto flex gap-6">
              {([
                { label: "24H 고가", value: fmtPrice(ticker.high), cls: clrUp },
                { label: "24H 저가", value: fmtPrice(ticker.low),  cls: clrDn },
                { label: "24H 거래량", value: fmtLarge(ticker.volume), cls: "text-text-primary" },
              ] as const).map(s => (
                <div key={s.label}>
                  <p className="mb-0.5 text-xs text-text-secondary">{s.label}</p>
                  <p className={`font-mono text-sm font-semibold ${s.cls}`}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* WS 상태 */}
            <div className={`flex items-center gap-1.5 text-xs font-medium ${connected ? "text-emerald-400" : "text-text-secondary"}`}>
              <span className={`inline-block h-2 w-2 rounded-full ${
                connected ? "bg-emerald-400 shadow-[0_0_6px_#10b981] animate-pulse" : "bg-gray-500"
              }`} />
              {connected ? "LIVE" : "연결 중..."}
            </div>
          </>
        ) : (
          <div className="text-sm text-text-secondary animate-pulse">불러오는 중…</div>
        )}
      </div>

      {/* ── 코인 탭 (가로 스크롤) ── */}
      <div className="overflow-x-auto rounded-xl border border-border bg-bg-secondary px-4 py-3">
        <div className="flex gap-1.5" style={{ minWidth: "max-content" }}>
          {TAB_SYMBOLS.map(sym => {
            const m = COIN_META[sym];
            return (
              <button
                key={sym}
                onClick={() => setSymbol(sym)}
                className={`rounded-lg border px-3.5 py-2 text-sm font-medium transition-all ${
                  symbol === sym
                    ? "border-blue-500/60 bg-blue-500/15 text-blue-400"
                    : "border-border text-text-secondary hover:border-brand/50 hover:text-text-primary"
                }`}
              >
                {m?.base ?? sym.replace("USDT", "")}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 차트 카드 ── */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-[#0d1117]">

        {/* 인터벌 선택 바 */}
        <div className="flex items-center gap-1 border-b border-[#1e293b] px-4 py-2.5">
          <span className="mr-2 text-xs text-[#6b7280]">구간</span>
          {CHART_INTERVALS.map(iv => (
            <button
              key={iv.value}
              onClick={() => setIntervalV(iv.value)}
              className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                interval === iv.value
                  ? "bg-blue-500 text-white"
                  : "text-[#6b7280] hover:text-[#94a3b8]"
              }`}
            >
              {iv.label}
            </button>
          ))}
        </div>

        {/* 로딩 오버레이 */}
        {loading && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/50">
            <span className="text-sm text-blue-400">데이터 로딩 중...</span>
          </div>
        )}

        {/* 차트 컨테이너 */}
        <div ref={containerRef} className="w-full" />

        {/* 하단 안내 */}
        <p className="px-4 py-2 text-center text-xs text-[#374151]">
          Powered by Binance WebSocket API · 실시간 시세 조회 전용 (주문 기능 없음)
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   메인 페이지
   ══════════════════════════════════════════════════════ */
export default function CryptoTrackerPage() {
  const [coins, setCoins]   = useState<CoinData[]>([]);
  const [search, setSearch] = useState("");
  const [view, setView]     = useState<"table" | "chart">("table");
  const [selected, setSelected] = useState<string>("BTCUSDT");
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [wsStatus, setWsStatus] = useState<"connecting" | "connected" | "disconnected">("disconnected");

  const wsRef          = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingUpdates = useRef<Map<string, Partial<CoinData>>>(new Map());

  /* ── 초기 시세 로드 ── */
  const fetchCoins = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/crypto");
      if (!res.ok) throw new Error(`API 오류 (${res.status})`);
      const data: BinanceTicker[] = await res.json();

      const sorted = [...data].sort(
        (a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume)
      );
      const parsed = sorted
        .map((t, i) => parseTicker(t, i + 1))
        .filter((c): c is CoinData => c !== null);

      setCoins(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : "불러오기 실패");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCoins(); }, [fetchCoins]);

  /* ── 배치 업데이트 (500ms) ── */
  useEffect(() => {
    const iv = setInterval(() => {
      if (pendingUpdates.current.size === 0) return;
      const updates = new Map(pendingUpdates.current);
      pendingUpdates.current.clear();
      setCoins(prev =>
        prev.map(coin => {
          const u = updates.get(coin.symbol);
          return u ? { ...coin, ...u } : coin;
        })
      );
    }, 500);
    return () => clearInterval(iv);
  }, []);

  /* ── Binance WebSocket (미니 티커, 45개 코인) ── */
  const connectWs = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
    }
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);

    const streams = TOP_SYMBOLS.map(s => `${s.toLowerCase()}@miniTicker`).join("/");
    setWsStatus("connecting");
    const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);
    wsRef.current = ws;

    ws.onopen = () => setWsStatus("connected");

    ws.onmessage = (e: MessageEvent) => {
      try {
        const msg = JSON.parse(e.data as string) as {
          data?: { s: string; c: string; o: string; h: string; l: string; v: string; q: string };
        };
        const d = msg.data;
        if (!d?.s) return;
        const last = parseFloat(d.c), open = parseFloat(d.o);
        pendingUpdates.current.set(d.s, {
          current_price:               last,
          price_change_24h:            last - open,
          price_change_percentage_24h: ((last - open) / (open || 1)) * 100,
          high_24h:                    parseFloat(d.h),
          low_24h:                     parseFloat(d.l),
          open_price:                  open,
          volume_base:                 parseFloat(d.v),
          quote_volume:                parseFloat(d.q),
        });
      } catch { /* ignore */ }
    };

    ws.onclose = () => {
      setWsStatus("disconnected");
      reconnectTimer.current = setTimeout(connectWs, 5000);
    };
    ws.onerror = () => ws.close();
  }, []);

  useEffect(() => {
    connectWs();
    return () => {
      wsRef.current?.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [connectWs]);

  const filtered = coins.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.base.toLowerCase().includes(search.toLowerCase())
  );

  const openChart = (symbol: string) => {
    setSelected(symbol);
    setView("chart");
  };

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="암호화폐 시세"
      description="Binance WebSocket 실시간 가격 · TradingView 캔들스틱 차트"
      icon={TrendingUp}
    >
      <div className="flex flex-col gap-5">

        {/* ── 공통 컨트롤 바 ── */}
        <div className="flex flex-wrap items-center gap-3">
          {view === "table" && (
            <div className="relative min-w-[180px] flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="코인 검색 (BTC, Bitcoin…)"
                className="w-full rounded-xl border border-border bg-bg-secondary py-2.5 pl-9 pr-4 text-sm text-text-primary placeholder-text-secondary/50 focus:border-brand focus:outline-none"
              />
            </div>
          )}

          <div className="flex overflow-hidden rounded-xl border border-border">
            <button
              type="button"
              onClick={() => setView("table")}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors ${view === "table" ? "bg-brand text-white" : "text-text-secondary hover:text-text-primary"}`}
            >
              <LayoutList size={13} /> 목록
            </button>
            <button
              type="button"
              onClick={() => setView("chart")}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors ${view === "chart" ? "bg-brand text-white" : "text-text-secondary hover:text-text-primary"}`}
            >
              <BarChart2 size={13} /> 차트
            </button>
          </div>

          {/* WS 상태 (목록 뷰에서만 표시) */}
          {view === "table" && (
            <div className={`flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-medium ${
              wsStatus === "connected"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                : wsStatus === "connecting"
                ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-400"
                : "border-red-500/40 bg-red-500/10 text-red-400"
            }`}>
              {wsStatus === "connected"
                ? <><Wifi size={12} /><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />실시간</>
                : wsStatus === "connecting"
                ? <><WifiOff size={12} />연결 중…</>
                : <><WifiOff size={12} />재연결 중…</>
              }
            </div>
          )}

          {view === "table" && (
            <button
              type="button"
              onClick={fetchCoins}
              className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2.5 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              새로고침
            </button>
          )}
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* ── 목록 뷰 ── */}
        {view === "table" && (
          loading ? (
            <div className="flex h-40 items-center justify-center text-sm text-text-secondary animate-pulse">
              시세 불러오는 중…
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[340px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-bg-secondary text-xs font-semibold text-text-secondary">
                    <th className="px-3 py-3 text-left">#</th>
                    <th className="px-3 py-3 text-left">코인</th>
                    <th className="px-3 py-3 text-right">현재가</th>
                    <th className="px-3 py-3 text-right">24H</th>
                    <th className="hidden sm:table-cell px-3 py-3 text-right">24H 고가</th>
                    <th className="hidden sm:table-cell px-3 py-3 text-right">24H 저가</th>
                    <th className="hidden md:table-cell px-3 py-3 text-right">거래량(USDT)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map(coin => {
                    const p24 = coin.price_change_percentage_24h;
                    return (
                      <tr
                        key={coin.symbol}
                        onClick={() => openChart(coin.symbol)}
                        className="cursor-pointer transition-colors hover:bg-brand/5"
                      >
                        <td className="px-3 py-3 text-xs text-text-secondary">{coin.rank}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={coin.image} alt={coin.name}
                              width={24} height={24}
                              className="rounded-full shrink-0"
                              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-text-primary">{coin.name}</p>
                              <p className="text-xs uppercase text-text-secondary">{coin.base}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-sm font-semibold text-text-primary">
                          {fmtPrice(coin.current_price)}
                        </td>
                        <td className={`px-3 py-3 text-right font-mono text-xs font-semibold ${p24 >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          <span className="flex items-center justify-end gap-0.5">
                            {p24 >= 0 ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                            {Math.abs(p24).toFixed(2)}%
                          </span>
                        </td>
                        <td className="hidden sm:table-cell px-3 py-3 text-right font-mono text-xs text-emerald-400">
                          {fmtPrice(coin.high_24h)}
                        </td>
                        <td className="hidden sm:table-cell px-3 py-3 text-right font-mono text-xs text-red-400">
                          {fmtPrice(coin.low_24h)}
                        </td>
                        <td className="hidden md:table-cell px-3 py-3 text-right font-mono text-xs text-text-secondary">
                          {fmtLarge(coin.quote_volume)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* ── 차트 뷰 ── */}
        {view === "chart" && (
          <ChartPanel
            key={selected}
            initialSymbol={selected}
          />
        )}

      </div>
    </ToolPageLayout>
  );
}
