# 📡 API仕様

## 基本情報

- **ベースURL**: 
  - ローカル: `http://localhost:3000`
  - 本番: `https://your-app.run.app`
- **認証**: なし
- **形式**: JSON
- **アーキテクチャ**: 機能別に整理されたlibディレクトリ構造
  - `lib/features/{chat,analysis,tourism-spots}/` - 機能別モジュール
  - `lib/core/{adk,api,utils}/` - 共通処理
  - `lib/types/` - 共通型定義

## エンドポイント一覧

### チャット機能

#### POST /api/chat
基本チャット（Vertex AI Direct）

**リクエスト:**
```json
{
  "message": "こんにちは",
  "sessionId": "user-123"
}
```

**レスポンス:**
```json
{
  "message": "こんにちは！",
  "processingTimeMs": 2150,
  "sessionId": "user-123"
}
```

### AI機能

#### POST /api/analysis
分析レポート生成（ADK Analysis Agent）

**リクエスト:**
```json
{
  "message": "分析したいテキスト",
  "sessionId": "user-123"
}
```

**レスポンス:**
```json
{
  "success": true,
  "result": "# 分析結果サマリー\n・主要な発見事項...\n\n## 詳細分析\n...",
  "processingMode": "adk_agent",
  "processingTimeMs": 5000,
  "sessionId": "user-123",
  "timestamp": "2025-08-03T12:34:56.789Z"
}
```


### 観光スポット検索

#### POST /api/tourism-spots
観光スポット特集記事生成（ADK Tourism Spots Search Agent - 6段階処理）

**処理フロー**:
1. SimpleIntentAgent: ユーザー入力から検索パラメータ抽出
2. SimpleSearchAgent: 固定観光スポットデータ取得
3. SimpleSelectionAgent: 条件に最適な5スポット選定
4. SimpleDescriptionAgent: 魅力的な説明文生成
5. SimpleUIAgent: 美しいHTML記事生成
6. HTMLExtractorAgent: 最終HTML抽出

**リクエスト:**
```json
{
  "message": "東京 歴史 春"
}
```

**レスポンス:**
```json
{
  "success": true,
  "result": "<html>...</html>",
  "processingMode": "adk_agent",
  "processingTimeMs": 8000,
  "sessionId": "user-123",
  "timestamp": "2025-08-03T12:34:56.789Z",
  "workflowComplete": true,
  "finalAgent": "SimpleUIAgent"
}
```

#### POST /api/tourism-spots/save
記事保存

**リクエスト:**
```json
{
  "htmlContent": "<html>...</html>",
  "query": "東京 歴史 春",
  "searchParams": {},
  "title": "東京で歴史を感じられる春の観光スポット特集",
  "processingTimeMs": 8000
}
```

**レスポンス:**
```json
{
  "success": true,
  "resultId": "550e8400-e29b-41d4-a716-446655440000",
  "url": "/tourism-spots/saved/550e8400-e29b-41d4-a716-446655440000",
  "htmlUrl": "https://storage.googleapis.com/project-tourism-spots-results/tourism-spots-results/2025/08/03/result_550e8400-e29b-41d4-a716-446655440000.html",
  "title": "東京で歴史を感じられる春の観光スポット特集"
}
```

#### GET /api/tourism-spots/history
保存済み記事一覧

**クエリパラメータ:**
- `limit`: 取得件数（デフォルト: 10、最大: 100）
- `tag`: タグフィルタ（例: "エリア:東京"）
- `search`: キーワード検索（クエリとタイトルで検索）

**レスポンス:**
```json
{
  "success": true,
  "results": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "東京で歴史を感じられる春の観光スポット特集",
      "query": "東京 歴史 春",
      "createdAt": "2025-08-03T12:34:56.789Z",
      "updatedAt": "2025-08-03T12:34:56.789Z",
      "tags": ["エリア:東京", "カテゴリ:歴史", "季節:春"],
      "htmlStorageUrl": "https://storage.googleapis.com/...",
      "metadata": {
        "processingTimeMs": 8000,
        "agentVersion": "1.0.0"
      }
    }
  ],
  "availableTags": ["エリア:東京", "カテゴリ:歴史", "季節:春"],
  "totalCount": 10
}
```

#### GET /api/tourism-spots/saved/[id]
個別記事取得

**リクエスト:**
```
GET /api/tourism-spots/saved/550e8400-e29b-41d4-a716-446655440000
```

**レスポンス:**
```json
{
  "success": true,
  "result": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "東京で歴史を感じられる春の観光スポット特集",
    "htmlContent": "<html>...</html>",
    "query": "東京 歴史 春",
    "createdAt": "2025-08-03T12:34:56.789Z",
    "updatedAt": "2025-08-03T12:34:56.789Z",
    "metadata": {
      "processingTimeMs": 8000,
      "agentVersion": "1.0.0"
    }
  }
}
```

#### PUT /api/tourism-spots/saved/[id]
記事更新（タイトル変更）

**リクエスト:**
```json
{
  "title": "新しいタイトル"
}
```

**レスポンス:**
```json
{
  "success": true,
  "message": "タイトルを更新しました"
}
```

#### DELETE /api/tourism-spots/saved/[id]
記事削除

**レスポンス:**
```json
{
  "success": true,
  "message": "記事を削除しました"
}
```

## エラーレスポンス

```json
{
  "success": false,
  "error": "エラーメッセージ",
  "statusCode": 400
}
```

## 使用例

### フロントエンドからの呼び出し

**推奨方法: APIクライアント使用**
```typescript
import { apiClient } from '@/lib/core/api/client';

// チャット
const chatResponse = await apiClient.basicChat({ 
  message: 'こんにちは' 
});

// 分析
const analysisResponse = await apiClient.analysis({ 
  message: '分析したいデータ' 
});
```

**直接fetch使用例**
```typescript
// チャット
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'こんにちは' })
});
const data = await response.json();

// 観光スポット検索
const response = await fetch('/api/tourism-spots', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: '東京 歴史' })
});
const data = await response.json();

// 検索結果を保存（CloudTourismSpotsStorageクラス使用推奨）
import { CloudTourismSpotsStorage } from '@/lib/features/tourism-spots/tourism-storage';

const storage = new CloudTourismSpotsStorage();
const saveResult = await storage.save({
  htmlContent: data.result,
  query: '東京 歴史',
  title: '東京で歴史を感じられる観光スポット特集',
  processingTimeMs: data.processingTimeMs
});

// 履歴を取得
const history = await storage.getHistory({ limit: 10 });
```

## 型定義の場所

```typescript
// 共通型
import type { BaseAIRequest, BaseAIResponse } from '@/lib/types/api-common';

// チャット型
import type { BasicChatAPIResponse } from '@/lib/features/chat/types';

// 分析型
import type { AnalysisAPIResponse } from '@/lib/features/analysis/types';

// 観光スポット検索型
import type { 
  TourismSpotsSearchAPIResponse, 
  SavedTourismSpotsResult 
} from '@/lib/features/tourism-spots/types';
```

## 新しいAPI機能追加の開発フロー

### 概要
新しいAI機能をAPIからフロントエンド画面まで統合するための段階的な開発手順です。

### 1. 機能設計・エージェント開発
```bash
# 1-1. 新機能用ディレクトリ作成
mkdir packages/ai-agents/new_feature_agent
cd packages/ai-agents/new_feature_agent

# 1-2. エージェント実装
# agent.py, __init__.py を作成
# ADK標準構造に従って実装

# 1-3. ローカルテスト
adk web new_feature_agent  # Web UIで動作確認
adk run new_feature_agent  # CLI で動作確認

# 1-4. デプロイスクリプト作成
# packages/ai-agents/deploy/deploy_new_feature.py
```

### 2. フロントエンド統合（段階的実装）

#### Phase 1: 基本構造作成
```bash
# 2-1. 機能別ディレクトリ作成
mkdir packages/frontend/src/lib/features/new-feature
mkdir packages/frontend/src/app/api/new-feature
mkdir packages/frontend/src/app/new-feature
```

#### Phase 2: 型定義
```typescript
// packages/frontend/src/lib/features/new-feature/types.ts
import type { BaseAIRequest, BaseAIResponse } from '@/lib/types/api-common';

// リクエスト型
export interface NewFeatureRequest extends BaseAIRequest {
  specificParam?: string;
}

// レスポンス型
export interface NewFeatureAPIResponse extends BaseAIResponse {
  result: string;
  metadata?: {
    processingSteps: string[];
    confidence: number;
  };
}

// 保存データ型
export interface SavedNewFeatureResult {
  id: string;
  title: string;
  query: string;
  result: string;
  createdAt: string;
  updatedAt?: string;
}
```

#### Phase 3: ADK処理層
```typescript
// packages/frontend/src/lib/features/new-feature/adk-processor.ts
/**
 * New Feature Agent処理
 */
import { createADKSession, sendADKMessage } from '@/lib/core/adk/client';

export async function processNewFeature(
  serviceUrl: string,
  message: string
): Promise<string> {
  if (!serviceUrl) {
    throw new Error('New Feature Agent URLが設定されていません');
  }

  const sessionId = await createADKSession(serviceUrl);
  const response = await sendADKMessage(serviceUrl, sessionId, message);
  
  return response;
}
```

#### Phase 4: API Route実装
```typescript
// packages/frontend/src/app/api/new-feature/route.ts
import { NextRequest } from "next/server";
import { processNewFeature } from "@/lib/features/new-feature/adk-processor";
import { 
  parseRequestBody, 
  createSuccessResponse, 
  createErrorResponse,
  getOrCreateSessionId
} from '@/lib/core/api/helpers';
import type { BaseAIRequest } from '@/lib/types/api-common';
import type { NewFeatureAPIResponse } from '@/lib/features/new-feature/types';

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await parseRequestBody<BaseAIRequest>(req);

    const serviceUrl = process.env.NEW_FEATURE_AGENT_URL;
    if (!serviceUrl) {
      throw new Error('NEW_FEATURE_AGENT_URL環境変数が設定されていません');
    }

    const result = await processNewFeature(serviceUrl, body.message);
    const processingTime = Date.now() - startTime;

    const response: NewFeatureAPIResponse = {
      success: true,
      result,
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

#### Phase 5: APIクライアント拡張
```typescript
// packages/frontend/src/lib/core/api/client.ts に追加
import type { NewFeatureAPIResponse, NewFeatureRequest } from '@/lib/features/new-feature/types';

class APIClient {
  // 既存メソッド...

  async newFeature(request: NewFeatureRequest): Promise<NewFeatureAPIResponse> {
    const response = await fetch('/api/new-feature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
}
```

#### Phase 6: ストレージサービス（必要に応じて）
```typescript
// packages/frontend/src/lib/features/new-feature/storage.ts
export class NewFeatureStorage {
  static async save(data: SaveNewFeatureRequest): Promise<SaveNewFeatureResponse> {
    const response = await fetch('/api/new-feature/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error ?? '保存に失敗しました');
    }

    return response.json();
  }

  static async getHistory(options?: GetHistoryOptions): Promise<HistoryResponse> {
    const params = new URLSearchParams();
    if (options?.limit) params.set('limit', options.limit.toString());
    
    const response = await fetch(`/api/new-feature/history?${params}`);
    if (!response.ok) {
      throw new Error('履歴の取得に失敗しました');
    }

    return response.json();
  }
}
```

#### Phase 7: React画面実装
```typescript
// packages/frontend/src/app/new-feature/page.tsx
'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/core/api/client';
import type { NewFeatureAPIResponse } from '@/lib/features/new-feature/types';

export default function NewFeaturePage() {
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    setIsProcessing(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await apiClient.newFeature({ message });
      setResult(response.result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '処理に失敗しました';
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">🆕 新機能</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <div>
          <label htmlFor="message" className="block text-sm font-medium mb-2">
            メッセージを入力してください
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="例：○○を処理してください"
            rows={3}
            disabled={isProcessing}
            className="w-full p-3 border rounded-lg disabled:bg-gray-100"
          />
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        
        <button
          type="submit"
          disabled={isProcessing || !message.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
        >
          {isProcessing ? '処理中...' : '実行'}
        </button>
      </form>

      {result && (
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">処理結果</h2>
          <div className="prose max-w-none">
            <pre className="whitespace-pre-wrap">{result}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
```

### 3. 環境設定・デプロイ

#### 3-1. エージェントデプロイ
```bash
# エージェントをデプロイ
cd packages/ai-agents
python deploy/deploy_new_feature.py

# URL確認
cat new_feature_agent_url.txt
```

#### 3-2. 環境変数設定
```bash
# deploy-frontend.sh に追加
[ -f "../packages/ai-agents/new_feature_agent_url.txt" ] && NEW_FEATURE_URL=$(cat ../packages/ai-agents/new_feature_agent_url.txt)

# 環境変数に追加
[ -n "$NEW_FEATURE_URL" ] && ENV_VARS="$ENV_VARS,NEW_FEATURE_AGENT_URL=$NEW_FEATURE_URL"
```

#### 3-3. フロントエンドデプロイ
```bash
# フロントエンドデプロイ
./scripts/deploy-frontend.sh
```

### 4. テスト・動作確認

#### 4-1. 型チェック・ビルド
```bash
cd packages/frontend
npm run type-check
npm run lint
npm run build
```

#### 4-2. 機能テスト
```bash
# 1. APIエンドポイントテスト（curl）
curl -X POST https://your-app.run.app/api/new-feature \
  -H "Content-Type: application/json" \
  -d '{"message": "テストメッセージ"}'

# 2. フロントエンド画面テスト
# ブラウザで /new-feature にアクセス

# 3. エラーハンドリング確認
# 無効なリクエストで正しくエラーが表示されるかテスト
```

### 5. ドキュメント更新

#### 5-1. API仕様書更新
```markdown
# docs/API.md に追加
### 新機能

#### POST /api/new-feature
新機能の処理実行

**リクエスト:**
```json
{
  "message": "処理内容",
  "specificParam": "特定パラメータ"
}
```

**レスポンス:**
```json
{
  "success": true,
  "result": "処理結果",
  "processingTimeMs": 5000,
  "metadata": {
    "processingSteps": ["step1", "step2"],
    "confidence": 0.95
  }
}
```
```

#### 5-2. README更新
```markdown
# README.md の機能一覧に追加
- **🆕 新機能** - 新しいAI処理機能

# アーキテクチャ図に追加
🤖 AI Agents
├── Analysis Agent
├── Tourism Spots Search Agent
└── New Feature Agent
```

### ベストプラクティス

1. **段階的開発**: エージェント → API → 画面の順で段階的に実装
2. **型安全性**: TypeScriptの型定義を最初に作成
3. **エラーハンドリング**: 各層で適切なエラーハンドリングを実装
4. **テスト駆動**: curl でのAPIテスト → 画面テストの順で確認
5. **ドキュメント同期**: 実装と同時にドキュメントを更新