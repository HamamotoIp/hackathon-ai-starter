# 💻 ローカル開発ガイド

## ⚡ 30秒スタート

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
- `/ai-features` - **全AI機能統合体験（推奨メイン）**
- `/ui-builder` - UI生成専用ツール
- `/content-management` - 画像アップロード管理

### 2. AI Agents開発 (本格機能)
```bash
cd packages/ai-agents
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 設定ファイル準備
cp ../config.example.sh ../config.sh
# config.sh を編集してGCPプロジェクトIDを設定
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
```bash
# packages/frontend/.env.local
VERTEX_AI_PROJECT_ID=your-gcp-project-id
VERTEX_AI_LOCATION=us-central1
```

## 🎯 機能テスト方法

### 基本機能テスト
1. `/ai-features` でAI機能選択
2. 各機能を試して動作確認
3. `/ui-builder` でUI生成体験

### 新機能追加時
1. `src/core/types/AIFeatures.ts` で機能定義
2. `src/server/lib/aiProcessor.ts` で処理追加
3. UIコンポーネントをAIが自動生成

## 📚 次のステップ

- **[デプロイガイド](./deployment.md)** - GCPデプロイ方法
- **[開発ガイド](../development/)** - カスタマイズ・拡張
- **[API仕様](../api/)** - 詳細実装