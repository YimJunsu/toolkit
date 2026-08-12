export interface Category {
  id: string;
  label: string;
  href: string;
  description: string;
  badge?: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
}

export const CATEGORIES: Category[] = [
  {
    id: "code",
    label: "개발자 도구",
    href: "/tools/code",
    description: "JSON, Regex, SQL, Diff, Base64/Hash, UUID/비밀번호 생성기 등",
    badge: "HOT",
    bgColor: "from-blue-500/10 via-indigo-500/5 to-transparent",
    borderColor: "hover:border-blue-500/40",
    textColor: "text-blue-500",
  },
  {
    id: "design",
    label: "디자이너 도구",
    href: "/tools/design",
    description: "Color Picker, Palette, Gradient, Glassmorphism, Aspect Ratio 등",
    bgColor: "from-pink-500/10 via-purple-500/5 to-transparent",
    borderColor: "hover:border-pink-500/40",
    textColor: "text-pink-500",
  },
  {
    id: "jobs",
    label: "세금 & 업무 계산기",
    href: "/tools/jobs",
    description: "연봉 실수령액, 퇴직금, 주휴수당, 부가세/세금 계산기 등",
    badge: "인기",
    bgColor: "from-emerald-500/10 via-teal-500/5 to-transparent",
    borderColor: "hover:border-emerald-500/40",
    textColor: "text-emerald-500",
  },
  {
    id: "utility",
    label: "유틸리티",
    href: "/tools/web",
    description: "QR 코드, 단위 변환기, 스톱워치, 글자수 세기, PDF 변환 등",
    bgColor: "from-amber-500/10 via-orange-500/5 to-transparent",
    borderColor: "hover:border-amber-500/40",
    textColor: "text-amber-500",
  },
  {
    id: "fun",
    label: "FUN & 미니 툴",
    href: "/tools/etc",
    description: "오늘의 운세, 포춘쿠키, 미니 룰렛, 재미있는 미니 툴 모음",
    bgColor: "from-purple-500/10 via-rose-500/5 to-transparent",
    borderColor: "hover:border-purple-500/40",
    textColor: "text-purple-500",
  },
];