"use client";

/**
 * AnimalRaceScene – 3D 동물 달리기 씬
 *
 * ── 성능 전략 ──
 *  - 배경/장애물: InstancedMesh → 드로우 콜 극소화
 *  - shadows 없음 → Environment IBL로 대체 (더 고급스러운 결과)
 *  - dpr=1, antialias=false + Bloom 포스트 프로세싱으로 보상
 *
 * ── 화면 방향 ──
 *  - 카메라: 트랙 오른쪽(+X) 배치, 왼쪽 바라봄 → 동물이 오른쪽→왼쪽으로 달림
 */

import { useRef, useState, useMemo, useEffect, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, Sky } from "@react-three/drei";
import * as THREE from "three";
import type { Player, MapType } from "./page";

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  players: Player[];
  map: MapType;
  onFinish: (orderedIds: number[]) => void;
}

// ─── 레이스 상수 ──────────────────────────────────────────────────────────────
const RACE_LENGTH   = 160;
const LANE_WIDTH    = 2.2;
const FINISH_LINE_Z = -RACE_LENGTH;

// 동물별 색상·이모지 (최대 8)
const ANIMAL_COLORS = [
  "#d4a820", "#e8e8e8", "#c87030", "#7a4a1e",
  "#8888aa", "#ff88aa", "#333344", "#f0c020",
];
const ANIMAL_EMOJIS = ["🐎","🐇","🦊","🐶","🐱","🐷","🐄","🐔"];

// ─── 레이스 상태 (ref 관리 → 리렌더 제로) ───────────────────────────────────
interface AnimalState {
  id: number; name: string; index: number;
  z: number; speed: number; baseSpeed: number;
  laneX: number; finished: boolean;
  stunTimer: number; boostTimer: number; speedFluctTimer: number;
}
interface Obstacle  { x: number; z: number; }
interface RankEntry { id: number; name: string; z: number; }

// ═══════════════════════════════════════════════════════════════════════════════
// 배경음악 훅 – Web Audio API 프로시저럴 생성 (저작권 없음, AdSense 안전)
// C장조 펜타토닉 스케일 기반 신나는 루프 멜로디 + 베이스
// ═══════════════════════════════════════════════════════════════════════════════
function useBackgroundMusic() {
  const ctxRef   = useRef<AudioContext | null>(null);
  const gainRef  = useRef<GainNode | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stRef    = useRef({ nIdx: 0, nTime: 0, bIdx: 0, bTime: 0 });
  const stoppedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    stoppedRef.current = false;

    // 모바일 대응: 팝업 버튼 클릭 시 미리 생성된 AudioContext 재사용
    // (iOS/Android는 useEffect가 비동기이므로 user gesture 내 생성된 ctx 사용)
    type W = Window & { __gameAudioCtx?: AudioContext };
    const primed = (window as W).__gameAudioCtx;
    const useExisting = !!primed && primed.state !== "closed";

    let ctx: AudioContext;
    let ownsCtx: boolean;
    if (useExisting) {
      ctx = primed!;
      ownsCtx = false;
    } else {
      const C = window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new C();
      ownsCtx = true;
    }
    ctxRef.current = ctx;
    ctx.resume().catch(() => {});

    const master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(ctx.destination);
    gainRef.current = master;

    // 148 BPM
    const B = 60 / 148;

    // C장조 펜타토닉 신나는 멜로디 패턴 [주파수Hz, 박자수]
    const MEL: [number, number][] = [
      [523, 0.5], [659, 0.5], [784, 0.5], [659, 0.5],
      [523, 0.5], [659, 1.0],
      [523, 0.5], [440, 0.5], [392, 0.5], [440, 0.5],
      [523, 0.5], [659, 0.5], [784, 1.0],
      [880, 0.5], [784, 0.5], [659, 0.5], [784, 1.0],
      [659, 0.5], [523, 0.5], [440, 0.5], [392, 0.5],
      [523, 1.5],
    ];
    // 베이스 패턴 (C3 G3 F3 G3)
    const BASS: [number, number][] = [
      [130.81, 2], [196.00, 2], [174.61, 2], [196.00, 2],
    ];

    const playN = (f: number, s: number, d: number, v: number, t: OscillatorType = "square") => {
      if (stoppedRef.current) return;
      try {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = t; o.frequency.value = f;
        g.gain.setValueAtTime(v, s);
        g.gain.exponentialRampToValueAtTime(0.001, s + d - 0.02);
        o.connect(g); g.connect(master);
        o.start(s); o.stop(s + d);
      } catch { /* 언마운트 후 ctx closed 예외 무시 */ }
    };

    const st = stRef.current;

    const tick = () => {
      if (stoppedRef.current) return;
      const ahead = ctx.currentTime + 0.5;
      while (st.nTime < ahead) {
        const [f, d] = MEL[st.nIdx++ % MEL.length];
        playN(f, st.nTime, d * B, 0.042);
        st.nTime += d * B;
      }
      while (st.bTime < ahead) {
        const [f, d] = BASS[st.bIdx++ % BASS.length];
        playN(f, st.bTime, d * B * 0.88, 0.08, "sine");
        st.bTime += d * B;
      }
      timerRef.current = setTimeout(tick, 200);
    };

    // ★ iOS 핵심 수정: ctx.currentTime은 "running" 상태일 때만 진행됨
    //   suspended 상태에서 스케줄링하면 모든 노트가 과거 시간으로 기록돼 무음
    //   → resume().then() 안에서 currentTime 기준으로 스케줄링 시작
    const startMusic = () => {
      if (stoppedRef.current) return;
      st.nTime = ctx.currentTime + 0.05;
      st.bTime = ctx.currentTime + 0.05;
      tick();
    };

    if (ctx.state === "running") {
      startMusic();
    } else {
      ctx.resume().then(startMusic).catch(() => {
        // resume 실패 시 (이미 unmount 등) 무시
      });
    }

    return () => {
      stoppedRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      // 직접 생성한 ctx만 닫음 (shared primed ctx는 page가 관리)
      if (ownsCtx) setTimeout(() => ctx.close().catch(() => {}), 400);
    };
  }, []);

  // 레이스 종료 시 페이드 아웃
  const fadeOut = useCallback(() => {
    if (stoppedRef.current) return;
    stoppedRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    const g = gainRef.current;
    const ctx = ctxRef.current;
    if (!g || !ctx || ctx.state === "closed") return;
    try {
      g.gain.setValueAtTime(g.gain.value, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + 2.0);
    } catch { /* */ }
  }, []);

  return { fadeOut };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Web Audio API 사운드 훅
// ═══════════════════════════════════════════════════════════════════════════════
function useSounds() {
  const actxRef = useRef<AudioContext | null>(null);
  const ctx = useCallback((): AudioContext | null => {
    if (typeof window === "undefined") return null;
    if (!actxRef.current) {
      // 모바일 대응: 미리 생성된 primed ctx 우선 사용
      type W = Window & { __gameAudioCtx?: AudioContext };
      const primed = (window as W).__gameAudioCtx;
      if (primed && primed.state !== "closed") {
        actxRef.current = primed;
      } else {
        try {
          const C = window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          actxRef.current = new C();
        } catch { return null; }
      }
    }
    return actxRef.current;
  }, []);

  const tone = useCallback((f: number, d: number, v = 0.18, t: OscillatorType = "sine") => {
    const c = ctx(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.frequency.value = f; o.type = t;
    g.gain.setValueAtTime(v, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + d);
    o.start(c.currentTime); o.stop(c.currentTime + d);
  }, [ctx]);

  const playStart   = useCallback(() =>
    [440,550,660,880].forEach((f,i) => setTimeout(() => tone(f,.12,.2,"square"), i*80)), [tone]);
  const playHit     = useCallback(() => tone(180, .3, .16, "sawtooth"), [tone]);
  const playFanfare = useCallback(() =>
    [523,659,784,1047].forEach((f,i) => setTimeout(() => tone(f,.18,.26), i*150)), [tone]);

  useEffect(() => () => {
    // shared primed ctx는 닫지 않음
    type W = Window & { __gameAudioCtx?: AudioContext };
    const primed = typeof window !== "undefined" ? (window as W).__gameAudioCtx : undefined;
    if (actxRef.current && actxRef.current !== primed) {
      actxRef.current.close().catch(() => {});
    }
  }, []);
  return { playStart, playHit, playFanfare };
}

// ═══════════════════════════════════════════════════════════════════════════════
// DisposeOnUnmount – Canvas 언마운트 시 모든 GPU 리소스 명시적 해제
//
// ★ Context Lost 근본 원인: Canvas가 마운트/언마운트를 반복하면 이전 컨텍스트의
//   geometry, material, texture, renderList가 GPU에 남아 메모리가 고갈됨.
//   이 컴포넌트가 useEffect cleanup에서 씬 전체를 traverse하며 모두 dispose.
// ═══════════════════════════════════════════════════════════════════════════════
function DisposeOnUnmount() {
  const { gl, scene } = useThree();

  // WebGL 컨텍스트 손실 이벤트 핸들러 등록
  // preventDefault() → 브라우저가 컨텍스트를 자동 복구 시도하도록 허용
  useEffect(() => {
    const canvas = gl.domElement;
    const onLost      = (e: Event) => { e.preventDefault(); };
    const onRestored  = () => { /* r3f가 자동으로 재초기화 처리 */ };
    canvas.addEventListener("webglcontextlost",      onLost);
    canvas.addEventListener("webglcontextrestored",  onRestored);
    return () => {
      canvas.removeEventListener("webglcontextlost",     onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
    };
  }, [gl]);

  // 언마운트 시 씬 전체 GPU 리소스 해제
  useEffect(() => {
    return () => {
      // 씬 트리 순회 → 모든 mesh의 geometry/material dispose
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.geometry?.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => (m as THREE.Material).dispose());
        } else {
          (mesh.material as THREE.Material)?.dispose();
        }
      });
      // 렌더러 내부 캐시(렌더 리스트, 프로그램 캐시 등) 해제
      gl.renderLists.dispose();
      // WebGL 컨텍스트 자체 해제 → 다음 Canvas가 새 컨텍스트를 깨끗이 얻음
      gl.dispose();
    };
  }, [gl, scene]);

  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// AnimalMesh – body + head + 4 legs + Html 이름 라벨
// 재질: metalness/roughness → Environment IBL과 시너지
// ═══════════════════════════════════════════════════════════════════════════════
function AnimalMesh({ color, name, stateRef }: {
  color: string;
  name: string;
  stateRef: React.MutableRefObject<AnimalState>;
}) {
  const grpRef = useRef<THREE.Group>(null);
  const flRef  = useRef<THREE.Mesh>(null);
  const frRef  = useRef<THREE.Mesh>(null);
  const blRef  = useRef<THREE.Mesh>(null);
  const brRef  = useRef<THREE.Mesh>(null);

  // PBR 재질 – Environment IBL로 자연스러운 반사/그림자 표현
  const mat = useMemo(() => new THREE.MeshStandardMaterial({
    color, metalness: 0.2, roughness: 0.55,
  }), [color]);

  // ★ GPU 메모리 누수 방지: 언마운트 시 재질 명시적 해제
  useEffect(() => () => mat.dispose(), [mat]);

  useFrame((state) => {
    if (!grpRef.current) return;
    const a    = stateRef.current;
    const t    = state.clock.elapsedTime;
    const freq = Math.max(3, a.speed * 0.8);

    // 위치 (스턴 흔들림 / 달리기 hop)
    grpRef.current.position.set(
      a.stunTimer > 0 ? a.laneX + Math.sin(t * 20) * 0.06 : a.laneX,
      a.finished ? 0 : Math.abs(Math.sin(t * freq)) * 0.1,
      a.z,
    );
    // 전진 피치 (달리는 느낌)
    grpRef.current.rotation.x = a.finished ? 0 : Math.sin(t * freq) * 0.1;

    // 다리 애니메이션 (트롯 보행: 앞/뒤 대각 쌍이 교대로 움직임)
    const legAmp = a.finished ? 0 : 0.55;
    const lt     = t * freq;
    if (flRef.current) flRef.current.rotation.x =  Math.sin(lt) * legAmp;
    if (frRef.current) frRef.current.rotation.x = -Math.sin(lt) * legAmp;
    if (blRef.current) blRef.current.rotation.x = -Math.sin(lt) * legAmp;
    if (brRef.current) brRef.current.rotation.x =  Math.sin(lt) * legAmp;
  });

  return (
    <group ref={grpRef}>
      {/* 몸통 */}
      <mesh material={mat}><boxGeometry args={[0.68, 0.48, 1.0]} /></mesh>
      {/* 머리 */}
      <mesh material={mat} position={[0, 0.44, 0.38]}>
        <sphereGeometry args={[0.28, 10, 10]} />
      </mesh>
      {/* 앞 왼쪽 다리 */}
      <mesh ref={flRef} material={mat} position={[-0.2, -0.38, 0.26]}>
        <boxGeometry args={[0.12, 0.35, 0.12]} />
      </mesh>
      {/* 앞 오른쪽 다리 */}
      <mesh ref={frRef} material={mat} position={[0.2, -0.38, 0.26]}>
        <boxGeometry args={[0.12, 0.35, 0.12]} />
      </mesh>
      {/* 뒤 왼쪽 다리 */}
      <mesh ref={blRef} material={mat} position={[-0.2, -0.38, -0.26]}>
        <boxGeometry args={[0.12, 0.35, 0.12]} />
      </mesh>
      {/* 뒤 오른쪽 다리 */}
      <mesh ref={brRef} material={mat} position={[0.2, -0.38, -0.26]}>
        <boxGeometry args={[0.12, 0.35, 0.12]} />
      </mesh>
      {/* Html 이름 라벨 (Billboard + drei Text 대신 → 폰트 로딩 없음) */}
      <Html position={[0, 1.05, 0]} center distanceFactor={10}>
        <span style={{
          color: "#fff", fontSize: "12px", fontWeight: 700,
          textShadow: "0 0 6px #000, 0 0 3px #000",
          whiteSpace: "nowrap", pointerEvents: "none",
          fontFamily: "sans-serif", letterSpacing: "0.03em",
        }}>{name}</span>
      </Html>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TrackMesh – 아스팔트 레이싱 트랙 + 잔디 경계 + 배리어 + 결승선
// ═══════════════════════════════════════════════════════════════════════════════
function TrackMesh({ numLanes, map, lanePositions }: {
  numLanes: number; map: MapType; lanePositions: number[];
}) {
  const grassColor = map === "forest" ? "#2d5c28" : "#b89040";
  const trackW     = numLanes * LANE_WIDTH;
  const halfLen    = RACE_LENGTH / 2;
  const centerZ    = -halfLen;

  return (
    <group>
      {/* 넓은 잔디/모래 지면 (트랙 바깥 영역) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.52, centerZ]}>
        <planeGeometry args={[trackW + 40, RACE_LENGTH + 20]} />
        <meshStandardMaterial color={grassColor} roughness={0.9} />
      </mesh>

      {/* 아스팔트 레이싱 트랙 표면 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, centerZ]}>
        <planeGeometry args={[trackW, RACE_LENGTH + 10]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.85} metalness={0.05} />
      </mesh>

      {/* 흰색 레인 구분선 (점선 효과 없이 실선) */}
      {Array.from({ length: numLanes - 1 }, (_, i) => {
        const x = -((numLanes - 1) / 2) * LANE_WIDTH + (i + 1) * LANE_WIDTH;
        return (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, -0.49, centerZ]}>
            <planeGeometry args={[0.07, RACE_LENGTH + 10]} />
            <meshStandardMaterial color="white" opacity={0.45} transparent />
          </mesh>
        );
      })}

      {/* 트랙 경계 흰 라인 (양쪽 가장자리) */}
      {([-trackW / 2, trackW / 2] as number[]).map((x, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, -0.49, centerZ]}>
          <planeGeometry args={[0.12, RACE_LENGTH + 10]} />
          <meshStandardMaterial color="white" opacity={0.7} transparent />
        </mesh>
      ))}

      {/* 콘크리트 배리어 (양 옆에 낮은 벽) */}
      {([-trackW / 2 - 0.45, trackW / 2 + 0.45] as number[]).map((x, i) => (
        <mesh key={i} position={[x, -0.26, centerZ]}>
          <boxGeometry args={[0.35, 0.5, RACE_LENGTH + 10]} />
          <meshStandardMaterial color="#cccccc" metalness={0.1} roughness={0.6} />
        </mesh>
      ))}

      {/* 배리어 상단 오렌지 스트라이프 */}
      {([-trackW / 2 - 0.45, trackW / 2 + 0.45] as number[]).map((x, i) => (
        <mesh key={i} position={[x, 0.01, centerZ]}>
          <boxGeometry args={[0.36, 0.1, RACE_LENGTH + 10]} />
          <meshStandardMaterial color="#ff6600" emissive="#ff3300" emissiveIntensity={0.3} />
        </mesh>
      ))}

      {/* 결승선 체크 패턴 */}
      {Array.from({ length: 8 }, (_, i) => {
        const cw = trackW / 8;
        return (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]}
            position={[-trackW / 2 + cw * i + cw / 2, -0.48, FINISH_LINE_Z]}>
            <planeGeometry args={[cw, 2.0]} />
            <meshStandardMaterial color={i % 2 === 0 ? "white" : "#111"} />
          </mesh>
        );
      })}

      {/* 결승선 기둥 (밝은 발광 효과) */}
      {([-trackW / 2 - 0.5, trackW / 2 + 0.5] as number[]).map((x, i) => (
        <mesh key={i} position={[x, 2.0, FINISH_LINE_Z]}>
          <cylinderGeometry args={[0.13, 0.13, 5, 8]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.4}
            metalness={0.4} roughness={0.3} />
        </mesh>
      ))}
      {/* 결승선 가로 바 */}
      <mesh position={[0, 4.1, FINISH_LINE_Z]}>
        <boxGeometry args={[trackW + 1.2, 0.18, 0.18]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.4} />
      </mesh>
      {/* 결승선 배너 (반투명 체크무늬 플래그) */}
      <mesh position={[0, 3.2, FINISH_LINE_Z - 0.1]}>
        <planeGeometry args={[trackW + 0.6, 1.6]} />
        <meshStandardMaterial color="#111" opacity={0.7} transparent side={THREE.DoubleSide} />
      </mesh>

      {/* 출발선 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.48, -1]}>
        <planeGeometry args={[trackW, 0.6]} />
        <meshStandardMaterial color="white" opacity={0.55} transparent />
      </mesh>

      {/* 부스트존 발광 스트라이프 (emissive → Bloom과 시너지) */}
      {[-38, -83, -122].map((bz, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.47, bz]}>
          <planeGeometry args={[trackW, 2.0]} />
          <meshStandardMaterial
            color="#00ffaa" emissive="#00ffaa" emissiveIntensity={3.0}
            transparent opacity={0.5} />
        </mesh>
      ))}

      {/* 레인 번호 (트랙 시작 부분) */}
      {lanePositions.map((x, idx) => (
        <Html key={idx} position={[x, 0.3, 2.5]} center>
          <span style={{
            color: "#fff", fontSize: "14px", fontWeight: 900,
            textShadow: "0 0 8px #000", pointerEvents: "none", fontFamily: "sans-serif",
          }}>{idx + 1}</span>
        </Html>
      ))}
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ForestBackground – 나무 InstancedMesh (드로우 콜 2개)
// ═══════════════════════════════════════════════════════════════════════════════
function ForestBackground({ trackWidth }: { trackWidth: number }) {
  const trunkRef  = useRef<THREE.InstancedMesh>(null);
  const canopyRef = useRef<THREE.InstancedMesh>(null);
  const COUNT     = 40;

  const [positions] = useState(() => {
    const half = trackWidth / 2 + 0.45 + 0.35; // 배리어 바깥
    return Array.from({ length: COUNT }, (_, i) => ({
      x:     (i % 2 === 0 ? -1 : 1) * (half + 2.5 + Math.random() * 8),
      z:    -3 - (i / COUNT) * (RACE_LENGTH + 25) + Math.random() * 5,
      scale: 0.8 + Math.random() * 0.7,
    }));
  });

  useEffect(() => {
    const dummy = new THREE.Object3D();
    positions.forEach((p, i) => {
      dummy.position.set(p.x, -0.5 + 0.8 * p.scale, p.z);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      trunkRef.current?.setMatrixAt(i, dummy.matrix);

      dummy.position.set(p.x, -0.5 + 2.5 * p.scale, p.z);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      canopyRef.current?.setMatrixAt(i, dummy.matrix);
    });
    if (trunkRef.current)  trunkRef.current.instanceMatrix.needsUpdate  = true;
    if (canopyRef.current) canopyRef.current.instanceMatrix.needsUpdate = true;
  }, [positions]);

  return (
    <>
      <instancedMesh ref={trunkRef} args={[undefined, undefined, COUNT]} frustumCulled={false}>
        <cylinderGeometry args={[0.15, 0.22, 1.6, 6]} />
        <meshStandardMaterial color="#5a3020" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={canopyRef} args={[undefined, undefined, COUNT]} frustumCulled={false}>
        <sphereGeometry args={[1.05, 7, 7]} />
        <meshStandardMaterial color="#1a6b1a" roughness={0.85} />
      </instancedMesh>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DesertBackground – 선인장 InstancedMesh (드로우 콜 2개)
// ═══════════════════════════════════════════════════════════════════════════════
function DesertBackground({ trackWidth }: { trackWidth: number }) {
  const bodyRef = useRef<THREE.InstancedMesh>(null);
  const armRef  = useRef<THREE.InstancedMesh>(null);
  const COUNT   = 32;

  const [positions] = useState(() => {
    const half = trackWidth / 2 + 0.45 + 0.35;
    return Array.from({ length: COUNT }, (_, i) => ({
      x:     (i % 2 === 0 ? -1 : 1) * (half + 2.5 + Math.random() * 8),
      z:    -3 - (i / COUNT) * (RACE_LENGTH + 25) + Math.random() * 5,
      scale: 0.7 + Math.random() * 0.8,
    }));
  });

  useEffect(() => {
    const dummy = new THREE.Object3D();
    positions.forEach((p, i) => {
      dummy.position.set(p.x, -0.5 + 1.1 * p.scale, p.z);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      bodyRef.current?.setMatrixAt(i, dummy.matrix);

      dummy.position.set(p.x - 0.5 * p.scale, -0.5 + 1.35 * p.scale, p.z);
      dummy.scale.setScalar(p.scale * 0.55);
      dummy.rotation.z = Math.PI / 2.3;
      dummy.updateMatrix();
      armRef.current?.setMatrixAt(i, dummy.matrix);
    });
    if (bodyRef.current) bodyRef.current.instanceMatrix.needsUpdate = true;
    if (armRef.current)  armRef.current.instanceMatrix.needsUpdate  = true;
  }, [positions]);

  return (
    <>
      <instancedMesh ref={bodyRef} args={[undefined, undefined, COUNT]} frustumCulled={false}>
        <cylinderGeometry args={[0.18, 0.22, 2.2, 6]} />
        <meshStandardMaterial color="#3a7a3a" roughness={0.8} />
      </instancedMesh>
      <instancedMesh ref={armRef} args={[undefined, undefined, COUNT]} frustumCulled={false}>
        <cylinderGeometry args={[0.1, 0.1, 0.9, 6]} />
        <meshStandardMaterial color="#3a7a3a" roughness={0.8} />
      </instancedMesh>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ObstaclesInstanced – 장애물 InstancedMesh (드로우 콜 1개)
// ═══════════════════════════════════════════════════════════════════════════════
function ObstaclesInstanced({ obstacles }: { obstacles: Obstacle[] }) {
  const ref = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    obstacles.forEach((obs, i) => {
      dummy.position.set(obs.x, -0.22, obs.z);
      dummy.updateMatrix();
      ref.current?.setMatrixAt(i, dummy.matrix);
      ref.current?.setColorAt(i, color.set(i % 2 === 0 ? "#ff6600" : "#cc2200"));
    });
    if (ref.current) {
      ref.current.instanceMatrix.needsUpdate = true;
      if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    }
  }, [obstacles]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, obstacles.length]} frustumCulled={false}>
      <boxGeometry args={[1.1, 0.55, 1.1]} />
      <meshStandardMaterial metalness={0.2} roughness={0.5} />
    </instancedMesh>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CameraController – 오른쪽(+X) 배치, 왼쪽 바라봄 → 동물이 오른→왼 이동
// ═══════════════════════════════════════════════════════════════════════════════
function CameraController({ animalsRef, trackWidth }: {
  animalsRef: React.MutableRefObject<AnimalState[]>;
  trackWidth: number;
}) {
  const { camera } = useThree();

  useFrame(() => {
    if (!animalsRef.current.length) return;
    const animals = animalsRef.current;
    const leaderZ = Math.min(...animals.map((a) => a.z));
    const avgZ    = animals.reduce((s, a) => s + a.z, 0) / animals.length;
    const targetZ = leaderZ * 0.55 + avgZ * 0.45;

    // 카메라: 트랙 오른쪽(+X) 배치 → 왼쪽(X=0)을 바라봄
    const sideX = trackWidth / 2 + 14;
    const newZ  = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.07);
    camera.position.set(sideX, 7, newZ);
    camera.lookAt(0, 1, newZ);
  });

  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// RaceSceneContent – Canvas 내부 씬 전체
// ═══════════════════════════════════════════════════════════════════════════════
function RaceSceneContent({ players, map, onFinish, onUpdateRankings, sounds, isCountingDown }: {
  players: Player[];
  map: MapType;
  onFinish: (ids: number[]) => void;
  onUpdateRankings: (r: RankEntry[]) => void;
  sounds: ReturnType<typeof useSounds>;
  isCountingDown: boolean;
}) {
  const numLanes   = players.length;
  const trackWidth = numLanes * LANE_WIDTH;

  const lanePositions = useMemo(
    () => Array.from({ length: numLanes }, (_, i) =>
      -((numLanes - 1) / 2) * LANE_WIDTH + i * LANE_WIDTH),
    [numLanes],
  );

  const [obstacles] = useState<Obstacle[]>(() =>
    Array.from({ length: 14 }, () => ({
      x: lanePositions[Math.floor(Math.random() * numLanes)],
      z: -30 - Math.random() * 110,
    }))
  );

  const boostZoneZ = [-38, -83, -122] as const;

  // ── 레이스 상태 ref ─────────────────────────────────────────────────────────
  const [initialAnimals] = useState(() =>
    players.map((p, idx) => ({
      id: p.id, name: p.name, index: idx,
      z: 0, speed: 0,
      baseSpeed: 8 + Math.random() * 6,
      laneX: lanePositions[idx],
      finished: false, stunTimer: 0, boostTimer: 0,
      speedFluctTimer: Math.random() * 0.3,
    }))
  );
  const animalsRef = useRef<AnimalState[]>(initialAnimals);

  const animalStateRefs = useRef<{ current: AnimalState }[]>(
    initialAnimals.map((s) => ({ current: s })),
  );

  const finishOrderRef  = useRef<AnimalState[]>([]);
  const raceFinishedRef = useRef(false);
  const rankTimerRef    = useRef(0);

  // ── 메인 레이스 루프 ──────────────────────────────────────────────────────
  useFrame((_, delta) => {
    if (raceFinishedRef.current || isCountingDown) return;
    const dt      = Math.min(delta, 0.05);
    const animals = animalsRef.current;

    for (let i = 0; i < animals.length; i++) {
      const a = animals[i];
      if (a.finished) continue;

      if (a.stunTimer > 0)       { a.stunTimer -= dt; a.speed = 2; }
      else if (a.boostTimer > 0) { a.boostTimer -= dt; a.speed = a.baseSpeed * 2.2; }
      else {
        a.speedFluctTimer -= dt;
        if (a.speedFluctTimer <= 0) {
          a.speedFluctTimer = 0.3;
          a.speed = a.baseSpeed * (0.78 + Math.random() * 0.44);
        }
      }

      a.z -= a.speed * dt;

      // 장애물 충돌
      if (a.stunTimer <= 0) {
        for (const obs of obstacles) {
          if (Math.abs(a.z - obs.z) < 1.3 && Math.abs(a.laneX - obs.x) < 0.75) {
            a.stunTimer = 1.0; sounds.playHit(); break;
          }
        }
      }
      // 부스트존
      if (a.boostTimer <= 0 && a.stunTimer <= 0) {
        for (const bz of boostZoneZ) {
          if (Math.abs(a.z - bz) < 1.4) { a.boostTimer = 0.5; break; }
        }
      }
      // 결승선
      if (a.z <= FINISH_LINE_Z) {
        a.z = FINISH_LINE_Z; a.finished = true; a.speed = 0;
        finishOrderRef.current.push(a);
        if (finishOrderRef.current.length === 1) sounds.playFanfare();
      }
      animalStateRefs.current[i].current = a;
    }

    if (!raceFinishedRef.current && animals.every((a) => a.finished)) {
      raceFinishedRef.current = true;
      onFinish(finishOrderRef.current.map((a) => a.id));
    }

    rankTimerRef.current += dt;
    if (rankTimerRef.current >= 0.3) {
      rankTimerRef.current = 0;
      const sorted = [...animals].sort((a, b) => a.z - b.z);
      onUpdateRankings(sorted.map((a) => ({ id: a.id, name: a.name, z: a.z })));
    }
  });

  return (
    <>
      {/* ★ GPU 리소스 완전 해제 컴포넌트 (Context Lost 방지 핵심) */}
      <DisposeOnUnmount />

      {/* 조명: HemisphereLight(하늘↔지면) + DirectionalLight + PointLight */}
      <hemisphereLight args={["#b0d8f0", "#3a5a20", 0.9]} />
      <ambientLight intensity={0.3} />
      <directionalLight position={[-8, 14, 4]} intensity={1.2} />
      <pointLight position={[0, 10, -80]} intensity={2.0} color="#ffffcc" />

      {/* 카메라 추적 (오른쪽→왼쪽 방향) */}
      <CameraController animalsRef={animalsRef} trackWidth={trackWidth} />

      {/* 트랙 (아스팔트 + 잔디 경계 + 배리어) */}
      <TrackMesh numLanes={numLanes} map={map} lanePositions={lanePositions} />

      {/* 배경 오브젝트 (InstancedMesh, 드로우 콜 2개) */}
      {map === "forest"
        ? <ForestBackground trackWidth={trackWidth} />
        : <DesertBackground trackWidth={trackWidth} />}

      {/* 장애물 (InstancedMesh, 드로우 콜 1개) */}
      <ObstaclesInstanced obstacles={obstacles} />

      {/* 동물 메시 (body + head + 4 legs + Html label) */}
      {players.map((player, idx) => (
        <AnimalMesh
          key={player.id}
          color={ANIMAL_COLORS[idx] ?? "#888"}
          name={player.name}
          stateRef={animalStateRefs.current[idx]}
        />
      ))}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// AnimalRaceScene – 메인 내보내기
// ═══════════════════════════════════════════════════════════════════════════════
export default function AnimalRaceScene({ players, map, onFinish }: Props) {
  const [rankList, setRankList]   = useState<RankEntry[]>([]);
  const [countdown, setCountdown] = useState<number | "GO" | null>(3);
  const [raceOver, setRaceOver]   = useState<number[] | null>(null);
  const sounds  = useSounds();
  const { fadeOut } = useBackgroundMusic();

  // 카운트다운: 3 → 2 → 1 → GO! → null (레이스 시작)
  useEffect(() => {
    let step = 3;
    const tick = () => {
      step--;
      if (step > 0) {
        setCountdown(step);
        setTimeout(tick, 1000);
      } else if (step === 0) {
        setCountdown("GO");
        setTimeout(() => setCountdown(null), 800);
      }
    };
    const id = setTimeout(tick, 1000);
    return () => clearTimeout(id);
  }, []);

  // 카운트다운 음성 (Web Speech API)
  useEffect(() => {
    if (countdown === null || typeof window === "undefined") return;
    if (!("speechSynthesis" in window)) return;
    const text = countdown === "GO" ? "Start!" : String(countdown);
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = 0.85;
    utter.volume = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }, [countdown]);

  // GO! 타이밍에 출발 사운드 재생
  useEffect(() => {
    if (countdown === "GO") sounds.playStart();
  }, [countdown, sounds]);

  // 레이스 완료 내부 핸들러 (오버레이 표시용 + 음악 페이드 아웃)
  const handleSceneFinish = useCallback((ids: number[]) => {
    setRaceOver(ids);
    fadeOut();
  }, [fadeOut]);

  const idToIndex = useMemo(() => {
    const m = new Map<number, number>();
    players.forEach((p, i) => m.set(p.id, i));
    return m;
  }, [players]);

  const handleUpdateRankings = useCallback((r: RankEntry[]) => setRankList(r), []);

  const trackWidth = players.length * LANE_WIDTH;
  // 초기 카메라: 오른쪽(+X) 배치, Z=0 (출발선), 왼쪽 바라봄
  const initCamX   = trackWidth / 2 + 14;

  // 카운트다운 숫자별 색상
  const countdownColor = countdown === "GO" ? "#00ff88"
    : countdown === 1 ? "#88ee44"
    : countdown === 2 ? "#ffbb00"
    : "#ff4444";

  return (
    <div className="relative w-full h-full">
      {/* ── Three.js Canvas ───────────────────────────────────────────────── */}
      <Canvas
        camera={{ position: [initCamX, 7, 0], fov: 65 }}
        gl={{ antialias: false, powerPreference: "high-performance" }}
        dpr={1}
        style={{ height: "100%", width: "100%" }}
      >
        {/* 하늘 (단색 배경 대비 입체감 극적 향상) */}
        <Sky
          distance={10000}
          sunPosition={map === "forest" ? [1, 0.15, 0] : [1, 0.05, 0]}
          inclination={map === "forest" ? 0.56 : 0.48}
          azimuth={0.25}
        />

        {/* 원근 안개 (깊이감) */}
        <fog attach="fog" args={[
          map === "forest" ? "#b0d8f0" : "#ffcc88",
          60, 230,
        ]} />

        <RaceSceneContent
          players={players}
          map={map}
          onFinish={handleSceneFinish}
          onUpdateRankings={handleUpdateRankings}
          sounds={sounds}
          isCountingDown={countdown !== null}
        />

        {/* Bloom 포스트 프로세싱 제거 → FBO 렌더 타겟 메모리 누수 원천 차단
            대신 부스트존·결승선 emissiveIntensity를 높여 동일 효과 */}
      </Canvas>

      {/* ── 카운트다운 오버레이 ──────────────────────────────────────────── */}
      {countdown !== null && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          {/* 반투명 어두운 배경 */}
          <div className="absolute inset-0 bg-black/40" />
          {/* 카운트다운 숫자 */}
          <span
            key={String(countdown)}
            style={{
              position: "relative",
              fontSize: "160px",
              fontWeight: 900,
              fontFamily: "sans-serif",
              lineHeight: 1,
              color: countdownColor,
              textShadow: "0 0 40px rgba(0,0,0,0.9), 0 0 80px rgba(0,0,0,0.6)",
              animation: "countdownPop 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
              userSelect: "none",
            }}
          >
            {countdown}
          </span>
          <style>{`
            @keyframes countdownPop {
              from { transform: scale(2.0); opacity: 0; }
              to   { transform: scale(1.0); opacity: 1; }
            }
          `}</style>
        </div>
      )}

      {/* ── 실시간 순위 HUD ─────────────────────────────────────────────── */}
      <div className="absolute top-3 right-3 min-w-[185px] rounded-xl border border-white/20
                      bg-black/65 px-3 py-3 backdrop-blur-sm">
        <p className="mb-2 text-xs font-bold tracking-wide text-white/80">🏆 현재 순위</p>
        <ol className="space-y-1.5">
          {rankList.map((rank, idx) => {
            const emoji    = ANIMAL_EMOJIS[idToIndex.get(rank.id) ?? 0] ?? "🐾";
            const progress = Math.min(100, Math.round((-rank.z / RACE_LENGTH) * 100));
            return (
              <li key={rank.id} className="flex items-center gap-1.5">
                <span className="w-4 text-right text-xs font-bold text-white/50 shrink-0">{idx + 1}</span>
                <span className="text-sm">{emoji}</span>
                <span className="w-20 truncate text-xs font-medium text-white">{rank.name}</span>
                <div className="h-1.5 w-12 overflow-hidden rounded-full bg-white/20">
                  <div className="h-full rounded-full bg-emerald-400 transition-all duration-300"
                    style={{ width: `${progress}%` }} />
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* ── 하단 맵 정보 ─────────────────────────────────────────────────── */}
      {raceOver === null && (
        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2
                        rounded-full border border-white/20 bg-black/55 px-4 py-1.5
                        text-xs text-white/70 backdrop-blur-sm whitespace-nowrap">
          {map === "forest" ? "🌲 숲 속 레이스 진행 중..." : "🌵 사막 질주 진행 중..."}
        </div>
      )}

      {/* ── 레이스 완료 오버레이 (클릭하면 결과 화면) ───────────────────── */}
      {raceOver !== null && (
        <div
          className="absolute inset-0 flex cursor-pointer items-center justify-center"
          onClick={() => onFinish(raceOver)}
        >
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative z-10 select-none text-center">
            <p className="text-5xl font-black text-white drop-shadow-lg">🏁 레이스 완료!</p>
            <p className="mt-4 text-lg text-white/80">화면을 클릭하면 결과를 볼 수 있어요</p>
          </div>
        </div>
      )}
    </div>
  );
}