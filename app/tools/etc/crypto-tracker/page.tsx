"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  TrendingUp, Search, RefreshCw, ChevronUp, ChevronDown,
  LayoutList, BarChart2, ArrowLeft, Maximize2, X,
} from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "기타", href: "/tools/etc" },
];

const REFRESH_SEC = 60;

// 서버 API Route를 통해 호출 → 서버에서 60초 캐시 후 CoinGecko에 전달 (rate limit 방어)
const MARKETS_URL = "/api/crypto";
const chartUrl = (id: string, days: number) => `/api/crypto/chart?id=${encodeURIComponent(id)}&days=${days}`;

/* ── Types ── */
interface CoinData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency: number;
  market_cap: number;
  total_volume: number;
  market_cap_rank: number;
  high_24h: number;
  low_24h: number;
  sparkline_in_7d: { price: number[] };
}

/* ── Format helpers ── */
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
  return "$" + n.toLocaleString();
}
function fmtPct(n: number | null | undefined): string {
  return (n ?? 0) >= 0 ? `+${(n ?? 0).toFixed(2)}%` : `${(n ?? 0).toFixed(2)}%`;
}

/* ── Sparkline SVG ── */
function Sparkline({ prices, up }: { prices: number[]; up: boolean }) {
  if (!prices?.length) return <div className="h-8 w-20" />;
  const min = Math.min(...prices), max = Math.max(...prices);
  const range = max - min || 1;
  const W = 80, H = 32;
  const pts = prices
    .map((p, i) => `${((i / (prices.length - 1)) * W).toFixed(1)},${(H - ((p - min) / range) * (H - 4) - 2).toFixed(1)}`)
    .join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <polyline points={pts} fill="none" stroke={up ? "#34d399" : "#f87171"} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Full price chart SVG (with hover tooltip) ── */
function PriceChart({ data, up, days, tall, gradId = "cg" }: {
  data: [number, number][];
  up: boolean;
  days: number;
  tall?: boolean;
  gradId?: string;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  if (data.length < 2) return (
    <div className="flex h-56 items-center justify-center text-sm text-text-secondary">데이터 없음</div>
  );

  const pad = { t: 20, r: 16, b: 36, l: 76 };
  const W = 800, H = 260;
  const pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;

  const prices = data.map(d => d[1]);
  const times  = data.map(d => d[0]);
  const minP = Math.min(...prices), maxP = Math.max(...prices);
  const rangeP = maxP - minP || 1;
  const minT = times[0], maxT = times[times.length - 1];
  const rangeT = maxT - minT || 1;

  const tx = (t: number) => pad.l + ((t - minT) / rangeT) * pw;
  const ty = (p: number) => pad.t + ph - ((p - minP) / rangeP) * ph;

  const linePath = data.map(([t, p], i) => `${i === 0 ? "M" : "L"}${tx(t).toFixed(1)} ${ty(p).toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${tx(maxT).toFixed(1)} ${(pad.t + ph).toFixed(1)} L${tx(minT).toFixed(1)} ${(pad.t + ph).toFixed(1)} Z`;

  const color = up ? "#34d399" : "#f87171";

  const yLabels = Array.from({ length: 5 }, (_, i) => {
    const p = minP + rangeP * (i / 4);
    return { y: ty(p), label: fmtPrice(p) };
  });

  const xCount = Math.min(6, data.length);
  const step = Math.floor(data.length / xCount);
  const xLabels = Array.from({ length: xCount }, (_, i) => {
    const idx = Math.min(i * step, data.length - 1);
    const t = data[idx][0];
    const d = new Date(t);
    return {
      x: tx(t),
      label: days === 1
        ? d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
        : d.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" }),
    };
  });

  /* ── Hover 핸들러 ── */
  const handleMouseMove = (e: React.MouseEvent<SVGRectElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    let bestIdx = 0, bestDist = Infinity;
    data.forEach(([t], i) => {
      const dist = Math.abs(tx(t) - svgX);
      if (dist < bestDist) { bestDist = dist; bestIdx = i; }
    });
    setHoverIdx(bestIdx);
  };

  /* ── Hover 데이터 계산 ── */
  const hd        = hoverIdx !== null ? data[hoverIdx] : null;
  const hPrice    = hd ? hd[1] : null;
  const hTime     = hd ? hd[0] : null;
  const hX        = hd ? tx(hd[0]) : null;
  const hY        = hd ? ty(hd[1]) : null;
  const firstP    = data[0][1];
  const changePct = hPrice != null ? ((hPrice - firstP) / firstP) * 100 : null;
  const changeAbs = hPrice != null ? hPrice - firstP : null;
  const hUp       = (changePct ?? 0) >= 0;

  /* 툴팁 X: 오른쪽 끝 근처면 왼쪽으로 */
  const TW = 155, TH = 76;
  const tooltipX  = hX != null ? (hX + TW + pad.r > W ? hX - TW - 8 : hX + 10) : 0;
  const tooltipY  = pad.t + 2;

  const timeLabel = hTime
    ? (days === 1
        ? new Date(hTime).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
        : new Date(hTime).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }))
    : "";

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      className={`w-full ${tall ? "" : "h-[260px] sm:h-[420px]"}`}
      style={tall ? { height: "100%" } : undefined}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* 격자 */}
      {yLabels.map(({ y }, i) => (
        <line key={i} x1={pad.l} y1={y} x2={W - pad.r} y2={y}
          stroke="rgba(74,76,128,0.4)" strokeWidth="1" strokeDasharray="4,4" />
      ))}

      {/* 영역 + 선 */}
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />

      {/* Y 레이블 */}
      {yLabels.map(({ y, label }, i) => (
        <text key={i} x={pad.l - 8} y={y + 4} textAnchor="end" fontSize="11"
          fill="rgba(128,128,184,0.9)">{label}</text>
      ))}

      {/* X 레이블 */}
      {xLabels.map(({ x, label }, i) => (
        <text key={i} x={x} y={H - 8} textAnchor="middle" fontSize="11"
          fill="rgba(128,128,184,0.9)">{label}</text>
      ))}

      {/* ── 호버 레이어 ── */}
      {hoverIdx !== null && hX !== null && hY !== null && (
        <>
          {/* 수직 크로스헤어 */}
          <line x1={hX} y1={pad.t} x2={hX} y2={pad.t + ph}
            stroke="rgba(255,255,255,0.25)" strokeWidth="1" strokeDasharray="4,3" />
          {/* 수평 크로스헤어 */}
          <line x1={pad.l} y1={hY} x2={W - pad.r} y2={hY}
            stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="4,3" />
          {/* 현재 Y값 우측 레이블 */}
          <rect x={W - pad.r} y={hY - 9} width={pad.r + 2} height={18}
            fill={color} rx="3" opacity="0.9" />
          {/* 도트 */}
          <circle cx={hX} cy={hY} r="4.5" fill={color} stroke="white" strokeWidth="2" />
          {/* 외곽 발광 */}
          <circle cx={hX} cy={hY} r="8" fill={color} opacity="0.15" />

          {/* 툴팁 박스 */}
          <rect x={tooltipX} y={tooltipY} width={TW} height={TH}
            rx="7" fill="rgba(10,10,18,0.93)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
          {/* 왼쪽 컬러 바 */}
          <rect x={tooltipX} y={tooltipY} width="3" height={TH}
            rx="3" fill={color} opacity="0.8" />

          {/* 시간 */}
          <text x={tooltipX + 12} y={tooltipY + 17} fontSize="10"
            fill="rgba(180,180,210,0.75)">{timeLabel}</text>
          {/* 가격 */}
          <text x={tooltipX + 12} y={tooltipY + 38} fontSize="16" fontWeight="bold"
            fill="white">{hPrice != null ? fmtPrice(hPrice) : ""}</text>
          {/* 변동 */}
          <text x={tooltipX + 12} y={tooltipY + 60} fontSize="11"
            fill={hUp ? "#34d399" : "#f87171"}>
            {changePct != null
              ? `${hUp ? "▲" : "▼"} ${Math.abs(changePct).toFixed(2)}%  (${hUp ? "+" : "-"}${fmtPrice(Math.abs(changeAbs ?? 0))})`
              : ""}
          </text>
        </>
      )}

      {/* 마우스 이벤트 수신용 투명 오버레이 (차트 영역만) */}
      <rect
        x={pad.l} y={pad.t} width={pw} height={ph}
        fill="transparent"
        style={{ cursor: "crosshair" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIdx(null)}
      />
    </svg>
  );
}

/* ── Main ── */
export default function CryptoTrackerPage() {
  const [coins, setCoins]             = useState<CoinData[]>([]);
  const [search, setSearch]           = useState("");
  const [view, setView]               = useState<"table" | "chart">("table");
  const [selected, setSelected]       = useState<CoinData | null>(null);
  const [days, setDays]               = useState<1 | 7 | 30>(7);
  const [chartData, setChartData]     = useState<[number, number][] | null>(null);
  const [loading, setLoading]         = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [countdown, setCountdown]     = useState(REFRESH_SEC);
  const [fullscreen, setFullscreen]   = useState(false);

  const fetchCoins = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(MARKETS_URL);
      if (!res.ok) throw new Error(`API 오류 (${res.status})`);
      const data: CoinData[] = await res.json();
      setCoins(data);
      setLastUpdated(new Date());
      setCountdown(REFRESH_SEC);
    } catch (e) {
      setError(e instanceof Error ? e.message : "불러오기 실패");
    } finally {
      setLoading(false);
    }
  }, []);

  /* 초기 로드 + 60초 자동갱신 */
  useEffect(() => {
    fetchCoins();
    const iv = setInterval(fetchCoins, REFRESH_SEC * 1000);
    return () => clearInterval(iv);
  }, [fetchCoins]);

  /* 카운트다운 */
  useEffect(() => {
    const iv = setInterval(() => setCountdown(c => (c > 0 ? c - 1 : REFRESH_SEC)), 1000);
    return () => clearInterval(iv);
  }, []);

  /* 차트 데이터 */
  useEffect(() => {
    if (!selected) return;
    setChartLoading(true);
    setChartData(null);
    fetch(chartUrl(selected.id, days))
      .then(r => r.json())
      .then(d => setChartData(d.prices))
      .catch(() => setChartData(null))
      .finally(() => setChartLoading(false));
  }, [selected, days]);

  /* ESC 키로 풀스크린 닫기 */
  useEffect(() => {
    if (!fullscreen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setFullscreen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [fullscreen]);

  const filtered = coins.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.symbol.toLowerCase().includes(search.toLowerCase())
  );

  const openChart = (coin: CoinData) => {
    setSelected(coin);
    setView("chart");
  };

  const p24up = (selected?.price_change_percentage_24h ?? 0) >= 0;

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="암호화폐 시세"
      description="CoinGecko 기준 상위 50개 코인 실시간 시세. 60초마다 자동 갱신됩니다."
      icon={TrendingUp}
    >
      <div className="flex flex-col gap-5">

        {/* 컨트롤 바 */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[180px] flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="코인 검색 (BTC, Ethereum…)"
              className="w-full rounded-xl border border-border bg-bg-secondary py-2.5 pl-9 pr-4 text-sm text-text-primary placeholder-text-secondary/50 focus:border-brand focus:outline-none"
            />
          </div>

          <div className="flex overflow-hidden rounded-xl border border-border">
            <button type="button" onClick={() => setView("table")}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors ${view === "table" ? "bg-brand text-white" : "text-text-secondary hover:text-text-primary"}`}>
              <LayoutList size={13} /> 목록
            </button>
            <button type="button" onClick={() => setView("chart")}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors ${view === "chart" ? "bg-brand text-white" : "text-text-secondary hover:text-text-primary"}`}>
              <BarChart2 size={13} /> 차트
            </button>
          </div>

          <button type="button" onClick={fetchCoins}
            className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2.5 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-brand">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            {countdown}s
          </button>

          {lastUpdated && (
            <span className="hidden sm:inline text-xs text-text-secondary">
              {lastUpdated.toLocaleTimeString("ko-KR")} 기준
            </span>
          )}
        </div>

        {/* 오류 */}
        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs text-red-400">
            {error} — 잠시 후 자동으로 재시도됩니다.
          </div>
        )}

        {/* ── 목록 뷰 ── */}
        {view === "table" && (
          loading
            ? <div className="flex h-40 items-center justify-center text-sm text-text-secondary animate-pulse">시세 불러오는 중…</div>
            : (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[340px] text-sm">
                  <thead>
                    <tr className="border-b border-border bg-bg-secondary text-xs font-semibold text-text-secondary">
                      <th className="px-3 py-3 text-left">#</th>
                      <th className="px-3 py-3 text-left">코인</th>
                      <th className="px-3 py-3 text-right">가격</th>
                      <th className="px-3 py-3 text-right">24H</th>
                      <th className="hidden sm:table-cell px-3 py-3 text-right">7D</th>
                      <th className="hidden md:table-cell px-3 py-3 text-right">시가총액</th>
                      <th className="hidden lg:table-cell px-3 py-3 text-right">거래량 24H</th>
                      <th className="hidden sm:table-cell px-3 py-3 text-right">7일 추이</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map(coin => {
                      const p24 = coin.price_change_percentage_24h ?? 0;
                      const p7  = coin.price_change_percentage_7d_in_currency ?? 0;
                      return (
                        <tr key={coin.id} onClick={() => openChart(coin)}
                          className="cursor-pointer transition-colors hover:bg-brand/5">
                          <td className="px-3 py-3 text-xs text-text-secondary">{coin.market_cap_rank}</td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={coin.image} alt={coin.name} width={24} height={24} className="rounded-full shrink-0" />
                              <div className="min-w-0">
                                <p className="truncate font-medium text-text-primary">{coin.name}</p>
                                <p className="text-xs uppercase text-text-secondary">{coin.symbol}</p>
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
                          <td className={`hidden sm:table-cell px-3 py-3 text-right font-mono text-xs font-semibold ${p7 >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            <span className="flex items-center justify-end gap-0.5">
                              {p7 >= 0 ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                              {Math.abs(p7).toFixed(2)}%
                            </span>
                          </td>
                          <td className="hidden md:table-cell px-3 py-3 text-right font-mono text-xs text-text-secondary">
                            {fmtLarge(coin.market_cap)}
                          </td>
                          <td className="hidden lg:table-cell px-3 py-3 text-right font-mono text-xs text-text-secondary">
                            {fmtLarge(coin.total_volume)}
                          </td>
                          <td className="hidden sm:table-cell px-3 py-3">
                            <div className="flex justify-end">
                              <Sparkline prices={coin.sparkline_in_7d?.price ?? []} up={p7 >= 0} />
                            </div>
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
          <div className="flex flex-col gap-6">

            {/* ── 컨트롤 바 ── */}
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
              {/* 코인 선택 행 */}
              <div className="flex items-center gap-2">
                {selected && (
                  <button type="button" onClick={() => setSelected(null)}
                    className="flex shrink-0 items-center gap-1 text-xs text-text-secondary transition-colors hover:text-brand">
                    <ArrowLeft size={13} /> 전체
                  </button>
                )}
                <select
                  value={selected?.id ?? ""}
                  onChange={e => {
                    const c = coins.find(x => x.id === e.target.value);
                    if (c) setSelected(c);
                  }}
                  className="w-full rounded-xl border border-border bg-bg-secondary px-3 py-2.5 text-sm text-text-primary focus:border-brand focus:outline-none sm:w-auto"
                >
                  <option value="">코인 선택…</option>
                  {coins.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.symbol.toUpperCase()})</option>
                  ))}
                </select>
              </div>

              {/* 기간 + 자세히 보기 행 */}
              <div className="flex items-center gap-2">
                <div className="flex overflow-hidden rounded-xl border border-border">
                  {([1, 7, 30] as const).map(d => (
                    <button key={d} type="button" onClick={() => setDays(d)}
                      className={`px-4 py-2.5 text-sm font-medium transition-colors ${days === d ? "bg-brand text-white" : "text-text-secondary hover:text-text-primary"}`}>
                      {d === 1 ? "24H" : d === 7 ? "7일" : "30일"}
                    </button>
                  ))}
                </div>

                {selected && (
                  <button
                    type="button"
                    onClick={() => setFullscreen(true)}
                    className="ml-auto flex items-center gap-1.5 rounded-xl border border-border px-3 py-2.5 text-sm text-text-secondary transition-colors hover:border-brand/50 hover:text-brand sm:ml-0"
                  >
                    <Maximize2 size={14} />
                    <span className="hidden xs:inline">자세히 보기</span>
                  </button>
                )}
              </div>
            </div>

            {/* ── 코인 선택 안 된 상태 ── */}
            {!selected && (
              <>
                <div className="flex h-40 items-center justify-center rounded-xl border border-border bg-bg-secondary text-sm text-text-secondary">
                  코인을 선택하거나 목록에서 행을 클릭하세요
                </div>
                {coins.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                    {coins.slice(0, 10).map(coin => {
                      const up = (coin.price_change_percentage_24h ?? 0) >= 0;
                      return (
                        <button key={coin.id} type="button" onClick={() => setSelected(coin)}
                          className="flex flex-col gap-2 rounded-xl border border-border bg-bg-secondary p-4 text-left transition-colors hover:border-brand/50">
                          <div className="flex items-center gap-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={coin.image} alt={coin.name} width={20} height={20} className="rounded-full" />
                            <span className="text-xs font-bold uppercase text-text-secondary">{coin.symbol}</span>
                          </div>
                          <p className="font-mono text-sm font-bold text-text-primary">{fmtPrice(coin.current_price)}</p>
                          <p className={`text-xs font-semibold ${up ? "text-emerald-400" : "text-red-400"}`}>
                            {fmtPct(coin.price_change_percentage_24h)}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* ── 코인 선택 상태 ── */}
            {selected && (
              <>
                {/* 가격 헤더 */}
                <div className="rounded-xl border border-border bg-bg-secondary px-4 py-4 sm:px-6 sm:py-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {/* 왼쪽: 코인 정보 + 가격 */}
                    <div className="flex items-start gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={selected.image} alt={selected.name} width={44} height={44} className="mt-0.5 rounded-full shrink-0" />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-baseline gap-1.5">
                          <span className="text-lg font-bold text-text-primary sm:text-xl">{selected.name}</span>
                          <span className="text-sm font-semibold uppercase text-text-secondary">{selected.symbol}</span>
                          <span className="rounded-md bg-bg-primary px-2 py-0.5 text-xs text-text-secondary">
                            #{selected.market_cap_rank}
                          </span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <span className="font-mono text-2xl font-bold text-text-primary sm:text-3xl">
                            {fmtPrice(selected.current_price)}
                          </span>
                          <span className={`flex items-center gap-1 rounded-lg px-2 py-0.5 text-sm font-semibold ${p24up ? "bg-emerald-400/10 text-emerald-400" : "bg-red-400/10 text-red-400"}`}>
                            {p24up ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            {fmtPct(selected.price_change_percentage_24h)}
                            <span className="text-xs font-normal opacity-70">24H</span>
                          </span>
                          {selected.price_change_percentage_7d_in_currency != null && (
                            <span className={`flex items-center gap-1 rounded-lg px-2 py-0.5 text-sm font-semibold ${(selected.price_change_percentage_7d_in_currency ?? 0) >= 0 ? "bg-emerald-400/10 text-emerald-400" : "bg-red-400/10 text-red-400"}`}>
                              {(selected.price_change_percentage_7d_in_currency ?? 0) >= 0 ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                              {fmtPct(selected.price_change_percentage_7d_in_currency)}
                              <span className="text-xs font-normal opacity-70">7D</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* 오른쪽: 24H 범위 */}
                    <div className="flex flex-col gap-1 sm:items-end">
                      <span className="text-xs text-text-secondary">24H 범위</span>
                      <div className="flex items-center gap-2 font-mono text-sm">
                        <span className="text-red-400">{fmtPrice(selected.low_24h)}</span>
                        <span className="text-text-secondary">—</span>
                        <span className="text-emerald-400">{fmtPrice(selected.high_24h)}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-border sm:w-44">
                        <div
                          className="h-full rounded-full bg-linear-to-r from-red-400 to-emerald-400"
                          style={{
                            width: `${Math.min(100, Math.max(0, ((selected.current_price - selected.low_24h) / ((selected.high_24h - selected.low_24h) || 1)) * 100))}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 차트 */}
                {chartLoading ? (
                  <div className="flex h-72 items-center justify-center rounded-xl border border-border bg-bg-secondary text-sm text-text-secondary animate-pulse">
                    차트 불러오는 중…
                  </div>
                ) : (
                  <div className="rounded-xl border border-border bg-bg-secondary p-4 pb-2">
                    <PriceChart data={chartData ?? []} up={p24up} days={days} />
                  </div>
                )}

                {/* 스탯 카드 */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: "시가총액",   sub: "Market Cap",   value: fmtLarge(selected.market_cap) },
                    { label: "24H 거래량",  sub: "Volume 24H",  value: fmtLarge(selected.total_volume) },
                    { label: "24H 최고",   sub: "High 24H",    value: fmtPrice(selected.high_24h),    up: true },
                    { label: "24H 최저",   sub: "Low 24H",     value: fmtPrice(selected.low_24h),     up: false },
                  ].map(({ label, sub, value, up: statUp }) => (
                    <div key={label} className="flex flex-col gap-1 rounded-xl border border-border bg-bg-secondary px-4 py-3 sm:px-5 sm:py-4">
                      <p className="text-xs font-semibold text-text-secondary">{label}</p>
                      <p className="text-xs text-text-secondary/50">{sub}</p>
                      <p className={`mt-1 font-mono text-base font-bold ${statUp === true ? "text-emerald-400" : statUp === false ? "text-red-400" : "text-text-primary"}`}>
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── 풀스크린 오버레이 ── */}
            {fullscreen && selected && chartData && (
              <div className="fixed inset-0 z-[9999] flex flex-col bg-black">
                {/* 상단 바 */}
                <div className="flex flex-col gap-2 border-b border-white/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
                  {/* 코인 정보 + 가격 */}
                  <div className="flex items-center gap-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={selected.image} alt={selected.name} width={28} height={28} className="rounded-full shrink-0" />
                    <span className="font-bold text-white">{selected.name}</span>
                    <span className="text-sm uppercase text-white/40">{selected.symbol}</span>
                    <span className="font-mono text-lg font-bold text-white sm:text-xl">{fmtPrice(selected.current_price)}</span>
                    <span className={`text-sm font-medium ${p24up ? "text-emerald-400" : "text-red-400"}`}>
                      {fmtPct(selected.price_change_percentage_24h)}
                      <span className="ml-1 text-xs opacity-60">24H</span>
                    </span>
                  </div>
                  {/* 컨트롤 */}
                  <div className="flex items-center gap-2">
                    <div className="flex overflow-hidden rounded-lg border border-white/20">
                      {([1, 7, 30] as const).map(d => (
                        <button key={d} type="button" onClick={() => setDays(d)}
                          className={`px-4 py-1.5 text-xs font-medium transition-colors ${days === d ? "bg-white/20 text-white" : "text-white/50 hover:text-white"}`}>
                          {d === 1 ? "24H" : d === 7 ? "7일" : "30일"}
                        </button>
                      ))}
                    </div>
                    <span className="hidden text-xs text-white/35 sm:inline">ESC 키를 눌러 닫기</span>
                    <button
                      type="button"
                      onClick={() => setFullscreen(false)}
                      className="ml-auto flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/20 text-white/60 transition-colors hover:border-white/50 hover:text-white sm:ml-0"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
                <div className="flex-1 px-3 pb-4 sm:px-6 sm:pb-6" style={{ minHeight: 0 }}>
                  <PriceChart data={chartData} up={p24up} days={days} tall gradId="cg-fs" />
                </div>
              </div>
            )}
          </div>
        )}

        <p className="text-center text-xs text-text-secondary">
          데이터 제공: CoinGecko · {REFRESH_SEC}초마다 자동 갱신 · 투자 참고용으로만 활용하세요
        </p>
      </div>
    </ToolPageLayout>
  );
}