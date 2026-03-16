"use client";

import { useState, useCallback } from "react";
import { Layers, Plus, Trash2, Copy, Check } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { useClipboard } from "@/hooks/useClipboard";

interface ColorStop {
  id: string;
  color: string;
  position: number;
}

type GradientType = "linear" | "radial" | "conic";

const DEFAULT_STOPS: ColorStop[] = [
  { id: "1", color: "#818cf8", position: 0 },
  { id: "2", color: "#a855f7", position: 100 },
];

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Design", href: "/tools/design" },
];

let stopIdCounter = 3;

function buildGradientCss(
  stops: ColorStop[],
  type: GradientType,
  angle: number,
): string {
  const sorted = [...stops].sort((a, b) => a.position - b.position);
  const colorStops = sorted.map((s) => `${s.color} ${s.position}%`).join(", ");

  switch (type) {
    case "linear": return `linear-gradient(${angle}deg, ${colorStops})`;
    case "radial":  return `radial-gradient(circle, ${colorStops})`;
    case "conic":   return `conic-gradient(from ${angle}deg, ${colorStops})`;
  }
}

export default function GradientGeneratorPage() {
  const [stops, setStops]         = useState<ColorStop[]>(DEFAULT_STOPS);
  const [type, setType]           = useState<GradientType>("linear");
  const [angle, setAngle]         = useState(135);
  const { copied, copy } = useClipboard();

  const gradientValue = buildGradientCss(stops, type, angle);
  const cssCode = `background: ${gradientValue};`;

  const handleAddStop = () => {
    const midPos = stops.length > 1
      ? Math.round((stops[stops.length - 2].position + stops[stops.length - 1].position) / 2)
      : 50;
    setStops((prev) => [
      ...prev,
      { id: String(stopIdCounter++), color: "#c084fc", position: midPos },
    ]);
  };

  const handleRemoveStop = (id: string) => {
    if (stops.length <= 2) return;
    setStops((prev) => prev.filter((s) => s.id !== id));
  };

  const handleStopChange = useCallback(
    (id: string, field: keyof Omit<ColorStop, "id">, value: string | number) => {
      setStops((prev) =>
        prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
      );
    },
    []
  );

  const handleCopy = () => {
    copy(cssCode, "default");
  };

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="Gradient / CSS Generator"
      description="색상 스탑을 추가하고 그라데이션 CSS 코드를 즉시 생성"
      icon={Layers}
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">

        {/* 왼쪽: 설정 패널 */}
        <div className="flex flex-col gap-6">

          {/* 그라데이션 타입 */}
          <div>
            <p className="mb-2 text-xs font-medium text-text-secondary">타입</p>
            <div className="flex gap-2">
              {(["linear", "radial", "conic"] as GradientType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 rounded-lg py-2 text-xs font-medium capitalize transition-colors ${
                    type === t
                      ? "bg-brand text-white"
                      : "border border-border text-text-secondary hover:border-brand/50 hover:text-text-primary"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* 각도 (linear / conic) */}
          {(type === "linear" || type === "conic") && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium text-text-secondary">각도</p>
                <span className="font-mono text-sm text-text-primary">{angle}°</span>
              </div>
              <input
                type="range" min={0} max={360} value={angle}
                onChange={(e) => setAngle(parseInt(e.target.value))}
                className="w-full accent-brand"
              />
            </div>
          )}

          {/* 색상 스탑 */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-medium text-text-secondary">색상 스탑</p>
              <button
                type="button"
                onClick={handleAddStop}
                className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-text-primary"
              >
                <Plus size={13} aria-hidden="true" />
                추가
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {stops.map((stop) => (
                <div key={stop.id} className="flex items-center gap-3 rounded-lg border border-border bg-bg-secondary p-3">
                  <input
                    type="color"
                    value={stop.color}
                    onChange={(e) => handleStopChange(stop.id, "color", e.target.value)}
                    className="size-8 shrink-0 cursor-pointer rounded-md border-0 bg-transparent p-0"
                    aria-label="색상"
                  />
                  <input
                    type="text"
                    value={stop.color}
                    onChange={(e) => handleStopChange(stop.id, "color", e.target.value)}
                    maxLength={7}
                    className="w-24 rounded-md border border-border bg-bg-primary px-2 py-1 font-mono text-xs text-text-primary focus:border-brand focus:outline-none"
                  />
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      type="range" min={0} max={100} value={stop.position}
                      onChange={(e) => handleStopChange(stop.id, "position", parseInt(e.target.value))}
                      className="flex-1 accent-brand"
                    />
                    <span className="w-10 text-right font-mono text-xs text-text-secondary">{stop.position}%</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveStop(stop.id)}
                    disabled={stops.length <= 2}
                    className="text-text-secondary transition-colors hover:text-red-400 disabled:opacity-30"
                    aria-label="스탑 삭제"
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 오른쪽: 미리보기 + 코드 */}
        <div className="flex flex-col gap-6">
          {/* 미리보기 */}
          <div>
            <p className="mb-2 text-xs font-medium text-text-secondary">미리보기</p>
            <div
              className="h-48 w-full rounded-xl border border-border"
              style={{ background: gradientValue }}
              aria-label="그라데이션 미리보기"
            />
          </div>

          {/* CSS 코드 */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium text-text-secondary">CSS 코드</p>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-text-primary"
              >
                {copied === "default"
                  ? <Check size={13} className="text-emerald-400" />
                  : <Copy size={13} />}
                {copied === "default" ? "복사됨" : "복사"}
              </button>
            </div>
            <pre className="overflow-x-auto rounded-xl border border-border bg-bg-secondary p-4 font-mono text-sm text-text-primary">
              <code>{cssCode}</code>
            </pre>
          </div>

          {/* 추가 CSS 형식 */}
          <div className="rounded-xl border border-border bg-bg-secondary p-4">
            <p className="mb-3 text-xs font-semibold text-text-secondary">전체 속성</p>
            <pre className="font-mono text-xs text-text-primary">
              <code>{`.element {\n  ${cssCode}\n}`}</code>
            </pre>
          </div>
        </div>

      </div>
    </ToolPageLayout>
  );
}