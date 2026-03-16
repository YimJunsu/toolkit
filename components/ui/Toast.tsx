"use client";

import { useSyncExternalStore } from "react";
import { Check } from "lucide-react";
import { subscribeToast, getToastSnapshot } from "@/lib/toast";

export function Toast() {
  const msg = useSyncExternalStore(
    subscribeToast,
    getToastSnapshot,
    () => null,
  );

  if (!msg) return null;

  return (
    <div
      key={msg}
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border border-brand/40 bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-xl"
      style={{ animation: "toast-slide-in 0.2s ease-out forwards" }}
    >
      <Check size={14} strokeWidth={2.5} />
      {msg}
    </div>
  );
}