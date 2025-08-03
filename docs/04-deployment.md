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

### 2. 最適化されたデプロイプロセス

```bash
# 🚀 自動デプロイ（推奨・最適化済み）
./setup.sh
# → 並列Agent Engineデプロイ（3エージェント同時）
# → マルチステージビルド + Cloud Build並列化
# → 従来比60-70%高速化（実測値）

# 個別デプロイ
./deploy-agents-parallel.sh   # Agent Engine並列デプロイ（新機能）
./deploy-agents.sh           # Agent Engine順次デプロイ（従来版）
./deploy-frontend.sh         # フロントエンドのみ（最適化版）
```

### 🚀 並列Agent Engineデプロイ（新機能）

最新のデプロイプロセスには革新的な並列デプロイ機能が含まれています：

**並列処理の詳細**:
- **3つのAgent Engine**を同時デプロイ（Analysis、UI Generation、Restaurant Search）
- **実行時間**: 195秒（約3分） vs 従来900秒（15分）
- **時間短縮率**: 78.3%（実測値）
- **安全性**: エラー時自動フォールバック

**シンプルなログ管理**:
- **デフォルト**: ログファイル無し（完了後自動削除）
- **デバッグモード**: `DEBUG=1` でログ保持
- **エラー情報**: コンソールに直接表示
- **クリーン**: ディスク容量消費無し

**デバッグモード使用例**:
```bash
# 通常デプロイ（ログ無し）
./deploy-agents-parallel.sh

# デバッグ時のみログ保持
DEBUG=1 ./deploy-agents-parallel.sh
```

**フォールバック機能**:
- 並列デプロイ失敗時、自動的に順次デプロイに切り替え
- 部分成功（1-2エージェント成功）でも続行可能
- エラー詳細はコンソール出力で確認

```bash
# 並列デプロイ実行例
./deploy-agents-parallel.sh

# 実行結果例
📊 デプロイ統計
  成功: 3 / 3
  実行時間: 195秒
  時間短縮: 78.3% (順次実行比)

🤖 デプロイ済みAgent Engine:
  📊 分析レポート: https://us-central1-aiplatform.googleapis.com/v1/...
  🎨 UI生成: https://us-central1-aiplatform.googleapis.com/v1/...
  🍽️ レストラン検索: https://us-central1-aiplatform.googleapis.com/v1/...
```

### 🚀 フロントエンド最適化の詳細

最新のデプロイプロセスには以下の最適化が含まれています：

**マルチステージビルド**:
```dockerfile
# ステージ1: 依存関係のインストール
FROM node:18-alpine AS deps
COPY package*.json ./
RUN npm ci --cache /tmp/.npm --prefer-offline

# ステージ2: アプリケーションビルド  
FROM node:18-alpine AS builder
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

# ステージ3: 本番用最小イメージ
FROM node:18-alpine AS runner
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
```

**最適化効果**:
- **イメージサイズ**: 30-40%削減
- **セキュリティ**: 非rootユーザーで実行
- **キャッシュ効率**: レイヤー別最適化

**Cloud Build並列化**:
```yaml
# cloudbuild.yaml での並列処理
steps:
- name: 'gcr.io/cloud-builders/docker'
  id: 'build-deps'
  args: ['build', '--target', 'deps', ...]
  waitFor: ['pull-cache']

- name: 'gcr.io/cloud-builders/docker'  
  id: 'build-app'
  args: ['build', '--target', 'builder', ...]
  waitFor: ['build-deps']
```

**パフォーマンス向上**:
- **ビルド時間**: 50-70%短縮
- **キャッシュヒット率**: 90%以上
- **並列実行**: 依存関係の自動解決

**最適化されたキャッシュ戦略**:
- 依存関係レイヤーの独立キャッシュ
- package.json変更時のみ再インストール
- Next.js standalone出力モード使用
- Sharp による画像最適化自動化

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