// ── Base32 (RFC 4648) ──────────────────────────────────────────────

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const BASE32_PADDING = "=";

export function encodeBase32(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let bits = 0;
  let value = 0;
  let output = "";

  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  const padLen = (8 - (output.length % 8)) % 8;
  return output + BASE32_PADDING.repeat(padLen);
}

export function decodeBase32(input: string): string {
  const cleaned = input.toUpperCase().replace(/=/g, "").trim();
  const lookup: Record<string, number> = {};
  for (let i = 0; i < BASE32_ALPHABET.length; i++) {
    lookup[BASE32_ALPHABET[i]] = i;
  }

  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (const char of cleaned) {
    if (!(char in lookup)) throw new Error(`잘못된 Base32 문자: '${char}'`);
    value = (value << 5) | lookup[char];
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return new TextDecoder().decode(new Uint8Array(bytes));
}

// ── Base58 (Bitcoin 알파벳) ────────────────────────────────────────

const BASE58_ALPHABET =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export function encodeBase58(input: string): string {
  const bytes = Array.from(new TextEncoder().encode(input));

  let leadingZeros = 0;
  for (const byte of bytes) {
    if (byte === 0) leadingZeros++;
    else break;
  }

  const digits: number[] = [0];
  for (const byte of bytes) {
    let carry = byte;
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = Math.floor(carry / 58);
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = Math.floor(carry / 58);
    }
  }

  return (
    "1".repeat(leadingZeros) +
    digits
      .reverse()
      .map((d) => BASE58_ALPHABET[d])
      .join("")
  );
}

export function decodeBase58(input: string): string {
  const lookup: Record<string, number> = {};
  for (let i = 0; i < BASE58_ALPHABET.length; i++) {
    lookup[BASE58_ALPHABET[i]] = i;
  }

  let leadingZeros = 0;
  for (const char of input) {
    if (char === "1") leadingZeros++;
    else break;
  }

  const bytes: number[] = [0];
  for (const char of input) {
    if (!(char in lookup)) throw new Error(`잘못된 Base58 문자: '${char}'`);
    let carry = lookup[char];
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * 58;
      bytes[j] = carry & 255;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 255);
      carry >>= 8;
    }
  }

  const result = new Uint8Array([
    ...new Array(leadingZeros).fill(0),
    ...bytes.reverse(),
  ]);
  return new TextDecoder().decode(result);
}