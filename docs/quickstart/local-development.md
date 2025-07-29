# 💻 ローカル開発ガイド

## ⚡ クイックスタート

```bash
git clone https://github.com/HamamotoIp/hackathon-ai-starter.git
cd hackathon-ai-starter/packages/frontend
npm install && npm run dev
```

→ http://localhost:3000 でスタート！

## 🎯 推奨開発フロー

### 1. フロントエンド開発 (Vertex AI使用)
```bash
cd packages/frontend
npm run dev        # 開発サーバー起動
npm run lint       # コード品質チェック
npm run test       # テスト実行
```

**利用可能なページ**:
- `/simple-chat` - Vertex AI直接呼び出しの高速チャット
- `/ai-features` - **分析レポート生成**
- `/ui-builder` - UI生成専用ツール
- `/restaurant-search` - レストラン検索・特集記事生成
- `/content-management` - テキストコンテンツ管理

### 2. AI Agents開発 (ADK標準ツール)
```bash
cd packages/ai-agents
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 環境変数設定（config.shを使用推奨）
# プロジェクトルートのconfig.shを確認
cat ../../config.sh
# または個別に.envファイルを作成する場合：
# cp .env.example .env
# .env を編集してGCPプロジェクトIDを設定

# ADK Web UIでエージェント開発
adk web analysis_agent         # 分析エージェント
adk web ui_generation_agent    # UI生成エージェント
adk web restaurant_search_agent # レストラン検索エージェント
```

## 🔧 開発環境設定

### 必要なツール
- **Node.js 18+** - フロントエンド開発
- **Python 3.10+** - AI Agents開発  
- **gcloud CLI** - GCP認証（必須）

### GCP認証設定（必須）
```bash
# 1. Google Cloud SDK インストール
# 公式サイト: https://cloud.google.com/sdk/docs/install

# 2. GCPにログイン
gcloud auth login

# 3. アプリケーションデフォルト認証（重要！）
gcloud auth application-default login

# 4. プロジェクトID設定
gcloud config set project YOUR_PROJECT_ID

# 5. 必要なAPIを有効化
gcloud services enable aiplatform.googleapis.com
```

### 環境変数（ローカル開発）

**推奨**: プロジェクトルートの`config.sh`を使用
```bash
# config.shが既存（PROJECT_ID設定済み）
cat config.sh
# setup.shで自動的に環境変数が設定されます
```

**または個別設定**:
```bash
# packages/frontend/.env.local
VERTEX_AI_PROJECT_ID=food-hack-466801  # 現在のプロジェクトID
VERTEX_AI_LOCATION=us-central1

# packages/ai-agents/ ではconfig.shから自動読み込み
# 個別の.envファイルは不要（config.shで一元管理）
```

## 🎯 機能テスト方法

### 基本機能テスト
1. `/simple-chat` で基本的なチャット機能確認
2. `/ai-features` で分析レポート生成
3. `/ui-builder` でUI生成体験
4. `/restaurant-search` でレストラン検索・HTML特集記事確認

### AI Agentsローカル開発
1. `adk web analysis_agent` でWeb UIを起動
2. ブラウザで http://localhost:8000 にアクセス
3. チャット形式でエージェントをテスト
4. セッション保存で重要な対話を記録

### 新機能追加時
1. `packages/ai-agents/` に新しいエージェントフォルダ作成
2. ADK標準構造（agent.py, __init__.py, .env）
3. `adk web new_agent` でローカルテスト
4. フロントエンドAPIエンドポイント追加

## 📚 次のステップ

- **[デプロイガイド](./deployment.md)** - GCPデプロイ方法
- **[開発ガイド](../development/)** - カスタマイズ・拡張
- **[API仕様](../api/)** - 詳細実装