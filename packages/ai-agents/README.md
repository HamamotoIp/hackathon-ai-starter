# 🎭 ADK Agent Engine Package

**Agent Developer Kit エージェントパッケージ** - 複雑AIタスク用Python Flaskアプリケーション

## 🎯 機能概要

- **分析レポート**: データ分析・詳細レポート生成 (20-30秒)
- **比較研究**: 多角的比較・意思決定支援 (25-45秒)
- **マルチエージェント**: 専門特化エージェントの協調処理
- **構造化出力**: JSON Schema対応・一貫したレスポンス形式

## 📝 プロジェクト構造

```
packages/ai-agents/
├── app.py                 # 🔴 Flaskアプリケーションメイン
├── agents/                # 🔴 人間管理：エージェント定義
│   ├── chat/              # 基本チャットエージェント
│   ├── analysis/          # 分析レポートエージェント
│   └── comparison/        # 比較研究エージェント
├── schemas/               # 🔴 人間管理：出力スキーマ定義
├── requirements.txt       # Python依存関係（定期更新）
├── Dockerfile             # Cloud Runデプロイ用
├── venv/                  # 仮想環境（Git管理対象外）
└── README.md              # このファイル
```

## 🚀 ローカル開発セットアップ

### 1. Python仮想環境セットアップ
```bash
cd packages/ai-agents

# 仮想環境作成（初回のみ）
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 依存関係インストール
pip install -r requirements.txt
```

### 2. ローカルサーバー起動
```bash
# Flaskアプリケーション起動
python app.py
# → http://localhost:8080 でサーバー起動

# 動作確認
curl http://localhost:8080/health
```

### 3. 本番デプロイメント
```bash
# ルートディレクトリから統合デプロイ
cd /workspaces/kokorone-app
./setup.sh

# エージェントエンジンのみデプロイ
./setup.sh --agent-only
```

## 🔧 環境設定

### ローカル開発用環境変数
```bash
# .env ファイル作成（packages/ai-agents/）
VERTEX_AI_PROJECT_ID=your-gcp-project-id
VERTEX_AI_LOCATION=us-central1
PORT=8080
AUTO_DEPLOY_AGENTS=true
```

### 本番環境設定（config.sh）
```bash
# ルートディレクトリのconfig.shで管理
PROJECT_ID="your-gcp-project-id"
REGION="us-central1"
ENVIRONMENT="dev"  # dev/staging/prod

# エージェントエンジン設定
AGENT_SERVICE_NAME="ai-chat-agent-engine-${ENVIRONMENT}"
AUTO_DEPLOY_AGENTS=true
MEMORY="512Mi"      # 1Gi, 2Giに増量可能
CPU="1"            # 2, 4に増量可能
MAX_INSTANCES="1"  # 3, 5, 10に増量可能
```

## 🤖 実装済みAIエージェント

### 主要エンドポイント

| エンドポイント | 機能 | レスポンス時間 | 用途 |
|------------|------|---------------|------|
| `POST /chat` | 基本チャット | 5-10秒 | 簡単な対話 |
| `POST /analysis` | 分析レポート | 20-30秒 | データ分析・詳細レポート |
| `POST /comparison` | 比較研究 | 25-45秒 | 多角的比較・評価 |
| `GET /health` | ヘルスチェック | < 1秒 | サービス状態確認 |

### 専門特化エージェント
- **AnalysisAgent**: データ分析・トレンド抽出・洞察生成
- **ComparisonAgent**: 多角的比較・評価マトリックス作成
- **ChatAgent**: シンプルな対話・バックアップ用途

## 🔄 開発フロー（人間-AI協働）

### 新エージェント開発手順

#### 1. 機能設計（🔴 人間が実装）
```python
# schemas/new_feature_schema.py
from pydantic import BaseModel, Field

class NewFeatureOutput(BaseModel):
    result: str = Field(description="処理結果")
    confidence: float = Field(description="信頼度スコア")
    metadata: dict = Field(description="メタデータ")
```

#### 2. エージェント実装（🔴 人間が実装）
```python
# agents/new_feature/agent.py
def create_new_feature_agent():
    return {
        "name": "new_feature_agent",
        "description": "新機能のエージェント",
        "handler": handle_new_feature,
        "schema": NewFeatureOutput
    }

def handle_new_feature(content: str) -> dict:
    # エージェントロジック実装
    pass
```

#### 3. API統合（🤖 AIが実装）
```python
# app.py にエンドポイント追加
@app.route('/new-feature', methods=['POST'])
def new_feature_endpoint():
    # AIが自動実装
    pass
```

#### 4. テスト作成（🤖 AIが実装）
```bash
# ローカルテスト
curl -X POST http://localhost:8080/new-feature \
  -H "Content-Type: application/json" \
  -d '{"content": "テストデータ"}'
```

## 🌐 APIエンドポイント詳細

### ヘルスチェック
```bash
# サービス状態確認
GET /health

# レスポンス例
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "version": "1.0.0",
  "agents": ["chat", "analysis", "comparison"]
}
```

### 分析レポート
```bash
# データ分析リクエスト
POST /analysis
Content-Type: application/json

{
  "content": "分析対象のデータやテキスト"
}

# レスポンス例
{
  "success": true,
  "result": "詳細な分析レポート...",
  "processing_time_ms": 25000,
  "agent": "analysis"
}
```

### 比較研究
```bash
# 比較分析リクエスト
POST /comparison
Content-Type: application/json

{
  "content": "AとBを性能、価格、使いやすさで比較"
}

# レスポンス例
{
  "success": true,
  "result": "多角的な比較結果...",
  "processing_time_ms": 35000,
  "agent": "comparison"
}
```

## 🔍 トラブルシューティング

### よくある問題と解決策

#### 1. Python仮想環境の問題
```bash
# 仮想環境が壊れた場合
cd packages/ai-agents
rm -rf venv
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 依存関係のアップデート
pip install --upgrade -r requirements.txt
```

#### 2. Flask アプリ起動エラー
```bash
# ポート競合の確認
lsof -i :8080

# 別ポートで起動
PORT=8081 python app.py

# 環境変数の確認
echo $VERTEX_AI_PROJECT_ID
echo $VERTEX_AI_LOCATION
```

#### 3. GCP認証エラー
```bash
# ローカル認証の設定
gcloud auth application-default login

# プロジェクトID確認
gcloud config get-value project

# Vertex AI API有効化
gcloud services enable aiplatform.googleapis.com
```

#### 4. デプロイメントエラー
```bash
# Cloud Runログ確認
gcloud run services logs read ai-chat-agent-engine-dev --region us-central1

# サービス状態確認
gcloud run services describe ai-chat-agent-engine-dev --region us-central1

# リビジョン履歴
gcloud run revisions list --service ai-chat-agent-engine-dev --region us-central1
```

## 📊 パフォーマンス・スケーリング

### パフォーマンス指標（実測値）

| 機能 | レスポンス時間 | メモリ使用量 | 同時処理数 |
|------|---------------|-------------|-------------|
| 基本チャット | 5-10秒 | ~200MB | 10-20 |
| 分析レポート | 20-30秒 | ~300MB | 5-10 |
| 比較研究 | 25-45秒 | ~350MB | 5-10 |

### スケーリング設定
```bash
# config.sh でのパフォーマンス調整

# 基本設定（コスト重視）
MEMORY="512Mi"
CPU="1"
MAX_INSTANCES="1"

# 高パフォーマンス設定
MEMORY="1Gi"        # 高負荷対応
CPU="2"            # 並列処理強化
MAX_INSTANCES="5"  # スケールアウト対応

# 大規模運用設定
MEMORY="2Gi"
CPU="4"
MAX_INSTANCES="10"
```

### パフォーマンステスト
```bash
# レスポンス時間測定
time curl -X POST http://localhost:8080/analysis \
  -H "Content-Type: application/json" \
  -d '{"content": "テスト分析"}'

# 同時接続テスト
for i in {1..5}; do
  curl -X POST http://localhost:8080/health &
done
wait
```

## 📚 関連リソース

- **[QUICKSTART.md](../../QUICKSTART.md)** - クイックスタートガイド
- **[ARCHITECTURE.md](../../ARCHITECTURE.md)** - アーキテクチャ詳細
- **[CLAUDE.md](../../CLAUDE.md)** - 開発者向けガイド
- **[debug.sh](../../debug.sh)** - デバッグ・診断ツール

---

**🚀 AI Agent Engineで高品質なAI処理を実現しましょう！**