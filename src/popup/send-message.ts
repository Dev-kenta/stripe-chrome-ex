/// <reference types="chrome" />

import type { RequestMessage, ResponseMessage } from '../types/messages'

/**
 * Service Worker にメッセージを送信する
 */
export async function sendMessage<T = unknown>(message: RequestMessage): Promise<ResponseMessage<T>> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response: ResponseMessage<T>) => {
      if (chrome.runtime.lastError) {
        resolve({
          ok: false,
          error: chrome.runtime.lastError.message || 'メッセージ送信に失敗しました',
        })
        return
      }
      resolve(response)
    })
  })
}