"use client";

import { useState, useMemo } from "react";
import { Paintbrush, Copy, Check } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { useClipboard } from "@/hooks/useClipboard";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Design", href: "/tools/design" },
];

/* ─── oklch 변환 (라이브러리 없이 순수 JS) ─── */
function linearize(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function delinearize(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

function hexToOklch(hex: string): [number, number, number] {
  const r = linearize(parseInt(hex.slice(1, 3), 16) / 255);
  const g = linearize(parseInt(hex.slice(3, 5), 16) / 255);
  const b = linearize(parseInt(hex.slice(5, 7), 16) / 255);

  const l_ = Math.cbrt(0.41222147 * r + 0.53633254 * g + 0.05144599 * b);
  const m_ = Math.cbrt(0.21190350 * r + 0.68069955 * g + 0.10739695 * b);
  const s_ = Math.cbrt(0.08830246 * r + 0.28171884 * g + 0.63000870 * b);

  const L  =  0.21045426 * l_ + 0.79361779 * m_ - 0.00407205 * s_;
  const a  =  1.97799849 * l_ - 2.42859220 * m_ + 0.45059372 * s_;
  const bv =  0.02590403 * l_ + 0.78277177 * m_ - 0.80867577 * s_;

  const C = Math.sqrt(a * a + bv * bv);
  const H = (Math.atan2(bv, a) * 180) / Math.PI;
  return [L, C, H < 0 ? H + 360 : H];
}

function oklchToHex(L: number, C: number, H: number): string {
  const h  = (H * Math.PI) / 180;
  const a  = C * Math.cos(h);
  const bv = C * Math.sin(h);

  const l_ = L + 0.39633778 * a + 0.21580376 * bv;
  const m_ = L - 0.10556134 * a - 0.06385417 * bv;
  const s_ = L - 0.08948418 * a - 1.29148555 * bv;

  const lc = l_ ** 3, mc = m_ ** 3, sc = s_ ** 3;
  const rl =  4.07674166 * lc - 3.30771159 * mc + 0.23096993 * sc;
  const gl = -1.26843801 * lc + 2.60975740 * mc - 0.34131938 * sc;
  const bl = -0.00419609 * lc - 0.70341862 * mc + 1.70760470 * sc;

  const clamp = (x: number) => Math.max(0, Math.min(1, x));
  const toHex = (x: number) =>
    Math.round(clamp(delinearize(x)) * 255).toString(16).padStart(2, "0");
  return `#${toHex(rl)}${toHex(gl)}${toHex(bl)}`;
}

const SHADE_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

// Lightness targets for each shade (0 = black, 1 = white)
const L_TARGETS: Record<number, number> = {
  50: 0.97, 100: 0.94, 200: 0.88, 300: 0.79, 400: 0.68,
  500: 0.56, 600: 0.47, 700: 0.39, 800: 0.30, 900: 0.22, 950: 0.16,
};

function generatePalette(baseHex: string): Record<number, { hex: string; oklch: [number, number, number] }> {
  const [, C, H] = hexToOklch(baseHex);
  const result: Record<number, { hex: string; oklch: [number, number, number] }> = {};

  for (const shade of SHADE_STEPS) {
    const L   = L_TARGETS[shade];
    // Reduce chroma for very light/dark shades
    const cScale = shade <= 100 || shade >= 900 ? 0.4 : shade <= 200 || shade >= 800 ? 0.7 : 1;
    const Cs  = C * cScale;
    const hex = oklchToHex(L, Cs, H);
    result[shade] = { hex, oklch: [L, Cs, H] };
  }
  return result;
}

function buildThemeBlock(name: string, palette: ReturnType<typeof generatePalette>): string {
  const lines = [`@theme {`];
  for (const shade of SHADE_STEPS) {
    const { oklch: [L, C, H] } = palette[shade];
    lines.push(
      `  --color-${name}-${shade}: oklch(${(L * 100).toFixed(1)}% ${C.toFixed(4)} ${H.toFixed(1)});`
    );
  }
  lines.push(`}`);
  return lines.join("\n");
}

function contrastText(hex: string): "white" | "black" {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.55 ? "black" : "white";
}

const PRESET_COLORS = [
  { label: "Indigo",  hex: "#6366f1" },
  { label: "Rose",    hex: "#f43f5e" },
  { label: "Emerald", hex: "#10b981" },
  { label: "Amber",   hex: "#f59e0b" },
  { label: "Sky",     hex: "#0ea5e9" },
  { label: "Violet",  hex: "#8b5cf6" },
];

export default function TailwindThemePage() {
  const [baseColor, setBase] = useState("#818cf8");
  const [paletteName, setName] = useState("primary");
  const { copied, copy } = useClipboard();

  const palette = useMemo(() => generatePalette(baseColor), [baseColor]);
  const themeBlock = useMemo(() => buildThemeBlock(paletteName, palette), [paletteName, palette]);

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="Tailwind v4 테마 생성기"
      description="베이스 컬러를 입력하면 oklch 색공간 기반 11단계 팔레트를 생성하고 Tailwind v4 @theme 코드를 출력합니다."
      icon={Paintbrush}
    >
      <div className="flex flex-col gap-6">

        {/* ── 입력 ── */}
        <div className="rounded-xl border border-border bg-bg-secondary">
          <div className="border-b border-border px-4 py-3">
            <p className="text-xs font-semibold text-text-primary">색상 설정</p>
          </div>
          <div className="flex flex-col gap-4 p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-xs text-text-secondary">베이스 컬러</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={baseColor}
                    onChange={(e) => setBase(e.target.value)}
                    className="h-12 w-20 cursor-pointer rounded-xl border border-border bg-transparent"
                  />
                  <div>
                    <p className="font-mono text-sm font-bold text-text-primary">{baseColor.toUpperCase()}</p>
                    <p className="text-xs text-text-secondary">
                      oklch({hexToOklch(baseColor).map((v, i) => i === 0 ? `${(v*100).toFixed(1)}%` : v.toFixed(3)).join(" ")})
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs text-text-secondary">팔레트 이름 (CSS 변수)</label>
                <input
                  type="text"
                  value={paletteName}
                  onChange={(e) => setName(e.target.value.replace(/[^a-z0-9-]/g, ""))}
                  className="rounded-xl border border-border bg-background px-4 py-2.5 font-mono text-sm text-text-primary focus:border-brand focus:outline-none"
                  placeholder="primary"
                />
                <p className="text-xs text-text-secondary">
                  → <code className="text-brand">--color-{paletteName}-500</code>
                </p>
              </div>
            </div>

            {/* 프리셋 */}
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map(({ label, hex }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setBase(hex)}
                  className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
                >
                  <span className="inline-block size-3 rounded-full" style={{ background: hex }} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── 팔레트 스와치 ── */}
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="border-b border-border bg-bg-secondary px-4 py-3 text-xs font-semibold text-text-primary">
            생성된 팔레트
          </div>
          <div className="flex">
            {SHADE_STEPS.map((shade) => {
              const { hex } = palette[shade];
              const tc = contrastText(hex);
              return (
                <div
                  key={shade}
                  className="group relative flex-1 cursor-pointer py-8 transition-transform hover:scale-y-110 hover:z-10"
                  style={{ backgroundColor: hex }}
                  onClick={() => copy(hex, `swatch-${shade}`)}
                  title={`${shade}: ${hex}`}
                >
                  <div className={`absolute inset-x-0 bottom-2 flex flex-col items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity`}>
                    <span className="font-mono text-[10px] font-bold" style={{ color: tc === "white" ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.7)" }}>
                      {shade}
                    </span>
                    {copied === `swatch-${shade}` && (
                      <Check size={10} style={{ color: tc === "white" ? "white" : "black" }} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {/* shade 레이블 */}
          <div className="flex border-t border-border bg-bg-secondary">
            {SHADE_STEPS.map((shade) => (
              <div key={shade} className="flex-1 py-1.5 text-center text-[10px] text-text-secondary">
                {shade}
              </div>
            ))}
          </div>
        </div>

        {/* ── CSS 출력 ── */}
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="flex items-center justify-between border-b border-border bg-bg-secondary px-4 py-2.5">
            <span className="text-xs font-semibold text-text-primary">Tailwind v4 @theme 코드</span>
            <button type="button" onClick={() => copy(themeBlock, "theme")}
              className="flex items-center gap-1.5 text-xs text-text-secondary transition-colors hover:text-brand">
              {copied === "theme" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              전체 복사
            </button>
          </div>
          <pre className="overflow-x-auto p-4 text-xs leading-loose text-text-secondary">
            <code>{themeBlock}</code>
          </pre>
        </div>

        {/* 각 shade 복사 */}
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="border-b border-border bg-bg-secondary px-4 py-3 text-xs font-semibold text-text-primary">
            개별 값 복사
          </div>
          <div className="divide-y divide-border">
            {SHADE_STEPS.map((shade) => {
              const { hex, oklch: [L, C, H] } = palette[shade];
              const oklchStr = `oklch(${(L * 100).toFixed(1)}% ${C.toFixed(4)} ${H.toFixed(1)})`;
              return (
                <div key={shade} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="size-5 shrink-0 rounded" style={{ backgroundColor: hex }} />
                  <span className="w-12 shrink-0 text-xs font-semibold text-text-secondary">{shade}</span>
                  <span className="flex-1 font-mono text-xs text-text-primary">{oklchStr}</span>
                  <button type="button" onClick={() => copy(oklchStr, `oklch-${shade}`)}
                    className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:border-brand/50 hover:text-brand">
                    {copied === `oklch-${shade}` ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
}