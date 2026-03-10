// S01: APIキー設定画面

import type { Screen, AppState, NavigateFn } from '../types'
import { sendMessage } from '../send-message'
import { createLoadingSpinner } from '../components/loading-spinner'

export const s01ApiKey: Screen = {
  render(_state: AppState, navigate: NavigateFn): HTMLElement {
    const container = div(`
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      background: #f8f9fa;
    `)

    // ── ヘッダー ──
    const header = div(`
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 20px 24px 16px;
      border-bottom: 1px solid #e5e7eb;
      background: #fff;
    `)
    const logo = div(`
      width: 32px;
      height: 32px;
      background: #635bff;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 16px;
      font-weight: 700;
      flex-shrink: 0;
    `)
    logo.textContent = 'S'
    const title = el('h1', 'Stripe Test Helper', `
      font-size: 16px;
      font-weight: 700;
      color: #1a1a2e;
    `)
    header.appendChild(logo)
    header.appendChild(title)
    container.appendChild(header)

    // ── 本文 ──
    const body = div(`
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 32px 24px;
    `)

    const card = div(`
      background: #fff;
      border-radius: 12px;
      padding: 28px 24px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    `)

    const cardTitle = el('h2', 'APIキーを設定', `
      font-size: 18px;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 8px;
    `)
    const cardDesc = el('p', 'テスト用のStripe APIキー（sk_test_）を入力してください。', `
      font-size: 13px;
      color: #6b7280;
      line-height: 1.6;
      margin-bottom: 24px;
    `)

    // 入力フィールド
    const inputWrap = div(`position: relative; margin-bottom: 8px;`)
    const input = document.createElement('input')
    input.type = 'password'
    input.placeholder = 'sk_test_...'
    input.autocomplete = 'off'
    input.spellcheck = false
    input.style.cssText = `
      width: 100%;
      padding: 10px 44px 10px 12px;
      border: 1.5px solid #e5e7eb;
      border-radius: 8px;
      font-size: 13px;
      font-family: 'Menlo', 'Monaco', monospace;
      color: #1a1a2e;
      background: #f9fafb;
      outline: none;
      transition: border-color 0.15s;
      box-sizing: border-box;
    `
    input.addEventListener('focus', () => { input.style.borderColor = '#635bff' })
    input.addEventListener('blur', () => { input.style.borderColor = '#e5e7eb' })

    // 表示/非表示トグル
    const toggle = div(`
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      cursor: pointer;
      color: #9ca3af;
      font-size: 16px;
      user-select: none;
      line-height: 1;
    `)
    toggle.textContent = '👁'
    let visible = false
    toggle.addEventListener('click', () => {
      visible = !visible
      input.type = visible ? 'text' : 'password'
      toggle.style.opacity = visible ? '1' : '0.5'
    })
    toggle.style.opacity = '0.5'

    inputWrap.appendChild(input)
    inputWrap.appendChild(toggle)

    // エラーメッセージ
    const errorText = el('p', '', `
      font-size: 12px;
      color: #dc2626;
      min-height: 18px;
      margin-bottom: 16px;
      line-height: 1.4;
    `)

    // 保存ボタン
    const saveBtn = createPrimaryButton('保存する')

    saveBtn.addEventListener('click', async () => {
      const key = input.value.trim()
      errorText.textContent = ''

      if (!key) {
        errorText.textContent = 'APIキーを入力してください'
        return
      }
      if (key.startsWith('sk_live_')) {
        errorText.textContent = '⚠️ 本番環境のAPIキーは使用できません'
        return
      }
      if (!key.startsWith('sk_test_')) {
        errorText.textContent = '有効なテスト用APIキー（sk_test_）を入力してください'
        return
      }

      // ローディング
      const originalText = saveBtn.textContent
      saveBtn.textContent = '保存中...'
      saveBtn.disabled = true

      const res = await sendMessage({ action: 'SAVE_API_KEY', payload: { plainKey: key } })

      if (!res.ok) {
        errorText.textContent = res.error
        saveBtn.textContent = originalText
        saveBtn.disabled = false
        return
      }

      navigate('S02')
    })

    // Enterキーでも保存
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveBtn.click()
    })

    card.appendChild(cardTitle)
    card.appendChild(cardDesc)
    card.appendChild(inputWrap)
    card.appendChild(errorText)
    card.appendChild(saveBtn)
    body.appendChild(card)
    container.appendChild(body)

    // フォーカス
    requestAnimationFrame(() => input.focus())

    return container
  },
}

// ── ユーティリティ ──

function div(css: string): HTMLDivElement {
  const d = document.createElement('div')
  d.style.cssText = css
  return d
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  text: string,
  css = ''
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag)
  e.textContent = text
  if (css) e.style.cssText = css
  return e
}

function createPrimaryButton(text: string): HTMLButtonElement {
  const btn = document.createElement('button')
  btn.textContent = text
  btn.style.cssText = `
    width: 100%;
    padding: 11px;
    background: #635bff;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
  `
  btn.addEventListener('mouseenter', () => { if (!btn.disabled) btn.style.background = '#4f46e5' })
  btn.addEventListener('mouseleave', () => { if (!btn.disabled) btn.style.background = '#635bff' })
  return btn
}