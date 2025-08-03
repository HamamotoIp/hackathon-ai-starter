# 🔧 環境変数リファレンス

AI Chat Starter Kitで使用される全ての環境変数の詳細ガイド

## 📋 必須環境変数

### 基本設定（config.sh）

```bash
# GCPプロジェクト設定
PROJECT_ID="your-gcp-project-id"          # 必須：GCPプロジェクトID
REGION="us-central1"                      # 必須：デプロイリージョン
ENVIRONMENT="dev"                         # 必須：環境名（dev/staging/prod）

# サービスアカウント（自動生成）
SERVICE_ACCOUNT="ai-chat-dev"             # 自動設定
SERVICE_ACCOUNT_EMAIL="ai-chat-dev@PROJECT_ID.iam.gserviceaccount.com"
```

### Agent Engine URLs（デプロイ後自動設定）

```bash
# Agent Engine エンドポイント（並列デプロイで自動取得）
ANALYSIS_AGENT_URL="https://us-central1-aiplatform.googleapis.com/v1/projects/.../reasoningEngines/.../streamQuery?alt=sse"
UI_GENERATION_AGENT_URL="https://us-central1-aiplatform.googleapis.com/v1/projects/.../reasoningEngines/.../streamQuery?alt=sse"
RESTAURANT_SEARCH_AGENT_URL="https://us-central1-aiplatform.googleapis.com/v1/projects/.../reasoningEngines/.../streamQuery?alt=sse"
```

### ストレージ設定

```bash
# 画像保存用バケット（自動作成）
BUCKET_NAME="PROJECT_ID-images"
RESTAURANT_BUCKET_NAME="PROJECT_ID-restaurant-results"

# ライフサイクル管理
LIFECYCLE_DAYS="30"                       # 画像自動削除日数
```

## ⚙️ パフォーマンス設定

### Cloud Run設定

```bash
# メモリとCPU
MEMORY="512Mi"                            # メモリ（512Mi/1Gi/2Gi/4Gi）
CPU="1"                                   # CPU（1/2/4/8）

# スケーリング
MIN_INSTANCES="0"                         # 最小インスタンス（0=アイドル時無料）
MAX_INSTANCES="1"                         # 最大インスタンス（コスト制御）

# 並列デプロイ設定
PARALLEL_TIMEOUT="900"                    # 並列デプロイタイムアウト（秒）
DEBUG="1"                                 # デバッグモード（ログ保持）
```

## 🔐 認証設定

### Vertex AI認証

```bash
# Vertex AI設定（Python Agent Engine用）
VERTEX_AI_PROJECT_ID="$PROJECT_ID"       # Vertex AIプロジェクト
VERTEX_AI_LOCATION="$REGION"              # Vertex AIロケーション
```

### Google Search API（オプション）

```bash
# Google Custom Search（レストラン検索用）
GOOGLE_API_KEY="your-api-key"             # オプション：Google API Key
GOOGLE_CUSTOM_SEARCH_ENGINE_ID="your-cse-id"  # オプション：カスタム検索エンジンID
```

## 🌍 環境別設定例

### 開発環境（dev）

```bash
# コスト最適化重視
ENVIRONMENT="dev"
MIN_INSTANCES="0"                         # アイドル時無料
MAX_INSTANCES="1"                         # 暴走防止
MEMORY="512Mi"                            # 最小メモリ
CPU="1"                                   # 最小CPU
LIFECYCLE_DAYS="7"                        # 短期保存
```

### ステージング環境（staging）

```bash
# 本番相当テスト
ENVIRONMENT="staging"  
MIN_INSTANCES="0"                         # コスト抑制
MAX_INSTANCES="3"                         # 負荷テスト対応
MEMORY="1Gi"                              # 安定性確保
CPU="2"                                   # パフォーマンス重視
LIFECYCLE_DAYS="14"                       # 中期保存
```

### 本番環境（prod）

```bash
# 高可用性・高性能
ENVIRONMENT="prod"
MIN_INSTANCES="1"                         # 常時起動
MAX_INSTANCES="10"                        # 高負荷対応
MEMORY="2Gi"                              # 大容量メモリ
CPU="4"                                   # 高性能CPU
LIFECYCLE_DAYS="90"                       # 長期保存
```

## 🔍 環境変数の確認方法

### Cloud Runサービスの環境変数確認

```bash
# フロントエンドサービスの環境変数一覧
gcloud run services describe ai-chat-frontend-dev \
  --region us-central1 \
  --format="value(spec.template.spec.containers[0].env[].name,spec.template.spec.containers[0].env[].value)"

# 特定の環境変数値確認
gcloud run services describe ai-chat-frontend-dev \
  --region us-central1 \
  --format="value(spec.template.spec.containers[0].env[?(@.name=='ANALYSIS_AGENT_URL')].value)"
```

### Agent Engine URL確認

```bash
# デプロイ済みAgent Engine URLファイル確認
cat packages/ai-agents/analysis_agent_url.txt
cat packages/ai-agents/ui_generation_agent_url.txt  
cat packages/ai-agents/restaurant_search_agent_url.txt
```

### config.sh設定確認

```bash
# 現在の設定内容表示
source config.sh && env | grep -E "(PROJECT_ID|REGION|ENVIRONMENT)"
```

## ⚠️ 環境変数設定のトラブルシューティング

### よくある問題

**1. Agent Engine URLが設定されない**
```bash
# 原因：並列デプロイが途中で失敗
# 解決：個別URLファイルを確認
ls -la packages/ai-agents/*_url.txt

# 手動設定（緊急時）
gcloud run services update ai-chat-frontend-dev \
  --region us-central1 \
  --update-env-vars "ANALYSIS_AGENT_URL=https://..."
```

**2. メモリ不足エラー**
```bash
# 原因：MEMORYが不足
# 解決：メモリ増量
MEMORY="1Gi" ./deploy-frontend.sh
```

**3. 環境変数タイムアウト**
```bash
# 原因：環境変数更新の分割処理タイムアウト
# 解決：個別に設定
gcloud run services update ai-chat-frontend-dev \
  --region us-central1 \
  --update-env-vars "BUCKET_NAME=PROJECT_ID-images"
```

## 📝 設定ファイルテンプレート

### .env.local（ローカル開発用）

```bash
# ローカル開発環境用（packages/frontend/.env.local）
NODE_ENV=development
VERTEX_AI_PROJECT_ID=your-gcp-project-id
VERTEX_AI_LOCATION=us-central1

# Agent Engine URLs（ローカル開発では空でも可）
ANALYSIS_AGENT_URL=
UI_GENERATION_AGENT_URL=
RESTAURANT_SEARCH_AGENT_URL=

# ストレージ（ローカル開発では無効化可能）
BUCKET_NAME=your-project-images
RESTAURANT_BUCKET_NAME=your-project-restaurant-results
```

### config.sh（本番用）

```bash
#!/bin/bash
# AI Chat Starter Kit Configuration

# === 必須設定 ===
PROJECT_ID="your-actual-project-id"       # 実際のプロジェクトIDに変更
REGION="us-central1"                      # リージョン選択
ENVIRONMENT="prod"                        # dev/staging/prod

# === パフォーマンス設定 ===
MEMORY="1Gi"                              # 本番推奨
CPU="2"                                   # 本番推奨
MIN_INSTANCES="1"                         # 本番推奨（常時起動）
MAX_INSTANCES="5"                         # 負荷対応

# === コスト管理 ===
LIFECYCLE_DAYS="30"                       # 画像保持期間

# === 並列デプロイ設定 ===
PARALLEL_TIMEOUT="900"                    # 15分タイムアウト
```

## 🔗 関連ドキュメント

- [デプロイメント](./04-deployment.md) - デプロイプロセス詳細
- [トラブルシューティング](./08-troubleshooting.md) - 問題解決
- [アーキテクチャ](./02-architecture.md) - システム構成