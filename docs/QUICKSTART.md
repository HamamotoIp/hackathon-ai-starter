# 🚀 AI Chat Starter Kit - クイックスタートガイド

**30秒で始める** - ハッカソン特化のAIチャットシステム

## ⚡ 30秒スタート

```bash
git clone https://github.com/HamamotoIp/hackathon-ai-starter.git
cd hackathon-ai-starter/packages/frontend
npm install && npm run dev
```

→ **http://localhost:3000** でスタート！

## 🎯 推奨開発フロー

### 1. フロントエンド開発（Vertex AI使用）
```bash
cd packages/frontend
npm run dev        # 開発サーバー起動
npm run lint       # コード品質チェック
npm run build      # ビルド確認
```

**利用可能な機能ページ**:

### 💬 シンプルチャット (`/simple-chat`)
- **用途**: 高速な質問回答、翻訳、要約
- **特徴**: Vertex AI Direct、3秒以内のレスポンス
- **API**: `/api/chat`

### 📊 AI機能統合 (`/ai-features`)  
- **用途**: データ分析、詳細レポート生成
- **特徴**: ADK Analysis Agent、構造化された分析出力
- **API**: `/api/analysis`

### 🎨 UI生成ツール (`/ui-builder`)
- **用途**: HTML/CSSコンポーネント、フォーム生成
- **特徴**: ADK UI Generation Agent、デバイス最適化対応
- **API**: `/api/ui-generation`

### 📁 コンテンツ管理 (`/content-management`)
- **用途**: テキストコンテンツの作成・編集・管理
- **特徴**: ローカルストレージ、リアルタイム編集・プレビュー

### 2. AI機能テスト方法
各ページで直接機能を確認：
- **チャット**: "こんにちは、今日の天気は？"
- **分析レポート**: "2024年の売上データを分析してトレンドを教えて"
- **UI生成**: "レストランの予約フォームを作成してください"

## 🔧 本格運用セットアップ

### 1. Google Cloud認証（必須）
```bash
# 1. Google Cloud SDK インストール
# 公式サイト: https://cloud.google.com/sdk/docs/install

# 2. GCPにログイン
gcloud auth login

# 3. アプリケーションデフォルト認証（重要！）
gcloud auth application-default login

# 4. プロジェクトID設定
gcloud config set project YOUR_PROJECT_ID
```

### 2. 環境変数設定
```bash
# packages/frontend/.env.local
VERTEX_AI_PROJECT_ID=your-gcp-project-id
VERTEX_AI_LOCATION=us-central1
```

### 3. ワンコマンドデプロイ（本番運用）
```bash
# 設定ファイル作成
cp config.example.sh config.sh
# config.sh でPROJECT_IDを設定

# 統合デプロイ実行
./setup.sh

# 完了！デプロイ状況確認
./debug.sh
```

## 🏗️ 段階的セットアップ

### ローカル開発のみ
- 設定: 最小限（.env.local のみ）
- 機能: 基本チャット、UI生成（限定）
- コスト: $0

### AI機能フル活用
- 設定: GCP認証 + プロジェクトID
- 機能: 全機能（分析レポート、UI生成、画像管理）
- コスト: $0-3/月

### 本番運用
- 設定: config.sh + ./setup.sh
- 機能: 全機能 + 本番インフラ
- コスト: $3-15/月

## 📊 機能別設定要件

| 機能 | ローカル開発 | GCP認証 | デプロイ |
|------|-------------|---------|----------|
| **基本チャット** | ✅ | ✅ | ✅ |
| **分析レポート** | ❌ | ✅ | ✅ |
| **UI生成** | ❌ | ✅ | ✅ |
| **画像管理** | ❌ | ❌ | ✅ |

## 🔧 設定ファイル（config.sh）

```bash
# 必須設定
PROJECT_ID="your-gcp-project-id"        # GCPプロジェクトID
REGION="us-central1"                    # デプロイリージョン
ENVIRONMENT="dev"                       # 環境名（dev/staging/prod）

# コスト最適化設定
MEMORY="512Mi"                          # メモリ設定
MAX_INSTANCES="1"                       # 最大インスタンス数
MIN_INSTANCES="0"                       # 最小インスタンス数（アイドル時無料）
LIFECYCLE_DAYS="30"                     # 画像自動削除日数
```

## 🚨 よくある問題と解決

### 認証エラー
```bash
# 解決方法
gcloud auth login
gcloud auth application-default login  # 重要！これを忘れがち
gcloud config set project YOUR-PROJECT-ID
```

### AI機能が動かない
```bash
# Vertex AI権限確認
gcloud services enable aiplatform.googleapis.com
```

### デプロイエラー
```bash
# 権限確認
gcloud projects get-iam-policy YOUR-PROJECT-ID
```

## 💰 コスト効率設定

### 開発環境（最小コスト）
```bash
MIN_INSTANCES="0"       # アイドル時無料
MAX_INSTANCES="1"       # 暴走防止
MEMORY="512Mi"          # 最小メモリ
```

### 本番環境（バランス）
```bash
MIN_INSTANCES="1"       # 高速レスポンス
MAX_INSTANCES="3"       # 適度なスケール
MEMORY="1Gi"           # 安定性とコストのバランス
```

## 📚 次のステップ

- **[開発ガイド](./DEVELOPMENT.md)** - カスタマイズ・拡張方法
- **[API仕様](./API.md)** - 詳細実装・統合方法
- **[上級者ガイド](./ADVANCED.md)** - 本格運用・最適化

---

**🎯 ミッション**: ハッカソン・プロトタイピングでAI活用を加速し、アイデアの具現化を30秒で可能にする。