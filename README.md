# 出張買取 AI査定・古物台帳記録システム

## セットアップ手順（初めての方向け）

### 必要なもの
- パソコン（Windows / Mac どちらでもOK）
- GitHubアカウント（無料）
- Vercelアカウント（無料）
- Anthropic APIキー（従量課金）

---

## ステップ1: Anthropic APIキーを取得する

1. https://console.anthropic.com/ にアクセス
2. アカウントを作成（またはログイン）
3. 左メニューの「API Keys」をクリック
4. 「Create Key」でキーを作成
5. 表示されたキー（`sk-ant-...`で始まる文字列）をコピーして安全な場所に保存
6. 「Billing」から支払い方法を設定（使った分だけ課金されます）

※ 1回の査定で約2〜5円程度です

---

## ステップ2: GitHubにアップロードする

1. https://github.com/ にアクセスしてアカウント作成（またはログイン）
2. 右上の「+」→「New repository」をクリック
3. Repository name に `kaitori-app` と入力
4. 「Private」を選択（公開したくない場合）
5. 「Create repository」をクリック

### ファイルをアップロード
6. 作成したリポジトリのページで「uploading an existing file」をクリック
7. ダウンロードしたZIPを解凍し、中のファイル・フォルダをすべてドラッグ&ドロップ
8. 「Commit changes」をクリック

---

## ステップ3: Vercelにデプロイする

1. https://vercel.com/ にアクセス
2. 「Sign Up」→「Continue with GitHub」でGitHubアカウントと連携
3. ダッシュボードで「Add New...」→「Project」をクリック
4. GitHubリポジトリ一覧から `kaitori-app` を選択して「Import」
5. **Environment Variables** のセクションで以下を追加:
   - Name: `ANTHROPIC_API_KEY`
   - Value: ステップ1でコピーしたAPIキー
6. 「Deploy」をクリック
7. 2〜3分待つとデプロイ完了。表示されるURL（`https://kaitori-app-xxx.vercel.app`）がアプリのアドレスです

---

## ステップ4: iPhoneで使う

1. Safariでデプロイ完了時に表示されたURLを開く
2. 画面下の共有ボタン（□↑）をタップ
3. 「ホーム画面に追加」を選択
4. これでアプリのようにホーム画面から直接開けます

---

## ログイン情報（初期設定）

| 役割 | PIN |
|------|-----|
| 管理者 | 9999 |
| スタッフ | 1234 |

⚠️ 本番運用時は `app/page.js` 内の `ADMIN_PIN` と `STAFF_PIN` の値を変更してください。

---

## PINを変更する方法

1. GitHubで `app/page.js` を開く
2. 鉛筆アイコンで編集モードに入る
3. `const ADMIN_PIN = "9999"` と `const STAFF_PIN = "1234"` を探す
4. 好きな数字に変更して「Commit changes」
5. Vercelが自動で再デプロイしてくれます

---

## ファイル構成

```
kaitori-app/
├── app/
│   ├── api/
│   │   └── appraise/
│   │       └── route.js    ← AI査定のサーバー処理（APIキーはここで安全に使用）
│   ├── layout.js            ← HTMLの基本設定
│   └── page.js              ← アプリ本体
├── .env.example             ← 環境変数のサンプル
├── next.config.js
├── package.json
└── README.md                ← このファイル
```

---

## 料金の目安

- **Vercel**: 無料プラン（月間のアクセスに制限あり。小〜中規模なら十分）
- **Anthropic API**: 1回の査定あたり約2〜5円（ウェブ検索利用時はやや増加）
- **GitHub**: 無料

---

## トラブルシューティング

**査定ボタンを押してもエラーになる**
→ Vercelの環境変数に `ANTHROPIC_API_KEY` が正しく設定されているか確認

**画面が真っ白になる**
→ ブラウザのキャッシュをクリアして再読み込み

**PINでログインできない**
→ page.js 内の PIN 値を確認
