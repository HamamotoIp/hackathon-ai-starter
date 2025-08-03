# 📡 API仕様

## 基本情報

- **ベースURL**: 
  - ローカル: `http://localhost:3000`
  - 本番: `https://your-app.run.app`
- **認証**: なし
- **形式**: JSON

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
  "input": "分析したいテキスト"
}
```

**レスポンス:**
```json
{
  "result": "分析結果",
  "processingTimeMs": 5000,
  "success": true
}
```

#### POST /api/ui-generation
UI生成（ADK UI Generation Agent）

**リクエスト:**
```json
{
  "description": "ログインフォーム",
  "deviceType": "desktop"
}
```

**レスポンス:**
```json
{
  "html": "<div>...</div>",
  "processingTimeMs": 4000,
  "success": true
}
```

### レストラン検索

#### POST /api/restaurant-search
レストラン特集記事生成

**リクエスト:**
```json
{
  "message": "渋谷 デート イタリアン"
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

#### POST /api/restaurant-search/save
記事保存

**リクエスト:**
```json
{
  "htmlContent": "<html>...</html>",
  "query": "渋谷 デート イタリアン",
  "searchParams": {},
  "title": "渋谷でデートに使えるイタリアンレストラン特集",
  "processingTimeMs": 8000
}
```

**レスポンス:**
```json
{
  "success": true,
  "resultId": "550e8400-e29b-41d4-a716-446655440000",
  "url": "/restaurant-search/saved/550e8400-e29b-41d4-a716-446655440000",
  "htmlUrl": "https://storage.googleapis.com/project-restaurant-results/restaurant-results/2025/08/03/result_550e8400-e29b-41d4-a716-446655440000.html",
  "title": "渋谷でデートに使えるイタリアンレストラン特集"
}
```

#### GET /api/restaurant-search/history
保存済み記事一覧

**クエリパラメータ:**
- `limit`: 取得件数（デフォルト: 10、最大: 100）
- `tag`: タグフィルタ（例: "エリア:渋谷"）
- `search`: キーワード検索（クエリとタイトルで検索）

**レスポンス:**
```json
{
  "success": true,
  "results": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "渋谷でデートに使えるイタリアンレストラン特集",
      "query": "渋谷 デート イタリアン",
      "createdAt": "2025-08-03T12:34:56.789Z",
      "updatedAt": "2025-08-03T12:34:56.789Z",
      "tags": ["エリア:渋谷", "シーン:デート", "ジャンル:イタリアン"],
      "htmlStorageUrl": "https://storage.googleapis.com/...",
      "metadata": {
        "processingTimeMs": 8000,
        "agentVersion": "1.0.0"
      }
    }
  ],
  "availableTags": ["エリア:渋谷", "シーン:デート", "ジャンル:イタリアン"],
  "totalCount": 10
}
```

#### GET /api/restaurant-search/saved/[id]
個別記事取得（未実装）

**注意:** この機能は現在実装されていません。個別記事の表示はフロントエンドで直接Cloud StorageとFirestoreから取得しています。

#### PUT /api/restaurant-search/saved/[id]
記事更新（未実装）

**注意:** この機能は現在実装されていません。タイトル更新はフロントエンドで直接Firestoreを更新しています。

#### DELETE /api/restaurant-search/saved/[id]
記事削除（未実装）

**注意:** この機能は現在実装されていません。削除処理はフロントエンドで直接Cloud StorageとFirestoreから削除しています。

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

```typescript
// チャット
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'こんにちは' })
});
const data = await response.json();

// レストラン検索
const response = await fetch('/api/restaurant-search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: '渋谷 デート' })
});
const data = await response.json();

// 検索結果を保存
const saveResponse = await fetch('/api/restaurant-search/save', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    htmlContent: data.result,
    query: '渋谷 デート',
    title: '渋谷のデートスポット特集',
    processingTimeMs: data.processingTimeMs
  })
});
const saveData = await saveResponse.json();

// 履歴を取得
const historyResponse = await fetch('/api/restaurant-search/history?limit=10');
const historyData = await historyResponse.json();
```