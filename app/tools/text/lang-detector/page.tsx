"use client";

import { useState, useCallback } from "react";
import { Languages, Copy, Check, RefreshCw, ArrowRight } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { useClipboard } from "@/hooks/useClipboard";
import { detectLanguage } from "@/lib/utils/textUtils";
import type { DetectedLanguage } from "@/lib/utils/textUtils";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Text", href: "/tools/text" },
];

interface LangOption {
  code: string;
  label: string;
}

const LANG_OPTIONS: LangOption[] = [
  { code: "ko",    label: "한국어"     },
  { code: "en",    label: "영어"       },
  { code: "ja",    label: "일본어"     },
  { code: "zh",    label: "중국어"     },
  { code: "fr",    label: "프랑스어"   },
  { code: "de",    label: "독일어"     },
  { code: "es",    label: "스페인어"   },
  { code: "pt",    label: "포르투갈어" },
  { code: "ru",    label: "러시아어"   },
  { code: "ar",    label: "아랍어"     },
];

const CONFIDENCE_COLOR: (n: number) => string = (n) =>
  n >= 80 ? "text-emerald-400" : n >= 50 ? "text-amber-400" : "text-red-400";

export default function LangDetectorPage() {
  const [input, setInput]           = useState("");
  const [detected, setDetected]     = useState<DetectedLanguage | null>(null);
  const [fromLang, setFromLang]     = useState("en");
  const [toLang, setToLang]         = useState("ko");
  const [translated, setTranslated] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [transError, setTransError] = useState<string | null>(null);
  const { copied, copy } = useClipboard();

  const handleDetect = useCallback(() => {
    if (!input.trim()) return;
    const result = detectLanguage(input);
    setDetected(result);
    if (result.code !== "unknown") setFromLang(result.code);
  }, [input]);

  const handleTranslate = useCallback(async () => {
    if (!input.trim()) return;
    setIsTranslating(true);
    setTransError(null);
    setTranslated("");
    try {
      const res  = await fetch(`/api/translate?q=${encodeURIComponent(input)}&from=${fromLang}&to=${toLang}`);
      const data = (await res.json()) as { translated?: string; error?: string };
      if (!res.ok || data.error) { setTransError(data.error ?? "번역 실패"); return; }
      setTranslated(data.translated!);
    } catch {
      setTransError("네트워크 오류. 잠시 후 다시 시도하세요.");
    } finally {
      setIsTranslating(false);
    }
  }, [input, fromLang, toLang]);

  const handleCopy = useCallback(() => {
    if (!translated) return;
    copy(translated, "default");
  }, [translated, copy]);

  const handleSwapLangs = () => {
    setFromLang(toLang);
    setToLang(fromLang);
    if (translated) { setInput(translated); setTranslated(""); setDetected(null); }
  };

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="언어 감지 / 번역"
      description="텍스트 언어를 자동으로 감지하고 10개 언어 간 번역합니다. (MyMemory 무료 API)"
      icon={Languages}
    >
      <div className="flex flex-col gap-6">

        {/* 언어 선택 바 */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 출발 언어 */}
          <select
            value={fromLang}
            onChange={(e) => setFromLang(e.target.value)}
            className="rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary focus:border-brand focus:outline-none"
          >
            {LANG_OPTIONS.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>

          {/* 스왑 */}
          <button
            type="button"
            onClick={handleSwapLangs}
            className="flex size-9 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
            aria-label="언어 방향 교체"
          >
            <ArrowRight size={15} />
          </button>

          {/* 도착 언어 */}
          <select
            value={toLang}
            onChange={(e) => setToLang(e.target.value)}
            className="rounded-lg border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary focus:border-brand focus:outline-none"
          >
            {LANG_OPTIONS.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>

          {/* 언어 감지 버튼 */}
          <button
            type="button"
            onClick={handleDetect}
            disabled={!input.trim()}
            className="ml-auto flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-text-secondary transition-colors hover:border-brand/50 hover:text-brand disabled:opacity-40"
          >
            <Languages size={14} />
            언어 감지
          </button>
        </div>

        {/* 감지 결과 배지 */}
        {detected && (
          <div className="flex items-center gap-3 rounded-lg border border-border bg-bg-secondary px-4 py-2.5 text-sm">
            <span className="text-text-secondary">감지된 언어:</span>
            <span className="font-semibold text-text-primary">
              {detected.name} ({detected.nameEn})
            </span>
            <span className={`font-mono text-xs ${CONFIDENCE_COLOR(detected.confidence)}`}>
              신뢰도 {detected.confidence}%
            </span>
            {detected.code !== "unknown" && detected.code !== fromLang && (
              <button
                type="button"
                onClick={() => setFromLang(detected.code)}
                className="ml-auto text-xs text-brand transition-colors hover:text-brand-hover"
              >
                출발어로 적용
              </button>
            )}
          </div>
        )}

        {/* 입출력 */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

          {/* 입력 */}
          <div className="flex flex-col gap-2">
            <div className="flex h-7 items-center justify-between">
              <label className="text-xs font-semibold text-text-secondary">원본 텍스트</label>
              <button
                type="button"
                onClick={() => { setInput(""); setDetected(null); setTranslated(""); }}
                disabled={!input}
                className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-brand disabled:opacity-30"
              >
                지우기
              </button>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="번역 또는 감지할 텍스트를 입력하세요... (최대 500자)"
              rows={10}
              maxLength={500}
              className="resize-none rounded-xl border border-border bg-bg-secondary p-4 text-sm text-text-primary placeholder-text-secondary/50 focus:border-brand focus:outline-none"
              spellCheck={false}
            />
            <p className="text-right text-xs text-text-secondary">{input.length} / 500</p>
          </div>

          {/* 번역 결과 */}
          <div className="flex flex-col gap-2">
            <div className="flex h-7 items-center justify-between">
              <label className="text-xs font-semibold text-text-secondary">번역 결과</label>
              <button
                type="button"
                onClick={handleCopy}
                disabled={!translated}
                className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-brand disabled:opacity-40"
              >
                {copied === "default" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                {copied === "default" ? "복사됨" : "복사"}
              </button>
            </div>
            <div className={`flex min-h-[252px] flex-col rounded-xl border p-4 text-sm ${transError ? "border-red-500/50 bg-bg-primary" : "border-border bg-bg-primary"}`}>
              {isTranslating ? (
                <div className="flex flex-1 items-center justify-center gap-2 text-text-secondary">
                  <RefreshCw size={15} className="animate-spin" />
                  번역 중...
                </div>
              ) : transError ? (
                <p className="text-xs text-red-400">{transError}</p>
              ) : (
                <p className="whitespace-pre-wrap text-text-primary">
                  {translated || <span className="text-text-secondary/40">번역 결과가 여기에 표시됩니다.</span>}
                </p>
              )}
            </div>
            <p className="text-right text-xs text-text-secondary">{translated.length} 자</p>
          </div>
        </div>

        {/* 번역 버튼 */}
        <button
          type="button"
          onClick={handleTranslate}
          disabled={!input.trim() || isTranslating}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-bg-primary transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isTranslating ? <RefreshCw size={15} className="animate-spin" /> : <Languages size={15} />}
          {isTranslating ? "번역 중..." : "번역 실행"}
        </button>

        {/* 안내 */}
        <div className="rounded-lg border border-border bg-bg-secondary px-4 py-3 text-xs text-text-secondary">
          <strong className="text-text-primary">MyMemory</strong> 무료 번역 API를 사용합니다 (API 키 불필요, 하루 약 5,000단어).
          언어 감지는 유니코드 문자 범위 분석 및 라틴계 언어 패턴 매칭으로 처리됩니다.
        </div>
      </div>
    </ToolPageLayout>
  );
}