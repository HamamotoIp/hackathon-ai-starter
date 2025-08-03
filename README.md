# 🚀 AI Chat Starter Kit

**シンプル・高速・実用的** - ハッカソン特化AIチャットシステム

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Next.js](https://img.shields.io/badge/Next.js-15.3.1-black)](https://nextjs.org/)
[![Google Cloud](https://img.shields.io/badge/Google%20Cloud-ADK%201.93.0-4285F4)](https://cloud.google.com/vertex-ai)

## ⚡ クイックスタート

### ローカル開発
```bash
git clone https://github.com/HamamotoIp/hackathon-ai-starter.git
cd hackathon-ai-starter/packages/frontend
npm install && npm run dev
```

### GCPデプロイ
```bash
cp .env.example .env
# .envでPROJECT_IDを設定
./scripts/setup.sh
```

## 🎯 特徴

### 🌟 主要機能
- **💬 AIチャット** - Vertex AI直接統合、ストリーミング
- **📊 分析レポート** - ADK Analysis Agent
- **🍽️ レストラン検索** - 特集記事生成・保存・管理

### 🚀 技術スタック
- **Next.js 15** + **React 19** + **TypeScript**
- **Google ADK 1.93** + **Vertex AI**
- **Cloud Run** + **Cloud Storage** + **Firestore**

## 📋 スクリプト一覧

| スクリプト | 説明 | 使用場面 |
|-----------|------|----------|
| `scripts/setup.sh` | 全体統合デプロイ | 初回・本格運用 |
| `scripts/deploy-agents-parallel.sh` | エージェント並列デプロイ | エージェント更新 |
| `scripts/deploy-frontend.sh` | フロントエンドデプロイ | フロントエンド更新 |
| `scripts/deploy-single-agent.sh` | 単独エージェントデプロイ | 開発・デバッグ |
| `scripts/cleanup_old_agents.sh` | 古いエージェント削除 | クリーンアップ |

### 基本的な使い方
```bash
# 初回デプロイ
./scripts/setup.sh

# エージェント更新
./scripts/deploy-agents-parallel.sh

# フロントエンド更新
./scripts/deploy-frontend.sh

# 単独エージェント
./scripts/deploy-single-agent.sh deploy_analysis.py
```

## 🏗️ アーキテクチャ

```
📱 Frontend
├── Next.js 15 + React 19 + TypeScript
├── Tailwind CSS
└── API Routes → ADK Agents

🤖 AI Agents
├── Analysis Agent
└── Restaurant Search Agent

☁️ GCP Infrastructure
├── Cloud Run (Frontend + Agents)
├── Vertex AI (Gemini 2.0 Flash)
└── Cloud Storage + Firestore
```

## 📚 ドキュメント

- **[デプロイガイド](./docs/DEPLOYMENT.md)** - スクリプト使用方法
- **[API仕様](./docs/API.md)** - エンドポイント一覧
- **[トラブルシューティング](./docs/TROUBLESHOOTING.md)** - 問題解決

## 💰 コスト

**月額 $0-15** での運用を実現

## 📄 ライセンス

Apache License 2.0

