// AES-GCM 暗号化ユーティリティ
// Web Crypto API (crypto.subtle) を使用

const KEY_ALGORITHM: AesKeyGenParams = { name: 'AES-GCM', length: 256 }
const IV_LENGTH = 12 // 96bit

/**
 * AES-GCM マスターキーを新規生成する
 */
export async function generateMasterKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(KEY_ALGORITHM, true, ['encrypt', 'decrypt'])
}

/**
 * CryptoKey を base64 文字列にエクスポートする
 */
export async function exportKeyToBase64(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey('raw', key)
  return bufferToBase64(raw)
}

/**
 * base64 文字列から CryptoKey をインポートする
 */
export async function importKeyFromBase64(base64: string): Promise<CryptoKey> {
  const raw = base64ToBuffer(base64)
  return crypto.subtle.importKey('raw', raw.buffer as ArrayBuffer, KEY_ALGORITHM, true, ['encrypt', 'decrypt'])
}

/**
 * 平文文字列を AES-GCM で暗号化する
 * @returns { cipher: base64, iv: base64 }
 */
export async function encrypt(
  plainText: string,
  key: CryptoKey
): Promise<{ cipher: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH) as Uint8Array<ArrayBuffer>)
  const encoded = new TextEncoder().encode(plainText)
  const cipherBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)
  return {
    cipher: bufferToBase64(cipherBuffer),
    iv: bufferToBase64(iv),
  }
}

/**
 * AES-GCM で暗号化されたデータを復号する
 */
export async function decrypt(
  cipherBase64: string,
  ivBase64: string,
  key: CryptoKey
): Promise<string> {
  const cipher = base64ToBuffer(cipherBase64)
  const iv = base64ToBuffer(ivBase64)
  const plainBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    cipher.buffer as ArrayBuffer
  )
  return new TextDecoder().decode(plainBuffer)
}

// --- ユーティリティ ---

function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}

function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}