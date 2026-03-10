// S02: 顧客検索画面

import type { Screen, AppState, NavigateFn } from '../types'
import type { StripeCustomer } from '../../types/stripe'
import { sendMessage } from '../send-message'
import { createLoadingSpinner } from '../components/loading-spinner'

export const s02Search: Screen = {
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
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid #e5e7eb;
      background: #fff;
      flex-shrink: 0;
    `)
    const headerLeft = div(`display: flex; align-items: center; gap: 10px;`)
    const logo = div(`
      width: 28px;
      height: 28px;
      background: #635bff;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 14px;
      font-weight: 700;
      flex-shrink: 0;
    `)
    logo.textContent = 'S'
    const title = el('span', '顧客検索', `
      font-size: 15px;
      font-weight: 700;
      color: #1a1a2e;
    `)
    headerLeft.appendChild(logo)
    headerLeft.appendChild(title)

    // APIキー設定ボタン（歯車）
    const settingsBtn = document.createElement('button')
    settingsBtn.textContent = '⚙️'
    settingsBtn.title = 'APIキー設定'
    settingsBtn.style.cssText = `
      background: none;
      border: none;
      cursor: pointer;
      font-size: 18px;
      opacity: 0.6;
      padding: 4px;
      border-radius: 4px;
      line-height: 1;
      transition: opacity 0.15s;
    `
    settingsBtn.addEventListener('mouseenter', () => { settingsBtn.style.opacity = '1' })
    settingsBtn.addEventListener('mouseleave', () => { settingsBtn.style.opacity = '0.6' })
    settingsBtn.addEventListener('click', () => navigate('S01'))

    header.appendChild(headerLeft)
    header.appendChild(settingsBtn)
    container.appendChild(header)

    // ── 検索フォーム ──
    const searchArea = div(`
      padding: 16px 20px;
      background: #fff;
      border-bottom: 1px solid #e5e7eb;
      flex-shrink: 0;
    `)
    const inputRow = div(`display: flex; gap: 8px;`)
    const input = document.createElement('input')
    input.type = 'text'
    input.placeholder = 'team_id を入力...'
    input.autocomplete = 'off'
    input.spellcheck = false
    input.style.cssText = `
      flex: 1;
      padding: 9px 12px;
      border: 1.5px solid #e5e7eb;
      border-radius: 8px;
      font-size: 13px;
      color: #1a1a2e;
      background: #f9fafb;
      outline: none;
      transition: border-color 0.15s;
    `
    input.addEventListener('focus', () => { input.style.borderColor = '#635bff' })
    input.addEventListener('blur', () => { input.style.borderColor = '#e5e7eb' })

    const searchBtn = document.createElement('button')
    searchBtn.textContent = '検索'
    searchBtn.style.cssText = `
      padding: 9px 18px;
      background: #635bff;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.15s;
    `
    searchBtn.addEventListener('mouseenter', () => { if (!searchBtn.disabled) searchBtn.style.background = '#4f46e5' })
    searchBtn.addEventListener('mouseleave', () => { if (!searchBtn.disabled) searchBtn.style.background = '#635bff' })

    inputRow.appendChild(input)
    inputRow.appendChild(searchBtn)
    searchArea.appendChild(inputRow)
    container.appendChild(searchArea)

    // ── 結果エリア ──
    const resultArea = div(`
      flex: 1;
      overflow-y: auto;
      padding: 16px 20px;
    `)
    container.appendChild(resultArea)

    // 検索実行
    const doSearch = async () => {
      const teamId = input.value.trim()
      if (!teamId) {
        showMessage(resultArea, '⚠️', 'team_id を入力してください', '#9ca3af')
        return
      }

      // ローディング
      resultArea.replaceChildren(createLoadingSpinner('検索中...'))
      searchBtn.disabled = true

      const res = await sendMessage<{ customers: StripeCustomer[] }>({
        action: 'SEARCH_CUSTOMER',
        payload: { teamId },
      })

      searchBtn.disabled = false

      if (!res.ok) {
        showMessage(resultArea, '⚠️', res.error, '#dc2626')
        return
      }

      const { customers } = res.data
      if (customers.length === 0) {
        showMessage(resultArea, '🔍', `team_id "${teamId}" の顧客が見つかりませんでした`, '#6b7280')
        return
      }

      renderResults(resultArea, customers, navigate)
    }

    searchBtn.addEventListener('click', doSearch)
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch() })

    // 初期メッセージ
    showMessage(resultArea, '🔍', 'team_id で顧客を検索できます', '#9ca3af')

    requestAnimationFrame(() => input.focus())

    return container
  },
}

function renderResults(
  area: HTMLElement,
  customers: StripeCustomer[],
  navigate: NavigateFn
): void {
  area.replaceChildren()

  const count = el('p', `${customers.length} 件見つかりました`, `
    font-size: 12px;
    color: #6b7280;
    margin-bottom: 10px;
  `)
  area.appendChild(count)

  for (const customer of customers) {
    const item = div(`
      background: #fff;
      border-radius: 10px;
      padding: 14px 16px;
      margin-bottom: 8px;
      cursor: pointer;
      border: 1.5px solid #e5e7eb;
      transition: border-color 0.15s, box-shadow 0.15s;
    `)
    item.addEventListener('mouseenter', () => {
      item.style.borderColor = '#635bff'
      item.style.boxShadow = '0 2px 8px rgba(99,91,255,0.12)'
    })
    item.addEventListener('mouseleave', () => {
      item.style.borderColor = '#e5e7eb'
      item.style.boxShadow = 'none'
    })

    const name = el('p', customer.name ?? '(名前なし)', `
      font-size: 14px;
      font-weight: 600;
      color: #1a1a2e;
      margin-bottom: 4px;
    `)
    const email = el('p', customer.email ?? '(メールなし)', `
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 4px;
    `)
    const idEl = el('p', customer.id, `
      font-size: 11px;
      color: #9ca3af;
      font-family: monospace;
    `)

    item.appendChild(name)
    item.appendChild(email)
    if (customer.description) {
      const desc = el('p', customer.description, `
        font-size: 12px;
        color: #6b7280;
        margin-top: 4px;
        margin-bottom: 4px;
        line-height: 1.4;
        word-break: break-all;
      `)
      item.appendChild(desc)
    }
    item.appendChild(idEl)
    item.addEventListener('click', () => {
      navigate('S03', { customer })
    })
    area.appendChild(item)
  }
}

function showMessage(area: HTMLElement, icon: string, message: string, color: string): void {
  area.replaceChildren()
  const wrap = div(`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;
    padding: 20px;
    gap: 12px;
  `)
  const iconEl = el('p', icon, `font-size: 32px; line-height: 1;`)
  const msgEl = el('p', message, `font-size: 13px; color: ${color}; line-height: 1.5;`)
  wrap.appendChild(iconEl)
  wrap.appendChild(msgEl)
  area.appendChild(wrap)
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