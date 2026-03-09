// ローディングスピナーコンポーネント

/**
 * ローディングスピナーを表示するHTMLElementを生成
 */
export function createLoadingSpinner(message: string = '読み込み中...'): HTMLElement {
  const container = document.createElement('div')
  container.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    padding: 40px;
    text-align: center;
  `

  // スピナー要素
  const spinner = document.createElement('div')
  spinner.style.cssText = `
    width: 40px;
    height: 40px;
    border: 4px solid #e0e0e0;
    border-top-color: #635bff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-bottom: 16px;
  `

  // アニメーションスタイルを追加（初回のみ）
  if (!document.getElementById('spinner-animation-style')) {
    const style = document.createElement('style')
    style.id = 'spinner-animation-style'
    style.textContent = `
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `
    document.head.appendChild(style)
  }

  // メッセージテキスト
  const text = document.createElement('p')
  text.textContent = message
  text.style.cssText = `
    font-size: 14px;
    color: #6b7280;
  `

  container.appendChild(spinner)
  container.appendChild(text)

  return container
}
