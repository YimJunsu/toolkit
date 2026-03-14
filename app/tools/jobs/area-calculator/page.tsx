 "use client";

import { useState, useCallback } from "react";
import { Ruler, Copy, Check, ArrowLeftRight } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Jobs", href: "/tools/jobs" },
];

/* ── 단위 상수 ── */
const PYEONG_TO_M2 = 3.30579;   // 1평 = 3.30579 m²
const M2_TO_FT2 = 10.7639;      // 1 m² = 10.7639 ft²
const M2_TO_TSUBO = 0.3025;     // 1 m² = 0.3025 坪 (일본 쓰보)

/* ── 계산 ── */
function fromPyeong(p: number) {
  const m2 = p * PYEONG_TO_M2;
  return { pyeong: p, m2, ft2: m2 * M2_TO_FT2, tsubo: m2 * M2_TO_TSUBO };
}
function fromM2(m: number) {
  return { pyeong: m / PYEONG_TO_M2, m2: m, ft2: m * M2_TO_FT2, tsubo: m * M2_TO_TSUBO };
}
function fromFt2(f: number) {
  const m2 = f / M2_TO_FT2;
  return fromM2(m2);
}

type UnitKey = "pyeong" | "m2" | "ft2";

const UNIT_LABELS: Record<UnitKey, string> = {
  pyeong: "평",
  m2: "m²",
  ft2: "ft²",
};

/* ── 아파트 면적 타입 비율표 ── */
const AREA_RATIO_TABLE = [
  { label: "전용면적", ratio: 1.0, desc: "실제 거주 공간 (방·거실·주방·욕실)" },
  { label: "공용면적", ratio: null, desc: "계단·복도·엘리베이터 등 공용 공간" },
  { label: "공급면적", ratio: null, desc: "전용면적 + 주거공용면적" },
  { label: "계약면적", ratio: null, desc: "공급면적 + 기타공용면적 (전체 분양 면적)" },
];

const COMMON_SIZES = [
  { label: "원룸", pyeong: 10 },
  { label: "투룸", pyeong: 18 },
  { label: "24평형", pyeong: 24 },
  { label: "32평형", pyeong: 32 },
  { label: "42평형", pyeong: 42 },
  { label: "59㎡", m2: 59 },
  { label: "84㎡", m2: 84 },
  { label: "114㎡", m2: 114 },
];

function fmt(n: number, d = 2): string {
  return n.toFixed(d).replace(/\.?0+$/, "");
}

/* ── 공급/전용 역산 계산기 ── */
interface AreaBreakdown {
  supplyPyeong: number;
  exclusiveRatio: number; // 0~1
}

function calcBreakdown({ supplyPyeong, exclusiveRatio }: AreaBreakdown) {
  const supplyM2 = supplyPyeong * PYEONG_TO_M2;
  const exclusiveM2 = supplyM2 * exclusiveRatio;
  const exclusivePyeong = exclusiveM2 / PYEONG_TO_M2;
  const commonM2 = supplyM2 - exclusiveM2;
  return { supplyM2, exclusiveM2, exclusivePyeong, commonM2 };
}

export default function AreaCalculatorPage() {
  /* ── 단위 변환 탭 ── */
  const [inputUnit, setInputUnit] = useState<UnitKey>("pyeong");
  const [inputValue, setInputValue] = useState("32");
  const [copied, setCopied] = useState<string | null>(null);

  const numVal = parseFloat(inputValue) || 0;
  const calc =
    inputUnit === "pyeong" ? fromPyeong(numVal)
    : inputUnit === "m2"   ? fromM2(numVal)
    : fromFt2(numVal);

  const handleCopy = useCallback(async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1800);
  }, []);

  const handlePreset = (item: { pyeong?: number; m2?: number }) => {
    if (item.pyeong !== undefined) { setInputUnit("pyeong"); setInputValue(String(item.pyeong)); }
    else if (item.m2 !== undefined) { setInputUnit("m2"); setInputValue(String(item.m2)); }
  };

  /* ── 공급/전용 역산 탭 ── */
  const [supply, setSupply] = useState("32");
  const [ratio, setRatio] = useState(75); // %
  const bd = calcBreakdown({ supplyPyeong: parseFloat(supply) || 0, exclusiveRatio: ratio / 100 });

  /* ── 탭 ── */
  const [tab, setTab] = useState<"convert" | "breakdown">("convert");

  const RESULT_ROWS: Array<{ key: UnitKey | "tsubo"; label: string; value: number; unit: string }> = [
    { key: "pyeong", label: "평", value: calc.pyeong, unit: "평" },
    { key: "m2",     label: "제곱미터 (㎡)", value: calc.m2, unit: "m²" },
    { key: "ft2",    label: "제곱피트 (ft²)", value: calc.ft2, unit: "ft²" },
    { key: "tsubo",  label: "쓰보 (坪)", value: calc.tsubo, unit: "坪" },
  ];

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="평수 계산기"
      description="평 ↔ m² ↔ ft² 면적 단위를 즉시 변환하고 전용·공급면적을 계산합니다."
      icon={Ruler}
    >
      <div className="flex flex-col gap-6">

        {/* 탭 */}
        <div className="flex overflow-hidden rounded-xl border border-border">
          {([
            { key: "convert", label: "단위 변환" },
            { key: "breakdown", label: "전용 / 공급 계산" },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                tab === key
                  ? "bg-brand text-white"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── 탭 1: 단위 변환 ── */}
        {tab === "convert" && (
          <div className="flex flex-col gap-5">

            {/* 자주 쓰는 사이즈 프리셋 */}
            <div className="flex flex-wrap gap-2">
              {COMMON_SIZES.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => handlePreset(s)}
                  className="rounded-full border border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* 입력 */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-text-secondary">면적 입력</span>
              <div className="flex gap-2">
                {/* 단위 선택 */}
                <div className="flex overflow-hidden rounded-xl border border-border">
                  {(["pyeong", "m2", "ft2"] as UnitKey[]).map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setInputUnit(u)}
                      className={`px-4 py-3 text-sm font-medium transition-colors ${
                        inputUnit === u
                          ? "bg-brand text-white"
                          : "text-text-secondary hover:text-text-primary"
                      }`}
                    >
                      {UNIT_LABELS[u]}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  min={0}
                  step="0.1"
                  className="flex-1 rounded-xl border border-border bg-bg-secondary px-4 py-3 text-right font-mono text-lg font-bold text-text-primary focus:border-brand focus:outline-none"
                  placeholder="0"
                />
              </div>
            </div>

            {/* 결과 */}
            <div className="overflow-hidden rounded-xl border border-border">
              <div className="border-b border-border bg-bg-secondary px-4 py-3 text-xs font-semibold text-text-primary">
                변환 결과
              </div>
              <div className="divide-y divide-border">
                {RESULT_ROWS.map(({ key, label, value, unit }) => {
                  const display = fmt(value);
                  const isInput = key === inputUnit;
                  return (
                    <div
                      key={key}
                      className={`flex items-center gap-4 px-4 py-3.5 ${
                        isInput ? "bg-brand/5" : ""
                      }`}
                    >
                      <span className={`w-32 shrink-0 text-sm ${isInput ? "font-semibold text-brand" : "text-text-secondary"}`}>
                        {label}
                        {isInput && <span className="ml-1.5 text-xs opacity-60">(입력)</span>}
                      </span>
                      <span className="flex-1 font-mono text-lg font-bold text-text-primary">
                        {display}
                        <span className="ml-1 text-sm font-normal text-text-secondary">{unit}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(display, key)}
                        className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
                        aria-label="복사"
                      >
                        {copied === key
                          ? <Check size={13} className="text-emerald-400" />
                          : <Copy size={13} />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 변환 기준 안내 */}
            <div className="rounded-xl border border-border bg-bg-secondary px-4 py-3 text-xs text-text-secondary">
              <p className="font-semibold text-text-primary mb-1">변환 기준</p>
              <ul className="space-y-0.5">
                <li>1평 = 3.30579 m² (1 m² = 0.3025 평)</li>
                <li>1 m² = 10.7639 ft²</li>
                <li>1 쓰보(坪) = 1 평 (한국·일본 동일 기준)</li>
              </ul>
            </div>
          </div>
        )}

        {/* ── 탭 2: 전용 / 공급 계산 ── */}
        {tab === "breakdown" && (
          <div className="flex flex-col gap-5">

            {/* 면적 개념 안내 */}
            <div className="overflow-hidden rounded-xl border border-border">
              <div className="border-b border-border bg-bg-secondary px-4 py-3 text-xs font-semibold text-text-primary">
                아파트 면적 용어 정리
              </div>
              <div className="divide-y divide-border">
                {AREA_RATIO_TABLE.map(({ label, desc }) => (
                  <div key={label} className="flex items-start gap-3 px-4 py-3">
                    <span className="w-20 shrink-0 text-xs font-semibold text-brand">{label}</span>
                    <span className="text-xs text-text-secondary leading-relaxed">{desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 입력 */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-text-secondary">공급면적 (평)</label>
                <input
                  type="number"
                  value={supply}
                  onChange={(e) => setSupply(e.target.value)}
                  min={0}
                  step="0.1"
                  className="rounded-xl border border-border bg-bg-secondary px-4 py-3 font-mono text-lg font-bold text-text-primary focus:border-brand focus:outline-none"
                  placeholder="32"
                />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-text-secondary">전용률</label>
                  <span className="font-mono text-sm font-bold text-brand">{ratio}%</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={95}
                  value={ratio}
                  onChange={(e) => setRatio(parseInt(e.target.value))}
                  className="accent-brand"
                />
                <div className="flex justify-between text-xs text-text-secondary">
                  <span>50% (구축)</span>
                  <span>75% (일반)</span>
                  <span>95% (신축)</span>
                </div>
              </div>
            </div>

            {/* 계산 결과 */}
            {(parseFloat(supply) || 0) > 0 && (
              <div className="overflow-hidden rounded-xl border border-border">
                <div className="border-b border-border bg-bg-secondary px-4 py-3 text-xs font-semibold text-text-primary flex items-center gap-2">
                  <ArrowLeftRight size={13} className="text-brand" />
                  계산 결과
                </div>
                <div className="divide-y divide-border">
                  {[
                    {
                      label: "공급면적",
                      pyeong: parseFloat(supply) || 0,
                      m2: bd.supplyM2,
                      color: "text-text-primary",
                    },
                    {
                      label: "전용면적",
                      pyeong: bd.exclusivePyeong,
                      m2: bd.exclusiveM2,
                      color: "text-brand",
                    },
                    {
                      label: "공용면적",
                      pyeong: (parseFloat(supply) || 0) - bd.exclusivePyeong,
                      m2: bd.commonM2,
                      color: "text-text-secondary",
                    },
                  ].map(({ label, pyeong, m2, color }) => (
                    <div key={label} className="grid grid-cols-3 divide-x divide-border">
                      <div className="px-4 py-3.5 flex items-center">
                        <span className={`text-sm font-semibold ${color}`}>{label}</span>
                      </div>
                      <div className="px-4 py-3.5">
                        <p className="font-mono text-base font-bold text-text-primary">
                          {fmt(pyeong)}
                          <span className="ml-1 text-xs font-normal text-text-secondary">평</span>
                        </p>
                      </div>
                      <div className="px-4 py-3.5">
                        <p className="font-mono text-base font-bold text-text-primary">
                          {fmt(m2)}
                          <span className="ml-1 text-xs font-normal text-text-secondary">m²</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 전용률 기준 참고 */}
            <div className="rounded-xl border border-border bg-bg-secondary px-4 py-3 text-xs text-text-secondary">
              <p className="font-semibold text-text-primary mb-1">전용률 참고 기준</p>
              <ul className="space-y-0.5">
                <li>구축 아파트 (1990년대 이전): 약 55~65%</li>
                <li>일반 아파트 (2000년대): 약 70~80%</li>
                <li>신축 아파트 (최근): 약 80~85%</li>
                <li>오피스텔: 약 45~55% (상대적으로 낮음)</li>
              </ul>
            </div>
          </div>
        )}

      </div>
    </ToolPageLayout>
  );
}