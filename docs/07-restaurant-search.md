# 🍽️ レストラン検索実装

6段階のAI処理による高度な飲食店検索システム

## 🎯 概要

レストラン検索機能は、ADK Sequential Agentを使用した最も複雑な実装例です。ユーザーの自然言語入力から、完全なHTML特集記事を生成し、Cloud Storageに保存します。

## 🏗️ アーキテクチャ

### 6段階のAI処理フロー

```
ユーザー入力「渋谷でデートに使えるイタリアン」
    ↓
1. SimpleIntentAgent
   └→ 検索パラメータ抽出（エリア、シーン、料理ジャンル）
    ↓
2. SimpleSearchAgent
   └→ 2段階Google検索実行
    ↓
3. SimpleSelectionAgent
   └→ 条件に最適な5店舗選定
    ↓
4. SimpleDescriptionAgent
   └→ 魅力的な説明文生成
    ↓
5. SimpleUIAgent
   └→ 1行形式HTML生成（エスケープ問題解決）
    ↓
6. HTMLExtractorAgent
   └→ 純粋な1行HTML最終抽出
```

### データ保存フロー

```
生成完了したHTML
    ↓
自動保存トリガー（フロントエンド）
    ↓
┌─────────────────┬─────────────────┐
│ Cloud Storage   │    Firestore    │
├─────────────────┼─────────────────┤
│ HTMLファイル保存 │ メタデータ保存   │
│ 公開URL生成     │ タグ自動生成     │
│ 年月日構造      │ 検索インデックス │
└─────────────────┴─────────────────┘
```

## 📁 ファイル構成

```
packages/frontend/src/
├── app/api/restaurant-search/
│   ├── route.ts              # AI記事生成
│   ├── save/route.ts         # 保存処理
│   ├── history/route.ts      # 履歴取得
│   └── saved/[id]/route.ts   # CRUD操作
│
├── app/restaurant-search/
│   ├── page.tsx              # ギャラリー表示
│   └── saved/[id]/page.tsx   # 個別記事表示
│
├── lib/
│   ├── adk-agent.ts          # processRestaurantSearch()
│   └── services/
│       └── cloud-restaurant-storage.ts
│
└── types/
    └── saved-result.ts       # 型定義
```

## 🔧 実装詳細

### 1. AI記事生成エンドポイント

```typescript
// app/api/restaurant-search/route.ts
export async function POST(req: NextRequest) {
  const { message } = await req.json();
  
  // ADK Agent処理
  const result = await processRestaurantSearch(
    process.env.RESTAURANT_SEARCH_AGENT_URL!,
    message
  );
  
  // 完全性チェック
  const isComplete = result.includes('<!DOCTYPE html>') 
    && result.includes('</html>');
  
  return Response.json({
    success: true,
    result,
    workflowComplete: isComplete,
    finalAgent: isComplete ? 'SimpleUIAgent' : undefined
  });
}
```

### 2. HTML保存処理

```typescript
// app/api/restaurant-search/save/route.ts
export async function POST(req: NextRequest) {
  const { htmlContent, query, title } = await req.json();
  
  // Cloud Storage保存
  const file = bucket.file(`restaurant-results/${datePath}/result_${id}.html`);
  await file.save(htmlContent, {
    metadata: { contentType: 'text/html; charset=utf-8' }
  });
  
  // 公開URL取得
  await file.makePublic();
  const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
  
  // Firestore保存
  await db.collection('restaurant-results').doc(id).set({
    query,
    htmlStorageUrl: publicUrl,
    title,
    tags: extractTags(query),
    createdAt: new Date(),
    isPublic: true
  });
  
  return Response.json({
    success: true,
    resultId: id,
    htmlUrl: publicUrl
  });
}
```

### 3. タグ自動生成

```typescript
function extractTags(query: string, params?: any): string[] {
  const tags: string[] = [];
  
  // エリアタグ
  if (params?.area) tags.push(`エリア:${params.area}`);
  
  // ジャンル推定
  const genres = {
    'イタリアン': ['イタリアン', 'パスタ', 'ピザ'],
    '和食': ['和食', '日本料理', '寿司'],
    '中華': ['中華', '中国料理']
  };
  
  for (const [genre, keywords] of Object.entries(genres)) {
    if (keywords.some(k => query.includes(k))) {
      tags.push(`ジャンル:${genre}`);
      break;
    }
  }
  
  return tags;
}
```

### 4. フロントエンドギャラリー

```typescript
// app/restaurant-search/page.tsx
export default function RestaurantSearchPage() {
  const [results, setResults] = useState<SavedResult[]>([]);
  const [selectedTag, setSelectedTag] = useState('');
  
  // 新規検索
  const handleSearch = async (message: string) => {
    // 1. AI生成
    const searchRes = await fetch('/api/restaurant-search', {
      method: 'POST',
      body: JSON.stringify({ message })
    });
    
    const data = await searchRes.json();
    
    // 2. 自動保存
    await CloudRestaurantStorage.save({
      htmlContent: data.result,
      query: message,
      title: `レストラン検索 - ${message}`
    });
    
    // 3. 一覧更新
    await loadResults();
  };
  
  return (
    <div className="container">
      {/* 検索フォーム */}
      <SearchForm onSearch={handleSearch} />
      
      {/* フィルター */}
      <TagFilter tags={availableTags} onChange={setSelectedTag} />
      
      {/* 結果ギャラリー */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {results.map(item => (
          <ResultCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
```

## 🔐 セキュリティ設定

### Firestore Rules
```javascript
// firestore.rules
match /restaurant-results/{resultId} {
  // 読み取り: 公開のみ
  allow read: if resource.data.isPublic == true;
  
  // 書き込み: サーバーのみ
  allow write: if false;
}
```

### Storage Rules
```javascript
// storage.rules
match /restaurant-results/{allPaths=**} {
  // 読み取り: 全員
  allow read: if true;
  
  // 書き込み: サーバーのみ
  allow write: if false;
}
```

## 💡 実装のポイント

### 1. エスケープ問題の解決
- エージェント側: 1行形式HTML出力
- フロントエンド側: シンプルなエスケープ除去
- 結果: 綺麗にレンダリングされるHTML

### 2. 自動保存フロー
- 生成完了を自動検出
- バックグラウンドで保存処理
- UIは即座に更新

### 3. パフォーマンス最適化
- 履歴は最大100件表示
- 画像遅延読み込み
- タグによる高速フィルタリング

## 🧪 テスト方法

### ローカルテスト
```bash
# 検索テスト
curl -X POST http://localhost:3000/api/restaurant-search \
  -H "Content-Type: application/json" \
  -d '{"message": "渋谷 イタリアン デート"}'

# 保存テスト
curl -X POST http://localhost:3000/api/restaurant-search/save \
  -H "Content-Type: application/json" \
  -d '{
    "htmlContent": "<!DOCTYPE html>...",
    "query": "渋谷 イタリアン",
    "title": "テスト"
  }'
```

### 環境変数確認
```bash
# 必須環境変数
RESTAURANT_SEARCH_AGENT_URL
VERTEX_AI_PROJECT_ID
RESTAURANT_BUCKET_NAME
```

## 🔍 トラブルシューティング

### よくある問題

**保存に失敗する**
```bash
# バケット作成
gsutil mb gs://${PROJECT_ID}-restaurant-results

# 公開設定
gsutil iam ch allUsers:objectViewer gs://${PROJECT_ID}-restaurant-results
```

**Firestore権限エラー**
```bash
# IAM権限追加
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/datastore.user"
```

**HTML表示エラー**
- エスケープ文字が表示される → cleanHTMLContent関数確認
- 文字化け → UTF-8エンコーディング確認

## 📚 関連ドキュメント

- [API仕様](./03-api-reference.md#post-apirestaurant-search) - エンドポイント詳細
- [AI機能追加](./06-ai-features.md) - 実装パターン
- [アーキテクチャ](./02-architecture.md) - システム設計