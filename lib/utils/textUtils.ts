// ── 언어 감지 ─────────────────────────────────────────────────────

export interface DetectedLanguage {
  code: string;
  name: string;
  nameEn: string;
  confidence: number;
}

const UNICODE_LANGS = [
  { code: "ko", name: "한국어",     nameEn: "Korean",    from: 0xac00, to: 0xd7a3 },
  { code: "ja", name: "일본어",     nameEn: "Japanese",  from: 0x3040, to: 0x30ff },
  { code: "zh", name: "중국어",     nameEn: "Chinese",   from: 0x4e00, to: 0x9fff },
  { code: "ar", name: "아랍어",     nameEn: "Arabic",    from: 0x0600, to: 0x06ff },
  { code: "ru", name: "러시아어",   nameEn: "Russian",   from: 0x0400, to: 0x04ff },
  { code: "hi", name: "힌디어",     nameEn: "Hindi",     from: 0x0900, to: 0x097f },
  { code: "th", name: "태국어",     nameEn: "Thai",      from: 0x0e00, to: 0x0e7f },
];

// 라틴 계열 언어 — 흔한 단어 패턴으로 추정
const LATIN_LANG_PATTERNS: { code: string; name: string; nameEn: string; pattern: RegExp }[] = [
  { code: "fr", name: "프랑스어",   nameEn: "French",     pattern: /\b(le|la|les|de|du|un|une|est|et|je|tu|il|nous|vous|ils|pour|dans|sur|avec|très|être|avoir)\b/i },
  { code: "de", name: "독일어",     nameEn: "German",     pattern: /\b(der|die|das|ein|eine|und|ist|ich|du|er|wir|sie|nicht|mit|von|auf|für|auch|sich|an|zu)\b/i },
  { code: "es", name: "스페인어",   nameEn: "Spanish",    pattern: /\b(el|la|los|las|de|un|una|es|y|que|en|con|por|para|como|más|no|se|del|al)\b/i },
  { code: "pt", name: "포르투갈어", nameEn: "Portuguese", pattern: /\b(o|a|os|as|de|um|uma|é|e|que|em|com|por|para|como|mais|não|se|do|da)\b/i },
];

export function detectLanguage(text: string): DetectedLanguage {
  const unknown: DetectedLanguage = { code: "unknown", name: "알 수 없음", nameEn: "Unknown", confidence: 0 };
  if (!text.trim()) return unknown;

  const counts: Record<string, number> = { latin: 0 };
  let total = 0;

  for (const char of text) {
    const cp = char.codePointAt(0) ?? 0;
    if (cp < 32 || cp === 32) continue;
    total++;

    let matched = false;
    for (const lang of UNICODE_LANGS) {
      if (cp >= lang.from && cp <= lang.to) {
        counts[lang.code] = (counts[lang.code] ?? 0) + 1;
        matched = true;
        break;
      }
    }
    if (!matched && cp >= 0x0041 && cp <= 0x024f) counts.latin++;
  }

  if (total === 0) return unknown;

  const sorted = Object.entries(counts)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);

  if (sorted.length === 0) return unknown;

  const [topCode, topCount] = sorted[0];
  const confidence = Math.round((topCount / total) * 100);

  if (topCode !== "latin") {
    const lang = UNICODE_LANGS.find((l) => l.code === topCode);
    return { code: topCode, name: lang?.name ?? topCode, nameEn: lang?.nameEn ?? topCode, confidence };
  }

  // 라틴 계열 세분화
  for (const { code, name, nameEn, pattern } of LATIN_LANG_PATTERNS) {
    if (pattern.test(text)) {
      return { code, name, nameEn, confidence };
    }
  }
  return { code: "en", name: "영어", nameEn: "English", confidence };
}

// ── 키워드 추출 ───────────────────────────────────────────────────

const EN_STOPWORDS = new Set([
  "the","a","an","is","are","was","were","be","been","being","have","has","had",
  "do","does","did","will","would","could","should","may","might","must","shall","can",
  "to","of","in","on","at","by","for","with","about","as","into","from","up","out",
  "then","here","there","all","some","no","not","only","same","so","than","too","very",
  "just","but","if","or","and","this","that","these","those","it","its",
  "i","you","he","she","we","they","my","your","his","her","our","their",
  "what","which","who","how","when","where","why","each","both","more","most",
]);

const KO_STOPWORDS = new Set([
  "이","그","저","것","수","등","및","또는","그리고","하지만","그러나","의","가",
  "은","는","을","를","에","와","과","로","으로","한","하는","있는","있다","없다",
  "없는","하다","되다","위해","통해","대한","각","또한","더","매우","잘","이런",
  "저런","그런","어떤","어느","에서","에게","부터","까지","만큼","처럼","만","도",
  "우리","나","너","당신","그녀","들","했다","된다","할","할수","때문","따라",
  "같은","같이","라고","라는","경우","이후","이전","현재","이미","아직","다시",
]);

function isStopword(word: string): boolean {
  return EN_STOPWORDS.has(word.toLowerCase()) || KO_STOPWORDS.has(word);
}

export interface Keyword {
  word: string;
  count: number;
  score: number;
}

export function extractKeywords(text: string, topN: number = 10): Keyword[] {
  // 한국어/영어 단어 분리 (2자 이상)
  const words = text.match(/[가-힣]{2,}|[a-zA-Z]{3,}/g) ?? [];
  const freq: Record<string, number> = {};

  for (const word of words) {
    const normalized = word.toLowerCase();
    if (isStopword(normalized)) continue;
    freq[normalized] = (freq[normalized] ?? 0) + 1;
  }

  const total = Object.values(freq).reduce((a, b) => a + b, 0) || 1;

  return Object.entries(freq)
    .map(([word, count]) => ({ word, count, score: Math.round((count / total) * 1000) / 10 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
}

// ── 추출적 요약 (Extractive Summarization) ────────────────────────

export interface SummaryResult {
  summary: string;
  sentences: string[];
  totalSentences: number;
}

export function summarizeText(text: string, targetSentences: number = 3): SummaryResult {
  // 문장 분리 (한국어/영어 모두 지원)
  const raw = text
    .replace(/([.!?。！？])\s*/g, "$1\n")
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 10);

  if (raw.length === 0) return { summary: text, sentences: [text], totalSentences: 1 };
  if (raw.length <= targetSentences) {
    return { summary: raw.join(" "), sentences: raw, totalSentences: raw.length };
  }

  // 단어 빈도로 문장 점수 계산
  const allWords = text.match(/[가-힣]{2,}|[a-zA-Z]{3,}/g) ?? [];
  const freq: Record<string, number> = {};
  for (const word of allWords) {
    const w = word.toLowerCase();
    if (!isStopword(w)) freq[w] = (freq[w] ?? 0) + 1;
  }

  const scored = raw.map((sentence, index) => {
    const words = sentence.match(/[가-힣]{2,}|[a-zA-Z]{3,}/g) ?? [];
    const score = words.reduce((sum, w) => sum + (freq[w.toLowerCase()] ?? 0), 0);
    // 앞 문장 가중치 (위치 점수)
    const posScore = 1 - index / raw.length * 0.3;
    return { sentence, index, score: score * posScore };
  });

  const selected = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, targetSentences)
    .sort((a, b) => a.index - b.index)
    .map((s) => s.sentence);

  return {
    summary: selected.join(" "),
    sentences: selected,
    totalSentences: raw.length,
  };
}

// ── 텍스트 통계 ───────────────────────────────────────────────────

export interface TextStats {
  chars: number;
  words: number;
  sentences: number;
  readingTimeMin: number;
}

export function getTextStats(text: string): TextStats {
  const trimmed = text.trim();
  if (!trimmed) return { chars: 0, words: 0, sentences: 0, readingTimeMin: 0 };

  const chars     = trimmed.length;
  const words     = (trimmed.match(/[가-힣]+|[a-zA-Z]+/g) ?? []).length;
  const sentences = (trimmed.match(/[.!?。！？]+/g) ?? []).length || 1;
  const readingTimeMin = Math.max(1, Math.round(words / 200)); // 평균 분당 200단어

  return { chars, words, sentences, readingTimeMin };
}