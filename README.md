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

| 機能 | ページ | API エンドポイント | 特徴 |
|------|--------|--------|------|
| **💬 チャット** | `/simple-chat` | `/api/chat` | Vertex AI Direct、高速レスポンス（3秒以内） |
| **📊 分析レポート** | `/ai-features` | `/api/analysis` | ADK Analysis Agent、詳細な分析・構造化出力 |
| **🎨 UI生成** | `/ui-builder` | `/api/ui-generation` | ADK UI Generation Agent、デバイス最適化HTML生成 |
| **🍽️ レストラン検索** | `/restaurant-search` | `/api/restaurant-search` | ADK Restaurant Search Agent、6段階処理・エスケープ問題解決済 |
| **📁 コンテンツ管理** | `/content-management` | - | テキストコンテンツの作成・編集・管理 |

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
📱 Frontend (hackathon-ai-starter)
├── Next.js 15.3.1 + React 19.0.0
├── TypeScript 5.x + Tailwind CSS 4.0
├── Pages (機能別UI):
│   ├── /simple-chat → シンプルチャット (Vertex AI Direct)
│   ├── /ai-features → 分析レポート (ADK Analysis Agent)
│   ├── /ui-builder → UI生成ツール (ADK UI Generation Agent)
│   ├── /restaurant-search → レストラン検索 (ADK Restaurant Search Agent)
│   └── /content-management → テキストコンテンツ管理
├── API Routes (直接AI呼び出し):
│   ├── /api/chat → vertex-ai.ts → Vertex AI Direct
│   ├── /api/analysis → adk-agent.ts → ADK Analysis Agent
│   ├── /api/ui-generation → adk-agent.ts → ADK UI Generation Agent (デバイス最適化)
│   └── /api/restaurant-search → adk-agent.ts → ADK Restaurant Search Agent
├── Server Libraries (src/lib/):
│   ├── vertex-ai.ts → 基本チャット用
│   ├── adk-agent.ts → 分析・UI生成用
│   ├── api-client.ts → HTTPクライアント
│   └── ai-features.ts → AI機能定義
└── Components (src/components/):
    ├── FeatureCard.tsx → 機能カード表示
    └── hooks/ → 機能別React Hook
        ├── use-chat.ts → チャット機能Hook
        ├── use-analysis.ts → 分析機能Hook
        ├── use-ui-generation.ts → UI生成機能Hook
        └── use-restaurant-search.ts → レストラン検索機能Hook

🤖 AI Agents (packages/ai-agents)
├── ADK 1.93.0 + Flask 3.0.0
├── Analysis Agent (analysis_agent.py)
├── UI Generation Agent (ui_generation_agent.py) - デバイス最適化対応
└── Restaurant Search Agent (restaurant_search_agent.py) - HTML特集記事生成

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

## 🛠️ 技術的特徴

### Restaurant Search Agentの革新的実装

**エスケープ問題の根本解決**を実現した6段階処理システム：

#### 解決した技術課題
- **問題**: HTMLに `\"店舗イメージ\"` や `\\n` が表示される
- **解決策**: エージェント側で1行形式HTML出力 + フロントエンド側でシンプル化エスケープ除去
- **結果**: 美しくレンダリングされるHTML記事

#### 6段階処理フロー
1. **SimpleIntentAgent**: ユーザー意図の構造化
2. **SimpleSearchAgent**: 2段階Google検索実行
3. **SimpleSelectionAgent**: 条件最適化5店舗選定
4. **SimpleDescriptionAgent**: 魅力的説明文生成
5. **SimpleUIAgent**: 1行形式HTML生成（⭐エスケープ問題解決）
6. **HTMLExtractorAgent**: 純粋HTML最終抽出

#### コード例

```typescript
// フロントエンド - シンプル化されたエスケープ除去
function cleanHTMLContent(content: string): string {
  return content
    .replace(/\\n/g, ' ')      // 改行をスペースに
    .replace(/\\"/g, '"')      // クォート復元
    .replace(/\s+/g, ' ')      // 空白正規化
    .trim();
}
```

```python
# エージェント - 1行形式強制
class HTMLOutput(BaseModel):
    html: str = Field(
        description="Complete HTML document in single line format"
    )

# SimpleUIAgent指示
instruction="""
HTMLは必ず1行形式で出力（改行文字\\nは使用禁止）
例: <!DOCTYPE html><html><head>...</head><body>...</body></html>
"""
```

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
- **[AIエージェント詳細](./packages/ai-agents/README.md)** - ADKエージェント技術仕様
- **[Restaurant Search Agent](./packages/ai-agents/restaurant_search_agent/README.md)** - エスケープ問題解決の詳細
- **[Issue Tracker](https://github.com/your-username/ai-chat-starter-kit/issues)** - バグ報告・機能要求

---

**🎯 ミッション**: ハッカソン・プロトタイピングでAI活用を加速し、アイデアの具現化を30秒で可能にする。