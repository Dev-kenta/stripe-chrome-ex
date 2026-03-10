// S06: Invoice一覧画面
// 請求書一覧を表示し、金額を選択して残高追加確認画面へ進む

import type { Screen, AppState, NavigateFn } from '../types'
import type { StripeInvoice } from '../../types/stripe'
import { sendMessage } from '../send-message'
import { createLoadingSpinner } from '../components/loading-spinner'

let isFetching = false

export const s06Invoices: Screen = {
  render(state: AppState, navigate: NavigateFn): HTMLElement {
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
    header.appendChild(createBackButton(() => navigate('S03')))
    header.appendChild(el('h1', '現金残高を追加', `
      font-size: 15px;
      font-weight: 700;
      color: #1a1a2e;
    `))
    container.appendChild(header)

    // ── 顧客名サブヘッダー ──
    const subHeader = div(`
      padding: 10px 20px;
      background: #fff;
      border-bottom: 1px solid #e5e7eb;
      flex-shrink: 0;
    `)
    subHeader.appendChild(el('p', state.customer?.name ?? state.customer?.email ?? '', `
      font-size: 12px;
      color: #6b7280;
    `))
    container.appendChild(subHeader)

    // ── スクロールエリア ──
    const scrollArea = div(`
      flex: 1;
      overflow-y: auto;
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    `)
    container.appendChild(scrollArea)

    // 手動入力エリア（常に表示）
    scrollArea.appendChild(createManualInputArea(navigate))

    // Invoice リストエリア
    const invoiceArea = div(`display: flex; flex-direction: column; gap: 0;`)
    scrollArea.appendChild(invoiceArea)

    if (state.invoices) {
      renderInvoiceList(invoiceArea, state.invoices, navigate)
    } else {
      fetchAndRender(invoiceArea, state, navigate)
    }

    return container
  },
}

function createManualInputArea(navigate: NavigateFn): HTMLElement {
  const wrap = div(`
    background: #fff;
    border-radius: 10px;
    border: 1px solid #e5e7eb;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  `)

  wrap.appendChild(el('p', '金額を入力', `
    font-size: 12px;
    font-weight: 600;
    color: #374151;
  `))

  const row = div(`display: flex; gap: 8px; align-items: center;`)

  const input = document.createElement('input')
  input.type = 'number'
  input.min = '1'
  input.placeholder = '例: 1980'
  input.style.cssText = `
    flex: 1;
    padding: 9px 12px;
    border: 1.5px solid #e5e7eb;
    border-radius: 8px;
    font-size: 14px;
    color: #1a1a2e;
    outline: none;
    transition: border-color 0.15s;
  `
  input.addEventListener('focus', () => { input.style.borderColor = '#059669' })
  input.addEventListener('blur', () => { input.style.borderColor = '#e5e7eb' })

  const unit = el('span', '円', `font-size: 14px; color: #6b7280; flex-shrink: 0;`)

  const confirmBtn = document.createElement('button')
  confirmBtn.textContent = '確認'
  confirmBtn.style.cssText = `
    padding: 9px 16px;
    background: #059669;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.15s;
    flex-shrink: 0;
  `
  confirmBtn.addEventListener('mouseenter', () => { confirmBtn.style.background = '#047857' })
  confirmBtn.addEventListener('mouseleave', () => { confirmBtn.style.background = '#059669' })
  confirmBtn.addEventListener('click', () => {
    const val = parseInt(input.value, 10)
    if (!val || val <= 0) {
      input.style.borderColor = '#dc2626'
      input.focus()
      return
    }
    navigate('S07', { cashAmount: val, selectedInvoice: undefined })
  })

  row.appendChild(input)
  row.appendChild(unit)
  row.appendChild(confirmBtn)
  wrap.appendChild(row)

  return wrap
}

async function fetchAndRender(
  area: HTMLElement,
  state: AppState,
  navigate: NavigateFn
): Promise<void> {
  if (isFetching) return
  const customerId = state.customer?.id
  if (!customerId) {
    showMessage(area, '⚠️', '顧客情報がありません', '#dc2626')
    return
  }

  isFetching = true
  area.replaceChildren(createLoadingSpinner('請求書を読み込み中...'))

  const res = await sendMessage<{ invoices: StripeInvoice[] }>({
    action: 'LIST_INVOICES',
    payload: { customerId },
  })

  isFetching = false

  if (!res.ok) {
    showMessage(area, '⚠️', res.error, '#dc2626')
    return
  }

  navigate('S06', { invoices: res.data.invoices })
}

function renderInvoiceList(
  area: HTMLElement,
  invoices: StripeInvoice[],
  navigate: NavigateFn
): void {
  area.replaceChildren()

  const sectionLabel = el('p', '請求書から金額を選択', `
    font-size: 12px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 8px;
  `)
  area.appendChild(sectionLabel)

  if (invoices.length === 0) {
    showMessage(area, '📄', '請求書がありません', '#6b7280')
    return
  }

  const count = el('p', `${invoices.length} 件`, `
    font-size: 12px;
    color: #6b7280;
    margin-bottom: 10px;
  `)
  area.appendChild(count)

  for (const invoice of invoices) {
    area.appendChild(createInvoiceCard(invoice, navigate))
  }
}

function createInvoiceCard(invoice: StripeInvoice, navigate: NavigateFn): HTMLElement {
  const isPaid = invoice.status === 'paid'

  const card = div(`
    background: #fff;
    border-radius: 10px;
    padding: 12px 14px;
    margin-bottom: 8px;
    border: 1.5px solid #e5e7eb;
    cursor: ${isPaid ? 'default' : 'pointer'};
    opacity: ${isPaid ? '0.6' : '1'};
    transition: border-color 0.15s, box-shadow 0.15s;
  `)

  if (!isPaid) {
    card.addEventListener('mouseenter', () => {
      card.style.borderColor = '#059669'
      card.style.boxShadow = '0 2px 8px rgba(5,150,105,0.12)'
    })
    card.addEventListener('mouseleave', () => {
      card.style.borderColor = '#e5e7eb'
      card.style.boxShadow = 'none'
    })
    card.addEventListener('click', () => {
      navigate('S07', { cashAmount: invoice.amount_due, selectedInvoice: invoice })
    })
  }

  // 1行目: ステータスバッジ + 番号
  const row1 = div(`display: flex; align-items: center; gap: 8px; margin-bottom: 6px;`)
  row1.appendChild(createStatusBadge(invoice.status))

  const invoiceNum = el('p', invoice.number ?? invoice.id, `
    font-size: 12px;
    color: #6b7280;
    font-family: monospace;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `)
  row1.appendChild(invoiceNum)

  // 2行目: 金額 + 日付
  const row2 = div(`display: flex; justify-content: space-between; align-items: center;`)

  const amountEl = el('p', formatAmount(invoice), `
    font-size: 14px;
    font-weight: 700;
    color: #1a1a2e;
  `)

  const dateEl = el('p', formatDate(invoice.created), `
    font-size: 11px;
    color: #9ca3af;
  `)

  row2.appendChild(amountEl)
  row2.appendChild(dateEl)

  card.appendChild(row1)
  card.appendChild(row2)

  if (isPaid) {
    card.appendChild(el('p', '支払済みのため選択できません', `
      font-size: 11px;
      color: #9ca3af;
      margin-top: 4px;
    `))
  }

  return card
}

function createStatusBadge(status: StripeInvoice['status']): HTMLElement {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    draft:        { label: '下書き',   bg: '#f3f4f6', color: '#6b7280' },
    open:         { label: '未払い',   bg: '#fef3c7', color: '#92400e' },
    paid:         { label: '支払済み', bg: '#d1fae5', color: '#065f46' },
    uncollectible:{ label: '回収不能', bg: '#fee2e2', color: '#991b1b' },
    void:         { label: '無効',     bg: '#f3f4f6', color: '#6b7280' },
  }
  const { label, bg, color } = map[status] ?? { label: status, bg: '#f3f4f6', color: '#6b7280' }

  return el('span', label, `
    display: inline-block;
    padding: 2px 8px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 600;
    background: ${bg};
    color: ${color};
    white-space: nowrap;
    flex-shrink: 0;
  `)
}

function formatAmount(invoice: StripeInvoice): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: invoice.currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(invoice.amount_due)
}

function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  })
}

function showMessage(area: HTMLElement, icon: string, message: string, color: string): void {
  area.replaceChildren()
  const wrap = div(`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px 20px;
    text-align: center;
    gap: 12px;
  `)
  wrap.appendChild(el('p', icon, `font-size: 32px; line-height: 1;`))
  wrap.appendChild(el('p', message, `font-size: 13px; color: ${color}; line-height: 1.5;`))
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