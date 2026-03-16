"use client";

import { useState } from "react";
import { showToast } from "@/lib/toast";

/**
 * 클립보드 복사 + 브랜드 토스트 알림 통합 훅
 * copy(text, key) — key 로 버튼별 체크 표시를 제어
 */
export function useClipboard() {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (text: string, key: string = "default") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      showToast("복사됨!");
      setTimeout(() => setCopied(null), 1600);
    } catch {
      // 클립보드 접근 불가 환경 대응
    }
  };

  return { copied, copy };
}