"use client";

import { useState, useMemo } from "react";
import { Contrast, Check, X } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Web", href: "/tools/web" },
];

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full = clean.length === 3
    ? clean.split("").map((c) => c + c).join("")
    : clean;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function linearize(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function getLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map(linearize);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function Badge({ label, pass }: { label: string; pass: boolean }) {
  return (
    <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 ${
      pass ? "border-emerald-500/30 bg-emerald-500/10" : "border-red-500/30 bg-red-500/10"
    }`}>
      {pass
        ? <Check size={16} className="shrink-0 text-emerald-400" />
        : <X    size={16} className="shrink-0 text-red-400" />}
      <div>
        <p className="text-xs font-semibold text-text-primary">{label}</p>
        <p className={`text-xs ${pass ? "text-emerald-400" : "text-red-400"}`}>
          {pass ? "통과" : "실패"}
        </p>
      </div>
    </div>
  );
}

export default function ColorContrastPage() {
  const [fg, setFg] = useState("#ffffff");
  const [bg, setBg] = useState("#1e1f38");

  const ratio     = useMemo(() => getContrastRatio(fg, bg), [fg, bg]);
  const ratioStr  = ratio.toFixed(2);

  const aa_normal  = ratio >= 4.5;
  const aa_large   = ratio >= 3.0;
  const aaa_normal = ratio >= 7.0;
  const aaa_large  = ratio >= 4.5;

  const scoreColor =
    ratio >= 7   ? "text-emerald-400" :
    ratio >= 4.5 ? "text-brand"       :
    ratio >= 3   ? "text-amber-400"   :
                   "text-red-400";

  const colorInputs = [
    { label: "전경색 (Foreground)", value: fg, onChange: setFg },
    { label: "배경색 (Background)", value: bg, onChange: setBg },
  ] as const;

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="Color Contrast Checker"
      description="전경색과 배경색의 명암비를 계산하여 WCAG AA · AAA 기준을 즉시 확인합니다."
      icon={Contrast}
    >
      <div className="flex flex-col gap-8">

        {/* 색상 선택 */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {colorInputs.map(({ label, value, onChange }) => (
            <div key={label} className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-text-secondary">{label}</label>
              <div className="flex items-center gap-3 rounded-xl border border-border bg-bg-secondary px-4 py-3">
                <div className="relative size-8 shrink-0 overflow-hidden rounded-lg border border-border">
                  <div className="absolute inset-0" style={{ backgroundColor: value }} />
                  <input
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                </div>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v);
                  }}
                  className="flex-1 bg-transparent font-mono text-sm text-text-primary focus:outline-none"
                  maxLength={7}
                />
              </div>
            </div>
          ))}
        </div>

        {/* 텍스트 미리보기 */}
        <div
          className="flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-2xl border border-border p-8"
          style={{ backgroundColor: bg }}
        >
          <p className="text-2xl font-bold" style={{ color: fg }}>가나다 ABC 123</p>
          <p className="text-sm" style={{ color: fg }}>본문 텍스트 미리보기 — Small text preview</p>
        </div>

        {/* 명암비 */}
        <div className="flex flex-col items-center gap-1 rounded-2xl border border-border bg-bg-secondary py-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary">명암비 (Contrast Ratio)</p>
          <p className={`text-5xl font-bold tabular-nums ${scoreColor}`}>{ratioStr}</p>
          <p className="text-sm text-text-secondary">: 1</p>
        </div>

        {/* WCAG 결과 */}
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-text-primary">WCAG 2.1 기준</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Badge label="AA — 일반 텍스트 (4.5:1)" pass={aa_normal}  />
            <Badge label="AA — 큰 텍스트 (3:1)"     pass={aa_large}   />
            <Badge label="AAA — 일반 텍스트 (7:1)"  pass={aaa_normal} />
            <Badge label="AAA — 큰 텍스트 (4.5:1)" pass={aaa_large}  />
          </div>
        </div>

        {/* 설명 */}
        <div className="rounded-xl border border-border bg-bg-secondary px-4 py-3 text-xs text-text-secondary">
          <strong className="text-text-primary">큰 텍스트</strong>란 18pt(24px) 이상 또는 굵은 14pt(18.67px) 이상의 텍스트입니다.
          WCAG AA는 최소 접근성 기준이며, AAA는 향상된 접근성 기준입니다.
        </div>
      </div>
    </ToolPageLayout>
  );
}