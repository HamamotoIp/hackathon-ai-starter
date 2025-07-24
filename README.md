# 🚀 AI Chat Starter Kit

**機能ベースAI使い分け** - ハッカソン特化、30秒スタート

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Next.js](https://img.shields.io/badge/Next.js-15.3.1-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Google Cloud](https://img.shields.io/badge/Google%20Cloud-ADK%201.93.0-4285F4)](https://cloud.google.com/vertex-ai)

## ⚡ 30秒スタート

```bash
git clone https://github.com/HamamotoIp/hackathon-ai-starter.git
cd hackathon-ai-starter/packages/frontend
npm install && npm run dev
```

→ **http://localhost:3000** でスタート！

## 🎯 なぜこのプロジェクト？

**AI Chat Starter Kit**は、ハッカソン・プロトタイピングに特化したAIチャットシステムです。

### 🌟 核心価値
- **30秒セットアップ** - 複雑な設定なし、即座に動作
- **機能ベースAI選択** - システムが最適なAIを自動選択
- **認証なし設計** - プロトタイプに集中、認証の複雑さを排除
- **人間-AI協働** - 効率的な分業でスピード開発

### 🎨 AI機能デモ

| 機能 | API エンドポイント | 特徴 |
|------|--------|------|
| **💬 基本チャット** | `/api/chat/basic` | Vertex AI Direct、高速レスポンス |
| **📊 分析レポート** | `/api/analysis` | ADK Analysis Agent、構造化出力 |
| **🎨 UI生成** | `/api/ui-generation` | ADK UI Generation Agent、HTML/Tailwind生成 |
| **🖼️ 画像アップロード** | `/api/images/upload` | Cloud Storage連携 |

## 🚀 始め方

### 1. ローカル体験（推奨）
```bash
# クローン & スタート
git clone https://github.com/HamamotoIp/hackathon-ai-starter.git
cd hackathon-ai-starter/packages/frontend
npm install && npm run dev

# ブラウザで体験
open http://localhost:3000
```

### 2. 本格デプロイ（GCP）
```bash
# 1. Google Cloud SDKインストール
# 公式サイト: https://cloud.google.com/sdk/docs/install

# 2. GCP認証
gcloud auth login
gcloud auth application-default login

# 3. GCP設定
cp config.example.sh config.sh
# config.sh でPROJECT_IDを設定

# 4. ワンコマンドデプロイ
./setup.sh
```

## 🏗️ アーキテクチャ

```
📱 Frontend (@kokorone/frontend)
├── Next.js 15.3.1 + React 19.0.0
├── TypeScript 5.x + Tailwind CSS 4.0
├── API Routes:
│   ├── /api/chat/basic → Vertex AI Direct
│   ├── /api/analysis → ADK Analysis Agent
│   ├── /api/ui-generation → ADK UI Generation Agent
│   └── /api/images/upload → Cloud Storage
└── Pages:
    ├── /ai-features → AI機能デモ
    ├── /simple-chat → シンプルチャット
    └── /ui-builder → UI生成ツール

🤖 AI Agents (packages/ai-agents)
├── ADK 1.93.0 + Flask 3.0.0
├── Analysis Agent (analysis_agent.py)
├── UI Generation Agent (ui_generation_agent.py)
└── Basic Chat Agent (basic_chat_agent.py)

☁️ GCP Infrastructure
├── Cloud Run (Frontend + Agent Engine)
├── Vertex AI (Gemini 2.0 Flash)
└── Cloud Storage (画像アップロード用)
```

## 📚 ドキュメント

### 🚀 すぐ始める
- **[クイックスタート](./docs/quickstart/)** - 30秒で体験開始
- **[ローカル開発](./docs/quickstart/local-development.md)** - 開発環境構築
- **[デプロイガイド](./docs/quickstart/deployment.md)** - GCP本格運用

### 🔧 開発・カスタマイズ
- **[開発者ガイド](./docs/development/)** - アーキテクチャ・拡張方法
- **[API仕様](./docs/api/)** - AI機能の詳細実装
- **[上級者向け](./docs/advanced/)** - 高度なカスタマイズ

## 🛠️ 技術スタック

### フロントエンド
- **Next.js 15.3.1** - App Router, Server Components, Turbopack
- **React 19.0.0** - 最新の同期機能
- **TypeScript 5.x** - 完全型安全性
- **Tailwind CSS 4.0** - PostCSS統合、効率的スタイリング
- **Radix UI** - アクセシブルなUIコンポーネント

### AI・バックエンド
- **Google ADK 1.93.0** - Agent Development Kit
- **Flask 3.0.0** - AI Agentサーバー
- **Vertex AI** - Gemini 2.0 Flash (高速・低コスト)
- **Cloud Run** - サーバーレス自動スケーリング
- **Cloud Storage** - 画像アップロード管理

## 💰 コスト効率

**月額 $0-15** での本格運用を実現：

- **開発・デモ**: $0-3 (最小限の使用)
- **ハッカソン**: $3-8 (中程度の使用)
- **プロトタイプ運用**: $8-15 (継続的使用)

## 🤝 コントリビューション

このプロジェクトは、人間-AI協働開発の実践例でもあります。

### 開発の分業
- **🔴 人間**: ビジネスロジック設計、AI機能設計、重要な意思決定
- **🤖 AI**: UIコンポーネント実装、API実装、繰り返し作業

### コントリビューション方法
1. Issueで機能提案・バグ報告
2. Pull Requestで改善提案
3. [上級者ガイド](./docs/advanced/claude-collaboration.md)で協働開発パターンを学習

## 📄 ライセンス

Apache License 2.0 - 商用利用・改変・再配布自由

## 🔗 リンク

- **[デモサイト](#)** - ライブデモ（デプロイ後に更新）
- **[ドキュメント](./docs/)** - 完全なガイド
- **[Issue Tracker](https://github.com/your-username/ai-chat-starter-kit/issues)** - バグ報告・機能要求

---

**🎯 ミッション**: ハッカソン・プロトタイピングでAI活用を加速し、アイデアの具現化を30秒で可能にする。