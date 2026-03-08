"use client";

import { useState, useCallback } from "react";
import { Palette, Copy, Check } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import {
  isValidHex, generatePalette, getContrastColor,
} from "@/lib/utils/colorUtils";
import type { PaletteType, PaletteColor } from "@/lib/utils/colorUtils";

const DEFAULT_HEX = "#818cf8";

const PALETTE_TYPES: { id: PaletteType; label: string; desc: string }[] = [
  { id: "monochromatic",       label: "단색조",     desc: "같은 색상, 다른 명도" },
  { id: "complementary",       label: "보색",       desc: "색상환 반대편 색상" },
  { id: "analogous",           label: "유사색",     desc: "인접한 색상 조합" },
  { id: "triadic",             label: "삼색조",     desc: "120° 간격의 세 색상" },
  { id: "split-complementary", label: "분리보색",   desc: "보색의 인접 색상 활용" },
];

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Design", href: "/tools/design" },
];

export default function ColorPalettePage() {
  const [baseHex, setBaseHex]           = useState(DEFAULT_HEX);
  const [inputHex, setInputHex]         = useState(DEFAULT_HEX);
  const [activeType, setActiveType]     = useState<PaletteType>("monochromatic");
  const [copied, setCopied]             = useState<string | null>(null);

  const palette = generatePalette(isValidHex(baseHex) ? baseHex : DEFAULT_HEX, activeType);

  const handleHexInput = (value: string) => {
    const normalized = value.startsWith("#") ? value : `#${value}`;
    setInputHex(normalized);
    if (isValidHex(normalized)) setBaseHex(normalized);
  };

  const handleCopy = useCallback(async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1800);
  }, []);

  const handleCopyAllCss = () => {
    const css = palette
      .map((c, i) => `  --color-${i + 1}: ${c.hex};`)
      .join("\n");
    handleCopy(`:root {\n${css}\n}`, "all-css");
  };

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="Color Palette Generator"
      description="입력 색상 기반 보색·유사색·삼색 팔레트 자동 생성"
      icon={Palette}
    >
      <div className="flex flex-col gap-8">
        {/* 기본 색상 입력 */}
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-secondary">기본 색상 (HEX)</label>
            <div className="flex gap-2">
              <div
                className="size-10 shrink-0 rounded-lg border border-border"
                style={{ backgroundColor: baseHex }}
              />
              <input
                type="color"
                value={baseHex}
                onChange={(e) => { setBaseHex(e.target.value); setInputHex(e.target.value); }}
                className="sr-only"
                id="palette-color-input"
              />
              <input
                type="text"
                value={inputHex}
                onChange={(e) => handleHexInput(e.target.value)}
                maxLength={7}
                placeholder="#000000"
                className="w-32 rounded-lg border border-border bg-bg-primary px-3 py-2 font-mono text-sm text-text-primary focus:border-brand focus:outline-none"
              />
              <label
                htmlFor="palette-color-input"
                className="flex h-10 cursor-pointer items-center rounded-lg border border-border bg-bg-secondary px-3 text-xs text-text-secondary transition-colors hover:text-text-primary"
              >
                피커 열기
              </label>
            </div>
          </div>
        </div>

        {/* 팔레트 유형 탭 */}
        <div className="flex flex-wrap gap-2">
          {PALETTE_TYPES.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setActiveType(type.id)}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                activeType === type.id
                  ? "bg-brand text-white"
                  : "border border-border text-text-secondary hover:border-brand/50 hover:text-text-primary"
              }`}
            >
              {type.label}
              <span className="ml-1.5 opacity-60">{type.desc}</span>
            </button>
          ))}
        </div>

        {/* 팔레트 스와치 */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-text-primary">
              {PALETTE_TYPES.find((t) => t.id === activeType)?.label} 팔레트
            </p>
            <button
              type="button"
              onClick={handleCopyAllCss}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-text-primary"
            >
              {copied === "all-css"
                ? <Check size={13} className="text-emerald-400" />
                : <Copy size={13} />}
              CSS 변수 전체 복사
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {palette.map((color, index) => (
              <PaletteSwatchCard
                key={index}
                color={color}
                copied={copied}
                onCopy={handleCopy}
              />
            ))}
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
}

/* ── 팔레트 스와치 카드 ── */

interface PaletteSwatchCardProps {
  color: PaletteColor;
  copied: string | null;
  onCopy: (text: string, key: string) => void;
}

function PaletteSwatchCard({ color, copied, onCopy }: PaletteSwatchCardProps) {
  const textColor = getContrastColor(color.hex);
  const copyKey = `swatch-${color.hex}`;

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      {/* 색상 블록 */}
      <button
        type="button"
        onClick={() => onCopy(color.hex, copyKey)}
        className="group relative flex h-24 w-full items-center justify-center transition-opacity hover:opacity-90"
        style={{ backgroundColor: color.hex }}
        aria-label={`${color.hex} 복사`}
      >
        <span
          className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100"
          style={{ color: textColor }}
        >
          {copied === copyKey
            ? <Check size={20} />
            : <Copy size={20} />}
        </span>
      </button>

      {/* 색상 정보 */}
      <div className="bg-bg-secondary p-2.5">
        <p className="font-mono text-xs font-semibold text-text-primary">{color.hex.toUpperCase()}</p>
        <p className="text-xs text-text-secondary">{color.label}</p>
      </div>
    </div>
  );
}