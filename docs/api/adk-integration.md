# 🤖 ADK Agent統合ガイド

## 概要

このドキュメントでは、AI Chat Starter KitにおけるGoogle Agent Development Kit (ADK) エージェントとの統合について詳しく説明します。

## ADK Agentアーキテクチャ

```
Frontend → API Route → adkAgent.ts → ADK Agent Engine → Vertex AI
```

### 統合フロー

1. **フロントエンドリクエスト**: ユーザーがUI上で分析・UI生成を要求
2. **APIルート処理**: `/api/analysis` または `/api/ui-generation` が受信
3. **ADK呼び出し**: `adkAgent.ts`でADK Agent Engineにリクエスト
4. **セッション管理**: ADKセッションの作成・管理
5. **レスポンス処理**: SSE形式レスポンスの解析・変換
6. **結果返却**: フロントエンドに構造化されたデータを返却

## 実装詳細

### 1. セッション作成

```typescript
// adkAgent.ts:52-77
async function createADKSession(serviceUrl: string): Promise<string> {
  const sessionUrl = serviceUrl.replace(':streamQuery?alt=sse', ':query');
  const userId = 'demo-user';

  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });

  const client = await auth.getClient();
  const response = await client.request({
    url: sessionUrl,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: {
      class_method: 'create_session',
      input: { user_id: userId }
    }
  });

  const sessionData = response.data as { output?: { id?: string } };
  if (!sessionData?.output?.id) {
    throw new Error('セッションIDの取得に失敗しました');
  }
  return sessionData.output.id;
}
```

**重要なポイント**:
- URLの変換: `:streamQuery?alt=sse` → `:query`
- Google認証の使用
- レスポンスからセッションIDを抽出: `response.data.output.id`

### 2. メッセージ送信とストリーミング

```typescript
// adkAgent.ts:82-118
async function sendADKMessage(
  serviceUrl: string,
  sessionId: string,
  message: string
): Promise<string> {
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });

  const client = await auth.getClient();
  const response = await client.request({
    url: serviceUrl,
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream'
    },
    data: {
      class_method: 'stream_query',
      input: {
        message,
        session_id: sessionId,
        user_id: 'demo-user'
      }
    },
    responseType: 'text'
  });

  return parseADKResponse(response.data as string);
}
```

**重要なポイント**:
- ストリーミングエンドポイントを使用
- `Accept: text/event-stream` ヘッダー
- `responseType: 'text'` でテキストとして受信
- `class_method: 'stream_query'` でストリーミング実行

### 3. レスポンス解析

```typescript
// adkAgent.ts:133-176
function parseADKResponse(responseData: string): string {
  try {
    // SSE形式のレスポンスを解析
    const lines = responseData.split('\n');
    const dataLines = lines.filter(line => line.startsWith('data: '));
    
    if (dataLines.length === 0) {
      return responseData; // SSE形式でない場合はそのまま返す
    }

    // すべてのデータラインから内容を結合
    let fullMessage = '';
    
    for (const line of dataLines) {
      const jsonData = line.replace('data: ', '').trim();
      
      if (jsonData === '[DONE]') {
        break;
      }
      
      try {
        const parsedData = JSON.parse(jsonData);
        // 複数のフィールド名に対応
        const content = parsedData.message ?? parsedData.response ?? 
                       parsedData.content ?? parsedData.text ?? parsedData.output;
        if (content) {
          fullMessage += content;
        }
      } catch {
        // JSON解析に失敗したラインはスキップ
      }
    }
    
    return fullMessage || responseData;
  } catch {
    return responseData;
  }
}
```

**重要なポイント**:
- Server-Sent Events (SSE) 形式の解析
- 複数のJSONラインを結合
- `[DONE]` で終了を検出
- 複数のフィールド名に対応（柔軟性）

## API統合パターン

### 分析API (`/api/analysis`)

```typescript
// analysis/route.ts:30-51
const result = await processAnalysis(serviceUrl, body.message as string);

// ADKレスポンスがJSON文字列の場合、パースして実際のテキストを抽出
let finalResult = result;
try {
  const parsed = JSON.parse(result);
  if (parsed.content?.parts?.[0]?.text) {
    finalResult = parsed.content.parts[0].text;
  }
} catch {
  // JSONパースに失敗した場合はそのまま使用
}

return createSuccessResponse({
  success: true,
  result: finalResult,
  processingMode: "adk_agent",
  processingTimeMs: processingTime,
  sessionId: getOrCreateSessionId(body),
  timestamp: new Date().toISOString()
});
```

### UI生成API (`/api/ui-generation`)

```typescript
// ui-generation/route.ts:35-99
try {
  // ADKレスポンスを解析
  const adkResponse = JSON.parse(result);
  
  // content.parts[0].textからコンテンツを取得
  if (adkResponse.content?.parts?.[0]?.text) {
    const contentText = adkResponse.content.parts[0].text;
    
    // コードブロック内のJSONを抽出
    const jsonMatch = contentText.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch?.[1]) {
      const parsedContent = JSON.parse(jsonMatch[1]);
      uiResult = {
        html: parsedContent.html,
        metadata: parsedContent.metadata || defaultMetadata
      };
    }
  }
}
```

## 環境設定

### 必要な環境変数

```bash
# .env.production
VERTEX_AI_PROJECT_ID=your-gcp-project-id
VERTEX_AI_LOCATION=us-central1
ANALYSIS_AGENT_URL=https://us-central1-aiplatform.googleapis.com/v1/projects/PROJECT_ID/locations/us-central1/reasoningEngines/ANALYSIS_AGENT_ID:streamQuery?alt=sse
UI_GENERATION_AGENT_URL=https://us-central1-aiplatform.googleapis.com/v1/projects/PROJECT_ID/locations/us-central1/reasoningEngines/UI_AGENT_ID:streamQuery?alt=sse
SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
```

### Agent Engine URLの構造

```
https://LOCATION-aiplatform.googleapis.com/v1/projects/PROJECT_ID/locations/LOCATION/reasoningEngines/AGENT_ID:streamQuery?alt=sse
```

- `LOCATION`: `us-central1`, `us-east1` など
- `PROJECT_ID`: GCPプロジェクトID
- `AGENT_ID`: デプロイされたAgent EngineのリソースID
- `:streamQuery?alt=sse`: ストリーミングエンドポイント

## デバッグとトラブルシューティング

### 1. 認証エラー

```bash
# Google認証の確認
gcloud auth application-default login
gcloud config set project YOUR_PROJECT_ID

# サービスアカウントキーの確認
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
```

### 2. ADKレスポンスの確認

開発環境では、一時的にレスポンスをログ出力：

```typescript
// 一時的なデバッグログ（本番では削除）
if (process.env.NODE_ENV !== 'production') {
  console.log('ADK Response:', response.data);
}
```

### 3. よくあるエラー

| エラー | 原因 | 解決方法 |
|--------|------|----------|
| `セッションIDの取得に失敗` | ADK Agentが正しくデプロイされていない | Agent Engineの状態確認 |
| `403 Forbidden` | 認証権限不足 | IAMロールの確認 |
| `404 Not Found` | Agent URL が不正 | URLの形式・Agent IDを確認 |
| `タイムアウト` | Agent処理時間が長い | タイムアウト値の調整 |

### 4. パフォーマンス最適化

- **セッション再利用**: 同一ユーザーでセッションIDをキャッシュ
- **並列処理**: 複数リクエストの並列実行
- **レスポンス圧縮**: 大きなHTMLレスポンスの圧縮
- **エラーリトライ**: 一時的なエラーのリトライ機構

## セキュリティ考慮事項

### 1. 認証・認可

- Google Cloudサービスアカウントの適切な権限設定
- 最小権限の原則に基づくIAMロール
- 認証情報の環境変数による管理

### 2. 入力サニタイゼーション

```typescript
// 入力検証の例
export function validateCommonInput(body: Record<string, unknown>): void {
  if (!body.message || typeof body.message !== 'string') {
    throw new Error('メッセージが必要です');
  }
  
  // 文字数制限
  if (body.message.length > 5000) {
    throw new Error('メッセージが長すぎます');
  }
  
  // 悪意のあるコード検出
  if (body.message.includes('<script>')) {
    throw new Error('無効な入力です');
  }
}
```

### 3. レスポンス処理

- JSONインジェクション対策
- XSS対策（HTMLエスケープ）
- 機密情報の除去

## 拡張と改良

### 1. 新しいAI機能の追加

1. 新しいAgent Engineをデプロイ
2. 環境変数に新しいAgent URLを追加
3. `adkAgent.ts`に新しい処理関数を追加
4. API Routeを作成
5. フロントエンドUI作成

### 2. ストリーミングレスポンス

リアルタイムでレスポンスを表示する場合：

```typescript
// ストリーミング対応の例（今後の改良案）
export async function* streamADKResponse(serviceUrl: string, message: string) {
  // Server-Sent Eventsをstreamとして処理
  for (const chunk of responseStream) {
    yield parseChunk(chunk);
  }
}
```

### 3. キャッシュ機構

```typescript
// レスポンスキャッシュの例
const cache = new Map<string, string>();

export async function processAnalysisWithCache(serviceUrl: string, message: string): Promise<string> {
  const cacheKey = `analysis:${hashMessage(message)}`;
  
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }
  
  const result = await processAnalysis(serviceUrl, message);
  cache.set(cacheKey, result);
  
  return result;
}
```

---

このドキュメントにより、開発者はADK Agent統合の仕組みを理解し、効果的にカスタマイズ・拡張できるようになります。