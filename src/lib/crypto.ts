/**
 * Cifrado simétrico AES-256-GCM para datos sensibles en BD.
 * Usa Web Crypto API — compatible con Cloudflare Workers y Node.js 18+.
 *
 * La llave se configura como Cloudflare secret: WA_ENCRYPTION_KEY
 * Generar con: openssl rand -base64 32
 *
 * Compatibilidad hacia atrás: valores sin prefijo "enc:" se tratan como
 * texto plano y se devuelven tal cual. Al re-guardar, quedan cifrados.
 */

const ENCRYPTION_PREFIX = "enc:";
const IV_LENGTH = 12; // 96 bits — estándar AES-GCM

function base64ToBytes(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

function bytesToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...Array.from(bytes)));
}

async function getAESKey(): Promise<CryptoKey | null> {
  const secret = process.env.WA_ENCRYPTION_KEY;
  if (!secret) return null;
  try {
    const keyBytes = base64ToBytes(secret);
    if (keyBytes.length !== 32) {
      console.warn("[crypto] WA_ENCRYPTION_KEY debe ser 32 bytes (base64 de openssl rand -base64 32)");
      return null;
    }
    return crypto.subtle.importKey(
      "raw",
      keyBytes.buffer.slice(keyBytes.byteOffset, keyBytes.byteOffset + keyBytes.byteLength) as ArrayBuffer,
      { name: "AES-GCM" },
      false,
      ["encrypt", "decrypt"]
    );
  } catch {
    console.warn("[crypto] WA_ENCRYPTION_KEY inválida — cifrando en texto plano");
    return null;
  }
}

/**
 * Cifra un token. Si WA_ENCRYPTION_KEY no está configurada, devuelve el texto plano.
 * El resultado tiene el prefijo "enc:" para identificarlo como cifrado.
 */
export async function encryptWAToken(plaintext: string): Promise<string> {
  if (!plaintext) return plaintext;
  const key = await getAESKey();
  if (!key) return plaintext; // sin llave → guardar como texto plano (fallback)

  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);

  const combined = new Uint8Array(IV_LENGTH + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), IV_LENGTH);

  return ENCRYPTION_PREFIX + bytesToBase64(combined);
}

/**
 * Descifra un token.
 * - Si empieza con "enc:", descifra con AES-GCM.
 * - Si no tiene prefijo, es texto plano (compatibilidad hacia atrás) → devuelve tal cual.
 */
export async function decryptWAToken(value: string): Promise<string> {
  if (!value) return value;
  if (!value.startsWith(ENCRYPTION_PREFIX)) return value; // texto plano — compatibilidad hacia atrás

  const key = await getAESKey();
  if (!key) {
    console.error("[crypto] Token cifrado en BD pero WA_ENCRYPTION_KEY no configurada");
    return "";
  }

  try {
    const combined = base64ToBytes(value.slice(ENCRYPTION_PREFIX.length));
    const iv = combined.slice(0, IV_LENGTH);
    const ciphertext = combined.slice(IV_LENGTH);
    const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
    return new TextDecoder().decode(plaintext);
  } catch {
    console.error("[crypto] Error al descifrar token — datos corruptos o llave incorrecta");
    return "";
  }
}

/**
 * Verifica si un valor almacenado en BD está cifrado.
 */
export function isEncrypted(value: string | null | undefined): boolean {
  return !!(value?.startsWith(ENCRYPTION_PREFIX));
}
