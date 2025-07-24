# 🎓 上級者向けガイド

AI Chat Starter Kitの高度なカスタマイズと運用のための上級者向けドキュメントです。

## 📋 目次

1. **[Claude協働開発](./claude-collaboration.md)** - 人間-AI効率協働のガイドライン
2. **[カスタマイズ](./customization.md)** - 高度なカスタマイズ方法

## 🚀 上級者向け機能

### 人間-AI協働開発
このプロジェクトは、人間とAIの適切な分業により効率的な開発を実現します：

- **🔴 人間の責任領域**: ビジネスロジック、AI機能設計、重要な意思決定
- **🤖 AIの責任領域**: UIコンポーネント実装、API実装、繰り返し作業

### マルチエージェント設計
複数のAIエージェントを機能別に使い分ける先進的なアーキテクチャ：

```typescript
// 機能ベースの自動ルーティング
const processor = new AIProcessor();
const result = await processor.process({
  message: userInput,
  feature: determineFeature(userInput), // 自動判定
  sessionId: generateSession()
});
```

## 🎯 プロダクション運用

### スケーリング戦略
- **フロントエンド**: Cloud Run自動スケーリング
- **Agent Engine**: Vertex AI按量課金
- **ストレージ**: Cloud Storage with ライフサイクル管理

### 監視・メトリクス
- レスポンス時間監視
- AI使用量トラッキング
- エラー率アラート

## 📚 詳細ドキュメント

- **[Claude協働ガイド](./claude-collaboration.md)** - 効率的な人間-AI開発手法
- **[開発ガイド](../development/)** - 基本的なカスタマイズ
- **[API仕様](../api/)** - 技術的な実装詳細