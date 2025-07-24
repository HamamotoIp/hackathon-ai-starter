# 🤖 Agent Engine API実装パターン完全ガイド

> **⚠️ 重要: このドキュメントは必須参照資料です**  
> Agent Engine関連の実装・デバッグ時は**必ずこのドキュメントを確認**してから作業してください。

## 📋 よくある間違いと正しい実装

### 🚨 **よくある間違い TOP 3**

1. **❌ セッション作成時に`session_id`を送信してしまう**
2. **❌ 自分で生成した`sessionId`を使用してしまう**  
3. **❌ エンドポイント形式（`:query` vs `:streamQuery`）を間違える**

---

## ✅ **正しい実装パターン**

### **Step 1: セッション作成 (必須)**

**エンドポイント:**
```
https://us-central1-aiplatform.googleapis.com/v1/projects/PROJECT_ID/locations/LOCATION/reasoningEngines/ENGINE_ID:query
```

**リクエストボディ (正しい形式):**
```javascript
{
  "class_method": "create_session",
  "input": {
    "user_id": "user-12345"  // user_idのみ。session_idは不要！
  }
}
```

**❌ よくある間違い:**
```javascript
{
  "class_method": "create_session",
  "input": {
    "user_id": "user-12345",
    "session_id": "session-12345"  // ← これは送信してはダメ！
  }
}
```

**成功時のレスポンス:**
```javascript
{
  "output": {
    "id": "7295218418607718400",  // ← これが実際のセッションID
    "userId": "user-12345",
    "state": {},
    "appName": "6360657174498115584",
    "events": []
  }
}
```

**TypeScript実装例:**
```typescript
async function createSession(userId: string, serviceUrl: string): Promise<string> {
  const sessionUrl = serviceUrl.replace(':streamQuery?alt=sse', ':query');
  
  const requestBody = {
    class_method: "create_session",
    input: {
      user_id: userId  // user_idのみ！
    }
  };

  const response = await fetch(sessionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify(requestBody)
  });

  const sessionData = await response.json();
  
  // ✅ Agent Engineが返すIDを使用（重要！）
  return sessionData.output.id;
}
```

### **Step 2: クエリ実行**

**エンドポイント:**
```
https://us-central1-aiplatform.googleapis.com/v1/projects/PROJECT_ID/locations/LOCATION/reasoningEngines/ENGINE_ID:streamQuery?alt=sse
```

**リクエストボディ:**
```javascript
{
  "class_method": "stream_query",
  "input": {
    "message": "参議院選挙の投票率を分析してください",  // 公式ドキュメント通り
    "session_id": "7295218418607718400",  // Step1で取得したID
    "user_id": "user-12345"               // 同じuser_id
  }
}
```

**TypeScript実装例:**
```typescript
async function sendQuery(sessionId: string, userId: string, message: string, serviceUrl: string): Promise<string> {
  const requestBody = {
    class_method: "stream_query",
    input: {
      message: message,       // 公式ドキュメント通り
      session_id: sessionId,  // Step1で取得したセッションID
      user_id: userId
    }
  };

  const response = await fetch(serviceUrl, {  // :streamQuery?alt=sse
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify(requestBody)
  });

  return await response.text();
}
```

---

## 🔄 **完全な実装フローパターン**

```typescript
// 実装例: packages/frontend/src/server/lib/adkAgent.ts

// Analysis専用関数
export async function processAnalysis(
  serviceUrl: string,
  message: string
): Promise<string> {
  try {
    // Step 1: セッション作成
    const sessionId = await createADKSession(serviceUrl);
    
    // Step 2: メッセージ送信（直接）
    const response = await sendADKMessage(serviceUrl, sessionId, message);
    return response;
  } catch (error) {
    throw new Error(`Analysis処理エラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// UI Generation専用関数
export async function processUIGeneration(
  serviceUrl: string,
  message: string
): Promise<string> {
  try {
    // Step 1: セッション作成
    const sessionId = await createADKSession(serviceUrl);
    
    // Step 2: UI生成用の構造化メッセージ作成・送信
    const structuredMessage = createUIGenerationMessage(message);
    const response = await sendADKMessage(serviceUrl, sessionId, structuredMessage);
    return response;
  } catch (error) {
    throw new Error(`UI Generation処理エラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// 共通ヘルパー関数
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
      input: { user_id: userId }  // user_idのみ！
    }
  });

  const sessionData = response.data as { output?: { id?: string } };
  
  if (!sessionData?.output?.id) {
    throw new Error('セッションIDの取得に失敗しました');
  }
  return sessionData.output.id;
}

async function sendADKMessage(
  serviceUrl: string,
  sessionId: string,
  message: string
): Promise<string> {
  const messageUrl = serviceUrl;

  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });

  const client = await auth.getClient();
  const response = await client.request({
    url: messageUrl,
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

---

## 📋 **デバッグ用チェックリスト**

### ✅ **実装前チェック**
- [ ] このドキュメントを確認した
- [ ] セッション作成で`session_id`を送信していない
- [ ] エンドポイントURL形式が正しい（`:query` vs `:streamQuery?alt=sse`）
- [ ] Agent Engineが返すセッションIDを使用している

### ✅ **エラー発生時チェック**
- [ ] 400エラーの場合：リクエストボディ形式を確認
- [ ] 認証エラーの場合：Bearer Tokenが正しいか確認
- [ ] セッション関連エラー：セッション作成→クエリ実行の順序を確認

### ✅ **よくあるエラーメッセージと対処法**

| エラーメッセージ | 原因 | 対処法 |
|------------------|------|--------|
| `FAILED_PRECONDITION` | セッション管理の問題 | セッション作成からやり直す |
| `missing required argument: 'user_id'` | user_idが未設定 | user_idを正しく設定 |
| `Invalid request` | リクエスト形式が間違い | このドキュメントの正しい形式を使用 |

---

## 🎯 **Agent URL設定例**

```bash
# Analysis Agent
ANALYSIS_URL="https://us-central1-aiplatform.googleapis.com/v1/projects/YOUR_PROJECT_NUMBER/locations/us-central1/reasoningEngines/YOUR_ANALYSIS_ENGINE_ID"

# Comparison Agent  
COMPARISON_URL="https://us-central1-aiplatform.googleapis.com/v1/projects/YOUR_PROJECT_NUMBER/locations/us-central1/reasoningEngines/YOUR_COMPARISON_ENGINE_ID"

# UI Generation Agent
UI_GENERATION_URL="https://us-central1-aiplatform.googleapis.com/v1/projects/YOUR_PROJECT_NUMBER/locations/us-central1/reasoningEngines/YOUR_UI_ENGINE_ID"
```

---

## 🚨 **必ず守るべきルール**

1. **セッション作成は毎回必要** - キャッシュしない
2. **Agent Engineが返すセッションIDを使用** - 自分で生成しない
3. **user_idのみでセッション作成** - session_idは送信しない
4. **エンドポイント形式を正確に** - `:query`と`:streamQuery?alt=sse`を使い分ける
5. **エラー時はこのドキュメントを再確認** - 同じ間違いを繰り返さない

---

**📅 最終更新:** 2025年7月21日  
**📋 バージョン:** v1.0.0  
**⚠️ 重要度:** 🔥 必須参照ドキュメント