"use client";

import { useState, useCallback, useMemo } from "react";
import { AlarmClock, Copy, Check } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { useClipboard } from "@/hooks/useClipboard";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Code", href: "/tools/code" },
];

type FieldMode = "every" | "specific" | "range" | "step";

interface FieldState {
  mode: FieldMode;
  specific: string;
  rangeFrom: string;
  rangeTo: string;
  stepEvery: string;
  stepFrom: string;
}

interface FieldConfig {
  label: string;
  key: keyof CronFields;
  min: number;
  max: number;
  names?: string[];
}

interface CronFields {
  minute: FieldState;
  hour: FieldState;
  day: FieldState;
  month: FieldState;
  weekday: FieldState;
}

const MONTH_NAMES = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
const WEEKDAY_NAMES = ["일","월","화","수","목","금","토"];

const FIELD_CONFIGS: FieldConfig[] = [
  { label: "Minute", key: "minute", min: 0, max: 59 },
  { label: "Hour", key: "hour", min: 0, max: 23 },
  { label: "Day", key: "day", min: 1, max: 31 },
  { label: "Month", key: "month", min: 1, max: 12, names: MONTH_NAMES },
  { label: "Weekday", key: "weekday", min: 0, max: 6, names: WEEKDAY_NAMES },
];

const DEFAULT_FIELD: FieldState = {
  mode: "every",
  specific: "0",
  rangeFrom: "0",
  rangeTo: "5",
  stepEvery: "5",
  stepFrom: "0",
};

type Preset = { label: string; fields: Partial<Record<keyof CronFields, Partial<FieldState>>> };
const PRESETS: Preset[] = [
  {
    label: "매일 자정",
    fields: {
      minute: { mode: "specific", specific: "0" },
      hour: { mode: "specific", specific: "0" },
      day: { mode: "every" },
      month: { mode: "every" },
      weekday: { mode: "every" },
    },
  },
  {
    label: "매시간",
    fields: {
      minute: { mode: "specific", specific: "0" },
      hour: { mode: "every" },
      day: { mode: "every" },
      month: { mode: "every" },
      weekday: { mode: "every" },
    },
  },
  {
    label: "매 5분",
    fields: {
      minute: { mode: "step", stepEvery: "5", stepFrom: "0" },
      hour: { mode: "every" },
      day: { mode: "every" },
      month: { mode: "every" },
      weekday: { mode: "every" },
    },
  },
  {
    label: "평일 9시",
    fields: {
      minute: { mode: "specific", specific: "0" },
      hour: { mode: "specific", specific: "9" },
      day: { mode: "every" },
      month: { mode: "every" },
      weekday: { mode: "range", rangeFrom: "1", rangeTo: "5" },
    },
  },
  {
    label: "매주 월요일",
    fields: {
      minute: { mode: "specific", specific: "0" },
      hour: { mode: "specific", specific: "0" },
      day: { mode: "every" },
      month: { mode: "every" },
      weekday: { mode: "specific", specific: "1" },
    },
  },
];

function buildFieldExpr(state: FieldState): string {
  switch (state.mode) {
    case "every": return "*";
    case "specific": return state.specific || "0";
    case "range": return `${state.rangeFrom}-${state.rangeTo}`;
    case "step": return state.stepFrom === "0" ? `*/${state.stepEvery}` : `${state.stepFrom}/${state.stepEvery}`;
  }
}

function buildCronExpr(fields: CronFields): string {
  return [
    buildFieldExpr(fields.minute),
    buildFieldExpr(fields.hour),
    buildFieldExpr(fields.day),
    buildFieldExpr(fields.month),
    buildFieldExpr(fields.weekday),
  ].join(" ");
}

function describeField(state: FieldState, config: FieldConfig): string {
  const { names, label } = config;
  const getName = (v: string) => names ? (names[parseInt(v)] ?? v) : v;
  switch (state.mode) {
    case "every": return `매 ${label}`;
    case "specific": return `${label} ${getName(state.specific)}`;
    case "range": return `${label} ${getName(state.rangeFrom)}~${getName(state.rangeTo)}`;
    case "step": return `${state.stepEvery}${label}마다`;
  }
}

function describeCron(fields: CronFields): string {
  const parts = FIELD_CONFIGS.map((cfg) => describeField(fields[cfg.key], cfg));
  return parts.join(", ");
}

// Simple next execution time calculator (no external deps)
function getNextExecutions(expr: string, count: number): string[] {
  const parts = expr.split(" ");
  if (parts.length !== 5) return [];
  const [mExpr, hExpr, dExpr, moExpr, wExpr] = parts;

  function matchesField(val: number, expr: string, min: number, max: number): boolean {
    if (expr === "*") return true;
    if (expr.includes("/")) {
      const [fromStr, stepStr] = expr.split("/");
      const from = fromStr === "*" ? min : parseInt(fromStr);
      const step = parseInt(stepStr);
      if (isNaN(step) || step <= 0) return false;
      for (let v = from; v <= max; v += step) if (v === val) return true;
      return false;
    }
    if (expr.includes("-")) {
      const [a, b] = expr.split("-").map(Number);
      return val >= a && val <= b;
    }
    return parseInt(expr) === val;
  }

  const results: string[] = [];
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes() + 1, 0);

  let iterations = 0;
  while (results.length < count && iterations < 600000) {
    iterations++;
    const mo = d.getMonth() + 1;
    const day = d.getDate();
    const h = d.getHours();
    const m = d.getMinutes();
    const wd = d.getDay();

    if (
      matchesField(mo, moExpr, 1, 12) &&
      matchesField(day, dExpr, 1, 31) &&
      matchesField(wd, wExpr, 0, 6) &&
      matchesField(h, hExpr, 0, 23) &&
      matchesField(m, mExpr, 0, 59)
    ) {
      results.push(
        `${d.getFullYear()}-${String(mo).padStart(2,"0")}-${String(day).padStart(2,"0")} ${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`
      );
    }
    d.setMinutes(d.getMinutes() + 1);
  }
  return results;
}

function makeDefaultFields(): CronFields {
  return {
    minute: { ...DEFAULT_FIELD },
    hour: { ...DEFAULT_FIELD },
    day: { ...DEFAULT_FIELD },
    month: { ...DEFAULT_FIELD },
    weekday: { ...DEFAULT_FIELD },
  };
}

export default function CronBuilderPage() {
  const [fields, setFields] = useState<CronFields>(makeDefaultFields);
  const { copied, copy } = useClipboard();

  const cronExpr = useMemo(() => buildCronExpr(fields), [fields]);
  const description = useMemo(() => describeCron(fields), [fields]);
  const nextTimes = useMemo(() => getNextExecutions(cronExpr, 5), [cronExpr]);

  const updateField = useCallback(
    (key: keyof CronFields, patch: Partial<FieldState>) => {
      setFields((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
    },
    []
  );

  const applyPreset = (preset: Preset) => {
    setFields((prev) => {
      const next = { ...prev };
      for (const [k, v] of Object.entries(preset.fields) as [keyof CronFields, Partial<FieldState>][]) {
        next[k] = { ...prev[k], ...v };
      }
      return next;
    });
  };

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="Cron Expression Builder"
      description="직관적인 UI로 cron 표현식을 생성하고 다음 실행 시간을 확인합니다."
      icon={AlarmClock}
    >
      <div className="flex flex-col gap-6">
        {/* 프리셋 */}
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => applyPreset(p)}
              className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* 필드 편집기 */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {FIELD_CONFIGS.map((cfg) => {
            const state = fields[cfg.key];
            const modes: FieldMode[] = ["every", "specific", "range", "step"];
            const modeLabel: Record<FieldMode, string> = { every: "매번(*)", specific: "특정값", range: "범위", step: "간격" };
            return (
              <div key={cfg.key} className="flex flex-col gap-2 rounded-xl border border-border bg-bg-secondary p-4">
                <span className="text-xs font-bold text-text-primary">{cfg.label}</span>
                <div className="flex flex-col gap-1">
                  {modes.map((m) => (
                    <label key={m} className="flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name={`mode-${cfg.key}`}
                        checked={state.mode === m}
                        onChange={() => updateField(cfg.key, { mode: m })}
                        className="accent-brand"
                      />
                      <span className="text-xs text-text-secondary">{modeLabel[m]}</span>
                    </label>
                  ))}
                </div>

                {state.mode === "specific" && (
                  <input
                    type="number"
                    min={cfg.min}
                    max={cfg.max}
                    value={state.specific}
                    onChange={(e) => updateField(cfg.key, { specific: e.target.value })}
                    className="w-full rounded-lg border border-border bg-bg-primary px-2 py-1.5 text-center text-sm text-text-primary focus:border-brand focus:outline-none"
                  />
                )}
                {state.mode === "range" && (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={cfg.min}
                      max={cfg.max}
                      value={state.rangeFrom}
                      onChange={(e) => updateField(cfg.key, { rangeFrom: e.target.value })}
                      className="w-full rounded-lg border border-border bg-bg-primary px-2 py-1.5 text-center text-sm text-text-primary focus:border-brand focus:outline-none"
                    />
                    <span className="text-xs text-text-secondary">~</span>
                    <input
                      type="number"
                      min={cfg.min}
                      max={cfg.max}
                      value={state.rangeTo}
                      onChange={(e) => updateField(cfg.key, { rangeTo: e.target.value })}
                      className="w-full rounded-lg border border-border bg-bg-primary px-2 py-1.5 text-center text-sm text-text-primary focus:border-brand focus:outline-none"
                    />
                  </div>
                )}
                {state.mode === "step" && (
                  <div className="flex flex-col gap-1">
                    <input
                      type="number"
                      min={1}
                      max={cfg.max}
                      value={state.stepEvery}
                      placeholder="간격"
                      onChange={(e) => updateField(cfg.key, { stepEvery: e.target.value })}
                      className="w-full rounded-lg border border-border bg-bg-primary px-2 py-1.5 text-center text-sm text-text-primary focus:border-brand focus:outline-none"
                    />
                    <span className="text-center text-xs text-text-secondary">시작값(선택)</span>
                    <input
                      type="number"
                      min={cfg.min}
                      max={cfg.max}
                      value={state.stepFrom}
                      onChange={(e) => updateField(cfg.key, { stepFrom: e.target.value })}
                      className="w-full rounded-lg border border-border bg-bg-primary px-2 py-1.5 text-center text-sm text-text-primary focus:border-brand focus:outline-none"
                    />
                  </div>
                )}

                {/* 현재 표현식 미리보기 */}
                <div className="mt-auto rounded bg-bg-primary px-2 py-1 text-center font-mono text-sm font-bold text-brand">
                  {buildFieldExpr(state)}
                </div>
              </div>
            );
          })}
        </div>

        {/* 결과 */}
        <div className="rounded-xl border border-border bg-bg-secondary p-5">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-text-secondary">생성된 Cron 표현식</span>
                <span className="font-mono text-2xl font-bold tracking-wider text-brand">{cronExpr}</span>
              </div>
              <button
                type="button"
                onClick={() => copy(cronExpr, "expr")}
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
              >
                {copied === "expr" ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                복사
              </button>
            </div>

            <p className="text-sm text-text-secondary">
              <span className="font-medium text-text-primary">설명:</span> {description}
            </p>
          </div>
        </div>

        {/* 다음 실행 시간 */}
        <div className="rounded-xl border border-border bg-bg-secondary p-5">
          <p className="mb-3 text-xs font-semibold text-text-secondary">다음 실행 시간 (5회)</p>
          {nextTimes.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {nextTimes.map((t, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                    {i + 1}
                  </span>
                  <span className="font-mono text-sm text-text-primary">{t}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-secondary">계산할 수 없는 표현식입니다.</p>
          )}
        </div>
      </div>
    </ToolPageLayout>
  );
}
