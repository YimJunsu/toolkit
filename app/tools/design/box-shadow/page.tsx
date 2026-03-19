"use client";

import { useState, useCallback, useId } from "react";
import { Square, Plus, Trash2, Copy, Check } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { useClipboard } from "@/hooks/useClipboard";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Design", href: "/tools/design" },
];

interface ShadowLayer {
  id: string;
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
  opacity: number;
  inset: boolean;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return null;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

function shadowToCss(s: ShadowLayer): string {
  const rgb = hexToRgb(s.color);
  const alpha = (s.opacity / 100).toFixed(2);
  const colorStr = rgb
    ? `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`
    : `rgba(0,0,0,${alpha})`;
  return `${s.inset ? "inset " : ""}${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${colorStr}`;
}

function suggestTailwind(layers: ShadowLayer[]): string {
  if (layers.length !== 1) return "shadow (커스텀, Tailwind 기본 클래스와 불일치)";
  const s = layers[0];
  if (s.inset) return "shadow-inner";
  const size = s.blur + Math.abs(s.spread);
  if (size === 0) return "shadow-none";
  if (size <= 4) return "shadow-sm";
  if (size <= 8) return "shadow";
  if (size <= 14) return "shadow-md";
  if (size <= 20) return "shadow-lg";
  if (size <= 30) return "shadow-xl";
  return "shadow-2xl";
}

let counter = 3;

const DEFAULT_LAYERS: ShadowLayer[] = [
  { id: "1", x: 0, y: 4, blur: 16, spread: 0, color: "#000000", opacity: 15, inset: false },
];

export default function BoxShadowPage() {
  const [layers, setLayers] = useState<ShadowLayer[]>(DEFAULT_LAYERS);
  const [active, setActive] = useState("1");
  const { copied, copy } = useClipboard();
  const uid = useId();

  const activeLayer = layers.find((l) => l.id === active) ?? layers[0];

  const updateActive = useCallback((patch: Partial<ShadowLayer>) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === active ? { ...l, ...patch } : l))
    );
  }, [active]);

  const addLayer = () => {
    if (layers.length >= 5) return;
    const id = String(counter++);
    setLayers((prev) => [
      ...prev,
      { id, x: 4, y: 8, blur: 20, spread: 0, color: "#000000", opacity: 20, inset: false },
    ]);
    setActive(id);
  };

  const removeLayer = (id: string) => {
    if (layers.length <= 1) return;
    setLayers((prev) => {
      const next = prev.filter((l) => l.id !== id);
      if (active === id) setActive(next[0].id);
      return next;
    });
  };

  const boxShadowValue = layers.map(shadowToCss).join(",\n  ");
  const cssCode = `box-shadow: ${boxShadowValue};`;
  const twSuggestion = suggestTailwind(layers);

  const SliderField = ({
    label,
    value,
    min,
    max,
    unit,
    onChange,
  }: {
    label: string;
    value: number;
    min: number;
    max: number;
    unit: string;
    onChange: (v: number) => void;
  }) => (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-text-secondary">{label}</label>
        <span className="font-mono text-xs text-brand">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-brand"
      />
    </div>
  );

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="Box Shadow Generator"
      description="슬라이더로 box-shadow를 디자인하고 CSS 코드와 Tailwind 클래스를 즉시 복사합니다."
      icon={Square}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 컨트롤 패널 */}
        <div className="flex flex-col gap-5">
          {/* 레이어 탭 */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-text-secondary">그림자 레이어</label>
              <button
                type="button"
                onClick={addLayer}
                disabled={layers.length >= 5}
                className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-brand disabled:opacity-40"
              >
                <Plus size={12} />
                추가
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {layers.map((l, i) => (
                <div key={l.id} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setActive(l.id)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      active === l.id
                        ? "border-brand bg-brand/10 text-brand"
                        : "border-border text-text-secondary hover:border-brand/40"
                    }`}
                  >
                    레이어 {i + 1}
                  </button>
                  {layers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLayer(l.id)}
                      className="rounded border border-border p-1 text-text-secondary transition-colors hover:border-red-400/50 hover:text-red-400"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {activeLayer && (
            <>
              <SliderField label="X Offset" value={activeLayer.x} min={-50} max={50} unit="px" onChange={(v) => updateActive({ x: v })} />
              <SliderField label="Y Offset" value={activeLayer.y} min={-50} max={50} unit="px" onChange={(v) => updateActive({ y: v })} />
              <SliderField label="Blur Radius" value={activeLayer.blur} min={0} max={100} unit="px" onChange={(v) => updateActive({ blur: v })} />
              <SliderField label="Spread Radius" value={activeLayer.spread} min={-50} max={50} unit="px" onChange={(v) => updateActive({ spread: v })} />
              <SliderField label="Opacity" value={activeLayer.opacity} min={0} max={100} unit="%" onChange={(v) => updateActive({ opacity: v })} />

              {/* 색상 */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-text-secondary">색상</label>
                <div className="flex items-center gap-3">
                  <label htmlFor={`${uid}-color`} className="relative cursor-pointer">
                    <div
                      className="size-10 rounded-lg border-2 border-border"
                      style={{ backgroundColor: activeLayer.color }}
                    />
                    <input
                      id={`${uid}-color`}
                      type="color"
                      value={activeLayer.color}
                      onChange={(e) => updateActive({ color: e.target.value })}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                  </label>
                  <input
                    type="text"
                    value={activeLayer.color}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (/^#[0-9a-fA-F]{0,6}$/.test(v)) updateActive({ color: v });
                    }}
                    maxLength={7}
                    className="w-28 rounded-lg border border-border bg-bg-secondary px-3 py-2 font-mono text-sm text-text-primary focus:border-brand focus:outline-none"
                  />
                </div>
              </div>

              {/* Inset 토글 */}
              <label className="flex cursor-pointer items-center gap-3">
                <div
                  className={`relative h-5 w-9 rounded-full transition-colors ${activeLayer.inset ? "bg-brand" : "bg-border"}`}
                  onClick={() => updateActive({ inset: !activeLayer.inset })}
                >
                  <div
                    className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform ${activeLayer.inset ? "translate-x-4" : "translate-x-0.5"}`}
                  />
                </div>
                <span className="text-sm text-text-primary">Inset (안쪽 그림자)</span>
              </label>
            </>
          )}
        </div>

        {/* 오른쪽: 프리뷰 + 코드 */}
        <div className="flex flex-col gap-5">
          {/* 라이브 프리뷰 */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-text-secondary">라이브 프리뷰</label>
            <div className="flex h-64 items-center justify-center rounded-xl border border-border bg-bg-secondary">
              <div
                className="size-36 rounded-2xl bg-bg-primary transition-all duration-200"
                style={{ boxShadow: layers.map(shadowToCss).join(", ") }}
              />
            </div>
          </div>

          {/* CSS 코드 */}
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
            <pre className="overflow-x-auto rounded-xl border border-border bg-bg-secondary p-4 font-mono text-xs leading-relaxed text-text-primary">
              {cssCode}
            </pre>
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
