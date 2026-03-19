"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X, ArrowRight, Command } from "lucide-react";
import { CATEGORIES } from "@/lib/constants/categories";
import { TOOLS_BY_CATEGORY } from "@/lib/constants/tools";
import { toolStorage } from "@/lib/toolStorage";
import type { ToolItem } from "@/lib/constants/tools";

const ALL_TOOLS: ToolItem[] = CATEGORIES.flatMap(
  (c) => TOOLS_BY_CATEGORY[c.id] ?? []
);

interface SpotlightSearchProps {
  open: boolean;
  onClose: () => void;
}

export function SpotlightSearch({ open, onClose }: SpotlightSearchProps) {
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const router = useRouter();

  const results =
    query.trim().length === 0
      ? ALL_TOOLS.slice(0, 8)
      : ALL_TOOLS.filter(
          (t) =>
            t.label.toLowerCase().includes(query.toLowerCase()) ||
            t.description.toLowerCase().includes(query.toLowerCase()) ||
            t.keywords?.some((kw) =>
              kw.toLowerCase().includes(query.toLowerCase())
            )
        ).slice(0, 10);

  /* 열릴 때 포커스 */
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setCursor(0);
    }
  }, [open]);

  /* 키보드 네비게이션 */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setCursor((p) => Math.min(p + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setCursor((p) => Math.max(p - 1, 0));
      } else if (e.key === "Enter" && results[cursor]) {
        navigate(results[cursor]);
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [results, cursor, onClose]
  );

  const navigate = (tool: ToolItem) => {
    toolStorage.addRecent(tool.id);
    router.push(tool.href);
    onClose();
  };

  /* 커서 스크롤 유지 */
  useEffect(() => {
    const li = listRef.current?.children[cursor] as HTMLLIElement | undefined;
    li?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  if (!open) return null;

  return (
    <>
      {/* backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* modal */}
      <div className="fixed inset-x-0 top-[10vh] z-[70] mx-auto max-w-xl px-4">
        <div className="overflow-hidden rounded-2xl border border-border bg-bg-primary shadow-2xl">
          {/* 검색 입력 */}
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <Search size={16} className="shrink-0 text-text-secondary" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setCursor(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="도구 검색… (예: hex, jwt, hash)"
              className="flex-1 bg-transparent text-sm text-text-primary placeholder-text-secondary/50 focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-text-secondary hover:text-text-primary"
              >
                <X size={14} />
              </button>
            )}
            <kbd className="hidden rounded border border-border bg-bg-secondary px-1.5 py-0.5 text-xs text-text-secondary sm:block">
              Esc
            </kbd>
          </div>

          {/* 결과 목록 */}
          <ul
            ref={listRef}
            className="max-h-80 overflow-y-auto py-2"
            role="listbox"
          >
            {results.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-text-secondary">
                검색 결과가 없습니다
              </li>
            ) : (
              results.map((tool, i) => {
                const Icon = tool.icon;
                return (
                  <li key={tool.id} role="option" aria-selected={cursor === i}>
                    <button
                      type="button"
                      onClick={() => navigate(tool)}
                      onMouseEnter={() => setCursor(i)}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        cursor === i
                          ? "bg-brand/10 text-text-primary"
                          : "text-text-primary hover:bg-bg-secondary"
                      }`}
                    >
                      <div
                        className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                          cursor === i ? "bg-brand/20" : "bg-brand/10"
                        }`}
                      >
                        <Icon size={15} className="text-brand" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{tool.label}</p>
                        <p className="truncate text-xs text-text-secondary">
                          {tool.description}
                        </p>
                      </div>
                      {cursor === i && (
                        <ArrowRight
                          size={14}
                          className="shrink-0 text-brand/60"
                        />
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>

          {/* 바닥 힌트 */}
          <div className="flex items-center gap-4 border-t border-border px-4 py-2.5 text-xs text-text-secondary">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-bg-secondary px-1 py-px">
                ↑↓
              </kbd>
              이동
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-bg-secondary px-1 py-px">
                Enter
              </kbd>
              열기
            </span>
            <span className="ml-auto flex items-center gap-1 opacity-50">
              <Command size={11} />K
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── 전역 Cmd/Ctrl+K 리스너를 추가하는 훅 ── */
export function useSpotlightSearch() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return { open, setOpen };
}
