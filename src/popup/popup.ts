/// <reference types="chrome" />

// Popup エントリポイント
// 画面遷移とService Workerとの通信を管理

import type { RequestMessage, ResponseMessage } from '../types/messages'
import type { AppState, ScreenId, Screen } from './types'
import { createLoadingSpinner } from './components/loading-spinner'

// アプリケーション状態
const appState: AppState = {}

// 画面マップ（Step 6で各画面を実装）
const screens: Record<ScreenId, Screen> = {
  S01: createPlaceholderScreen('S01', 'APIキー設定画面'),
  S02: createPlaceholderScreen('S02', '顧客検索画面'),
  S03: createPlaceholderScreen('S03', 'サブスクリプション一覧画面'),
  S04: createPlaceholderScreen('S04', 'サブスクリプションキャンセル確認画面'),
  S05: createPlaceholderScreen('S05', 'インボイス一覧画面'),
  S06: createPlaceholderScreen('S06', 'インボイス詳細画面'),
  S07: createPlaceholderScreen('S07', 'キャッシュ残高追加画面'),
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

/**
 * Service Workerにメッセージを送信する
 * @param message リクエストメッセージ
 * @returns レスポンスメッセージ
 */
export async function sendMessage<T = unknown>(message: RequestMessage): Promise<ResponseMessage<T>> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response: ResponseMessage<T>) => {
      // エラーチェック
      if (chrome.runtime.lastError) {
        resolve({
          ok: false,
          error: chrome.runtime.lastError.message || 'メッセージ送信に失敗しました',
        })
        return
      }

      resolve(response)
    })
  })
}

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
