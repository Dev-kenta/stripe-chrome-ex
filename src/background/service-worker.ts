/// <reference types="chrome" />

// Background Service Worker
// Stripe API通信・暗号化・ストレージ操作の中核

import { saveApiKey, loadApiKey, deleteApiKey, hasApiKey, getMaskedKey } from '../storage/api-key-store'
import type {
  RequestMessage,
  ResponseMessage,
  ApiKeyStatusData,
  SearchCustomerData,
  ListSubscriptionsData,
  CancelSubscriptionData,
  ListInvoicesData,
  AddCashBalanceData,
} from '../types/messages'
import type {
  StripeCustomer,
  StripeSubscription,
  StripeInvoice,
  StripeSearchResponse,
  StripeListResponse,
  StripeError,
} from '../types/stripe'

// Stripe API ベースURL
const STRIPE_API_BASE = 'https://api.stripe.com'

/**
 * APIキーのバリデーション
 * sk_test_ のみ許可、sk_live_ は明示的にブロック
 */
function validateApiKey(key: string): void {
  if (key.startsWith('sk_live_')) {
    throw new Error('本番環境のAPIキーは使用できません')
  }
  if (!/^sk_test_[a-zA-Z0-9]{24,}$/.test(key)) {
    throw new Error('無効なテスト用APIキーフォーマットです')
  }
}

/**
 * Stripe API リクエスト共通関数
 * Authorization: Bearer {decryptedApiKey} ヘッダーを付与
 * エラー: 401/403はAPIキー再設定を促すコードを返す
 */
async function stripeRequest<T>(
  method: 'GET' | 'POST' | 'DELETE',
  path: string,
  params?: Record<string, string>
): Promise<ResponseMessage<T>> {
  try {
    // APIキーを取得
    const apiKey = await loadApiKey()
    if (!apiKey) {
      return {
        ok: false,
        error: 'APIキーが設定されていません',
        code: 'API_KEY_NOT_FOUND',
      }
    }

    // リクエストURL構築
    let url = `${STRIPE_API_BASE}${path}`
    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      'Stripe-Version': '2020-08-27',
    }

    let body: string | undefined

    if (method === 'GET' && params) {
      const queryString = new URLSearchParams(params).toString()
      url += `?${queryString}`
    } else if ((method === 'POST' || method === 'DELETE') && params) {
      const bodyStr = new URLSearchParams(params).toString()
      if (bodyStr) {
        body = bodyStr
        headers['Content-Type'] = 'application/x-www-form-urlencoded'
      }
    }

    // API リクエスト実行
    // credentials: 'omit' でブラウザのセッションクッキーを除外する
    const response = await fetch(url, { method, headers, body, credentials: 'omit' })

    // エラーハンドリング
    if (!response.ok) {
      const errorData: StripeError = await response.json()

      // 認証エラーの場合は特別なコードを返す
      if (response.status === 401 || response.status === 403) {
        return {
          ok: false,
          error: 'APIキーが無効です。再設定してください。',
          code: 'API_KEY_INVALID',
        }
      }

      // レートリミット
      if (response.status === 429) {
        return {
          ok: false,
          error: 'リクエストが多すぎます。少し待ってから再試行してください。',
          code: 'RATE_LIMIT',
        }
      }

      return {
        ok: false,
        error: errorData.error.message,
        code: errorData.error.code,
      }
    }

    // 成功レスポンス
    const data: T = await response.json()
    return { ok: true, data }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'リクエストに失敗しました',
    }
  }
}

/**
 * メッセージハンドラ
 */
chrome.runtime.onMessage.addListener((message: RequestMessage, _sender, sendResponse) => {
  // 非同期処理を行うため、必ず return true を返す
  handleMessage(message)
    .then(sendResponse)
    .catch((error) => {
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : '予期しないエラーが発生しました',
      })
    })
  return true
})

/**
 * メッセージハンドラの実装
 */
async function handleMessage(message: RequestMessage): Promise<ResponseMessage> {
  switch (message.action) {
    case 'SAVE_API_KEY':
      return handleSaveApiKey(message.payload.plainKey)

    case 'GET_API_KEY_STATUS':
      return handleGetApiKeyStatus()

    case 'DELETE_API_KEY':
      return handleDeleteApiKey()

    case 'SEARCH_CUSTOMER':
      return handleSearchCustomer(message.payload.teamId)

    case 'LIST_SUBSCRIPTIONS':
      return handleListSubscriptions(message.payload.customerId)

    case 'CANCEL_SUBSCRIPTION':
      return handleCancelSubscription(message.payload.subscriptionId)

    case 'LIST_INVOICES':
      return handleListInvoices(message.payload.customerId)

    case 'ADD_CASH_BALANCE':
      return handleAddCashBalance(message.payload.customerId, message.payload.amount)

    default:
      return {
        ok: false,
        error: '不明なアクションです',
      }
  }
}

// --- 認証ハンドラ ---

/**
 * APIキーを保存
 */
async function handleSaveApiKey(plainKey: string): Promise<ResponseMessage<void>> {
  try {
    // バリデーション
    validateApiKey(plainKey)

    // 暗号化して保存
    await saveApiKey(plainKey)

    return { ok: true, data: undefined }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'APIキーの保存に失敗しました',
    }
  }
}

/**
 * APIキーの状態を取得
 */
async function handleGetApiKeyStatus(): Promise<ResponseMessage<ApiKeyStatusData>> {
  try {
    const exists = await hasApiKey()
    if (!exists) {
      return {
        ok: true,
        data: { exists: false },
      }
    }

    const maskedKey = await getMaskedKey()
    return {
      ok: true,
      data: {
        exists: true,
        maskedKey: maskedKey || undefined,
      },
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'ステータス取得に失敗しました',
    }
  }
}

/**
 * APIキーを削除
 */
async function handleDeleteApiKey(): Promise<ResponseMessage<void>> {
  try {
    await deleteApiKey()
    return { ok: true, data: undefined }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'APIキーの削除に失敗しました',
    }
  }
}

// --- Stripe API ハンドラ ---

/**
 * 顧客検索
 * GET /v1/customers/search?query=metadata['team_id']:'{teamId}' AND metadata['rails_env']:'staging'
 */
async function handleSearchCustomer(teamId: string): Promise<ResponseMessage<SearchCustomerData>> {
  const query = `metadata['team_id']:'${teamId}' AND metadata['rails_env']:'staging'`
  const result = await stripeRequest<StripeSearchResponse<StripeCustomer>>('GET', '/v1/customers/search', {
    query,
  })

  if (!result.ok) {
    return result
  }

  return {
    ok: true,
    data: {
      customers: result.data.data,
    },
  }
}

/**
 * サブスクリプション一覧取得
 * GET /v1/subscriptions?customer={customerId}
 */
async function handleListSubscriptions(
  customerId: string
): Promise<ResponseMessage<ListSubscriptionsData>> {
  const result = await stripeRequest<StripeListResponse<StripeSubscription>>('GET', '/v1/subscriptions', {
    customer: customerId,
    'expand[]': 'data.items.data.price.product',
  })

  if (!result.ok) {
    return result
  }

  return {
    ok: true,
    data: {
      subscriptions: result.data.data,
    },
  }
}

/**
 * コンテントスクリプト経由でStripe APIに書き込みリクエストを送信
 * stg.form.run ページの Origin (https://stg.form.run) を使うため
 * chrome-extension:// Origin をブロックする Cloudflare のルールを回避できる
 */
async function proxyRequest<T>(
  method: 'DELETE' | 'POST',
  path: string,
  params?: Record<string, string>
): Promise<ResponseMessage<T>> {
  const apiKey = await loadApiKey()
  if (!apiKey) {
    return { ok: false, error: 'APIキーが設定されていません', code: 'API_KEY_NOT_FOUND' }
  }

  // stg.form.run のタブを探す
  const tabs = await chrome.tabs.query({ url: 'https://stg.form.run/*' })
  const tabId = tabs[0]?.id
  if (!tabId) {
    return {
      ok: false,
      error: 'stg.form.run のタブが見つかりません。stg.form.run を開いてから再試行してください。',
      code: 'PROXY_TAB_NOT_FOUND',
    }
  }

  try {
    const response = await chrome.tabs.sendMessage(tabId, {
      action: 'STRIPE_PROXY',
      method,
      path,
      params,
      apiKey,
    })
    return response as ResponseMessage<T>
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'コンテントスクリプトへの通信に失敗しました',
    }
  }
}

/**
 * サブスクリプションキャンセル
 * DELETE /v1/subscriptions/{subscriptionId}
 * SW から直接 fetch すると Origin: chrome-extension:// が付与されて Cloudflare にブロックされるため、
 * stg.form.run に挿入したコンテントスクリプト経由で実行する
 */
async function handleCancelSubscription(
  subscriptionId: string
): Promise<ResponseMessage<CancelSubscriptionData>> {
  const result = await proxyRequest<StripeSubscription>('DELETE', `/v1/subscriptions/${subscriptionId}`)

  if (!result.ok) {
    return result
  }

  return {
    ok: true,
    data: {
      subscriptionId: result.data.id,
      status: result.data.status,
    },
  }
}

/**
 * インボイス一覧取得
 * GET /v1/invoices?customer={customerId}
 */
async function handleListInvoices(customerId: string): Promise<ResponseMessage<ListInvoicesData>> {
  const result = await stripeRequest<StripeListResponse<StripeInvoice>>('GET', '/v1/invoices', {
    customer: customerId,
  })

  if (!result.ok) {
    return result
  }

  return {
    ok: true,
    data: {
      invoices: result.data.data,
    },
  }
}

/**
 * キャッシュ残高追加
 * POST /v1/test_helpers/customers/{customerId}/fund_cash_balance
 * 書き込み操作のため、コンテントスクリプト経由で実行する
 */
async function handleAddCashBalance(
  customerId: string,
  amount: number
): Promise<ResponseMessage<AddCashBalanceData>> {
  const result = await proxyRequest<{ amount: number; currency: string }>(
    'POST',
    `/v1/test_helpers/customers/${customerId}/fund_cash_balance`,
    {
      amount: amount.toString(),
      currency: 'jpy',
    }
  )

  if (!result.ok) {
    return result
  }

  return {
    ok: true,
    data: {
      customerId,
      amount: result.data.amount,
      currency: result.data.currency,
    },
  }
}

console.log('🚀 Stripe Chrome Extension - Service Worker started')
