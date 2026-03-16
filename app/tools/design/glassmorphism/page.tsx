"use client";

import { useState, useMemo } from "react";
import { Layers, Copy, Check } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { useClipboard } from "@/hooks/useClipboard";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Design", href: "/tools/design" },
];

interface GlassConfig {
  blur: number;
  opacity: number;
  borderOpacity: number;
  bgColor: string;
  borderRadius: number;
  saturation: number;
}

function buildCss(c: GlassConfig, selector = ".glass") {
  const bg = hexToRgba(c.bgColor, c.opacity);
  const border = hexToRgba("#ffffff", c.borderOpacity);
  return `${selector} {
  background: ${bg};
  backdrop-filter: blur(${c.blur}px) saturate(${c.saturation}%);
  -webkit-backdrop-filter: blur(${c.blur}px) saturate(${c.saturation}%);
  border: 1px solid ${border};
  border-radius: ${c.borderRadius}px;
}`;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
}

function Slider({
  label, value, min, max, step = 1, onChange, unit = "",
}: {
  label: string; value: number; min: number; max: number;
  step?: number; onChange: (v: number) => void; unit?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-xs text-text-secondary">{label}</label>
        <span className="font-mono text-xs font-bold text-brand">{value}{unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-brand"
      />
      <div className="flex justify-between text-[11px] text-text-secondary">
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  );
}

export default function GlassmorphismPage() {
  const [cfg, setCfg] = useState<GlassConfig>({
    blur: 12,
    opacity: 0.15,
    borderOpacity: 0.25,
    bgColor: "#ffffff",
    borderRadius: 16,
    saturation: 180,
  });
  const { copied, copy } = useClipboard();

  const set = <K extends keyof GlassConfig>(key: K, val: GlassConfig[K]) =>
    setCfg((prev) => ({ ...prev, [key]: val }));

  const css = useMemo(() => buildCss(cfg), [cfg]);

  // preview card inline styles
  const previewStyle = {
    background: hexToRgba(cfg.bgColor, cfg.opacity),
    backdropFilter: `blur(${cfg.blur}px) saturate(${cfg.saturation}%)`,
    WebkitBackdropFilter: `blur(${cfg.blur}px) saturate(${cfg.saturation}%)`,
    border: `1px solid ${hexToRgba("#ffffff", cfg.borderOpacity)}`,
    borderRadius: `${cfg.borderRadius}px`,
  };

  const PRESETS: { label: string; cfg: Partial<GlassConfig> }[] = [
    { label: "Light",   cfg: { blur: 12, opacity: 0.15, borderOpacity: 0.25, bgColor: "#ffffff" } },
    { label: "Dark",    cfg: { blur: 16, opacity: 0.10, borderOpacity: 0.15, bgColor: "#000000" } },
    { label: "Frosted", cfg: { blur: 24, opacity: 0.20, borderOpacity: 0.40, bgColor: "#ffffff", saturation: 200 } },
    { label: "Subtle",  cfg: { blur: 6,  opacity: 0.08, borderOpacity: 0.12, bgColor: "#ffffff" } },
  ];

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="Glassmorphism Generator"
      description="유리 효과(Glassmorphism) CSS를 실시간으로 생성합니다. blur · 투명도 · 테두리를 조절하고 코드를 복사하세요."
      icon={Layers}
    >
      <div className="flex flex-col gap-6">

        {/* ── 프리셋 ── */}
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(({ label, cfg: p }) => (
            <button
              key={label}
              type="button"
              onClick={() => setCfg((prev) => ({ ...prev, ...p }))}
              className="rounded-full border border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">

          {/* ── 컨트롤 패널 ── */}
          <div className="flex flex-col gap-5 rounded-xl border border-border bg-bg-secondary p-5">
            <Slider label="Blur" value={cfg.blur} min={0} max={50} unit="px"
              onChange={(v) => set("blur", v)} />
            <Slider label="배경 투명도 (Opacity)" value={Math.round(cfg.opacity * 100)} min={0} max={60} unit="%"
              onChange={(v) => set("opacity", v / 100)} />
            <Slider label="테두리 투명도" value={Math.round(cfg.borderOpacity * 100)} min={0} max={80} unit="%"
              onChange={(v) => set("borderOpacity", v / 100)} />
            <Slider label="Saturation" value={cfg.saturation} min={100} max={300} unit="%"
              onChange={(v) => set("saturation", v)} />
            <Slider label="Border Radius" value={cfg.borderRadius} min={0} max={40} unit="px"
              onChange={(v) => set("borderRadius", v)} />

            <div className="flex flex-col gap-2">
              <label className="text-xs text-text-secondary">배경 색상</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={cfg.bgColor}
                  onChange={(e) => set("bgColor", e.target.value)}
                  className="h-10 w-16 cursor-pointer rounded-lg border border-border bg-transparent"
                />
                <span className="font-mono text-sm text-text-primary">{cfg.bgColor.toUpperCase()}</span>
              </div>
            </div>
          </div>

          {/* ── 미리보기 ── */}
          <div className="flex flex-col gap-4">
            <div
              className="relative flex h-64 items-center justify-center overflow-hidden rounded-xl"
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
              }}
            >
              {/* 배경 원 장식 */}
              <div className="absolute -left-8 -top-8 size-32 rounded-full bg-white/20 blur-xl" />
              <div className="absolute -bottom-8 -right-8 size-40 rounded-full bg-purple-400/30 blur-xl" />

              {/* 유리 카드 */}
              <div style={previewStyle} className="relative z-10 w-52 p-5 shadow-xl">
                <div className="mb-3 size-8 rounded-full bg-white/30" />
                <div className="mb-2 h-2.5 w-32 rounded-full bg-white/40" />
                <div className="mb-1 h-2 w-24 rounded-full bg-white/25" />
                <div className="mt-4 flex gap-2">
                  <div className="h-6 flex-1 rounded-lg bg-white/30" />
                  <div className="h-6 flex-1 rounded-lg bg-white/20" />
                </div>
              </div>
            </div>

            {/* CSS 결과 */}
            <div className="overflow-hidden rounded-xl border border-border">
              <div className="flex items-center justify-between border-b border-border bg-bg-secondary px-4 py-2.5">
                <span className="text-xs font-semibold text-text-primary">CSS</span>
                <button
                  type="button"
                  onClick={() => copy(css, "css")}
                  className="flex items-center gap-1.5 text-xs text-text-secondary transition-colors hover:text-brand"
                >
                  {copied === "css" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  복사
                </button>
              </div>
              <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-text-secondary">
                <code>{css}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
}