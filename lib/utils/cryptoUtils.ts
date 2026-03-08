// ── AES-256-GCM (PBKDF2 key derivation) ──────────────────────────

const PBKDF2_ITERATIONS = 100_000;
const SALT_LEN = 16;
const IV_LEN = 12;

async function deriveAesKey(
  password: string,
  salt: Uint8Array<ArrayBuffer>
): Promise<CryptoKey> {
  const raw = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    raw,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptAES(
  plaintext: string,
  password: string
): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(SALT_LEN)));
  const iv = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(IV_LEN)));
  const key = await deriveAesKey(password, salt);

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext)
  );

  const out = new Uint8Array(SALT_LEN + IV_LEN + encrypted.byteLength);
  out.set(salt, 0);
  out.set(iv, SALT_LEN);
  out.set(new Uint8Array(encrypted), SALT_LEN + IV_LEN);

  return btoa(String.fromCharCode(...out));
}

export async function decryptAES(
  ciphertext: string,
  password: string
): Promise<string> {
  const data = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));
  const salt = new Uint8Array(data.slice(0, SALT_LEN).buffer as ArrayBuffer);
  const iv = data.slice(SALT_LEN, SALT_LEN + IV_LEN);
  const encrypted = data.slice(SALT_LEN + IV_LEN);

  const key = await deriveAesKey(password, salt);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encrypted
  );

  return new TextDecoder().decode(decrypted);
}

// ── RSA-OAEP (2048-bit) ───────────────────────────────────────────

export interface RsaKeyPair {
  publicKey: string;   // PEM
  privateKey: string;  // PEM
}

function arrayBufferToPem(buffer: ArrayBuffer, label: string): string {
  const b64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  const lines = b64.match(/.{1,64}/g)?.join("\n") ?? b64;
  return `-----BEGIN ${label}-----\n${lines}\n-----END ${label}-----`;
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN .*-----/, "")
    .replace(/-----END .*-----/, "")
    .replace(/\s/g, "");
  const binary = atob(b64);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0)).buffer;
}

export async function generateRsaKeyPair(): Promise<RsaKeyPair> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );

  const [pubBuf, privBuf] = await Promise.all([
    crypto.subtle.exportKey("spki", keyPair.publicKey),
    crypto.subtle.exportKey("pkcs8", keyPair.privateKey),
  ]);

  return {
    publicKey: arrayBufferToPem(pubBuf, "PUBLIC KEY"),
    privateKey: arrayBufferToPem(privBuf, "PRIVATE KEY"),
  };
}

export async function encryptRSA(
  plaintext: string,
  publicKeyPem: string
): Promise<string> {
  const keyBuf = pemToArrayBuffer(publicKeyPem);
  const key = await crypto.subtle.importKey(
    "spki",
    keyBuf,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"]
  );

  const encrypted = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    key,
    new TextEncoder().encode(plaintext)
  );

  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}

export async function decryptRSA(
  ciphertext: string,
  privateKeyPem: string
): Promise<string> {
  const keyBuf = pemToArrayBuffer(privateKeyPem);
  const key = await crypto.subtle.importKey(
    "pkcs8",
    keyBuf,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["decrypt"]
  );

  const data = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));
  const decrypted = await crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    key,
    data
  );

  return new TextDecoder().decode(decrypted);
}