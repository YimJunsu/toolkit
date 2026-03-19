"use client";

import { useState, useCallback } from "react";
import { Crop, Copy, Check, Link, Unlink } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { useClipboard } from "@/hooks/useClipboard";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Design", href: "/tools/design" },
];

type Unit = "%" | "px";
type Corner = "tl" | "tr" | "br" | "bl";

interface CornerValues {
  tl: number;
  tr: number;
  br: number;
  bl: number;
}

const CORNER_LABELS: Record<Corner, string> = {
  tl: "Top Left",
  tr: "Top Right",
  br: "Bottom Right",
  bl: "Bottom Left",
};

function suggestTailwind(values: CornerValues, unit: Unit): string {
  const { tl, tr, br, bl } = values;
  const avg = (tl + tr + br + bl) / 4;
  const allSame = tl === tr && tr === br && br === bl;

  if (!allSame) return "rounded-[custom] (개별 코너)";

  if (unit === "%" && avg >= 50) return "rounded-full";
  if (unit === "px") {
    if (avg === 0) return "rounded-none";
    if (avg <= 2) return "rounded-sm";
    if (avg <= 4) return "rounded";
    if (avg <= 6) return "rounded-md";
    if (avg <= 8) return "rounded-lg";
    if (avg <= 12) return "rounded-xl";
    if (avg <= 16) return "rounded-2xl";
    if (avg <= 24) return "rounded-3xl";
    return "rounded-full";
  }
  // percent
  if (avg === 0) return "rounded-none";
  if (avg <= 10) return "rounded-sm";
  if (avg <= 15) return "rounded";
  if (avg <= 20) return "rounded-lg";
  if (avg <= 30) return "rounded-xl";
  if (avg <= 40) return "rounded-2xl";
  if (avg >= 50) return "rounded-full";
  return "rounded-3xl";
}

function buildCssValue(values: CornerValues, unit: Unit): string {
  const { tl, tr, br, bl } = values;
  const u = unit;
  if (tl === tr && tr === br && br === bl) return `${tl}${u}`;
  return `${tl}${u} ${tr}${u} ${br}${u} ${bl}${u}`;
}

const PRESETS: { label: string; values: CornerValues; unit: Unit }[] = [
  { label: "없음", values: { tl: 0, tr: 0, br: 0, bl: 0 }, unit: "px" },
  { label: "sm", values: { tl: 2, tr: 2, br: 2, bl: 2 }, unit: "px" },
  { label: "md", values: { tl: 6, tr: 6, br: 6, bl: 6 }, unit: "px" },
  { label: "lg", values: { tl: 8, tr: 8, br: 8, bl: 8 }, unit: "px" },
  { label: "xl", values: { tl: 12, tr: 12, br: 12, bl: 12 }, unit: "px" },
  { label: "2xl", values: { tl: 16, tr: 16, br: 16, bl: 16 }, unit: "px" },
  { label: "3xl", values: { tl: 24, tr: 24, br: 24, bl: 24 }, unit: "px" },
  { label: "full", values: { tl: 50, tr: 50, br: 50, bl: 50 }, unit: "%" },
  { label: "알약", values: { tl: 50, tr: 50, br: 0, bl: 0 }, unit: "%" },
  { label: "물방울", values: { tl: 50, tr: 10, br: 50, bl: 10 }, unit: "%" },
];

export default function BorderRadiusPage() {
  const [values, setValues] = useState<CornerValues>({ tl: 8, tr: 8, br: 8, bl: 8 });
  const [unit, setUnit] = useState<Unit>("px");
  const [linked, setLinked] = useState(true);
  const { copied, copy } = useClipboard();

  const maxVal = unit === "%" ? 50 : 200;

  const handleChange = useCallback(
    (corner: Corner, v: number) => {
      if (linked) {
        setValues({ tl: v, tr: v, br: v, bl: v });
      } else {
        setValues((prev) => ({ ...prev, [corner]: v }));
      }
    },
    [linked]
  );

  const handleUnitChange = (u: Unit) => {
    setUnit(u);
    // clamp to new max
    const newMax = u === "%" ? 50 : 200;
    setValues((prev) => ({
      tl: Math.min(prev.tl, newMax),
      tr: Math.min(prev.tr, newMax),
      br: Math.min(prev.br, newMax),
      bl: Math.min(prev.bl, newMax),
    }));
  };

  const cssValue = buildCssValue(values, unit);
  const cssCode = `border-radius: ${cssValue};`;
  const twSuggestion = suggestTailwind(values, unit);

  const borderRadius = `${values.tl}${unit} ${values.tr}${unit} ${values.br}${unit} ${values.bl}${unit}`;

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="Border Radius Visualizer"
      description="4개 코너의 border-radius를 슬라이더로 조정하고 CSS/Tailwind 코드를 생성합니다."
      icon={Crop}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 컨트롤 */}
        <div className="flex flex-col gap-5">
          {/* 단위 + 연결 토글 */}
          <div className="flex items-center gap-4">
            <div className="flex overflow-hidden rounded-lg border border-border">
              {(["px", "%"] as Unit[]).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => handleUnitChange(u)}
                  className={`px-4 py-2 text-xs font-medium transition-colors ${
                    unit === u
                      ? "bg-brand text-white"
                      : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setLinked((p) => !p)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors ${
                linked
                  ? "border-brand bg-brand/10 text-brand"
                  : "border-border text-text-secondary hover:border-brand/40"
              }`}
            >
              {linked ? <Link size={12} /> : <Unlink size={12} />}
              {linked ? "연결됨" : "개별 조정"}
            </button>
          </div>

          {/* 슬라이더 4개 */}
          {(["tl", "tr", "br", "bl"] as Corner[]).map((corner) => (
            <div key={corner} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-text-secondary">{CORNER_LABELS[corner]}</label>
                <span className="font-mono text-xs text-brand">{values[corner]}{unit}</span>
              </div>
              <input
                type="range"
                min={0}
                max={maxVal}
                value={values[corner]}
                onChange={(e) => handleChange(corner, Number(e.target.value))}
                className="w-full accent-brand"
              />
            </div>
          ))}

          {/* 숫자 직접 입력 */}
          {!linked && (
            <div className="grid grid-cols-2 gap-3">
              {(["tl","tr","br","bl"] as Corner[]).map((corner) => (
                <div key={corner} className="flex flex-col gap-1">
                  <label className="text-xs text-text-secondary">{CORNER_LABELS[corner]}</label>
                  <input
                    type="number"
                    min={0}
                    max={maxVal}
                    value={values[corner]}
                    onChange={(e) => handleChange(corner, Math.min(maxVal, Math.max(0, Number(e.target.value))))}
                    className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary focus:border-brand focus:outline-none"
                  />
                </div>
              ))}
            </div>
          )}

          {/* 프리셋 */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-text-secondary">프리셋</label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setUnit(p.unit);
                    setValues(p.values);
                  }}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 오른쪽: 프리뷰 + 코드 */}
        <div className="flex flex-col gap-5">
          {/* 라이브 프리뷰 */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-text-secondary">라이브 프리뷰</label>
            <div className="flex h-72 items-center justify-center rounded-xl border border-border bg-bg-secondary">
              <div
                className="size-48 bg-gradient-to-br from-brand/40 to-brand/80 ring-2 ring-brand/30 transition-all duration-200"
                style={{ borderRadius }}
              />
            </div>
          </div>

          {/* CSS 출력 */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-text-secondary">CSS 출력</label>
              <button
                type="button"
                onClick={() => copy(cssCode, "css")}
                className="flex items-center gap-1 rounded-lg border border-border px-2 py-1.5 text-xs text-text-secondary transition-colors hover:border-brand/40 hover:text-brand"
              >
                {copied === "css" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                복사
              </button>
            </div>
            <div className="flex items-center rounded-xl border border-border bg-bg-secondary px-4 py-3">
              <code className="font-mono text-sm text-text-primary">{cssCode}</code>
            </div>
          </div>

          {/* 개별 코너 값 */}
          <div className="grid grid-cols-2 gap-2">
            {(["tl","tr","br","bl"] as Corner[]).map((corner) => (
              <div key={corner} className="flex items-center justify-between rounded-lg border border-border bg-bg-secondary px-3 py-2">
                <span className="text-xs text-text-secondary">{CORNER_LABELS[corner]}</span>
                <span className="font-mono text-xs font-bold text-brand">{values[corner]}{unit}</span>
              </div>
            ))}
          </div>

          {/* Tailwind 제안 */}
          <div className="flex items-center gap-3 rounded-xl border border-border bg-bg-secondary px-4 py-3">
            <span className="shrink-0 text-xs font-semibold text-text-secondary">Tailwind 제안:</span>
            <button
              type="button"
              onClick={() => copy(twSuggestion, "tw")}
              className="flex items-center gap-1.5 rounded-lg bg-brand/10 px-3 py-1.5 font-mono text-xs text-brand transition-opacity hover:opacity-80"
            >
              {twSuggestion}
              {copied === "tw" ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
            </button>
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
}
