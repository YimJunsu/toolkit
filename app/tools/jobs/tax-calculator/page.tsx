"use client";

import { useState, useMemo } from "react";
import { Calculator, Percent, Receipt, Copy, Check, Info, TrendingDown, UserCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { useClipboard } from "@/hooks/useClipboard";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Jobs", href: "/tools/jobs" },
];

type Tab = "income" | "vat" | "capital" | "freelancer";

/* ─────────────────────────────────────────────
   공통 유틸
───────────────────────────────────────────── */
function comma(n: number, dec = 0) {
  if (!Number.isFinite(n) || n < 0) return "0";
  return n.toLocaleString("ko-KR", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
}

// useClipboard hook은 @/hooks/useClipboard 에서 import

function CopyBtn({
  value, id, copied, copy,
}: {
  value: string; id: string;
  copied: string | null;
  copy: (v: string, id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => copy(value, id)}
      className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
      aria-label="복사"
    >
      {copied === id
        ? <Check size={12} className="text-emerald-400" />
        : <Copy size={12} />}
    </button>
  );
}

/* 연간 + 월간 2열 결과 행 */
function DualRow({
  label, annual, highlight, copied, copy, note,
}: {
  label: string; annual: number; highlight?: boolean;
  copied: string | null; copy: (v: string, id: string) => void;
  note?: string;
}) {
  const annualStr = comma(Math.round(annual));
  const monthlyStr = comma(Math.round(annual / 12));
  return (
    <div className={`grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-4 px-4 py-3 ${highlight ? "bg-brand/5" : ""}`}>
      <div>
        <span className={`text-sm ${highlight ? "font-semibold text-brand" : "text-text-secondary"}`}>{label}</span>
        {note && <p className="mt-0.5 text-[11px] text-text-secondary/60">{note}</p>}
      </div>
      {/* 연간 */}
      <div className="text-right">
        <span className={`font-mono text-sm font-bold ${highlight ? "text-brand" : "text-text-primary"}`}>{annualStr}</span>
        <span className="ml-1 text-xs text-text-secondary">원</span>
      </div>
      {/* 월간 */}
      <div className="min-w-[88px] text-right">
        <span className={`font-mono text-sm ${highlight ? "font-bold text-brand/80" : "font-semibold text-text-secondary"}`}>{monthlyStr}</span>
        <span className="ml-1 text-[11px] text-text-secondary/60">원/월</span>
      </div>
      <CopyBtn value={annualStr} id={label} copied={copied} copy={copy} />
    </div>
  );
}

/* ─────────────────────────────────────────────
   탭 1 : 근로소득세 (2024년 기준)
───────────────────────────────────────────── */
function calcEarnedDeduction(salary: number): number {
  if (salary <= 5_000_000) return salary * 0.7;
  if (salary <= 15_000_000) return 3_500_000 + (salary - 5_000_000) * 0.4;
  if (salary <= 45_000_000) return 7_500_000 + (salary - 15_000_000) * 0.15;
  if (salary <= 100_000_000) return 12_000_000 + (salary - 45_000_000) * 0.05;
  return Math.min(14_750_000, 12_000_000 + (salary - 45_000_000) * 0.05);
}

function calcIncomeTax(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0;
  const brackets = [
    { limit: 14_000_000,    rate: 0.06, deduction: 0 },
    { limit: 50_000_000,    rate: 0.15, deduction: 1_260_000 },
    { limit: 88_000_000,    rate: 0.24, deduction: 5_760_000 },
    { limit: 150_000_000,   rate: 0.35, deduction: 15_440_000 },
    { limit: 300_000_000,   rate: 0.38, deduction: 19_940_000 },
    { limit: 500_000_000,   rate: 0.40, deduction: 25_940_000 },
    { limit: 1_000_000_000, rate: 0.42, deduction: 35_940_000 },
    { limit: Infinity,      rate: 0.45, deduction: 65_940_000 },
  ];
  const b = brackets.find((b) => taxableIncome <= b.limit)!;
  return taxableIncome * b.rate - b.deduction;
}

function calcTaxCredit(tax: number, salary: number): number {
  const credit = tax <= 1_300_000 ? tax * 0.55 : 715_000 + (tax - 1_300_000) * 0.3;
  let limit: number;
  if (salary <= 55_000_000) limit = 660_000;
  else if (salary <= 70_000_000) limit = 660_000 - Math.min(660_000, (salary - 55_000_000) * 0.008);
  else if (salary <= 120_000_000) limit = 500_000;
  else limit = 200_000;
  return Math.min(credit, limit);
}

function calcIncome(salary: number, dependents: number) {
  const np = Math.min(salary * 0.045, 2_480_850);
  const hi = salary * 0.03545;
  const ltc = hi * 0.1295;
  const emp = salary * 0.009;
  const insurance = np + hi + ltc + emp;

  const earnedDed = calcEarnedDeduction(salary);
  const personalDed = 1_500_000 * (1 + dependents);
  const taxBase = Math.max(0, salary - earnedDed - personalDed);

  const taxRaw = calcIncomeTax(taxBase);
  const credit = calcTaxCredit(taxRaw, salary);
  const incomeTax = Math.max(0, taxRaw - credit);
  const localTax = incomeTax * 0.1;
  const totalTax = incomeTax + localTax;
  const netAnnual = salary - insurance - totalTax;

  return { salary, np, hi, ltc, emp, insurance, taxBase, incomeTax, localTax, totalTax, netAnnual };
}

function IncomeTaxTab() {
  const [inputMode, setInputMode] = useState<"annual" | "monthly">("annual");
  const [inputVal, setInputVal] = useState("50000000");
  const [dependents, setDependents] = useState(0);
  const { copied, copy } = useClipboard();

  const rawNum = Math.max(0, Number(inputVal) || 0);
  const salary = inputMode === "annual" ? rawNum : rawNum * 12;
  const r = useMemo(() => calcIncome(salary, dependents), [salary, dependents]);

  const PRESETS_ANNUAL = [3000, 4000, 5000, 7000, 10000, 15000];

  return (
    <div className="flex flex-col gap-6">

      {/* ── 입력 영역 ── */}
      <div className="rounded-xl border border-border bg-bg-secondary">
        <div className="border-b border-border px-4 py-3">
          <p className="text-xs font-semibold text-text-primary">급여 입력</p>
        </div>
        <div className="flex flex-col gap-4 p-4">

          {/* 연봉 / 월급 토글 */}
          <div className="flex overflow-hidden rounded-lg border border-border w-fit">
            {(["annual", "monthly"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setInputMode(m); setInputVal(""); }}
                className={`px-4 py-1.5 text-xs font-semibold transition-colors ${
                  inputMode === m ? "bg-brand text-white" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {m === "annual" ? "연봉 입력" : "월급 입력"}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* 금액 입력 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-text-secondary">
                {inputMode === "annual" ? "연봉" : "월급"} (원)
              </label>
              <input
                type="number"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                min={0}
                step={inputMode === "annual" ? 1_000_000 : 100_000}
                className="rounded-xl border border-border bg-background px-4 py-3 text-right font-mono text-lg font-bold text-text-primary focus:border-brand focus:outline-none"
                placeholder={inputMode === "annual" ? "50,000,000" : "4,000,000"}
              />
              {inputMode === "monthly" && salary > 0 && (
                <p className="text-right text-xs text-text-secondary">
                  연봉 환산 <span className="font-semibold text-brand">{comma(salary)}</span>원
                </p>
              )}
            </div>

            {/* 부양가족 */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs text-text-secondary">부양가족 (본인 제외)</label>
                <span className="font-mono text-sm font-bold text-brand">{dependents}명</span>
              </div>
              <input
                type="range" min={0} max={5} value={dependents}
                onChange={(e) => setDependents(Number(e.target.value))}
                className="mt-1 accent-brand"
              />
              <div className="flex justify-between text-[11px] text-text-secondary">
                <span>0명</span><span>3명</span><span>5명</span>
              </div>
            </div>
          </div>

          {/* 연봉 프리셋 */}
          <div className="flex flex-wrap gap-1.5">
            {PRESETS_ANNUAL.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => { setInputMode("annual"); setInputVal(String(v * 10_000)); }}
                className="rounded-full border border-border px-3 py-1 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
              >
                {v >= 10000 ? `${v / 10000}억` : `${v}만`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {salary > 0 && (
        <>
          {/* ── 실수령 요약 카드 ── */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-brand/30 bg-brand/5 px-4 py-4">
              <p className="mb-1 text-xs text-text-secondary">월 실수령액</p>
              <p className="font-mono text-2xl font-bold text-brand">
                {comma(Math.round(r.netAnnual / 12))}
              </p>
              <p className="mt-0.5 text-xs text-text-secondary">원 / 월</p>
            </div>
            <div className="rounded-xl border border-border bg-bg-secondary px-4 py-4">
              <p className="mb-1 text-xs text-text-secondary">월 공제 합계</p>
              <p className="font-mono text-xl font-bold text-text-primary">
                {comma(Math.round((r.insurance + r.totalTax) / 12))}
              </p>
              <p className="mt-0.5 text-xs text-text-secondary">원 / 월</p>
            </div>
            <div className="rounded-xl border border-border bg-bg-secondary px-4 py-4">
              <p className="mb-1 text-xs text-text-secondary">연간 실수령액</p>
              <p className="font-mono text-xl font-bold text-text-primary">
                {comma(Math.round(r.netAnnual))}
              </p>
              <p className="mt-0.5 text-xs text-text-secondary">원 / 연</p>
            </div>
          </div>

          {/* ── 결과 테이블 (연간 / 월간 2열) ── */}
          <div className="overflow-hidden rounded-xl border border-border">
            {/* 컬럼 헤더 */}
            <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-4 border-b border-border bg-bg-secondary px-4 py-2.5">
              <span className="text-xs font-semibold text-text-primary">항목</span>
              <span className="text-xs font-semibold text-text-secondary">연간</span>
              <span className="min-w-[88px] text-right text-xs font-semibold text-text-secondary">월간</span>
              <span className="size-7" />
            </div>
            <div className="divide-y divide-border">
              <DualRow label="세전 급여" annual={r.salary} copied={copied} copy={copy} />

              {/* 4대보험 그룹 */}
              <div className="border-t border-border bg-bg-secondary/50 px-4 py-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary/70">4대보험</p>
              </div>
              <DualRow label="국민연금" annual={r.np}  note="4.5%" copied={copied} copy={copy} />
              <DualRow label="건강보험" annual={r.hi}  note="3.545%" copied={copied} copy={copy} />
              <DualRow label="장기요양" annual={r.ltc} note="건강보험료 × 12.95%" copied={copied} copy={copy} />
              <DualRow label="고용보험" annual={r.emp} note="0.9%" copied={copied} copy={copy} />
              <DualRow label="4대보험 합계" annual={r.insurance} highlight copied={copied} copy={copy} />

              {/* 세금 그룹 */}
              <div className="border-t border-border bg-bg-secondary/50 px-4 py-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary/70">소득세</p>
              </div>
              <DualRow label="근로소득세" annual={r.incomeTax} copied={copied} copy={copy} />
              <DualRow label="지방소득세" annual={r.localTax} note="소득세 × 10%" copied={copied} copy={copy} />
              <DualRow label="세금 합계" annual={r.totalTax} highlight copied={copied} copy={copy} />

              {/* 실수령 */}
              <div className="border-t-2 border-brand/20" />
              <DualRow label="실수령액" annual={r.netAnnual} highlight copied={copied} copy={copy} />
            </div>
          </div>
        </>
      )}

      <div className="flex items-start gap-2 rounded-xl border border-border bg-bg-secondary px-4 py-3 text-xs text-text-secondary">
        <Info size={13} className="mt-0.5 shrink-0 text-brand" />
        <span>2024년 세법 기준 · 근로소득 세액공제 반영 · 비과세·특별공제 미포함 (참고용)</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   탭 2 : 부가가치세 (VAT)
───────────────────────────────────────────── */
type VatMode = "supply" | "total" | "vatOnly";

function calcVat(amount: number, rate: number, mode: VatMode) {
  const r = rate / 100;
  if (mode === "supply") {
    return { supply: amount, vat: amount * r, total: amount * (1 + r) };
  }
  if (mode === "total") {
    const supply = r > 0 ? amount / (1 + r) : amount;
    return { supply, vat: amount - supply, total: amount };
  }
  const supply = r > 0 ? amount / r : 0;
  return { supply, vat: amount, total: supply + amount };
}

const VAT_MODE_META: { key: VatMode; label: string; desc: string }[] = [
  { key: "supply",  label: "공급가액",      desc: "공급가액을 알고 VAT 계산" },
  { key: "total",   label: "부가세 포함가",  desc: "총액에서 VAT 역산" },
  { key: "vatOnly", label: "부가세만",       desc: "부가세에서 공급가액 역산" },
];

function VatTab() {
  const [input, setInput]     = useState("1000000");
  const [mode, setMode]       = useState<VatMode>("supply");
  const [rateStr, setRateStr] = useState("10");
  const { copied, copy } = useClipboard();

  const amount = Math.max(0, Number(input) || 0);
  const rate   = Math.max(0, Math.min(100, Number(rateStr) || 0));
  const r = useMemo(() => calcVat(amount, rate, mode), [amount, rate, mode]);

  const CARDS: { key: keyof typeof r; label: string; color: string }[] = [
    { key: "supply", label: "공급가액",       color: "border-border" },
    { key: "vat",    label: `부가세 (${rate}%)`, color: "border-border" },
    { key: "total",  label: "합계 (포함가)",  color: "border-border" },
  ];

  return (
    <div className="flex flex-col gap-6">

      {/* ── 입력 모드 선택 ── */}
      <div className="rounded-xl border border-border bg-bg-secondary">
        <div className="border-b border-border px-4 py-3">
          <p className="text-xs font-semibold text-text-primary">알고 있는 금액 선택</p>
        </div>
        <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {VAT_MODE_META.map(({ key, label, desc }) => (
            <button
              key={key}
              type="button"
              onClick={() => setMode(key)}
              className={`flex flex-col gap-0.5 px-4 py-3.5 text-left transition-colors ${
                mode === key ? "bg-brand/8" : "hover:bg-brand/5"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`size-3 rounded-full border-2 transition-colors ${
                  mode === key ? "border-brand bg-brand" : "border-border"
                }`} />
                <span className={`text-sm font-semibold ${mode === key ? "text-brand" : "text-text-primary"}`}>
                  {label}
                </span>
              </div>
              <p className="ml-5 text-xs text-text-secondary">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── 금액 + 세율 입력 ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_160px]">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-text-secondary">
            {VAT_MODE_META.find(m => m.key === mode)?.label} 금액 (원)
          </label>
          <input
            type="number" value={input}
            onChange={(e) => setInput(e.target.value)}
            min={0} step={10000}
            className="rounded-xl border border-border bg-bg-secondary px-4 py-3 text-right font-mono text-xl font-bold text-text-primary focus:border-brand focus:outline-none"
            placeholder="0"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-text-secondary">세율 (%)</label>
          <div className="flex flex-col gap-2">
            <input
              type="number" value={rateStr}
              onChange={(e) => setRateStr(e.target.value)}
              min={0} max={100} step={1}
              className="rounded-xl border border-border bg-bg-secondary px-4 py-3 text-right font-mono text-xl font-bold text-text-primary focus:border-brand focus:outline-none"
            />
            <div className="flex gap-1.5">
              {[0, 5, 10].map((v) => (
                <button key={v} type="button" onClick={() => setRateStr(String(v))}
                  className={`flex-1 rounded-lg border py-1.5 text-xs font-semibold transition-colors ${
                    Number(rateStr) === v
                      ? "border-brand bg-brand/10 text-brand"
                      : "border-border text-text-secondary hover:border-brand/40 hover:text-brand"
                  }`}
                >
                  {v}%{v === 10 ? " 기본" : v === 0 ? " 면세" : ""}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── 결과 3 카드 ── */}
      {amount > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {CARDS.map(({ key, label }) => {
            const val = r[key];
            const isActive = (
              (key === "supply" && mode === "supply") ||
              (key === "vat"    && mode === "vatOnly") ||
              (key === "total"  && mode === "total")
            );
            const valStr = comma(Math.round(val));
            return (
              <div
                key={key}
                className={`relative overflow-hidden rounded-xl border px-5 py-4 transition-colors ${
                  isActive ? "border-brand bg-brand/5" : "border-border bg-bg-secondary"
                }`}
              >
                {isActive && (
                  <div className="absolute right-3 top-3 rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-bold text-brand">
                    입력값
                  </div>
                )}
                <p className="mb-2 text-xs text-text-secondary">{label}</p>
                <p className={`font-mono text-2xl font-bold ${isActive ? "text-brand" : "text-text-primary"}`}>
                  {valStr}
                </p>
                <p className="mb-3 text-xs text-text-secondary">원</p>
                <button
                  type="button"
                  onClick={() => copy(valStr, key)}
                  className="flex items-center gap-1.5 text-xs text-text-secondary transition-colors hover:text-brand"
                >
                  {copied === key
                    ? <Check size={12} className="text-emerald-400" />
                    : <Copy size={12} />}
                  복사
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-start gap-2 rounded-xl border border-border bg-bg-secondary px-4 py-3 text-xs text-text-secondary">
        <Info size={13} className="mt-0.5 shrink-0 text-brand" />
        <span>일반과세자 기본 세율 10% · 면세사업자 0% · 간이과세자 업종별 상이</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   탭 3 : 양도소득세 (2024년 기준)
───────────────────────────────────────────── */
function getLtRate(years: number, isOneHouse: boolean): number {
  if (years < 3) return 0;
  if (isOneHouse) {
    const table: [number, number][] = [
      [10,0.8],[9,0.72],[8,0.64],[7,0.56],[6,0.48],[5,0.4],[4,0.32],[3,0.24],
    ];
    return table.find(([y]) => years >= y)?.[1] ?? 0;
  }
  return Math.min(0.3, (years - 2) * 0.02);
}

function calcCapitalTax(taxBase: number): number {
  if (taxBase <= 0) return 0;
  const brackets = [
    { limit: 14_000_000,    rate: 0.06, ded: 0 },
    { limit: 50_000_000,    rate: 0.15, ded: 1_260_000 },
    { limit: 88_000_000,    rate: 0.24, ded: 5_760_000 },
    { limit: 150_000_000,   rate: 0.35, ded: 15_440_000 },
    { limit: 300_000_000,   rate: 0.38, ded: 19_940_000 },
    { limit: 500_000_000,   rate: 0.40, ded: 25_940_000 },
    { limit: 1_000_000_000, rate: 0.42, ded: 35_940_000 },
    { limit: Infinity,      rate: 0.45, ded: 65_940_000 },
  ];
  const b = brackets.find((b) => taxBase <= b.limit)!;
  return taxBase * b.rate - b.ded;
}

function calcCapital(acquire: number, transfer: number, expenses: number, years: number, isOneHouse: boolean) {
  const gain = transfer - acquire - expenses;
  if (gain <= 0) return null;
  const ltRate = getLtRate(years, isOneHouse);
  const ltDed = gain * ltRate;
  const basicDed = 2_500_000;
  const taxBase = Math.max(0, gain - ltDed - basicDed);
  const capTax = calcCapitalTax(taxBase);
  const localTax = capTax * 0.1;
  const total = capTax + localTax;
  return { gain, ltRate, ltDed, basicDed, taxBase, capTax, localTax, total, net: gain - total, rate: gain > 0 ? (total / gain) * 100 : 0 };
}

function SimpleRow({ label, value, sub, highlight, copied, copy }: {
  label: string; value: number; sub?: string; highlight?: boolean;
  copied: string | null; copy: (v: string, id: string) => void;
}) {
  const str = comma(Math.round(value));
  return (
    <div className={`flex items-center gap-3 px-4 py-3 ${highlight ? "bg-brand/5" : ""}`}>
      <div className="flex-1">
        <span className={`text-sm ${highlight ? "font-semibold text-brand" : "text-text-secondary"}`}>{label}</span>
        {sub && <span className="ml-1.5 text-xs text-text-secondary/60">{sub}</span>}
      </div>
      <span className={`font-mono text-sm font-bold ${highlight ? "text-brand" : "text-text-primary"}`}>
        {str} <span className="text-xs font-normal text-text-secondary">원</span>
      </span>
      <CopyBtn value={str} id={label} copied={copied} copy={copy} />
    </div>
  );
}

function CapitalGainsTaxTab() {
  const [acquire,  setAcquire]  = useState("300000000");
  const [transfer, setTransfer] = useState("500000000");
  const [expenses, setExpenses] = useState("5000000");
  const [years,    setYears]    = useState(5);
  const [oneHouse, setOneHouse] = useState(false);
  const { copied, copy } = useClipboard();

  const aq = Math.max(0, Number(acquire)  || 0);
  const tr = Math.max(0, Number(transfer) || 0);
  const ex = Math.max(0, Number(expenses) || 0);
  const r  = useMemo(() => calcCapital(aq, tr, ex, years, oneHouse), [aq, tr, ex, years, oneHouse]);

  const ltPct = getLtRate(years, oneHouse) * 100;

  return (
    <div className="flex flex-col gap-6">

      {/* ── 입력 ── */}
      <div className="rounded-xl border border-border bg-bg-secondary">
        <div className="border-b border-border px-4 py-3">
          <p className="text-xs font-semibold text-text-primary">부동산 정보 입력</p>
        </div>
        <div className="flex flex-col gap-4 p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              { label: "취득가액", val: acquire, set: setAcquire, step: 10_000_000, ph: "300,000,000" },
              { label: "양도가액", val: transfer, set: setTransfer, step: 10_000_000, ph: "500,000,000" },
              { label: "필요경비 (취득세·중개비 등)", val: expenses, set: setExpenses, step: 100_000, ph: "5,000,000" },
            ].map(({ label, val, set, step, ph }) => (
              <div key={label} className="flex flex-col gap-1.5">
                <label className="text-xs text-text-secondary">{label} (원)</label>
                <input
                  type="number" value={val}
                  onChange={(e) => set(e.target.value)}
                  min={0} step={step}
                  className="rounded-xl border border-border bg-background px-4 py-3 text-right font-mono text-base font-bold text-text-primary focus:border-brand focus:outline-none"
                  placeholder={ph}
                />
              </div>
            ))}

            {/* 보유기간 */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs text-text-secondary">보유기간</label>
                <span className="font-mono text-sm font-bold text-brand">{years}년
                  {ltPct > 0 && <span className="ml-1.5 text-xs font-normal text-text-secondary">공제율 {ltPct}%</span>}
                </span>
              </div>
              <input type="range" min={0} max={20} value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="mt-1 accent-brand"
              />
              <div className="flex justify-between text-[11px] text-text-secondary">
                <span>0년</span><span>10년 (공제 18%)</span><span>20년 (공제 30%)</span>
              </div>
            </div>
          </div>

          {/* 1가구 1주택 */}
          <button type="button" onClick={() => setOneHouse(v => !v)}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
              oneHouse ? "border-brand bg-brand/5" : "border-border hover:border-brand/30"
            }`}
          >
            <div className={`flex size-5 items-center justify-center rounded border-2 transition-colors ${
              oneHouse ? "border-brand bg-brand" : "border-border"
            }`}>
              {oneHouse && <Check size={12} className="text-white" />}
            </div>
            <div className="text-left">
              <p className={`font-semibold ${oneHouse ? "text-brand" : "text-text-primary"}`}>
                1가구 1주택 적용
              </p>
              <p className="text-xs text-text-secondary">3년 보유 시 24% ~ 10년 이상 80% 장기보유특별공제</p>
            </div>
          </button>
        </div>
      </div>

      {/* ── 결과 없음 ── */}
      {(tr > 0 && tr <= aq + ex) && (
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-border px-4 py-4 text-sm text-text-secondary">
          <TrendingDown size={16} className="shrink-0" />
          양도차익이 없으면 양도소득세 과세 대상이 아닙니다.
        </div>
      )}

      {/* ── 결과 ── */}
      {r && (
        <>
          {/* 요약 카드 2개 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-brand/30 bg-brand/5 px-4 py-4">
              <p className="mb-1 text-xs text-text-secondary">납부 예상 세액</p>
              <p className="font-mono text-2xl font-bold text-brand">{comma(Math.round(r.total))}</p>
              <p className="mt-0.5 text-xs text-text-secondary">원 · 실효세율 {r.rate.toFixed(1)}%</p>
            </div>
            <div className="rounded-xl border border-border bg-bg-secondary px-4 py-4">
              <p className="mb-1 text-xs text-text-secondary">실질 수익 (세후)</p>
              <p className="font-mono text-2xl font-bold text-text-primary">{comma(Math.round(r.net))}</p>
              <p className="mt-0.5 text-xs text-text-secondary">원</p>
            </div>
          </div>

          {/* 단계별 계산 내역 */}
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="border-b border-border bg-bg-secondary px-4 py-3 text-xs font-semibold text-text-primary">
              계산 단계
            </div>
            <div className="divide-y divide-border">
              <SimpleRow label="① 양도차익" value={r.gain}
                sub={`(양도 ${comma(tr)} − 취득 ${comma(aq)} − 경비 ${comma(ex)})`}
                copied={copied} copy={copy} />

              <SimpleRow label="② 장기보유특별공제"
                value={r.ltDed}
                sub={years >= 3 ? `${years}년 보유 · ${ltPct.toFixed(0)}%` : "3년 미만 · 해당 없음"}
                copied={copied} copy={copy} />

              <SimpleRow label="③ 기본공제" value={r.basicDed}
                sub="연 250만 원"
                copied={copied} copy={copy} />

              <SimpleRow label="④ 과세표준" value={r.taxBase}
                sub="① − ② − ③"
                highlight copied={copied} copy={copy} />

              <div className="border-t border-border/50" />

              <SimpleRow label="⑤ 양도소득세" value={r.capTax} copied={copied} copy={copy} />
              <SimpleRow label="⑥ 지방소득세" value={r.localTax} sub="⑤ × 10%" copied={copied} copy={copy} />
              <SimpleRow label="납부 예상 세액 (⑤+⑥)" value={r.total} highlight copied={copied} copy={copy} />
            </div>
          </div>
        </>
      )}

      <div className="flex items-start gap-2 rounded-xl border border-border bg-bg-secondary px-4 py-3 text-xs text-text-secondary">
        <Info size={13} className="mt-0.5 shrink-0 text-brand" />
        <span>2024년 기준 · 단기양도(2년 미만) 중과세 · 다주택자 중과세율 미포함 (참고용)</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   탭 4 : 프리랜서 3.3% 계산기
───────────────────────────────────────────── */
function calcFreelancer(contract: number, annualTotal: number, expenseRate: number) {
  const withheld = contract * 0.033;          // 원천징수 3.3%
  const net      = contract - withheld;       // 실지급액

  // 종합소득세 시뮬레이션 (단순경비율 기준)
  const expense     = annualTotal * (expenseRate / 100);
  const taxableIncome = Math.max(0, annualTotal - expense - 1_500_000); // 기본공제 150만
  const incomeTax   = calcIncomeTax(taxableIncome);
  const localTax    = incomeTax * 0.1;
  const totalOwed   = incomeTax + localTax;

  const paidSoFar   = annualTotal * 0.033;    // 연간 납부한 원천징수 총액
  const refund      = paidSoFar - totalOwed;  // + 면 환급, - 면 추납

  return { withheld, net, taxableIncome, incomeTax, localTax, totalOwed, paidSoFar, refund };
}

function FreelancerTab() {
  const [contractInput, setContract] = useState("3000000");
  const [annualInput,   setAnnual]   = useState("30000000");
  const [expenseRate,   setExpense]  = useState(60); // %
  const { copied, copy } = useClipboard();

  const contract   = Math.max(0, Number(contractInput)   || 0);
  const annual     = Math.max(0, Number(annualInput)     || 0);
  const r = useMemo(() => calcFreelancer(contract, annual, expenseRate), [contract, annual, expenseRate]);

  const fmt = (n: number) => comma(Math.round(n));

  const QuickRow = ({ label, value, unit, highlight }: {
    label: string; value: number; unit?: string; highlight?: boolean;
  }) => {
    const str = fmt(value);
    return (
      <div className={`flex items-center gap-3 px-4 py-3 ${highlight ? "bg-brand/5" : ""}`}>
        <span className={`flex-1 text-sm ${highlight ? "font-semibold text-brand" : "text-text-secondary"}`}>{label}</span>
        <span className={`font-mono text-sm font-bold ${highlight ? "text-brand" : "text-text-primary"}`}>
          {str}{unit && <span className="ml-1 text-xs font-normal text-text-secondary">{unit}</span>}
        </span>
        <button type="button" onClick={() => copy(str, label)}
          className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:border-brand/50 hover:text-brand">
          {copied === label ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">

      {/* ── 입력 ── */}
      <div className="rounded-xl border border-border bg-bg-secondary">
        <div className="border-b border-border px-4 py-3">
          <p className="text-xs font-semibold text-text-primary">계약 정보 입력</p>
        </div>
        <div className="flex flex-col gap-4 p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-text-secondary">이번 계약 금액 (원)</label>
              <input
                type="number" value={contractInput}
                onChange={(e) => setContract(e.target.value)}
                min={0} step={100000}
                className="rounded-xl border border-border bg-background px-4 py-3 text-right font-mono text-xl font-bold text-text-primary focus:border-brand focus:outline-none"
                placeholder="3,000,000"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-text-secondary">연간 예상 총 수입 (환급 시뮬레이션용)</label>
              <input
                type="number" value={annualInput}
                onChange={(e) => setAnnual(e.target.value)}
                min={0} step={1000000}
                className="rounded-xl border border-border bg-background px-4 py-3 text-right font-mono text-xl font-bold text-text-primary focus:border-brand focus:outline-none"
                placeholder="30,000,000"
              />
            </div>
          </div>

          {/* 필요경비율 슬라이더 */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-text-secondary">단순경비율 (업종별 상이)</label>
              <span className="font-mono text-sm font-bold text-brand">{expenseRate}%</span>
            </div>
            <input type="range" min={40} max={90} value={expenseRate}
              onChange={(e) => setExpense(Number(e.target.value))}
              className="accent-brand"
            />
            <div className="flex justify-between text-[11px] text-text-secondary">
              <span>40% (전문직)</span><span>60% (IT·서비스)</span><span>90% (도소매)</span>
            </div>
          </div>

          {/* 프리셋 */}
          <div className="flex flex-wrap gap-1.5">
            {[1000000, 3000000, 5000000, 10000000].map((v) => (
              <button key={v} type="button" onClick={() => setContract(String(v))}
                className="rounded-full border border-border px-3 py-1 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-brand">
                {(v / 10000).toLocaleString()}만
              </button>
            ))}
          </div>
        </div>
      </div>

      {contract > 0 && (
        <>
          {/* ── 이번 계약 요약 ── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-bg-secondary px-4 py-4">
              <p className="mb-1 text-xs text-text-secondary">계약 금액 (세전)</p>
              <p className="font-mono text-lg font-bold text-text-primary">{fmt(contract)}</p>
              <p className="mt-0.5 text-xs text-text-secondary">원</p>
            </div>
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-4">
              <p className="mb-1 text-xs text-text-secondary">원천징수 (3.3%)</p>
              <p className="font-mono text-lg font-bold text-amber-400">- {fmt(r.withheld)}</p>
              <p className="mt-0.5 text-xs text-text-secondary">원</p>
            </div>
            <div className="col-span-2 rounded-xl border border-brand/30 bg-brand/5 px-4 py-4 sm:col-span-1">
              <p className="mb-1 text-xs text-text-secondary">실지급액</p>
              <p className="font-mono text-xl font-bold text-brand">{fmt(r.net)}</p>
              <p className="mt-0.5 text-xs text-text-secondary">원</p>
            </div>
          </div>

          {/* ── 이번 계약 내역 ── */}
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="border-b border-border bg-bg-secondary px-4 py-3 text-xs font-semibold text-text-primary">
              이번 계약 계산 내역
            </div>
            <div className="divide-y divide-border">
              <QuickRow label="계약금액 (세전)" value={contract} unit="원" />
              <QuickRow label="원천징수 (소득세 3% + 지방소득세 0.3%)" value={r.withheld} unit="원" />
              <QuickRow label="실지급액" value={r.net} unit="원" highlight />
            </div>
          </div>
        </>
      )}

      {annual > 0 && (
        <>
          {/* ── 종합소득세 환급 시뮬레이션 ── */}
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="border-b border-border bg-bg-secondary px-4 py-3 text-xs font-semibold text-text-primary">
              종합소득세 신고 시뮬레이션 (연간 수입 기준)
            </div>
            <div className="divide-y divide-border">
              <QuickRow label="연간 총 수입" value={annual} unit="원" />
              <QuickRow label={`단순경비 (${expenseRate}%)`} value={annual * expenseRate / 100} unit="원" />
              <QuickRow label="기본공제" value={1_500_000} unit="원" />
              <QuickRow label="과세표준" value={r.taxableIncome} unit="원" />
              <QuickRow label="종합소득세 + 지방소득세" value={r.totalOwed} unit="원" />
              <QuickRow label="이미 납부한 원천징수 합계" value={r.paidSoFar} unit="원" />
            </div>

            {/* 환급/추납 결과 */}
            <div className={`flex items-center gap-4 px-4 py-4 ${r.refund >= 0 ? "bg-emerald-500/5" : "bg-red-500/5"}`}>
              <div className="flex-1">
                <p className={`text-sm font-semibold ${r.refund >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {r.refund >= 0 ? "📩 예상 환급액" : "💸 예상 추가 납부액"}
                </p>
                <p className="mt-0.5 text-xs text-text-secondary">
                  {r.refund >= 0
                    ? "5월 종합소득세 신고 후 환급 신청"
                    : "5월 종합소득세 신고 시 추가 납부 필요"}
                </p>
              </div>
              <span className={`font-mono text-xl font-bold ${r.refund >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {r.refund >= 0 ? "+" : ""}{fmt(Math.abs(r.refund))}
                <span className="ml-1 text-xs font-normal text-text-secondary">원</span>
              </span>
              <button type="button" onClick={() => copy(fmt(Math.abs(r.refund)), "refund")}
                className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:border-brand/50 hover:text-brand">
                {copied === "refund" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              </button>
            </div>
          </div>
        </>
      )}

      <div className="flex items-start gap-2 rounded-xl border border-border bg-bg-secondary px-4 py-3 text-xs text-text-secondary">
        <Info size={13} className="mt-0.5 shrink-0 text-brand" />
        <span>
          단순경비율 기준 · 업종별 필요경비율은 국세청 홈택스에서 확인 ·
          종합소득세 신고는 매년 5월 (참고용, 세무사 상담 권장)
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   메인 페이지
───────────────────────────────────────────── */
const TABS: { key: Tab; label: string; icon: LucideIcon }[] = [
  { key: "income",     label: "근로소득세",     icon: Calculator },
  { key: "vat",        label: "부가가치세(VAT)", icon: Percent },
  { key: "capital",    label: "양도소득세",     icon: Receipt },
  { key: "freelancer", label: "프리랜서 3.3%",  icon: UserCheck },
];

export default function TaxCalculatorPage() {
  const [tab, setTab] = useState<Tab>("income");

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="세금 계산기"
      description="근로소득세 · 부가가치세(VAT) · 양도소득세를 탭으로 전환하며 계산합니다."
      icon={Calculator}
    >
      <div className="flex flex-col gap-6">

        {/* 탭 */}
        <div className="flex overflow-hidden rounded-xl border border-border">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                tab === key
                  ? "bg-brand text-white"
                  : "text-text-secondary hover:bg-brand/5 hover:text-text-primary"
              }`}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{label.split("(")[0].trim()}</span>
            </button>
          ))}
        </div>

        {tab === "income"     && <IncomeTaxTab />}
        {tab === "vat"        && <VatTab />}
        {tab === "capital"    && <CapitalGainsTaxTab />}
        {tab === "freelancer" && <FreelancerTab />}
      </div>
    </ToolPageLayout>
  );
}