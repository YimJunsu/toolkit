"use client";

import { useState, useRef, useCallback } from "react";
import { Zap, Copy, Check, Play, RotateCcw } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { useClipboard } from "@/hooks/useClipboard";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Design", href: "/tools/design" },
];

type AnimationPreset =
  | "fadeIn" | "fadeOut" | "slideInLeft" | "slideInRight"
  | "slideInUp" | "slideInDown" | "bounceIn" | "rotateIn"
  | "pulse" | "shake" | "zoomIn" | "zoomOut";

interface AnimationDef {
  label: string;
  description: string;
  keyframes: string;
  animationName: string;
}

const ANIMATIONS: Record<AnimationPreset, AnimationDef> = {
  fadeIn: {
    label: "Fade In",
    description: "투명도 0 → 1로 서서히 나타납니다. 가장 많이 쓰이는 기본 등장 효과입니다.",
    animationName: "tk-fadeIn",
    keyframes: `@keyframes tk-fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}`,
  },
  fadeOut: {
    label: "Fade Out",
    description: "투명도 1 → 0으로 서서히 사라집니다. 요소가 퇴장할 때 사용합니다.",
    animationName: "tk-fadeOut",
    keyframes: `@keyframes tk-fadeOut {
  from { opacity: 1; }
  to   { opacity: 0; }
}`,
  },
  slideInLeft: {
    label: "Slide In Left",
    description: "왼쪽에서 오른쪽으로 밀려 들어오며 나타납니다. 사이드바·모달 등장 시 적합합니다.",
    animationName: "tk-slideInLeft",
    keyframes: `@keyframes tk-slideInLeft {
  from { opacity: 0; transform: translateX(-60px); }
  to   { opacity: 1; transform: translateX(0); }
}`,
  },
  slideInRight: {
    label: "Slide In Right",
    description: "오른쪽에서 왼쪽으로 밀려 들어오며 나타납니다. 알림·토스트 메시지에 잘 어울립니다.",
    animationName: "tk-slideInRight",
    keyframes: `@keyframes tk-slideInRight {
  from { opacity: 0; transform: translateX(60px); }
  to   { opacity: 1; transform: translateX(0); }
}`,
  },
  slideInUp: {
    label: "Slide In Up",
    description: "아래에서 위로 올라오며 나타납니다. 카드·팝업이 자연스럽게 등장하는 효과입니다.",
    animationName: "tk-slideInUp",
    keyframes: `@keyframes tk-slideInUp {
  from { opacity: 0; transform: translateY(60px); }
  to   { opacity: 1; transform: translateY(0); }
}`,
  },
  slideInDown: {
    label: "Slide In Down",
    description: "위에서 아래로 내려오며 나타납니다. 드롭다운 메뉴·헤더 배너에 적합합니다.",
    animationName: "tk-slideInDown",
    keyframes: `@keyframes tk-slideInDown {
  from { opacity: 0; transform: translateY(-60px); }
  to   { opacity: 1; transform: translateY(0); }
}`,
  },
  bounceIn: {
    label: "Bounce In",
    description: "작게 시작해 튕기듯 커지며 나타납니다. 버튼·아이콘 강조 시 생동감을 줍니다.",
    animationName: "tk-bounceIn",
    keyframes: `@keyframes tk-bounceIn {
  0%   { opacity: 0; transform: scale(0.3); }
  50%  { opacity: 1; transform: scale(1.05); }
  70%  { transform: scale(0.9); }
  100% { transform: scale(1); }
}`,
  },
  rotateIn: {
    label: "Rotate In",
    description: "180° 회전하며 확대되어 나타납니다. 아이콘 전환·로딩 완료 표시에 효과적입니다.",
    animationName: "tk-rotateIn",
    keyframes: `@keyframes tk-rotateIn {
  from { opacity: 0; transform: rotate(-180deg) scale(0.5); }
  to   { opacity: 1; transform: rotate(0deg) scale(1); }
}`,
  },
  pulse: {
    label: "Pulse",
    description: "크기가 살짝 커졌다 원래대로 반복됩니다. 알림 뱃지·온라인 상태 표시에 활용합니다.",
    animationName: "tk-pulse",
    keyframes: `@keyframes tk-pulse {
  0%, 100% { transform: scale(1); }
  50%       { transform: scale(1.1); }
}`,
  },
  shake: {
    label: "Shake",
    description: "좌우로 빠르게 흔들립니다. 로그인 실패·입력 오류 시 즉각적인 피드백으로 씁니다.",
    animationName: "tk-shake",
    keyframes: `@keyframes tk-shake {
  0%, 100% { transform: translateX(0); }
  10%, 50%, 90% { transform: translateX(-8px); }
  30%, 70%      { transform: translateX(8px); }
}`,
  },
  zoomIn: {
    label: "Zoom In",
    description: "크기 0에서 1로 확대되며 나타납니다. 모달·이미지 라이트박스 등장에 어울립니다.",
    animationName: "tk-zoomIn",
    keyframes: `@keyframes tk-zoomIn {
  from { opacity: 0; transform: scale(0); }
  to   { opacity: 1; transform: scale(1); }
}`,
  },
  zoomOut: {
    label: "Zoom Out",
    description: "크기 1에서 0으로 축소되며 사라집니다. 모달·팝업을 닫을 때 자연스럽게 쓰입니다.",
    animationName: "tk-zoomOut",
    keyframes: `@keyframes tk-zoomOut {
  from { opacity: 1; transform: scale(1); }
  to   { opacity: 0; transform: scale(0); }
}`,
  },
};

type Iteration = "1" | "2" | "3" | "infinite";
type TimingFn = "ease" | "ease-in" | "ease-out" | "ease-in-out" | "linear" | "cubic-bezier(0.68,-0.55,0.27,1.55)";
type FillMode = "none" | "forwards" | "backwards" | "both";

const TIMING_OPTIONS: { label: string; value: TimingFn }[] = [
  { label: "ease", value: "ease" },
  { label: "ease-in", value: "ease-in" },
  { label: "ease-out", value: "ease-out" },
  { label: "ease-in-out", value: "ease-in-out" },
  { label: "linear", value: "linear" },
  { label: "cubic-bezier (bounce)", value: "cubic-bezier(0.68,-0.55,0.27,1.55)" },
];

export default function CssAnimationPage() {
  const [preset, setPreset] = useState<AnimationPreset>("fadeIn");
  const [duration, setDuration] = useState(600);
  const [delay, setDelay] = useState(0);
  const [iteration, setIteration] = useState<Iteration>("1");
  const [timingFn, setTimingFn] = useState<TimingFn>("ease");
  const [fillMode, setFillMode] = useState<FillMode>("forwards");
  const [playing, setPlaying] = useState(false);
  const { copied, copy } = useClipboard();
  const previewRef = useRef<HTMLDivElement>(null);

  const def = ANIMATIONS[preset];

  const animationValue = `${def.animationName} ${duration}ms ${timingFn} ${delay}ms ${iteration} ${fillMode}`;

  const cssCode = `${def.keyframes}

.element {
  animation: ${animationValue};
}`;

  const handlePlay = useCallback(() => {
    if (!previewRef.current || playing) return;
    setPlaying(true);
    const el = previewRef.current;
    el.style.animation = "none";
    // Force reflow
    void el.offsetWidth;
    el.style.animation = animationValue;
    setTimeout(() => setPlaying(false), duration + delay + 200);
  }, [animationValue, duration, delay, playing]);

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="CSS Animation Generator"
      description="프리셋 애니메이션을 선택하고 옵션을 조정하여 CSS animation 코드를 즉시 생성합니다."
      icon={Zap}
    >
      {/* 인라인 keyframes 스타일 */}
      <style>{def.keyframes}</style>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 컨트롤 패널 */}
        <div className="flex flex-col gap-5">
          {/* 프리셋 선택 */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-text-secondary">애니메이션 프리셋</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(ANIMATIONS) as [AnimationPreset, AnimationDef][]).map(([key, val]) => (
                <div key={key} className="group relative">
                  <button
                    type="button"
                    onClick={() => setPreset(key)}
                    className={`w-full rounded-lg border px-2 py-2 text-xs transition-colors ${
                      preset === key
                        ? "border-brand bg-brand/10 text-brand"
                        : "border-border text-text-secondary hover:border-brand/40 hover:text-text-primary"
                    }`}
                  >
                    {val.label}
                  </button>
                  {/* 툴팁 */}
                  <div
                    className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-48 -translate-x-1/2 rounded-xl border border-border bg-bg-primary p-3 shadow-lg
                      opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                  >
                    <p className="mb-1 text-[11px] font-semibold text-brand">{val.label}</p>
                    <p className="text-[11px] leading-relaxed text-text-secondary">{val.description}</p>
                    {/* 아래 꼭지 */}
                    <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-border" />
                    <span className="absolute left-1/2 top-full mt-[-1px] -translate-x-1/2 border-4 border-transparent border-t-bg-primary" />
                  </div>
                </div>
              ))}
            </div>
            {/* 선택된 프리셋 설명 (모바일용 — 항상 표시) */}
            <div className="rounded-xl border border-border bg-bg-secondary px-3 py-2.5 sm:hidden">
              <p className="text-[11px] font-semibold text-brand">{ANIMATIONS[preset].label}</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-text-secondary">{ANIMATIONS[preset].description}</p>
            </div>
          </div>

          {/* Duration */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-text-secondary">Duration</label>
              <span className="font-mono text-xs text-brand">{duration}ms</span>
            </div>
            <input
              type="range"
              min={100}
              max={3000}
              step={50}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full accent-brand"
            />
          </div>

          {/* Delay */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-text-secondary">Delay</label>
              <span className="font-mono text-xs text-brand">{delay}ms</span>
            </div>
            <input
              type="range"
              min={0}
              max={2000}
              step={50}
              value={delay}
              onChange={(e) => setDelay(Number(e.target.value))}
              className="w-full accent-brand"
            />
          </div>

          {/* Iteration */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-text-secondary">Iteration</label>
            <div className="flex gap-2">
              {(["1","2","3","infinite"] as Iteration[]).map((it) => (
                <button
                  key={it}
                  type="button"
                  onClick={() => setIteration(it)}
                  className={`flex-1 rounded-lg border py-2 text-xs transition-colors ${
                    iteration === it
                      ? "border-brand bg-brand/10 text-brand"
                      : "border-border text-text-secondary hover:border-brand/40"
                  }`}
                >
                  {it}
                </button>
              ))}
            </div>
          </div>

          {/* Timing Function */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-text-secondary">Timing Function</label>
            <select
              value={timingFn}
              onChange={(e) => setTimingFn(e.target.value as TimingFn)}
              className="w-full rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary focus:border-brand focus:outline-none"
            >
              {TIMING_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Fill Mode */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-text-secondary">Fill Mode</label>
            <div className="flex gap-2">
              {(["none","forwards","backwards","both"] as FillMode[]).map((fm) => (
                <button
                  key={fm}
                  type="button"
                  onClick={() => setFillMode(fm)}
                  className={`flex-1 rounded-lg border py-2 text-xs transition-colors ${
                    fillMode === fm
                      ? "border-brand bg-brand/10 text-brand"
                      : "border-border text-text-secondary hover:border-brand/40"
                  }`}
                >
                  {fm}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 오른쪽: 프리뷰 + 코드 */}
        <div className="flex flex-col gap-5">
          {/* 라이브 프리뷰 */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-text-secondary">라이브 프리뷰</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (previewRef.current) {
                      previewRef.current.style.animation = "none";
                      setPlaying(false);
                    }
                  }}
                  className="flex items-center gap-1 rounded-lg border border-border px-2 py-1.5 text-xs text-text-secondary transition-colors hover:border-brand/40 hover:text-text-primary"
                >
                  <RotateCcw size={12} />
                  초기화
                </button>
                <button
                  type="button"
                  onClick={handlePlay}
                  disabled={playing}
                  className="flex items-center gap-1 rounded-lg border border-brand bg-brand/10 px-3 py-1.5 text-xs font-medium text-brand transition-opacity hover:opacity-80 disabled:opacity-50"
                >
                  <Play size={12} />
                  재생
                </button>
              </div>
            </div>
            <div className="flex h-52 items-center justify-center rounded-xl border border-border bg-bg-secondary">
              <div
                ref={previewRef}
                className="flex size-24 items-center justify-center rounded-2xl bg-brand/20 ring-2 ring-brand/30"
              >
                <Zap size={32} className="text-brand" />
              </div>
            </div>
          </div>

          {/* CSS 코드 출력 */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-text-secondary">생성된 CSS</label>
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

          {/* animation 값만 별도 출력 */}
          <div className="flex items-center gap-3 rounded-xl border border-border bg-bg-secondary px-4 py-3">
            <span className="shrink-0 text-xs text-text-secondary font-mono">animation:</span>
            <code className="flex-1 break-all font-mono text-xs text-brand">{animationValue}</code>
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
}
