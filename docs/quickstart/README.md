# 🚀 クイックスタートガイド

AI Chat Starter Kitを最速で始めるためのガイドです。

## 📋 目次

1. **[ローカル開発](#ローカル開発)** - 30秒でスタート（Vertex AI機能のみ）
2. **[本格デプロイ](./deployment.md)** - GCP Cloud Run + ADK Agent Engine

## ⚡ ローカル開発

### 前提条件
- Node.js 18+ 
- npm または yarn

### セットアップ

```bash
# 1. リポジトリクローン
git clone https://github.com/HamamotoIp/hackathon-ai-starter.git
cd hackathon-ai-starter

# 2. フロントエンド起動
cd packages/frontend
npm install
npm run dev

# 3. ブラウザでアクセス
open http://localhost:3000
```

### 🎯 利用可能なページ

| ページ | URL | 機能 | ローカル対応 |
|--------|-----|------|-------------|
| **ホーム** | `/` | 機能一覧とナビゲーション | ✅ |
| **AI機能デモ** | `/ai-features` | **全AI機能統合体験（メイン）** | ⚠️ 一部制限 |
| **UIビルダー** | `/ui-builder` | UI生成専用ツール | ❌ ADK必要 |
| **画像管理** | `/content-management` | 画像アップロード | ❌ Cloud Storage必要 |

## 🔧 開発コマンド

### フロントエンド (@kokorone/frontend)
```bash
cd packages/frontend
npm run dev        # 開発サーバー（Turbopack）
npm run build      # プロダクションビルド
npm run start      # プロダクション実行
npm run lint       # ESLint品質チェック
npm run test       # Jest テスト実行
```

### AI Agents (ADK + Flask)
```bash
cd packages/ai-agents
python -m venv venv
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt

# ローカルテスト（デプロイ後に利用可能）
python test-agents.py
```

## ⚠️ ローカル制限事項

### 動作する機能
- ✅ **フロントエンド** - 完全なUI体験
- ⚠️ **基本チャット** - GCP認証設定後に動作

### 制限される機能
- ❌ **分析レポート** - ADK Agent Engine要デプロイ
- ❌ **UI生成** - ADK Agent Engine要デプロイ  
- ❌ **画像アップロード** - Cloud Storage要設定

### 🔐 GCP認証が必要な機能

**基本チャット**を含むVertex AI機能を使用するには：

```bash
# 1. Google Cloud SDKインストール
# 公式サイト: https://cloud.google.com/sdk/docs/install

# 2. GCPプロジェクトにログイン
gcloud auth login

# 3. アプリケーションデフォルト認証（重要！）
gcloud auth application-default login

# 4. プロジェクトID設定
gcloud config set project YOUR_PROJECT_ID
```

**解決方法**: [本格デプロイ](./deployment.md)でGCP環境を構築

## 📚 次のステップ

- **[本格デプロイ](./deployment.md)** - GCPへのデプロイ方法
- **[開発ガイド](../development/)** - カスタマイズと拡張
- **[API仕様](../api/)** - AI機能の詳細実装