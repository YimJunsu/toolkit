"use client";

import { useState, useEffect } from "react";
import { Type } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";

interface FontOption {
  name: string;
  family: string;
  googleName: string;
  isKorean?: boolean;
}

const FONT_LIST: FontOption[] = [
  { name: "Noto Sans KR",    family: "'Noto Sans KR', sans-serif",    googleName: "Noto+Sans+KR:wght@400;700",    isKorean: true },
  { name: "Noto Serif KR",   family: "'Noto Serif KR', serif",         googleName: "Noto+Serif+KR:wght@400;700",   isKorean: true },
  { name: "Roboto",          family: "'Roboto', sans-serif",            googleName: "Roboto:wght@400;500;700" },
  { name: "Open Sans",       family: "'Open Sans', sans-serif",         googleName: "Open+Sans:wght@400;600;700" },
  { name: "Montserrat",      family: "'Montserrat', sans-serif",        googleName: "Montserrat:wght@400;600;700" },
  { name: "Poppins",         family: "'Poppins', sans-serif",           googleName: "Poppins:wght@400;500;600;700" },
  { name: "Playfair Display",family: "'Playfair Display', serif",       googleName: "Playfair+Display:wght@400;700" },
  { name: "Source Code Pro", family: "'Source Code Pro', monospace",    googleName: "Source+Code+Pro:wght@400;600" },
  { name: "Nunito",          family: "'Nunito', sans-serif",            googleName: "Nunito:wght@400;600;700" },
  { name: "Raleway",         family: "'Raleway', sans-serif",           googleName: "Raleway:wght@400;600;700" },
];

const FONT_WEIGHTS = [
  { label: "Regular (400)", value: "400" },
  { label: "Medium (500)",  value: "500" },
  { label: "SemiBold (600)", value: "600" },
  { label: "Bold (700)",    value: "700" },
];

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Design", href: "/tools/design" },
];

export default function FontPreviewPage() {
  const [selectedFont, setSelectedFont]   = useState<FontOption>(FONT_LIST[0]);
  const [previewText, setPreviewText]     = useState("다람쥐 헌 쳇바퀴에 타고파\nThe quick brown fox jumps over the lazy dog.");
  const [fontSize, setFontSize]           = useState(24);
  const [fontWeight, setFontWeight]       = useState("400");
  const [lineHeight, setLineHeight]       = useState(1.6);
  const [fontsLoaded, setFontsLoaded]     = useState(false);

  // Google Fonts 동적 로드
  useEffect(() => {
    const existingLink = document.getElementById("font-preview-google");
    if (existingLink) { setFontsLoaded(true); return; }

    const families = FONT_LIST.map((f) => `family=${f.googleName}`).join("&");
    const link = document.createElement("link");
    link.id = "font-preview-google";
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
    link.onload = () => setFontsLoaded(true);
    document.head.appendChild(link);
  }, []);

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="폰트 미리보기"
      description="다양한 웹폰트의 조합과 스타일을 실시간으로 시각화"
      icon={Type}
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">

        {/* 왼쪽: 컨트롤 패널 */}
        <div className="flex flex-col gap-6">

          {/* 폰트 선택 */}
          <div>
            <p className="mb-2 text-xs font-medium text-text-secondary">폰트 선택</p>
            <div className="flex flex-col gap-1.5">
              {FONT_LIST.map((font) => (
                <button
                  key={font.name}
                  type="button"
                  onClick={() => setSelectedFont(font)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                    selectedFont.name === font.name
                      ? "bg-brand/15 text-text-primary"
                      : "text-text-secondary hover:bg-bg-secondary hover:text-text-primary"
                  }`}
                >
                  <span style={{ fontFamily: font.family }}>{font.name}</span>
                  {font.isKorean && (
                    <span className="rounded px-1.5 py-0.5 text-xs bg-brand/10 text-brand">KO</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 크기 */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium text-text-secondary">크기</p>
              <span className="font-mono text-xs text-text-primary">{fontSize}px</span>
            </div>
            <input
              type="range" min={12} max={72} value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value))}
              className="w-full accent-brand"
            />
          </div>

          {/* 굵기 */}
          <div>
            <p className="mb-2 text-xs font-medium text-text-secondary">굵기</p>
            <div className="grid grid-cols-2 gap-1.5">
              {FONT_WEIGHTS.map((w) => (
                <button
                  key={w.value}
                  type="button"
                  onClick={() => setFontWeight(w.value)}
                  className={`rounded-lg px-2 py-1.5 text-xs transition-colors ${
                    fontWeight === w.value
                      ? "bg-brand text-white"
                      : "border border-border text-text-secondary hover:border-brand/50 hover:text-text-primary"
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>

          {/* 줄 간격 */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium text-text-secondary">줄 간격</p>
              <span className="font-mono text-xs text-text-primary">{lineHeight}</span>
            </div>
            <input
              type="range" min={1} max={3} step={0.1} value={lineHeight}
              onChange={(e) => setLineHeight(parseFloat(e.target.value))}
              className="w-full accent-brand"
            />
          </div>
        </div>

        {/* 오른쪽: 미리보기 */}
        <div className="flex flex-col gap-4">
          {/* 미리보기 텍스트 입력 */}
          <div>
            <p className="mb-2 text-xs font-medium text-text-secondary">미리보기 텍스트</p>
            <textarea
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              rows={3}
              className="w-full resize-y rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary focus:border-brand focus:outline-none"
            />
          </div>

          {/* 폰트 미리보기 */}
          <div className="min-h-48 rounded-xl border border-border bg-bg-secondary p-6">
            {!fontsLoaded ? (
              <p className="text-sm text-text-secondary">폰트 로딩 중...</p>
            ) : (
              <p
                style={{
                  fontFamily: selectedFont.family,
                  fontSize: `${fontSize}px`,
                  fontWeight,
                  lineHeight,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
                className="text-text-primary"
              >
                {previewText}
              </p>
            )}
          </div>

          {/* 폰트 정보 */}
          <div className="rounded-xl border border-border bg-bg-secondary p-4">
            <p className="mb-3 text-xs font-semibold text-text-secondary">현재 설정</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-xs">
              {[
                { label: "font-family", value: selectedFont.family },
                { label: "font-size",   value: `${fontSize}px` },
                { label: "font-weight", value: fontWeight },
                { label: "line-height", value: String(lineHeight) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <span className="text-text-secondary">{label}: </span>
                  <span className="text-text-primary">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 사이즈 스케일 미리보기 */}
          <div className="rounded-xl border border-border bg-bg-secondary p-4">
            <p className="mb-4 text-xs font-semibold text-text-secondary">사이즈 스케일</p>
            <div className="flex flex-col gap-3">
              {[12, 14, 16, 20, 24, 32, 48].map((size) => (
                <div key={size} className="flex items-baseline gap-3">
                  <span className="w-8 shrink-0 text-xs text-text-secondary">{size}</span>
                  <p
                    style={{
                      fontFamily: selectedFont.family,
                      fontSize: `${size}px`,
                      fontWeight,
                      lineHeight: 1.2,
                    }}
                    className="text-text-primary"
                  >
                    {selectedFont.isKorean ? "가나다라마바사" : "The quick brown fox"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
}