# 📚 API仕様書

AI Chat Starter KitのAI機能とAPI実装の詳細ドキュメントです。

## 📋 目次

1. **[Agent Engine API](./agent-engine.md)** - ADK実装パターン完全ガイド
2. **[実装例・サンプル](./examples.md)** - 動作確認済みクエリ形式

## 🎯 AI機能概要

### 機能ベース処理フロー

```typescript
// 基本チャット用
interface BasicChatRequest {
  message: string;
}

// 分析・UI生成用（ADK Agent Engine）
interface AIFeatureRequest {
  feature: 'analysis' | 'ui_generation';
  input: string;
  sessionId?: string;
}

// 共通レスポンス形式
interface AIFeatureResponse {
  success: boolean;
  result: string;
  feature: string;
  processingMode: "vertex_direct" | "adk_agent";
  processingTimeMs: number;
  timestamp: string;
  sessionId?: string;
  error?: string;
}
```

## 🚀 AI機能の詳細

### 1. 基本チャット (basic_chat)
- **使用AI**: Vertex AI Direct (Gemini 2.0 Flash)
- **特徴**: 高速レスポンス（平均 < 5秒）、低コスト
- **適用例**: 日常会話、質問回答、簡単な情報収集

### 2. 分析レポート (analysis)
- **使用AI**: Analysis Agent (ADK 1.93.0)
- **特徴**: 高品質分析、構造化出力、複雑な文脈理解
- **適用例**: データ分析、詳細レポート作成、深い洞察
- **ファイル**: `packages/ai-agents/agents/analysis_agent.py`

### 3. UI生成 (ui_generation)
- **使用AI**: UI Generation Agent (ADK 1.93.0)
- **特徴**: HTML/Tailwind生成、DOMPurify安全化、リアルタイムプレビュー
- **適用例**: フォーム、カード、ダッシュボード、ランディングページ
- **ファイル**: `packages/ai-agents/agents/ui_generation_agent.py`

## 🔗 実装済みエンドポイント

| エンドポイント | 機能 | 使用AI | 実装ファイル |
|--------------|------|--------|-------------|
| `POST /api/chat/basic` | 基本チャット | Vertex AI Direct | `src/app/api/chat/basic/route.ts` |
| `POST /api/analysis` | 分析レポート | ADK Analysis Agent | `src/app/api/analysis/route.ts` |
| `POST /api/ui-generation` | UI生成 | ADK UI Generation Agent | `src/app/api/ui-generation/route.ts` |
| `POST /api/images/upload` | 画像アップロード | Cloud Storage | `src/app/api/images/upload/route.ts` |
| `POST /api/agent` | ADK Orchestrator | ADK Multi-Agent | `src/app/api/agent/route.ts` |
| `GET /api/debug` | システムデバッグ | - | `src/app/api/debug/route.ts` |

## 📖 詳細実装ガイド

- **[Agent Engine API](./agent-engine.md)** - ADK実装の完全パターン
- **[実装例](./examples.md)** - 動作確認済みクエリ・レスポンス