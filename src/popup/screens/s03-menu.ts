// S03: 操作メニュー画面

import type { Screen, AppState, NavigateFn } from '../types'

export const s03Menu: Screen = {
  render(state: AppState, navigate: NavigateFn): HTMLElement {
    const customer = state.customer

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
      padding: 14px 20px;
      border-bottom: 1px solid #e5e7eb;
      background: #fff;
      flex-shrink: 0;
    `)
    const backBtn = document.createElement('button')
    backBtn.textContent = '←'
    backBtn.title = '戻る'
    backBtn.style.cssText = `
      background: none;
      border: none;
      cursor: pointer;
      font-size: 20px;
      color: #6b7280;
      padding: 2px 6px 2px 0;
      line-height: 1;
      transition: color 0.15s;
    `
    backBtn.addEventListener('mouseenter', () => { backBtn.style.color = '#1a1a2e' })
    backBtn.addEventListener('mouseleave', () => { backBtn.style.color = '#6b7280' })
    backBtn.addEventListener('click', () => navigate('S02'))

    const headerTitle = el('h1', '操作メニュー', `
      font-size: 15px;
      font-weight: 700;
      color: #1a1a2e;
    `)
    header.appendChild(backBtn)
    header.appendChild(headerTitle)
    container.appendChild(header)

    // ── 顧客情報カード ──
    const infoSection = div(`padding: 16px 20px; flex-shrink: 0;`)
    const infoCard = div(`
      background: #fff;
      border-radius: 10px;
      padding: 16px;
      border: 1px solid #e5e7eb;
    `)

    const infoLabel = el('p', '選択中の顧客', `
      font-size: 11px;
      font-weight: 600;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
    `)

    const customerName = el('p', customer?.name ?? '(名前なし)', `
      font-size: 16px;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 4px;
    `)

    const customerEmail = el('p', customer?.email ?? '(メールなし)', `
      font-size: 13px;
      color: #6b7280;
      margin-bottom: 6px;
    `)

    const customerId = el('p', customer?.id ?? '', `
      font-size: 11px;
      color: #9ca3af;
      font-family: monospace;
    `)

    infoCard.appendChild(infoLabel)
    infoCard.appendChild(customerName)
    infoCard.appendChild(customerEmail)

    if (customer?.description) {
      const customerDesc = el('p', customer.description, `
        font-size: 12px;
        color: #6b7280;
        margin-top: 6px;
        margin-bottom: 2px;
        line-height: 1.4;
        word-break: break-all;
      `)
      infoCard.appendChild(customerDesc)
    }

    infoCard.appendChild(customerId)
    infoSection.appendChild(infoCard)
    container.appendChild(infoSection)

    // ── 操作ボタン ──
    const actionsSection = div(`
      flex: 1;
      padding: 4px 20px 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    `)

    const sectionLabel = el('p', '実行する操作を選択', `
      font-size: 11px;
      font-weight: 600;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    `)
    actionsSection.appendChild(sectionLabel)

    // サブスクリプション管理ボタン
    const subscriptionBtn = createActionButton(
      '📋',
      'サブスクリプション管理',
      'サブスクのキャンセルができます',
      '#635bff'
    )
    subscriptionBtn.addEventListener('click', () => {
      navigate('S04', { subscriptions: undefined, selectedSubscription: undefined })
    })

    // 現金残高追加ボタン
    const balanceBtn = createActionButton(
      '💴',
      '現金残高を追加',
      'テスト用の現金残高をチャージします',
      '#059669'
    )
    balanceBtn.addEventListener('click', () => {
      navigate('S06', { invoices: undefined, selectedInvoice: undefined, cashAmount: undefined })
    })

    actionsSection.appendChild(subscriptionBtn)
    actionsSection.appendChild(balanceBtn)
    container.appendChild(actionsSection)

    return container
  },
}

function createActionButton(
  icon: string,
  label: string,
  description: string,
  accentColor: string
): HTMLButtonElement {
  const btn = document.createElement('button')
  btn.style.cssText = `
    display: flex;
    align-items: center;
    gap: 14px;
    width: 100%;
    padding: 16px;
    background: #fff;
    border: 1.5px solid #e5e7eb;
    border-radius: 10px;
    cursor: pointer;
    text-align: left;
    transition: border-color 0.15s, box-shadow 0.15s;
  `
  btn.addEventListener('mouseenter', () => {
    btn.style.borderColor = accentColor
    btn.style.boxShadow = `0 2px 8px rgba(0,0,0,0.08)`
  })
  btn.addEventListener('mouseleave', () => {
    btn.style.borderColor = '#e5e7eb'
    btn.style.boxShadow = 'none'
  })

  const iconEl = div(`
    width: 40px;
    height: 40px;
    background: ${accentColor}1a;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
  `)
  iconEl.textContent = icon

  const textWrap = div(`flex: 1;`)
  const labelEl = el('p', label, `
    font-size: 14px;
    font-weight: 600;
    color: #1a1a2e;
    margin-bottom: 3px;
  `)
  const descEl = el('p', description, `
    font-size: 12px;
    color: #6b7280;
    line-height: 1.4;
  `)
  textWrap.appendChild(labelEl)
  textWrap.appendChild(descEl)

  const arrow = el('span', '›', `
    font-size: 20px;
    color: #9ca3af;
    flex-shrink: 0;
    line-height: 1;
  `)

  btn.appendChild(iconEl)
  btn.appendChild(textWrap)
  btn.appendChild(arrow)

  return btn
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