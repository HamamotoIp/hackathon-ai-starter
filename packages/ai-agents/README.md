# 🎭 ADK Agent Engine Package

**Agent Developer Kit エージェントパッケージ** - 複雑AIタスク用Python Flaskアプリケーション

## 🎯 機能概要

- **分析レポート**: データ分析・詳細レポート生成 (20-30秒)
- **観光スポット検索**: 6段階処理で1行形式HTML出力 (15-25秒)
- **構造化出力**: Pydanticスキーマ対応・エスケープ問題を根本解決
- **Tailwind CSS対応**: 静的CSSファイル使用でJavaScriptフリー（2025年7月29日更新）

## 📝 プロジェクト構造

```
packages/ai-agents/
├── analysis_agent/        # 分析エージェント（ADK標準構造）
│   ├── agent.py
│   └── __init__.py
├── ui_generation_agent/   # UI生成エージェント（ADK標準構造）
│   ├── agent.py
│   └── __init__.py
├── tourism_spots_agent/    # 観光スポット検索エージェント（ADK標準構造）
│   ├── agent.py
│   └── __init__.py
├── deploy/                # デプロイスクリプト
│   ├── deploy_all_agents.py       # 全エージェント一括デプロイ
│   ├── deploy_analysis.py         # 分析エージェントデプロイ
│   └── deploy_tourism_spots.py    # 観光スポット検索エージェントデプロイ
├── debug/                 # ローカル開発・デバッグツール
│   ├── README.md
│   ├── debug_server.py
│   ├── local_debug_helper.py
│   └── test_agents.py
├── .env.example           # 環境変数テンプレート
├── requirements.txt       # Python依存関係
├── analysis_agent_url.txt # 分析エージェントURL
├── ui_generation_agent_url.txt # UI生成エージェントURL
├── tourism_spots_search_agent_url.txt # 観光スポット検索エージェントURL
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

# 観光スポット検索エージェントをローカルで起動
adk web tourism_spots_agent

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
python deploy/deploy_tourism_spots.py
python deploy/deploy_all_agents.py
```

## 🛠️ 技術的課題と解決策

### HTMLエスケープ問題の根本解決

#### 問題の背景
従来、Tourism Spots Search AgentのHTML出力で以下の問題が発生していました：
- HTMLに `\"店舗イメージ\"` や `\\n` などのエスケープ文字が表示される
- 改行文字がそのまま `\n` として表示される  
- JSON二重エスケープによる表示崩れ

#### 根本的解決策の実装

**1. エージェント側での改良**
```python
# SimpleUIAgent - 1行形式HTML出力を強制
instruction="""
⚠️ 重要な指示：
3. HTMLは必ず1行形式で出力（改行文字\\nは使用禁止）
4. すべてのタグと内容を1行に連結する
8. Tailwind CSSを使用

HTMLは必ず1行にまとめて、改行やインデントは含めないでください。
例: <!DOCTYPE html><html><head><title>タイトル</title></head><body>...</body></html>
"""

# HTMLOutputスキーマ - 1行形式を明示
class HTMLOutput(BaseModel):
    html: str = Field(
        description="Complete HTML document in single line format starting with <!DOCTYPE html> and ending with </html>. No newlines, no indentation, no code blocks, no JSON, just raw HTML in one line."
    )
```

**2. フロントエンド側での強化処理**
```typescript
function cleanHTMLContent(content: string): string {
  // Step 3: すべてのエスケープ文字を除去（HTMLに改行不要）
  cleaned = cleaned
    .replace(/\\n/g, ' ')      // 改行をスペースに
    .replace(/\\r/g, ' ')      // キャリッジリターンをスペースに
    .replace(/\\t/g, ' ')      // タブをスペースに
    .replace(/\\"/g, '"')      // ダブルクォート
    .replace(/\\'/g, "'")      // シングルクォート
    .replace(/\\\\/g, '\\')    // バックスラッシュ
    .replace(/\s+/g, ' ')      // 連続する空白を1つに
    .trim();
}
```

**3. Tailwind CSS CDN修正（2025年7月29日）**
```html
<!-- 変更前（JavaScript必須） -->
<script src="https://cdn.tailwindcss.com"></script>

<!-- 変更後（静的CSSファイル） -->
<link href="https://unpkg.com/tailwindcss@3.4.1/dist/tailwind.min.css" rel="stylesheet">
```

**4. 効果**
- ✅ HTMLエスケープ文字が完全に除去される
- ✅ 改行問題が解決される
- ✅ JSON二重エスケープが処理される
- ✅ 美しくレンダリングされたHTMLが表示される
- ✅ Tailwind CSSが正しく適用される（JavaScriptフリー）

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
| `Tourism Spots Search Agent` | 観光スポット検索 | 15-25秒 | 観光スポット推薦・1行形式HTML記事 |

### 専門特化エージェント
- **Analysis Agent** (`analysis_agent/`): データ分析・トレンド抽出・洞察生成
- **UI Generation Agent** (`ui_generation_agent/`): HTML/Tailwind CSS生成・プロトタイプ作成
  - 静的Tailwind CSS CDN使用（JavaScriptフリー）
- **Tourism Spots Search Agent** (`tourism_spots_agent/`): 6段階処理による完全な観光スポット検索システム
  - SimpleIntentAgent: 意図理解・パラメータ抽出
  - SimpleSearchAgent: 固定観光スポットデータ取得
  - SimpleSelectionAgent: 条件に最適な5スポット選定
  - SimpleDescriptionAgent: 魅力的な説明文生成
  - SimpleUIAgent: 1行形式HTMLを生成（エスケープ問題解決・Tailwind CSS対応）
  - HTMLExtractorAgent: 純粋な1行HTMLを最終抽出

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

| 機能 | レスポンス時間 | メモリ使用量 | 同時処理数 | 特徴 |
|------|---------------|-------------|-------------|------|
| 分析レポート | 20-30秒 | ~300MB | 5-10 | 構造化分析 |
| UI生成 | 25-45秒 | ~350MB | 5-10 | HTML/CSS生成 |
| 観光スポット検索 | 15-25秒 | ~250MB | 5-10 | 6段階処理・1行形式HTML・エスケープ問題解決済 |

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
- **[Tailwind CSS設定](../../docs/development/tailwind-css-configuration.md)** - Tailwind CSS CDN設定詳細
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