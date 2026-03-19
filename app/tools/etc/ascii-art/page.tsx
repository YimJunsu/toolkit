"use client";

import { useState, useMemo, useCallback } from "react";
import { Pilcrow, Copy, Check } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Etc", href: "/tools/etc" },
];

// ────── Font Definitions ──────
// Each character: 5 rows, each row 6 chars wide

const BLOCK_FONT: Record<string, string[]> = {
  " ": ["      ", "      ", "      ", "      ", "      "],
  "A": [" ████ ", "██  ██", "██████", "██  ██", "██  ██"],
  "B": ["█████ ", "██  ██", "█████ ", "██  ██", "█████ "],
  "C": [" █████", "██    ", "██    ", "██    ", " █████"],
  "D": ["████  ", "██  ██", "██  ██", "██  ██", "████  "],
  "E": ["██████", "██    ", "████  ", "██    ", "██████"],
  "F": ["██████", "██    ", "████  ", "██    ", "██    "],
  "G": [" █████", "██    ", "██ ███", "██  ██", " █████"],
  "H": ["██  ██", "██  ██", "██████", "██  ██", "██  ██"],
  "I": ["██████", "  ██  ", "  ██  ", "  ██  ", "██████"],
  "J": ["  ████", "    ██", "    ██", "██  ██", " ████ "],
  "K": ["██  ██", "██ ██ ", "████  ", "██ ██ ", "██  ██"],
  "L": ["██    ", "██    ", "██    ", "██    ", "██████"],
  "M": ["██  ██", "██████", "██████", "██  ██", "██  ██"],
  "N": ["██  ██", "███ ██", "██████", "██ ███", "██  ██"],
  "O": [" ████ ", "██  ██", "██  ██", "██  ██", " ████ "],
  "P": ["█████ ", "██  ██", "█████ ", "██    ", "██    "],
  "Q": [" ████ ", "██  ██", "██  ██", "██ ███", " █████"],
  "R": ["█████ ", "██  ██", "█████ ", "██ ██ ", "██  ██"],
  "S": [" █████", "██    ", " ████ ", "    ██", "█████ "],
  "T": ["██████", "  ██  ", "  ██  ", "  ██  ", "  ██  "],
  "U": ["██  ██", "██  ██", "██  ██", "██  ██", " ████ "],
  "V": ["██  ██", "██  ██", "██  ██", " ████ ", "  ██  "],
  "W": ["██  ██", "██  ██", "██████", "██████", "██  ██"],
  "X": ["██  ██", " ████ ", "  ██  ", " ████ ", "██  ██"],
  "Y": ["██  ██", "██  ██", " ████ ", "  ██  ", "  ██  "],
  "Z": ["██████", "   ██ ", "  ██  ", " ██   ", "██████"],
  "0": [" ████ ", "██  ██", "██  ██", "██  ██", " ████ "],
  "1": ["  ██  ", " ███  ", "  ██  ", "  ██  ", "██████"],
  "2": [" ████ ", "██  ██", "   ██ ", "  ██  ", "██████"],
  "3": [" ████ ", "    ██", "  ███ ", "    ██", " ████ "],
  "4": ["██  ██", "██  ██", "██████", "    ██", "    ██"],
  "5": ["██████", "██    ", "█████ ", "    ██", "█████ "],
  "6": [" ████ ", "██    ", "█████ ", "██  ██", " ████ "],
  "7": ["██████", "    ██", "   ██ ", "  ██  ", "  ██  "],
  "8": [" ████ ", "██  ██", " ████ ", "██  ██", " ████ "],
  "9": [" ████ ", "██  ██", " █████", "    ██", " ████ "],
  "!": ["  ██  ", "  ██  ", "  ██  ", "      ", "  ██  "],
  "?": [" ████ ", "    ██", "  ███ ", "      ", "  ██  "],
  ".": ["      ", "      ", "      ", "      ", "  ██  "],
  ",": ["      ", "      ", "      ", "  ██  ", " ██   "],
  "-": ["      ", "      ", "██████", "      ", "      "],
  "_": ["      ", "      ", "      ", "      ", "██████"],
  ":": ["      ", "  ██  ", "      ", "  ██  ", "      "],
};

const BANNER_FONT: Record<string, string[]> = {
  " ": ["   ", "   ", "   ", "   ", "   "],
  "A": ["###", "# #", "###", "# #", "# #"],
  "B": ["## ", "# #", "## ", "# #", "## "],
  "C": ["###", "#  ", "#  ", "#  ", "###"],
  "D": ["## ", "# #", "# #", "# #", "## "],
  "E": ["###", "#  ", "## ", "#  ", "###"],
  "F": ["###", "#  ", "## ", "#  ", "#  "],
  "G": ["###", "#  ", "# #", "# #", "###"],
  "H": ["# #", "# #", "###", "# #", "# #"],
  "I": ["###", " # ", " # ", " # ", "###"],
  "J": ["  #", "  #", "  #", "# #", "###"],
  "K": ["# #", "## ", "#  ", "## ", "# #"],
  "L": ["#  ", "#  ", "#  ", "#  ", "###"],
  "M": ["# #", "###", "# #", "# #", "# #"],
  "N": ["# #", "## ", "# #", "# #", "# #"],
  "O": ["###", "# #", "# #", "# #", "###"],
  "P": ["###", "# #", "###", "#  ", "#  "],
  "Q": ["###", "# #", "# #", "## ", "###"],
  "R": ["###", "# #", "###", "## ", "# #"],
  "S": ["###", "#  ", "###", "  #", "###"],
  "T": ["###", " # ", " # ", " # ", " # "],
  "U": ["# #", "# #", "# #", "# #", "###"],
  "V": ["# #", "# #", "# #", "# #", " # "],
  "W": ["# #", "# #", "# #", "###", "# #"],
  "X": ["# #", " # ", " # ", " # ", "# #"],
  "Y": ["# #", "# #", " # ", " # ", " # "],
  "Z": ["###", "  #", " # ", "#  ", "###"],
  "0": ["###", "# #", "# #", "# #", "###"],
  "1": [" # ", "## ", " # ", " # ", "###"],
  "2": ["###", "  #", "###", "#  ", "###"],
  "3": ["###", "  #", "###", "  #", "###"],
  "4": ["# #", "# #", "###", "  #", "  #"],
  "5": ["###", "#  ", "###", "  #", "###"],
  "6": ["###", "#  ", "###", "# #", "###"],
  "7": ["###", "  #", "  #", "  #", "  #"],
  "8": ["###", "# #", "###", "# #", "###"],
  "9": ["###", "# #", "###", "  #", "###"],
  "!": [" # ", " # ", " # ", "   ", " # "],
  "?": ["###", "  #", " ##", "   ", " # "],
  ".": ["   ", "   ", "   ", "   ", " # "],
  "-": ["   ", "   ", "###", "   ", "   "],
};

const SIMPLE_FONT: Record<string, string[]> = {
  " ": ["   ", "   ", "   ", "   ", "   "],
  "A": [" A ", "/ \\", "/___\\", "|   |", "|   |"],
  "B": ["|B  ", "|___", "|   |", "|   |", "|___|"],
  "C": [" C  ", "/   ", "|   ", "|   ", " \\__"],
  "D": ["|D  ", "|  \\", "|   |", "|   |", "|__/"],
  "E": ["|E__", "|   ", "|___", "|   ", "|___"],
  "F": ["|F__", "|   ", "|___", "|   ", "|   "],
  "G": [" G_ ", "/   ", "|  _", "| _|", " \\_/"],
  "H": ["|H |", "|  |", "|__|", "|  |", "|  |"],
  "I": ["_I_", " | ", " | ", " | ", "_|_"],
  "J": ["  J", "  |", "  |", "  |", "\\_/"],
  "K": ["|K ", "| /", "|< ", "| \\", "|  \\"],
  "L": ["|L ", "|  ", "|  ", "|  ", "|__"],
  "M": ["M   M", "|\\  /|", "| \\/ |", "|    |", "|    |"],
  "N": ["N   N", "|\\  |", "| \\ |", "|  \\|", "|   |"],
  "O": [" O_ ", "/   \\", "|   |", "|   |", " \\_/ "],
  "P": ["|P_ ", "|  |", "|__/", "|   ", "|   "],
  "Q": [" Q_ ", "/   \\", "|   |", "|  _|", " \\_/|"],
  "R": ["|R_ ", "|  |", "|_/ ", "| \\ ", "|  \\"],
  "S": [" S_ ", "/   ", " \\_ ", "   \\", "\\__/"],
  "T": ["TTT", " T ", " T ", " T ", " T "],
  "U": ["|U |", "|  |", "|  |", "|  |", " \\/ "],
  "V": ["|V |", "|  |", "|  |", " \\/ ", "  V "],
  "W": ["W   W", "|   |", "|   |", " \\ / ", "  W "],
  "X": ["X   X", " \\ / ", "  X  ", " / \\ ", "X   X"],
  "Y": ["Y   Y", " \\ / ", "  Y  ", "  |  ", "  |  "],
  "Z": ["ZZZZ", "  / ", " /  ", "/   ", "ZZZZ"],
  "0": [" 0_ ", "/  \\", "| 0 |", "|  /", " \\_/"],
  "1": ["_1", " |", " |", " |", "_|"],
  "2": [" 2_", "/ _|", "/_/ ", "/   ", "|___"],
  "3": ["_3_", "  _|", "  _|", "  _|", " \\_|"],
  "4": ["4  4", "4  4", "4444", "   4", "   4"],
  "5": ["5___", "5   ", "5_  ", "  \\ ", "5__/"],
  "6": [" 6_ ", "6   ", "6__ ", "6  |", " \\_/"],
  "7": ["777_", "   7", "  7 ", " 7  ", " 7  "],
  "8": [" 8_ ", "/8 \\", " \\8/", "/ 8 \\", "\\___/"],
  "9": [" 9_ ", "/ \\ ", "\\_9|", "   |", "  9/"],
  "!": [" ! ", " | ", " | ", "   ", " ! "],
  "?": [" ?_", "  _|", " /?", "   ", " ? "],
  ".": ["   ", "   ", "   ", "   ", " . "],
  "-": ["   ", "   ", "---", "   ", "   "],
};

const SHADOW_FONT: Record<string, string[]> = {
  " ": ["    ", "    ", "    ", "    ", "    "],
  "A": [" /\\ ", "/  \\", "/----\\", "/    \\", "/    \\"],
  "B": ["|B__ ", "|   \\", "|___/", "|   \\", "|___/"],
  "C": [" /C_", "/    ", "|    ", "|    ", " \\___"],
  "D": ["|D__ ", "|   \\", "|    |", "|   /", "|___/"],
  "E": ["|E___", "|    ", "|___ ", "|    ", "|____"],
  "F": ["|F___", "|    ", "|___ ", "|    ", "|    "],
  "G": [" /G__", "/    ", "|  G|", "|  G|", " \\___"],
  "H": ["|H  |", "|  --|", "|   |", "|   |", "|   |"],
  "I": ["||I||", "  |  ", "  |  ", "  |  ", "||_||"],
  "J": ["   J|", "    |", "    |", " J  |", " \\__/"],
  "K": ["|K |", "| / ", "|<  ", "| \\ ", "| _\\"],
  "L": ["|L   ", "|    ", "|    ", "|    ", "|____"],
  "M": ["|M    M|", "|\\ \\/ /|", "| \\  / |", "|  \\/  |", "|      |"],
  "N": ["|N     |", "|\\ \\   |", "| \\ \\  |", "|  \\ \\ |", "|   \\__|"],
  "O": [" /O\\  ", "/    \\ ", "|    | ", "|    | ", " \\___/ "],
  "P": ["|P___", "|    \\", "|___/", "|    ", "|    "],
  "Q": [" /Q\\  ", "/    \\ ", "|    | ", "|   _/", " \\__/__"],
  "R": ["|R___ ", "|    \\", "|___/ ", "| \\  ", "|  \\_ "],
  "S": [" /S__ ", "/     ", "\\___  ", "     \\", " \\___/"],
  "T": ["|TTTT|", "  |   ", "  |   ", "  |   ", "  |   "],
  "U": ["|U   |", "|    |", "|    |", "|    |", " \\__/ "],
  "V": ["|V   |", "|    |", " \\   /", "  \\ / ", "   V  "],
  "W": ["|W     W|", "|  | |  |", "|  | |  |", " \\  V  /", "  \\___/ "],
  "X": ["|X   X|", " \\ / ", "  X  ", " / \\ ", "|     |"],
  "Y": ["|Y   Y|", " \\ / ", "  |  ", "  |  ", "  |  "],
  "Z": ["|ZZZZ|", "   / ", "  /  ", " /   ", "|____|"],
  "0": [" /0\\  ", "/    \\ ", "| /\\ | ", "| \\/ | ", " \\___/ "],
  "1": ["  /1 ", " /|  ", "  |  ", "  |  ", " _|_ "],
  "2": [" /2_ ", "/   \\", "  __/", " /   ", "|____"],
  "3": [" /3_ ", "/   |", " \\__| ", "    | ", " \\__| "],
  "4": ["|4   |", "|    |", "|____|", "    | ", "    | "],
  "5": ["|5___", "|    ", "|5__ ", "    \\", "|___/"],
  "6": [" /6_ ", "/    ", "|6__ ", "|    |", " \\___/"],
  "7": ["|7___|", "    / ", "   /  ", "  /   ", " /    "],
  "8": [" /8\\  ", "/   \\ ", "\\   / ", "/   \\ ", "\\___/ "],
  "9": [" /9\\  ", "/   \\ ", "\\___| ", "    | ", " \\__/ "],
  "!": ["  |! ", "  |  ", "  |  ", "     ", "  *  "],
  "?": [" /?_ ", "/   |", "  __/", "     ", "  ?  "],
  ".": ["     ", "     ", "     ", "     ", "  .  "],
  "-": ["     ", "     ", "-----|", "     ", "     "],
};

type FontName = "Block" | "Banner" | "Simple" | "Shadow";

const FONTS: Record<FontName, Record<string, string[]>> = {
  Block: BLOCK_FONT,
  Banner: BANNER_FONT,
  Simple: SIMPLE_FONT,
  Shadow: SHADOW_FONT,
};

function generateAsciiArt(text: string, fontName: FontName, scale: number): string {
  const font = FONTS[fontName];
  const upper = text.toUpperCase();
  const chars = upper.split("").map((c) => font[c] ?? font[" "]);

  if (chars.length === 0) return "";

  const rows = 5;
  const lines: string[] = [];
  for (let row = 0; row < rows; row++) {
    const line = chars.map((c) => c[row] ?? "").join(" ");
    if (scale === 2) {
      // Double each character horizontally and vertically
      const doubled = line.split("").map((ch) => ch + ch).join("");
      lines.push(doubled);
      lines.push(doubled);
    } else {
      lines.push(line);
    }
  }
  return lines.join("\n");
}

export default function AsciiArtPage() {
  const [text, setText] = useState("HELLO");
  const [font, setFont] = useState<FontName>("Block");
  const [scale, setScale] = useState<1 | 2>(1);
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => generateAsciiArt(text, font, scale), [text, font, scale]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [output]);

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="ASCII Art Generator"
      description="텍스트를 ASCII 아트로 변환합니다. Block, Banner, Simple, Shadow 4가지 폰트를 지원합니다."
      icon={Pilcrow}
    >
      {/* 입력 컨트롤 */}
      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-border bg-bg-secondary p-4">
        <div className="flex flex-1 flex-col gap-2" style={{ minWidth: "200px" }}>
          <label className="text-xs font-semibold text-text-secondary">텍스트 입력</label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 20))}
            placeholder="HELLO"
            maxLength={20}
            className="w-full rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary placeholder-text-secondary/50 focus:border-brand focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-text-secondary">폰트</label>
          <select
            value={font}
            onChange={(e) => setFont(e.target.value as FontName)}
            className="rounded-lg border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary focus:border-brand focus:outline-none"
          >
            {(["Block", "Banner", "Simple", "Shadow"] as FontName[]).map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-text-secondary">크기</label>
          <div className="flex gap-1 rounded-lg border border-border bg-bg-primary p-0.5">
            {([1, 2] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScale(s)}
                className={`rounded-md px-4 py-1.5 text-sm font-semibold transition-colors ${
                  scale === s
                    ? "bg-brand text-white"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 출력 */}
      <div className="mt-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-text-secondary">결과 (font: {font}, {scale}x)</span>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!output}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-bg-secondary px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:text-text-primary disabled:opacity-40"
          >
            {copied ? <Check size={12} className="text-brand" /> : <Copy size={12} />}
            {copied ? "복사됨" : "복사"}
          </button>
        </div>
        <textarea
          readOnly
          value={output}
          rows={scale === 2 ? 14 : 7}
          className="w-full resize-none overflow-auto rounded-xl border border-border bg-bg-secondary p-4 font-mono text-sm leading-tight text-text-primary focus:outline-none"
          style={{ whiteSpace: "pre", fontSize: scale === 2 ? "10px" : "14px" }}
        />
      </div>

      {/* 문자 지원 안내 */}
      <div className="mt-6 rounded-xl border border-border bg-bg-secondary p-4">
        <p className="text-xs text-text-secondary">
          <span className="font-semibold text-text-primary">지원 문자: </span>
          A–Z (대소문자 모두), 0–9, 특수문자: ! ? . , - _ : (공백 포함) · 최대 20자
        </p>
        <p className="mt-1 text-xs text-text-secondary">
          인식할 수 없는 문자는 공백으로 대체됩니다.
        </p>
      </div>
    </ToolPageLayout>
  );
}
