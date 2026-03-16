"use client";

import { useState } from "react";
import { LayoutGrid, Copy, Check } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { useClipboard } from "@/hooks/useClipboard";

type LayoutMode = "flex" | "grid";

interface FlexConfig {
  direction: string;
  wrap: string;
  justifyContent: string;
  alignItems: string;
  gap: number;
}

interface GridConfig {
  columns: number;
  rows: number;
  gap: number;
  autoRows: string;
}

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Design", href: "/tools/design" },
];

const FLEX_DIRECTIONS   = ["row", "row-reverse", "column", "column-reverse"];
const FLEX_WRAPS        = ["nowrap", "wrap", "wrap-reverse"];
const JUSTIFY_OPTIONS   = ["flex-start", "flex-end", "center", "space-between", "space-around", "space-evenly"];
const ALIGN_OPTIONS     = ["flex-start", "flex-end", "center", "stretch", "baseline"];
const PREVIEW_ITEMS     = Array.from({ length: 6 }, (_, i) => i + 1);

function buildFlexCss(cfg: FlexConfig): string {
  return [
    `display: flex;`,
    `flex-direction: ${cfg.direction};`,
    `flex-wrap: ${cfg.wrap};`,
    `justify-content: ${cfg.justifyContent};`,
    `align-items: ${cfg.alignItems};`,
    `gap: ${cfg.gap}px;`,
  ].join("\n  ");
}

function buildGridCss(cfg: GridConfig): string {
  return [
    `display: grid;`,
    `grid-template-columns: repeat(${cfg.columns}, 1fr);`,
    cfg.rows > 0 ? `grid-template-rows: repeat(${cfg.rows}, ${cfg.autoRows});` : `grid-auto-rows: ${cfg.autoRows};`,
    `gap: ${cfg.gap}px;`,
  ].join("\n  ");
}

export default function GridGeneratorPage() {
  const [mode, setMode]   = useState<LayoutMode>("flex");
  const { copied, copy } = useClipboard();

  const [flex, setFlex] = useState<FlexConfig>({
    direction: "row",
    wrap: "wrap",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 16,
  });

  const [grid, setGrid] = useState<GridConfig>({
    columns: 3,
    rows: 0,
    gap: 16,
    autoRows: "100px",
  });

  const cssBody = mode === "flex" ? buildFlexCss(flex) : buildGridCss(grid);
  const fullCss = `.container {\n  ${cssBody}\n}`;

  const previewStyle: React.CSSProperties =
    mode === "flex"
      ? {
          display: "flex",
          flexDirection: flex.direction as React.CSSProperties["flexDirection"],
          flexWrap: flex.wrap as React.CSSProperties["flexWrap"],
          justifyContent: flex.justifyContent,
          alignItems: flex.alignItems,
          gap: `${flex.gap}px`,
        }
      : {
          display: "grid",
          gridTemplateColumns: `repeat(${grid.columns}, 1fr)`,
          ...(grid.rows > 0 ? { gridTemplateRows: `repeat(${grid.rows}, ${grid.autoRows})` } : { gridAutoRows: grid.autoRows }),
          gap: `${grid.gap}px`,
        };

  const handleCopy = () => {
    copy(fullCss, "default");
  };

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="그리드 / 레이아웃 생성기"
      description="CSS Flexbox / Grid 속성을 조작하고 코드를 즉시 생성"
      icon={LayoutGrid}
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">

        {/* 왼쪽: 설정 패널 */}
        <div className="flex flex-col gap-6">

          {/* 모드 토글 */}
          <div className="flex rounded-xl border border-border p-1">
            {(["flex", "grid"] as LayoutMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex-1 rounded-lg py-2 text-sm font-medium capitalize transition-colors ${
                  mode === m
                    ? "bg-brand text-white shadow"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                CSS {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>

          {/* Flexbox 컨트롤 */}
          {mode === "flex" && (
            <div className="flex flex-col gap-4">
              <SelectField
                label="flex-direction"
                value={flex.direction}
                options={FLEX_DIRECTIONS}
                onChange={(v) => setFlex((p) => ({ ...p, direction: v }))}
              />
              <SelectField
                label="flex-wrap"
                value={flex.wrap}
                options={FLEX_WRAPS}
                onChange={(v) => setFlex((p) => ({ ...p, wrap: v }))}
              />
              <SelectField
                label="justify-content"
                value={flex.justifyContent}
                options={JUSTIFY_OPTIONS}
                onChange={(v) => setFlex((p) => ({ ...p, justifyContent: v }))}
              />
              <SelectField
                label="align-items"
                value={flex.alignItems}
                options={ALIGN_OPTIONS}
                onChange={(v) => setFlex((p) => ({ ...p, alignItems: v }))}
              />
              <RangeField
                label="gap"
                value={flex.gap}
                min={0} max={64} unit="px"
                onChange={(v) => setFlex((p) => ({ ...p, gap: v }))}
              />
            </div>
          )}

          {/* Grid 컨트롤 */}
          {mode === "grid" && (
            <div className="flex flex-col gap-4">
              <RangeField
                label="grid-template-columns"
                value={grid.columns}
                min={1} max={12} unit="열"
                onChange={(v) => setGrid((p) => ({ ...p, columns: v }))}
              />
              <RangeField
                label="gap"
                value={grid.gap}
                min={0} max={64} unit="px"
                onChange={(v) => setGrid((p) => ({ ...p, gap: v }))}
              />
              <div>
                <label className="mb-1.5 block text-xs font-medium text-text-secondary">
                  grid-auto-rows
                </label>
                <input
                  type="text"
                  value={grid.autoRows}
                  onChange={(e) => setGrid((p) => ({ ...p, autoRows: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 font-mono text-sm text-text-primary focus:border-brand focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* 오른쪽: 미리보기 + 코드 */}
        <div className="flex flex-col gap-6">
          {/* 미리보기 */}
          <div>
            <p className="mb-2 text-xs font-medium text-text-secondary">미리보기</p>
            <div className="min-h-48 overflow-auto rounded-xl border border-border bg-bg-secondary p-4">
              <div style={previewStyle}>
                {PREVIEW_ITEMS.map((n) => (
                  <div
                    key={n}
                    className="flex min-h-[60px] min-w-[60px] items-center justify-center rounded-lg border border-brand/30 bg-brand/10 text-sm font-bold text-brand"
                  >
                    {n}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 생성된 CSS */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium text-text-secondary">생성된 CSS</p>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-text-primary"
              >
                {copied === "default" ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                {copied === "default" ? "복사됨" : "복사"}
              </button>
            </div>
            <pre className="overflow-x-auto rounded-xl border border-border bg-bg-secondary p-4 font-mono text-sm text-text-primary">
              <code>{fullCss}</code>
            </pre>
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
}

/* ── 공용 컨트롤 ── */

function SelectField({
  label, value, options, onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-text-secondary">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary focus:border-brand focus:outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

function RangeField({
  label, value, min, max, unit, onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-xs font-medium text-text-secondary">{label}</label>
        <span className="font-mono text-xs text-text-primary">{value}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full accent-brand"
      />
    </div>
  );
}