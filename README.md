# Stripe Test Helper

QA・開発チーム向けの Stripe テスト環境操作 Chrome 拡張機能。
サブスクリプションのキャンセルや現金残高の追加をポップアップからワンクリックで実行できます。

## 機能

- **顧客検索** — `team_id` で Stripe 顧客を検索（`rails_env: staging` 固定）
- **サブスクリプションキャンセル** — サブスクの即時キャンセル
- **現金残高追加** — Invoice の金額または手動入力で残高をチャージ

## 前提条件

- Stripe テスト用 API キー（`sk_test_...`）
- 操作時に **stg.form.run のタブを開いている**こと（Cloudflare 回避のため）

---

## インストール（biz メンバー向け）

### CRX ファイルからインストール

> CRX ファイルの入手先: [Google Drive](https://drive.google.com/file/d/1UZN-CxYuaMat_W47gGXOkkjhgIei5ONX/view?usp=drive_link)

1. Chrome で `chrome://extensions/` を開く
2. 右上の **デベロッパーモード** をオンにする
3. ダウンロードした `.crx` ファイルをページにドラッグ&ドロップする
4. 確認ダイアログで **「拡張機能を追加」** をクリック

> **注意:** デベロッパーモードを有効にすると、Chrome 起動時に警告ダイアログが表示されることがあります。「キャンセル」を押せば拡張機能はそのまま使い続けられます。

---

## 開発

### セットアップ

```bash
git clone https://github.com/Dev-kenta/stripe-chrome-ex.git
cd stripe-chrome-ex
npm install
```

### ビルド

```bash
npm run build
```

`dist/` フォルダにビルド成果物が生成されます。

### ウォッチモード（開発時）

```bash
npm run watch
```

ファイルを保存するたびに自動でリビルドされます。

### Chrome への読み込み

1. `npm run build` を実行
2. Chrome で `chrome://extensions/` を開く
3. 右上の **デベロッパーモード** をオンにする
4. **「パッケージ化されていない拡張機能を読み込む」** をクリック
5. `dist/` フォルダを選択

コードを変更した場合は `npm run build` 後、拡張機能ページの更新ボタン（↺）を押して再読み込みしてください。

### CRX ファイルの作成

1. `npm run build` を実行
2. Chrome で `chrome://extensions/` を開く
3. **「拡張機能をパッケージ化」** をクリック
4. 「拡張機能のルートディレクトリ」に `dist/` フォルダを指定
5. 初回は「秘密鍵ファイル」を空欄のまま実行（`.pem` が自動生成される）
6. 次回以降の更新時は生成された `.pem` を指定して再パッケージ化

> **注意:** `.pem` ファイルは厳重に管理してください。紛失すると同じ拡張機能 ID で更新できなくなります。

### ファイル構成

```
src/
├── manifest.json               # 拡張機能の設定
├── types/
│   ├── messages.ts             # Popup ↔ Service Worker メッセージ型
│   └── stripe.ts               # Stripe API レスポンス型
├── crypto/
│   └── aes-gcm.ts              # AES-GCM 暗号化ユーティリティ
├── storage/
│   └── api-key-store.ts        # API キーの暗号化保存
├── background/
│   └── service-worker.ts       # Stripe API 通信・暗号化の中核
├── content/
│   └── stripe-proxy.ts         # stg.form.run に挿入するコンテントスクリプト
└── popup/
    ├── index.html
    ├── popup.ts                 # 画面遷移管理
    ├── screens/                 # 各画面の実装
    └── components/              # 共通コンポーネント
```

### 画面構成

```
S01 APIキー設定
S02 顧客検索
S03 操作メニュー
├── S04 サブスクリプション一覧
│   └── S05 キャンセル確認
└── S06 Invoice一覧 / 金額入力
    └── S07 残高追加確認
```

### セキュリティ

- `sk_live_` キーは入力時にブロック（テスト用のみ許可）
- API キーは AES-GCM 256bit で暗号化して `chrome.storage.local` に保存
- Stripe API への fetch は Service Worker のみが実行（Popup から直接通信しない）
- 書き込み操作（DELETE / POST）は stg.form.run のコンテントスクリプト経由で実行