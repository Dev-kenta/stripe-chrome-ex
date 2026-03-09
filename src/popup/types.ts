// Popup画面の型定義

import type { StripeCustomer, StripeSubscription, StripeInvoice } from '../types/stripe'

// 画面ID
export type ScreenId = 'S01' | 'S02' | 'S03' | 'S04' | 'S05' | 'S06' | 'S07'

// アプリケーション状態
export interface AppState {
  customer?: StripeCustomer
  subscriptions?: StripeSubscription[]
  selectedSubscription?: StripeSubscription
  invoices?: StripeInvoice[]
  selectedInvoice?: StripeInvoice
  cashAmount?: number
}

// 画面遷移関数の型
export type NavigateFn = (screenId: ScreenId, stateUpdate?: Partial<AppState>) => void

// 画面インターフェース
export interface Screen {
  render(state: AppState, navigate: NavigateFn): HTMLElement
}
