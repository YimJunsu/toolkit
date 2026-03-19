"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Timer, Bell, BellOff } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Etc", href: "/tools/etc" },
];

type Mode = "work" | "short" | "long";

const MODE_LABELS: Record<Mode, string> = {
  work: "작업",
  short: "짧은 휴식",
  long: "긴 휴식",
};

const DEFAULT_DURATIONS: Record<Mode, number> = {
  work: 25,
  short: 5,
  long: 15,
};

const NOTIFY_MESSAGES: Record<Mode, { title: string; body: string }> = {
  work:  { title: "🍅 작업 완료!", body: "25분 집중 완료! 잠깐 휴식을 취하세요." },
  short: { title: "☕ 짧은 휴식 종료", body: "다시 집중할 시간입니다. 파이팅!" },
  long:  { title: "🎉 긴 휴식 종료", body: "충분히 쉬셨나요? 새 뽀모도로를 시작하세요!" },
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function beep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch {
    /* AudioContext 미지원 */
  }
}

function sendOsNotification(mode: Mode) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  const { title, body } = NOTIFY_MESSAGES[mode];
  try {
    new Notification(title, { body, icon: "/favicon.ico" });
  } catch {
    /* 알림 전송 실패 */
  }
}

async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window))
    return "denied";
  if (Notification.permission === "granted") return "granted";
  return Notification.requestPermission();
}

const CIRCUMFERENCE = 2 * Math.PI * 54;

export default function PomodoroPage() {
  const [durations, setDurations] = useState<Record<Mode, number>>(DEFAULT_DURATIONS);
  const [mode, setMode] = useState<Mode>("work");
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_DURATIONS.work * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>("default");

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const totalSeconds = durations[mode] * 60;
  const progress = secondsLeft / totalSeconds;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeStr = `${pad(minutes)}:${pad(seconds)}`;

  /* 초기 알림 권한 상태 읽기 */
  useEffect(() => {
    if ("Notification" in window) {
      setNotifPerm(Notification.permission);
    }
  }, []);

  /* 탭 타이틀 업데이트 */
  useEffect(() => {
    document.title = running
      ? `${timeStr} · ${MODE_LABELS[mode]} — Pomodoro`
      : "Pomodoro Timer";
    return () => { document.title = "Pomodoro Timer"; };
  }, [timeStr, mode, running]);

  const nextMode = useCallback(
    (completedSessions: number) => {
      const next =
        mode === "work"
          ? completedSessions % 4 === 0
            ? "long"
            : "short"
          : "work";
      setMode(next);
      setSecondsLeft(durations[next] * 60);
    },
    [mode, durations]
  );

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            beep();
            sendOsNotification(mode);
            setRunning(false);
            setSessions((s) => {
              const next = mode === "work" ? s + 1 : s;
              nextMode(next);
              return next;
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, mode, nextMode]);

  function switchMode(m: Mode) {
    setRunning(false);
    setMode(m);
    setSecondsLeft(durations[m] * 60);
  }

  function handleReset() {
    setRunning(false);
    setSecondsLeft(durations[mode] * 60);
  }

  function handleDurationChange(m: Mode, val: string) {
    const num = Math.max(1, Math.min(99, parseInt(val, 10) || 1));
    setDurations((prev) => ({ ...prev, [m]: num }));
    if (m === mode && !running) {
      setSecondsLeft(num * 60);
    }
  }

  /* 알림 권한 요청 */
  async function handleNotifToggle() {
    if (notifPerm === "granted") return; // granted는 끌 수 없음 (브라우저 정책)
    if (notifPerm === "denied") {
      alert(
        "알림이 차단되어 있습니다.\n브라우저 주소창 왼쪽 자물쇠 아이콘 → 알림 → 허용으로 변경해 주세요."
      );
      return;
    }
    const result = await requestNotificationPermission();
    setNotifPerm(result);
  }

  const notifSupported = typeof window !== "undefined" && "Notification" in window;

  const modeColors: Record<Mode, string> = {
    work:  "rgb(99,102,241)",
    short: "rgb(34,197,94)",
    long:  "rgb(14,165,233)",
  };
  const color = modeColors[mode];

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="Pomodoro Timer"
      description="집중 작업과 휴식을 반복하는 뽀모도로 기법 타이머. 타이머 완료 시 OS 알림을 보냅니다."
      icon={Timer}
    >
      <div className="flex flex-col items-center gap-8">

        {/* OS 알림 권한 배너 */}
        {notifSupported && notifPerm !== "granted" && (
          <div className="flex w-full max-w-sm items-center gap-3 rounded-xl border border-border bg-bg-secondary px-4 py-3">
            <Bell size={15} className="shrink-0 text-brand" />
            <p className="flex-1 text-xs text-text-secondary">
              타이머 완료 시 <strong className="text-text-primary">OS 알림</strong>을 받으려면 권한을 허용하세요.
            </p>
            <button
              type="button"
              onClick={handleNotifToggle}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                notifPerm === "denied"
                  ? "bg-red-500/10 text-red-400"
                  : "bg-brand/10 text-brand hover:bg-brand/20"
              }`}
            >
              {notifPerm === "denied" ? "차단됨" : "허용하기"}
            </button>
          </div>
        )}

        {/* 알림 허용 완료 표시 */}
        {notifSupported && notifPerm === "granted" && (
          <div className="flex w-full max-w-sm items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-2.5">
            <Bell size={13} className="shrink-0 text-emerald-400" />
            <p className="text-xs text-emerald-400">OS 알림 허용됨 — 타이머 완료 시 알림을 보냅니다.</p>
          </div>
        )}

        {/* 모드 선택 */}
        <div className="flex gap-1 rounded-xl border border-border bg-bg-secondary p-1">
          {(["work", "short", "long"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                mode === m
                  ? "bg-bg-primary text-text-primary shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>

        {/* 원형 프로그레스 */}
        <div className="relative flex items-center justify-center">
          <svg width="160" height="160" viewBox="0 0 120 120" className="-rotate-90">
            <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor"
              strokeWidth="8" className="text-border" />
            <circle cx="60" cy="60" r="54" fill="none" stroke={color}
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: "stroke-dashoffset 0.8s linear" }}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="font-mono text-4xl font-bold text-text-primary">{timeStr}</span>
            <span className="mt-1 text-xs text-text-secondary">{MODE_LABELS[mode]}</span>
          </div>
        </div>

        {/* 컨트롤 */}
        <div className="flex items-center gap-4">
          <button type="button" onClick={handleReset}
            className="rounded-xl border border-border bg-bg-secondary px-5 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:text-text-primary">
            리셋
          </button>
          <button type="button" onClick={() => setRunning((r) => !r)}
            className="rounded-xl px-8 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: color }}>
            {running ? "일시정지" : "시작"}
          </button>
          <button type="button" onClick={() => setShowSettings((s) => !s)}
            className="rounded-xl border border-border bg-bg-secondary px-5 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:text-text-primary">
            설정
          </button>
        </div>

        {/* 세션 카운터 */}
        <div className="flex items-center gap-6 rounded-xl border border-border bg-bg-secondary px-6 py-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-text-primary">{sessions}</div>
            <div className="text-xs text-text-secondary">완료 세션</div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-center">
            <div className="text-2xl font-bold text-text-primary">{Math.floor(sessions / 4)}</div>
            <div className="text-xs text-text-secondary">긴 휴식 횟수</div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="flex items-center gap-1.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-3 w-3 rounded-full"
                style={{ background: i < (sessions % 4) ? color : "var(--color-border)" }} />
            ))}
          </div>
        </div>

        {/* 커스텀 설정 */}
        {showSettings && (
          <div className="w-full max-w-sm overflow-hidden rounded-xl border border-border">
            <div className="border-b border-border bg-bg-secondary px-4 py-3 text-xs font-semibold text-text-primary">
              시간 설정 (분)
            </div>
            <div className="divide-y divide-border">
              {(["work", "short", "long"] as Mode[]).map((m) => (
                <div key={m} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-text-secondary">{MODE_LABELS[m]}</span>
                  <input type="number" min={1} max={99} value={durations[m]}
                    onChange={(e) => handleDurationChange(m, e.target.value)}
                    className="w-20 rounded-lg border border-border bg-bg-primary px-3 py-1.5 text-center text-sm text-text-primary focus:border-brand focus:outline-none" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ToolPageLayout>
  );
}
