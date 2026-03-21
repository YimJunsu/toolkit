"use client";

import dynamic from "next/dynamic";
import { useState, useMemo } from "react";
import { Rabbit } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";

// 씬 컴포넌트를 동적으로 불러옴 (SSR 비활성화 - Three.js는 브라우저 전용)
const AnimalRaceScene = dynamic(() => import("./scene"), { ssr: false });

// ─── 타입 정의 ───────────────────────────────────────────────────────────────
export interface Player {
  id: number;
  name: string;
}

export type MapType = "forest" | "desert";

// ─── 상수 ─────────────────────────────────────────────────────────────────────
const ANIMALS = [
  { emoji: "🐎", color: "#c9a227" },
  { emoji: "🐇", color: "#e8e8e8" },
  { emoji: "🦊", color: "#c87941" },
  { emoji: "🐶", color: "#8B5A2B" },
  { emoji: "🐱", color: "#808080" },
  { emoji: "🐷", color: "#ff9eb5" },
  { emoji: "🐄", color: "#2C2C2C" },
  { emoji: "🔔", color: "#f0c040" },
];

// 순위 뱃지 색상
const RANK_BADGE_CLASSES = [
  "bg-yellow-400 text-yellow-900",   // 1위 - 금
  "bg-gray-300 text-gray-800",       // 2위 - 은
  "bg-amber-600 text-amber-50",      // 3위 - 동
  "bg-bg-secondary text-text-secondary", // 4위 이하
];

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "기타", href: "/tools/etc" },
  { label: "커피내기 컬렉션", href: "/tools/etc/coffee-bet" },
];

// ─── 기본 플레이어 생성 함수 ───────────────────────────────────────────────────
function createDefaultPlayers(): Player[] {
  return [
    { id: 0, name: "플레이어 1" },
    { id: 1, name: "플레이어 2" },
  ];
}

// ─── 메인 페이지 컴포넌트 ─────────────────────────────────────────────────────
export default function AnimalRunPage() {
  // 게임 단계: setup → racing → result
  const [phase, setPhase] = useState<"setup" | "racing" | "result">("setup");

  // 플레이어 목록
  const [players, setPlayers] = useState<Player[]>(createDefaultPlayers());

  // 선택된 맵
  const [selectedMap, setSelectedMap] = useState<MapType>("forest");

  // 최종 순위 (player id 배열, 0번 인덱스 = 1등)
  const [finishOrder, setFinishOrder] = useState<number[]>([]);

  // ── 플레이어 이름 변경 ────────────────────────────────────────────────────
  function handleNameChange(id: number, name: string) {
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
  }

  // ── 플레이어 추가 (최대 8명) ───────────────────────────────────────────────
  function handleAddPlayer() {
    if (players.length >= 8) return;
    const newId = players.length;
    setPlayers((prev) => [
      ...prev,
      { id: newId, name: `플레이어 ${newId + 1}` },
    ]);
  }

  // ── 플레이어 제거 (최소 2명) ───────────────────────────────────────────────
  function handleRemovePlayer(id: number) {
    if (players.length <= 2) return;
    // 제거 후 id 재배정
    setPlayers((prev) =>
      prev
        .filter((p) => p.id !== id)
        .map((p, idx) => ({ ...p, id: idx }))
    );
  }

  // ── 레이스 시작 ───────────────────────────────────────────────────────────
  function handleStartRace() {
    setFinishOrder([]);
    setPhase("racing");
    setShowIntroPopup(true);
  }

  // ── 레이스 완료 콜백 (scene.tsx에서 호출됨) ────────────────────────────────
  function handleRaceFinish(orderedIds: number[]) {
    setFinishOrder(orderedIds);
    setPhase("result");
  }

  // 인트로 팝업 (레이싱 시작 전 안내)
  const [showIntroPopup, setShowIntroPopup] = useState(false);

  // ── 다시 하기 ─────────────────────────────────────────────────────────────
  function handleRestart() {
    setPlayers(createDefaultPlayers());
    setSelectedMap("forest");
    setFinishOrder([]);
    setPhase("setup");
  }

  // ── 결과 화면에서 플레이어 이름 찾기 ──────────────────────────────────────
  function getPlayerName(id: number): string {
    return players.find((p) => p.id === id)?.name ?? `플레이어 ${id + 1}`;
  }

  // ── 꼴찌 약올리기 메시지 ──────────────────────────────────────────────────
  const LOSER_TAUNTS = [
    "열심히 달렸는데... 결과가 이래서 어쩌죠 😂",
    "도망가도 소용없어요, 우린 다 봤어요 👀",
    "실력 문제 아니에요. 그냥 운이 없으신 거예요 (전혀 위로 안 됨)",
    "카드 챙기셨죠? 두꺼운 걸로요 💳",
    "최선을 다하셨습니다. 근데 꼴찌는 꼴찌 ☕",
    "이거 어떻게 꼴찌가 될 수 있죠? 신기하네요 진짜",
    "오늘 점심 메뉴는 자책... 아니 아메리카노로 결정!",
  ];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loserTaunt = useMemo(() => LOSER_TAUNTS[Math.floor(Math.random() * LOSER_TAUNTS.length)], [finishOrder.length]);

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════════
          레이싱 전체화면 오버레이 (racing phase) – ToolPageLayout 바깥
          phase가 result로 바뀌면 자동으로 사라져 전체화면 해제됨
      ══════════════════════════════════════════════════════════════════════ */}
      {phase === "racing" && (
        <div className="fixed inset-0 z-[9999] bg-black">
          {showIntroPopup ? (
            /* ── 안내 팝업 ──────────────────────────────────────── */
            <div className="flex h-full w-full items-center justify-center bg-black/80 p-4">
              <div className="w-full max-w-md rounded-3xl border border-white/20 bg-[#0f1117] p-8 text-center shadow-2xl">
                <p className="mb-3 text-5xl">🏁</p>
                <h2 className="text-2xl font-black text-white">동물 달리기</h2>
                <p className="mt-1 text-sm text-white/50">레이스를 시작하기 전에 알아두세요!</p>

                <div className="mt-6 space-y-3 text-left">
                  <div className="flex items-start gap-3 rounded-2xl bg-white/5 p-4">
                    <span className="text-2xl">⚡</span>
                    <div>
                      <p className="text-sm font-bold text-white">부스트 구간</p>
                      <p className="mt-0.5 text-xs text-white/55">초록 발광 구간을 통과하면 순간 가속!</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl bg-white/5 p-4">
                    <span className="text-2xl">🧱</span>
                    <div>
                      <p className="text-sm font-bold text-white">랜덤 장애물</p>
                      <p className="mt-0.5 text-xs text-white/55">레이스 곳곳에 랜덤 장애물이 배치돼 있어요. 충돌하면 잠시 멈춥니다!</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl bg-white/5 p-4">
                    <span className="text-2xl">☕</span>
                    <div>
                      <p className="text-sm font-bold text-white">꼴찌 주의</p>
                      <p className="mt-0.5 text-xs text-white/55">꼴찌가 되면 오늘의 커피는 당신 몫!</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    // 모바일 오디오 잠금 해제: user gesture 내에서 AudioContext 생성/재개
                    if (typeof window !== "undefined") {
                      type W = Window & { __gameAudioCtx?: AudioContext };
                      const W = window as W;
                      const Ctor = window.AudioContext ||
                        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
                      if (Ctor) {
                        try {
                          if (!W.__gameAudioCtx || W.__gameAudioCtx.state === "closed") {
                            W.__gameAudioCtx = new Ctor();
                          }
                          W.__gameAudioCtx.resume().catch(() => {});
                        } catch {}
                      }
                    }
                    setShowIntroPopup(false);
                  }}
                  className="mt-8 w-full rounded-2xl bg-brand py-4 text-lg font-black text-white shadow-lg shadow-brand/30 transition-all hover:brightness-110 active:scale-[0.98]"
                >
                  🚀 시작!
                </button>
              </div>
            </div>
          ) : (
            /* ── 레이스 씬 ──────────────────────────────────────── */
            <AnimalRaceScene
              players={players}
              map={selectedMap}
              onFinish={handleRaceFinish}
            />
          )}
        </div>
      )}

    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="동물 달리기"
      description="최대 8마리의 동물이 달리는 3D 레이스! 커피 살 사람은 꼴찌~"
      icon={Rabbit}
    >
      {/* ══════════════════════════════════════════════════════════════════════
          설정 화면 (setup phase)
      ══════════════════════════════════════════════════════════════════════ */}
      {phase === "setup" && (
        <div className="mx-auto max-w-2xl space-y-8">
          {/* 플레이어 설정 */}
          <section className="rounded-2xl border border-border bg-bg-secondary p-6">
            <h2 className="mb-4 text-lg font-bold text-text-primary">
              🐾 참가 동물 설정
            </h2>
            <div className="space-y-3">
              {players.map((player, idx) => (
                <div key={player.id} className="flex items-center gap-3">
                  {/* 동물 이모지 */}
                  <span className="text-2xl w-8 text-center select-none">
                    {ANIMALS[idx]?.emoji ?? "🐾"}
                  </span>
                  {/* 이름 입력 */}
                  <input
                    type="text"
                    value={player.name}
                    onChange={(e) => handleNameChange(player.id, e.target.value)}
                    placeholder={`플레이어 ${idx + 1}`}
                    maxLength={12}
                    className="flex-1 rounded-xl border border-border bg-white/5 px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                  {/* 제거 버튼 (3명 이상일 때만 표시) */}
                  {players.length > 2 && (
                    <button
                      onClick={() => handleRemovePlayer(player.id)}
                      className="flex size-9 items-center justify-center rounded-xl border border-border text-text-secondary transition-colors hover:border-red-400 hover:text-red-400"
                      aria-label="플레이어 제거"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* 플레이어 추가 버튼 (8명 미만일 때만 표시) */}
            {players.length < 8 && (
              <button
                onClick={handleAddPlayer}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-2.5 text-sm text-text-secondary transition-colors hover:border-brand hover:text-brand"
              >
                <span className="text-lg">+</span>
                동물 추가하기 ({players.length}/8)
              </button>
            )}
          </section>

          {/* 맵 선택 */}
          <section className="rounded-2xl border border-border bg-bg-secondary p-6">
            <h2 className="mb-4 text-lg font-bold text-text-primary">
              🗺️ 레이스 맵 선택
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {/* 숲 속 레이스 */}
              <button
                onClick={() => setSelectedMap("forest")}
                className={`flex flex-col items-center gap-3 rounded-2xl border-2 p-6 transition-all ${
                  selectedMap === "forest"
                    ? "border-brand bg-brand/10 shadow-lg shadow-brand/10"
                    : "border-border hover:border-brand/40"
                }`}
              >
                <span className="text-5xl">🌲</span>
                <div className="text-center">
                  <p className="font-bold text-text-primary">숲 속 레이스</p>
                  <p className="mt-1 text-xs text-text-secondary">
                    나무 사이를 달려라!
                  </p>
                </div>
                {selectedMap === "forest" && (
                  <span className="rounded-full bg-brand px-3 py-0.5 text-xs font-semibold text-white">
                    선택됨
                  </span>
                )}
              </button>

              {/* 사막 질주 */}
              <button
                onClick={() => setSelectedMap("desert")}
                className={`flex flex-col items-center gap-3 rounded-2xl border-2 p-6 transition-all ${
                  selectedMap === "desert"
                    ? "border-brand bg-brand/10 shadow-lg shadow-brand/10"
                    : "border-border hover:border-brand/40"
                }`}
              >
                <span className="text-5xl">🌵</span>
                <div className="text-center">
                  <p className="font-bold text-text-primary">사막 질주</p>
                  <p className="mt-1 text-xs text-text-secondary">
                    뜨거운 모래 위를 달려라!
                  </p>
                </div>
                {selectedMap === "desert" && (
                  <span className="rounded-full bg-brand px-3 py-0.5 text-xs font-semibold text-white">
                    선택됨
                  </span>
                )}
              </button>
            </div>
          </section>

          {/* 레이스 시작 버튼 */}
          <button
            onClick={handleStartRace}
            className="w-full rounded-2xl bg-brand py-4 text-lg font-bold text-white shadow-lg shadow-brand/20 transition-all hover:brightness-110 active:scale-[0.98]"
          >
            🏁 레이스 시작!
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          결과 화면 (result phase)
      ══════════════════════════════════════════════════════════════════════ */}
      {phase === "result" && (
        <div className="mx-auto max-w-lg space-y-5">
          <style>{`
            @keyframes arPop{from{transform:scale(.3) rotate(-12deg);opacity:0}70%{transform:scale(1.1) rotate(1deg)}to{transform:scale(1) rotate(0);opacity:1}}
            @keyframes arShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-7px) rotate(-2deg)}40%{transform:translateX(7px) rotate(2deg)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
            @keyframes arFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
            @keyframes arFadeUp{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}
            @keyframes arSpin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
            @keyframes arPulseRed{0%,100%{box-shadow:0 0 0 0 rgba(248,113,113,.5)}50%{box-shadow:0 0 0 12px rgba(248,113,113,0)}}
          `}</style>

          {/* 🏆 1등 winner 카드 */}
          {finishOrder.length > 0 && (
            <div
              style={{ animation: "arPop .55s cubic-bezier(.175,.885,.32,1.275) both" }}
              className="relative overflow-hidden rounded-2xl border-2 border-yellow-500/50 bg-gradient-to-br from-yellow-500/20 via-amber-400/10 to-transparent p-5 text-center"
            >
              {/* 배경 파티클 */}
              {["✨","⭐","🌟","💫","✨"].map((e, i) => (
                <span key={i} aria-hidden style={{
                  position:"absolute", pointerEvents:"none", userSelect:"none",
                  left:`${8+i*20}%`, top:`${8+i*12}%`, fontSize:"1.1rem", opacity:.55,
                  animation:`arFloat ${1.7+i*.25}s ease-in-out infinite ${i*.35}s`,
                }}>{e}</span>
              ))}
              <p style={{ animation: "arFloat 2s ease-in-out infinite" }} className="text-4xl">🏆</p>
              <p className="mt-1 text-[10px] font-black tracking-[.3em] text-yellow-400 uppercase">1등 · Winner</p>
              <p className="mt-1 text-2xl font-black text-text-primary">{getPlayerName(finishOrder[0])}</p>
              <p className="mt-1 text-sm text-yellow-500/80">🎉 오늘 커피 공짜! 기분 좋으시죠?</p>
            </div>
          )}

          {/* ☕ 꼴찌 수치 카드 */}
          {finishOrder.length > 0 && (
            <div
              style={{ animation: "arShake .65s ease-out .35s both, arPulseRed 1.8s ease-in-out .9s infinite" }}
              className="rounded-2xl border-2 border-red-400/60 bg-red-500/10 p-6 text-center"
            >
              <p style={{ animation: "arFloat 1.4s ease-in-out infinite .2s" }} className="text-5xl">☕</p>
              <p className="mt-2 text-[10px] font-black tracking-[.3em] text-red-400/70 uppercase">Loser · 커피 셔틀 확정</p>
              <p className="mt-1 text-3xl font-black text-red-400">{getPlayerName(finishOrder[finishOrder.length - 1])}</p>
              <div className="mt-3 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-2.5">
                <p className="text-sm font-semibold text-text-primary">{loserTaunt}</p>
              </div>
              <p className="mt-2 text-xs text-text-secondary/60">꼴찌 공식 인증 🔖 · 커피 한 잔 부탁드려요 🥹</p>
            </div>
          )}

          {/* 📊 전체 순위 */}
          <div
            style={{ animation: "arFadeUp .4s ease-out .6s both" }}
            className="rounded-2xl border border-border bg-bg-secondary p-5"
          >
            <h3 className="mb-3 text-sm font-bold text-text-primary">📊 전체 순위</h3>
            <ol className="space-y-2">
              {finishOrder.map((playerId, rankIdx) => {
                const isFirst = rankIdx === 0;
                const isLast  = rankIdx === finishOrder.length - 1;
                const badge   = RANK_BADGE_CLASSES[rankIdx] ?? RANK_BADGE_CLASSES[3];
                const emoji   = ANIMALS[playerId]?.emoji ?? "🐾";
                const MEDALS  = ["🥇","🥈","🥉"];
                return (
                  <li
                    key={playerId}
                    className={`flex items-center gap-3 rounded-xl px-4 py-2.5 transition-all ${
                      isFirst ? "bg-yellow-500/10 ring-1 ring-yellow-500/30"
                      : isLast ? "bg-red-500/10 ring-1 ring-red-400/30"
                      : "bg-white/5"
                    }`}
                  >
                    <span className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${badge}`}>
                      {rankIdx + 1}
                    </span>
                    <span className="text-lg">{emoji}</span>
                    <span className={`flex-1 text-sm font-semibold ${isLast ? "text-red-400" : isFirst ? "text-yellow-400" : "text-text-primary"}`}>
                      {getPlayerName(playerId)}
                    </span>
                    <span className="text-sm">
                      {isLast ? "☕ 당번" : MEDALS[rankIdx] ?? ""}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* 다시 하기 */}
          <button
            onClick={handleRestart}
            className="w-full rounded-2xl border-2 border-brand py-4 text-lg font-bold text-brand transition-all hover:bg-brand hover:text-white active:scale-[0.98]"
          >
            🔄 다시 하기
          </button>
        </div>
      )}
    </ToolPageLayout>
    </>
  );
}