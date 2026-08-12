"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Code2,
  Copy,
  Check,
  Zap,
  ShieldCheck,
  Layers,
  Sparkles,
  Palette,
  Calculator,
  Wrench,
} from "lucide-react";
import { BinaryMatrixBackground } from "@/components/about/BinaryMatrixBackground";
import { CATEGORIES } from "@/lib/constants/categories";

export default function AboutPage() {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const sampleCode = `import os
from datetime import datetime
from zoneinfo import ZoneInfo

import requests

BASE = "https://openapi.toolkit.com"
SYMBOL = "TOOLKIT_PRO"
QUANTITY = 1

# tool.kit 스마트 OAuth2 API 호출
token = requests.post(
    f"{BASE}/v1/oauth2/token",
    data={"client_id": "toolkit_api_key"}
)`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sampleCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const advantages = [
    {
      title: "개발자 · 디자이너 통합 킷",
      desc: "별도 프로그램 설치 없이, 웹 브라우저 하나로 모든 개발 및 디자인 작업을 실시간으로 처리할 수 있습니다.",
    },
    {
      title: "직관적인 5대 카테고리 설계",
      desc: "개발자, 디자이너, 세금/업무, 유틸리티, FUN 5대 직업/작업별 랜드마크 카드 구조로 분리되어 있습니다.",
    },
    {
      title: "반복 작업을 자동화로",
      desc: "매번 검색창을 켜거나 복잡한 사이트를 전전하지 않아도 됩니다. 조건에 맞는 도구를 한눈에 살펴보고 빠르게 실행하세요.",
    },
    {
      title: "언제 어디서나 웹 표준 거래",
      desc: "데스크탑부터 모바일, 네트워크 IP 접속까지 크로스 플랫폼 전 영역에서 높은 시인성과 안정성을 보장합니다.",
    },
  ];

  return (
    <div className="relative w-full overflow-hidden bg-bg-primary text-text-primary">
      {/* ── 토스증권 이진수 노드 & 마우스 스포트라이트 배경 ── */}
      <BinaryMatrixBackground />

      {/* ── SECTION 1: Hero Banner (토스증권 메인 느낌) ── */}
      <section className="relative z-10 flex min-h-[90vh] w-full flex-col items-center justify-center border-b border-border/70 px-4 py-20 text-center md:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {/* 상단 태그 배지 */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand/40 bg-bg-secondary/80 px-4 py-1.5 text-xs font-semibold text-brand backdrop-blur-md shadow-sm">
            <Sparkles size={13} />
            <span>tool.kit Open API & Smart Tools</span>
          </div>

          {/* 메인 타이틀 (토스 스타일) */}
          <h1 className="text-3xl font-extrabold tracking-tight text-text-primary sm:text-5xl md:text-6xl lg:text-7xl leading-tight">
            언제 어디서나<br />
            <span className="bg-gradient-to-r from-brand via-sky-400 to-indigo-400 bg-clip-text text-transparent">
              내 맘대로 작업해보세요
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-text-secondary sm:text-base md:text-lg">
            개발자 · 디자이너 · 직장인 · 프리랜서를 위해 설계된 스마트 웹 도구 킷.<br className="hidden sm:inline" />
            무겁고 복잡했던 설치 프로그램 없이 한 곳에서 스마트하게 처리하세요.
          </p>

          {/* 토스 스타일 사전 신청/진입 타원형 버튼 */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/"
              className="group relative inline-flex h-13 items-center gap-2 overflow-hidden rounded-full border border-brand/50 bg-bg-secondary/90 px-8 text-sm font-bold text-text-primary shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-brand hover:bg-brand hover:text-white"
            >
              <span>전체 도구 탐색하기</span>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <p className="mt-8 text-xs text-text-secondary/60">
            ◆ tool.kit 제휴 및 누구나 설치 없이 100% 무료로 사용할 수 있습니다.
          </p>
        </div>
      </section>

      {/* ── SECTION 2: 장점 및 토스 스타일 코드 에디터 쇼케이스 ── */}
      <section className="relative z-10 flex min-h-[90vh] w-full flex-col justify-center border-b border-border/70 px-4 py-24 md:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl w-full">
          <div className="mb-12">
            <h2 className="text-2xl font-bold tracking-tight text-text-primary sm:text-4xl">
              이런 장점이 있어요
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              복잡함을 덜고 직관성과 생산성을 극대화한 tool.kit의 핵심 설계
            </p>
          </div>

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
            {/* 좌측: 장점 아코디언 / 리스트 */}
            <div className="flex flex-col gap-4 lg:col-span-5">
              {advantages.map((adv, idx) => (
                <button
                  key={adv.title}
                  type="button"
                  onClick={() => setActiveTab(idx)}
                  className={`text-left rounded-2xl border p-5 transition-all duration-200 ${
                    activeTab === idx
                      ? "border-brand bg-bg-secondary shadow-md"
                      : "border-border/60 bg-bg-primary/40 hover:border-border hover:bg-bg-secondary/40"
                  }`}
                >
                  <h3
                    className={`text-base font-bold transition-colors ${
                      activeTab === idx ? "text-brand" : "text-text-primary"
                    }`}
                  >
                    {adv.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                    {adv.desc}
                  </p>
                </button>
              ))}
            </div>

            {/* 우측: tool.kit 기능 스마트 IDE 에디터 미리보기 박스 */}
            <div className="lg:col-span-7">
              <div className="overflow-hidden rounded-2xl border border-border bg-[#0d1117] shadow-2xl">
                {/* 탭 헤더 */}
                <div className="flex flex-wrap items-center justify-between border-b border-border/50 bg-[#161b22] px-3 py-2 text-xs font-mono">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0" style={{ scrollbarWidth: "none" }}>
                    {[
                      { id: 0, label: "JSON Formatter", lang: "JSON" },
                      { id: 1, label: "Design Theme", lang: "CSS" },
                      { id: 2, label: "연봉 계산기", lang: "TS" },
                      { id: 3, label: "QR Config", lang: "JSON" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 transition-colors ${
                          activeTab === tab.id
                            ? "bg-[#21262d] text-sky-400 font-bold border border-sky-500/30"
                            : "text-gray-400 hover:bg-[#21262d]/50 hover:text-gray-200"
                        }`}
                      >
                        <span className="text-[10px] font-bold opacity-60">[{tab.lang}]</span>
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex shrink-0 items-center gap-1.5 rounded px-2 py-1 text-xs text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    <span>{copied ? "복사됨" : "코드 복사"}</span>
                  </button>
                </div>

                {/* 코드 본문 */}
                <div className="p-5 font-mono text-xs leading-relaxed overflow-x-auto text-gray-200" style={{ scrollbarWidth: "none" }}>
                  <pre>
                    <code>
                      {activeTab === 0 && (
                        <>
                          <span className="text-gray-500">// 💻 개발자 도구 — JSON Formatter & Validator</span>{"\n"}
                          {"{\n"}
                          {"  "}<span className="text-sky-300">&quot;service&quot;</span>: <span className="text-emerald-300">&quot;tool.kit&quot;</span>,{"\n"}
                          {"  "}<span className="text-sky-300">&quot;status&quot;</span>: <span className="text-purple-400">200</span>,{"\n"}
                          {"  "}<span className="text-sky-300">&quot;features&quot;</span>: {"{\n"}
                          {"    "}<span className="text-sky-300">&quot;prettify&quot;</span>: <span className="text-orange-400">true</span>,{"\n"}
                          {"    "}<span className="text-sky-300">&quot;validateSchema&quot;</span>: <span className="text-orange-400">true</span>,{"\n"}
                          {"    "}<span className="text-sky-300">&quot;installRequired&quot;</span>: <span className="text-orange-400">false</span>{"\n"}
                          {"  }\n"}
                          {"}"}
                        </>
                      )}
                      {activeTab === 1 && (
                        <>
                          <span className="text-gray-500">/* 🎨 디자이너 도구 — Google Dark Theme Tokens */</span>{"\n"}
                          <span className="text-purple-400">:root</span> {"{\n"}
                          {"  "}<span className="text-sky-300">--color-bg-primary</span>: <span className="text-emerald-300">#121212</span>;{"\n"}
                          {"  "}<span className="text-sky-300">--color-bg-secondary</span>: <span className="text-emerald-300">#1e1e1e</span>;{"\n"}
                          {"  "}<span className="text-sky-300">--color-brand</span>: <span className="text-emerald-300">#3b82f6</span>;{"\n"}
                          {"  "}<span className="text-sky-300">--color-text-primary</span>: <span className="text-emerald-300">#f1f3f4</span>;{"\n"}
                          {"}"}
                        </>
                      )}
                      {activeTab === 2 && (
                        <>
                          <span className="text-gray-500">// 💰 세금 & 업무 — 연봉 실수령액 시뮬레이터</span>{"\n"}
                          <span className="text-purple-400">const</span> annualSalary = <span className="text-orange-400">60_000_000</span>; <span className="text-gray-500">// 연봉 6천만원</span>{"\n"}
                          <span className="text-purple-400">const</span> netPay = calculateNetPay({"{\n"}
                          {"  "}annualSalary,{"\n"}
                          {"  "}dependents: <span className="text-orange-400">1</span>,{"\n"}
                          {"  "}nonTaxable: <span className="text-orange-400">200_000</span> <span className="text-gray-500">// 식대 비과세</span>{"\n"}
                          {"}"});{"\n"}
                          <span className="text-gray-500">// 결과: 예상 월 실수령액 약 4,287,520 원</span>
                        </>
                      )}
                      {activeTab === 3 && (
                        <>
                          <span className="text-gray-500">// 🛠️ 유틸리티 — QR 코드 파라미터 설정</span>{"\n"}
                          {"{\n"}
                          {"  "}<span className="text-sky-300">&quot;targetUrl&quot;</span>: <span className="text-emerald-300">&quot;https://toolkit.com&quot;</span>,{"\n"}
                          {"  "}<span className="text-sky-300">&quot;errorCorrectionLevel&quot;</span>: <span className="text-emerald-300">&quot;High&quot;</span>,{"\n"}
                          {"  "}<span className="text-sky-300">&quot;color&quot;</span>: {"{\n"}
                          {"    "}<span className="text-sky-300">&quot;dark&quot;</span>: <span className="text-emerald-300">&quot;#1a73e8&quot;</span>,{"\n"}
                          {"    "}<span className="text-sky-300">&quot;light&quot;</span>: <span className="text-emerald-300">&quot;#ffffff&quot;</span>{"\n"}
                          {"  }\n"}
                          {"}"}
                        </>
                      )}
                    </code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: 5대 직무 및 카테고리 세션 구분 ── */}
      <section className="relative z-10 flex min-h-[85vh] w-full flex-col justify-center border-b border-border/70 px-4 py-24 md:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl w-full">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-text-primary sm:text-4xl">
              어떤 직무이든 필요한 도구가 준비되어 있습니다
            </h2>
            <p className="mt-3 text-sm text-text-secondary">
              개발, 디자인, 업무, 유틸리티, FUN까지 5대 핵심 카테고리
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                href={cat.href}
                className="group relative flex flex-col justify-between rounded-2xl border border-border bg-bg-secondary/70 p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:border-brand hover:shadow-xl"
              >
                <div>
                  <div className={`mb-4 flex size-12 items-center justify-center rounded-xl bg-brand/10 ${cat.textColor}`}>
                    <Code2 size={22} />
                  </div>
                  <h3 className="text-base font-bold text-text-primary transition-colors group-hover:text-brand">
                    {cat.label}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                    {cat.description}
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-brand">
                  <span>바로가기</span>
                  <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 4: 하단 마무리 CTA ── */}
      <section className="relative z-10 flex min-h-[60vh] w-full flex-col items-center justify-center px-4 py-24 text-center md:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-extrabold text-text-primary sm:text-4xl">
            지금 바로 스마트하게 시작하세요
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-text-secondary">
            회원가입도, 결제도 없습니다. 필요한 도구를 클릭하고 바로 업무효율을 높여보세요.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-brand px-8 text-sm font-bold text-white shadow-lg transition-transform duration-200 hover:scale-105"
            >
              도구 모음으로 이동
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}