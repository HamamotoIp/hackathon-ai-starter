# 🚀 新規AI機能追加ガイド

このドキュメントでは、新しいAI機能を追加する際の手順と各ファイルの役割について説明します。

## 📋 概要

新規AI機能を追加する際は、以下の2つのパターンから選択します：

1. **シンプルな機能** → Vertex AI直接呼び出し（高速・軽量）
2. **高度な機能** → ADK Agent Engine（複雑な処理・カスタマイズ）

## 🗂️ ファイル構成と役割

### 1. 型定義の追加

**ファイル:** `/packages/frontend/src/core/types/aiTypes.ts`

```typescript
// 新機能の型を追加
export type AIFeatureType = 
  | "basic_chat"
  | "analysis_report"
  | "ui_generation"
  | "your_new_feature"; // ← 追加

// 機能設定を追加
export const AI_FEATURE_CONFIGS: Record<AIFeatureType, AIFeatureConfig> = {
  // ... 既存の設定
  
  your_new_feature: {
    type: "your_new_feature",
    name: "新機能名",
    description: "新機能の説明",
    processingMode: "adk_agent", // または "vertex_direct"
    maxInputLength: 3000,
    expectedProcessingTime: 20,
    adkEndpoint: "your-feature" // ADK使用時のみ
  }
};
```

### 2. API型定義の追加

**ファイル:** `/packages/frontend/src/core/types/apiTypes.ts`

```typescript
// リクエスト型を追加
export interface YourFeatureAPIRequest extends BaseAPIRequest {
  // 機能特有のフィールドを追加
  additionalField?: string;
}

// レスポンス型を追加
export interface YourFeatureAPIResponse extends BaseAPIResponse {
  result: YourFeatureResult;
}

// 結果型を定義
export interface YourFeatureResult {
  // 機能特有の結果構造
  data: string;
  metadata?: {
    // メタデータ
  };
}
```

### 3. APIルートの作成

**ファイル:** `/packages/frontend/src/app/api/your-feature/route.ts`

#### パターン1: Vertex AI直接呼び出し

```typescript
import { NextRequest } from 'next/server';
import { generateText } from '@/server/lib/vertexAI';
import { 
  parseRequestBody, 
  validateCommonInput, 
  createSuccessResponse, 
  createErrorResponse,
  getOrCreateSessionId
} from '@/server/lib/apiHelpers';
import type { YourFeatureAPIRequest, YourFeatureAPIResponse } from '@/core/types';

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await parseRequestBody<YourFeatureAPIRequest>(request);
    validateCommonInput(body);

    // Vertex AIで処理
    const result = await generateText(body.message);
    const processingTime = Date.now() - startTime;

    const response: YourFeatureAPIResponse = {
      success: true,
      result: {
        data: result
      },
      processingMode: 'vertex_direct',
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

#### パターン2: ADK Agent使用

```typescript
import { NextRequest } from "next/server";
import { processYourFeature } from "@/server/lib/adkAgent"; // 要追加
import { 
  parseRequestBody, 
  validateCommonInput, 
  createSuccessResponse, 
  createErrorResponse,
  getOrCreateSessionId
} from '@/server/lib/apiHelpers';
import type { YourFeatureAPIRequest, YourFeatureAPIResponse } from '@/core/types';

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await parseRequestBody<YourFeatureAPIRequest>(req);
    validateCommonInput(body);

    // ADK Agentで処理
    const serviceUrl = process.env.YOUR_FEATURE_AGENT_URL;
    if (!serviceUrl) {
      throw new Error('YOUR_FEATURE_AGENT_URL環境変数が設定されていません');
    }

    const result = await processYourFeature(serviceUrl, body.message);
    const processingTime = Date.now() - startTime;

    const response: YourFeatureAPIResponse = {
      success: true,
      result: {
        data: result
      },
      processingMode: "adk_agent",
      processingTimeMs: processingTime,
      sessionId: getOrCreateSessionId(body),
      timestamp: new Date().toISOString()
    };
    
    return createSuccessResponse(response);

  } catch (error) {
    const message = error instanceof Error ? error.message : "内部エラーが発生しました";
    return createErrorResponse(message, 500);
  }
}
```

### 4. ADK Agent処理の追加（ADK使用時のみ）

**ファイル:** `/packages/frontend/src/server/lib/adkAgent.ts`

```typescript
/**
 * ADK Agent - Your Feature処理
 */
export async function processYourFeature(
  serviceUrl: string,
  message: string,
  options?: YourFeatureOptions
): Promise<string> {
  if (!serviceUrl) {
    throw new Error('ADK Agent URLが設定されていません');
  }

  try {
    const sessionId = await createADKSession(serviceUrl);
    const structuredMessage = createYourFeatureMessage(message, options);
    const response = await sendADKMessage(serviceUrl, sessionId, structuredMessage);
    return response;
  } catch (error) {
    throw new Error(`Your Feature処理エラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Your Feature用の構造化メッセージ作成
 */
function createYourFeatureMessage(message: string, options?: YourFeatureOptions): string {
  const structuredMessage = {
    type: "your_feature",
    user_prompt: message,
    // 機能特有のパラメータ
    ...options
  };
  return JSON.stringify(structuredMessage);
}
```

### 5. Agent Engineの作成（ADK使用時のみ）

**ファイル:** `/packages/ai-agents/agents/your_feature_agent.py`

```python
"""
Your Feature Agent - 機能説明
機能の詳細説明
"""

from google.adk.agents import LlmAgent
import logging

logger = logging.getLogger(__name__)

def create_your_feature_agent():
    """Your Feature専用エージェントを作成"""
    
    agent = LlmAgent(
        name="your_feature_specialist",
        model="gemini-2.0-flash-exp",
        description="Your Featureの専門エージェント。機能の説明",
        instruction="""あなたはYour Featureの専門家です。

処理手順：
1. ステップ1
2. ステップ2
3. ステップ3

専門能力：
- 能力1
- 能力2
- 能力3

応答原則：
- 日本語で応答する
- 具体的で実用的な結果を提供
- 構造化された出力形式

出力形式：
[必要に応じて定義]"""
    )
    
    logger.info("Your Feature Agent created successfully")
    return agent

def create_agent():
    """ファクトリー関数（Agent Engine デプロイ用）"""
    return create_your_feature_agent()
```

### 6. デプロイスクリプトの作成（ADK使用時のみ）

**ファイル:** `/packages/ai-agents/deploy_your_feature.py`

```python
"""
Your Feature Agent デプロイスクリプト
"""

import os
import sys
from vertexai.generative_models import GenerativeModel
from vertexai.preview import reasoning_engines
from agents.your_feature_agent import create_your_feature_agent

def deploy_your_feature_agent():
    """Your Feature Agentをデプロイ"""
    
    print("🚀 Your Feature Agent デプロイ開始...")
    
    # プロジェクトとロケーション
    project_id = os.getenv('VERTEX_AI_PROJECT_ID')
    location = os.getenv('VERTEX_AI_LOCATION', 'us-central1')
    
    if not project_id:
        raise ValueError("VERTEX_AI_PROJECT_ID環境変数が設定されていません")
    
    # エージェントの作成
    agent = create_your_feature_agent()
    
    # デプロイ設定
    remote_app = reasoning_engines.ReasoningEngine.create(
        agent,
        requirements=[
            "google-auth",
            "google-adk[all]"
        ],
        display_name="Your Feature Agent",
        description="Your Feature処理用の専門エージェント"
    )
    
    print(f"✅ デプロイ完了: {remote_app.resource_name}")
    
    # URLを保存
    with open('your_feature_agent_url.txt', 'w') as f:
        f.write(f"{remote_app._endpoint_uri}:streamQuery?alt=sse")
    
    return remote_app

if __name__ == "__main__":
    try:
        deploy_your_feature_agent()
    except Exception as e:
        print(f"❌ デプロイ失敗: {e}")
        sys.exit(1)
```

### 7. 環境変数の追加

**ファイル:** `.env.production`

```bash
# 既存の環境変数...

# Your Feature Agent URL (ADK使用時のみ)
YOUR_FEATURE_AGENT_URL=https://us-central1-aiplatform.googleapis.com/v1/projects/PROJECT_ID/locations/us-central1/reasoningEngines/AGENT_ID:streamQuery?alt=sse
```

### 8. フロントエンドUIの作成

**ファイル:** `/packages/frontend/src/app/your-feature/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function YourFeaturePage() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<string>('');
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
      if (data.success) {
        setResult(data.result.data);
      } else {
        setResult(`エラー: ${data.error}`);
      }
    } catch (error) {
      setResult('エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Your Feature</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="テキストを入力..."
            className="mb-4"
          />
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !input}
          >
            {loading ? '処理中...' : '実行'}
          </Button>
          
          {result && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <pre className="whitespace-pre-wrap">{result}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

## 📝 チェックリスト

新規AI機能追加時のチェックリスト：

### 共通
- [ ] `aiTypes.ts` に機能タイプを追加
- [ ] `apiTypes.ts` にリクエスト/レスポンス型を追加
- [ ] APIルートを作成 (`/api/your-feature/route.ts`)
- [ ] フロントエンドUIを作成
- [ ] ナビゲーションにリンクを追加

### Vertex AI直接呼び出しの場合
- [ ] `vertexAI.ts` に必要な処理関数を追加（必要に応じて）
- [ ] プロンプトの最適化

### ADK Agent使用の場合
- [ ] `adkAgent.ts` に処理関数を追加
- [ ] Pythonエージェントファイルを作成
- [ ] デプロイスクリプトを作成
- [ ] Agent Engineをデプロイ
- [ ] 環境変数にAgent URLを追加
- [ ] `deploy_all_agents.py` に追加

## 🔧 デバッグとテスト

1. **ローカルテスト**
   ```bash
   npm run dev
   # http://localhost:3000/your-feature でテスト
   ```

2. **APIテスト**
   ```bash
   curl -X POST http://localhost:3000/api/your-feature \
     -H "Content-Type: application/json" \
     -d '{"message": "テストメッセージ"}'
   ```

3. **型チェック**
   ```bash
   npm run type-check
   ```

## 📚 参考資料

- [ADK Agent統合ガイド](./adk-integration.md)
- [Agent Engine API実装パターン](./agent-engine.md)
- [API仕様書](../api/README.md)

---

このガイドに従って、新しいAI機能を体系的に追加できます。