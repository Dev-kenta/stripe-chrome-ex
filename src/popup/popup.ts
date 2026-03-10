/// <reference types="chrome" />

// Popup エントリポイント
// 画面遷移とService Workerとの通信を管理

import type { AppState, ScreenId, Screen } from './types'
import { createLoadingSpinner } from './components/loading-spinner'
import { sendMessage } from './send-message'
import { s01ApiKey } from './screens/s01-api-key'
import { s02Search } from './screens/s02-search'
import { s03Menu } from './screens/s03-menu'
import { s04Subscriptions } from './screens/s04-subscriptions'
import { s05CancelConfirm } from './screens/s05-cancel-confirm'
import { s06Invoices } from './screens/s06-invoices'
import { s07BalanceConfirm } from './screens/s07-balance-confirm'

// アプリケーション状態
const appState: AppState = {}

// 画面マップ
const screens: Record<ScreenId, Screen> = {
  S01: s01ApiKey,
  S02: s02Search,
  S03: s03Menu,
  S04: s04Subscriptions,
  S05: s05CancelConfirm,
  S06: s06Invoices,
  S07: s07BalanceConfirm,
}

/**
 * 画面遷移関数
 * @param screenId 遷移先の画面ID
 * @param stateUpdate 更新する状態の部分オブジェクト
 */
export function navigate(screenId: ScreenId, stateUpdate?: Partial<AppState>): void {
  // 状態を更新
  if (stateUpdate) {
    Object.assign(appState, stateUpdate)
  }

  // 画面をレンダリング
  const app = document.getElementById('app')
  if (!app) {
    console.error('App element not found')
    return
  }

  const screen = screens[screenId]
  if (!screen) {
    console.error(`Screen ${screenId} not found`)
    return
  }

  app.replaceChildren(screen.render(appState, navigate))
}

export { sendMessage } from './send-message'

/**
 * アプリケーション初期化
 */
document.addEventListener('DOMContentLoaded', async () => {
  const app = document.getElementById('app')
  if (!app) {
    console.error('App element not found')
    return
  }

  // ローディング表示
  app.replaceChildren(createLoadingSpinner('初期化中...'))

  try {
    // APIキーの状態をチェック
    const response = await sendMessage<{ exists: boolean; maskedKey?: string }>({
      action: 'GET_API_KEY_STATUS',
    })

    if (!response.ok) {
      console.error('Failed to get API key status:', response.error)
      // エラーが発生してもS01に遷移（APIキー設定画面）
      navigate('S01')
      return
    }

    // APIキーが存在すればS02（顧客検索画面）、なければS01（APIキー設定画面）に遷移
    navigate(response.data.exists ? 'S02' : 'S01')
  } catch (error) {
    console.error('Initialization error:', error)
    // エラーが発生してもS01に遷移
    navigate('S01')
  }
})