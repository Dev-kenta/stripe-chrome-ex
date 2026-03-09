// Popup ↔ Service Worker 間のメッセージ型定義

export type RequestMessage =
  | { action: 'SAVE_API_KEY'; payload: { plainKey: string } }
  | { action: 'GET_API_KEY_STATUS' }
  | { action: 'DELETE_API_KEY' }
  | { action: 'SEARCH_CUSTOMER'; payload: { teamId: string } }
  | { action: 'LIST_SUBSCRIPTIONS'; payload: { customerId: string } }
  | { action: 'CANCEL_SUBSCRIPTION'; payload: { subscriptionId: string } }
  | { action: 'LIST_INVOICES'; payload: { customerId: string } }
  | { action: 'ADD_CASH_BALANCE'; payload: { customerId: string; amount: number } }

export type ResponseMessage<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string }

// 各アクションのレスポンスデータ型

export interface ApiKeyStatusData {
  exists: boolean
  maskedKey?: string // 例: "sk_test_...AbCd"
}

export interface SearchCustomerData {
  customers: import('./stripe').StripeCustomer[]
}

export interface ListSubscriptionsData {
  subscriptions: import('./stripe').StripeSubscription[]
}

export interface CancelSubscriptionData {
  subscriptionId: string
  status: string
}

export interface ListInvoicesData {
  invoices: import('./stripe').StripeInvoice[]
}

export interface AddCashBalanceData {
  customerId: string
  amount: number
  currency: string
}