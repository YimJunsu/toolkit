/** RFC 1321 MD5 — Web Crypto API가 MD5를 지원하지 않아 순수 JS로 구현 */
export function md5(input: string): string {
  const bytes = Array.from(new TextEncoder().encode(input));

  const S = [
    7, 12, 17, 22,  7, 12, 17, 22,  7, 12, 17, 22,  7, 12, 17, 22,
    5,  9, 14, 20,  5,  9, 14, 20,  5,  9, 14, 20,  5,  9, 14, 20,
    4, 11, 16, 23,  4, 11, 16, 23,  4, 11, 16, 23,  4, 11, 16, 23,
    6, 10, 15, 21,  6, 10, 15, 21,  6, 10, 15, 21,  6, 10, 15, 21,
  ];

  const T = Array.from({ length: 64 }, (_, i) =>
    (Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000)) >>> 0
  );

  // 패딩
  const msgLen = bytes.length;
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);
  const bitLen = msgLen * 8;
  for (let i = 0; i < 8; i++) {
    bytes.push((bitLen / Math.pow(2, i * 8)) & 0xff);
  }

  let a = 0x67452301;
  let b = 0xefcdab89;
  let c = 0x98badcfe;
  let d = 0x10325476;

  for (let i = 0; i < bytes.length; i += 64) {
    const M: number[] = [];
    for (let j = 0; j < 16; j++) {
      M.push(
        bytes[i + j * 4] |
        (bytes[i + j * 4 + 1] << 8) |
        (bytes[i + j * 4 + 2] << 16) |
        (bytes[i + j * 4 + 3] << 24)
      );
    }

    let A = a, B = b, C = c, D = d;

    for (let j = 0; j < 64; j++) {
      let F: number;
      let g: number;

      if (j < 16)      { F = (B & C) | (~B & D); g = j; }
      else if (j < 32) { F = (D & B) | (~D & C); g = (5 * j + 1) % 16; }
      else if (j < 48) { F = B ^ C ^ D;           g = (3 * j + 5) % 16; }
      else             { F = C ^ (B | ~D);         g = (7 * j) % 16; }

      const temp = D;
      D = C;
      C = B;
      const sum = (F + A + T[j] + M[g]) | 0;
      B = (B + ((sum << S[j]) | (sum >>> (32 - S[j])))) | 0;
      A = temp;
    }

    a = (a + A) | 0;
    b = (b + B) | 0;
    c = (c + C) | 0;
    d = (d + D) | 0;
  }

  // 리틀엔디안으로 출력
  return [a, b, c, d]
    .map((n) => {
      const u = n >>> 0;
      return [u & 0xff, (u >> 8) & 0xff, (u >> 16) & 0xff, (u >> 24) & 0xff]
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
    })
    .join("");
}