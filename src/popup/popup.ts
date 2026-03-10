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

// アプリケーション状態
const appState: AppState = {}

// 画面マップ
const screens: Record<ScreenId, Screen> = {
  S01: s01ApiKey,
  S02: s02Search,
  S03: s03Menu,
  S04: s04Subscriptions,
  S05: s05CancelConfirm,
  S06: createPlaceholderScreen('S06', 'Invoice一覧'),
  S07: createPlaceholderScreen('S07', '残高追加確認'),
}

/**
 * プレースホルダー画面を生成（Step 6で実装まで一時的に使用）
 */
function createPlaceholderScreen(id: ScreenId, title: string): Screen {
  return {
    render(state: AppState, navigate) {
      const container = document.createElement('div')
      container.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        padding: 40px;
        text-align: center;
      `

      const heading = document.createElement('h1')
      heading.textContent = title
      heading.style.cssText = `
        font-size: 20px;
        font-weight: 600;
        color: #1a1a2e;
        margin-bottom: 16px;
      `

      const description = document.createElement('p')
      description.textContent = `画面ID: ${id}`
      description.style.cssText = `
        font-size: 14px;
        color: #6b7280;
        margin-bottom: 24px;
      `

      const info = document.createElement('pre')
      info.textContent = JSON.stringify(state, null, 2)
      info.style.cssText = `
        font-size: 12px;
        color: #4b5563;
        background: #f3f4f6;
        padding: 16px;
        border-radius: 6px;
        text-align: left;
        overflow: auto;
        max-width: 100%;
        max-height: 300px;
      `

      container.appendChild(heading)
      container.appendChild(description)
      container.appendChild(info)

      // テスト用の戻るボタン（S02以外の画面に表示）
      if (id !== 'S01' && id !== 'S02') {
        const backButton = document.createElement('button')
        backButton.textContent = 'S02に戻る'
        backButton.style.cssText = `
          margin-top: 24px;
          padding: 10px 20px;
          background-color: #635bff;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
        `
        backButton.addEventListener('click', () => navigate('S02'))
        container.appendChild(backButton)
      }

      return container
    },
  }
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
