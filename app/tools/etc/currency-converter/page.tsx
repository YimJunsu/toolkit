"use client";

import { useState, useEffect, useMemo } from "react";
import { DollarSign, RefreshCw, Search, ArrowLeftRight, Copy, Check } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "기타", href: "/tools/etc" },
];

const RATES_URL = "https://open.er-api.com/v6/latest/USD";

/* ── 통화 목록 ── */
const CURRENCY_META: Record<string, { name: string; flag: string }> = {
  USD: { name: "미국 달러",       flag: "🇺🇸" },
  KRW: { name: "한국 원",         flag: "🇰🇷" },
  JPY: { name: "일본 엔",         flag: "🇯🇵" },
  EUR: { name: "유로",            flag: "🇪🇺" },
  GBP: { name: "영국 파운드",     flag: "🇬🇧" },
  CNY: { name: "중국 위안",       flag: "🇨🇳" },
  HKD: { name: "홍콩 달러",       flag: "🇭🇰" },
  SGD: { name: "싱가포르 달러",   flag: "🇸🇬" },
  AUD: { name: "호주 달러",       flag: "🇦🇺" },
  CAD: { name: "캐나다 달러",     flag: "🇨🇦" },
  CHF: { name: "스위스 프랑",     flag: "🇨🇭" },
  TWD: { name: "대만 달러",       flag: "🇹🇼" },
  THB: { name: "태국 바트",       flag: "🇹🇭" },
  VND: { name: "베트남 동",       flag: "🇻🇳" },
  MXN: { name: "멕시코 페소",     flag: "🇲🇽" },
  BRL: { name: "브라질 헤알",     flag: "🇧🇷" },
  INR: { name: "인도 루피",       flag: "🇮🇳" },
  RUB: { name: "러시아 루블",     flag: "🇷🇺" },
  IDR: { name: "인도네시아 루피아", flag: "🇮🇩" },
  MYR: { name: "말레이시아 링깃", flag: "🇲🇾" },
  PHP: { name: "필리핀 페소",     flag: "🇵🇭" },
  NZD: { name: "뉴질랜드 달러",   flag: "🇳🇿" },
  SEK: { name: "스웨덴 크로나",   flag: "🇸🇪" },
  NOK: { name: "노르웨이 크로네", flag: "🇳🇴" },
  DKK: { name: "덴마크 크로네",   flag: "🇩🇰" },
  SAR: { name: "사우디 리얄",     flag: "🇸🇦" },
  AED: { name: "UAE 디르함",      flag: "🇦🇪" },
  TRY: { name: "터키 리라",       flag: "🇹🇷" },
  ZAR: { name: "남아공 랜드",     flag: "🇿🇦" },
  PLN: { name: "폴란드 즐로티",   flag: "🇵🇱" },
};

const POPULAR_ORDER = [
  "USD","KRW","JPY","EUR","GBP","CNY","HKD","SGD","AUD","CAD",
  "CHF","TWD","THB","VND","INR","MYR","PHP","IDR",
];

/* ── Helpers ── */
function fmtAmount(n: number, code: string): string {
  if (!Number.isFinite(n)) return "—";
  if (n >= 1000) {
    return n.toLocaleString("ko-KR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  const decimals = ["KRW","JPY","VND","IDR","KWD"].includes(code) ? 0 : 4;
  return n.toLocaleString("ko-KR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/* ── Main ── */
export default function CurrencyConverterPage() {
  const [rates, setRates]           = useState<Record<string, number>>({});
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const [amount, setAmount]         = useState("1");
  const [from, setFrom]             = useState("USD");
  const [search, setSearch]         = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchRates = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(RATES_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.result !== "success") throw new Error("환율 데이터 오류");
      setRates(data.rates);
      setLastUpdated(data.time_last_update_utc);
    } catch (e) {
      setError(e instanceof Error ? e.message : "불러오기 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRates(); }, []);

  /* amount를 from → to 변환 */
  const convert = (toCode: string): number => {
    const n = parseFloat(amount);
    if (!Number.isFinite(n) || !rates[from] || !rates[toCode]) return 0;
    return (n / rates[from]) * rates[toCode];
  };

  /* 표시할 통화 목록 (검색 반영) */
  const displayCurrencies = useMemo(() => {
    const allCodes = Object.keys(CURRENCY_META);
    const q = search.toLowerCase();
    const filtered = q
      ? allCodes.filter(c =>
          c.toLowerCase().includes(q) ||
          (CURRENCY_META[c]?.name ?? "").toLowerCase().includes(q)
        )
      : POPULAR_ORDER.filter(c => allCodes.includes(c));
    return filtered.filter(c => c !== from);
  }, [search, from]);

  const handleCopy = async (code: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  const fromMeta = CURRENCY_META[from];
  const numAmount = parseFloat(amount) || 0;

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="환율 변환기"
      description="160개 통화 환율을 조회하고 변환합니다. 매일 00:00 UTC 기준으로 업데이트됩니다."
      icon={DollarSign}
    >
      <div className="flex flex-col gap-5">

        {/* 업데이트 안내 */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-bg-secondary px-4 py-3">
          <div className="text-xs text-text-secondary">
            <span className="font-semibold text-text-primary">ExchangeRate-API</span> 제공 ·{" "}
            {lastUpdated
              ? `${new Date(lastUpdated).toLocaleDateString("ko-KR")} 기준`
              : "불러오는 중…"}
            {" "}· 일 1회 업데이트
          </div>
          <button type="button" onClick={fetchRates}
            className="flex items-center gap-1.5 text-xs text-text-secondary transition-colors hover:text-brand">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            새로고침
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* 입력 영역 */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr]">
          {/* 금액 + 기준 통화 */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-text-secondary">금액</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              min={0}
              step="any"
              className="w-full rounded-xl border border-border bg-bg-secondary px-4 py-3 text-right font-mono text-xl font-bold text-text-primary focus:border-brand focus:outline-none"
              placeholder="1"
            />
          </div>

          {/* 화살표 */}
          <div className="flex items-end justify-center pb-3">
            <ArrowLeftRight size={20} className="text-brand" />
          </div>

          {/* 기준 통화 선택 */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-text-secondary">기준 통화</label>
            <select
              value={from}
              onChange={e => setFrom(e.target.value)}
              className="w-full rounded-xl border border-border bg-bg-secondary px-4 py-3 text-sm text-text-primary focus:border-brand focus:outline-none"
            >
              {Object.entries(CURRENCY_META).map(([code, { name, flag }]) => (
                <option key={code} value={code}>{flag} {code} — {name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 기준 통화 현황 */}
        {!loading && numAmount > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-brand/30 bg-brand/5 px-4 py-3">
            <span className="text-2xl">{fromMeta?.flag}</span>
            <div>
              <p className="text-lg font-bold text-text-primary">
                {fmtAmount(numAmount, from)} <span className="text-sm font-normal text-text-secondary">{from}</span>
              </p>
              <p className="text-xs text-text-secondary">{fromMeta?.name}</p>
            </div>
          </div>
        )}

        {/* 검색 */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="통화 검색 (KRW, 엔, Euro…)"
            className="w-full rounded-xl border border-border bg-bg-secondary py-2.5 pl-9 pr-4 text-sm text-text-primary placeholder-text-secondary/50 focus:border-brand focus:outline-none"
          />
        </div>

        {/* 변환 결과 목록 */}
        {loading ? (
          <div className="flex h-32 items-center justify-center text-sm text-text-secondary animate-pulse">
            환율 불러오는 중…
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="divide-y divide-border">
              {displayCurrencies.map(code => {
                const meta = CURRENCY_META[code];
                const converted = convert(code);
                const display = fmtAmount(converted, code);
                return (
                  <div key={code} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-brand/5">
                    <span className="w-7 shrink-0 text-xl">{meta?.flag ?? "🏳"}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-text-primary">{code}</p>
                      <p className="text-xs text-text-secondary">{meta?.name ?? code}</p>
                    </div>
                    <p className="font-mono text-base font-bold text-text-primary">{display}</p>
                    <button
                      type="button"
                      onClick={() => handleCopy(code, display)}
                      className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
                      aria-label="복사"
                    >
                      {copiedCode === code
                        ? <Check size={12} className="text-emerald-400" />
                        : <Copy size={12} />}
                    </button>
                  </div>
                );
              })}
              {displayCurrencies.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-text-secondary">
                  검색 결과 없음
                </div>
              )}
            </div>
          </div>
        )}

        {/* 전체 통화 안내 */}
        {!search && (
          <p className="text-center text-xs text-text-secondary">
            인기 통화 {displayCurrencies.length}개 표시 중 · 검색으로 160개 전체 통화 조회 가능
          </p>
        )}
      </div>
    </ToolPageLayout>
  );
}