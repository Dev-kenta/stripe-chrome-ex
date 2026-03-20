// S04: サブスクリプション一覧画面

import type { Screen, AppState, NavigateFn } from '../types'
import type { StripeSubscription, StripeSubscriptionStatus } from '../../types/stripe'
import { sendMessage } from '../send-message'
import { createLoadingSpinner } from '../components/loading-spinner'

// 重複fetchを防ぐフラグ
let isFetching = false

export const s04Subscriptions: Screen = {
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
    const backBtn = createBackButton(() => navigate('S03'))
    const headerTitle = el('h1', 'サブスクリプション', `
      font-size: 15px;
      font-weight: 700;
      color: #1a1a2e;
    `)
    header.appendChild(backBtn)
    header.appendChild(headerTitle)
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

    // ── リストエリア ──
    const listArea = div(`
      flex: 1;
      overflow-y: auto;
      padding: 16px 20px;
    `)
    container.appendChild(listArea)

    // データ取得済みなら即表示、なければ fetch
    if (state.subscriptions) {
      renderList(listArea, state.subscriptions, navigate)
    } else {
      fetchAndRender(listArea, state, navigate)
    }

    return container
  },
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
  area.replaceChildren(createLoadingSpinner('読み込み中...'))

  const res = await sendMessage<{ subscriptions: StripeSubscription[] }>({
    action: 'LIST_SUBSCRIPTIONS',
    payload: { customerId },
  })

  isFetching = false

  if (!res.ok) {
    showMessage(area, '⚠️', res.error, '#dc2626')
    return
  }

  // stateに保存して再描画
  navigate('S04', { subscriptions: res.data.subscriptions })
}

function renderList(
  area: HTMLElement,
  subscriptions: StripeSubscription[],
  navigate: NavigateFn
): void {
  area.replaceChildren()

  if (subscriptions.length === 0) {
    showMessage(area, '📋', 'サブスクリプションがありません', '#6b7280')
    return
  }

  const count = el('p', `${subscriptions.length} 件`, `
    font-size: 12px;
    color: #6b7280;
    margin-bottom: 10px;
  `)
  area.appendChild(count)

  for (const sub of subscriptions) {
    area.appendChild(createSubscriptionCard(sub, navigate))
  }
}

function createSubscriptionCard(sub: StripeSubscription, navigate: NavigateFn): HTMLElement {
  const isCanceled = sub.status === 'canceled'

  const card = div(`
    background: #fff;
    border-radius: 10px;
    padding: 14px 16px;
    margin-bottom: 8px;
    border: 1.5px solid #e5e7eb;
    cursor: ${isCanceled ? 'default' : 'pointer'};
    opacity: ${isCanceled ? '0.6' : '1'};
    transition: border-color 0.15s, box-shadow 0.15s;
  `)

  if (!isCanceled) {
    card.addEventListener('mouseenter', () => {
      card.style.borderColor = '#635bff'
      card.style.boxShadow = '0 2px 8px rgba(99,91,255,0.12)'
    })
    card.addEventListener('mouseleave', () => {
      card.style.borderColor = '#e5e7eb'
      card.style.boxShadow = 'none'
    })
    card.addEventListener('click', () => navigate('S05', { selectedSubscription: sub }))
  }

  // ── 1行目: ステータスバッジ + プラン名 + price ID ──
  const row1 = div(`display: flex; align-items: center; gap: 8px; margin-bottom: 8px;`)
  row1.appendChild(createStatusBadge(sub.status))

  const nameBlock = div(`flex: 1; overflow: hidden;`)
  const planName = el('p', getPlanName(sub), `
    font-size: 13px;
    font-weight: 600;
    color: #1a1a2e;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `)
  nameBlock.appendChild(planName)

  const item0 = sub.items.data[0]
  if (item0) {
    const priceId = el('p', item0.price.id, `
      font-size: 10px;
      color: #9ca3af;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-top: 2px;
    `)
    nameBlock.appendChild(priceId)
  }

  row1.appendChild(nameBlock)

  // ── 2行目: 金額 + 期間 ──
  const row2 = div(`display: flex; justify-content: space-between; align-items: center;`)

  const amount = el('p', formatAmount(sub), `
    font-size: 13px;
    font-weight: 500;
    color: #374151;
  `)

  const period = el('p', formatPeriod(sub), `
    font-size: 11px;
    color: #9ca3af;
  `)

  row2.appendChild(amount)
  row2.appendChild(period)

  card.appendChild(row1)
  card.appendChild(row2)

  // キャンセル済みの場合は選択不可の注記
  if (isCanceled) {
    const note = el('p', 'キャンセル済みのため操作できません', `
      font-size: 11px;
      color: #9ca3af;
      margin-top: 6px;
    `)
    card.appendChild(note)
  }

  return card
}

function createStatusBadge(status: StripeSubscriptionStatus): HTMLElement {
  const map: Record<StripeSubscriptionStatus, { label: string; bg: string; color: string }> = {
    active:             { label: '有効',           bg: '#d1fae5', color: '#065f46' },
    canceled:           { label: 'キャンセル済み', bg: '#f3f4f6', color: '#6b7280' },
    incomplete:         { label: '未完了',         bg: '#fef3c7', color: '#92400e' },
    incomplete_expired: { label: '期限切れ',       bg: '#fee2e2', color: '#991b1b' },
    past_due:           { label: '支払い遅延',     bg: '#fee2e2', color: '#991b1b' },
    paused:             { label: '一時停止',       bg: '#ede9fe', color: '#5b21b6' },
    trialing:           { label: 'トライアル',     bg: '#dbeafe', color: '#1e40af' },
    unpaid:             { label: '未払い',         bg: '#fee2e2', color: '#991b1b' },
  }
  const { label, bg, color } = map[status] ?? { label: status, bg: '#f3f4f6', color: '#6b7280' }

  const badge = el('span', label, `
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
  return badge
}

function getPlanName(sub: StripeSubscription): string {
  const item = sub.items.data[0]
  if (!item) return '(プランなし)'
  const product = item.price.product
  if (typeof product === 'object') return product.name
  return '(プラン名不明)'
}

function formatAmount(sub: StripeSubscription): string {
  const item = sub.items.data[0]
  if (!item) return '-'
  const { unit_amount, currency, recurring } = item.price
  if (unit_amount === null) return '-'

  const formatted = new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(unit_amount)

  if (!recurring) return formatted

  const intervalMap: Record<string, string> = {
    day: '日', week: '週', month: '月', year: '年',
  }
  const intervalLabel = intervalMap[recurring.interval] ?? recurring.interval
  const count = recurring.interval_count
  return `${formatted} / ${count > 1 ? `${count}${intervalLabel}` : intervalLabel}`
}

function formatPeriod(sub: StripeSubscription): string {
  const fmt = (ts: number | null | undefined): string => {
    if (!ts) return '-'
    const d = new Date(ts * 1000)
    if (isNaN(d.getTime())) return '-'
    return d.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })
  }

  if (sub.status === 'canceled' && sub.canceled_at) {
    return `${fmt(sub.canceled_at)} キャンセル`
  }
  const start = fmt(sub.current_period_start)
  const end = fmt(sub.current_period_end)
  if (start === '-' && end === '-') return '-'
  return `${start} 〜 ${end}`
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