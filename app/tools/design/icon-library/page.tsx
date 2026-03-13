"use client";

import { useState, useMemo } from "react";
import { Shapes, Copy, Check, Search, Smile } from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";

type Tab = "icon" | "emoji";

/* ══════════════════════════════════════════
   Lucide 아이콘
══════════════════════════════════════════ */
interface IconEntry {
  name: string;
  component: LucideIcon;
  category: string;
}

const RAW_ICONS: [string, string][] = [
  // UI / 레이아웃
  ["Home","UI"],["LayoutDashboard","UI"],["Sidebar","UI"],
  ["PanelLeft","UI"],["PanelRight","UI"],["Grid2x2","UI"],
  ["List","UI"],["Table","UI"],["Columns2","UI"],["Rows2","UI"],
  ["Menu","UI"],["AlignLeft","UI"],["AlignCenter","UI"],
  ["AlignRight","UI"],["AlignJustify","UI"],
  ["Maximize","UI"],["Minimize","UI"],["Maximize2","UI"],["Minimize2","UI"],
  ["Move","UI"],["GripVertical","UI"],["GripHorizontal","UI"],
  ["ToggleLeft","UI"],["ToggleRight","UI"],
  ["SlidersHorizontal","UI"],["ScrollText","UI"],
  ["BookOpen","UI"],["Notebook","UI"],["Tabs","UI"],

  // 화살표
  ["ArrowLeft","화살표"],["ArrowRight","화살표"],["ArrowUp","화살표"],["ArrowDown","화살표"],
  ["ArrowUpLeft","화살표"],["ArrowUpRight","화살표"],["ArrowDownLeft","화살표"],["ArrowDownRight","화살표"],
  ["ArrowUpDown","화살표"],["ArrowLeftRight","화살표"],
  ["ChevronLeft","화살표"],["ChevronRight","화살표"],["ChevronUp","화살표"],["ChevronDown","화살표"],
  ["ChevronsLeft","화살표"],["ChevronsRight","화살표"],["ChevronsUp","화살표"],["ChevronsDown","화살표"],
  ["MoveHorizontal","화살표"],["MoveVertical","화살표"],
  ["CornerUpLeft","화살표"],["CornerUpRight","화살표"],["CornerDownLeft","화살표"],["CornerDownRight","화살표"],
  ["Undo","화살표"],["Redo","화살표"],["Undo2","화살표"],["Redo2","화살표"],
  ["RotateCcw","화살표"],["RotateCw","화살표"],["RefreshCw","화살표"],["RefreshCcw","화살표"],
  ["TurnUpLeft","화살표"],["TurnUpRight","화살표"],

  // 액션
  ["Search","액션"],["Filter","액션"],["Plus","액션"],["Minus","액션"],
  ["X","액션"],["Check","액션"],["Edit","액션"],["Trash2","액션"],
  ["Copy","액션"],["Download","액션"],["Upload","액션"],["Share2","액션"],
  ["ZoomIn","액션"],["ZoomOut","액션"],["Save","액션"],["SaveAll","액션"],
  ["Clipboard","액션"],["ClipboardCheck","액션"],["ClipboardPaste","액션"],
  ["Pin","액션"],["PinOff","액션"],["ScanSearch","액션"],
  ["QrCode","액션"],["Barcode","액션"],["Link","액션"],["Unlink","액션"],
  ["ExternalLink","액션"],["Fullscreen","액션"],["Replace","액션"],["Wand2","액션"],

  // 파일 / 폴더
  ["File","파일"],["FileText","파일"],["Folder","파일"],["FolderOpen","파일"],
  ["FileJson","파일"],["FileCode","파일"],["FilePlus","파일"],["FileOutput","파일"],
  ["Archive","파일"],["FileImage","파일"],["FileVideo","파일"],["FileAudio","파일"],
  ["FileCheck","파일"],["FileMinus","파일"],["FileX","파일"],["FileSearch","파일"],
  ["FolderPlus","파일"],["FolderMinus","파일"],["FolderX","파일"],["FolderCheck","파일"],
  ["FolderSearch","파일"],["PackageOpen","파일"],["Package","파일"],["Inbox","파일"],

  // 디자인
  ["Palette","디자인"],["Pipette","디자인"],["Layers","디자인"],["Shapes","디자인"],
  ["PenTool","디자인"],["Scissors","디자인"],["Image","디자인"],["ImageDown","디자인"],
  ["Crop","디자인"],["Type","디자인"],["Bold","디자인"],["Italic","디자인"],
  ["Underline","디자인"],["Strikethrough","디자인"],
  ["Eraser","디자인"],["Highlighter","디자인"],["Paintbrush","디자인"],["Pencil","디자인"],["Ruler","디자인"],
  ["Square","디자인"],["Circle","디자인"],["Triangle","디자인"],["Hexagon","디자인"],
  ["Frame","디자인"],["Blend","디자인"],["Spline","디자인"],["VectorSquare","디자인"],

  // 코드 / 개발
  ["Code2","코드"],["Terminal","코드"],["GitBranch","코드"],["GitCommit","코드"],
  ["GitMerge","코드"],["Bug","코드"],["Braces","코드"],["Hash","코드"],
  ["Variable","코드"],["GitPullRequest","코드"],["GitFork","코드"],
  ["Cpu","코드"],["Server","코드"],["Database","코드"],["HardDrive","코드"],
  ["CodeXml","코드"],["Binary","코드"],["Webhook","코드"],["Network","코드"],["Workflow","코드"],
  ["MonitorSmartphone","코드"],["Laptop","코드"],["Tablet","코드"],

  // 통신 / 소셜
  ["Mail","통신"],["Phone","통신"],["MessageCircle","통신"],["MessageSquare","통신"],
  ["Bell","통신"],["BellOff","통신"],["AtSign","통신"],["Send","통신"],
  ["Rss","통신"],["Globe","통신"],["Globe2","통신"],["Voicemail","통신"],["Contact","통신"],
  ["PhoneCall","통신"],["PhoneOff","통신"],["MailOpen","통신"],

  // 상태 / 보안
  ["Info","상태"],["AlertCircle","상태"],["AlertTriangle","상태"],
  ["CheckCircle","상태"],["XCircle","상태"],["HelpCircle","상태"],
  ["Loader2","상태"],["Lock","상태"],["Unlock","상태"],
  ["ShieldCheck","상태"],["ShieldAlert","상태"],["ShieldX","상태"],["Shield","상태"],
  ["Eye","상태"],["EyeOff","상태"],["Fingerprint","상태"],["KeyRound","상태"],["Key","상태"],

  // 미디어
  ["Play","미디어"],["Pause","미디어"],["Square22","미디어"],
  ["SkipForward","미디어"],["SkipBack","미디어"],["FastForward","미디어"],["Rewind","미디어"],
  ["Volume","미디어"],["Volume1","미디어"],["Volume2","미디어"],["VolumeX","미디어"],
  ["Music","미디어"],["Headphones","미디어"],["Mic","미디어"],["MicOff","미디어"],
  ["Camera","미디어"],["CameraOff","미디어"],["Video","미디어"],["VideoOff","미디어"],
  ["Radio","미디어"],["Cast","미디어"],["Tv","미디어"],["Film","미디어"],["Clapperboard","미디어"],

  // 차트 / 분석
  ["BarChart","차트"],["BarChart2","차트"],["BarChart3","차트"],
  ["PieChart","차트"],["LineChart","차트"],["AreaChart","차트"],
  ["TrendingUp","차트"],["TrendingDown","차트"],["Activity","차트"],["Gauge","차트"],
  ["ScatterChart","차트"],["Sigma","차트"],["Percent","차트"],

  // 커머스
  ["ShoppingCart","커머스"],["ShoppingBag","커머스"],["CreditCard","커머스"],
  ["Wallet","커머스"],["DollarSign","커머스"],["Receipt","커머스"],
  ["Store","커머스"],["Tag","커머스"],["Truck","커머스"],["Package2","커머스"],["Banknote","커머스"],

  // 기타
  ["Star","기타"],["Heart","기타"],["Bookmark","기타"],
  ["Settings","기타"],["Settings2","기타"],["User","기타"],["Users","기타"],["UserPlus","기타"],
  ["Map","기타"],["MapPin","기타"],["Navigation","기타"],["Compass","기타"],["Route","기타"],
  ["Sun","기타"],["Moon","기타"],["Cloud","기타"],["CloudRain","기타"],["CloudSnow","기타"],
  ["Zap","기타"],["Battery","기타"],["BatteryCharging","기타"],["Plug","기타"],
  ["Calendar","기타"],["CalendarDays","기타"],["Clock","기타"],["Timer","기타"],["AlarmClock","기타"],
  ["Building","기타"],["Building2","기타"],["Warehouse","기타"],["Home2","기타"],
  ["Thermometer","기타"],["Umbrella","기타"],["Wind","기타"],
  ["Award","기타"],["Gift","기타"],["Flag","기타"],["Rocket","기타"],["Gem","기타"],
];

const ICON_LIST: IconEntry[] = RAW_ICONS.flatMap(([name, category]) => {
  const component = (LucideIcons as Record<string, unknown>)[name] as LucideIcon | undefined;
  if (!component) return [];
  return [{ name, component, category }];
});

const ICON_CATEGORIES = ["전체", ...Array.from(new Set(RAW_ICONS.map(([, c]) => c)))];

/* ══════════════════════════════════════════
   이모지
══════════════════════════════════════════ */
interface EmojiEntry {
  char: string;
  name: string;
}

const EMOJI_DATA: { category: string; items: EmojiEntry[] }[] = [
  {
    category: "스마일리",
    items: [
      {char:"😀",name:"웃음"},{char:"😃",name:"기쁨"},{char:"😄",name:"환한웃음"},{char:"😁",name:"활짝웃음"},
      {char:"😆",name:"크게웃음"},{char:"😅",name:"식은땀"},{char:"🤣",name:"뒹굴며웃음"},{char:"😂",name:"눈물웃음"},
      {char:"🙂",name:"미소"},{char:"🙃",name:"거꾸로미소"},{char:"😉",name:"윙크"},{char:"😊",name:"수줍은미소"},
      {char:"😇",name:"천사"},{char:"🥰",name:"사랑스러움"},{char:"😍",name:"반짝눈사랑"},{char:"🤩",name:"별눈"},
      {char:"😘",name:"키스"},{char:"😗",name:"입맞춤"},{char:"😚",name:"눈감고키스"},{char:"😙",name:"미소키스"},
      {char:"🥲",name:"울며웃음"},{char:"😋",name:"맛있다"},{char:"😛",name:"혀내밀기"},{char:"😜",name:"윙크혀"},
      {char:"🤪",name:"들뜸"},{char:"😝",name:"눈감고혀"},{char:"🤑",name:"돈눈"},{char:"🤗",name:"포옹"},
      {char:"🤭",name:"손으로입막기"},{char:"🤫",name:"쉿"},{char:"🤔",name:"생각중"},{char:"🤐",name:"입조심"},
      {char:"🤨",name:"의심"},{char:"😐",name:"무표정"},{char:"😑",name:"무감각"},{char:"😶",name:"입없음"},
      {char:"😏",name:"능글맞음"},{char:"😒",name:"불만"},{char:"🙄",name:"눈굴리기"},{char:"😬",name:"민망함"},
      {char:"🤥",name:"거짓말"},{char:"😌",name:"안도"},{char:"😔",name:"우울"},{char:"😪",name:"졸림"},
      {char:"🤤",name:"침흘림"},{char:"😴",name:"수면"},{char:"😷",name:"마스크"},{char:"🤒",name:"아픔"},
      {char:"🤕",name:"머리부상"},{char:"🤢",name:"메스꺼움"},{char:"🤮",name:"토함"},{char:"🤧",name:"재채기"},
      {char:"🥵",name:"더위"},{char:"🥶",name:"추위"},{char:"🥴",name:"취함"},{char:"😵",name:"어지러움"},
      {char:"🤯",name:"머리폭발"},{char:"🤠",name:"카우보이"},{char:"🥳",name:"파티"},{char:"🥸",name:"변장"},
      {char:"😎",name:"멋짐"},{char:"🤓",name:"공부벌레"},{char:"🧐",name:"심사숙고"},
      {char:"😕",name:"혼란"},{char:"😟",name:"걱정"},{char:"🙁",name:"약간슬픔"},{char:"☹️",name:"슬픔"},
      {char:"😮",name:"놀람"},{char:"😯",name:"입벌림"},{char:"😲",name:"충격"},{char:"😳",name:"당혹"},
      {char:"🥺",name:"애원"},{char:"😦",name:"경악"},{char:"😧",name:"고통"},{char:"😨",name:"공포"},
      {char:"😰",name:"불안땀"},{char:"😥",name:"안도눈물"},{char:"😢",name:"눈물"},{char:"😭",name:"엉엉"},
      {char:"😱",name:"비명"},{char:"😖",name:"곤혹"},{char:"😣",name:"고생"},{char:"😞",name:"실망"},
      {char:"😓",name:"풀죽음"},{char:"😩",name:"지침"},{char:"😫",name:"탈진"},{char:"🥱",name:"하품"},
      {char:"😤",name:"콧김"},{char:"😡",name:"분노"},{char:"😠",name:"화남"},{char:"🤬",name:"욕"},
      {char:"😈",name:"악마미소"},{char:"👿",name:"화난악마"},{char:"💀",name:"해골"},{char:"☠️",name:"독해골"},
      {char:"💩",name:"응가"},{char:"🤡",name:"광대"},{char:"👹",name:"도깨비"},{char:"👺",name:"빨간도깨비"},
      {char:"👻",name:"유령"},{char:"👽",name:"외계인"},{char:"👾",name:"외계인몬스터"},{char:"🤖",name:"로봇"},
    ],
  },
  {
    category: "손 & 몸",
    items: [
      {char:"👋",name:"손흔들기"},{char:"🤚",name:"손바닥"},{char:"🖐️",name:"다섯손가락"},{char:"✋",name:"손멈춤"},
      {char:"🖖",name:"브이살짝"},{char:"👌",name:"OK"},{char:"🤌",name:"핀치"},{char:"✌️",name:"브이"},
      {char:"🤞",name:"행운교차"},{char:"🤟",name:"아이러브유"},{char:"🤘",name:"록"},
      {char:"🤙",name:"전화해"},{char:"👈",name:"왼쪽가리킴"},{char:"👉",name:"오른쪽가리킴"},
      {char:"👆",name:"위가리킴"},{char:"☝️",name:"검지위"},{char:"👇",name:"아래가리킴"},
      {char:"👍",name:"좋아요"},{char:"👎",name:"싫어요"},{char:"✊",name:"주먹"},
      {char:"👊",name:"펀치"},{char:"🤛",name:"왼쪽주먹"},{char:"🤜",name:"오른쪽주먹"},
      {char:"🤝",name:"악수"},{char:"🙌",name:"만세"},{char:"👏",name:"박수"},
      {char:"🫶",name:"하트손"},{char:"🙏",name:"감사기도"},{char:"✍️",name:"글쓰기"},
      {char:"💅",name:"매니큐어"},{char:"🤳",name:"셀카"},{char:"💪",name:"근육"},
      {char:"🦾",name:"로봇팔"},{char:"👁️",name:"눈"},{char:"👅",name:"혀"},{char:"👄",name:"입술"},
      {char:"🫀",name:"심장"},{char:"🫁",name:"폐"},{char:"🧠",name:"뇌"},{char:"🦷",name:"치아"},
      {char:"🦴",name:"뼈"},{char:"👀",name:"두눈"},
    ],
  },
  {
    category: "사람",
    items: [
      {char:"👶",name:"아기"},{char:"🧒",name:"어린이"},{char:"👦",name:"소년"},{char:"👧",name:"소녀"},
      {char:"🧑",name:"사람"},{char:"👱",name:"금발"},{char:"👨",name:"남자"},{char:"🧔",name:"수염남"},
      {char:"👩",name:"여자"},{char:"🧓",name:"노인"},{char:"👴",name:"할아버지"},{char:"👵",name:"할머니"},
      {char:"🙍",name:"불만인사람"},{char:"🙎",name:"토라진사람"},{char:"🙅",name:"안돼"},{char:"🙆",name:"오케이"},
      {char:"💁",name:"안내"},{char:"🙋",name:"손들기"},{char:"🧏",name:"청각장애"},{char:"🙇",name:"인사"},
      {char:"🤦",name:"한심"},{char:"🤷",name:"모르겠음"},{char:"💆",name:"마사지"},{char:"💇",name:"이발"},
      {char:"🚶",name:"걷기"},{char:"🧍",name:"서있기"},{char:"🧎",name:"무릎꿇기"},{char:"🏃",name:"달리기"},
      {char:"💃",name:"여자춤"},{char:"🕺",name:"남자춤"},{char:"🧖",name:"사우나"},{char:"🧗",name:"암벽등반"},
      {char:"🏇",name:"승마"},{char:"⛷️",name:"스키"},{char:"🏋️",name:"역도"},{char:"🤸",name:"체조"},
      {char:"👫",name:"남녀커플"},{char:"👬",name:"남남커플"},{char:"👭",name:"여여커플"},{char:"💑",name:"연인"},
      {char:"👨‍👩‍👦",name:"가족"},{char:"👨‍💻",name:"개발자"},{char:"👩‍💻",name:"여개발자"},
      {char:"🧑‍🎨",name:"아티스트"},{char:"🧑‍🏫",name:"선생님"},{char:"🧑‍🍳",name:"요리사"},
    ],
  },
  {
    category: "동물 & 자연",
    items: [
      {char:"🐶",name:"강아지"},{char:"🐱",name:"고양이"},{char:"🐭",name:"쥐"},{char:"🐹",name:"햄스터"},
      {char:"🐰",name:"토끼"},{char:"🦊",name:"여우"},{char:"🐻",name:"곰"},{char:"🐼",name:"판다"},
      {char:"🐨",name:"코알라"},{char:"🐯",name:"호랑이"},{char:"🦁",name:"사자"},{char:"🐮",name:"소"},
      {char:"🐷",name:"돼지"},{char:"🐸",name:"개구리"},{char:"🐵",name:"원숭이"},{char:"🙈",name:"안봐"},
      {char:"🙉",name:"안들어"},{char:"🙊",name:"안말해"},{char:"🐔",name:"닭"},{char:"🐧",name:"펭귄"},
      {char:"🐦",name:"새"},{char:"🦆",name:"오리"},{char:"🦅",name:"독수리"},{char:"🦉",name:"올빼미"},
      {char:"🦇",name:"박쥐"},{char:"🐺",name:"늑대"},{char:"🐗",name:"멧돼지"},{char:"🐴",name:"말"},
      {char:"🦄",name:"유니콘"},{char:"🐝",name:"벌"},{char:"🦋",name:"나비"},{char:"🐌",name:"달팽이"},
      {char:"🐞",name:"무당벌레"},{char:"🐜",name:"개미"},{char:"🦟",name:"모기"},{char:"🕷️",name:"거미"},
      {char:"🦂",name:"전갈"},{char:"🐢",name:"거북이"},{char:"🐍",name:"뱀"},{char:"🦎",name:"도마뱀"},
      {char:"🐙",name:"문어"},{char:"🦑",name:"오징어"},{char:"🦐",name:"새우"},{char:"🦀",name:"게"},
      {char:"🐡",name:"복어"},{char:"🐟",name:"물고기"},{char:"🐠",name:"열대어"},{char:"🐬",name:"돌고래"},
      {char:"🐳",name:"고래"},{char:"🦈",name:"상어"},{char:"🐊",name:"악어"},{char:"🐘",name:"코끼리"},
      {char:"🦒",name:"기린"},{char:"🦓",name:"얼룩말"},{char:"🦏",name:"코뿔소"},{char:"🐪",name:"낙타"},
      {char:"🌵",name:"선인장"},{char:"🎄",name:"크리스마스트리"},{char:"🌲",name:"침엽수"},{char:"🌳",name:"낙엽수"},
      {char:"🌴",name:"야자수"},{char:"🌱",name:"새싹"},{char:"🌿",name:"풀잎"},{char:"☘️",name:"클로버"},
      {char:"🍀",name:"네잎클로버"},{char:"🍃",name:"바람잎"},{char:"🍂",name:"낙엽"},{char:"🍁",name:"단풍"},
      {char:"🍄",name:"버섯"},{char:"🌾",name:"벼이삭"},{char:"🌷",name:"튤립"},{char:"🌹",name:"장미"},
      {char:"🥀",name:"시든장미"},{char:"🌺",name:"꽃"},{char:"🌸",name:"벚꽃"},{char:"🌼",name:"꽃"},
      {char:"🌻",name:"해바라기"},{char:"🌞",name:"웃는해"},{char:"🌝",name:"보름달얼굴"},{char:"🌙",name:"초승달"},
      {char:"⭐",name:"별"},{char:"🌟",name:"빛나는별"},{char:"💫",name:"빙글별"},{char:"✨",name:"반짝"},
      {char:"🌈",name:"무지개"},{char:"☁️",name:"구름"},{char:"⛅",name:"구름해"},{char:"🌧️",name:"비"},
      {char:"⛈️",name:"천둥번개"},{char:"🌩️",name:"번개"},{char:"🌨️",name:"눈"},{char:"❄️",name:"눈결정"},
      {char:"☃️",name:"눈사람"},{char:"🌊",name:"파도"},{char:"🌬️",name:"바람"},{char:"🌪️",name:"회오리"},
    ],
  },
  {
    category: "음식 & 음료",
    items: [
      {char:"🍎",name:"사과"},{char:"🍐",name:"배"},{char:"🍊",name:"오렌지"},{char:"🍋",name:"레몬"},
      {char:"🍌",name:"바나나"},{char:"🍉",name:"수박"},{char:"🍇",name:"포도"},{char:"🍓",name:"딸기"},
      {char:"🫐",name:"블루베리"},{char:"🍒",name:"체리"},{char:"🍑",name:"복숭아"},{char:"🥭",name:"망고"},
      {char:"🍍",name:"파인애플"},{char:"🥥",name:"코코넛"},{char:"🥝",name:"키위"},{char:"🍅",name:"토마토"},
      {char:"🥑",name:"아보카도"},{char:"🍆",name:"가지"},{char:"🥦",name:"브로콜리"},{char:"🥬",name:"상추"},
      {char:"🥒",name:"오이"},{char:"🌶️",name:"고추"},{char:"🧄",name:"마늘"},{char:"🧅",name:"양파"},
      {char:"🥔",name:"감자"},{char:"🌽",name:"옥수수"},{char:"🥕",name:"당근"},{char:"🧀",name:"치즈"},
      {char:"🥚",name:"달걀"},{char:"🍳",name:"계란프라이"},{char:"🥞",name:"팬케이크"},{char:"🧇",name:"와플"},
      {char:"🥓",name:"베이컨"},{char:"🥩",name:"스테이크"},{char:"🍗",name:"치킨다리"},{char:"🍖",name:"고기"},
      {char:"🌭",name:"핫도그"},{char:"🍔",name:"버거"},{char:"🍟",name:"감자튀김"},{char:"🍕",name:"피자"},
      {char:"🌮",name:"타코"},{char:"🌯",name:"부리토"},{char:"🥙",name:"주머니빵"},{char:"🍜",name:"라면"},
      {char:"🍝",name:"스파게티"},{char:"🍣",name:"초밥"},{char:"🍱",name:"도시락"},{char:"🍛",name:"카레"},
      {char:"🍚",name:"밥"},{char:"🍙",name:"주먹밥"},{char:"🍘",name:"전병"},{char:"🥟",name:"만두"},
      {char:"🍦",name:"소프트아이스크림"},{char:"🍧",name:"빙수"},{char:"🍨",name:"아이스크림"},{char:"🍩",name:"도넛"},
      {char:"🍪",name:"쿠키"},{char:"🎂",name:"생일케이크"},{char:"🍰",name:"케이크조각"},{char:"🧁",name:"컵케이크"},
      {char:"🍫",name:"초콜릿"},{char:"🍬",name:"사탕"},{char:"🍭",name:"막대사탕"},
      {char:"☕",name:"커피"},{char:"🍵",name:"차"},{char:"🧃",name:"주스"},{char:"🥤",name:"음료수"},
      {char:"🧋",name:"버블티"},{char:"🍺",name:"맥주"},{char:"🍻",name:"건배"},{char:"🥂",name:"샴페인"},
      {char:"🍷",name:"와인"},{char:"🍸",name:"칵테일"},{char:"🍹",name:"트로피컬"},{char:"🧊",name:"얼음"},
    ],
  },
  {
    category: "여행 & 장소",
    items: [
      {char:"🚗",name:"자동차"},{char:"🚕",name:"택시"},{char:"🚙",name:"SUV"},{char:"🚌",name:"버스"},
      {char:"🚎",name:"트롤리버스"},{char:"🏎️",name:"경주차"},{char:"🚓",name:"경찰차"},{char:"🚑",name:"구급차"},
      {char:"🚒",name:"소방차"},{char:"🚐",name:"미니밴"},{char:"🛻",name:"픽업트럭"},{char:"🚚",name:"배달트럭"},
      {char:"🚛",name:"트레일러"},{char:"🚜",name:"트랙터"},{char:"🏍️",name:"오토바이"},{char:"🛵",name:"스쿠터"},
      {char:"🚲",name:"자전거"},{char:"🛴",name:"킥보드"},{char:"🛹",name:"스케이트보드"},{char:"🚨",name:"경광등"},
      {char:"🚥",name:"신호등"},{char:"🚦",name:"신호등세로"},{char:"🚧",name:"공사중"},
      {char:"⛵",name:"범선"},{char:"🚤",name:"보트"},{char:"🛥️",name:"모터보트"},{char:"🚢",name:"크루즈"},
      {char:"✈️",name:"비행기"},{char:"🛩️",name:"경비행기"},{char:"🚀",name:"로켓"},{char:"🛸",name:"UFO"},
      {char:"🚁",name:"헬리콥터"},{char:"🚂",name:"기관차"},{char:"🚇",name:"지하철"},{char:"🚈",name:"경전철"},
      {char:"🗺️",name:"지도"},{char:"🧭",name:"나침반"},{char:"🏔️",name:"산봉우리"},{char:"⛰️",name:"산"},
      {char:"🌋",name:"화산"},{char:"🏕️",name:"캠핑"},{char:"🏖️",name:"해변"},{char:"🏜️",name:"사막"},
      {char:"🏝️",name:"섬"},{char:"🏞️",name:"국립공원"},{char:"🏟️",name:"경기장"},{char:"🏛️",name:"신전"},
      {char:"🏗️",name:"건설중"},{char:"🏘️",name:"주택단지"},{char:"🏠",name:"집"},{char:"🏡",name:"정원있는집"},
      {char:"🏢",name:"빌딩"},{char:"🏣",name:"우체국"},{char:"🏥",name:"병원"},{char:"🏦",name:"은행"},
      {char:"🏨",name:"호텔"},{char:"🏪",name:"편의점"},{char:"🏫",name:"학교"},{char:"🏬",name:"백화점"},
      {char:"🏯",name:"성"},{char:"🏰",name:"유럽성"},{char:"💒",name:"교회"},{char:"🗼",name:"도쿄타워"},
      {char:"🗽",name:"자유의여신상"},{char:"⛩️",name:"도리이"},{char:"🕌",name:"모스크"},
    ],
  },
  {
    category: "활동 & 스포츠",
    items: [
      {char:"⚽",name:"축구"},{char:"🏀",name:"농구"},{char:"🏈",name:"미식축구"},{char:"⚾",name:"야구"},
      {char:"🥎",name:"소프트볼"},{char:"🎾",name:"테니스"},{char:"🏐",name:"배구"},{char:"🏉",name:"럭비"},
      {char:"🥏",name:"프리스비"},{char:"🎱",name:"당구"},{char:"🏓",name:"탁구"},{char:"🏸",name:"배드민턴"},
      {char:"🏒",name:"하키"},{char:"🥍",name:"라크로스"},{char:"🏑",name:"필드하키"},{char:"🏏",name:"크리켓"},
      {char:"⛳",name:"골프"},{char:"🏹",name:"양궁"},{char:"🎣",name:"낚시"},{char:"🤿",name:"스쿠버다이빙"},
      {char:"🥊",name:"복싱장갑"},{char:"🥋",name:"도복"},{char:"🎽",name:"운동복"},
      {char:"⛷️",name:"스키"},{char:"🏂",name:"스노보드"},{char:"🪂",name:"스카이다이빙"},
      {char:"🏋️",name:"역도"},{char:"🤼",name:"레슬링"},{char:"🤸",name:"체조"},{char:"🤺",name:"펜싱"},
      {char:"⛹️",name:"농구슛"},{char:"🤾",name:"핸드볼"},{char:"🏌️",name:"골프스윙"},
      {char:"🏄",name:"서핑"},{char:"🚣",name:"카누"},{char:"🧗",name:"클라이밍"},
      {char:"🚵",name:"산악자전거"},{char:"🚴",name:"사이클"},{char:"🏆",name:"트로피"},
      {char:"🥇",name:"금메달"},{char:"🥈",name:"은메달"},{char:"🥉",name:"동메달"},{char:"🏅",name:"메달"},
      {char:"🎖️",name:"군사훈장"},{char:"🎪",name:"서커스"},{char:"🤹",name:"저글링"},{char:"🎭",name:"공연"},
      {char:"🎨",name:"그림"},{char:"🎬",name:"영화촬영"},{char:"🎤",name:"마이크"},
      {char:"🎧",name:"헤드폰"},{char:"🎼",name:"악보"},{char:"🎹",name:"피아노"},
      {char:"🥁",name:"드럼"},{char:"🎷",name:"색소폰"},{char:"🎺",name:"트럼펫"},
      {char:"🎸",name:"기타"},{char:"🎻",name:"바이올린"},{char:"🎲",name:"주사위"},
      {char:"♟️",name:"체스"},{char:"🎯",name:"다트"},{char:"🎳",name:"볼링"},
      {char:"🎮",name:"게임패드"},{char:"🕹️",name:"조이스틱"},{char:"🧩",name:"퍼즐"},
    ],
  },
  {
    category: "사물 & 기술",
    items: [
      {char:"📱",name:"스마트폰"},{char:"💻",name:"노트북"},{char:"🖥️",name:"모니터"},{char:"🖨️",name:"프린터"},
      {char:"⌨️",name:"키보드"},{char:"🖱️",name:"마우스"},{char:"💽",name:"디스크"},{char:"💾",name:"플로피디스크"},
      {char:"💿",name:"CD"},{char:"📀",name:"DVD"},{char:"📷",name:"카메라"},{char:"📸",name:"카메라플래시"},
      {char:"📹",name:"비디오카메라"},{char:"🎥",name:"영화카메라"},{char:"📺",name:"TV"},
      {char:"📻",name:"라디오"},{char:"☎️",name:"전화기"},{char:"📞",name:"수화기"},{char:"📟",name:"삐삐"},
      {char:"🔋",name:"배터리"},{char:"🔌",name:"전원플러그"},{char:"💡",name:"전구"},{char:"🔦",name:"손전등"},
      {char:"🕯️",name:"양초"},{char:"🔭",name:"망원경"},{char:"🔬",name:"현미경"},{char:"🧬",name:"DNA"},
      {char:"💊",name:"약"},{char:"💉",name:"주사"},{char:"🩺",name:"청진기"},{char:"🩹",name:"반창고"},
      {char:"🧰",name:"공구함"},{char:"🔧",name:"렌치"},{char:"🔨",name:"망치"},{char:"⚒️",name:"곡괭이"},
      {char:"🛠️",name:"망치렌치"},{char:"🪛",name:"드라이버"},{char:"🔩",name:"볼트"},{char:"🪝",name:"고리"},
      {char:"🪜",name:"사다리"},{char:"🧲",name:"자석"},{char:"🔑",name:"열쇠"},{char:"🗝️",name:"옛열쇠"},
      {char:"🔒",name:"자물쇠잠김"},{char:"🔓",name:"자물쇠열림"},{char:"🚪",name:"문"},{char:"🪟",name:"창문"},
      {char:"🛋️",name:"소파"},{char:"🪑",name:"의자"},{char:"🚽",name:"변기"},{char:"🚿",name:"샤워기"},
      {char:"🛒",name:"쇼핑카트"},{char:"🧴",name:"로션"},{char:"🧹",name:"빗자루"},{char:"🧺",name:"세탁바구니"},
      {char:"🧻",name:"화장지"},{char:"🧼",name:"비누"},{char:"🪣",name:"양동이"},{char:"🧽",name:"스펀지"},
      {char:"📚",name:"책들"},{char:"📖",name:"책"},{char:"📝",name:"메모"},{char:"✏️",name:"연필"},
      {char:"🖊️",name:"펜"},{char:"🖋️",name:"만년필"},{char:"📌",name:"압정"},{char:"📍",name:"빨간핀"},
      {char:"📎",name:"클립"},{char:"✂️",name:"가위"},{char:"📏",name:"자"},{char:"📐",name:"삼각자"},
      {char:"🗑️",name:"휴지통"},
    ],
  },
  {
    category: "심볼",
    items: [
      {char:"❤️",name:"하트"},{char:"🧡",name:"주황하트"},{char:"💛",name:"노란하트"},{char:"💚",name:"초록하트"},
      {char:"💙",name:"파란하트"},{char:"💜",name:"보라하트"},{char:"🖤",name:"검은하트"},{char:"🤍",name:"흰하트"},
      {char:"🤎",name:"갈색하트"},{char:"💔",name:"깨진하트"},{char:"❣️",name:"느낌표하트"},
      {char:"💕",name:"두하트"},{char:"💞",name:"회전하트"},{char:"💓",name:"두근두근"},{char:"💗",name:"분홍하트"},
      {char:"💖",name:"빛나는하트"},{char:"💘",name:"화살하트"},{char:"💝",name:"리본하트"},
      {char:"✅",name:"체크확인"},{char:"❎",name:"X확인"},{char:"🔴",name:"빨간원"},{char:"🟠",name:"주황원"},
      {char:"🟡",name:"노란원"},{char:"🟢",name:"초록원"},{char:"🔵",name:"파란원"},{char:"🟣",name:"보라원"},
      {char:"⚫",name:"검은원"},{char:"⚪",name:"흰원"},{char:"🟤",name:"갈색원"},
      {char:"🔶",name:"주황마름모"},{char:"🔷",name:"파란마름모"},{char:"🔸",name:"작은주황마름모"},{char:"🔹",name:"작은파란마름모"},
      {char:"🔺",name:"빨간삼각위"},{char:"🔻",name:"빨간삼각아래"},
      {char:"⭐",name:"별"},{char:"🌟",name:"빛나는별"},{char:"💫",name:"빙글별"},{char:"✨",name:"반짝반짝"},
      {char:"🎵",name:"음표"},{char:"🎶",name:"두음표"},{char:"❗",name:"느낌표"},{char:"❕",name:"흰느낌표"},
      {char:"❓",name:"물음표"},{char:"❔",name:"흰물음표"},{char:"‼️",name:"이중느낌표"},{char:"⁉️",name:"느낌물음"},
      {char:"♻️",name:"재활용"},{char:"✅",name:"완료"},{char:"🔰",name:"새싹마크"},{char:"⚠️",name:"경고"},
      {char:"🚫",name:"금지"},{char:"⛔",name:"진입금지"},{char:"🔞",name:"성인"},
      {char:"💯",name:"100점"},{char:"🔝",name:"탑"},{char:"🆕",name:"뉴"},{char:"🆓",name:"무료"},
      {char:"🆒",name:"쿨"},{char:"🆙",name:"업"},{char:"🔥",name:"불"},{char:"⚡",name:"번개"},
      {char:"💥",name:"폭발"},{char:"🎉",name:"파티크래커"},{char:"🎊",name:"파티볼"},{char:"🎈",name:"풍선"},
      {char:"🎁",name:"선물"},{char:"🏆",name:"트로피"},{char:"🥳",name:"파티얼굴"},{char:"🎀",name:"리본"},
      {char:"🔔",name:"종"},{char:"🔕",name:"종끄기"},{char:"📢",name:"확성기"},{char:"📣",name:"메가폰"},
    ],
  },
];

const EMOJI_ALL_CATEGORIES = ["전체", ...EMOJI_DATA.map((d) => d.category)];

const EMOJI_FLAT: (EmojiEntry & { category: string })[] = EMOJI_DATA.flatMap((d) =>
  d.items.map((item) => ({ ...item, category: d.category }))
);

/* ══════════════════════════════════════════
   공통 상수
══════════════════════════════════════════ */
const BREADCRUMBS = [
  { label: "홈", href: "/" },
  { label: "Design", href: "/tools/design" },
];

/* ══════════════════════════════════════════
   메인 페이지
══════════════════════════════════════════ */
export default function IconLibraryPage() {
  const [tab, setTab] = useState<Tab>("icon");

  // 아이콘 탭 상태
  const [iconQuery, setIconQuery]       = useState("");
  const [iconCategory, setIconCategory] = useState("전체");
  const [copied, setCopied]             = useState<string | null>(null);
  const [copyMode, setCopyMode]         = useState<"svg" | "react">("react");

  // 이모지 탭 상태
  const [emojiQuery, setEmojiQuery]         = useState("");
  const [emojiCategory, setEmojiCategory]   = useState("전체");

  /* ── 아이콘 필터 ── */
  const filteredIcons = useMemo(() =>
    ICON_LIST.filter((icon) => {
      const matchSearch = icon.name.toLowerCase().includes(iconQuery.toLowerCase());
      const matchCat    = iconCategory === "전체" || icon.category === iconCategory;
      return matchSearch && matchCat;
    }),
  [iconQuery, iconCategory]);

  /* ── 이모지 필터 ── */
  const filteredEmojis = useMemo(() =>
    EMOJI_FLAT.filter((e) => {
      const matchSearch = e.name.includes(emojiQuery) || e.char.includes(emojiQuery);
      const matchCat    = emojiCategory === "전체" || e.category === emojiCategory;
      return matchSearch && matchCat;
    }),
  [emojiQuery, emojiCategory]);

  /* ── 복사 핸들러 ── */
  const handleIconCopy = async (icon: IconEntry) => {
    let text: string;
    if (copyMode === "react") {
      text = `import { ${icon.name} } from 'lucide-react';\n\n<${icon.name} size={24} />`;
    } else {
      const el = document.querySelector(`[data-icon="${icon.name}"] svg`);
      text = el ? el.outerHTML : `<!-- ${icon.name} SVG -->`;
    }
    await navigator.clipboard.writeText(text);
    setCopied(icon.name);
    setTimeout(() => setCopied(null), 1800);
  };

  const handleEmojiCopy = async (emoji: EmojiEntry) => {
    await navigator.clipboard.writeText(emoji.char);
    setCopied(`emoji-${emoji.char}`);
    setTimeout(() => setCopied(null), 1800);
  };

  return (
    <ToolPageLayout
      breadcrumbs={BREADCRUMBS}
      title="아이콘 & 이모지 라이브러리"
      description="Lucide React 아이콘 및 이모지 검색, 클릭으로 바로 복사"
      icon={Shapes}
    >
      <div className="flex flex-col gap-6">

        {/* 탭 */}
        <div className="flex gap-1 rounded-xl border border-border bg-bg-secondary p-1 w-fit">
          {([
            { id: "icon" as Tab,  label: "아이콘",  Icon: Shapes },
            { id: "emoji" as Tab, label: "이모지",  Icon: Smile  },
          ]).map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-150 ${
                tab === id
                  ? "bg-brand text-bg-primary shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* ── 아이콘 탭 ── */}
        {tab === "icon" && (
          <>
            {/* 검색 + 복사 모드 */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  type="text"
                  value={iconQuery}
                  onChange={(e) => setIconQuery(e.target.value)}
                  placeholder="아이콘 검색..."
                  className="w-full rounded-lg border border-border bg-bg-primary py-2 pl-9 pr-3 text-sm text-text-primary focus:border-brand focus:outline-none"
                />
              </div>
              <div className="flex rounded-lg border border-border p-0.5">
                {(["react", "svg"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setCopyMode(m)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      copyMode === m ? "bg-brand text-bg-primary" : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {m === "react" ? "React" : "SVG"}
                  </button>
                ))}
              </div>
            </div>

            {/* 카테고리 */}
            <div className="flex flex-wrap gap-2">
              {ICON_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setIconCategory(cat)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    iconCategory === cat
                      ? "bg-brand text-bg-primary"
                      : "border border-border text-text-secondary hover:border-brand/50 hover:text-text-primary"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <p className="text-xs text-text-secondary">{filteredIcons.length}개 아이콘</p>

            {/* 아이콘 그리드 */}
            <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
              {filteredIcons.map((icon) => {
                const Icon = icon.component;
                const isCopied = copied === icon.name;
                return (
                  <li key={icon.name}>
                    <button
                      type="button"
                      data-icon={icon.name}
                      onClick={() => handleIconCopy(icon)}
                      title={icon.name}
                      className="group flex w-full flex-col items-center gap-2 rounded-xl border border-border bg-bg-secondary p-3 transition-all hover:border-brand/50"
                    >
                      <div className="relative flex size-8 items-center justify-center">
                        {isCopied ? (
                          <Check size={20} className="text-emerald-400" />
                        ) : (
                          <>
                            <Icon size={20} className="text-text-secondary transition-colors group-hover:text-brand" />
                            <Copy size={12} className="absolute -right-1 -top-1 opacity-0 text-text-secondary transition-opacity group-hover:opacity-100" />
                          </>
                        )}
                      </div>
                      <span className="w-full truncate text-center text-[10px] text-text-secondary group-hover:text-text-primary">
                        {icon.name}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {filteredIcons.length === 0 && (
              <div className="rounded-xl border border-border bg-bg-secondary py-16 text-center text-sm text-text-secondary">
                검색 결과가 없습니다.
              </div>
            )}
          </>
        )}

        {/* ── 이모지 탭 ── */}
        {tab === "emoji" && (
          <>
            {/* 검색 */}
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                value={emojiQuery}
                onChange={(e) => setEmojiQuery(e.target.value)}
                placeholder="이모지 이름 검색 (예: 고양이, 하트, 피자...)"
                className="w-full rounded-lg border border-border bg-bg-primary py-2 pl-9 pr-3 text-sm text-text-primary focus:border-brand focus:outline-none"
              />
            </div>

            {/* 카테고리 */}
            <div className="flex flex-wrap gap-2">
              {EMOJI_ALL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setEmojiCategory(cat)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    emojiCategory === cat
                      ? "bg-brand text-bg-primary"
                      : "border border-border text-text-secondary hover:border-brand/50 hover:text-text-primary"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <p className="text-xs text-text-secondary">{filteredEmojis.length}개 이모지 · 클릭하면 복사됩니다</p>

            {/* 이모지 그리드 */}
            <ul className="grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12">
              {filteredEmojis.map((emoji, i) => {
                const key = `emoji-${emoji.char}-${i}`;
                const isCopied = copied === `emoji-${emoji.char}`;
                return (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={() => handleEmojiCopy(emoji)}
                      title={emoji.name}
                      className="group flex w-full flex-col items-center gap-1.5 rounded-xl border border-border bg-bg-secondary p-2.5 transition-all hover:border-brand/50"
                    >
                      <span className="text-2xl leading-none">
                        {isCopied ? "✓" : emoji.char}
                      </span>
                      <span className="w-full truncate text-center text-[9px] text-text-secondary group-hover:text-text-primary">
                        {emoji.name}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {filteredEmojis.length === 0 && (
              <div className="rounded-xl border border-border bg-bg-secondary py-16 text-center text-sm text-text-secondary">
                검색 결과가 없습니다.
              </div>
            )}
          </>
        )}

      </div>
    </ToolPageLayout>
  );
}