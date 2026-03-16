"use client";

import { useState, useMemo } from "react";
import { ImageIcon, Copy, Check, AlertCircle, CheckCircle2 } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { useClipboard } from "@/hooks/useClipboard";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Text", href: "/tools/text" },
];

// ── 이미지 유형 정의 ─────────────────────────────────────────────

type ImageType = "photo" | "screenshot" | "chart" | "icon" | "illustration" | "diagram";

interface ImageTypeDef {
  id: ImageType;
  label: string;
  emoji: string;
  fields: FieldDef[];
  template: (f: Record<string, string>) => string;
}

interface FieldDef {
  key: string;
  label: string;
  placeholder: string;
  required: boolean;
}

const IMAGE_TYPES: ImageTypeDef[] = [
  {
    id: "photo",
    label: "사진",
    emoji: "📷",
    fields: [
      { key: "subject", label: "주요 피사체", placeholder: "예: 고양이, 사람, 건물", required: true },
      { key: "action",  label: "행동 / 상태", placeholder: "예: 달리고 있는, 앉아 있는", required: false },
      { key: "context", label: "배경 / 맥락", placeholder: "예: 공원에서, 사무실 안", required: false },
    ],
    template: (f) => {
      const parts = [f.subject];
      if (f.action)  parts[0] += `이/가 ${f.action}`;
      if (f.context) parts.push(f.context);
      return parts.join(" — ") + "의 모습";
    },
  },
  {
    id: "screenshot",
    label: "스크린샷",
    emoji: "🖥️",
    fields: [
      { key: "subject", label: "화면 내용",   placeholder: "예: 로그인 폼, 대시보드", required: true },
      { key: "context", label: "앱 / 서비스", placeholder: "예: GitHub, Excel", required: false },
      { key: "action",  label: "현재 상태",   placeholder: "예: 오류 메시지 표시, 데이터 로드 중", required: false },
    ],
    template: (f) => {
      const app = f.context ? `${f.context}의 ` : "";
      const state = f.action ? ` (${f.action})` : "";
      return `${app}${f.subject} 화면${state}`;
    },
  },
  {
    id: "chart",
    label: "차트 / 그래프",
    emoji: "📊",
    fields: [
      { key: "subject", label: "차트 유형",   placeholder: "예: 막대 차트, 선형 그래프, 파이 차트", required: true },
      { key: "topic",   label: "데이터 주제", placeholder: "예: 월별 매출, 연도별 인구", required: true },
      { key: "insight", label: "주요 인사이트", placeholder: "예: 3월에 최고점, 지속적 증가 추세", required: false },
    ],
    template: (f) => {
      const insight = f.insight ? `. ${f.insight}` : "";
      return `${f.topic}을/를 나타낸 ${f.subject}${insight}`;
    },
  },
  {
    id: "icon",
    label: "아이콘",
    emoji: "🔷",
    fields: [
      { key: "subject", label: "아이콘 의미", placeholder: "예: 홈, 검색, 사용자, 설정", required: true },
      { key: "style",   label: "스타일 (선택)", placeholder: "예: 윤곽선형, 채워진형", required: false },
    ],
    template: (f) => {
      const style = f.style ? ` (${f.style})` : "";
      return `${f.subject} 아이콘${style}`;
    },
  },
  {
    id: "illustration",
    label: "일러스트",
    emoji: "🎨",
    fields: [
      { key: "subject", label: "주요 내용",   placeholder: "예: 사람이 노트북을 사용하는 모습", required: true },
      { key: "style",   label: "스타일",      placeholder: "예: 플랫 디자인, 라인 아트", required: false },
      { key: "context", label: "사용 목적",   placeholder: "예: 팀워크 개념 설명", required: false },
    ],
    template: (f) => {
      const style  = f.style   ? `${f.style} 스타일의 ` : "";
      const ctx    = f.context ? ` — ${f.context}` : "";
      return `${style}${f.subject} 일러스트${ctx}`;
    },
  },
  {
    id: "diagram",
    label: "다이어그램",
    emoji: "🗂️",
    fields: [
      { key: "subject", label: "다이어그램 유형", placeholder: "예: 흐름도, 시스템 구조도, ER 다이어그램", required: true },
      { key: "topic",   label: "설명 대상",       placeholder: "예: 주문 처리 흐름, 데이터베이스 구조", required: true },
      { key: "insight", label: "핵심 포인트",     placeholder: "예: 3단계 프로세스, 주요 관계", required: false },
    ],
    template: (f) => {
      const insight = f.insight ? `. ${f.insight}` : "";
      return `${f.topic}을/를 나타낸 ${f.subject}${insight}`;
    },
  },
];

// ── 품질 체크 ────────────────────────────────────────────────────

interface QualityCheck {
  label: string;
  pass: boolean;
  tip?: string;
}

function checkAltTextQuality(text: string): QualityCheck[] {
  if (!text) return [];
  return [
    {
      label: "적정 길이 (5–125자)",
      pass: text.length >= 5 && text.length <= 125,
      tip: text.length > 125 ? "너무 깁니다. 핵심 정보만 남기세요." : text.length < 5 ? "너무 짧습니다." : undefined,
    },
    {
      label: '"이미지" / "사진" 단어 제외',
      pass: !/\b(이미지|사진|그림|image|photo|picture)\b/i.test(text),
      tip: '스크린 리더는 이미 "이미지"라고 읽으므로 중복 사용을 피하세요.',
    },
    {
      label: "장식용 이미지 처리 여부",
      pass: true,
    },
    {
      label: "특수문자 최소화",
      pass: (text.match(/[^\w\s가-힣.,!?·—–\-()]/g) ?? []).length === 0,
      tip: "스크린 리더가 특수문자를 읽어 방해가 될 수 있습니다.",
    },
  ];
}

// ── 메인 컴포넌트 ────────────────────────────────────────────────

export default function AltTextPage() {
  const [imageType, setImageType]   = useState<ImageType>("photo");
  const [fields, setFields]         = useState<Record<string, string>>({});
  const [manualEdit, setManualEdit] = useState("");
  const [isEditing, setIsEditing]   = useState(false);
  const { copied, copy } = useClipboard();

  const typeDef = IMAGE_TYPES.find((t) => t.id === imageType)!;

  const generated = useMemo(() => {
    const hasRequired = typeDef.fields
      .filter((f) => f.required)
      .every((f) => (fields[f.key] ?? "").trim());
    if (!hasRequired) return "";
    return typeDef.template(fields);
  }, [typeDef, fields]);

  const altText    = isEditing ? manualEdit : generated;
  const qualChecks = useMemo(() => checkAltTextQuality(altText), [altText]);
  const passCount  = qualChecks.filter((c) => c.pass).length;

  const handleTypeChange = (type: ImageType) => {
    setImageType(type);
    setFields({});
    setManualEdit("");
    setIsEditing(false);
  };

  const handleFieldChange = (key: string, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
    setIsEditing(false);
  };

  const handleCopy = () => {
    if (!altText) return;
    copy(altText, "default");
  };

  const startEdit = () => {
    setManualEdit(generated);
    setIsEditing(true);
  };

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="대체 텍스트 생성기"
      description="이미지 유형과 내용을 입력하면 접근성 기준에 맞는 alt 텍스트를 자동 생성합니다."
      icon={ImageIcon}
    >
      <div className="flex flex-col gap-6">

        {/* 이미지 유형 선택 */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-text-secondary">이미지 유형</p>
          <div className="flex flex-wrap gap-2">
            {IMAGE_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleTypeChange(t.id)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  imageType === t.id
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-border text-text-secondary hover:border-brand/40 hover:text-text-primary"
                }`}
              >
                <span>{t.emoji}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* 유도 질문 폼 */}
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-bg-secondary p-5">
          <p className="text-sm font-semibold text-text-primary">이미지 내용 입력</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {typeDef.fields.map((field) => (
              <div key={field.key} className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-secondary">
                  {field.label}
                  {field.required && <span className="ml-1 text-brand">*</span>}
                </label>
                <input
                  type="text"
                  value={fields[field.key] ?? ""}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary placeholder-text-secondary/50 focus:border-brand focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>

        {/* 생성 결과 */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-text-secondary">생성된 대체 텍스트</p>
            <div className="flex items-center gap-2">
              {generated && !isEditing && (
                <button
                  type="button"
                  onClick={startEdit}
                  className="text-xs text-text-secondary transition-colors hover:text-text-primary"
                >
                  직접 수정
                </button>
              )}
              <button
                type="button"
                onClick={handleCopy}
                disabled={!altText}
                className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-brand disabled:opacity-40"
              >
                {copied === "default" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                {copied === "default" ? "복사됨" : "복사"}
              </button>
            </div>
          </div>

          {isEditing ? (
            <textarea
              value={manualEdit}
              onChange={(e) => setManualEdit(e.target.value)}
              rows={3}
              className="resize-none rounded-xl border border-brand bg-bg-primary p-4 text-sm text-text-primary focus:outline-none"
              spellCheck={false}
            />
          ) : (
            <div className={`rounded-xl border p-4 text-sm ${altText ? "border-border bg-bg-primary" : "border-dashed border-border bg-bg-primary"}`}>
              {altText ? (
                <p className="font-mono text-text-primary">{altText}</p>
              ) : (
                <p className="text-text-secondary/40">필수 항목을 입력하면 자동 생성됩니다.</p>
              )}
            </div>
          )}

          {/* 문자 수 + 코드 미리보기 */}
          {altText && (
            <>
              <div className="flex justify-between text-xs text-text-secondary">
                <span className={altText.length > 125 ? "text-red-400" : "text-text-secondary"}>
                  {altText.length}자 {altText.length > 125 ? "(권장 125자 초과)" : "(권장 125자 이하)"}
                </span>
              </div>
              <div className="rounded-lg border border-border bg-bg-primary px-4 py-2.5 font-mono text-xs text-text-secondary">
                {`<img alt="${altText}" ... />`}
              </div>
            </>
          )}
        </div>

        {/* 품질 체크 */}
        {altText && (
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-bg-secondary p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-text-primary">접근성 품질 체크</p>
              <span className={`text-xs font-semibold ${passCount === qualChecks.length ? "text-emerald-400" : "text-amber-400"}`}>
                {passCount} / {qualChecks.length} 통과
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {qualChecks.map(({ label, pass, tip }) => (
                <div key={label} className="flex items-start gap-2">
                  {pass
                    ? <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-400" />
                    : <AlertCircle  size={14} className="mt-0.5 shrink-0 text-amber-400" />
                  }
                  <div>
                    <span className={`text-xs ${pass ? "text-text-secondary" : "text-amber-400"}`}>{label}</span>
                    {!pass && tip && <p className="mt-0.5 text-xs text-text-secondary">{tip}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 장식용 이미지 안내 */}
        <div className="rounded-lg border border-border bg-bg-secondary px-4 py-3 text-xs text-text-secondary">
          <strong className="text-text-primary">장식용 이미지</strong>는{" "}
          <code className="rounded bg-bg-primary px-1 py-0.5 font-mono text-xs">alt=""</code>로 빈 값을 권장합니다.
          스크린 리더가 불필요한 정보를 읽지 않도록 합니다.
          <br />
          <strong className="text-text-primary">좋은 alt 텍스트</strong>는 이미지가 없어도 동일한 정보를 전달할 수 있어야 합니다.
        </div>
      </div>
    </ToolPageLayout>
  );
}