"use client";

import { useState, useCallback, useMemo } from "react";
import { Pipette, Copy, Check, Eye, Palette } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { useClipboard } from "@/hooks/useClipboard";
import {
  hexToRgb, rgbToHex, rgbToHsl, isValidHex,
} from "@/lib/utils/colorUtils";

const DEFAULT_HEX = "#818cf8";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Design", href: "/tools/design" },
];

/* ──────────────────────────────────────────────
   색맹 시뮬레이션 (Viénot 1999 근사 행렬)
   ────────────────────────────────────────────── */
type ColorBlindType = "protanopia" | "deuteranopia" | "tritanopia" | "achromatopsia";

function simulateColorBlindness(r: number, g: number, b: number, type: ColorBlindType): [number, number, number] {
  const clamp = (v: number) => Math.round(Math.max(0, Math.min(255, v)));
  switch (type) {
    case "protanopia":
      return [
        clamp(0.567 * r + 0.433 * g),
        clamp(0.558 * r + 0.442 * g),
        clamp(0.242 * g + 0.758 * b),
      ];
    case "deuteranopia":
      return [
        clamp(0.625 * r + 0.375 * g),
        clamp(0.700 * r + 0.300 * g),
        clamp(0.300 * g + 0.700 * b),
      ];
    case "tritanopia":
      return [
        clamp(0.950 * r + 0.050 * g),
        clamp(0.433 * g + 0.567 * b),
        clamp(0.475 * g + 0.525 * b),
      ];
    case "achromatopsia": {
      const gray = clamp(0.299 * r + 0.587 * g + 0.114 * b);
      return [gray, gray, gray];
    }
  }
}

const CB_TYPES: { type: ColorBlindType; label: string; desc: string }[] = [
  { type: "protanopia",    label: "적색맹",      desc: "L-cone 결핍 (적색 감지 어려움)" },
  { type: "deuteranopia",  label: "녹색맹",      desc: "M-cone 결핍 (녹색 감지 어려움)" },
  { type: "tritanopia",    label: "청황색맹",    desc: "S-cone 결핍 (청색 감지 어려움)" },
  { type: "achromatopsia", label: "전색맹",      desc: "색상 전혀 인식 불가 (명도만)" },
];

/* ──────────────────────────────────────────────
   OKLCH 색상 팔레트 생성 (Tailwind v4 스타일)
   ────────────────────────────────────────────── */

/** sRGB 0-255 → linear 0-1 */
function linearize(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

/** linear sRGB → OKLab */
function rgbToOklab(r: number, g: number, b: number): [number, number, number] {
  const lr = linearize(r), lg = linearize(g), lb = linearize(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
  ];
}

/** OKLab → OKLCH */
function oklabToOklch(L: number, a: number, b: number): [number, number, number] {
  const C = Math.sqrt(a * a + b * b);
  const H = ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360;
  return [L, C, H];
}

const TAILWIND_SHADE_PARAMS: { shade: number; L: number; C_factor: number }[] = [
  { shade: 50,  L: 0.975, C_factor: 0.10 },
  { shade: 100, L: 0.950, C_factor: 0.15 },
  { shade: 200, L: 0.880, C_factor: 0.25 },
  { shade: 300, L: 0.790, C_factor: 0.45 },
  { shade: 400, L: 0.680, C_factor: 0.70 },
  { shade: 500, L: 0.560, C_factor: 0.90 },
  { shade: 600, L: 0.460, C_factor: 0.85 },
  { shade: 700, L: 0.370, C_factor: 0.75 },
  { shade: 800, L: 0.280, C_factor: 0.55 },
  { shade: 900, L: 0.200, C_factor: 0.35 },
  { shade: 950, L: 0.145, C_factor: 0.20 },
];

function generateTailwindPalette(hex: string) {
  const rgb = hexToRgb(hex);
  if (!rgb) return [];
  const [, aC, aH] = oklabToOklch(...rgbToOklab(rgb.r, rgb.g, rgb.b));
  const baseC = Math.max(aC, 0.01);

  return TAILWIND_SHADE_PARAMS.map(({ shade, L, C_factor }) => {
    const C = +(baseC * C_factor).toFixed(4);
    const H = +aH.toFixed(1);
    return { shade, L: +L.toFixed(3), C, H, css: `oklch(${(L * 100).toFixed(1)}% ${C} ${H})` };
  });
}

export default function ColorPickerPage() {
  const [hex, setHex]             = useState(DEFAULT_HEX);
  const [inputHex, setInputHex]   = useState(DEFAULT_HEX);
  const { copied, copy } = useClipboard();
  const [history, setHistory]     = useState<string[]>([DEFAULT_HEX]);
  const [activeTab, setActiveTab] = useState<"picker" | "colorblind" | "tailwind">("picker");

  const rgb = hexToRgb(hex) ?? { r: 129, g: 140, b: 248 };
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  const applyColor = useCallback((newHex: string) => {
    setHex(newHex);
    setInputHex(newHex);
    setHistory((prev) => [newHex, ...prev.filter((c) => c !== newHex)].slice(0, 10));
  }, []);

  const handleHexInput = (value: string) => {
    const normalized = value.startsWith("#") ? value : `#${value}`;
    setInputHex(normalized);
    if (isValidHex(normalized)) applyColor(normalized);
  };

  const handleRgbChange = (channel: "r" | "g" | "b", value: number) => {
    const next = { ...rgb, [channel]: Math.max(0, Math.min(255, value)) };
    applyColor(rgbToHex(next.r, next.g, next.b));
  };

  const handleCopy = useCallback((text: string, key: string) => copy(text, key), [copy]);

  const colorRows = [
    { label: "HEX",  value: hex,                                      key: "hex" },
    { label: "RGB",  value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,      key: "rgb" },
    { label: "HSL",  value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,   key: "hsl" },
  ];

  /* 팔레트 */
  const palette = useMemo(() => generateTailwindPalette(hex), [hex]);

  /* 색맹 시뮬레이션 */
  const cbResults = useMemo(() =>
    CB_TYPES.map(({ type, label, desc }) => {
      const [cr, cg, cb] = simulateColorBlindness(rgb.r, rgb.g, rgb.b, type);
      return { type, label, desc, hex: rgbToHex(cr, cg, cb) };
    }),
    [rgb]
  );

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="Color Picker"
      description="HEX ↔ RGB ↔ HSL 변환, 색맹 시뮬레이션, Tailwind v4 OKLCH 팔레트 생성"
      icon={Pipette}
    >
      <div className="flex flex-col gap-6">
        {/* 탭 */}
        <div className="flex gap-1 rounded-xl border border-border bg-bg-secondary p-1">
          {([
            { key: "picker",     label: "색상 선택",   icon: Pipette },
            { key: "colorblind", label: "색맹 시뮬",   icon: Eye },
            { key: "tailwind",   label: "Tailwind 팔레트", icon: Palette },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button key={key} type="button" onClick={() => setActiveTab(key)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-colors ${
                activeTab === key
                  ? "bg-bg-primary text-text-primary shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        {/* ── 색상 선택 탭 ── */}
        {activeTab === "picker" && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* 왼쪽: 컬러 피커 */}
            <div className="flex flex-col gap-5">
              <div className="relative h-44 w-full cursor-pointer overflow-hidden rounded-xl border border-border"
                style={{ backgroundColor: hex }}>
                <input type="color" value={hex} onChange={(e) => applyColor(e.target.value)}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  aria-label="색상 선택" />
                <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-black/40 px-3 py-1.5 text-xs text-white backdrop-blur-sm">
                  <Pipette size={12} aria-hidden="true" />
                  클릭하여 색상 선택
                </div>
              </div>

              {/* HEX 입력 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-secondary">HEX</label>
                <div className="flex gap-2">
                  <input type="text" value={inputHex} onChange={(e) => handleHexInput(e.target.value)}
                    maxLength={7} placeholder="#000000"
                    className="flex-1 rounded-lg border border-border bg-bg-primary px-3 py-2 font-mono text-sm text-text-primary focus:border-brand focus:outline-none" />
                  <CopyButton value={hex} id="hex-btn" copied={copied} onCopy={handleCopy} />
                </div>
              </div>

              {/* RGB 슬라이더 */}
              <div className="flex flex-col gap-3">
                <p className="text-xs font-medium text-text-secondary">RGB</p>
                {(["r", "g", "b"] as const).map((ch) => (
                  <div key={ch} className="flex items-center gap-3">
                    <span className="w-4 shrink-0 text-xs font-bold uppercase text-text-secondary">{ch}</span>
                    <input type="range" min={0} max={255} value={rgb[ch]}
                      onChange={(e) => handleRgbChange(ch, parseInt(e.target.value))}
                      className="flex-1 accent-brand" />
                    <input type="number" min={0} max={255} value={rgb[ch]}
                      onChange={(e) => handleRgbChange(ch, parseInt(e.target.value) || 0)}
                      className="w-14 rounded-md border border-border bg-bg-primary px-2 py-1 text-center font-mono text-xs text-text-primary focus:border-brand focus:outline-none" />
                  </div>
                ))}
              </div>

              {/* 히스토리 */}
              {history.length > 1 && (
                <div>
                  <p className="mb-2 text-xs font-medium text-text-secondary">최근 사용</p>
                  <div className="flex flex-wrap gap-2">
                    {history.map((c) => (
                      <button key={c} type="button" onClick={() => applyColor(c)}
                        className="size-7 rounded-md border border-border transition-transform hover:scale-110"
                        style={{ backgroundColor: c }} title={c} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 오른쪽: 색상 코드 표 */}
            <div className="flex flex-col gap-4">
              <div className="overflow-hidden rounded-xl border border-border">
                <p className="border-b border-border bg-bg-secondary px-4 py-3 text-xs font-semibold text-text-primary">색상 코드</p>
                <div className="divide-y divide-border">
                  {colorRows.map(({ label, value, key }) => (
                    <div key={key} className="flex items-center gap-3 px-4 py-3">
                      <span className="w-10 shrink-0 text-xs font-semibold text-text-secondary">{label}</span>
                      <span className="flex-1 font-mono text-sm text-text-primary">{value}</span>
                      <CopyButton value={value} id={key} copied={copied} onCopy={handleCopy} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-border">
                <p className="border-b border-border bg-bg-secondary px-4 py-3 text-xs font-semibold text-text-primary">채널 상세</p>
                <div className="grid grid-cols-3 divide-x divide-border">
                  {(["R", "G", "B"] as const).map((ch) => (
                    <div key={ch} className="flex flex-col items-center py-4">
                      <span className="text-xs font-semibold text-text-secondary">{ch}</span>
                      <span className="mt-1 font-mono text-lg font-bold text-text-primary">
                        {rgb[ch.toLowerCase() as "r" | "g" | "b"]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-border">
                <p className="border-b border-border bg-bg-secondary px-4 py-3 text-xs font-semibold text-text-primary">HSL 상세</p>
                <div className="grid grid-cols-3 divide-x divide-border">
                  {[
                    { label: "H (색조)", value: `${hsl.h}°` },
                    { label: "S (채도)", value: `${hsl.s}%` },
                    { label: "L (명도)", value: `${hsl.l}%` },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex flex-col items-center py-4">
                      <span className="text-center text-xs font-semibold text-text-secondary">{label}</span>
                      <span className="mt-1 font-mono text-lg font-bold text-text-primary">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 색맹 시뮬레이션 탭 ── */}
        {activeTab === "colorblind" && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 shrink-0 rounded-xl border border-border" style={{ backgroundColor: hex }} />
              <div>
                <p className="text-sm font-semibold text-text-primary">원본 색상: {hex}</p>
                <p className="mt-0.5 text-xs text-text-secondary">
                  각 색각 이상 유형에서 이 색상이 어떻게 보이는지 시뮬레이션합니다.
                </p>
              </div>
              {/* 미니 피커 */}
              <label className="ml-auto cursor-pointer relative">
                <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-bg-secondary hover:border-brand/50 transition-colors">
                  <Pipette size={15} className="text-brand" />
                </div>
                <input type="color" value={hex} onChange={(e) => applyColor(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer" />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* 원본 */}
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="h-24" style={{ backgroundColor: hex }} />
                <div className="px-4 py-3">
                  <p className="text-xs font-semibold text-text-primary">원본</p>
                  <p className="text-xs text-text-secondary">정상 색각</p>
                  <p className="mt-1 font-mono text-xs text-text-secondary">{hex}</p>
                </div>
              </div>

              {/* 색맹 시뮬 */}
              {cbResults.map(({ type, label, desc, hex: simHex }) => (
                <div key={type} className="rounded-xl border border-border overflow-hidden">
                  <div className="h-24" style={{ backgroundColor: simHex }} />
                  <div className="flex items-start justify-between px-4 py-3">
                    <div>
                      <p className="text-xs font-semibold text-text-primary">{label}</p>
                      <p className="text-xs text-text-secondary">{desc}</p>
                      <p className="mt-1 font-mono text-xs text-text-secondary">{simHex}</p>
                    </div>
                    <CopyButton value={simHex} id={`cb-${type}`} copied={copied} onCopy={handleCopy} />
                  </div>
                </div>
              ))}
            </div>

            {/* WCAG 대비 안내 */}
            <div className="rounded-lg border border-border bg-bg-secondary px-4 py-3 text-xs text-text-secondary">
              <strong className="text-text-primary">접근성 팁</strong> — 색각 이상 사용자를 위해 색상만으로 정보를 전달하지 말고,
              아이콘·텍스트·패턴 등 보조 수단을 함께 사용하세요. WCAG 2.1 기준 AA 등급: 일반 텍스트 4.5:1, 큰 텍스트 3:1 이상.
            </div>
          </div>
        )}

        {/* ── Tailwind 팔레트 탭 ── */}
        {activeTab === "tailwind" && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 shrink-0 rounded-xl border border-border" style={{ backgroundColor: hex }} />
              <div>
                <p className="text-sm font-semibold text-text-primary">베이스 색상: {hex}</p>
                <p className="mt-0.5 text-xs text-text-secondary">
                  OKLCH 색상 공간 기반 Tailwind v4 스타일 11단계 팔레트를 생성합니다.
                </p>
              </div>
              <label className="ml-auto cursor-pointer relative">
                <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-bg-secondary hover:border-brand/50 transition-colors">
                  <Pipette size={15} className="text-brand" />
                </div>
                <input type="color" value={hex} onChange={(e) => applyColor(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer" />
              </label>
            </div>

            {/* 팔레트 바 */}
            <div className="flex h-16 overflow-hidden rounded-xl border border-border">
              {palette.map(({ shade, css }) => (
                <button key={shade} type="button"
                  onClick={() => handleCopy(css, `tw-${shade}`)}
                  title={`${shade}: ${css}`}
                  className="group relative flex-1 transition-all hover:flex-[2]"
                  style={{ backgroundColor: css }}
                >
                  {copied === `tw-${shade}` && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <Check size={14} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* 팔레트 테이블 */}
            <div className="overflow-hidden rounded-xl border border-border">
              <div className="grid grid-cols-[auto_1fr_auto_auto] gap-0">
                <div className="col-span-4 grid grid-cols-[auto_1fr_auto_auto] border-b border-border bg-bg-secondary px-4 py-2.5 text-xs font-semibold text-text-secondary">
                  <span className="w-16">Shade</span>
                  <span>OKLCH CSS</span>
                  <span className="w-20 text-center">미리보기</span>
                  <span className="w-10 text-center">복사</span>
                </div>
                {palette.map(({ shade, L, C, H, css }) => (
                  <div key={shade} className="col-span-4 grid grid-cols-[auto_1fr_auto_auto] items-center border-b border-border px-4 py-2 last:border-b-0 hover:bg-bg-secondary/50 transition-colors">
                    <span className="w-16 font-mono text-xs font-bold text-text-secondary">{shade}</span>
                    <span className="font-mono text-xs text-text-primary break-all">{css}</span>
                    <div className="mx-2 h-7 w-16 rounded-md border border-border/50" style={{ backgroundColor: css }} />
                    <button type="button" onClick={() => handleCopy(css, `tw-${shade}`)}
                      className="flex size-7 items-center justify-center rounded border border-border text-text-secondary transition-colors hover:border-brand/50 hover:text-brand">
                      {copied === `tw-${shade}` ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 전체 CSS 변수 복사 */}
            <button
              type="button"
              onClick={() => {
                const css = palette
                  .map(({ shade, css }) => `  --color-primary-${shade}: ${css};`)
                  .join("\n");
                handleCopy(`:root {\n${css}\n}`, "tw-all");
              }}
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-bg-secondary px-4 py-3 text-xs font-medium text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
            >
              {copied === "tw-all" ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              전체 CSS 변수 복사 (:root &#123; --color-primary-50 ~ 950 &#125;)
            </button>
          </div>
        )}
      </div>
    </ToolPageLayout>
  );
}

/* ── 복사 버튼 ── */
interface CopyButtonProps {
  value: string;
  id: string;
  copied: string | null;
  onCopy: (text: string, key: string) => void;
}

function CopyButton({ value, id, copied, onCopy }: CopyButtonProps) {
  return (
    <button type="button" onClick={() => onCopy(value, id)}
      className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
      aria-label="복사">
      {copied === id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
    </button>
  );
}
