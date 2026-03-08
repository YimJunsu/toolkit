"use client";

import { useState, useMemo } from "react";
import { Shapes, Copy, Check, Search } from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";

/* ── 큐레이션 아이콘 목록 ── */

interface IconEntry {
  name: string;
  component: LucideIcon;
  category: string;
}

const RAW_ICONS: [string, string][] = [
  // UI / 레이아웃
  ["Home", "UI"],          ["LayoutDashboard", "UI"], ["Sidebar", "UI"],
  ["PanelLeft", "UI"],     ["Grid2x2", "UI"],         ["List", "UI"],
  ["Table", "UI"],         ["Columns2", "UI"],        ["Rows2", "UI"],
  // 네비게이션 / 화살표
  ["ArrowLeft", "화살표"],  ["ArrowRight", "화살표"], ["ArrowUp", "화살표"],
  ["ArrowDown", "화살표"],  ["ChevronLeft", "화살표"],["ChevronRight", "화살표"],
  ["ChevronsLeft", "화살표"],["ChevronsRight","화살표"],["MoveHorizontal","화살표"],
  // 액션
  ["Search", "액션"],       ["Filter", "액션"],       ["Plus", "액션"],
  ["Minus", "액션"],        ["X", "액션"],            ["Check", "액션"],
  ["Edit", "액션"],         ["Trash2", "액션"],       ["Copy", "액션"],
  ["Download", "액션"],     ["Upload", "액션"],       ["Share2", "액션"],
  ["RefreshCw", "액션"],    ["RotateCcw", "액션"],    ["ZoomIn", "액션"],
  // 파일 / 폴더
  ["File", "파일"],         ["FileText", "파일"],     ["Folder", "파일"],
  ["FolderOpen", "파일"],   ["FileJson", "파일"],     ["FileCode", "파일"],
  ["FilePlus", "파일"],     ["FileOutput", "파일"],   ["Archive", "파일"],
  // 디자인 / 미디어
  ["Palette", "디자인"],   ["Pipette", "디자인"],    ["Layers", "디자인"],
  ["Shapes", "디자인"],    ["PenTool", "디자인"],    ["Scissors", "디자인"],
  ["Image", "디자인"],      ["ImageDown", "디자인"],  ["Crop", "디자인"],
  ["Type", "디자인"],       ["Bold", "디자인"],       ["Italic", "디자인"],
  // 코드 / 개발
  ["Code2", "코드"],        ["Terminal", "코드"],     ["GitBranch", "코드"],
  ["GitCommit", "코드"],    ["GitMerge", "코드"],     ["Bug", "코드"],
  ["Braces", "코드"],       ["Hash", "코드"],         ["Variable", "코드"],
  // 통신 / 소셜
  ["Mail", "통신"],         ["Phone", "통신"],        ["MessageCircle", "통신"],
  ["Bell", "통신"],         ["BellOff", "통신"],      ["Link", "통신"],
  // 상태 / 알림
  ["Info", "상태"],         ["AlertCircle", "상태"],  ["AlertTriangle", "상태"],
  ["CheckCircle", "상태"],  ["XCircle", "상태"],      ["HelpCircle", "상태"],
  ["Loader2", "상태"],      ["Lock", "상태"],         ["Unlock", "상태"],
  // 기타
  ["Star", "기타"],         ["Heart", "기타"],        ["Bookmark", "기타"],
  ["Tag", "기타"],          ["Settings", "기타"],     ["User", "기타"],
  ["Users", "기타"],        ["Globe", "기타"],        ["Map", "기타"],
  ["Sun", "기타"],          ["Moon", "기타"],         ["Database", "기타"],
];

const ICON_LIST: IconEntry[] = RAW_ICONS.flatMap(([name, category]) => {
  const component = (LucideIcons as Record<string, unknown>)[name] as LucideIcon | undefined;
  if (!component) return [];
  return [{ name, component, category }];
});

const ALL_CATEGORIES = ["전체", ...Array.from(new Set(RAW_ICONS.map(([, c]) => c)))];

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Design", href: "/tools/design" },
];

export default function IconLibraryPage() {
  const [query, setQuery]               = useState("");
  const [category, setCategory]         = useState("전체");
  const [copied, setCopied]             = useState<string | null>(null);
  const [copyMode, setCopyMode]         = useState<"svg" | "react">("react");

  const filtered = useMemo(() => {
    return ICON_LIST.filter((icon) => {
      const matchesSearch = icon.name.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = category === "전체" || icon.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [query, category]);

  const handleCopy = async (icon: IconEntry) => {
    let text: string;
    if (copyMode === "react") {
      text = `import { ${icon.name} } from 'lucide-react';\n\n<${icon.name} size={24} />`;
    } else {
      const el = document.querySelector(`[data-icon="${icon.name}"] svg`);
      text = el ? el.outerHTML : `<!-- ${icon.name} SVG -->`;
    }
    await navigator.clipboard.writeText(text);
    setCopied(icon.name);
    setTimeout(() => setCopied(null), 1800);
  };

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="아이콘 라이브러리"
      description="Lucide React 아이콘 검색 및 React / SVG 코드 복사"
      icon={Shapes}
    >
      <div className="flex flex-col gap-6">

        {/* 검색 + 복사 모드 */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="아이콘 검색..."
              className="w-full rounded-lg border border-border bg-bg-primary py-2 pl-9 pr-3 text-sm text-text-primary focus:border-brand focus:outline-none"
            />
          </div>

          {/* 복사 모드 */}
          <div className="flex rounded-lg border border-border p-0.5">
            {(["react", "svg"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setCopyMode(m)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  copyMode === m
                    ? "bg-brand text-white"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {m === "react" ? "React" : "SVG"}
              </button>
            ))}
          </div>
        </div>

        {/* 카테고리 필터 */}
        <div className="flex flex-wrap gap-2">
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                category === cat
                  ? "bg-brand text-white"
                  : "border border-border text-text-secondary hover:border-brand/50 hover:text-text-primary"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 결과 수 */}
        <p className="text-xs text-text-secondary">
          {filtered.length}개 아이콘
        </p>

        {/* 아이콘 그리드 */}
        <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
          {filtered.map((icon) => {
            const Icon = icon.component;
            const isCopied = copied === icon.name;
            return (
              <li key={icon.name}>
                <button
                  type="button"
                  data-icon={icon.name}
                  onClick={() => handleCopy(icon)}
                  title={icon.name}
                  className="group flex w-full flex-col items-center gap-2 rounded-xl border border-border bg-bg-secondary p-3 transition-all hover:border-brand/50"
                >
                  <div className="relative flex size-8 items-center justify-center">
                    {isCopied ? (
                      <Check size={20} className="text-emerald-400" />
                    ) : (
                      <>
                        <Icon size={20} className="text-text-secondary group-hover:text-brand transition-colors" aria-hidden="true" />
                        <Copy size={12} className="absolute -right-1 -top-1 opacity-0 text-text-secondary group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                      </>
                    )}
                  </div>
                  <span className="w-full truncate text-center text-[10px] text-text-secondary group-hover:text-text-primary">
                    {icon.name}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {filtered.length === 0 && (
          <div className="rounded-xl border border-border bg-bg-secondary py-16 text-center text-sm text-text-secondary">
            검색 결과가 없습니다.
          </div>
        )}
      </div>
    </ToolPageLayout>
  );
}