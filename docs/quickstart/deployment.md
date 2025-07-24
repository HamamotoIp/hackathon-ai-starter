# 🚀 デプロイメントガイド

## 概要

AI Chat Starter Kit の包括的なデプロイメントガイドです。ローカル開発から本番運用まで、段階的にセットアップできます。

## 📋 前提条件

### 必要なツール
- **Node.js**: 18.17+ (推奨: 20.x)
- **Python**: 3.8+ (推奨: 3.10+)
- **Google Cloud CLI**: 最新版
- **Git**: 2.x+

### Google Cloud Platform
- GCP プロジェクト（Billing有効）
- 以下のAPIが有効化されていること：
  - Vertex AI API
  - Cloud Run API
  - Cloud Storage API
  - Cloud Build API

## 🏃‍♂️ クイックデプロイ（推奨）

### 1分デプロイ（最速）

```bash
# 1. リポジトリクローン
git clone https://github.com/HamamotoIp/hackathon-ai-starter.git
cd hackathon-ai-starter

# 2. 設定ファイル作成
cp config.example.sh config.sh

# 3. プロジェクトID設定
vim config.sh  # PROJECT_ID="your-gcp-project-id" を設定

# 4. 統合デプロイ実行
./setup.sh

# 完了！デプロイ状況確認
./debug.sh
```

### 設定ファイル詳細（config.sh）

```bash
# 必須設定
PROJECT_ID="your-gcp-project-id"        # GCPプロジェクトID
REGION="us-central1"                    # デプロイリージョン
ENVIRONMENT="dev"                       # 環境名（dev/staging/prod）

# Cloud Run設定（コスト最適化）
MEMORY="512Mi"                          # メモリ（512Mi/1Gi/2Gi）
CPU="1"                                # CPU（1/2/4）
MAX_INSTANCES="1"                      # 最大インスタンス数（コスト制御）
MIN_INSTANCES="0"                      # 最小インスタンス数（アイドル時無料）
CONCURRENCY="1000"                     # 同時実行数

# ストレージ設定
LIFECYCLE_DAYS="30"                    # 画像自動削除日数
STORAGE_CLASS="STANDARD"               # ストレージクラス

# 詳細設定（通常は変更不要）
SERVICE_ACCOUNT_NAME="ai-chat-dev"
FRONTEND_SERVICE_NAME="ai-chat-frontend-${ENVIRONMENT}"
AGENT_SERVICE_NAME="ai-chat-agent-engine-${ENVIRONMENT}"
BUCKET_NAME="${PROJECT_ID}-images"
```

## 🛠️ 段階的デプロイメント

### Step 1: ローカル開発環境

#### フロントエンド起動
```bash
cd packages/frontend

# 依存関係インストール
npm install

# 環境変数設定（任意）
cat > .env.local << EOF
VERTEX_AI_PROJECT_ID=your-project-id
VERTEX_AI_LOCATION=us-central1
ADK_SERVICE_URL=http://localhost:8080
BUCKET_NAME=your-bucket-name
EOF

# 開発サーバー起動
npm run dev
# → http://localhost:3000
```

#### AI エンジン起動
```bash
cd packages/ai-agents

# Python仮想環境セットアップ
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# AIエンジン起動
python app.py
# → http://localhost:8080
```

#### 動作確認
```bash
# フロントエンド確認
curl http://localhost:3000/api/debug

# AIエンジン確認
curl http://localhost:8080/health

# 統合テスト
curl -X POST http://localhost:3000/api/analysis \
  -H "Content-Type: application/json" \
  -d '{"content": "テスト分析"}'
```

### Step 2: Google Cloud 認証・設定

```bash
# 1. Google Cloud SDK インストール（未インストールの場合）
# 公式サイト: https://cloud.google.com/sdk/docs/install

# 2. Google Cloud CLI認証
gcloud auth login

# 3. アプリケーションデフォルト認証（重要！）
gcloud auth application-default login

# 4. プロジェクト設定
gcloud config set project YOUR-PROJECT-ID

# 5. 必要なAPI有効化（setup.shで自動実行）
gcloud services enable aiplatform.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

> **重要**: `gcloud auth application-default login` は必須です。これがないとVertex AI APIアクセスでエラーが発生します。

### Step 3: Agent Engine デプロイ

```bash
# Agent Engine のみデプロイ
./deploy-agent.sh

# または個別コマンド実行
cd packages/ai-agents
source venv/bin/activate
python deploy.py
```

### Step 4: フロントエンド デプロイ

```bash
# フロントエンドのみデプロイ
./deploy-frontend.sh

# Cloud Run 手動デプロイ（代替方法）
cd packages/frontend
gcloud run deploy ai-chat-frontend-dev \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars VERTEX_AI_PROJECT_ID=your-project-id
```

### Step 5: 本番運用設定

```bash
# カスタムドメイン設定
gcloud run domain-mappings create \
  --service ai-chat-frontend-dev \
  --domain your-domain.com \
  --region us-central1

# SSL証明書自動設定
gcloud compute ssl-certificates create ai-chat-ssl \
  --domains your-domain.com

# Cloud Armor設定（DDoS防護）
gcloud compute security-policies create ai-chat-security-policy
```

## 🌍 環境別デプロイメント

### 開発環境（Development）

```bash
# config.sh設定
ENVIRONMENT="dev"
MAX_INSTANCES="1"       # コスト制御
MIN_INSTANCES="0"       # アイドル時無料
MEMORY="512Mi"          # 最小構成

# デプロイ
./setup.sh
```

### ステージング環境（Staging）

```bash
# config.sh設定
ENVIRONMENT="staging"
MAX_INSTANCES="2"       # 負荷テスト対応
MIN_INSTANCES="0"       # コスト効率
MEMORY="1Gi"           # 性能向上

# デプロイ
./setup.sh
```

### 本番環境（Production）

```bash
# config.sh設定
ENVIRONMENT="prod"
MAX_INSTANCES="5"       # 高可用性
MIN_INSTANCES="1"       # 常時起動
MEMORY="1Gi"           # 安定性重視
CPU="2"                # 高性能

# 本番デプロイ
./setup.sh

# 監視設定
gcloud monitoring policies create --policy-from-file monitoring-policy.yaml
```

## 🔧 高度な設定

### マルチリージョンデプロイ

```bash
# アジア太平洋リージョン
REGION="asia-northeast1" ./setup.sh

# ヨーロッパリージョン
REGION="europe-west1" ./setup.sh

# ロードバランサー設定
gcloud compute url-maps create ai-chat-lb \
  --default-service=ai-chat-backend
```

### カスタムドメイン・SSL

```bash
# DNS設定
gcloud dns record-sets transaction start --zone=your-zone
gcloud dns record-sets transaction add \
  --name="api.your-domain.com" \
  --ttl=300 \
  --type=CNAME \
  --zone=your-zone \
  "ghs.googlehosted.com."
gcloud dns record-sets transaction execute --zone=your-zone

# SSL証明書設定
gcloud beta run domain-mappings create \
  --service ai-chat-frontend-prod \
  --domain api.your-domain.com \
  --region us-central1
```

### 監視・アラート設定

```bash
# Cloud Monitoring設定
gcloud monitoring policies create \
  --policy-from-file=monitoring/error-rate-policy.yaml

# Slack通知設定
gcloud monitoring notification-channels create \
  --display-name="Slack Alerts" \
  --type=slack \
  --channel-labels=url=https://hooks.slack.com/your-webhook
```

## 📊 パフォーマンス最適化

### Cloud Run 最適化

```bash
# 高性能設定
MEMORY="2Gi"
CPU="4" 
MAX_INSTANCES="10"
CONCURRENCY="2000"

# 起動時間最適化
MIN_INSTANCES="1"     # コールドスタート回避
```

### CDN設定

```bash
# Cloud CDN有効化
gcloud compute backend-buckets create ai-chat-static \
  --gcs-bucket-name=${PROJECT_ID}-static

# キャッシュ設定
gcloud compute url-maps add-path-matcher ai-chat-lb \
  --path-matcher-name=static-matcher \
  --path-rules="/static/*=ai-chat-static"
```

## 🔍 デプロイメント後確認

### 自動テスト実行

```bash
# 包括的動作確認
./debug.sh

# 高速動作確認
./quick-test.sh

# 個別確認
curl https://your-app.run.app/api/debug | jq .
```

### 手動テスト項目

#### ✅ 基本機能確認
- [ ] ランディングページ表示
- [ ] AI機能選択ページ動作
- [ ] 基本チャット動作
- [ ] 分析レポート生成
- [ ] 比較研究実行
- [ ] 画像アップロード

#### ✅ パフォーマンス確認
- [ ] ページロード時間 < 3秒
- [ ] AI応答時間（基本: <10秒、分析: <60秒）
- [ ] 同時接続テスト
- [ ] モバイル表示確認

#### ✅ セキュリティ確認
- [ ] HTTPS強制リダイレクト
- [ ] CORS設定確認
- [ ] 環境変数保護確認
- [ ] ファイルアップロード制限

## 🚨 トラブルシューティング

### よくある問題と解決策

#### デプロイエラー

**権限不足エラー:**
```bash
# 解決方法
gcloud auth login
gcloud auth application-default login  # 重要！これを忘れがち
gcloud config set project YOUR-PROJECT-ID

# サービスアカウント権限確認
gcloud projects get-iam-policy YOUR-PROJECT-ID
```

**Cloud Build エラー:**
```bash
# ログ確認
gcloud builds list --limit=5
gcloud builds log [BUILD-ID]

# 手動ビルド・デプロイ
cd packages/frontend
docker build -t gcr.io/PROJECT-ID/ai-chat-frontend .
docker push gcr.io/PROJECT-ID/ai-chat-frontend
gcloud run deploy --image gcr.io/PROJECT-ID/ai-chat-frontend
```

#### 実行時エラー

**AI サービス接続エラー:**
```bash
# Vertex AI権限確認
gcloud auth list
gcloud services list --enabled | grep aiplatform

# Agent Engine状態確認
gcloud run services describe ai-chat-agent-engine-dev --region us-central1
```

**環境変数エラー:**
```bash
# Cloud Run環境変数確認
gcloud run services describe ai-chat-frontend-dev \
  --region us-central1 \
  --format="value(spec.template.spec.template.spec.containers[0].env[].name)"

# 環境変数更新
gcloud run services update ai-chat-frontend-dev \
  --region us-central1 \
  --set-env-vars VERTEX_AI_PROJECT_ID=your-project-id
```

### ログ確認方法

```bash
# Cloud Run ログ（リアルタイム）
gcloud run services logs tail ai-chat-frontend-dev --region us-central1

# Cloud Run ログ（過去ログ）
gcloud run services logs read ai-chat-frontend-dev --region us-central1 --limit=50

# Cloud Build ログ
gcloud builds list --limit=10
gcloud builds log [BUILD-ID]
```

## 💰 コスト最適化

### 推定月額コスト

```
🔹 開発環境：$0-2 USD
  • Cloud Run（アイドル多）：$0-1
  • Vertex AI（軽使用）：$0-1
  • Cloud Storage：$0

🔹 ステージング環境：$2-5 USD
  • Cloud Run（定期テスト）：$1-2
  • Vertex AI（テスト使用）：$1-2
  • その他：$0-1

🔹 本番環境：$5-15 USD
  • Cloud Run（常時起動）：$2-5
  • Vertex AI（本格使用）：$2-8
  • Cloud Storage：$1-2
```

### コスト削減設定

```bash
# 最小構成（開発）
MIN_INSTANCES="0"       # アイドル時無料
MAX_INSTANCES="1"       # 暴走防止
MEMORY="512Mi"          # 最小メモリ
LIFECYCLE_DAYS="7"      # 短期画像削除

# バランス構成（本番）
MIN_INSTANCES="1"       # 高速レスポンス
MAX_INSTANCES="3"       # 適度なスケール
MEMORY="1Gi"           # 安定性とコストのバランス
LIFECYCLE_DAYS="30"     # 適切な画像保持
```

## 🔄 継続的デプロイメント

### GitHub Actions設定

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloud Run
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: google-github-actions/setup-gcloud@master
        with:
          service_account_key: ${{ secrets.GCP_SA_KEY }}
          project_id: ${{ secrets.GCP_PROJECT_ID }}
      - run: ./setup.sh
```

### 手動デプロイフロー

```bash
# 1. 開発・テスト
git checkout -b feature/new-feature
cd packages/frontend && npm run dev
# 開発・テスト

# 2. ステージングデプロイ
git push origin feature/new-feature
ENVIRONMENT="staging" ./setup.sh

# 3. 本番デプロイ
git checkout main
git merge feature/new-feature
ENVIRONMENT="prod" ./setup.sh
```

## 📚 関連リソース

- **[API.md](./API.md)** - API仕様書
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - アーキテクチャ詳細
- **[CLAUDE.md](./CLAUDE.md)** - 開発者向けガイド
- **[Google Cloud Run ドキュメント](https://cloud.google.com/run/docs)**
- **[Vertex AI ドキュメント](https://cloud.google.com/vertex-ai/docs)**

---

このデプロイメントガイドにより、AI Chat Starter Kit を確実に本番環境で運用できます。