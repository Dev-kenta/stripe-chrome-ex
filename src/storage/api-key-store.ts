// chrome.storage.local を使った APIキー 永続化ストア
// APIキーは AES-GCM で暗号化して保存する

import {
  generateMasterKey,
  exportKeyToBase64,
  importKeyFromBase64,
  encrypt,
  decrypt,
} from '../crypto/aes-gcm'

const STORAGE_KEYS = {
  MASTER_KEY_RAW: 'master_key_raw',
  API_KEY_CIPHER: 'api_key_cipher',
  API_KEY_IV: 'api_key_iv',
} as const

/**
 * マスターキーを取得する。未生成なら生成して保存する。
 */
async function getOrCreateMasterKey(): Promise<CryptoKey> {
  const stored = await chromeStorageGet<string>(STORAGE_KEYS.MASTER_KEY_RAW)
  if (stored) {
    return importKeyFromBase64(stored)
  }
  const key = await generateMasterKey()
  const raw = await exportKeyToBase64(key)
  await chromeStorageSet({ [STORAGE_KEYS.MASTER_KEY_RAW]: raw })
  return key
}

/**
 * APIキーを暗号化して保存する
 */
export async function saveApiKey(plainKey: string): Promise<void> {
  const masterKey = await getOrCreateMasterKey()
  const { cipher, iv } = await encrypt(plainKey, masterKey)
  await chromeStorageSet({
    [STORAGE_KEYS.API_KEY_CIPHER]: cipher,
    [STORAGE_KEYS.API_KEY_IV]: iv,
  })
}

/**
 * 保存されたAPIキーを復号して返す。未保存なら null を返す。
 */
export async function loadApiKey(): Promise<string | null> {
  const [cipher, iv] = await Promise.all([
    chromeStorageGet<string>(STORAGE_KEYS.API_KEY_CIPHER),
    chromeStorageGet<string>(STORAGE_KEYS.API_KEY_IV),
  ])
  if (!cipher || !iv) return null

  const masterKey = await getOrCreateMasterKey()
  return decrypt(cipher, iv, masterKey)
}

/**
 * APIキーが保存されているか確認する
 */
export async function hasApiKey(): Promise<boolean> {
  const cipher = await chromeStorageGet<string>(STORAGE_KEYS.API_KEY_CIPHER)
  return cipher !== null
}

/**
 * APIキーを削除する（マスターキーは保持）
 */
export async function deleteApiKey(): Promise<void> {
  await chromeStorageRemove([STORAGE_KEYS.API_KEY_CIPHER, STORAGE_KEYS.API_KEY_IV])
}

/**
 * マスク済みAPIキーを返す。例: "sk_test_...AbCd"
 * 未保存なら null を返す。
 */
export async function getMaskedKey(): Promise<string | null> {
  const plain = await loadApiKey()
  if (!plain) return null
  const suffix = plain.slice(-4)
  return `sk_test_...${suffix}`
}

// --- chrome.storage.local ラッパー ---

function chromeStorageGet<T>(key: string): Promise<T | null> {
  return new Promise(resolve => {
    chrome.storage.local.get(key, result => {
      const value = result[key]
      resolve(value !== undefined ? (value as T) : null)
    })
  })
}

function chromeStorageSet(items: Record<string, string>): Promise<void> {
  return new Promise(resolve => {
    chrome.storage.local.set(items, resolve)
  })
}

function chromeStorageRemove(keys: string[]): Promise<void> {
  return new Promise(resolve => {
    chrome.storage.local.remove(keys, resolve)
  })
}