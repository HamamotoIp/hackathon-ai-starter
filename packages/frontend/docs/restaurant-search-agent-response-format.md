# レストラン検索API仕様（統合版）

## 📋 重要な更新

**このドキュメントは統合されました。**

最新の完全なAPI仕様は以下をご参照ください：
- **[📡 メインAPI仕様書](../docs/API.md)** - 全APIエンドポイント統合版

## 📍 クイックリファレンス

レストラン検索関連のAPIエンドポイント：
- `POST /api/restaurant-search` - レストラン特集記事生成
- `POST /api/restaurant-search/save` - 検索結果保存
- `GET /api/restaurant-search/history` - 検索履歴取得
- `GET /api/restaurant-search/saved/[id]` - 個別結果取得
- `PATCH /api/restaurant-search/saved/[id]` - 結果更新
- `DELETE /api/restaurant-search/saved/[id]` - 結果削除

## 🔄 移行済み情報

以下の詳細情報は **[📡 メインAPI仕様書](../docs/API.md)** に統合されました：

- ✅ 完全なAPI仕様とサンプルコード
- ✅ TypeScript型定義
- ✅ エラーハンドリング詳細
- ✅ データ構造仕様
- ✅ セキュリティ制限
- ✅ SDK使用例（JavaScript/Python/curl）

## 🚀 すぐに始める

```javascript
// レストラン検索 + 自動保存の例
async function searchAndSave(query) {
  // 1. 記事生成
  const searchResult = await fetch('/api/restaurant-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: query })
  });
  
  const data = await searchResult.json();
  
  // 2. 自動保存
  if (data.success) {
    await fetch('/api/restaurant-search/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        htmlContent: data.result,
        query: query,
        title: `レストラン検索: ${query}`,
        processingTimeMs: data.processingTimeMs
      })
    });
  }
}
```

## API エンドポイント

### 1. 検索API（既存）
```
POST /api/restaurant-search
```

**リクエスト**:
```json
{
  "message": "銀座でビジネス会食に使える和食のお店を探している",
  "sessionId": "optional-session-id"
}
```

**レスポンス**:
```json
{
  "success": true,
  "result": "<!DOCTYPE html><html>...</html>",
  "processingMode": "adk_agent",
  "processingTimeMs": 18900,
  "sessionId": "generated-session-id",
  "timestamp": "2025-01-27T12:34:56.789Z",
  "workflowComplete": true,      // HTMLの完全性チェック結果
  "finalAgent": "SimpleUIAgent"   // workflowCompleteがtrueの場合のみ存在
}
```

**備考**:
- `workflowComplete`: HTMLが`<!DOCTYPE html>`で始まり`</html>`で終わる場合にtrue
- `finalAgent`: 現在は"SimpleUIAgent"または"unknown"を返す

### 2. 保存API（新規）
```
POST /api/restaurant-search/save
```

**リクエスト**:
```json
{
  "htmlContent": "<!DOCTYPE html><html>...</html>",
  "query": "銀座でビジネス会食に使える和食のお店",
  "searchParams": {
    "area": "銀座",
    "scene": "ビジネス",
    "time": "ディナー",
    "requests": ["和食"]
  },
  "title": "銀座 和食 ビジネス会食特集",
  "processingTimeMs": 18900
}
```

**レスポンス**:
```json
{
  "success": true,
  "resultId": "550e8400-e29b-41d4-a716-446655440000",  // UUID v4形式
  "url": "/restaurant-search/saved/550e8400-e29b-41d4-a716-446655440000",
  "htmlUrl": "https://storage.googleapis.com/{project-id}-restaurant-results/restaurant-results/2025/01/27/result_550e8400-e29b-41d4-a716-446655440000.html",
  "title": "銀座 和食 ビジネス会食特集"
}
```

**セキュリティ制限**:
- HTMLコンテンツ: 最大1MB
- クエリ: 最大1000文字
- タグは自動生成（エリア、シーン、時間、ジャンル）

### 3. 履歴取得API（新規）
```
GET /api/restaurant-search/history?limit=10&tag=和食&search=銀座
```

**レスポンス**:
```json
{
  "success": true,
  "results": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "query": "銀座でビジネス会食に使える和食のお店",
      "searchParams": {
        "area": "銀座",
        "scene": "ビジネス",
        "time": "ディナー",
        "requests": ["和食"]
      },
      "htmlStorageUrl": "https://storage.googleapis.com/{project-id}-restaurant-results/restaurant-results/2025/01/27/result_550e8400-e29b-41d4-a716-446655440000.html",
      "title": "銀座 和食 ビジネス会食特集",
      "createdAt": "2025-01-27T12:34:56.789Z",
      "updatedAt": "2025-01-27T12:34:56.789Z",
      "tags": ["エリア:銀座", "シーン:ビジネス", "時間:ディナー", "ジャンル:和食"],
      "isPublic": true,  // ハッカソン用にデフォルトtrue
      "metadata": {
        "processingTimeMs": 18900,
        "agentVersion": "1.0.0"
      }
    }
  ],
  "totalCount": 1,
  "availableTags": ["エリア:銀座", "シーン:ビジネス", "時間:ディナー", "ジャンル:和食"]
}
```

**備考**:
- タグフィルターはFirestoreのarray-containsクエリを使用
- キーワード検索はクライアント側でフィルタリング（query, titleの部分一致）

### 4. 個別結果操作API（新規）

#### GET - 個別結果取得
```
GET /api/restaurant-search/saved/[id]
```

**レスポンス**:
```json
{
  "success": true,
  "result": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "query": "銀座でビジネス会食に使える和食のお店",
    "searchParams": { /* ... */ },
    "htmlStorageUrl": "https://storage.googleapis.com/...",
    "title": "銀座 和食 ビジネス会食特集",
    "createdAt": "2025-01-27T12:34:56.789Z",
    "updatedAt": "2025-01-27T12:34:56.789Z",
    "tags": ["エリア:銀座", "シーン:ビジネス"],
    "isPublic": true,
    "metadata": { /* ... */ }
  }
}
```

#### PATCH - タイトル/タグ更新
```
PATCH /api/restaurant-search/saved/[id]
```

**リクエスト**:
```json
{
  "title": "新しいタイトル",
  "tags": ["新しいタグ1", "新しいタグ2"]  // オプション
}
```

#### DELETE - 削除
```
DELETE /api/restaurant-search/saved/[id]
```

**備考**: Firestoreのドキュメントのみ削除。Cloud Storageのファイルは保持される。

## データ構造

### Firestore メタデータ構造

**コレクション**: `restaurant-results`

```typescript
interface SavedRestaurantResult {
  id: string;                    // ドキュメントID (UUID v4)
  query: string;                 // 元の検索クエリ
  searchParams: {                // 検索パラメータ
    area?: string;
    scene?: string;
    time?: string;
    requests?: string[];
  };
  htmlStorageUrl: string;        // Cloud Storage URL
  title: string;                 // 表示タイトル
  createdAt: string;            // 作成日時 (ISO 8601)
  updatedAt: string;            // 更新日時 (ISO 8601)
  tags: string[];               // タグ配列（自動生成）
  isPublic: boolean;            // 公開設定（デフォルトtrue）
  metadata: {                   // メタデータ
    processingTimeMs: number;
    agentVersion: string;       // "1.0.0"
  };
}
```

### Cloud Storage ファイル構造

```
gs://[project-id]-restaurant-results/
├── restaurant-results/
│   ├── 2025/
│   │   ├── 01/
│   │   │   ├── 27/
│   │   │   │   ├── result_550e8400-e29b-41d4-a716-446655440000.html
│   │   │   │   └── ...
│   │   │   └── ...
│   │   └── ...
│   └── ...
```

**バケット名**: `{VERTEX_AI_PROJECT_ID}-restaurant-results` または環境変数`BUCKET_NAME`で指定

## フロントエンド実装

### CloudRestaurantStorage クラス

```typescript
import { CloudRestaurantStorage } from '@/lib/services/cloud-restaurant-storage';

// 検索結果を保存
const saveResponse = await CloudRestaurantStorage.save({
  htmlContent: htmlResult,
  query: searchQuery,
  searchParams: { area: "銀座", scene: "ビジネス" },
  title: "カスタムタイトル",
  processingTimeMs: 18900
});

// 履歴を取得
const history = await CloudRestaurantStorage.getHistory({
  limit: 20,
  tag: "和食",
  search: "銀座"
});

// 個別結果を取得
const result = await CloudRestaurantStorage.getById("result_id");

// HTMLコンテンツを直接取得
const htmlContent = await CloudRestaurantStorage.getHtmlContent(result.htmlStorageUrl);
```

### 表示パターン

1. **履歴一覧**: Firestoreメタデータから一覧表示
2. **詳細表示**: Cloud StorageからHTMLを取得してレンダリング
3. **フィルタリング**: タグや検索キーワードで絞り込み

## Phase 2 への展望

Phase 2では以下の機能を実装予定：

### エージェントレスポンス解析機能

```typescript
// Phase 2で実装予定の機能
interface AgentResponseData {
  intentAnalysis: SearchParams;      // SimpleIntentAgent出力
  searchResults: RestaurantData[];   // SimpleSearchAgent出力  
  selectedRestaurants: Restaurant[]; // SimpleSelectionAgent出力
  descriptions: Description[];       // SimpleDescriptionAgent出力
  finalHtml: string;                // SimpleUIAgent出力
}
```

### 段階的レスポンス表示

```typescript
// リアルタイムでエージェントの進行状況を表示
function displayAgentProgress(response: AgentResponseData) {
  showIntentAnalysis(response.intentAnalysis);
  showSearchResults(response.searchResults);
  showSelectedRestaurants(response.selectedRestaurants);
  showDescriptions(response.descriptions);
  renderFinalHtml(response.finalHtml);
}
```

## トラブルシューティング

### Phase 1 関連の問題

1. **保存に失敗する**
   - 原因：Cloud Storage権限不足またはFirestore接続エラー
   - 解決：IAM設定とサービスアカウントキーを確認

2. **HTMLが表示されない**
   - 原因：Cloud Storage URLにアクセスできない
   - 解決：バケットの公開設定またはCORS設定を確認

3. **履歴が取得できない**
   - 原因：Firestoreセキュリティルールまたはインデックス不足
   - 解決：セキュリティルールとインデックスを確認

### デバッグ用ログ

```typescript
console.log('[DEBUG] Saving result:', { query, htmlLength: htmlContent.length });
console.log('[DEBUG] Storage URL:', htmlStorageUrl);
console.log('[DEBUG] Firestore doc:', firestoreDoc);
```

## 環境変数

### 必須環境変数
- `RESTAURANT_SEARCH_AGENT_URL`: ADK Agentのエンドポイント
- `VERTEX_AI_PROJECT_ID`: Google Cloud プロジェクトID

### オプション環境変数
- `BUCKET_NAME`: Cloud Storageバケット名（デフォルト: `{VERTEX_AI_PROJECT_ID}-restaurant-results`）

## 更新履歴

- **2025-02-01**: 実装に合わせてドキュメント全面更新
- **2025-01-31**: Phase 1アーキテクチャに更新（Cloud Storage + Firestore実装）
- **2025-01-27**: 初版作成（エージェントレスポンス解析ベース）