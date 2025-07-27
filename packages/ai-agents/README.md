# 🎭 ADK Agent Engine Package

**Agent Developer Kit エージェントパッケージ** - 複雑AIタスク用Python Flaskアプリケーション

## 🎯 機能概要

- **分析レポート**: データ分析・詳細レポート生成 (20-30秒)
- **UI生成**: HTML/Tailwind CSS生成・プロトタイプ作成 (25-45秒)
- **レストラン検索**: 飲食店推薦・HTML特集記事生成 (15-25秒)
- **構造化出力**: JSON Schema対応・一貫したレスポンス形式

## 📝 プロジェクト構造

```
packages/ai-agents/
├── analysis_agent/        # 分析エージェント（ADK標準構造）
│   ├── agent.py
│   └── __init__.py
├── ui_generation_agent/   # UI生成エージェント（ADK標準構造）
│   ├── agent.py
│   └── __init__.py
├── restaurant_search_agent/ # レストラン検索エージェント（ADK標準構造）
│   ├── agent.py
│   └── __init__.py
├── deploy/                # デプロイスクリプト
│   ├── deploy_all_agents.py       # 全エージェント一括デプロイ
│   ├── deploy_analysis.py         # 分析エージェントデプロイ
│   ├── deploy_ui_generation.py    # UI生成エージェントデプロイ
│   └── deploy_restaurant_search.py # レストラン検索エージェントデプロイ
├── debug/                 # ローカル開発・デバッグツール
│   ├── README.md
│   ├── debug_server.py
│   ├── local_debug_helper.py
│   └── test_agents.py
├── .env.example           # 環境変数テンプレート
├── requirements.txt       # Python依存関係
├── analysis_agent_url.txt # 分析エージェントURL
├── ui_generation_agent_url.txt # UI生成エージェントURL
├── restaurant_search_agent_url.txt # レストラン検索エージェントURL
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

# config.shを使用（エージェントの.envファイルは不要）
# プロジェクトルートのconfig.shを確認
cat ../../config.sh
# すべてのスクリプトがconfig.shから自動読み込み
```

### 2. ローカル開発（ADK標準コマンド）
```bash
# 分析エージェントをローカルで起動
adk web analysis_agent

# UI生成エージェントをローカルで起動  
adk web ui_generation_agent

# レストラン検索エージェントをローカルで起動
adk web restaurant_search_agent

# ターミナルで対話的実行
adk run analysis_agent
```

→ http://localhost:8000 でGUI操作可能！

### 3. 本番デプロイメント
```bash
# ルートディレクトリからエージェントデプロイ
cd /workspaces/hackathon-ai-starter
./setup.sh

# 個別エージェントデプロイ
cd packages/ai-agents
python deploy/deploy_analysis.py
python deploy/deploy_ui_generation.py
python deploy/deploy_restaurant_search.py
python deploy/deploy_all_agents.py
```

## 🔧 環境設定

### 共通環境変数

```bash
# config.shから自動読み込み（PROJECT_ID: food-hack-466801）
# エージェントごとの.envファイルは不要
# すべてのデプロイスクリプトがconfig.shを参照
```

### 本番環境設定（config.sh）
既存の`config.sh`に設定済み：
```bash
# ルートディレクトリのconfig.shで管理
export PROJECT_ID="food-hack-466801"     # 現在のプロジェクトID
export REGION="us-central1"
export ENVIRONMENT="dev"

# エージェント設定（既設定）
export MEMORY="512Mi"
export CPU="1"
export MAX_INSTANCES="1"
```

## 🤖 実装済みAIエージェント

### 主要エンドポイント

| ADK Agent | 機能 | レスポンス時間 | 用途 |
|-----------|------|---------------|------|
| `Analysis Agent` | 分析レポート | 20-30秒 | データ分析・詳細レポート |
| `UI Generation Agent` | UI生成 | 25-45秒 | HTML/Tailwind生成 |
| `Restaurant Search Agent` | レストラン検索 | 15-25秒 | 飲食店推薦・HTML特集記事 |

### 専門特化エージェント
- **Analysis Agent** (`analysis_agent/`): データ分析・トレンド抽出・洞察生成
- **UI Generation Agent** (`ui_generation_agent/`): HTML/Tailwind CSS生成・プロトタイプ作成
- **Restaurant Search Agent** (`restaurant_search_agent/`): 飲食店推薦・HTML特集記事生成

## 🔄 開発フロー（人間-AI協働）

### 新エージェント開発手順

#### 1. ADK標準エージェント作成
```bash
# 新エージェント用ディレクトリ作成
mkdir new_feature_agent
cd new_feature_agent
```

#### 2. エージェント実装（🔴 人間が実装）
```python
# new_feature_agent/agent.py
from google.adk.agents import LlmAgent

root_agent = LlmAgent(
    name="new_feature_specialist",
    model="gemini-2.0-flash-exp",
    description="新機能の専門エージェント",
    instruction="""新機能の処理を実行するエージェントです。
    
ユーザーの要求に応じて適切な処理を行い、
構造化された結果を返してください。"""
)
```

#### 3. 必要ファイル作成
```python
# new_feature_agent/__init__.py
from . import agent

# new_feature_agentは.env不要
# config.shから自動読み込み
```

#### 4. ローカルテスト
```bash
# ADK標準コマンドでテスト
adk web new_feature_agent
adk run new_feature_agent
```

## 🌐 ローカル開発での使用方法

### ADK Web UIの使用
```bash
# Web UIでエージェントテスト
adk web analysis_agent

# ブラウザで http://localhost:8000 にアクセス
# - チャット形式でエージェントと対話
# - セッション履歴の管理
# - リアルタイムレスポンス表示
```

### ターミナルでの対話実行
```bash
# ターミナルでエージェントと直接対話
adk run analysis_agent

# 実行例:
# User: 売上データを分析してください。Q1: 100万円、Q2: 150万円...
# Agent: [詳細な分析レポートを出力]

# セッション保存
adk run analysis_agent --save_session --session_id "analysis_session_001"

# セッション再開
adk run analysis_agent --resume analysis_session_001.json
```

### デバッグとテスト
```bash
# デバッグサーバー起動（詳細ログ付き）
python debug/debug_server.py

# エージェント自動テスト
python debug/test_agents.py

# 環境診断
python debug/local_debug_helper.py
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

#### 2. ADK コマンドエラー
```bash
# ADKが認識されない場合
pip install google-adk

# ポート競合の確認（デフォルト8000）
lsof -i :8000

# 環境変数の確認
echo $GOOGLE_CLOUD_PROJECT
echo $GOOGLE_CLOUD_LOCATION
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
# Agent Engineデプロイログ確認
python deploy/deploy_analysis.py

# デプロイ済みエージェント確認
gcloud ai-platform agent-engines list --region=us-central1

# 環境変数確認
echo $VERTEX_AI_PROJECT_ID
echo $VERTEX_AI_LOCATION
```

## 📊 パフォーマンス・スケーリング

### パフォーマンス指標（実測値）

| 機能 | レスポンス時間 | メモリ使用量 | 同時処理数 |
|------|---------------|-------------|-------------|
| 分析レポート | 20-30秒 | ~300MB | 5-10 |
| UI生成 | 25-45秒 | ~350MB | 5-10 |
| レストラン検索 | 15-25秒 | ~250MB | 5-10 |

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
# ローカルレスポンス時間測定
time echo "売上データ分析テスト" | adk run analysis_agent

# 複数エージェント同時テスト
python debug/test_agents.py

# 負荷テスト
for i in {1..5}; do
  adk run analysis_agent --replay test_session.json &
done
wait
```

## 📚 関連リソース

- **[debug/README.md](./debug/README.md)** - ローカルデバッグツール詳細
- **[QUICKSTART.md](../../docs/QUICKSTART.md)** - 全体クイックスタートガイド
- **[ローカル開発ガイド](../../docs/quickstart/local-development.md)** - ローカル開発詳細
- **[ADK公式ドキュメント](https://google.github.io/adk-docs/)** - Agent Development Kit公式

## 🎯 開発のベストプラクティス

### ローカル開発フロー
1. **ADK Web UI**でアイデア検証 (`adk web analysis_agent`)
2. **セッション保存**で重要な対話を記録
3. **デバッグツール**で詳細確認
4. **デプロイテスト**で本番確認

### 新機能開発
1. 既存エージェントを参考に構造作成
2. ADK標準の `LlmAgent` を使用
3. instruction（プロンプト）に注力
4. ローカルテスト → デプロイの順序

---

**🚀 ADK標準コマンドで効率的なAI Agent開発を実現しましょう！**