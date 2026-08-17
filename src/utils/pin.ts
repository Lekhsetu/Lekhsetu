// 6-digit quick-unlock PIN, stored locally on this device only.
// Not a server-side credential: it just re-locks the UI for an
// already-authenticated session on shared/returning devices.

const PIN_PREFIX = "lekhsetu_pin_";
const UNLOCK_PREFIX = "lekhsetu_unlocked_";

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function setPin(userId: string, pin: string) {
  localStorage.setItem(PIN_PREFIX + userId, await sha256(`${userId}:${pin}`));
}

export function hasPin(userId: string): boolean {
  return !!localStorage.getItem(PIN_PREFIX + userId);
}

export async function verifyPin(userId: string, pin: string): Promise<boolean> {
  const stored = localStorage.getItem(PIN_PREFIX + userId);
  if (!stored) return false;
  return (await sha256(`${userId}:${pin}`)) === stored;
}

export function removePin(userId: string) {
  localStorage.removeItem(PIN_PREFIX + userId);
  sessionStorage.removeItem(UNLOCK_PREFIX + userId);
}

export function isUnlocked(userId: string): boolean {
  return sessionStorage.getItem(UNLOCK_PREFIX + userId) === "1";
}

export function markUnlocked(userId: string) {
  sessionStorage.setItem(UNLOCK_PREFIX + userId, "1");
}

// ─── PIN sign-in vault ───────────────────────────────────────────────────────
// Lets a returning user sign in with a PIN + two security question answers
// instead of their password, on THIS device only. The account password is
// encrypted with a key derived from PIN + answers (AES-GCM via PBKDF2) and
// stored locally; it never leaves the device and the server never sees it.

export const SECURITY_QUESTIONS: { id: string; label: string }[] = [
  { id: "birth_city", label: "Which city were you born in?" },
  { id: "dream_place", label: "What is your dream place to visit or live?" },
];

const VAULT_KEY = "lekhsetu_pin_vault";
const PBKDF2_ITERATIONS = 100000;

type PinVault = {
  email: string;
  salt: string;
  iv: string;
  cipher: string;
  questionIds: [string, string];
};

function bufToB64(buf: Uint8Array): string {
  return btoa(String.fromCharCode(...buf));
}

function b64ToBuf(b64: string): Uint8Array {
  return new Uint8Array(atob(b64).split("").map(c => c.charCodeAt(0)));
}

function normalizeAnswer(answer: string): string {
  return answer.trim().toLowerCase();
}

/** Generates a random per-account salt (base64) for hashing recovery-question answers. */
export function generateSalt(): string {
  return bufToB64(crypto.getRandomValues(new Uint8Array(16)));
}

/**
 * Salted SHA-256 hash of a security-question answer, used for server-side
 * account recovery. Only the hash is ever sent/stored, the plaintext
 * answer never leaves the device.
 */
export async function hashSecurityAnswer(salt: string, answer: string): Promise<string> {
  return sha256(`${salt}:${normalizeAnswer(answer)}`);
}

async function deriveVaultKey(pin: string, answers: [string, string], salt: Uint8Array): Promise<CryptoKey> {
  const material = `${pin}:${normalizeAnswer(answers[0])}:${normalizeAnswer(answers[1])}`;
  const keyMaterial = await crypto.subtle.importKey("raw", new TextEncoder().encode(material), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export function getPinVault(): PinVault | null {
  const raw = localStorage.getItem(VAULT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PinVault;
  } catch {
    return null;
  }
}

export function removePinVault() {
  localStorage.removeItem(VAULT_KEY);
}

export async function savePinVault(
  email: string,
  password: string,
  pin: string,
  questionIds: [string, string],
  answers: [string, string]
) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveVaultKey(pin, answers, salt);
  const cipherBuf = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(password));
  const vault: PinVault = {
    email,
    salt: bufToB64(salt),
    iv: bufToB64(iv),
    cipher: bufToB64(new Uint8Array(cipherBuf)),
    questionIds,
  };
  localStorage.setItem(VAULT_KEY, JSON.stringify(vault));
}

/** Returns the saved email + password if the PIN and answers are correct, otherwise null. */
export async function unlockPinVault(pin: string, answers: [string, string]): Promise<{ email: string; password: string } | null> {
  const vault = getPinVault();
  if (!vault) return null;
  try {
    const key = await deriveVaultKey(pin, answers, b64ToBuf(vault.salt));
    const plainBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64ToBuf(vault.iv) as BufferSource }, key, b64ToBuf(vault.cipher) as BufferSource);
    return { email: vault.email, password: new TextDecoder().decode(plainBuf) };
  } catch {
    return null;
  }
}
