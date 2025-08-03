# 🤖 新規AIエージェント開発ガイド

**ADK Agent Engine を使用した新しいAIエージェント追加の完全ガイド**

## 🎯 概要

このプロジェクトに新しいAIエージェントを追加する開発者向けの実践的なガイドです。既存の `Analysis Agent` と `Tourism Spots Search Agent` の成功パターンを活用して、効率的にエージェントを開発・統合できます。

## 📋 事前準備・要件定義

### 1. 機能要件の明確化
```markdown
# エージェント仕様書（例）
- **目的**: 何を解決するエージェントか
- **入力**: どのようなクエリを受け取るか
- **処理**: どのような処理を行うか（単一処理 vs 多段階処理）
- **出力**: どのような形式で結果を返すか（テキスト/HTML/JSON）
- **レスポンス時間**: 期待される処理時間（5秒 vs 30秒）
```

### 2. 既存エージェントパターンの選択

#### パフォーマンス重視 - Analysis Agent パターン
```python
# 特徴
- 単一LlmAgent構成
- テキスト出力
- 20-30秒処理
- 複雑な分析・レポート生成向け
```

#### 複雑処理 - Tourism Spots Agent パターン  
```python
# 特徴
- 6段階エージェント構成（Intent→Search→Selection→Description→UI→Extract）
- HTML出力（1行形式）
- 15-25秒処理
- 段階的データ処理・UI生成向け
```

### 3. 技術選択指針
```python
# HTML出力の場合（必須対応）
- 1行形式HTML生成
- 静的Tailwind CSS使用
- エスケープ問題対策

# データ処理の場合
- 固定データ vs 外部API
- キャッシュ戦略
- エラーハンドリング
```

## 🛠️ エージェント実装

### 1. ディレクトリ構造作成
```bash
# エージェント用ディレクトリ作成
mkdir packages/ai-agents/new_feature_agent
cd packages/ai-agents/new_feature_agent

# 必要ファイル作成
touch agent.py
touch __init__.py
```

### 2. 基本エージェント実装（Analysis Agent パターン）
```python
# packages/ai-agents/new_feature_agent/agent.py
from google.adk.agents import LlmAgent

# シンプルな単一エージェント
root_agent = LlmAgent(
    name="new_feature_specialist",
    model="gemini-2.0-flash-exp",
    description="新機能の専門処理エージェント",
    instruction="""
あなたは新機能の専門エージェントです。

## 処理内容
[具体的な処理内容を詳細に記述]

## 出力形式
[期待される出力形式を明確に指定]

## 制約事項
[処理上の制約や注意点を記載]
"""
)
```

### 3. 複雑エージェント実装（Tourism Spots パターン）
```python
# packages/ai-agents/new_feature_agent/agent.py
from google.adk.agents import LlmAgent, Workflow

# ステップ1: 入力解析エージェント
intent_agent = LlmAgent(
    name="intent_classifier",
    model="gemini-2.0-flash-exp",
    instruction="ユーザー入力から処理パラメータを抽出する"
)

# ステップ2: データ処理エージェント
processor_agent = LlmAgent(
    name="data_processor", 
    model="gemini-2.0-flash-exp",
    instruction="抽出されたパラメータに基づいてデータを処理する"
)

# ステップ3: 出力生成エージェント
output_agent = LlmAgent(
    name="output_generator",
    model="gemini-2.0-flash-exp",
    instruction="処理結果を指定された形式で出力する"
)

# ワークフロー定義
root_agent = Workflow(
    name="NewFeatureWorkflow",
    agents=[intent_agent, processor_agent, output_agent]
)
```

### 4. HTML出力エージェントの注意点
```python
# HTML生成エージェント（重要: エスケープ問題対策）
html_agent = LlmAgent(
    name="html_generator",
    model="gemini-2.0-flash-exp",
    instruction="""
⚠️ 重要な指示：
1. HTMLは必ず1行形式で出力（改行文字\\nは使用禁止）
2. すべてのタグと内容を1行に連結する
3. 静的Tailwind CSS CDNを使用:
   <link href="https://unpkg.com/tailwindcss@3.4.1/dist/tailwind.min.css" rel="stylesheet">
4. JavaScriptは使用禁止

HTMLは必ず1行にまとめて、改行やインデントは含めないでください。
例: <!DOCTYPE html><html><head><title>タイトル</title></head><body>...</body></html>
"""
)
```

### 5. `__init__.py` 設定
```python
# packages/ai-agents/new_feature_agent/__init__.py
from . import agent
```

## 🏠 ローカル開発・テスト

### 1. 仮想環境セットアップ
```bash
cd packages/ai-agents

# 仮想環境確認（既存の場合）
source venv/bin/activate

# 依存関係インストール（初回のみ）
pip install -r requirements.txt
```

### 2. ADK標準コマンドでテスト
```bash
# Web UIでエージェントテスト
adk web new_feature_agent
# → http://localhost:8000 でGUI操作

# ターミナルで対話実行
adk run new_feature_agent
```

### 3. テストクエリの準備
```bash
# テスト用クエリを事前に準備
echo "テスト用のクエリ1" > test_queries.txt
echo "エラーケースのクエリ" >> test_queries.txt
echo "境界値のクエリ" >> test_queries.txt
```

### 4. デバッグツール活用
```bash
# 詳細ログ付きデバッグサーバー
python debug/debug_server.py

# 自動テスト実行
python debug/test_agents.py
```

## 🚀 デプロイ・統合

### 1. デプロイスクリプト作成
```python
# packages/ai-agents/deploy/deploy_new_feature.py
import os
import sys
from google.cloud import aiplatform_v1
from google.api_core import client_options

def deploy_new_feature_agent():
    """新機能エージェントをデプロイ"""
    
    project_id = os.getenv('VERTEX_AI_PROJECT_ID')
    location = os.getenv('VERTEX_AI_LOCATION', 'us-central1')
    
    if not project_id:
        print("❌ VERTEX_AI_PROJECT_ID not found")
        sys.exit(1)
    
    print(f"🚀 New Feature Agent デプロイ開始...")
    print(f"📍 Project: {project_id}, Region: {location}")
    
    try:
        # Agent Engineデプロイ処理
        # [実際のデプロイロジックを実装]
        
        agent_url = f"https://{location}-aiplatform.googleapis.com/v1/projects/{project_id}/locations/{location}/reasoningEngines/[ENGINE_ID]:streamQuery?alt=sse"
        
        # URLをファイルに保存
        with open('new_feature_agent_url.txt', 'w') as f:
            f.write(agent_url)
        
        print(f"✅ デプロイ完了")
        print(f"📡 URL: {agent_url}")
        
    except Exception as e:
        print(f"❌ デプロイ失敗: {e}")
        sys.exit(1)

if __name__ == "__main__":
    deploy_new_feature_agent()
```

### 2. 並列デプロイスクリプトに追加
```bash
# scripts/deploy-agents-parallel.sh に追加
deploy_agent "deploy_new_feature.py" &
```

### 3. 環境変数設定
```bash
# scripts/deploy-frontend.sh に追加
[ -f "../packages/ai-agents/new_feature_agent_url.txt" ] && NEW_FEATURE_URL=$(cat ../packages/ai-agents/new_feature_agent_url.txt)

# 環境変数に追加
[ -n "$NEW_FEATURE_URL" ] && ENV_VARS="$ENV_VARS,NEW_FEATURE_AGENT_URL=$NEW_FEATURE_URL"
```

## 🔧 フロントエンド連携

### 1. 機能別ディレクトリ作成
```bash
mkdir packages/frontend/src/lib/features/new-feature
mkdir packages/frontend/src/app/api/new-feature  
mkdir packages/frontend/src/app/new-feature
```

### 2. 型定義作成
```typescript
// packages/frontend/src/lib/features/new-feature/types.ts
import type { BaseAIRequest, BaseAIResponse } from '@/lib/types/api-common';

export interface NewFeatureRequest extends BaseAIRequest {
  // エージェント固有のパラメータ
  specificParam?: string;
}

export interface NewFeatureAPIResponse extends BaseAIResponse {
  result: string;
  // エージェント固有のレスポンス項目
  metadata?: {
    processingSteps?: string[];
    confidence?: number;
  };
}
```

### 3. ADK処理層実装
```typescript
// packages/frontend/src/lib/features/new-feature/adk-processor.ts
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

### 4. API Route実装
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

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await parseRequestBody(req);
    const serviceUrl = process.env.NEW_FEATURE_AGENT_URL;
    
    if (!serviceUrl) {
      throw new Error('NEW_FEATURE_AGENT_URL環境変数が設定されていません');
    }

    const result = await processNewFeature(serviceUrl, body.message);
    const processingTime = Date.now() - startTime;

    return createSuccessResponse({
      success: true,
      result,
      processingMode: "adk_agent",
      processingTimeMs: processingTime,
      sessionId: getOrCreateSessionId(body),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : "内部エラーが発生しました";
    return createErrorResponse(message, 500);
  }
}
```

### 5. React画面実装
```typescript
// packages/frontend/src/app/new-feature/page.tsx
'use client';

import { useState } from 'react';

export default function NewFeaturePage() {
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/new-feature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      
      const data = await response.json();
      setResult(data.result);
    } catch (error) {
      console.error('処理エラー:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">🆕 新機能</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="メッセージを入力してください"
          rows={3}
          disabled={isProcessing}
          className="w-full p-3 border rounded-lg"
        />
        
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

## 📊 運用・メンテナンス

### 1. パフォーマンス監視
```bash
# レスポンス時間測定
time curl -X POST https://your-app.run.app/api/new-feature \
  -H "Content-Type: application/json" \
  -d '{"message": "テストクエリ"}'
```

### 2. ログ確認
```bash
# Cloud Runログ確認
gcloud logging read 'resource.type="cloud_run_revision"' \
  --filter='textPayload:"new-feature"' \
  --limit=20

# Agent Engineログ確認  
gcloud logging read 'resource.type="reasoning_engine"' \
  --limit=20
```

### 3. エラーハンドリングの改善
```typescript
// エラーパターンの追加
try {
  const result = await processNewFeature(serviceUrl, message);
  return result;
} catch (error) {
  // 具体的なエラー対応
  if (error.message.includes('timeout')) {
    throw new Error('処理がタイムアウトしました。しばらく後に再実行してください。');
  } else if (error.message.includes('rate_limit')) {
    throw new Error('リクエスト制限に達しました。1分後に再実行してください。');
  } else {
    throw new Error(`処理エラー: ${error.message}`);
  }
}
```

## 🎯 成功のポイント

### 1. 段階的開発
1. **ローカルでエージェント動作確認**
2. **単体デプロイテスト**
3. **フロントエンド統合**
4. **本番テスト**

### 2. 既存パターンの活用
- Analysis Agent: シンプルな処理向け
- Tourism Spots Agent: 複雑な多段階処理向け
- HTML出力: 1行形式＋静的CSS必須

### 3. 品質保証
```bash
# 開発完了前の確認事項
npm run type-check  # TypeScript型チェック
npm run build       # ビルド確認
curl テスト          # API動作確認
```

### 4. ドキュメント更新
- `README.md` の機能一覧に追加
- `docs/API.md` のエンドポイント一覧に追加
- エージェント固有のREADME作成

---

**🚀 このガイドに従って、高品質なAIエージェントを効率的に開発しましょう！**