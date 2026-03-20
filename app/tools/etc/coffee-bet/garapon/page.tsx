"use client";

import dynamic from "next/dynamic";
import { useState, useCallback, useEffect } from "react";
import { Gamepad2, Plus, Minus, RotateCcw, Coffee, Shuffle } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";

// ─────────────────────────────────────────────────────────────────────────────
// 플레이어 인터페이스
// ─────────────────────────────────────────────────────────────────────────────
export interface Player {
  id: number;
  name: string;
}

const GaraponScene = dynamic(
  () => import("./scene"),
  { ssr: false }
);

// MAX_SPINS도 scene에서 가져오기 (동적 import이므로 상수는 여기서도 선언)
const MAX_SPINS = 4;

// ─────────────────────────────────────────────────────────────────────────────
// 상수 & 타입
// ─────────────────────────────────────────────────────────────────────────────
type GamePhase = "setup" | "spinning" | "round-safe" | "result";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "기타", href: "/tools/etc" },
  { label: "커피내기 컬렉션", href: "/tools/etc/coffee-bet" },
];

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 8;

const PLAYER_COLORS = [
  "#ff4444", "#44aaff", "#44cc44", "#ffaa00",
  "#ff44ff", "#00bbcc", "#ff8800", "#8844ff",
];

const FUN_NAMES = ["김민준", "이서윤", "박도윤", "최지우", "정예준", "강하은", "조시우", "윤서연", "장민서", "임지호"];

let nextId = 1;
function makePlayer(name = ""): Player {
  return { id: nextId++, name };
}

const DEFAULT_PLAYERS: Player[] = [makePlayer("플레이어 1"), makePlayer("플레이어 2")];

// ─────────────────────────────────────────────────────────────────────────────
// BallDisplay – 탈출한 공 목록
// ─────────────────────────────────────────────────────────────────────────────
function BallDisplay({
  safePlayers,
  allPlayers,
  totalPlayers,
}: {
  safePlayers: Player[];
  allPlayers: Player[];
  totalPlayers: number;
}) {
  const getColor = (player: Player) => {
    const idx = allPlayers.findIndex((p) => p.id === player.id);
    return PLAYER_COLORS[idx % PLAYER_COLORS.length];
  };

  return (
    <div className="w-full shrink-0 rounded-2xl border border-border bg-bg-secondary p-4 lg:w-52">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-text-primary">탈출한 공</p>
        <span className="rounded-full bg-bg-primary px-2 py-0.5 text-xs font-medium text-text-secondary">
          {safePlayers.length} / {totalPlayers - 1}
        </span>
      </div>
      {safePlayers.length === 0 ? (
        <p className="py-6 text-center text-xs text-text-secondary">아직 탈출한 공이 없어요</p>
      ) : (
        <div className="space-y-2">
          {safePlayers.map((p, idx) => (
            <div
              key={p.id}
              className="flex items-center gap-2.5 rounded-xl border border-green-500/20 bg-green-500/5 px-3 py-2"
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white shadow"
                style={{ backgroundColor: getColor(p) }}
              >
                {idx + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text-primary">{p.name}</p>
                <p className="text-xs text-green-500">✅ 탈출</p>
              </div>
            </div>
          ))}
        </div>
      )}
      {safePlayers.length < totalPlayers - 1 && (
        <div className="mt-3 border-t border-border pt-3">
          <p className="text-xs text-text-secondary">대기 중</p>
          <p className="mt-0.5 text-sm font-semibold text-text-primary">
            {totalPlayers - safePlayers.length}명 남음
          </p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 메인 페이지
// ─────────────────────────────────────────────────────────────────────────────
export default function GaraponPage() {
  const [phase, setPhase]     = useState<GamePhase>("setup");
  const [players, setPlayers] = useState<Player[]>(DEFAULT_PLAYERS);
  const [loserId, setLoserId] = useState<number | null>(null);
  const [spinCount, setSpinCount] = useState(0);   // 버튼 클릭 횟수

  // 멀티라운드 상태
  const [revealOrder, setRevealOrder]           = useState<number[]>([]);
  const [currentRevealIdx, setCurrentRevealIdx] = useState(0);
  const [safeIds, setSafeIds]                   = useState<number[]>([]);
  const [justSafeId, setJustSafeId]             = useState<number | null>(null);
  const [sceneKey, setSceneKey]                 = useState(0);

  // 파생 값
  const isMultiRound     = players.length > 2;
  const safePlayers      = safeIds.map((id) => players.find((p) => p.id === id)!).filter(Boolean);
  const remainingPlayers = players.filter((p) => !safeIds.includes(p.id));
  const justSafePlayer   = players.find((p) => p.id === justSafeId) ?? null;
  const currentTargetId  = isMultiRound ? revealOrder[currentRevealIdx] : undefined;

  // ── 플레이어 관리 ────────────────────────────────────────────────────────
  const addPlayer = useCallback(() => {
    if (players.length >= MAX_PLAYERS) return;
    setPlayers((prev) => [...prev, makePlayer(`플레이어 ${prev.length + 1}`)]);
  }, [players.length]);

  const removePlayer = useCallback((id: number) => {
    if (players.length <= MIN_PLAYERS) return;
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  }, [players.length]);

  const updateName = useCallback((id: number, name: string) => {
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
  }, []);

  const shuffleNames = useCallback(() => {
    const shuffled = [...FUN_NAMES].sort(() => Math.random() - 0.5).slice(0, players.length);
    setPlayers((prev) => prev.map((p, i) => ({ ...p, name: shuffled[i] ?? p.name })));
  }, [players.length]);

  // ── 게임 시작 ────────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    const filled = players.map((p, i) => ({
      ...p,
      name: p.name.trim() || `플레이어 ${i + 1}`,
    }));
    setPlayers(filled);
    if (filled.length > 2) {
      const shuffled = [...filled].sort(() => Math.random() - 0.5);
      setRevealOrder(shuffled.map((p) => p.id));
      setCurrentRevealIdx(0);
      setSafeIds([]);
      setJustSafeId(null);
      setSceneKey(0);
    }
    setSpinCount(0);
    setPhase("spinning");
  }, [players]);

  // ── 핸들 돌리기 (버튼 / 스페이스바) ────────────────────────────────────
  const handleSpin = useCallback(() => {
    if (spinCount >= MAX_SPINS || phase !== "spinning") return;
    setSpinCount((prev) => prev + 1);
  }, [spinCount, phase]);

  // 스페이스바 리스너
  useEffect(() => {
    if (phase !== "spinning") return;
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();
        handleSpin();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, handleSpin]);

  // ── 결과 수신 ────────────────────────────────────────────────────────────
  const handleResult = useCallback((id: number) => {
    if (!isMultiRound) {
      setLoserId(id);
      setPhase("result");
      return;
    }
    const isLoserRound = currentRevealIdx === revealOrder.length - 1;
    if (isLoserRound) {
      setLoserId(id);
      setPhase("result");
    } else {
      setSafeIds((prev) => [...prev, id]);
      setJustSafeId(id);
      setCurrentRevealIdx((prev) => prev + 1);
      setPhase("round-safe");
    }
  }, [isMultiRound, currentRevealIdx, revealOrder.length]);

  // ── 다음 라운드 ──────────────────────────────────────────────────────────
  const continueGame = useCallback(() => {
    setJustSafeId(null);
    setSpinCount(0);
    setSceneKey((prev) => prev + 1);
    setPhase("spinning");
  }, []);

  // ── 다시 하기 ────────────────────────────────────────────────────────────
  const resetGame = useCallback(() => {
    setPhase("setup");
    setLoserId(null);
    setSafeIds([]);
    setJustSafeId(null);
    setRevealOrder([]);
    setCurrentRevealIdx(0);
    setSceneKey(0);
    setSpinCount(0);
  }, []);

  const loser = players.find((p) => p.id === loserId);

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="가라폰"
      description="핸들을 돌려서 커피 살 사람을 뽑아보세요! 3D 일본식 가라폰 구슬 뽑기 머신."
      icon={Gamepad2}
    >
      {/* ═══════════════════════════════ SETUP ══════════════════════════════ */}
      {phase === "setup" && (
        <div className="mx-auto max-w-lg space-y-8">
          {/* 플레이어 입력 */}
          <div className="rounded-2xl border border-border bg-bg-secondary p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-text-primary">
                참가자 ({players.length}/{MAX_PLAYERS}명)
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={shuffleNames}
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-bg-primary px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-secondary hover:text-brand"
                  title="이름 랜덤 배정"
                >
                  <Shuffle size={13} />
                  랜덤 이름
                </button>
                <button
                  onClick={addPlayer}
                  disabled={players.length >= MAX_PLAYERS}
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-bg-primary px-3 py-1.5 text-xs font-medium text-text-primary transition-colors hover:bg-bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus size={14} />
                  추가
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              {players.map((player, idx) => (
                <div key={player.id} className="flex items-center gap-2.5">
                  <span
                    className="flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: PLAYER_COLORS[idx % PLAYER_COLORS.length] }}
                  >
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={player.name}
                    onChange={(e) => updateName(player.id, e.target.value)}
                    placeholder={`플레이어 ${idx + 1}`}
                    maxLength={10}
                    className="min-w-0 flex-1 rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-brand/40"
                  />
                  <button
                    onClick={() => removePlayer(player.id)}
                    disabled={players.length <= MIN_PLAYERS}
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border text-text-secondary transition-colors hover:border-red-400 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="참가자 제거"
                  >
                    <Minus size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-lg border border-dashed border-border bg-bg-primary px-4 py-3 text-center">
              {players.length === 2 ? (
                <p className="text-xs text-text-secondary">
                  ☕ 뽑힌 한 명이 <strong className="text-text-primary">꽝!</strong> — 커피를 사게 됩니다.
                </p>
              ) : (
                <p className="text-xs text-text-secondary">
                  🎯 꽝이 나올 때까지 계속 뽑기!{" "}
                  <strong className="text-text-primary">{players.length - 1}번</strong> 탈출 후 마지막 한 명이 꽝!
                </p>
              )}
            </div>
          </div>

          <button
            onClick={startGame}
            className="w-full rounded-2xl bg-brand py-4 text-lg font-bold text-white shadow-lg transition-all hover:brightness-110 active:scale-95"
          >
            기계 작동 시작
          </button>
        </div>
      )}

      {/* ══════════════════════════════ SPINNING ════════════════════════════ */}
      {phase === "spinning" && (
        <div className={`mx-auto space-y-4 ${isMultiRound ? "max-w-4xl" : "max-w-2xl"}`}>
          <div className={`flex gap-4 ${isMultiRound ? "flex-col lg:flex-row" : "flex-col"}`}>
            {/* 3D 씬 */}
            <div className="min-w-0 flex-1">
              <GaraponScene
                key={sceneKey}
                players={isMultiRound ? remainingPlayers : players}
                onResult={handleResult}
                targetPlayerId={currentTargetId}
                spinCount={spinCount}
              />
            </div>
            {isMultiRound && (
              <BallDisplay
                safePlayers={safePlayers}
                allPlayers={players}
                totalPlayers={players.length}
              />
            )}
          </div>

          {/* ── 핸들 돌리기 버튼 ── */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={handleSpin}
              disabled={spinCount >= MAX_SPINS}
              className={`w-full max-w-sm rounded-2xl py-4 text-lg font-bold shadow-lg transition-all active:scale-95
                ${spinCount >= MAX_SPINS
                  ? "cursor-not-allowed bg-bg-secondary text-text-secondary"
                  : "bg-brand text-white hover:brightness-110"
                }`}
            >
              {spinCount >= MAX_SPINS
                ? "⚙️ 기계 작동 중..."
                : `🔄 핸들 돌리기 (${MAX_SPINS - spinCount}번 남음)`}
            </button>
            {spinCount < MAX_SPINS && (
              <p className="text-xs text-text-secondary/60">
                💻 스페이스바로도 돌릴 수 있어요
              </p>
            )}
          </div>

          {/* 2인 모드: 참가자 목록 */}
          {!isMultiRound && (
            <div className="rounded-xl border border-border bg-bg-secondary p-4">
              <p className="mb-2 text-xs font-medium text-text-secondary">참가자</p>
              <div className="flex flex-wrap gap-2">
                {players.map((p, i) => (
                  <span
                    key={p.id}
                    className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                    style={{ backgroundColor: PLAYER_COLORS[i % PLAYER_COLORS.length] }}
                  >
                    {p.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 멀티라운드: 라운드 진행 표시 */}
          {isMultiRound && (
            <div className="rounded-xl border border-border bg-bg-secondary p-3 text-center">
              <p className="text-sm font-semibold text-text-primary">
                {currentRevealIdx + 1} / {revealOrder.length}번째 뽑기
                {currentRevealIdx === revealOrder.length - 1 && (
                  <span className="ml-2 animate-pulse text-orange-500">⚡ 마지막 공!</span>
                )}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════ ROUND-SAFE ══════════════════════════════ */}
      {phase === "round-safe" && justSafePlayer && (
        <div className="mx-auto max-w-4xl space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="flex-1 overflow-hidden rounded-2xl border border-border bg-bg-secondary shadow-lg">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-5 text-center">
                <div className="mb-2 text-5xl">✅</div>
                <h2 className="text-2xl font-extrabold text-white">탈출 성공!</h2>
              </div>
              <div className="px-6 py-8 text-center">
                <div
                  className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-extrabold text-white shadow-lg"
                  style={{
                    backgroundColor:
                      PLAYER_COLORS[players.findIndex((p) => p.id === justSafePlayer.id) % PLAYER_COLORS.length],
                  }}
                >
                  {players.findIndex((p) => p.id === justSafePlayer.id) + 1}
                </div>
                <p className="text-3xl font-extrabold text-text-primary">{justSafePlayer.name}</p>
                <p className="mt-2 text-lg font-semibold text-green-500">☕ 커피 안 사도 됩니다!</p>
                <p className="mt-4 text-sm text-text-secondary">
                  아직 <strong className="text-text-primary">{remainingPlayers.length}명</strong>이 남았어요
                </p>
              </div>
              <div className="border-t border-border px-6 pb-6">
                <button
                  onClick={continueGame}
                  className="w-full rounded-xl bg-brand py-3 text-base font-bold text-white transition-all hover:brightness-110 active:scale-95"
                >
                  계속 뽑기! →
                </button>
              </div>
            </div>
            <BallDisplay
              safePlayers={safePlayers}
              allPlayers={players}
              totalPlayers={players.length}
            />
          </div>
        </div>
      )}

      {/* ════════════════════════════ RESULT ════════════════════════════════ */}
      {phase === "result" && (
        <div className={`mx-auto space-y-6 ${isMultiRound ? "max-w-4xl" : "max-w-lg"}`}>
          <div className={`flex gap-4 ${isMultiRound ? "flex-col lg:flex-row" : "flex-col"}`}>
            <div className="flex-1 overflow-hidden rounded-2xl border border-border bg-bg-secondary shadow-lg">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-5 text-center">
                <Coffee size={40} className="mx-auto mb-2 text-white" />
                <h2 className="text-2xl font-extrabold text-white">
                  {isMultiRound ? "꽝 공 출현!" : "결과 발표!"}
                </h2>
              </div>
              <div className="px-6 py-8 text-center">
                {loser ? (
                  <>
                    <div className="mb-4 text-6xl">☕</div>
                    <p className="text-xl font-semibold text-text-secondary">오늘의 커피 당번은...</p>
                    <p className="mt-3 text-4xl font-extrabold text-text-primary">{loser.name}</p>
                    <p className="mt-3 text-lg font-bold text-orange-500">
                      ☕ {loser.name}님! 커피 사세요!
                    </p>
                  </>
                ) : (
                  <p className="text-text-secondary">결과를 불러오는 중...</p>
                )}
              </div>
              <div className="border-t border-border px-6 pb-6">
                <p className="mb-3 text-sm font-semibold text-text-secondary">전체 결과</p>
                <div className="space-y-2">
                  {players.map((p, i) => {
                    const isLoser   = p.id === loserId;
                    const safeOrder = safeIds.indexOf(p.id);
                    return (
                      <div
                        key={p.id}
                        className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
                          isLoser
                            ? "border border-orange-400/40 bg-orange-500/10"
                            : "border border-border bg-bg-primary"
                        }`}
                      >
                        <span
                          className="flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                          style={{ backgroundColor: PLAYER_COLORS[i % PLAYER_COLORS.length] }}
                        >
                          {i + 1}
                        </span>
                        <span className={`flex-1 font-medium ${isLoser ? "text-orange-500" : "text-text-primary"}`}>
                          {p.name}
                        </span>
                        <span className="text-sm">
                          {isLoser
                            ? "☕ 꽝!"
                            : isMultiRound
                            ? `✅ ${safeOrder + 1}번째 탈출`
                            : "✅ 통과"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            {isMultiRound && (
              <BallDisplay
                safePlayers={safePlayers}
                allPlayers={players}
                totalPlayers={players.length}
              />
            )}
          </div>

          <button
            onClick={resetGame}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-bg-secondary py-4 text-base font-semibold text-text-primary transition-colors hover:bg-bg-primary"
          >
            <RotateCcw size={18} />
            다시 하기
          </button>
        </div>
      )}
    </ToolPageLayout>
  );
}
