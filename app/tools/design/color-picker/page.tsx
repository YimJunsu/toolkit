"use client";

import { useState, useCallback } from "react";
import { Pipette, Copy, Check } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import {
  hexToRgb, rgbToHex, rgbToHsl, isValidHex,
} from "@/lib/utils/colorUtils";

const DEFAULT_HEX = "#818cf8";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Design", href: "/tools/design" },
];

export default function ColorPickerPage() {
  const [hex, setHex]             = useState(DEFAULT_HEX);
  const [inputHex, setInputHex]   = useState(DEFAULT_HEX);
  const [copied, setCopied]       = useState<string | null>(null);
  const [history, setHistory]     = useState<string[]>([DEFAULT_HEX]);

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
    const clamped = Math.max(0, Math.min(255, value));
    const newHex = rgbToHex({ ...rgb, [channel]: clamped }.r, { ...rgb, [channel]: clamped }.g, { ...rgb, [channel]: clamped }.b);
    // rebuild properly
    const next = { ...rgb, [channel]: clamped };
    applyColor(rgbToHex(next.r, next.g, next.b));
  };

  const handleCopy = useCallback(async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1800);
  }, []);

  const colorRows = [
    { label: "HEX",  value: hex,                                      key: "hex" },
    { label: "RGB",  value: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,      key: "rgb" },
    { label: "HSL",  value: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,   key: "hsl" },
  ];

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="Color Picker"
      description="HEX ↔ RGB ↔ HSL 변환 및 색상 시각화, 클립보드 복사"
      icon={Pipette}
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">

        {/* 왼쪽: 컬러 피커 */}
        <div className="flex flex-col gap-5">
          {/* 색상 미리보기 + 네이티브 피커 */}
          <div
            className="relative h-44 w-full cursor-pointer overflow-hidden rounded-xl border border-border"
            style={{ backgroundColor: hex }}
          >
            <input
              type="color"
              value={hex}
              onChange={(e) => applyColor(e.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              aria-label="색상 선택"
            />
            <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-black/40 px-3 py-1.5 text-xs text-white backdrop-blur-sm">
              <Pipette size={12} aria-hidden="true" />
              클릭하여 색상 선택
            </div>
          </div>

          {/* HEX 입력 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-text-secondary">HEX</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputHex}
                onChange={(e) => handleHexInput(e.target.value)}
                maxLength={7}
                placeholder="#000000"
                className="flex-1 rounded-lg border border-border bg-bg-primary px-3 py-2 font-mono text-sm text-text-primary focus:border-brand focus:outline-none"
              />
              <CopyButton value={hex} id="hex-btn" copied={copied} onCopy={handleCopy} />
            </div>
          </div>

          {/* RGB 슬라이더 */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium text-text-secondary">RGB</p>
            {(["r", "g", "b"] as const).map((ch) => (
              <div key={ch} className="flex items-center gap-3">
                <span className="w-4 shrink-0 text-xs font-bold uppercase text-text-secondary">{ch}</span>
                <input
                  type="range" min={0} max={255} value={rgb[ch]}
                  onChange={(e) => handleRgbChange(ch, parseInt(e.target.value))}
                  className="flex-1 accent-brand"
                  aria-label={`${ch.toUpperCase()} 값`}
                />
                <input
                  type="number" min={0} max={255} value={rgb[ch]}
                  onChange={(e) => handleRgbChange(ch, parseInt(e.target.value) || 0)}
                  className="w-14 rounded-md border border-border bg-bg-primary px-2 py-1 text-center font-mono text-xs text-text-primary focus:border-brand focus:outline-none"
                />
              </div>
            ))}
          </div>

          {/* 히스토리 */}
          {history.length > 1 && (
            <div>
              <p className="mb-2 text-xs font-medium text-text-secondary">최근 사용</p>
              <div className="flex flex-wrap gap-2">
                {history.map((c) => (
                  <button
                    key={c} type="button"
                    onClick={() => applyColor(c)}
                    className="size-7 rounded-md border border-border transition-transform hover:scale-110"
                    style={{ backgroundColor: c }}
                    aria-label={`${c} 선택`}
                    title={c}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 오른쪽: 색상 코드 표 */}
        <div className="flex flex-col gap-4">
          <div className="overflow-hidden rounded-xl border border-border">
            <p className="border-b border-border bg-bg-secondary px-4 py-3 text-xs font-semibold text-text-primary">
              색상 코드
            </p>
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

          {/* 채널 상세 */}
          <div className="overflow-hidden rounded-xl border border-border">
            <p className="border-b border-border bg-bg-secondary px-4 py-3 text-xs font-semibold text-text-primary">
              채널 상세
            </p>
            <div className="grid grid-cols-3 divide-x divide-border">
              {[
                { label: "R", value: rgb.r },
                { label: "G", value: rgb.g },
                { label: "B", value: rgb.b },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col items-center py-4">
                  <span className="text-xs font-semibold text-text-secondary">{label}</span>
                  <span className="mt-1 font-mono text-lg font-bold text-text-primary">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* HSL 상세 */}
          <div className="overflow-hidden rounded-xl border border-border">
            <p className="border-b border-border bg-bg-secondary px-4 py-3 text-xs font-semibold text-text-primary">
              HSL 상세
            </p>
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
  const isCopied = copied === id;
  return (
    <button
      type="button"
      onClick={() => onCopy(value, id)}
      className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
      aria-label="복사"
    >
      {isCopied
        ? <Check size={14} className="text-emerald-400" />
        : <Copy size={14} />}
    </button>
  );
}