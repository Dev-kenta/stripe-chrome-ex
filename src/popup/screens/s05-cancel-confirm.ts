// S05: サブスクリプション キャンセル確認画面

import type { Screen, AppState, NavigateFn } from '../types'
import { sendMessage } from '../send-message'

export const s05CancelConfirm: Screen = {
  render(state: AppState, navigate: NavigateFn): HTMLElement {
    const sub = state.selectedSubscription

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
    const backBtn = createBackButton(() => navigate('S04'))
    const headerTitle = el('h1', 'キャンセル確認', `
      font-size: 15px;
      font-weight: 700;
      color: #1a1a2e;
    `)
    header.appendChild(backBtn)
    header.appendChild(headerTitle)
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

    // 警告バナー
    const warning = div(`
      display: flex;
      align-items: flex-start;
      gap: 10px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 10px;
      padding: 14px;
    `)
    const warnIcon = el('span', '⚠️', `font-size: 18px; line-height: 1.3; flex-shrink: 0;`)
    const warnText = el('p', 'この操作は取り消せません。サブスクリプションを即座にキャンセルします。', `
      font-size: 13px;
      color: #991b1b;
      line-height: 1.5;
    `)
    warning.appendChild(warnIcon)
    warning.appendChild(warnText)
    body.appendChild(warning)

    // ── サブスク詳細カード ──
    const card = div(`
      background: #fff;
      border-radius: 10px;
      border: 1px solid #e5e7eb;
      overflow: hidden;
    `)

    const cardTitle = el('p', 'キャンセル対象', `
      font-size: 11px;
      font-weight: 600;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 12px 16px 8px;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
    `)
    card.appendChild(cardTitle)

    const rows: [string, string][] = [
      ['プラン',       getPlanName(sub)],
      ['ステータス',   getStatusLabel(sub?.status)],
      ['金額',         formatAmount(sub)],
      ['現在の期間',   formatPeriod(sub)],
      ['サブスクID',   sub?.id ?? '-'],
    ]

    for (const [label, value] of rows) {
      const row = div(`
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
        padding: 10px 16px;
        border-bottom: 1px solid #f3f4f6;
      `)
      const labelEl = el('span', label, `
        font-size: 12px;
        color: #6b7280;
        flex-shrink: 0;
      `)
      const valueEl = el('span', value, `
        font-size: 12px;
        font-weight: 500;
        color: #1a1a2e;
        text-align: right;
        word-break: break-all;
        font-family: ${label === 'サブスクID' ? 'monospace' : 'inherit'};
      `)
      row.appendChild(labelEl)
      row.appendChild(valueEl)
      card.appendChild(row)
    }

    body.appendChild(card)

    // ── スペーサー ──
    const spacer = div(`flex: 1;`)
    body.appendChild(spacer)

    // ── ボタンエリア ──
    const btnArea = div(`display: flex; flex-direction: column; gap: 10px;`)

    // エラーメッセージ
    const errorText = el('p', '', `
      font-size: 12px;
      color: #dc2626;
      text-align: center;
      min-height: 16px;
      line-height: 1.4;
    `)
    btnArea.appendChild(errorText)

    // キャンセルボタン（赤）
    const cancelBtn = document.createElement('button')
    cancelBtn.textContent = 'キャンセルする'
    cancelBtn.style.cssText = `
      width: 100%;
      padding: 12px;
      background: #dc2626;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.15s;
    `
    cancelBtn.addEventListener('mouseenter', () => { if (!cancelBtn.disabled) cancelBtn.style.background = '#b91c1c' })
    cancelBtn.addEventListener('mouseleave', () => { if (!cancelBtn.disabled) cancelBtn.style.background = '#dc2626' })

    cancelBtn.addEventListener('click', async () => {
      if (!sub) return
      errorText.textContent = ''
      cancelBtn.textContent = 'キャンセル中...'
      cancelBtn.disabled = true
      cancelBtn.style.background = '#9ca3af'

      const res = await sendMessage({
        action: 'CANCEL_SUBSCRIPTION',
        payload: { subscriptionId: sub.id },
      })

      if (!res.ok) {
        errorText.textContent = res.error
        cancelBtn.textContent = 'キャンセルする'
        cancelBtn.disabled = false
        cancelBtn.style.background = '#dc2626'
        return
      }

      // 成功 → S04に戻る（subscriptionsをリセットして再取得させる）
      navigate('S03', { subscriptions: undefined, selectedSubscription: undefined })
      showSuccessToast()
    })

    // 戻るボタン
    const backBtnBottom = document.createElement('button')
    backBtnBottom.textContent = '戻る'
    backBtnBottom.style.cssText = `
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
    backBtnBottom.addEventListener('mouseenter', () => { backBtnBottom.style.background = '#f9fafb' })
    backBtnBottom.addEventListener('mouseleave', () => { backBtnBottom.style.background = '#fff' })
    backBtnBottom.addEventListener('click', () => navigate('S04'))

    btnArea.appendChild(cancelBtn)
    btnArea.appendChild(backBtnBottom)
    body.appendChild(btnArea)
    container.appendChild(body)

    return container
  },
}

function showSuccessToast(): void {
  const toast = document.createElement('div')
  toast.textContent = '✅ キャンセルしました'
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

  // アニメーション
  if (!document.getElementById('toast-style')) {
    const style = document.createElement('style')
    style.id = 'toast-style'
    style.textContent = `@keyframes fadeIn { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }`
    document.head.appendChild(style)
  }

  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 2500)
}

// ── ヘルパー ──

function getPlanName(sub: AppState['selectedSubscription']): string {
  if (!sub) return '-'
  const item = sub.items.data[0]
  if (!item) return '(プランなし)'
  const product = item.price.product
  if (typeof product === 'object') return product.name
  return item.price.id
}

function getStatusLabel(status: string | undefined): string {
  const map: Record<string, string> = {
    active: '有効', canceled: 'キャンセル済み', incomplete: '未完了',
    incomplete_expired: '期限切れ', past_due: '支払い遅延',
    paused: '一時停止', trialing: 'トライアル', unpaid: '未払い',
  }
  return status ? (map[status] ?? status) : '-'
}

function formatAmount(sub: AppState['selectedSubscription']): string {
  if (!sub) return '-'
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
  const intervalMap: Record<string, string> = { day: '日', week: '週', month: '月', year: '年' }
  const intervalLabel = intervalMap[recurring.interval] ?? recurring.interval
  const count = recurring.interval_count
  return `${formatted} / ${count > 1 ? `${count}${intervalLabel}` : intervalLabel}`
}

function formatPeriod(sub: AppState['selectedSubscription']): string {
  if (!sub) return '-'
  const fmt = (ts: number | null | undefined): string => {
    if (!ts) return '-'
    const d = new Date(ts * 1000)
    if (isNaN(d.getTime())) return '-'
    return d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric' })
  }
  const start = fmt(sub.current_period_start)
  const end = fmt(sub.current_period_end)
  if (start === '-' && end === '-') return '-'
  return `${start} 〜 ${end}`
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