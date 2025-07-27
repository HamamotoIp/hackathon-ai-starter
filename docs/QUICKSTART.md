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

### 2. AI Agentsローカル開発（ADK使用）
```bash
cd packages/ai-agents
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# ADK Web UIでエージェント開発
adk web analysis_agent         # 分析エージェント
adk web ui_generation_agent    # UI生成エージェント
adk web restaurant_search_agent # レストラン検索エージェント
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

### 🍽️ レストラン検索 (`/restaurant-search`)
- **用途**: レストラン推薦、HTML特集記事生成
- **特徴**: ADK Restaurant Search Agent、美しい特集記事フォーマット
- **API**: `/api/restaurant-search`

### 📁 コンテンツ管理 (`/content-management`)
- **用途**: テキストコンテンツの作成・編集・管理
- **特徴**: ローカルストレージ、リアルタイム編集・プレビュー

### 3. AI機能テスト方法
各ページで直接機能を確認：
- **チャット**: "こんにちは、今日の天気は？"
- **分析レポート**: "2024年の売上データを分析してトレンドを教えて"
- **UI生成**: "レストランの予約フォームを作成してください"
- **レストラン検索**: "新宿でランチができるおしゃれなカフェを教えて"

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

### 2. 設定ファイル作成
```bash
# config.sh設定（本番運用用）
cp config.example.sh config.sh
# config.shを編集してPROJECT_IDを設定

# または、開発のみの場合
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
| **レストラン検索** | ❌ | ✅ | ✅ |
| **画像管理** | ❌ | ❌ | ✅ |

## 🔧 設定ファイル（config.sh）

既存のconfig.shには以下が設定済み：
```bash
# 必須設定（既に設定済み）
PROJECT_ID="food-hack-466801"           # 現在のGCPプロジェクトID
REGION="us-central1"                    # デプロイリージョン
ENVIRONMENT="dev"                       # 環境名

# コスト最適化設定（既設定）
MEMORY="512Mi"                          # メモリ設定
MAX_INSTANCES="1"                       # 最大インスタンス数
MIN_INSTANCES="0"                       # 最小インスタンス数（アイドル時無料）
LIFECYCLE_DAYS="30"                     # 画像自動削除日数
```

必要に応じてPROJECT_IDを変更してください。

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