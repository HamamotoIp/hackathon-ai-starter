# 📡 API リファレンス

AI Chat Starter Kit の全エンドポイント仕様

## 🎯 概要

### 基本情報
- **ベースURL**: 
  - ローカル: `http://localhost:3000`
  - 本番: `https://your-app.run.app`
- **認証**: なし（ハッカソン向け）
- **形式**: JSON
- **文字エンコード**: UTF-8

### 共通レスポンスフィールド
```json
{
  "success": true,
  "processingTimeMs": 1234,
  "timestamp": "2025-01-27T12:34:56.789Z",
  "sessionId": "user-session-123"
}
```

## 🤖 AI機能エンドポイント

### POST /api/chat
基本的なチャット機能（Vertex AI Direct使用）

**リクエスト:**
```json
{
  "message": "こんにちは、今日の天気は？",
  "sessionId": "user-123"  // 任意
}
```

**レスポンス:**
```json
{
  "message": "こんにちは！申し訳ありませんが...",
  "processingTimeMs": 2150,
  "sessionId": "user-123"
}
```

**特徴:**
- 応答速度: 2-5秒
- 最大入力: 2000文字
- 用途: 日常会話、簡単な質問

### POST /api/analysis
データ分析・レポート生成（ADK Agent使用）

**リクエスト:**
```json
{
  "message": "売上データを分析してレポートを作成",
  "sessionId": "user-123"
}
```

**レスポンス:**
```json
{
  "success": true,
  "result": "## 売上分析レポート\n\n### 概要\n...",
  "processingMode": "adk_agent",
  "processingTimeMs": 23456,
  "timestamp": "2025-01-27T12:34:56.789Z"
}
```

**特徴:**
- 応答速度: 20-30秒
- 最大入力: 5000文字
- 用途: 詳細分析、構造化レポート

### POST /api/ui-generation
UI/HTML生成（ADK Agent使用）

**リクエスト:**
```json
{
  "message": "ログインフォームを作成",
  "options": {
    "deviceType": "mobile"  // "mobile" | "desktop" | "auto"
  },
  "sessionId": "user-123"
}
```

**レスポンス:**
```json
{
  "success": true,
  "result": {
    "html": "<!DOCTYPE html>\n<html>...</html>",
    "metadata": {
      "deviceType": "mobile",
      "responsive": true
    }
  },
  "processingMode": "adk_agent",
  "processingTimeMs": 18500
}
```

**特徴:**
- 応答速度: 15-25秒
- Tailwind CSS使用
- レスポンシブ対応

### POST /api/restaurant-search
レストラン検索・特集記事生成（ADK Sequential Agent使用）

**リクエスト:**
```json
{
  "message": "渋谷でデートに使えるイタリアン",
  "sessionId": "user-123"
}
```

**レスポンス:**
```json
{
  "success": true,
  "result": "<!DOCTYPE html><html>...完全なHTML記事...</html>",
  "processingMode": "adk_agent",
  "processingTimeMs": 35000,
  "workflowComplete": true,
  "finalAgent": "SimpleUIAgent"
}
```

**特徴:**
- 6段階のAI処理
- 完全なHTML記事生成
- 自動保存対応

## 🗄️ データ管理エンドポイント

### POST /api/restaurant-search/save
検索結果の保存

**リクエスト:**
```json
{
  "htmlContent": "<!DOCTYPE html>...",
  "query": "渋谷 イタリアン",
  "searchParams": {
    "area": "渋谷",
    "scene": "デート"
  },
  "title": "タイトル",
  "processingTimeMs": 35000
}
```

**レスポンス:**
```json
{
  "success": true,
  "resultId": "uuid-here",
  "url": "/restaurant-search/saved/uuid-here",
  "htmlUrl": "https://storage.googleapis.com/...",
  "title": "タイトル"
}
```

### GET /api/restaurant-search/history
保存済み結果一覧

**パラメータ:**
- `limit`: 最大取得数（デフォルト: 10、最大: 100）
- `tag`: タグフィルター
- `search`: キーワード検索

**レスポンス:**
```json
{
  "success": true,
  "results": [...],
  "totalCount": 15,
  "availableTags": ["エリア:渋谷", "ジャンル:イタリアン"]
}
```

### GET /api/restaurant-search/saved/[id]
個別結果取得

### PATCH /api/restaurant-search/saved/[id]
メタデータ更新

**リクエスト:**
```json
{
  "title": "新しいタイトル",
  "tags": ["タグ1", "タグ2"]
}
```

### DELETE /api/restaurant-search/saved/[id]
結果削除

## 📷 画像管理エンドポイント

### POST /api/images/upload
画像アップロード

**リクエスト:**
- Content-Type: `multipart/form-data`
- フィールド名: `image`
- 最大サイズ: 5MB
- 対応形式: JPEG, PNG, GIF, WebP

**レスポンス:**
```json
{
  "success": true,
  "url": "https://storage.googleapis.com/...",
  "filename": "uploaded-file.jpg",
  "size": 123456,
  "contentType": "image/jpeg"
}
```

## 🔍 デバッグエンドポイント

### GET /api/debug
システム情報取得（開発環境のみ）

**レスポンス:**
```json
{
  "environment": "development",
  "services": {
    "vertexAI": true,
    "adkAgent": true,
    "storage": true
  },
  "timestamp": "2025-01-27T12:34:56.789Z"
}
```

## 📊 エラーレスポンス

### 共通エラー形式
```json
{
  "success": false,
  "error": "エラーメッセージ",
  "code": "ERROR_CODE",
  "details": {
    // 追加情報
  }
}
```

### エラーコード
- `400`: 不正なリクエスト
- `404`: リソースが見つからない
- `413`: ペイロードが大きすぎる
- `429`: レート制限
- `500`: サーバーエラー
- `503`: サービス利用不可

## 💡 使用例

### TypeScript/JavaScript
```typescript
// 基本的なチャット
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'こんにちは',
    sessionId: 'user-123'
  })
});

const data = await response.json();
console.log(data.message);
```

### cURL
```bash
# レストラン検索
curl -X POST http://localhost:3000/api/restaurant-search \
  -H "Content-Type: application/json" \
  -d '{"message": "渋谷 イタリアン"}'
```

## 🔧 Tips

### パフォーマンス最適化
- セッションIDを使用して会話履歴を維持
- 長文入力は事前に要約
- 画像は事前にリサイズ

### エラーハンドリング
```typescript
try {
  const response = await fetch('/api/analysis', {
    method: 'POST',
    body: JSON.stringify({ message }),
    signal: AbortSignal.timeout(60000) // 60秒タイムアウト
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  return data;
} catch (error) {
  console.error('API呼び出しエラー:', error);
}
```

## 📚 関連ドキュメント

- [アーキテクチャ](./02-architecture.md) - システム設計
- [開発ガイド](./05-development.md) - 実装詳細
- [トラブルシューティング](./08-troubleshooting.md) - 問題解決