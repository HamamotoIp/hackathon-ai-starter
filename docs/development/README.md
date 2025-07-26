# 🔧 開発者ガイド

AI Chat Starter Kitのカスタマイズと拡張のための開発者向けドキュメントです。

## 📋 目次

1. **[アーキテクチャ](./architecture.md)** - システム設計と構成
2. **[APIドキュメント](../api/)** - AI機能の実装パターン
3. **[上級者向け](../advanced/)** - 問題解決ガイド

## 🏗️ プロジェクト構造

```
AI Chat Starter Kit/
├── packages/frontend/     # Next.js 15.3.1 フロントエンド
│   ├── src/core/         # 🔴 ビジネスロジック（人間管理）
│   ├── src/server/       # サーバーサイド処理
│   └── src/ui/           # 🤖 UIコンポーネント（AI管理）
├── packages/ai-agents/   # Agent Engine (ADK)
└── docs/                # ドキュメント（階層化）
```

## 🎯 核心概念

### 機能ベースAI選択
```typescript
// システムが入力内容に基づいて最適なAIを選択
"こんにちは" → basic_chat → Vertex AI Direct (高速)
"データを分析して" → analysis_report → ADK Agent (高品質)
"UIを作成して" → ui_generation → ADK Agent (専門性)
```

### 人間-AI協働開発
- **🔴 人間管理**: ビジネスロジック、AI機能設計、重要な意思決定
- **🤖 AI管理**: UIコンポーネント、API実装、ページ実装

## 🚀 新機能追加の流れ

1. **機能設計** - `core/types/aiTypes.ts`で新機能定義
2. **APIエンドポイント追加** - `app/api/new-feature/route.ts`でエンドポイント実装
3. **AI処理追加** - `server/lib/adkAgent.ts`または`server/lib/vertexAI.ts`に処理ロジック追加
4. **UI実装** - AIが`app/`にページ・コンポーネント実装
5. **統合** - FeatureCardやナビゲーションに機能追加

詳細な手順については [新規AI機能追加ガイド](./adding-new-ai-features.md) を参照してください。

## 📚 詳細ドキュメント

- **[アーキテクチャ](./architecture.md)** - システム全体の設計思想
- **[新規AI機能追加ガイド](./adding-new-ai-features.md)** - 新しいAI機能を追加する詳細手順
- **[API仕様](../api/)** - AI機能の詳細実装
- **[上級者向け](../advanced/)** - Claude連携・カスタマイズ