# 🔧 AI Chat Starter Kit - 開発ガイド

AI機能の追加・カスタマイズと人間-AI協働開発の完全ガイド

## 🎯 核心概念

### 機能ベースAI選択
```typescript
// システムが入力内容に基づいて最適なAIを選択
"こんにちは" → chat → Vertex AI Direct (高速・3秒以内)
"データを分析して" → analysis → ADK Agent (高品質・詳細)
"UIを作成して" → ui_generation → ADK Agent (専門性・構造化)
```

### 人間-AI協働開発
- **🔴 人間管理**: ビジネスロジック、AI機能設計、重要な意思決定
- **🤖 AI管理**: UIコンポーネント、API実装、ページ実装、繰り返し作業

## 🏗️ プロジェクト構造（最小限・最適化版）

```
AI Chat Starter Kit/
├── packages/frontend/     # Next.js 15.3.1 フロントエンド（機能別分割）
│   └── src/
│       ├── app/           # 📄 Next.js App Router
│       │   ├── api/       # APIエンドポイント
│       │   │   ├── chat/
│       │   │   │   └── route.ts
│       │   │   ├── analysis/
│       │   │   │   └── route.ts
│       │   │   └── ui-generation/
│       │   │       └── route.ts
│       │   ├── simple-chat/       # チャット機能ページ
│       │   │   └── page.tsx
│       │   ├── ai-features/       # 分析レポート機能ページ
│       │   │   └── page.tsx
│       │   ├── ui-builder/        # UI生成機能ページ
│       │   │   └── page.tsx
│       │   ├── content-management/ # コンテンツ管理ページ
│       │   │   └── page.tsx
│       │   ├── layout.tsx
│       │   └── page.tsx
│       ├── components/    # 🎨 UIコンポーネント（機能別分割）
│       │   ├── FeatureCard.tsx
│       │   └── hooks/     # 機能別React Hook
│       │       ├── use-chat.ts
│       │       ├── use-analysis.ts
│       │       └── use-ui-generation.ts
│       └── lib/           # 📚 共通機能（統合）
│           ├── ai-features.ts    # 型定義
│           ├── api.ts           # API型定義  
│           ├── api-client.ts    # クライアント処理
│           ├── apiHelpers.ts    # サーバーヘルパー
│           ├── adk-agent.ts     # ADK Agent処理
│           └── vertex-ai.ts     # Vertex AI処理
├── packages/ai-agents/   # Agent Engine (ADK)
│   └── agents/           # Python AI Agents
└── docs/                # ドキュメント（統合済み）
```

**構造の特徴**：
- **機能別ページ分割** - 各AI機能専用のページとUI
- **Hookアーキテクチャ** - 機能別にHookを分割し関心の分離を実現
- **明確なAPI構造** - App Routerの標準構成
- **機能統合** - lib/に共通機能を統合
- **認知負荷最小** - 開発者が迷わない明確な配置

## 🚀 新機能追加の流れ

### 1. 機能設計（人間）
```typescript
// packages/frontend/src/lib/ai-features.ts
export type AIFeatureType = 
  | "chat"
  | "analysis"
  | "ui_generation"
  | "your_new_feature"; // ← 新機能追加

// 必要に応じて新しいリクエスト/レスポンス型を定義
// packages/frontend/src/lib/api.ts
export interface YourFeatureAPIRequest extends BaseAIRequest {
  // 機能固有のフィールド
}

export interface YourFeatureAPIResponse extends BaseAIResponse {
  result: string; // または適切な型
}
```

### 2. AI選択の判断基準（人間）

| 処理モード | 用途 | 特徴 | 選択基準 |
|-----------|------|------|----------|
| **vertex_direct** | 基本チャット、翻訳、要約 | 高速（<5秒）、低コスト | シンプルな応答、リアルタイム性重視 |
| **adk_agent** | 分析、UI生成、複雑処理 | 高品質（20-45秒）、構造化出力 | 専門性、カスタマイズ、構造化データ |

### 3. API実装（手動）
```typescript
// packages/frontend/src/app/api/your-feature/route.ts
import { NextRequest } from 'next/server';
import { createVertexAIProvider } from '@/lib/vertex-ai';
// または import { processWithADK } from '@/lib/adk-agent';
import { 
  parseRequestBody, 
  createSuccessResponse, 
  createErrorResponse,
  getOrCreateSessionId
} from '@/lib/apiHelpers';
import type { YourFeatureAPIRequest, YourFeatureAPIResponse } from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    const body = await parseRequestBody<YourFeatureAPIRequest>(request);

    // Vertex AI or ADK Agent processing
    const provider = createVertexAIProvider();
    const result = await provider.generateText(body.message);

    const response: YourFeatureAPIResponse = {
      success: true,
      result,
      processingMode: 'vertex_direct',
      processingTimeMs: Date.now() - startTime,
      sessionId: getOrCreateSessionId(body),
      timestamp: new Date().toISOString()
    };
    
    return createSuccessResponse(response);
  } catch (error) {
    return createErrorResponse(error.message, 500);
  }
}
```

### 4. クライアントサイド実装（手動）
```typescript
// packages/frontend/src/lib/api-client.ts に追加
async yourFeature(request: YourFeatureAPIRequest): Promise<YourFeatureAPIResponse> {
  return this.fetchAPI('/api/your-feature', request);
}

// packages/frontend/src/components/ にコンポーネント作成
// - use-ai-feature.ts Hook を使用
// - 'use client' ディレクティブ必須
// - シンプルな状態管理
```

## 🔀 処理パターン詳細

### パターン1: Vertex AI Direct（シンプル）
```typescript
// packages/frontend/src/lib/vertex-ai.ts
import { createVertexAIProvider } from '@/lib/vertex-ai';

// API Route内での使用
export async function POST(request: NextRequest) {
  const provider = createVertexAIProvider();
  const result = await provider.generateText(message);
  // ...
}
```

### パターン2: ADK Agent（シンプル）
```typescript
// packages/frontend/src/lib/adk-agent.ts
import { processAnalysis, processUIGeneration } from '@/lib/adk-agent';

// API Route内での使用
export async function POST(request: NextRequest) {
  const serviceUrl = process.env.ANALYSIS_AGENT_URL;
  const result = await processAnalysis(serviceUrl, message);
  // ...
}
```

### パターン3: クライアントコンポーネント（シンプル）
```typescript
// packages/frontend/src/components/YourComponent.tsx
'use client';

import { useAIFeature } from './use-ai-feature';

function MyComponent() {
  const { execute, response, isLoading } = useAIFeature('analysis');
  
  const handleSubmit = async () => {
    await execute({ message: input });
  };
}
```

## 🎨 ADK Agent作成（高度な機能）

### Python Agent実装
```python
# packages/ai-agents/agents/your_feature_agent.py
from google.adk.agents import LlmAgent

def create_your_feature_agent():
    return LlmAgent(
        name="your_feature_specialist",
        model="gemini-2.0-flash-exp",
        description="機能の専門エージェント",
        instruction="""専門的なシステムプロンプト
        
処理手順：
1. 入力データ解析
2. 専門処理実行
3. 構造化出力生成

出力形式：
JSON形式での構造化データ"""
    )

def create_agent():
    return create_your_feature_agent()
```

### Agent Engine デプロイ
```python
# packages/ai-agents/deploy_your_feature.py
from agents.your_feature_agent import create_your_feature_agent
from vertexai.preview import reasoning_engines

def deploy_agent():
    agent = create_your_feature_agent()
    remote_app = reasoning_engines.ReasoningEngine.create(
        agent,
        requirements=["google-auth", "google-adk[all]"],
        display_name="Your Feature Agent"
    )
    return remote_app
```

## 🔧 型安全性の維持

### API型定義
```typescript
// packages/frontend/src/lib/api.ts

// リクエスト型
export interface YourFeatureRequest extends BaseAPIRequest {
  message: string;
  options?: YourFeatureOptions;
}

// レスポンス型
export interface YourFeatureResponse extends BaseAPIResponse {
  result: YourFeatureResult;
}

// 結果型
export interface YourFeatureResult {
  data: string;
  metadata?: {
    confidence: number;
    processingTime: number;
  };
}
```

## 📋 新機能追加チェックリスト

### 共通（すべての機能）
- [ ] `ai-features.ts` に機能タイプを追加
- [ ] `api.ts` にリクエスト/レスポンス型を追加
- [ ] APIルートを作成（`/api/your-feature/route.ts`）
- [ ] フロントエンドUIを作成
- [ ] FeatureCardに統合

### Vertex AI Direct の場合
- [ ] `vertex-ai.ts` に処理関数を追加（必要に応じて）
- [ ] プロンプト最適化

### ADK Agent の場合
- [ ] `adk-agent.ts` に処理関数を追加
- [ ] Pythonエージェントファイルを作成
- [ ] デプロイスクリプトを作成
- [ ] Agent Engineをデプロイ
- [ ] 環境変数にAgent URLを追加

## 🔍 テスト・デバッグ

### ローカルテスト
```bash
npm run dev
# http://localhost:3000/your-feature でテスト
```

### APIテスト
```bash
curl -X POST http://localhost:3000/api/your-feature \
  -H "Content-Type: application/json" \
  -d '{"message": "テストメッセージ"}'
```

### 型チェック
```bash
npm run type-check
npm run lint
npm run build
```

## 🎯 設計原則

### 人間-AI分業の最適化
1. **設計フェーズ（人間）**
   - 機能要件定義
   - AI選択（vertex_direct vs adk_agent）
   - データ型設計
   - ユーザー体験設計

2. **実装フェーズ（AI）**
   - API Routes実装
   - UIコンポーネント作成
   - エラーハンドリング
   - テストコード作成

### 拡張性の確保
- **疎結合設計**: 各機能の独立性
- **設定駆動**: config.sh・環境変数での調整
- **型安全性**: TypeScript完全対応
- **モジュール設計**: 機能別ディレクトリ構造

### パフォーマンス最適化
- **AI選択最適化**: 用途に応じた適切なAI選択
- **キャッシュ戦略**: レスポンスキャッシュ・セッション管理
- **エラーハンドリング**: タイムアウト・リトライ戦略
- **コスト制御**: インスタンス数・リソース制限

## 📚 実装パターン集

### 基本的なAPI Route実装
```typescript
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await parseRequestBody<YourFeatureRequest>(request);
    validateCommonInput(body);
    
    const result = await processYourFeature(body.message, body.options);
    const processingTime = Date.now() - startTime;
    
    const response: YourFeatureResponse = {
      success: true,
      result: { data: result },
      processingMode: "vertex_direct",
      processingTimeMs: processingTime,
      sessionId: getOrCreateSessionId(body),
      timestamp: new Date().toISOString()
    };
    
    return createSuccessResponse(response);
    
  } catch (error) {
    const message = error instanceof Error ? error.message : 'エラーが発生しました';
    return createErrorResponse(message, 500);
  }
}
```

### 構造化入力の処理
```typescript
// UI生成の例
function createUIGenerationMessage(message: string, options?: UIGenerationOptions): string {
  const structuredMessage = {
    type: "ui_generation",
    user_prompt: message,
    device_type: options?.deviceType ?? "auto"
  };
  return JSON.stringify(structuredMessage);
}
```

## 🚀 次のステップ

- **[API仕様](./API.md)** - 詳細なAPI実装パターン
- **[上級者ガイド](./ADVANCED.md)** - 本格運用・カスタマイズ
- **[クイックスタート](./QUICKSTART.md)** - 基本セットアップ

このガイドに従って、効率的な人間-AI協働開発で新機能を体系的に追加できます。