"use client";

import { useState, useEffect, useMemo } from "react";
import { Bookmark, Plus, Copy, Check, Trash2, Search, X } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { useClipboard } from "@/hooks/useClipboard";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Code", href: "/tools/code" },
];

const LANGUAGES = ["JavaScript", "TypeScript", "Python", "CSS", "HTML", "SQL", "Bash", "기타"] as const;
type Language = typeof LANGUAGES[number];

interface Snippet {
  id: string;
  title: string;
  language: Language;
  code: string;
  createdAt: number;
}

const STORAGE_KEY = "toolkit_snippets";

const SAMPLE_SNIPPETS: Snippet[] = [
  {
    id: "s1",
    title: "useDebounce 훅",
    language: "TypeScript",
    code: `import { useState, useEffect } from 'react'

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}`,
    createdAt: Date.now() - 100000,
  },
  {
    id: "s2",
    title: "formatBytes 유틸",
    language: "JavaScript",
    code: `function formatBytes(bytes, decimals = 2) {
  if (!bytes) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return \`\${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} \${sizes[i]}\`
}`,
    createdAt: Date.now() - 50000,
  },
];

const LANG_COLORS: Record<Language, string> = {
  JavaScript: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  TypeScript: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  Python: "text-green-400 bg-green-400/10 border-green-400/30",
  CSS: "text-pink-400 bg-pink-400/10 border-pink-400/30",
  HTML: "text-orange-400 bg-orange-400/10 border-orange-400/30",
  SQL: "text-purple-400 bg-purple-400/10 border-purple-400/30",
  Bash: "text-gray-400 bg-gray-400/10 border-gray-400/30",
  기타: "text-text-secondary bg-bg-secondary border-border",
};

export default function SnippetManagerPage() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [search, setSearch] = useState("");
  const [filterLang, setFilterLang] = useState<Language | "전체">("전체");const { copied: copiedId, copy } = useClipboard();
  const [showForm, setShowForm] = useState(false);

  // 폼 상태
  const [form, setForm] = useState({ title: "", language: "TypeScript" as Language, code: "" });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setSnippets(stored ? JSON.parse(stored) : SAMPLE_SNIPPETS);
    } catch {
      setSnippets(SAMPLE_SNIPPETS);
    }
  }, []);

  const save = (next: Snippet[]) => {
    setSnippets(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const addSnippet = () => {
    if (!form.title.trim() || !form.code.trim()) return;
    const next: Snippet = {
      id: crypto.randomUUID(),
      title: form.title,
      language: form.language,
      code: form.code,
      createdAt: Date.now(),
    };
    save([next, ...snippets]);
    setForm({ title: "", language: "TypeScript", code: "" });
    setShowForm(false);
  };

  const deleteSnippet = (id: string) =>
    save(snippets.filter((s) => s.id !== id));

  const handleCopy = (id: string, code: string) => {
    copy(code, id);
  };

  const filtered = useMemo(() => {
    return snippets.filter((s) => {
      const matchLang = filterLang === "전체" || s.language === filterLang;
      const matchSearch =
        !search ||
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.code.toLowerCase().includes(search.toLowerCase());
      return matchLang && matchSearch;
    });
  }, [snippets, search, filterLang]);

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="Code Snippet Manager"
      description="자주 사용하는 코드 스니펫을 저장하고 검색합니다. 데이터는 브라우저에 저장됩니다."
      icon={Bookmark}
    >
      <div className="flex flex-col gap-5">
        {/* 검색 + 추가 */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="스니펫 검색..."
              className="w-full rounded-xl border border-border bg-bg-secondary py-2.5 pl-9 pr-4 text-sm text-text-primary placeholder-text-secondary/50 focus:border-brand focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {showForm ? <X size={14} /> : <Plus size={14} />}
            {showForm ? "취소" : "추가"}
          </button>
        </div>

        {/* 언어 필터 */}
        <div className="flex flex-wrap gap-1.5">
          {(["전체", ...LANGUAGES] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setFilterLang(lang as Language | "전체")}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                filterLang === lang
                  ? "border-brand bg-brand/10 text-brand"
                  : "border-border text-text-secondary hover:border-brand/40"
              }`}
            >
              {lang}
            </button>
          ))}
        </div>

        {/* 추가 폼 */}
        {showForm && (
          <div className="rounded-xl border border-brand/40 bg-bg-secondary p-5 flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-text-primary">새 스니펫 추가</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-secondary">제목</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="스니펫 이름"
                  className="rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary focus:border-brand focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-secondary">언어</label>
                <select
                  value={form.language}
                  onChange={(e) => setForm((f) => ({ ...f, language: e.target.value as Language }))}
                  className="rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary focus:border-brand focus:outline-none"
                >
                  {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-secondary">코드</label>
              <textarea
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                placeholder="// 코드를 입력하세요"
                rows={8}
                spellCheck={false}
                className="w-full resize-none rounded-lg border border-border bg-bg-primary p-3 font-mono text-sm text-text-primary focus:border-brand focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={addSnippet}
              disabled={!form.title.trim() || !form.code.trim()}
              className="self-end rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              저장
            </button>
          </div>
        )}

        {/* 스니펫 목록 */}
        <div className="flex flex-col gap-3">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-border py-12 text-center text-sm text-text-secondary">
              {snippets.length === 0 ? "저장된 스니펫이 없습니다." : "검색 결과가 없습니다."}
            </div>
          ) : (
            filtered.map((snippet) => (
              <div key={snippet.id} className="rounded-xl border border-border bg-bg-secondary overflow-hidden">
                <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                  <span className="flex-1 text-sm font-semibold text-text-primary truncate">{snippet.title}</span>
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${LANG_COLORS[snippet.language]}`}>
                    {snippet.language}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(snippet.id, snippet.code)}
                    className="flex items-center gap-1 rounded border border-border px-2 py-1 text-xs text-text-secondary transition-colors hover:border-brand/50 hover:text-brand"
                  >
                    {copiedId === snippet.id ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                    {copiedId === snippet.id ? "복사됨" : "복사"}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteSnippet(snippet.id)}
                    className="text-text-secondary transition-colors hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <pre className="max-h-60 overflow-auto p-4 font-mono text-xs leading-relaxed text-text-primary">
                  {snippet.code}
                </pre>
              </div>
            ))
          )}
        </div>

        {/* 하단 정보 */}
        <p className="text-center text-xs text-text-secondary">
          {snippets.length}개 저장됨 · 데이터는 브라우저 로컬 스토리지에 저장됩니다
        </p>
      </div>
    </ToolPageLayout>
  );
}