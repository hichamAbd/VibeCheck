// Encryption helpers. Everything uses the browser's built-in Web Crypto:
// AES-256-GCM for data, PBKDF2-SHA-256 to turn the PIN into a key.

const enc = new TextEncoder();
const dec = new TextDecoder();
export const PIN_ITERATIONS = 600000;

export function b64u(bytes) {
  let s = '';
  const b = new Uint8Array(bytes);
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function unb64u(str) {
  const s = String(str).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(s + '==='.slice((s.length + 3) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function randomBytes(n) {
  return crypto.getRandomValues(new Uint8Array(n));
}

export function newKey() {
  return b64u(randomBytes(32));
}

export function randomId() {
  return b64u(randomBytes(9));
}

async function aesKey(raw) {
  return crypto.subtle.importKey('raw', unb64u(raw), { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

async function seal(key, obj, context) {
  const iv = randomBytes(12);
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: enc.encode(context) },
    key,
    enc.encode(JSON.stringify(obj)),
  );
  return { v: 1, iv: b64u(iv), ct: b64u(ct) };
}

async function open(key, env, context) {
  if (!env || env.v !== 1 || !env.iv || !env.ct) throw new Error('format');
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: unb64u(env.iv), additionalData: enc.encode(context) },
    key,
    unb64u(env.ct),
  );
  return JSON.parse(dec.decode(pt));
}

// Encrypt / decrypt with a random 256-bit key (given as base64url text).
export async function encryptWith(rawKey, obj, context) {
  return seal(await aesKey(rawKey), obj, context);
}

export async function decryptWith(rawKey, env, context) {
  return open(await aesKey(rawKey), env, context);
}

// Encrypt / decrypt with a PIN.
async function pinKey(pin, salt, iterations) {
  const base = await crypto.subtle.importKey('raw', enc.encode(String(pin)), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptWithPin(pin, obj, context) {
  const salt = randomBytes(16);
  const key = await pinKey(pin, salt, PIN_ITERATIONS);
  const env = await seal(key, obj, context);
  return { ...env, kdf: 'PBKDF2-SHA256', iter: PIN_ITERATIONS, salt: b64u(salt) };
}

export async function decryptWithPin(pin, env, context) {
  const key = await pinKey(pin, unb64u(env.salt), env.iter || PIN_ITERATIONS);
  return open(key, env, context);
}

export const CTX = {
  today: 'vibecheck/today/v1',
  vault: 'vibecheck/vault/v1',
  device: 'vibecheck/device/v1',
  backup: 'vibecheck/backup-keys/v1',
};
