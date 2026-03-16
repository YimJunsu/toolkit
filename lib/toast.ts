/* ─────────────────────────────────────────────
   모듈 수준 토스트 싱글톤 — Provider 불필요
   showToast(msg) 를 어디서나 직접 호출 가능
───────────────────────────────────────────── */

type Listener = (msg: string | null) => void;

const listeners = new Set<Listener>();
let currentMsg: string | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;

export function showToast(msg: string, duration = 2000) {
  currentMsg = msg;
  listeners.forEach((l) => l(msg));
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    currentMsg = null;
    listeners.forEach((l) => l(null));
  }, duration);
}

export function subscribeToast(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getToastSnapshot() {
  return currentMsg;
}