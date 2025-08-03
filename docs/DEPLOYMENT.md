# 🚀 デプロイガイド

## 事前準備

### 1. Google Cloud SDK
```bash
# インストール: https://cloud.google.com/sdk/docs/install
gcloud auth login
gcloud auth application-default login
```

### 2. 設定ファイル
```bash
cp .env.example .env
# .envでPROJECT_IDを設定
```

## スクリプト一覧

| スクリプト | 説明 | 実行時間目安 |
|-----------|------|-------------|
| `setup.sh` | 全体統合デプロイ | 10-15分 |
| `deploy-agents-parallel.sh` | エージェント並列デプロイ | 5-8分 |
| `deploy-frontend.sh` | フロントエンドデプロイ | 3-5分 |
| `deploy-single-agent.sh` | 単独エージェントデプロイ | 2-3分 |
| `cleanup_old_agents.sh` | 古いエージェント削除 | 1-2分 |

## 基本的な使い方

### 初回デプロイ
```bash
./setup.sh
```

### エージェント更新
```bash
./deploy-agents-parallel.sh
```

### フロントエンド更新
```bash
./deploy-frontend.sh
```

### 単独エージェント開発
```bash
# 既存エージェント
./deploy-single-agent.sh deploy_analysis.py
./deploy-single-agent.sh deploy_ui_generation.py
./deploy-single-agent.sh deploy_restaurant_search.py

# 新規エージェント
./deploy-single-agent.sh deploy_new_agent.py
```

### クリーンアップ
```bash
# ドライラン（削除対象確認）
./cleanup_old_agents.sh

# 実際に削除
./cleanup_old_agents.sh --execute
```

## 各スクリプトの詳細

### setup.sh
全体統合デプロイスクリプト
- GCP初期設定（API有効化、権限設定）
- エージェント並列デプロイ
- フロントエンドデプロイ

```bash
./setup.sh
```

### deploy-agents-parallel.sh
エージェントの並列デプロイ
- 3つのエージェントを同時実行
- 高速デプロイ（従来比60-70%時間短縮）

```bash
./deploy-agents-parallel.sh
```

### deploy-frontend.sh
フロントエンドのみデプロイ
- エージェントURLを自動取得
- Cloud Buildでビルド・デプロイ
- 環境変数を自動設定

```bash
./deploy-frontend.sh
```

### deploy-single-agent.sh
単独エージェントデプロイ（開発・デバッグ用）

```bash
./deploy-single-agent.sh <script_name>
```

使用例：
```bash
./deploy-single-agent.sh deploy_analysis.py
./deploy-single-agent.sh deploy_custom_agent.py
```

### cleanup_old_agents.sh
古いエージェントの削除

```bash
# ドライラン（削除対象確認のみ）
./cleanup_old_agents.sh

# 実際に削除実行
./cleanup_old_agents.sh --execute
```

## トラブルシューティング

### よくあるエラー

#### 1. 認証エラー
```bash
gcloud auth login
gcloud auth application-default login
```

#### 2. PROJECT_ID未設定
```bash
# .envを確認・編集
cat .env
```

#### 3. API未有効化
```bash
gcloud services enable aiplatform.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

#### 4. 権限不足
```bash
# プロジェクトオーナー権限が必要
gcloud projects get-iam-policy $PROJECT_ID
```

### ログ確認

#### Cloud Buildログ
```bash
gcloud logging read 'resource.type="build"' --limit=20
```

#### Cloud Runログ
```bash
gcloud logging read 'resource.type="cloud_run_revision"' --limit=20
```

## 新規エージェント追加方法

### 1. エージェントファイル作成
```bash
# packages/ai-agents/new_agent/ に作成
mkdir packages/ai-agents/new_agent
# agent.py, requirements.txt等を作成
```

### 2. デプロイスクリプト作成
```bash
# packages/ai-agents/deploy/deploy_new_agent.py を作成
# 既存のdeploy_analysis.pyを参考に
```

### 3. テストデプロイ
```bash
./deploy-single-agent.sh deploy_new_agent.py
```

### 4. 並列デプロイに追加
```bash
# deploy-agents-parallel.sh に追加
deploy_agent "deploy_new_agent.py" &
```

## ベストプラクティス

### 開発フロー
1. ローカルでテスト
2. 単独エージェントデプロイでテスト
3. 並列デプロイで全体テスト
4. フロントエンドに統合

### コスト最適化
- 開発時は単独デプロイを活用
- 不要なエージェントは定期削除
- MIN_INSTANCES=0 でアイドル課金回避

### セキュリティ
- 本番環境では専用プロジェクト使用
- サービスアカウントキーは使用しない
- 定期的な権限見直し