// エラーメッセージコンポーネント

/**
 * エラーメッセージを表示するHTMLElementを生成
 */
export function createErrorMessage(
  message: string,
  onRetry?: () => void,
  retryButtonText: string = '再試行'
): HTMLElement {
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

  // エラーアイコン
  const icon = document.createElement('div')
  icon.textContent = '⚠️'
  icon.style.cssText = `
    font-size: 48px;
    margin-bottom: 16px;
  `

  // エラーメッセージテキスト
  const text = document.createElement('p')
  text.textContent = message
  text.style.cssText = `
    font-size: 14px;
    color: #dc2626;
    margin-bottom: 24px;
    line-height: 1.5;
    white-space: pre-wrap;
  `

  container.appendChild(icon)
  container.appendChild(text)

  // リトライボタン（オプション）
  if (onRetry) {
    const button = document.createElement('button')
    button.textContent = retryButtonText
    button.style.cssText = `
      padding: 10px 20px;
      background-color: #635bff;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
    `
    button.addEventListener('mouseenter', () => {
      button.style.backgroundColor = '#4f46e5'
    })
    button.addEventListener('mouseleave', () => {
      button.style.backgroundColor = '#635bff'
    })
    button.addEventListener('click', onRetry)

    container.appendChild(button)
  }

  return container
}
