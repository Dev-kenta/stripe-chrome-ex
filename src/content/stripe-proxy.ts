/// <reference types="chrome" />

// Content Script: Stripe API プロキシ
// stg.form.run ページに挿入され、SW からの依頼を受けて Stripe API へ fetch する。
// ページの Origin (https://stg.form.run) で fetch するため Cloudflare のブロックを回避できる。

const STRIPE_API_BASE = 'https://api.stripe.com'

interface ProxyRequest {
  action: 'STRIPE_PROXY'
  method: 'DELETE' | 'POST'
  path: string
  params?: Record<string, string>
  apiKey: string
}

interface ProxyResponse {
  ok: boolean
  data?: unknown
  error?: string
  code?: string
}

chrome.runtime.onMessage.addListener(
  (message: ProxyRequest, _sender, sendResponse) => {
    if (message.action !== 'STRIPE_PROXY') return false

    handleProxyRequest(message)
      .then(sendResponse)
      .catch((err) => {
        sendResponse({
          ok: false,
          error: err instanceof Error ? err.message : 'プロキシリクエストに失敗しました',
        })
      })

    return true // 非同期応答のため必須
  }
)

async function handleProxyRequest(req: ProxyRequest): Promise<ProxyResponse> {
  const url = `${STRIPE_API_BASE}${req.path}`
  const headers: Record<string, string> = {
    Authorization: `Bearer ${req.apiKey}`,
    'Stripe-Version': '2020-08-27',
  }

  let body: string | undefined
  if (req.params) {
    const bodyStr = new URLSearchParams(req.params).toString()
    if (bodyStr) {
      body = bodyStr
      headers['Content-Type'] = 'application/x-www-form-urlencoded'
    }
  }

  const response = await fetch(url, { method: req.method, headers, body })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: { message: `HTTP ${response.status}`, code: undefined } }))

    if (response.status === 401 || response.status === 403) {
      return { ok: false, error: 'APIキーが無効です。再設定してください。', code: 'API_KEY_INVALID' }
    }
    if (response.status === 429) {
      return { ok: false, error: 'リクエストが多すぎます。少し待ってから再試行してください。', code: 'RATE_LIMIT' }
    }

    return {
      ok: false,
      error: errorData?.error?.message ?? `HTTP ${response.status}`,
      code: errorData?.error?.code,
    }
  }

  const data = await response.json()
  return { ok: true, data }
}