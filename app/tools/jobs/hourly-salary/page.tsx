"use client";

import { useState, useMemo } from "react";
import { Clock, Info } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { useClipboard } from "@/hooks/useClipboard";
import { Check, Copy } from "lucide-react";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Jobs", href: "/tools/jobs" },
];

type InputMode = "hourly" | "daily" | "weekly" | "monthly" | "annual";

const MODES: { key: InputMode; label: string; unit: string }[] = [
  { key: "hourly",  label: "시급",  unit: "원/시간" },
  { key: "daily",   label: "일급",  unit: "원/일"   },
  { key: "weekly",  label: "주급",  unit: "원/주"   },
  { key: "monthly", label: "월급",  unit: "원/월"   },
  { key: "annual",  label: "연봉",  unit: "원/년"   },
];

function comma(n: number) {
  if (!Number.isFinite(n) || n < 0) return "0";
  return Math.round(n).toLocaleString("ko-KR");
}

function calcAll(value: number, mode: InputMode, hpd: number, dpw: number, wpy: number) {
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

export default function HourlySalaryPage() {
  const [mode, setMode]      = useState<InputMode>("hourly");
  const [inputVal, setInput] = useState("10030");   // 2024 최저시급
  const [hpd, setHpd]        = useState(8);          // hours per day
  const [dpw, setDpw]        = useState(5);          // days per week
  const [wpy, setWpy]        = useState(52);         // weeks per year
  const { copied, copy } = useClipboard();

  const val = Math.max(0, Number(inputVal) || 0);
  const r   = useMemo(() => calcAll(val, mode, hpd, dpw, wpy), [val, mode, hpd, dpw, wpy]);

  const RESULTS: { key: keyof typeof r; label: string; unit: string }[] = [
    { key: "hourly",  label: "시급",  unit: "원/시간" },
    { key: "daily",   label: "일급",  unit: "원/일"   },
    { key: "weekly",  label: "주급",  unit: "원/주"   },
    { key: "monthly", label: "월급",  unit: "원/월"   },
    { key: "annual",  label: "연봉",  unit: "원/년"   },
  ];

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="단가 변환기"
      description="시급 · 일급 · 주급 · 월급 · 연봉을 즉시 상호 환산합니다. 외주 계약 시 단가 비교에 유용합니다."
      icon={Clock}
    >
      <div className="flex flex-col gap-6">

        {/* ── 입력 모드 선택 ── */}
        <div className="flex overflow-hidden rounded-xl border border-border">
          {MODES.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => { setMode(key); setInput(""); }}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                mode === key ? "bg-brand text-white" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── 금액 입력 ── */}
        <div className="rounded-xl border border-border bg-bg-secondary">
          <div className="border-b border-border px-4 py-3">
            <p className="text-xs font-semibold text-text-primary">
              {MODES.find(m => m.key === mode)?.label} 입력
            </p>
          </div>
          <div className="p-4">
            <div className="flex items-end gap-3">
              <input
                type="number"
                value={inputVal}
                onChange={(e) => setInput(e.target.value)}
                min={0}
                step={100}
                className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-right font-mono text-xl font-bold text-text-primary focus:border-brand focus:outline-none"
                placeholder="0"
              />
              <span className="mb-3 shrink-0 text-sm text-text-secondary">
                {MODES.find(m => m.key === mode)?.unit}
              </span>
            </div>

            {/* 최저시급 프리셋 */}
            {mode === "hourly" && (
              <div className="mt-3 flex flex-wrap gap-2">
                {[{ label: "2025 최저시급", v: "10030" }, { label: "12,000", v: "12000" }, { label: "15,000", v: "15000" }].map(({ label, v }) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setInput(v)}
                    className="rounded-full border border-border px-3 py-1 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── 근무 조건 설정 ── */}
        <div className="rounded-xl border border-border bg-bg-secondary">
          <div className="border-b border-border px-4 py-3">
            <p className="text-xs font-semibold text-text-primary">근무 조건</p>
          </div>
          <div className="grid grid-cols-3 divide-x divide-border">
            {[
              { label: "하루 근무시간", val: hpd, set: setHpd, min: 1, max: 24, unit: "시간" },
              { label: "주 근무일수",   val: dpw, set: setDpw, min: 1, max: 7,  unit: "일" },
              { label: "연간 주수",     val: wpy, set: setWpy, min: 1, max: 52, unit: "주" },
            ].map(({ label, val: v, set, min, max, unit }) => (
              <div key={label} className="flex flex-col items-center gap-2 px-4 py-4">
                <span className="text-xs text-text-secondary">{label}</span>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => set(Math.max(min, v - 1))}
                    className="flex size-6 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:border-brand/50 hover:text-brand text-sm font-bold">
                    −
                  </button>
                  <span className="w-8 text-center font-mono text-base font-bold text-brand">{v}</span>
                  <button type="button" onClick={() => set(Math.min(max, v + 1))}
                    className="flex size-6 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:border-brand/50 hover:text-brand text-sm font-bold">
                    +
                  </button>
                </div>
                <span className="text-xs text-text-secondary">{unit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── 환산 결과 ── */}
        {val > 0 && (
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="border-b border-border bg-bg-secondary px-4 py-3 text-xs font-semibold text-text-primary">
              환산 결과
            </div>
            <div className="divide-y divide-border">
              {RESULTS.map(({ key, label, unit }) => {
                const isInput = key === mode;
                const str = comma(r[key]);
                return (
                  <div
                    key={key}
                    className={`flex items-center gap-4 px-4 py-4 ${isInput ? "bg-brand/5" : ""}`}
                  >
                    <div className="w-16 shrink-0">
                      <span className={`text-sm font-semibold ${isInput ? "text-brand" : "text-text-secondary"}`}>
                        {label}
                      </span>
                      {isInput && (
                        <span className="ml-1.5 rounded-full bg-brand/15 px-1.5 py-0.5 text-[10px] font-bold text-brand">
                          입력
                        </span>
                      )}
                    </div>
                    <div className="flex-1 text-right">
                      <span className={`font-mono text-lg font-bold ${isInput ? "text-brand" : "text-text-primary"}`}>
                        {str}
                      </span>
                      <span className="ml-1.5 text-xs text-text-secondary">{unit}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copy(str, key)}
                      className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
                      aria-label="복사"
                    >
                      {copied === key ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-start gap-2 rounded-xl border border-border bg-bg-secondary px-4 py-3 text-xs text-text-secondary">
          <Info size={13} className="mt-0.5 shrink-0 text-brand" />
          <span>주휴수당·초과근무 수당 미포함 · 실제 계약 조건에 따라 다를 수 있음</span>
        </div>
      </div>
    </ToolPageLayout>
  );
}