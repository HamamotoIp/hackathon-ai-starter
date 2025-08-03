# 🚀 AI機能追加ガイド

新しいAI機能を追加する詳細な手順

## 📋 概要

AI機能は2つのパターンから選択：

1. **シンプルな機能** → Vertex AI Direct（高速・軽量）
2. **高度な機能** → ADK Agent Engine（複雑処理・カスタマイズ）

## 🛠️ 実装手順

### Step 1: 型定義の追加

```typescript
// lib/types/ai-features.ts
export type AIFeatureType = 
  | "basic_chat"
  | "analysis"
  | "ui_generation"
  | "translation";  // 新機能

export const AI_FEATURE_CONFIGS = {
  translation: {
    type: "translation",
    name: "翻訳",
    description: "多言語翻訳機能",
    processingMode: "vertex_direct",
    maxInputLength: 2000,
    expectedProcessingTime: 5
  }
};
```

### Step 2: APIエンドポイント作成

#### Vertex AI Directパターン

```typescript
// app/api/translation/route.ts
import { NextRequest } from 'next/server';
import { generateText } from '@/lib/vertex-ai';
import { 
  parseRequestBody, 
  createSuccessResponse, 
  createErrorResponse 
} from '@/lib/api-helpers';

export async function POST(req: NextRequest) {
  try {
    const body = await parseRequestBody(req);
    
    // プロンプト作成
    const prompt = `Translate to English: ${body.message}`;
    
    // Vertex AI呼び出し
    const result = await generateText(prompt);
    
    return createSuccessResponse({
      result,
      processingMode: "vertex_direct"
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
```

#### ADK Agentパターン

```typescript
// app/api/advanced-feature/route.ts
export async function POST(req: NextRequest) {
  try {
    const body = await parseRequestBody(req);
    
    // Agent URL確認
    const serviceUrl = process.env.ADVANCED_AGENT_URL;
    if (!serviceUrl) {
      throw new Error('Agent URLが未設定');
    }
    
    // ADK処理
    const result = await processAdvancedFeature(
      serviceUrl, 
      body.message
    );
    
    return createSuccessResponse({
      result,
      processingMode: "adk_agent"
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
```

### Step 3: ADK Agent実装（高度な機能のみ）

```typescript
// lib/adk-agent.ts に追加
export async function processAdvancedFeature(
  serviceUrl: string,
  message: string
): Promise<string> {
  const sessionId = await createADKSession(serviceUrl);
  const structuredMessage = {
    type: "advanced_feature",
    user_prompt: message
  };
  
  return await sendADKMessage(
    serviceUrl, 
    sessionId, 
    JSON.stringify(structuredMessage)
  );
}
```

```python
# packages/ai-agents/agents/advanced_agent.py
from google.adk.agents import LlmAgent

def create_advanced_agent():
    return LlmAgent(
        name="advanced_specialist",
        model="gemini-2.0-flash-exp",
        description="高度な処理の専門エージェント",
        instruction="""
        あなたは高度な処理の専門家です。
        
        処理手順：
        1. 入力を分析
        2. 最適な処理を実行
        3. 構造化された結果を返す
        
        応答は必ず日本語で行ってください。
        """
    )
```

### Step 4: UI実装

```typescript
// app/your-feature/page.tsx
'use client';

import { useState } from 'react';

export default function YourFeaturePage() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/your-feature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });
      
      const data = await response.json();
      setResult(data.result);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Your Feature</h1>
      
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="w-full p-4 border rounded"
        rows={4}
        placeholder="入力してください..."
      />
      
      <button
        onClick={handleSubmit}
        disabled={loading || !input}
        className="mt-4 px-6 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {loading ? '処理中...' : '実行'}
      </button>
      
      {result && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <pre className="whitespace-pre-wrap">{result}</pre>
        </div>
      )}
    </div>
  );
}
```

## 🍽️ 実装例: レストラン検索

複雑な機能の実装例として、レストラン検索機能があります。

### 特徴
- 6段階のAI処理（Sequential Agent）
- Cloud Storage + Firestore統合
- 複数APIエンドポイント
- ギャラリー表示UI

### ファイル構成
```
app/api/restaurant-search/
├── route.ts              # AI記事生成
├── save/route.ts         # 保存処理
├── history/route.ts      # 履歴取得
└── saved/[id]/route.ts   # CRUD操作

app/restaurant-search/
├── page.tsx              # ギャラリー
└── saved/[id]/page.tsx   # 個別表示
```

## ✅ チェックリスト

### 基本実装
- [ ] 型定義追加（ai-features.ts）
- [ ] APIルート作成
- [ ] UIページ作成
- [ ] ナビゲーション追加

### Vertex AI使用時
- [ ] プロンプト最適化
- [ ] エラーハンドリング

### ADK Agent使用時
- [ ] ADK処理関数追加
- [ ] Pythonエージェント作成
- [ ] デプロイスクリプト作成
- [ ] 環境変数設定

### 高度な機能
- [ ] Cloud Storage統合
- [ ] Firestore統合
- [ ] 複数エンドポイント
- [ ] 専用サービスクラス

## 🧪 テスト方法

### ローカルテスト
```bash
npm run dev
# http://localhost:3000/your-feature
```

### API直接テスト
```bash
curl -X POST http://localhost:3000/api/your-feature \
  -H "Content-Type: application/json" \
  -d '{"message": "テスト"}'
```

### 型チェック
```bash
npm run type-check
```

## 💡 ベストプラクティス

1. **エラーハンドリング**: 常に適切なエラーメッセージを返す
2. **タイムアウト設定**: 長時間処理には適切なタイムアウト
3. **入力検証**: 最大文字数と内容の検証
4. **レスポンス標準化**: 共通のレスポンス形式を使用

## 🔍 デバッグ

### ログ確認
```typescript
console.log('Request:', body);
console.log('Response:', result);
```

### エラー詳細
```typescript
catch (error) {
  console.error('詳細エラー:', error);
  return createErrorResponse(
    error instanceof Error ? error.message : 'Unknown error',
    500
  );
}
```

## 📚 関連ドキュメント

- [開発ガイド](./05-development.md) - 全体的な開発手順
- [API仕様](./03-api-reference.md) - エンドポイント詳細
- [アーキテクチャ](./02-architecture.md) - システム設計