// S07: 残高追加確認画面

import type { Screen, AppState, NavigateFn } from '../types'
import { sendMessage } from '../send-message'

export const s07BalanceConfirm: Screen = {
  render(state: AppState, navigate: NavigateFn): HTMLElement {
    const customer = state.customer
    const amount = state.cashAmount ?? 0

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
    header.appendChild(createBackButton(() => navigate('S06')))
    header.appendChild(el('h1', '残高追加確認', `
      font-size: 15px;
      font-weight: 700;
      color: #1a1a2e;
    `))
    container.appendChild(header)

    // ── 本文 ──
    const body = div(`
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 20px;
      gap: 16px;
      overflow-y: auto;
    `)

    // 確認カード
    const card = div(`
      background: #fff;
      border-radius: 10px;
      border: 1px solid #e5e7eb;
      overflow: hidden;
    `)

    card.appendChild(el('p', '追加内容', `
      font-size: 11px;
      font-weight: 600;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 12px 16px 8px;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
    `))

    const rows: [string, string, boolean][] = [
      ['顧客名',      customer?.name ?? customer?.email ?? '-', false],
      ['顧客ID',      customer?.id ?? '-',                      true],
      ['追加金額',    formatAmount(amount),                     false],
      ['通貨',        'JPY',                                    false],
    ]

    // Invoice から来た場合は請求書番号も表示
    if (state.selectedInvoice) {
      rows.push(['請求書番号', state.selectedInvoice.number ?? state.selectedInvoice.id, true])
    }

    for (const [label, value, mono] of rows) {
      const row = div(`
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
        padding: 10px 16px;
        border-bottom: 1px solid #f3f4f6;
      `)
      row.appendChild(el('span', label, `
        font-size: 12px;
        color: #6b7280;
        flex-shrink: 0;
      `))
      row.appendChild(el('span', value, `
        font-size: 12px;
        font-weight: 500;
        color: #1a1a2e;
        text-align: right;
        word-break: break-all;
        font-family: ${mono ? 'monospace' : 'inherit'};
      `))
      card.appendChild(row)
    }

    body.appendChild(card)

    // 金額強調表示
    const amountHighlight = div(`
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-radius: 10px;
      padding: 16px;
      text-align: center;
    `)
    amountHighlight.appendChild(el('p', '追加される金額', `
      font-size: 12px;
      color: #065f46;
      margin-bottom: 6px;
    `))
    amountHighlight.appendChild(el('p', formatAmount(amount), `
      font-size: 28px;
      font-weight: 800;
      color: #065f46;
      line-height: 1;
    `))
    body.appendChild(amountHighlight)

    // スペーサー
    body.appendChild(div(`flex: 1;`))

    // ── ボタンエリア ──
    const btnArea = div(`display: flex; flex-direction: column; gap: 10px;`)

    const errorText = el('p', '', `
      font-size: 12px;
      color: #dc2626;
      text-align: center;
      min-height: 16px;
      line-height: 1.4;
    `)
    btnArea.appendChild(errorText)

    // 追加ボタン
    const addBtn = document.createElement('button')
    addBtn.textContent = '残高を追加する'
    addBtn.style.cssText = `
      width: 100%;
      padding: 12px;
      background: #059669;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.15s;
    `
    addBtn.addEventListener('mouseenter', () => { if (!addBtn.disabled) addBtn.style.background = '#047857' })
    addBtn.addEventListener('mouseleave', () => { if (!addBtn.disabled) addBtn.style.background = '#059669' })

    addBtn.addEventListener('click', async () => {
      if (!customer?.id) return
      errorText.textContent = ''
      addBtn.textContent = '追加中...'
      addBtn.disabled = true
      addBtn.style.background = '#9ca3af'

      const res = await sendMessage({
        action: 'ADD_CASH_BALANCE',
        payload: { customerId: customer.id, amount },
      })

      if (!res.ok) {
        errorText.textContent = res.error
        addBtn.textContent = '残高を追加する'
        addBtn.disabled = false
        addBtn.style.background = '#059669'
        return
      }

      // 成功 → S03に戻る
      navigate('S03', { invoices: undefined, selectedInvoice: undefined, cashAmount: undefined })
      showSuccessToast(formatAmount(amount))
    })

    // 戻るボタン
    const backBtn = document.createElement('button')
    backBtn.textContent = '戻る'
    backBtn.style.cssText = `
      width: 100%;
      padding: 11px;
      background: #fff;
      color: #374151;
      border: 1.5px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s;
    `
    backBtn.addEventListener('mouseenter', () => { backBtn.style.background = '#f9fafb' })
    backBtn.addEventListener('mouseleave', () => { backBtn.style.background = '#fff' })
    backBtn.addEventListener('click', () => navigate('S06'))

    btnArea.appendChild(addBtn)
    btnArea.appendChild(backBtn)
    body.appendChild(btnArea)
    container.appendChild(body)

    return container
  },
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(amount)
}

function showSuccessToast(amount: string): void {
  const toast = document.createElement('div')
  toast.textContent = `✅ ${amount} の残高を追加しました`
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: #065f46;
    color: #fff;
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    z-index: 9999;
    white-space: nowrap;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: fadeIn 0.2s ease;
  `

  if (!document.getElementById('toast-style')) {
    const style = document.createElement('style')
    style.id = 'toast-style'
    style.textContent = `@keyframes fadeIn { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }`
    document.head.appendChild(style)
  }

  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 2500)
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

function createBackButton(onClick: () => void): HTMLButtonElement {
  const btn = document.createElement('button')
  btn.textContent = '←'
  btn.style.cssText = `
    background: none;
    border: none;
    cursor: pointer;
    font-size: 20px;
    color: #6b7280;
    padding: 2px 6px 2px 0;
    line-height: 1;
    transition: color 0.15s;
  `
  btn.addEventListener('mouseenter', () => { btn.style.color = '#1a1a2e' })
  btn.addEventListener('mouseleave', () => { btn.style.color = '#6b7280' })
  btn.addEventListener('click', onClick)
  return btn
}