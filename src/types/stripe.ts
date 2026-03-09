// Stripe API レスポンス型定義

export interface StripeCustomer {
  id: string
  object: 'customer'
  email: string | null
  name: string | null
  metadata: Record<string, string>
  created: number
  currency: string | null
  balance: number
  cash_balance: StripeCashBalance | null
}

export interface StripeCashBalance {
  object: 'cash_balance'
  available: Record<string, number> | null
  customer: string
  livemode: boolean
}

export interface StripeSubscription {
  id: string
  object: 'subscription'
  customer: string
  status: StripeSubscriptionStatus
  items: {
    data: StripeSubscriptionItem[]
  }
  current_period_start: number
  current_period_end: number
  created: number
  cancel_at_period_end: boolean
  canceled_at: number | null
}

export type StripeSubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'past_due'
  | 'paused'
  | 'trialing'
  | 'unpaid'

export interface StripeSubscriptionItem {
  id: string
  object: 'subscription_item'
  price: StripePrice
  quantity: number
}

export interface StripePrice {
  id: string
  object: 'price'
  currency: string
  unit_amount: number | null
  recurring: {
    interval: 'day' | 'week' | 'month' | 'year'
    interval_count: number
  } | null
  product: string | StripeProduct
}

export interface StripeProduct {
  id: string
  object: 'product'
  name: string
  active: boolean
}

export interface StripeInvoice {
  id: string
  object: 'invoice'
  customer: string
  subscription: string | null
  status: StripeInvoiceStatus
  amount_due: number
  amount_paid: number
  amount_remaining: number
  currency: string
  created: number
  due_date: number | null
  description: string | null
  number: string | null
}

export type StripeInvoiceStatus =
  | 'draft'
  | 'open'
  | 'paid'
  | 'uncollectible'
  | 'void'

export interface StripeListResponse<T> {
  object: 'list'
  data: T[]
  has_more: boolean
  url: string
}

export interface StripeSearchResponse<T> {
  object: 'search_result'
  data: T[]
  has_more: boolean
  next_page: string | null
  url: string
}

export interface StripeError {
  error: {
    type: string
    code?: string
    message: string
    param?: string
  }
}