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
  "query": "渋谷 デート イタリアン"
}
```

**レスポンス:**
```json
{
  "result": "<html>...</html>",
  "processingTimeMs": 8000,
  "success": true
}
```

#### POST /api/restaurant-search/save
記事保存

**リクエスト:**
```json
{
  "title": "記事タイトル",
  "htmlContent": "<html>...</html>",
  "tags": ["渋谷", "デート"]
}
```

**レスポンス:**
```json
{
  "success": true,
  "id": "article-123",
  "storageUrl": "https://storage.googleapis.com/..."
}
```

#### GET /api/restaurant-search/history
保存済み記事一覧

**クエリパラメータ:**
- `limit`: 取得件数（デフォルト: 20）
- `tag`: タグフィルタ
- `keyword`: キーワード検索

**レスポンス:**
```json
{
  "success": true,
  "articles": [
    {
      "id": "article-123",
      "title": "記事タイトル",
      "createdAt": "2025-01-27T12:34:56.789Z",
      "tags": ["渋谷", "デート"],
      "storageUrl": "https://storage.googleapis.com/..."
    }
  ]
}
```

#### GET /api/restaurant-search/saved/[id]
個別記事取得

**レスポンス:**
```json
{
  "success": true,
  "article": {
    "id": "article-123",
    "title": "記事タイトル",
    "htmlContent": "<html>...</html>",
    "createdAt": "2025-01-27T12:34:56.789Z",
    "tags": ["渋谷", "デート"]
  }
}
```

#### PUT /api/restaurant-search/saved/[id]
記事更新

**リクエスト:**
```json
{
  "title": "新しいタイトル",
  "tags": ["新宿", "ランチ"]
}
```

#### DELETE /api/restaurant-search/saved/[id]
記事削除

**レスポンス:**
```json
{
  "success": true,
  "message": "記事が削除されました"
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
  body: JSON.stringify({ query: '渋谷 デート' })
});
const data = await response.json();
```