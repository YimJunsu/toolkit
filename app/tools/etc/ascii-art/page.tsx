"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Pilcrow, Copy, Check, Upload, Image as ImageIcon, Type, Sparkles, Download, ZoomIn, ZoomOut } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";

const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "기타", href: "/tools/etc" },
];

/* ────── 1. 영어 폰트 정의 ────── */

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

type FontName = "Block" | "Banner" | "Simple";

const FONTS: Record<FontName, Record<string, string[]>> = {
  Block: BLOCK_FONT,
  Banner: BANNER_FONT,
  Simple: SIMPLE_FONT,
};

/* ────── 2. 다양하고 풍부한 아스키 프리셋 모음 (asciiart.eu & emojicombos 참고) ────── */

interface PresetItem {
  id: string;
  category: "cat" | "dog" | "kaomoji" | "object";
  title: string;
  art: string;
}

const PRESETS: PresetItem[] = [
  // 🐱 고양이 (Cats)
  {
    id: "cat-cute",
    category: "cat",
    title: "🐱 아기 고양이",
    art: `   /\\___/\\
  (  o.o  )
   >  ^  <
  /       \\
 (         )
  \\__||__/`,
  },
  {
    id: "cat-box",
    category: "cat",
    title: "📦 상자 속 고양이",
    art: `   /\\_/\\
  ( o.o )
  > ^ <
 ┌──────┐
 │📦 Cat│
 └──────┘`,
  },
  {
    id: "cat-sleep",
    category: "cat",
    title: "💤 잠자는 뚱냥이",
    art: `   |\\---/|
   | o_o |
   \\_^_/
    (  )
   /    \\
  (      )
  (______)~`,
  },
  {
    id: "cat-loaf",
    category: "cat",
    title: "🍞 식빵 굽는 고양이",
    art: `   /\\_/\\
  ( =^.^= )
  (  "  " )
 (________)`,
  },
  {
    id: "cat-curious",
    category: "cat",
    title: "🐱 호기심 고양이",
    art: `  /\\_/\\
 ( o.o )
  > ^ <
 /     \\
/       \\
(  |||  )`,
  },
  {
    id: "cat-big-art",
    category: "cat",
    title: "🐈 디테일 미치냥",
    art: `       |\\      _,,,---,,_
 Zzz.. /,\`.-'\`'    -.  ;-;;,_
      |,4-  ) )-,_..;\\ (  \`'-'
     '---''(_/--'  \`-'\\_)`,
  },

  // 🐶 강아지 (Dogs)
  {
    id: "dog-cute",
    category: "dog",
    title: "🐶 귀여운 댕댕이",
    art: `  / \\__
 (    @\\___
 /         O
/   (_____/
/_____/   U`,
  },
  {
    id: "dog-siba",
    category: "dog",
    title: "🐕 시바견 (Shiba)",
    art: `    /^ ^\\
   / 0 0 \\
  V\\ Y /V
   / - \\
  /    |
 (_____)`,
  },
  {
    id: "dog-sleep",
    category: "dog",
    title: "💤 잠자는 강아지",
    art: `    __
   /  \\
  / .. \\
 ( (  ) )
  \\_||_/`,
  },

  // 🌸 이모티콘 & 캐릭터 (Kaomoji & Characters)
  {
    id: "kaomoji-bunny",
    category: "kaomoji",
    title: "🐰 분홍 토끼",
    art: ` (\\_/)
 ( •_•)
 />❤️  I Love You!`,
  },
  {
    id: "kaomoji-bear",
    category: "kaomoji",
    title: "🐻 곰돌이",
    art: `  ʕ•ᴥ•ʔ
  (  v  )
  /     \\`,
  },
  {
    id: "kaomoji-panda",
    category: "kaomoji",
    title: "🐼 아기 판다",
    art: `  (o.o)
  ( : )
 o_|_|_o`,
  },
  {
    id: "kaomoji-heart",
    category: "kaomoji",
    title: "💖 픽셀 하트",
    art: `  ░░██████░░██████░░
  ░████████████████░
  ░████████████████░
  ░░██████████████░░
  ░░░░██████████░░░░
  ░░░░░░██████░░░░░░
  ░░░░░░░░██░░░░░░░░`,
  },
  {
    id: "kaomoji-kirby",
    category: "kaomoji",
    title: "⭐ 커비 (Kirby)",
    art: `  (っ˘ω˘ς)
 (っ>ω<c)
  (⊃∀⊂)`,
  },

  // 🚀 사물 & 우주 (Objects & Space)
  {
    id: "rocket",
    category: "object",
    title: "🚀 우주선 (Rocket)",
    art: `   /\\
  /  \\
 |    |
 |    |
/|  | |\\
 |  |  |
/|__|__|\\
  /||\\
  \\||/`,
  },
  {
    id: "coffee",
    category: "object",
    title: "☕ 따뜻한 커피",
    art: `  (  )  (  )
   )  (  )  (
  ┌──────────┐
  │  Coffee  │═╗
  │  tool.kit│ ║
  └──────────┘═╝
   \\________/`,
  },
  {
    id: "robot",
    category: "object",
    title: "🤖 귀여운 로봇",
    art: `  [O_o]
 /|   |\\
  |---|
 /     \\`,
  },
  {
    id: "gamepad",
    category: "object",
    title: "🎮 레트로 게임 패드",
    art: ` _________________
|  _   _          |
| ( ) ( )   (X)   |
|  _|_ _    (Y)   |
| (___|_)         |
|_________________|`,
  },
  {
    id: "castle",
    category: "object",
    title: "🏰 레트로 캐슬 (Castle)",
    art: `   /\\     /\\     /\\
  /  \\   /  \\   /  \\
 | [] | | [] | | [] |
 |____|_|____|_|____|
   ||   |    |   ||
   ||   | [] |   ||
  /||\\  |____|  /||\\`,
  },
];

/* ────── 3. 다양한 문자셋 (10가지 확장) ────── */

const CHARSET_MAP = {
  Standard: "@%#*+=-:. ",
  Blocks: "█▓▒░ ",
  Binary: "10 ",
  Detailed: "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrftjft/\\|()1{}[]?-_+~<>i!lI;:,\"^'. ",
  Hacker: "01#$@;: ",
  MinimalDots: "●◐○· ",
  Shades: "██▓▒░ ",
  Minimalist: "Ww#$@:.- ",
  KPopStars: "✦★☆✧◦•. ",
  UnicodeBraille: "⣿⣦⣤⣤⣴⣿ ",
};

type CharsetName = keyof typeof CHARSET_MAP;

/* ────── 4. 텍스트 (한글 + 영문 캔버스 스캔) 아스키 변환 ────── */

function renderTextToCanvasAscii(text: string, fontChar: string = "█"): string {
  if (!text.trim()) return "";

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const fontSize = 16;
  ctx.font = `bold ${fontSize}px sans-serif`;
  const textMetrics = ctx.measureText(text);

  const w = Math.ceil(textMetrics.width) + 4;
  const h = fontSize + 6;

  canvas.width = w;
  canvas.height = h;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#000000";
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textBaseline = "middle";
  ctx.fillText(text, 2, h / 2);

  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  const lines: string[] = [];
  for (let y = 0; y < h; y += 2) {
    let line = "";
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const brightness = (r + g + b) / 3;

      if (brightness < 128) {
        line += fontChar;
      } else {
        line += " ";
      }
    }
    if (line.trim().length > 0) {
      lines.push(line);
    }
  }
  return lines.join("\n");
}

export default function AsciiArtPage() {
  const [activeTab, setActiveTab] = useState<"image" | "text" | "presets">("image");

  // 1. 이미지 변환 관련 State
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageWidth, setImageWidth] = useState<number>(75);
  const [charset, setCharset] = useState<CharsetName>("Standard");
  const [invert, setInvert] = useState<boolean>(false);
  const [imageAscii, setImageAscii] = useState<string>("");

  // 2. 텍스트 (한글+영문) 변환 관련 State
  const [textInput, setTextInput] = useState<string>("한글 & ASCII");
  const [textMode, setTextMode] = useState<"korean" | "english">("korean");
  const [engFont, setEngFont] = useState<FontName>("Block");
  const [blockChar, setBlockChar] = useState<string>("█");

  // 3. 프리셋 관련 State
  const [presetCategory, setPresetCategory] = useState<"all" | "cat" | "dog" | "kaomoji" | "object">("all");
  const [selectedPreset, setSelectedPreset] = useState<string>(PRESETS[0].art);

  // 4. 공통 뷰어 컨트롤 State (폰트 크기 조절 & 테마)
  const [colorTheme, setColorTheme] = useState<"monochrome" | "green" | "cyan" | "amber">("green");
  const [viewerFontSize, setViewerFontSize] = useState<"xs" | "sm" | "base">("xs");
  const [copied, setCopied] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 이미지 → ASCII 변환 실행
  const convertImageToAscii = useCallback((src: string, widthCount: number, cName: CharsetName, isInverted: boolean) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const aspectRatio = img.height / img.width;
      const heightCount = Math.floor(widthCount * aspectRatio * 0.52);

      canvas.width = widthCount;
      canvas.height = heightCount;

      ctx.drawImage(img, 0, 0, widthCount, heightCount);
      const imgData = ctx.getImageData(0, 0, widthCount, heightCount);
      const pixels = imgData.data;

      const charList = CHARSET_MAP[cName];
      const charLen = charList.length;

      let result = "";
      for (let y = 0; y < heightCount; y++) {
        for (let x = 0; x < widthCount; x++) {
          const idx = (y * widthCount + x) * 4;
          const r = pixels[idx];
          const g = pixels[idx + 1];
          const b = pixels[idx + 2];

          let brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          if (isInverted) brightness = 1 - brightness;

          const charIdx = Math.floor(brightness * (charLen - 1));
          result += charList[charIdx];
        }
        result += "\n";
      }
      setImageAscii(result);
    };
    img.src = src;
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setImageSrc(result);
        convertImageToAscii(result, imageWidth, charset, invert);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (imageSrc) {
      convertImageToAscii(imageSrc, imageWidth, charset, invert);
    }
  }, [imageSrc, imageWidth, charset, invert, convertImageToAscii]);

  const englishAscii = useMemo(() => {
    if (textMode !== "english") return "";
    const font = FONTS[engFont];
    const upper = textInput.toUpperCase();
    const chars = upper.split("").map((c) => font[c] ?? font[" "]);
    if (chars.length === 0) return "";

    const lines: string[] = [];
    for (let row = 0; row < 5; row++) {
      lines.push(chars.map((c) => c[row] ?? "").join(" "));
    }
    return lines.join("\n");
  }, [textInput, engFont, textMode]);

  const koreanAscii = useMemo(() => {
    if (textMode !== "korean") return "";
    if (typeof window === "undefined") return "";
    return renderTextToCanvasAscii(textInput, blockChar);
  }, [textInput, blockChar, textMode]);

  const filteredPresets = useMemo(() => {
    if (presetCategory === "all") return PRESETS;
    return PRESETS.filter((p) => p.category === presetCategory);
  }, [presetCategory]);

  const currentOutput = useMemo(() => {
    if (activeTab === "image") return imageAscii || "이미지를 업로드하시면 이 곳에 ASCII 아트로 변환됩니다.";
    if (activeTab === "presets") return selectedPreset;
    return textMode === "korean" ? koreanAscii : englishAscii;
  }, [activeTab, imageAscii, selectedPreset, textMode, koreanAscii, englishAscii]);

  const handleCopy = useCallback(async () => {
    if (!currentOutput) return;
    await navigator.clipboard.writeText(currentOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [currentOutput]);

  const handleDownloadTxt = () => {
    if (!currentOutput) return;
    const blob = new Blob([currentOutput], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ascii-art-toolkit.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="ASCII Art & 이미지 변환기"
      description="이미지를 ASCII 아트로 변환하거나 한글/영문 텍스트 및 다양한 고양이/캐릭터 아스키 모음을 생성합니다."
      icon={Pilcrow}
    >
      {/* ── 탭 메뉴 (이미지 변환 / 텍스트 변환 / 프리셋 모음) ── */}
      <div className="flex border-b border-border/80 pb-3 gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {[
          { id: "image", label: "🖼️ 이미지 → ASCII 변환", icon: ImageIcon },
          { id: "text", label: "✍️ 텍스트 (한글/영문)", icon: Type },
          { id: "presets", label: "🐱 귀여운 아스키 예시 모음", icon: Sparkles },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all ${
              activeTab === tab.id
                ? "bg-brand text-white shadow-md"
                : "bg-bg-secondary text-text-secondary hover:text-text-primary hover:bg-bg-secondary/80"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: 이미지 → ASCII 변환 컨트롤 ── */}
      {activeTab === "image" && (
        <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-border bg-bg-secondary p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-transform hover:scale-105"
              >
                <Upload size={14} />
                <span>이미지 파일 선택하기</span>
              </button>
              {imageSrc && (
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <Check size={13} /> 이미지 로드 완료
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <label className="font-semibold text-text-secondary">해상도(폭): {imageWidth}</label>
                <input
                  type="range"
                  min={30}
                  max={120}
                  value={imageWidth}
                  onChange={(e) => setImageWidth(Number(e.target.value))}
                  className="w-24 accent-brand"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="font-semibold text-text-secondary">문자셋 ({Object.keys(CHARSET_MAP).length}종)</label>
                <select
                  value={charset}
                  onChange={(e) => setCharset(e.target.value as CharsetName)}
                  className="rounded-lg border border-border bg-bg-primary px-3 py-1.5 text-xs text-text-primary focus:border-brand focus:outline-none"
                >
                  {Object.keys(CHARSET_MAP).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-1.5 font-semibold text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={invert}
                  onChange={(e) => setInvert(e.target.checked)}
                  className="rounded accent-brand"
                />
                <span>색상 반전</span>
              </label>
            </div>
          </div>

          {!imageSrc && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/80 bg-bg-primary/50 transition-colors hover:border-brand/60"
            >
              <ImageIcon size={32} className="text-text-secondary/50" />
              <p className="text-xs text-text-secondary">
                여기를 클릭하여 변환할 이미지(PNG, JPG, WebP)를 업로드하세요.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: 텍스트 (한글/영문) 변환 컨트롤 ── */}
      {activeTab === "text" && (
        <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-border bg-bg-secondary p-5">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex gap-1 rounded-xl border border-border bg-bg-primary p-1">
              <button
                type="button"
                onClick={() => setTextMode("korean")}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                  textMode === "korean" ? "bg-brand text-white" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                🇰🇷 한글 & 통합 텍스트
              </button>
              <button
                type="button"
                onClick={() => setTextMode("english")}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                  textMode === "english" ? "bg-brand text-white" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                🔤 영문 폰트 모드
              </button>
            </div>

            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value.slice(0, 25))}
              placeholder="변환할 텍스트 입력…"
              className="min-w-[220px] flex-1 rounded-xl border border-border bg-bg-primary px-4 py-2 text-xs sm:text-sm text-text-primary placeholder-text-secondary/50 focus:border-brand focus:outline-none"
            />

            {textMode === "korean" ? (
              <div className="flex items-center gap-2 text-xs">
                <label className="font-semibold text-text-secondary">출력 캐릭터</label>
                <select
                  value={blockChar}
                  onChange={(e) => setBlockChar(e.target.value)}
                  className="rounded-lg border border-border bg-bg-primary px-3 py-1.5 text-xs text-text-primary"
                >
                  <option value="█">█ (블록)</option>
                  <option value="★">★ (별)</option>
                  <option value="♥">♥ (하트)</option>
                  <option value="#"># (샵)</option>
                  <option value="@">@ (골뱅이)</option>
                </select>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs">
                <label className="font-semibold text-text-secondary">영문 폰트</label>
                <select
                  value={engFont}
                  onChange={(e) => setEngFont(e.target.value as FontName)}
                  className="rounded-lg border border-border bg-bg-primary px-3 py-1.5 text-xs text-text-primary"
                >
                  {(["Block", "Banner", "Simple"] as FontName[]).map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: 귀여운 아스키 예시 모음 (카테고리 필터링 포함) ── */}
      {activeTab === "presets" && (
        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-border bg-bg-secondary p-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold" style={{ scrollbarWidth: "none" }}>
            {[
              { id: "all", label: "전체 모음" },
              { id: "cat", label: "🐱 고양이" },
              { id: "dog", label: "🐶 강아지" },
              { id: "kaomoji", label: "🌸 이모티콘&캐릭터" },
              { id: "object", label: "🚀 사물&게임" },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setPresetCategory(cat.id as any)}
                className={`rounded-lg px-3 py-1.5 transition-colors ${
                  presetCategory === cat.id
                    ? "bg-brand text-white shadow-sm"
                    : "bg-bg-primary text-text-secondary hover:text-text-primary"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2.5 pt-1">
            {filteredPresets.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPreset(p.art)}
                className={`rounded-xl border px-3.5 py-2 text-xs font-bold transition-all ${
                  selectedPreset === p.art
                    ? "border-brand bg-brand/15 text-brand shadow-sm"
                    : "border-border/80 bg-bg-primary/60 text-text-secondary hover:border-brand/40 hover:text-text-primary"
                }`}
              >
                {p.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 5. 최종 ASCII 결과 뷰어 (기본적으로 길고 넉넉한 뷰어 제공) ── */}
      <div className="mt-6 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-text-primary">아스키 아트 결과</span>

            {/* 폰트 크기 조절 */}
            <div className="flex items-center gap-1 rounded-lg border border-border bg-bg-secondary p-1 text-[11px]">
              {[
                { id: "xs", label: "작게" },
                { id: "sm", label: "보통" },
                { id: "base", label: "크게" },
              ].map((sz) => (
                <button
                  key={sz.id}
                  type="button"
                  onClick={() => setViewerFontSize(sz.id as any)}
                  className={`rounded px-2 py-0.5 font-semibold transition-colors ${
                    viewerFontSize === sz.id ? "bg-brand text-white" : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {sz.label}
                </button>
              ))}
            </div>

            {/* 컬러 테마 버튼 */}
            <div className="flex items-center gap-1 rounded-lg border border-border bg-bg-secondary p-1 text-[11px]">
              {[
                { id: "green", label: "Matrix", color: "text-emerald-400" },
                { id: "cyan", label: "Cyberpunk", color: "text-sky-400" },
                { id: "amber", label: "Amber", color: "text-amber-400" },
                { id: "monochrome", label: "Mono", color: "text-text-primary" },
              ].map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setColorTheme(theme.id as any)}
                  className={`rounded px-2 py-0.5 font-semibold transition-colors ${
                    colorTheme === theme.id ? "bg-bg-primary " + theme.color : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {theme.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              disabled={!currentOutput}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-bg-secondary px-3.5 py-2 text-xs font-bold text-text-primary transition-all hover:border-brand hover:text-brand disabled:opacity-40"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? "복사완료!" : "클립보드 복사"}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadTxt}
              disabled={!currentOutput}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-bg-secondary px-3.5 py-2 text-xs font-bold text-text-primary transition-all hover:border-brand hover:text-brand disabled:opacity-40"
            >
              <Download size={14} />
              <span>.txt 다운로드</span>
            </button>
          </div>
        </div>

        {/* ASCII 결과 텍스트박스 (기본적으로 넉넉하고 길게 min-h-[500px] & rows=28 제공) */}
        <textarea
          readOnly
          value={currentOutput}
          rows={28}
          className={`w-full min-h-[500px] resize-y overflow-auto rounded-2xl border border-border bg-[#0d1117] p-5 font-mono leading-none transition-colors focus:outline-none ${
            viewerFontSize === "xs" ? "text-[11px]" : viewerFontSize === "sm" ? "text-xs" : "text-sm"
          } ${
            colorTheme === "green" ? "text-emerald-400" :
            colorTheme === "cyan" ? "text-sky-400" :
            colorTheme === "amber" ? "text-amber-400" : "text-gray-100"
          }`}
          style={{ whiteSpace: "pre", fontFamily: "Courier New, Courier, monospace", letterSpacing: "-0.5px" }}
        />
      </div>
    </ToolPageLayout>
  );
}
