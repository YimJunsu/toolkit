"use client";

import { useState, useMemo } from "react";
import {
  Calculator, Percent, Receipt, Copy, Check, Info,
  TrendingDown, UserCheck, Clock, Building2, Briefcase,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { useClipboard } from "@/hooks/useClipboard";

// ── Breadcrumbs ──────────────────────────────────────────────────────────
const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Jobs", href: "/tools/jobs" },
];

// ── Shared Utils ─────────────────────────────────────────────────────────

function comma(n: number, dec = 0) {
  if (!Number.isFinite(n) || n < 0) return "0";
  return n.toLocaleString("ko-KR", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
}

function CopyBtn({ value, id, copied, copy }: {
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

// ════════════════════════════════════════════════════════════════════════
//  SECTION 1 : 세금 계산기
// ════════════════════════════════════════════════════════════════════════

type TaxTab = "income" | "vat" | "capital" | "freelancer";

/* ── 공통 결과 행 컴포넌트 ── */
function DualRow({ label, annual, highlight, copied, copy, note }: {
  label: string; annual: number; highlight?: boolean;
  copied: string | null; copy: (v: string, id: string) => void;
  note?: string;
}) {
  const annualStr  = comma(Math.round(annual));
  const monthlyStr = comma(Math.round(annual / 12));
  return (
    <div className={`grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-4 px-4 py-3 ${highlight ? "bg-brand/5" : ""}`}>
      <div>
        <span className={`text-sm ${highlight ? "font-semibold text-brand" : "text-text-secondary"}`}>{label}</span>
        {note && <p className="mt-0.5 text-[11px] text-text-secondary/60">{note}</p>}
      </div>
      <div className="text-right">
        <span className={`font-mono text-sm font-bold ${highlight ? "text-brand" : "text-text-primary"}`}>{annualStr}</span>
        <span className="ml-1 text-xs text-text-secondary">원</span>
      </div>
      <div className="min-w-[88px] text-right">
        <span className={`font-mono text-sm ${highlight ? "font-bold text-brand/80" : "font-semibold text-text-secondary"}`}>{monthlyStr}</span>
        <span className="ml-1 text-[11px] text-text-secondary/60">원/월</span>
      </div>
      <CopyBtn value={annualStr} id={label} copied={copied} copy={copy} />
    </div>
  );
}

/* ── 근로소득세 계산 로직 ── */
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
  const np  = Math.min(salary * 0.045, 2_480_850);
  const hi  = salary * 0.03545;
  const ltc = hi * 0.1295;
  const emp = salary * 0.009;
  const insurance = np + hi + ltc + emp;
  const earnedDed = calcEarnedDeduction(salary);
  const personalDed = 1_500_000 * (1 + dependents);
  const taxBase = Math.max(0, salary - earnedDed - personalDed);
  const taxRaw  = calcIncomeTax(taxBase);
  const credit  = calcTaxCredit(taxRaw, salary);
  const incomeTax = Math.max(0, taxRaw - credit);
  const localTax  = incomeTax * 0.1;
  const totalTax  = incomeTax + localTax;
  const netAnnual = salary - insurance - totalTax;
  return { salary, np, hi, ltc, emp, insurance, taxBase, incomeTax, localTax, totalTax, netAnnual };
}

function IncomeTaxTab() {
  const [inputMode, setInputMode] = useState<"annual" | "monthly">("annual");
  const [inputVal,  setInputVal]  = useState("50000000");
  const [dependents, setDependents] = useState(0);
  const { copied, copy } = useClipboard();

  const rawNum = Math.max(0, Number(inputVal) || 0);
  const salary = inputMode === "annual" ? rawNum : rawNum * 12;
  const r = useMemo(() => calcIncome(salary, dependents), [salary, dependents]);

  const PRESETS_ANNUAL = [3000, 4000, 5000, 7000, 10000, 15000];

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-border bg-bg-secondary">
        <div className="border-b border-border px-4 py-3">
          <p className="text-xs font-semibold text-text-primary">급여 입력</p>
        </div>
        <div className="flex flex-col gap-4 p-4">
          <div className="flex w-fit overflow-hidden rounded-lg border border-border">
            {(["annual", "monthly"] as const).map((m) => (
              <button key={m} type="button"
                onClick={() => { setInputMode(m); setInputVal(""); }}
                className={`px-4 py-1.5 text-xs font-semibold transition-colors ${
                  inputMode === m ? "bg-brand text-white" : "text-text-secondary hover:text-text-primary"
                }`}>
                {m === "annual" ? "연봉 입력" : "월급 입력"}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-text-secondary">
                {inputMode === "annual" ? "연봉" : "월급"} (원)
              </label>
              <input type="number" value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                min={0} step={inputMode === "annual" ? 1_000_000 : 100_000}
                className="rounded-xl border border-border bg-background px-4 py-3 text-right font-mono text-lg font-bold text-text-primary focus:border-brand focus:outline-none"
                placeholder={inputMode === "annual" ? "50,000,000" : "4,000,000"}
              />
              {inputMode === "monthly" && salary > 0 && (
                <p className="text-right text-xs text-text-secondary">
                  연봉 환산 <span className="font-semibold text-brand">{comma(salary)}</span>원
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs text-text-secondary">부양가족 (본인 제외)</label>
                <span className="font-mono text-sm font-bold text-brand">{dependents}명</span>
              </div>
              <input type="range" min={0} max={5} value={dependents}
                onChange={(e) => setDependents(Number(e.target.value))}
                className="mt-1 accent-brand" />
              <div className="flex justify-between text-[11px] text-text-secondary">
                <span>0명</span><span>3명</span><span>5명</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS_ANNUAL.map((v) => (
              <button key={v} type="button"
                onClick={() => { setInputMode("annual"); setInputVal(String(v * 10_000)); }}
                className="rounded-full border border-border px-3 py-1 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-brand">
                {v >= 10000 ? `${v / 10000}억` : `${v}만`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {salary > 0 && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-brand/30 bg-brand/5 px-4 py-4">
              <p className="mb-1 text-xs text-text-secondary">월 실수령액</p>
              <p className="font-mono text-2xl font-bold text-brand">{comma(Math.round(r.netAnnual / 12))}</p>
              <p className="mt-0.5 text-xs text-text-secondary">원 / 월</p>
            </div>
            <div className="rounded-xl border border-border bg-bg-secondary px-4 py-4">
              <p className="mb-1 text-xs text-text-secondary">월 공제 합계</p>
              <p className="font-mono text-xl font-bold text-text-primary">{comma(Math.round((r.insurance + r.totalTax) / 12))}</p>
              <p className="mt-0.5 text-xs text-text-secondary">원 / 월</p>
            </div>
            <div className="rounded-xl border border-border bg-bg-secondary px-4 py-4">
              <p className="mb-1 text-xs text-text-secondary">연간 실수령액</p>
              <p className="font-mono text-xl font-bold text-text-primary">{comma(Math.round(r.netAnnual))}</p>
              <p className="mt-0.5 text-xs text-text-secondary">원 / 연</p>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-4 border-b border-border bg-bg-secondary px-4 py-2.5">
              <span className="text-xs font-semibold text-text-primary">항목</span>
              <span className="text-xs font-semibold text-text-secondary">연간</span>
              <span className="min-w-[88px] text-right text-xs font-semibold text-text-secondary">월간</span>
              <span className="size-7" />
            </div>
            <div className="divide-y divide-border">
              <DualRow label="세전 급여" annual={r.salary} copied={copied} copy={copy} />
              <div className="border-t border-border bg-bg-secondary/50 px-4 py-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary/70">4대보험</p>
              </div>
              <DualRow label="국민연금"   annual={r.np}        note="4.5%"             copied={copied} copy={copy} />
              <DualRow label="건강보험"   annual={r.hi}        note="3.545%"           copied={copied} copy={copy} />
              <DualRow label="장기요양"   annual={r.ltc}       note="건강보험료 × 12.95%" copied={copied} copy={copy} />
              <DualRow label="고용보험"   annual={r.emp}       note="0.9%"             copied={copied} copy={copy} />
              <DualRow label="4대보험 합계" annual={r.insurance} highlight copied={copied} copy={copy} />
              <div className="border-t border-border bg-bg-secondary/50 px-4 py-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-text-secondary/70">소득세</p>
              </div>
              <DualRow label="근로소득세" annual={r.incomeTax} copied={copied} copy={copy} />
              <DualRow label="지방소득세" annual={r.localTax} note="소득세 × 10%" copied={copied} copy={copy} />
              <DualRow label="세금 합계"  annual={r.totalTax}  highlight copied={copied} copy={copy} />
              <div className="border-t-2 border-brand/20" />
              <DualRow label="실수령액"   annual={r.netAnnual} highlight copied={copied} copy={copy} />
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

/* ── 부가가치세 (VAT) ── */
type VatMode = "supply" | "total" | "vatOnly";

function calcVat(amount: number, rate: number, mode: VatMode) {
  const r = rate / 100;
  if (mode === "supply") return { supply: amount, vat: amount * r, total: amount * (1 + r) };
  if (mode === "total") {
    const supply = r > 0 ? amount / (1 + r) : amount;
    return { supply, vat: amount - supply, total: amount };
  }
  const supply = r > 0 ? amount / r : 0;
  return { supply, vat: amount, total: supply + amount };
}

const VAT_MODE_META: { key: VatMode; label: string; desc: string }[] = [
  { key: "supply",  label: "공급가액",     desc: "공급가액을 알고 VAT 계산" },
  { key: "total",   label: "부가세 포함가", desc: "총액에서 VAT 역산" },
  { key: "vatOnly", label: "부가세만",      desc: "부가세에서 공급가액 역산" },
];

function VatTab() {
  const [input,   setInput]   = useState("1000000");
  const [mode,    setMode]    = useState<VatMode>("supply");
  const [rateStr, setRateStr] = useState("10");
  const { copied, copy } = useClipboard();

  const amount = Math.max(0, Number(input) || 0);
  const rate   = Math.max(0, Math.min(100, Number(rateStr) || 0));
  const r = useMemo(() => calcVat(amount, rate, mode), [amount, rate, mode]);

  const CARDS: { key: keyof typeof r; label: string }[] = [
    { key: "supply", label: "공급가액" },
    { key: "vat",    label: `부가세 (${rate}%)` },
    { key: "total",  label: "합계 (포함가)" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-border bg-bg-secondary">
        <div className="border-b border-border px-4 py-3">
          <p className="text-xs font-semibold text-text-primary">알고 있는 금액 선택</p>
        </div>
        <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {VAT_MODE_META.map(({ key, label, desc }) => (
            <button key={key} type="button" onClick={() => setMode(key)}
              className={`flex flex-col gap-0.5 px-4 py-3.5 text-left transition-colors ${
                mode === key ? "bg-brand/8" : "hover:bg-brand/5"
              }`}>
              <div className="flex items-center gap-2">
                <div className={`size-3 rounded-full border-2 transition-colors ${
                  mode === key ? "border-brand bg-brand" : "border-border"
                }`} />
                <span className={`text-sm font-semibold ${mode === key ? "text-brand" : "text-text-primary"}`}>{label}</span>
              </div>
              <p className="ml-5 text-xs text-text-secondary">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_160px]">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-text-secondary">
            {VAT_MODE_META.find(m => m.key === mode)?.label} 금액 (원)
          </label>
          <input type="number" value={input} onChange={(e) => setInput(e.target.value)}
            min={0} step={10000}
            className="rounded-xl border border-border bg-bg-secondary px-4 py-3 text-right font-mono text-xl font-bold text-text-primary focus:border-brand focus:outline-none"
            placeholder="0" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-text-secondary">세율 (%)</label>
          <div className="flex flex-col gap-2">
            <input type="number" value={rateStr} onChange={(e) => setRateStr(e.target.value)}
              min={0} max={100} step={1}
              className="rounded-xl border border-border bg-bg-secondary px-4 py-3 text-right font-mono text-xl font-bold text-text-primary focus:border-brand focus:outline-none" />
            <div className="flex gap-1.5">
              {[0, 5, 10].map((v) => (
                <button key={v} type="button" onClick={() => setRateStr(String(v))}
                  className={`flex-1 rounded-lg border py-1.5 text-xs font-semibold transition-colors ${
                    Number(rateStr) === v
                      ? "border-brand bg-brand/10 text-brand"
                      : "border-border text-text-secondary hover:border-brand/40 hover:text-brand"
                  }`}>
                  {v}%{v === 10 ? " 기본" : v === 0 ? " 면세" : ""}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {amount > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {CARDS.map(({ key, label }) => {
            const val = r[key];
            const isActive = (
              (key === "supply" && mode === "supply") ||
              (key === "vat" && mode === "vatOnly") ||
              (key === "total" && mode === "total")
            );
            const valStr = comma(Math.round(val));
            return (
              <div key={key}
                className={`relative overflow-hidden rounded-xl border px-5 py-4 transition-colors ${
                  isActive ? "border-brand bg-brand/5" : "border-border bg-bg-secondary"
                }`}>
                {isActive && (
                  <div className="absolute right-3 top-3 rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-bold text-brand">입력값</div>
                )}
                <p className="mb-2 text-xs text-text-secondary">{label}</p>
                <p className={`font-mono text-2xl font-bold ${isActive ? "text-brand" : "text-text-primary"}`}>{valStr}</p>
                <p className="mb-3 text-xs text-text-secondary">원</p>
                <button type="button" onClick={() => copy(valStr, key)}
                  className="flex items-center gap-1.5 text-xs text-text-secondary transition-colors hover:text-brand">
                  {copied === key ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
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

/* ── 양도소득세 ── */
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
  const ltRate  = getLtRate(years, isOneHouse);
  const ltDed   = gain * ltRate;
  const basicDed = 2_500_000;
  const taxBase  = Math.max(0, gain - ltDed - basicDed);
  const capTax   = calcCapitalTax(taxBase);
  const localTax = capTax * 0.1;
  const total    = capTax + localTax;
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
                <input type="number" value={val} onChange={(e) => set(e.target.value)}
                  min={0} step={step}
                  className="rounded-xl border border-border bg-background px-4 py-3 text-right font-mono text-base font-bold text-text-primary focus:border-brand focus:outline-none"
                  placeholder={ph} />
              </div>
            ))}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs text-text-secondary">보유기간</label>
                <span className="font-mono text-sm font-bold text-brand">{years}년
                  {ltPct > 0 && <span className="ml-1.5 text-xs font-normal text-text-secondary">공제율 {ltPct}%</span>}
                </span>
              </div>
              <input type="range" min={0} max={20} value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="mt-1 accent-brand" />
              <div className="flex justify-between text-[11px] text-text-secondary">
                <span>0년</span><span>10년 (공제 18%)</span><span>20년 (공제 30%)</span>
              </div>
            </div>
          </div>
          <button type="button" onClick={() => setOneHouse(v => !v)}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
              oneHouse ? "border-brand bg-brand/5" : "border-border hover:border-brand/30"
            }`}>
            <div className={`flex size-5 items-center justify-center rounded border-2 transition-colors ${
              oneHouse ? "border-brand bg-brand" : "border-border"
            }`}>
              {oneHouse && <Check size={12} className="text-white" />}
            </div>
            <div className="text-left">
              <p className={`font-semibold ${oneHouse ? "text-brand" : "text-text-primary"}`}>1가구 1주택 적용</p>
              <p className="text-xs text-text-secondary">3년 보유 시 24% ~ 10년 이상 80% 장기보유특별공제</p>
            </div>
          </button>
        </div>
      </div>

      {(tr > 0 && tr <= aq + ex) && (
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-border px-4 py-4 text-sm text-text-secondary">
          <TrendingDown size={16} className="shrink-0" />
          양도차익이 없으면 양도소득세 과세 대상이 아닙니다.
        </div>
      )}

      {r && (
        <>
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
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="border-b border-border bg-bg-secondary px-4 py-3 text-xs font-semibold text-text-primary">계산 단계</div>
            <div className="divide-y divide-border">
              <SimpleRow label="① 양도차익" value={r.gain}
                sub={`(양도 ${comma(tr)} − 취득 ${comma(aq)} − 경비 ${comma(ex)})`}
                copied={copied} copy={copy} />
              <SimpleRow label="② 장기보유특별공제" value={r.ltDed}
                sub={years >= 3 ? `${years}년 보유 · ${ltPct.toFixed(0)}%` : "3년 미만 · 해당 없음"}
                copied={copied} copy={copy} />
              <SimpleRow label="③ 기본공제" value={r.basicDed} sub="연 250만 원" copied={copied} copy={copy} />
              <SimpleRow label="④ 과세표준" value={r.taxBase} sub="① − ② − ③" highlight copied={copied} copy={copy} />
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

/* ── 프리랜서 3.3% ── */
function calcFreelancer(contract: number, annualTotal: number, expenseRate: number) {
  const withheld = contract * 0.033;
  const net      = contract - withheld;
  const expense  = annualTotal * (expenseRate / 100);
  const taxableIncome = Math.max(0, annualTotal - expense - 1_500_000);
  const incomeTax = calcIncomeTax(taxableIncome);
  const localTax  = incomeTax * 0.1;
  const totalOwed = incomeTax + localTax;
  const paidSoFar = annualTotal * 0.033;
  const refund    = paidSoFar - totalOwed;
  return { withheld, net, taxableIncome, incomeTax, localTax, totalOwed, paidSoFar, refund };
}

function FreelancerTab() {
  const [contractInput, setContract] = useState("3000000");
  const [annualInput,   setAnnual]   = useState("30000000");
  const [expenseRate,   setExpense]  = useState(60);
  const { copied, copy } = useClipboard();

  const contract = Math.max(0, Number(contractInput) || 0);
  const annual   = Math.max(0, Number(annualInput)   || 0);
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
      <div className="rounded-xl border border-border bg-bg-secondary">
        <div className="border-b border-border px-4 py-3">
          <p className="text-xs font-semibold text-text-primary">계약 정보 입력</p>
        </div>
        <div className="flex flex-col gap-4 p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-text-secondary">이번 계약 금액 (원)</label>
              <input type="number" value={contractInput} onChange={(e) => setContract(e.target.value)}
                min={0} step={100000}
                className="rounded-xl border border-border bg-background px-4 py-3 text-right font-mono text-xl font-bold text-text-primary focus:border-brand focus:outline-none"
                placeholder="3,000,000" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-text-secondary">연간 예상 총 수입 (환급 시뮬레이션용)</label>
              <input type="number" value={annualInput} onChange={(e) => setAnnual(e.target.value)}
                min={0} step={1000000}
                className="rounded-xl border border-border bg-background px-4 py-3 text-right font-mono text-xl font-bold text-text-primary focus:border-brand focus:outline-none"
                placeholder="30,000,000" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-text-secondary">단순경비율 (업종별 상이)</label>
              <span className="font-mono text-sm font-bold text-brand">{expenseRate}%</span>
            </div>
            <input type="range" min={40} max={90} value={expenseRate}
              onChange={(e) => setExpense(Number(e.target.value))}
              className="accent-brand" />
            <div className="flex justify-between text-[11px] text-text-secondary">
              <span>40% (전문직)</span><span>60% (IT·서비스)</span><span>90% (도소매)</span>
            </div>
          </div>
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
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="border-b border-border bg-bg-secondary px-4 py-3 text-xs font-semibold text-text-primary">이번 계약 계산 내역</div>
            <div className="divide-y divide-border">
              <QuickRow label="계약금액 (세전)" value={contract} unit="원" />
              <QuickRow label="원천징수 (소득세 3% + 지방소득세 0.3%)" value={r.withheld} unit="원" />
              <QuickRow label="실지급액" value={r.net} unit="원" highlight />
            </div>
          </div>
        </>
      )}

      {annual > 0 && (
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
          <div className={`flex items-center gap-4 px-4 py-4 ${r.refund >= 0 ? "bg-emerald-500/5" : "bg-red-500/5"}`}>
            <div className="flex-1">
              <p className={`text-sm font-semibold ${r.refund >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {r.refund >= 0 ? "📩 예상 환급액" : "💸 예상 추가 납부액"}
              </p>
              <p className="mt-0.5 text-xs text-text-secondary">
                {r.refund >= 0 ? "5월 종합소득세 신고 후 환급 신청" : "5월 종합소득세 신고 시 추가 납부 필요"}
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
      )}

      <div className="flex items-start gap-2 rounded-xl border border-border bg-bg-secondary px-4 py-3 text-xs text-text-secondary">
        <Info size={13} className="mt-0.5 shrink-0 text-brand" />
        <span>단순경비율 기준 · 업종별 필요경비율은 국세청 홈택스에서 확인 · 종합소득세 신고는 매년 5월 (참고용)</span>
      </div>
    </div>
  );
}

/* ── 세금 계산기 메인 ── */
const TAX_TABS: { key: TaxTab; label: string; icon: LucideIcon }[] = [
  { key: "income",     label: "근로소득세",     icon: Calculator },
  { key: "vat",        label: "VAT",            icon: Percent },
  { key: "capital",    label: "양도소득세",     icon: Receipt },
  { key: "freelancer", label: "프리랜서 3.3%",  icon: UserCheck },
];

function TaxSection() {
  const [tab, setTab] = useState<TaxTab>("income");
  return (
    <div className="flex flex-col gap-5">
      {/* 세금 서브탭 */}
      <div className="flex overflow-hidden rounded-xl border border-border">
        {TAX_TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} type="button" onClick={() => setTab(key)}
            className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors ${
              tab === key
                ? "bg-brand/15 text-brand"
                : "text-text-secondary hover:bg-brand/5 hover:text-text-primary"
            }`}>
            <Icon size={13} />
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{label.split("(")[0].trim().split(" ")[0]}</span>
          </button>
        ))}
      </div>
      {tab === "income"     && <IncomeTaxTab />}
      {tab === "vat"        && <VatTab />}
      {tab === "capital"    && <CapitalGainsTaxTab />}
      {tab === "freelancer" && <FreelancerTab />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
//  SECTION 2 : 단가 변환기
// ════════════════════════════════════════════════════════════════════════

type SalaryMode = "hourly" | "daily" | "weekly" | "monthly" | "annual";

const SALARY_MODES: { key: SalaryMode; label: string; unit: string }[] = [
  { key: "hourly",  label: "시급",  unit: "원/시간" },
  { key: "daily",   label: "일급",  unit: "원/일"   },
  { key: "weekly",  label: "주급",  unit: "원/주"   },
  { key: "monthly", label: "월급",  unit: "원/월"   },
  { key: "annual",  label: "연봉",  unit: "원/년"   },
];

function commaSalary(n: number) {
  if (!Number.isFinite(n) || n < 0) return "0";
  return Math.round(n).toLocaleString("ko-KR");
}

function calcAllSalary(value: number, mode: SalaryMode, hpd: number, dpw: number, wpy: number) {
  const weeksPerMonth = wpy / 12;
  let hourly: number;
  switch (mode) {
    case "hourly":  hourly = value; break;
    case "daily":   hourly = value / hpd; break;
    case "weekly":  hourly = value / (hpd * dpw); break;
    case "monthly": hourly = value / (hpd * dpw * weeksPerMonth); break;
    case "annual":  hourly = value / (hpd * dpw * wpy); break;
  }
  const daily   = hourly * hpd;
  const weekly  = daily  * dpw;
  const monthly = weekly * weeksPerMonth;
  const annual  = monthly * 12;
  return { hourly, daily, weekly, monthly, annual };
}

function SalarySection() {
  const [mode,     setMode]  = useState<SalaryMode>("hourly");
  const [inputVal, setInput] = useState("10030");
  const [hpd, setHpd]       = useState(8);
  const [dpw, setDpw]       = useState(5);
  const [wpy, setWpy]       = useState(52);
  const { copied, copy } = useClipboard();

  const val = Math.max(0, Number(inputVal) || 0);
  const r   = useMemo(() => calcAllSalary(val, mode, hpd, dpw, wpy), [val, mode, hpd, dpw, wpy]);

  const RESULTS: { key: keyof typeof r; label: string; unit: string }[] = [
    { key: "hourly",  label: "시급",  unit: "원/시간" },
    { key: "daily",   label: "일급",  unit: "원/일"   },
    { key: "weekly",  label: "주급",  unit: "원/주"   },
    { key: "monthly", label: "월급",  unit: "원/월"   },
    { key: "annual",  label: "연봉",  unit: "원/년"   },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* 입력 모드 */}
      <div className="flex overflow-hidden rounded-xl border border-border">
        {SALARY_MODES.map(({ key, label }) => (
          <button key={key} type="button" onClick={() => setMode(key)}
            className={`flex flex-1 items-center justify-center py-2.5 text-xs font-semibold transition-colors ${
              mode === key
                ? "bg-brand text-white"
                : "text-text-secondary hover:bg-brand/5 hover:text-text-primary"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* 금액 입력 */}
      <div className="rounded-xl border border-border bg-bg-secondary">
        <div className="border-b border-border px-4 py-3">
          <p className="text-xs font-semibold text-text-primary">
            {SALARY_MODES.find(m => m.key === mode)?.label} 입력
          </p>
        </div>
        <div className="p-4">
          <div className="flex items-center overflow-hidden rounded-xl border border-border bg-background focus-within:border-brand">
            <input type="number" value={inputVal}
              onChange={(e) => setInput(e.target.value)}
              min={0}
              className="flex-1 bg-transparent px-4 py-3 text-right font-mono text-2xl font-bold text-text-primary focus:outline-none"
              placeholder="0"
            />
            <span className="pr-4 text-sm text-text-secondary">
              {SALARY_MODES.find(m => m.key === mode)?.unit}
            </span>
          </div>
        </div>
      </div>

      {/* 근무 조건 */}
      <div className="rounded-xl border border-border bg-bg-secondary">
        <div className="border-b border-border px-4 py-3">
          <p className="text-xs font-semibold text-text-primary">근무 조건</p>
        </div>
        <div className="grid grid-cols-3 divide-x divide-border p-0">
          {[
            { label: "하루 근무", val: hpd, set: setHpd, min: 1, max: 24, unit: "시간" },
            { label: "주 근무",   val: dpw, set: setDpw, min: 1, max: 7,  unit: "일"  },
            { label: "연간 주수", val: wpy, set: setWpy, min: 1, max: 52, unit: "주"  },
          ].map(({ label, val, set, min, max, unit }) => (
            <div key={label} className="flex flex-col items-center gap-1 px-3 py-4">
              <span className="text-[11px] text-text-secondary">{label}</span>
              <span className="font-mono text-xl font-bold text-brand">{val}</span>
              <span className="text-[11px] text-text-secondary">{unit}</span>
              <input type="range" min={min} max={max} value={val}
                onChange={(e) => set(Number(e.target.value))}
                className="mt-1 w-full accent-brand" />
            </div>
          ))}
        </div>
      </div>

      {/* 결과 */}
      {val > 0 && (
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="border-b border-border bg-bg-secondary px-4 py-3 text-xs font-semibold text-text-primary">
            환산 결과
          </div>
          <div className="divide-y divide-border">
            {RESULTS.map(({ key, label, unit }) => {
              const value = r[key];
              const str   = commaSalary(value);
              const isActive = key === mode;
              return (
                <div key={key}
                  className={`flex items-center gap-3 px-4 py-3.5 ${isActive ? "bg-brand/5" : ""}`}>
                  <div className="w-14 shrink-0">
                    <span className={`text-sm font-semibold ${isActive ? "text-brand" : "text-text-secondary"}`}>{label}</span>
                  </div>
                  <div className="flex-1 text-right">
                    <span className={`font-mono text-base font-bold ${isActive ? "text-brand" : "text-text-primary"}`}>{str}</span>
                    <span className="ml-1.5 text-xs text-text-secondary">{unit}</span>
                  </div>
                  <CopyBtn value={str} id={key} copied={copied} copy={copy} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-start gap-2 rounded-xl border border-border bg-bg-secondary px-4 py-3 text-xs text-text-secondary">
        <Info size={13} className="mt-0.5 shrink-0 text-brand" />
        <span>2025년 최저시급 10,030원 기준 · 세금 공제 전 금액 · 외주·계약 단가 비교용</span>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
//  SECTION 3 : 퇴직금 계산기
// ════════════════════════════════════════════════════════════════════════

function daysBetween(start: string, end: string): number {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (isNaN(s) || isNaN(e) || e <= s) return 0;
  return Math.floor((e - s) / (1000 * 60 * 60 * 24));
}

function calcSeverance(days: number, avgDailyWage: number) {
  if (days < 365) return null;
  return avgDailyWage * 30 * (days / 365);
}

function formatPeriod(days: number): string {
  const years  = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  const rem    = days % 30;
  const parts = [];
  if (years  > 0) parts.push(`${years}년`);
  if (months > 0) parts.push(`${months}개월`);
  if (rem    > 0) parts.push(`${rem}일`);
  return parts.join(" ") || "—";
}

function SeveranceSection() {
  const today = new Date().toISOString().split("T")[0];
  const [startDate,   setStart]    = useState("2022-01-01");
  const [endDate,     setEnd]      = useState(today);
  const [inputMode,   setInputMode] = useState<"monthly" | "daily">("monthly");
  const [monthlyWage, setMonthly]  = useState("3500000");
  const [dailyWage,   setDaily]    = useState("116667");
  const { copied, copy } = useClipboard();

  const days = useMemo(() => daysBetween(startDate, endDate), [startDate, endDate]);
  const avgDaily = useMemo(() => {
    if (inputMode === "monthly") {
      const monthly = Math.max(0, Number(monthlyWage) || 0);
      return (monthly * 3) / 91;
    }
    return Math.max(0, Number(dailyWage) || 0);
  }, [inputMode, monthlyWage, dailyWage]);

  const severance = useMemo(() => calcSeverance(days, avgDaily), [days, avgDaily]);

  const ResultCard = ({ label, value, unit, highlight }: {
    label: string; value: string; unit?: string; highlight?: boolean;
  }) => (
    <div className={`flex items-center gap-3 px-4 py-3.5 ${highlight ? "bg-brand/5" : ""}`}>
      <span className={`flex-1 text-sm ${highlight ? "font-semibold text-brand" : "text-text-secondary"}`}>{label}</span>
      <span className={`font-mono text-base font-bold ${highlight ? "text-brand" : "text-text-primary"}`}>
        {value}
        {unit && <span className="ml-1 text-xs font-normal text-text-secondary">{unit}</span>}
      </span>
      <button type="button" onClick={() => copy(value, label)}
        className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
        aria-label="복사">
        {copied === label ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* 재직기간 */}
      <div className="rounded-xl border border-border bg-bg-secondary">
        <div className="border-b border-border px-4 py-3">
          <p className="text-xs font-semibold text-text-primary">재직기간</p>
        </div>
        <div className="flex flex-col gap-4 p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              { label: "입사일", val: startDate, set: setStart },
              { label: "퇴직일", val: endDate,   set: setEnd   },
            ].map(({ label, val, set }) => (
              <div key={label} className="flex flex-col gap-1.5">
                <label className="text-xs text-text-secondary">{label}</label>
                <input type="date" value={val} onChange={(e) => set(e.target.value)}
                  className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-text-primary focus:border-brand focus:outline-none" />
              </div>
            ))}
          </div>
          {days > 0 && (
            <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
              days >= 365 ? "border-brand/30 bg-brand/5" : "border-amber-500/30 bg-amber-500/5"
            }`}>
              <div>
                <p className={`text-sm font-semibold ${days >= 365 ? "text-brand" : "text-amber-400"}`}>
                  {formatPeriod(days)} ({days.toLocaleString()}일)
                </p>
                <p className="text-xs text-text-secondary">
                  {days >= 365 ? "퇴직금 지급 대상" : `퇴직금 지급은 재직 1년 이상부터 (${365 - days}일 부족)`}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 평균임금 */}
      <div className="rounded-xl border border-border bg-bg-secondary">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-xs font-semibold text-text-primary">평균임금</p>
          <div className="flex overflow-hidden rounded-lg border border-border">
            {(["monthly", "daily"] as const).map((m) => (
              <button key={m} type="button" onClick={() => setInputMode(m)}
                className={`px-3 py-1 text-xs font-semibold transition-colors ${
                  inputMode === m ? "bg-brand text-white" : "text-text-secondary hover:text-text-primary"
                }`}>
                {m === "monthly" ? "월급 입력" : "1일 평균임금"}
              </button>
            ))}
          </div>
        </div>
        <div className="p-4">
          {inputMode === "monthly" ? (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-text-secondary">월 평균임금 (원)</label>
              <input type="number" value={monthlyWage} onChange={(e) => setMonthly(e.target.value)}
                min={0} step={100000}
                className="rounded-xl border border-border bg-background px-4 py-3 text-right font-mono text-xl font-bold text-text-primary focus:border-brand focus:outline-none"
                placeholder="3,500,000" />
              <p className="text-right text-xs text-text-secondary">
                1일 평균임금 환산: <span className="font-semibold text-brand">{comma(avgDaily)}</span>원
                <span className="ml-1 opacity-70">(3개월 합계 ÷ 91일)</span>
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-text-secondary">1일 평균임금 (원)</label>
              <input type="number" value={dailyWage} onChange={(e) => setDaily(e.target.value)}
                min={0} step={1000}
                className="rounded-xl border border-border bg-background px-4 py-3 text-right font-mono text-xl font-bold text-text-primary focus:border-brand focus:outline-none"
                placeholder="116,667" />
            </div>
          )}
        </div>
      </div>

      {/* 결과 */}
      {severance !== null && (
        <>
          <div className="rounded-xl border border-brand/30 bg-brand/5 px-5 py-5">
            <p className="mb-1 text-xs text-text-secondary">예상 퇴직금</p>
            <p className="font-mono text-3xl font-bold text-brand">
              {comma(severance)}
              <span className="ml-2 text-base font-normal text-text-secondary">원</span>
            </p>
            <p className="mt-1.5 text-xs text-text-secondary">세전 금액 · 퇴직소득세 별도 공제</p>
          </div>
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="border-b border-border bg-bg-secondary px-4 py-3 text-xs font-semibold text-text-primary">계산 내역</div>
            <div className="divide-y divide-border">
              <ResultCard label="1일 평균임금" value={comma(avgDaily)} unit="원" />
              <ResultCard label="재직일수"     value={days.toLocaleString()} unit="일" />
              <ResultCard label="근속연수 환산" value={(days / 365).toFixed(2)} unit="년" />
              <ResultCard label="산식" value={`${comma(avgDaily)} × 30 × ${(days / 365).toFixed(2)}`} />
              <ResultCard label="퇴직금 (세전)" value={comma(severance)} unit="원" highlight />
            </div>
          </div>
        </>
      )}

      {/* 제도 안내 */}
      <div className="overflow-hidden rounded-xl border border-border bg-bg-secondary">
        <div className="border-b border-border px-4 py-2.5 text-xs font-semibold text-text-primary">퇴직금 제도 안내 (2026년 기준)</div>
        <div className="divide-y divide-border/50">
          {[
            { label: "지급 요건",    desc: "동일 사업장 1년 이상 계속 근로, 주 15시간 이상" },
            { label: "퇴직금 공식", desc: "1일 평균임금 × 30일 × (재직일수 ÷ 365)" },
            { label: "평균임금 기준", desc: "퇴직 전 3개월간 임금 합계 ÷ 해당 기간 역일수(통상 91일)" },
            { label: "퇴직연금",    desc: "DB형(확정급여) 또는 DC형(확정기여) 선택 시 별도 산정" },
            { label: "퇴직소득세",  desc: "퇴직금액과 근속연수에 따라 세율 차등 적용 (세무사 상담 권장)" },
          ].map(({ label, desc }) => (
            <div key={label} className="flex gap-3 px-4 py-3">
              <span className="w-24 shrink-0 text-xs font-semibold text-brand">{label}</span>
              <span className="text-xs leading-relaxed text-text-secondary">{desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-border bg-bg-secondary px-4 py-3 text-xs text-text-secondary">
        <Info size={13} className="mt-0.5 shrink-0 text-brand" />
        <span>2026년 고용노동부 기준 · 실제 퇴직금은 계약 조건·비과세 수당에 따라 다를 수 있음 (참고용)</span>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
//  메인 페이지
// ════════════════════════════════════════════════════════════════════════

type MainMode = "tax" | "salary" | "severance";

const MAIN_MODES: { key: MainMode; label: string; icon: LucideIcon; desc: string }[] = [
  { key: "tax",      label: "세금 계산기", icon: Calculator, desc: "근로소득세 · VAT · 양도소득세 · 프리랜서 3.3%" },
  { key: "salary",   label: "단가 변환기", icon: Clock,      desc: "시급 ↔ 일급 ↔ 월급 ↔ 연봉 즉시 환산" },
  { key: "severance", label: "퇴직금 계산기", icon: Building2, desc: "재직기간 · 평균임금으로 퇴직금 산정" },
];

export default function FinanceCalculatorPage() {
  const [mode, setMode] = useState<MainMode>("tax");

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="회계 계산기"
      description="세금 계산 · 단가 변환 · 퇴직금 산정. 직장인·프리랜서·자영업자를 위한 통합 재무 계산기."
      icon={Briefcase}
    >
      <div className="flex flex-col gap-6">

        {/* ── 메인 모드 탭 ── */}
        <div className="grid grid-cols-3 gap-2">
          {MAIN_MODES.map(({ key, label, icon: Icon, desc }) => (
            <button
              key={key}
              type="button"
              onClick={() => setMode(key)}
              className={`flex flex-col items-center gap-2 rounded-xl border p-3 transition-all sm:flex-row sm:items-start sm:gap-3 sm:p-4 ${
                mode === key
                  ? "border-brand bg-brand/8 shadow-sm"
                  : "border-border bg-bg-secondary hover:border-brand/40"
              }`}
            >
              <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                mode === key ? "bg-brand/20" : "bg-bg-primary"
              }`}>
                <Icon size={16} className={mode === key ? "text-brand" : "text-text-secondary"} />
              </div>
              <div className="text-center sm:text-left">
                <p className={`text-xs font-bold sm:text-sm ${mode === key ? "text-brand" : "text-text-primary"}`}>
                  {label}
                </p>
                <p className="mt-0.5 hidden text-[11px] leading-relaxed text-text-secondary sm:block">{desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* ── 콘텐츠 영역 ── */}
        <div className="rounded-xl border border-border/50 bg-bg-secondary/30 p-1">
          <div className="rounded-lg p-3 sm:p-1">
            {mode === "tax"       && <TaxSection />}
            {mode === "salary"    && <SalarySection />}
            {mode === "severance" && <SeveranceSection />}
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
}