"use client";

import { useState, useMemo } from "react";
import { Building2, Info, Copy, Check } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { useClipboard } from "@/hooks/useClipboard";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Jobs", href: "/tools/jobs" },
];

function comma(n: number) {
  if (!Number.isFinite(n) || n < 0) return "0";
  return Math.round(n).toLocaleString("ko-KR");
}

function daysBetween(start: string, end: string): number {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (isNaN(s) || isNaN(e) || e <= s) return 0;
  return Math.floor((e - s) / (1000 * 60 * 60 * 24));
}

function calcSeverance(days: number, avgDailyWage: number) {
  if (days < 365) return null; // 1년 미만 퇴직금 없음
  // 퇴직금 = 1일 평균임금 × 30일 × (재직일수 / 365)
  const amount = avgDailyWage * 30 * (days / 365);
  return amount;
}

// 재직기간 레이블
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

export default function SeverancePage() {
  const today = new Date().toISOString().split("T")[0];
  const [startDate,   setStart]    = useState("2022-01-01");
  const [endDate,     setEnd]      = useState(today);
  const [inputMode,   setInputMode] = useState<"monthly" | "daily">("monthly");
  const [monthlyWage, setMonthly]  = useState("3500000");
  const [dailyWage,   setDaily]    = useState("116667");
  const { copied, copy } = useClipboard();

  const days = useMemo(() => daysBetween(startDate, endDate), [startDate, endDate]);

  // 1일 평균임금 계산
  const avgDaily = useMemo(() => {
    if (inputMode === "monthly") {
      // 최근 3개월 임금 / 최근 3개월 역일수 (통상 91일)
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
      <button
        type="button"
        onClick={() => copy(value, label)}
        className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
        aria-label="복사"
      >
        {copied === label ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
      </button>
    </div>
  );

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="퇴직금 계산기"
      description="2026년 고용노동부 기준 퇴직금을 계산합니다. 재직기간 1년 이상부터 지급 대상입니다."
      icon={Building2}
    >
      <div className="flex flex-col gap-6">

        {/* ── 재직기간 ── */}
        <div className="rounded-xl border border-border bg-bg-secondary">
          <div className="border-b border-border px-4 py-3">
            <p className="text-xs font-semibold text-text-primary">재직기간</p>
          </div>
          <div className="flex flex-col gap-4 p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-text-secondary">입사일</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStart(e.target.value)}
                  className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-text-primary focus:border-brand focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-text-secondary">퇴직일</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEnd(e.target.value)}
                  className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-text-primary focus:border-brand focus:outline-none"
                />
              </div>
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

        {/* ── 평균임금 ── */}
        <div className="rounded-xl border border-border bg-bg-secondary">
          <div className="border-b border-border px-4 py-3 flex items-center justify-between">
            <p className="text-xs font-semibold text-text-primary">평균임금</p>
            <div className="flex overflow-hidden rounded-lg border border-border">
              {(["monthly", "daily"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setInputMode(m)}
                  className={`px-3 py-1 text-xs font-semibold transition-colors ${
                    inputMode === m ? "bg-brand text-white" : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {m === "monthly" ? "월급 입력" : "1일 평균임금 입력"}
                </button>
              ))}
            </div>
          </div>
          <div className="p-4">
            {inputMode === "monthly" ? (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-text-secondary">월 평균임금 (원)</label>
                <input
                  type="number"
                  value={monthlyWage}
                  onChange={(e) => setMonthly(e.target.value)}
                  min={0}
                  step={100000}
                  className="rounded-xl border border-border bg-background px-4 py-3 text-right font-mono text-xl font-bold text-text-primary focus:border-brand focus:outline-none"
                  placeholder="3,500,000"
                />
                <p className="text-right text-xs text-text-secondary">
                  1일 평균임금 환산:{" "}
                  <span className="font-semibold text-brand">{comma(avgDaily)}</span>원
                  <span className="ml-1 opacity-70">(3개월 합계 ÷ 91일)</span>
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-text-secondary">1일 평균임금 (원)</label>
                <input
                  type="number"
                  value={dailyWage}
                  onChange={(e) => setDaily(e.target.value)}
                  min={0}
                  step={1000}
                  className="rounded-xl border border-border bg-background px-4 py-3 text-right font-mono text-xl font-bold text-text-primary focus:border-brand focus:outline-none"
                  placeholder="116,667"
                />
              </div>
            )}
          </div>
        </div>

        {/* ── 결과 ── */}
        {severance !== null ? (
          <>
            {/* 요약 */}
            <div className="rounded-xl border border-brand/30 bg-brand/5 px-5 py-5">
              <p className="mb-1 text-xs text-text-secondary">예상 퇴직금</p>
              <p className="font-mono text-3xl font-bold text-brand">
                {comma(severance)}
                <span className="ml-2 text-base font-normal text-text-secondary">원</span>
              </p>
              <p className="mt-1.5 text-xs text-text-secondary">
                세전 금액 · 퇴직소득세 별도 공제
              </p>
            </div>

            {/* 계산 내역 */}
            <div className="overflow-hidden rounded-xl border border-border">
              <div className="border-b border-border bg-bg-secondary px-4 py-3 text-xs font-semibold text-text-primary">
                계산 내역
              </div>
              <div className="divide-y divide-border">
                <ResultCard label="1일 평균임금" value={comma(avgDaily)} unit="원" />
                <ResultCard label="재직일수" value={days.toLocaleString()} unit="일" />
                <ResultCard
                  label="근속연수 환산"
                  value={(days / 365).toFixed(2)}
                  unit="년"
                />
                <ResultCard
                  label="산식"
                  value={`${comma(avgDaily)} × 30 × ${(days / 365).toFixed(2)}`}
                />
                <ResultCard label="퇴직금 (세전)" value={comma(severance)} unit="원" highlight />
              </div>
            </div>
          </>
        ) : days > 0 && days < 365 ? null : null}

        {/* 안내 */}
        <div className="overflow-hidden rounded-xl border border-border bg-bg-secondary">
          <div className="border-b border-border px-4 py-2.5 text-xs font-semibold text-text-primary">
            퇴직금 제도 안내 (2026년 기준)
          </div>
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
    </ToolPageLayout>
  );
}