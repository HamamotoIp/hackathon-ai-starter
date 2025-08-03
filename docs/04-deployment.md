# 🚀 デプロイメント

GCPへのAI Chat Starter Kitの本番デプロイガイド

## ⚡ クイックデプロイ（1分）

```bash
# 1. クローン
git clone https://github.com/HamamotoIp/hackathon-ai-starter.git
cd hackathon-ai-starter

# 2. 設定
cp config.example.sh config.sh
# config.sh で PROJECT_ID を設定

# 3. デプロイ
./setup.sh

# 完了！
```

## 📋 前提条件

### 必要なツール
- Node.js 18+
- Python 3.8+
- Google Cloud CLI
- Git

### GCPプロジェクト
- 課金が有効
- 必要なAPI（setup.shで自動有効化）

## 🔧 設定ファイル

### config.sh の主要設定

```bash
# 必須
PROJECT_ID="your-gcp-project-id"
REGION="us-central1"            # asia-northeast1 など
ENVIRONMENT="dev"               # dev/staging/prod

# コスト最適化
MEMORY="512Mi"                  # メモリ（512Mi〜4Gi）
CPU="1"                         # CPU（1〜8）
MAX_INSTANCES="1"               # 最大インスタンス（コスト制御）
MIN_INSTANCES="0"               # 最小（0=アイドル時無料）
```

## 🛠️ 段階的デプロイ

### 1. Google Cloud認証

```bash
# ログイン
gcloud auth login

# 重要：アプリケーション認証
gcloud auth application-default login

# プロジェクト設定
gcloud config set project YOUR-PROJECT-ID
```

### 2. リソース作成とデプロイ

```bash
# 自動デプロイ（推奨）
./setup.sh

# 個別デプロイ
./deploy-agent.sh      # AIエンジンのみ
./deploy-frontend.sh   # フロントエンドのみ
```

### 3. 動作確認

```bash
# デバッグツール実行
./debug.sh

# または手動確認
curl https://your-app.run.app/api/debug
```

## 🌍 環境別設定

### 開発環境
```bash
ENVIRONMENT="dev"
MAX_INSTANCES="1"    # コスト制御
MIN_INSTANCES="0"    # アイドル時無料
MEMORY="512Mi"       # 最小構成
```

### 本番環境
```bash
ENVIRONMENT="prod"
MAX_INSTANCES="5"    # 高可用性
MIN_INSTANCES="1"    # 常時起動
MEMORY="1Gi"         # 安定性重視
CPU="2"              # 高性能
```

## 💰 コスト最適化

### 推定月額コスト
- **開発**: $0-2
- **本番**: $5-15

### コスト削減設定
```bash
MIN_INSTANCES="0"     # アイドル時完全無料
MAX_INSTANCES="1"     # 暴走防止
LIFECYCLE_DAYS="30"   # 画像自動削除
```

## 🔍 トラブルシューティング

### よくある問題

**認証エラー**
```bash
# 再認証
gcloud auth application-default login
```

**デプロイ失敗**
```bash
# ログ確認
gcloud run services logs read ai-chat-frontend-dev \
  --region us-central1 --limit 50
```

**環境変数エラー**
```bash
# 環境変数確認
gcloud run services describe ai-chat-frontend-dev \
  --region us-central1 --format="value(spec.template.spec.containers[0].env[].name)"
```

### ログ確認

```bash
# リアルタイムログ
gcloud run services logs tail ai-chat-frontend-dev \
  --region us-central1

# ビルドログ
gcloud builds list --limit=5
```

## 🔧 高度な設定

### カスタムドメイン

```bash
gcloud run domain-mappings create \
  --service ai-chat-frontend-dev \
  --domain your-domain.com \
  --region us-central1
```

### リージョン変更

```bash
# アジア（東京）
REGION="asia-northeast1" ./setup.sh

# ヨーロッパ
REGION="europe-west1" ./setup.sh
```

### 監視設定

```bash
# アラート設定
gcloud monitoring policies create \
  --policy-from-file monitoring-policy.yaml
```

## ✅ デプロイ後チェックリスト

### 基本機能
- [ ] トップページ表示
- [ ] AIチャット動作
- [ ] レストラン検索
- [ ] 画像アップロード

### パフォーマンス
- [ ] ページロード < 3秒
- [ ] AI応答 < 10秒（基本）
- [ ] モバイル表示確認

### セキュリティ
- [ ] HTTPS有効
- [ ] 環境変数保護
- [ ] アップロード制限

## 📚 関連ドキュメント

- [クイックスタート](./01-quickstart.md) - ローカル開発
- [アーキテクチャ](./02-architecture.md) - システム設計
- [トラブルシューティング](./08-troubleshooting.md) - 問題解決