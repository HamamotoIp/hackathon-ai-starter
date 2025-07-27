# レストラン検索機能 実装ドキュメント

## 概要

AI Chat Starter Kitに追加された飲食店検索機能の実装について説明します。この機能は、ユーザーの要望に基づいて最適なレストランを推薦し、美しいHTMLフォーマットで特集記事を生成します。

## アーキテクチャ

```
┌─────────────────┐     ┌─────────────────┐     ┌───────────────────┐
│   Frontend      │────▶│    API Route    │────▶│  Agent Engine     │
│  (Next.js)      │     │ restaurant-     │     │ (Vertex AI)       │
│                 │◀────│    search       │◀────│                   │
└─────────────────┘     └─────────────────┘     └───────────────────┘
                              │
                              ▼
                        ┌──────────────┐
                        │   config.sh  │
                        │ (環境変数)   │
                        └──────────────┘
```

## 実装詳細

### 1. エージェント実装

**ファイル**: `packages/ai-agents/restaurant_search_agent/agent.py`

```python
from google.adk.agents import LlmAgent

root_agent = LlmAgent(
    name="restaurant_search_specialist",
    model="gemini-2.0-flash-exp",
    description="ユーザーの要望に基づいてレストランを検索し、HTMLで特集記事を生成するエージェント",
    instruction="""[詳細な指示...]"""
)
```

**主な特徴**:
- Gemini 2.0 Flash Expモデルを使用
- HTMLを直接生成（コードブロックなし）
- 5つのレストランを推薦
- レスポンシブデザイン対応

### 2. フロントエンド実装

#### APIルート
**ファイル**: `packages/frontend/src/app/api/restaurant-search/route.ts`

```typescript
export async function POST(req: NextRequest) {
  const serviceUrl = process.env.RESTAURANT_SEARCH_AGENT_URL;
  if (!serviceUrl) {
    throw new Error('RESTAURANT_SEARCH_AGENT_URL環境変数が設定されていません。config.shを使って環境変数を設定してください。');
  }
  
  const result = await processRestaurantSearch(serviceUrl, body.message);
  // ...
}
```

**重要な変更**:
- ローカルフォールバック機能を完全削除
- 環境変数が設定されていない場合は明確なエラー

#### UIコンポーネント
**ファイル**: `packages/frontend/src/app/restaurant-search/page.tsx`

```typescript
export default function RestaurantSearchPage() {
  const { query, setQuery, result, isLoading, error, search, clear } = useRestaurantSearch();
  // レストラン検索UI実装
}
```

#### カスタムフック
**ファイル**: `packages/frontend/src/components/hooks/use-restaurant-search.ts`

```typescript
export function useRestaurantSearch() {
  // レストラン検索ロジック
  const search = async () => {
    const response = await fetch('/api/restaurant-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: query })
    });
  };
}
```

### 3. デプロイメントスクリプト

**ファイル**: `packages/ai-agents/deploy/deploy_restaurant_search.py`

```python
def deploy_restaurant_search_agent():
    # config.shから環境変数を読み込み
    config_path = os.path.join(os.path.dirname(__file__), "../../../config.sh")
    if os.path.exists(config_path):
        # PROJECT_IDとREGIONを読み取り
        with open(config_path, 'r') as f:
            config_content = f.read()
        # ...
```

### 4. 環境変数管理

#### config.shによる一元管理

**変更前**:
- 各エージェントディレクトリに`.env`ファイル
- 重複した設定
- 管理が煩雑

**変更後**:
- `config.sh`で一元管理
- すべてのスクリプトが`config.sh`を参照
- `.env`ファイルは削除

#### 環境変数の流れ

1. `config.sh`に設定を記述
2. デプロイスクリプトが`config.sh`を読み込み
3. Agent EngineのURLが生成される
4. URLを`*_agent_url.txt`に保存
5. フロントエンドの`.env.production`に手動でコピー

### 5. 本番環境設定

**ファイル**: `packages/frontend/.env.production`

```
RESTAURANT_SEARCH_AGENT_URL=https://us-central1-aiplatform.googleapis.com/v1/projects/246970286644/locations/us-central1/reasoningEngines/2642020888429461504:streamQuery?alt=sse
```

## トラブルシューティング

### よくある問題

1. **「環境変数が設定されていません」エラー**
   - `.env.production`にRESTAURANT_SEARCH_AGENT_URLが設定されているか確認
   - デプロイ後に生成されたURLをコピーする必要があります

2. **HTMLに```htmlが含まれる問題**
   - エージェントの指示文を更新して再デプロイが必要
   - コードブロックを使用しないよう指示を変更済み

3. **デプロイ時のタイムアウト**
   - Agent Engineのデプロイには5-10分かかることがあります
   - ログURLで進捗を確認できます

## セットアップ手順

1. **環境設定**
   ```bash
   # config.shを編集
   PROJECT_ID="your-project-id"
   REGION="us-central1"
   ```

2. **エージェントのデプロイ**
   ```bash
   cd packages/ai-agents
   ./venv/bin/python deploy/deploy_restaurant_search.py
   ```

3. **生成されたURLを確認**
   ```bash
   cat restaurant_search_agent_url.txt
   ```

4. **フロントエンドの環境変数を更新**
   ```bash
   # packages/frontend/.env.productionに追加
   RESTAURANT_SEARCH_AGENT_URL=<生成されたURL>
   ```

5. **フロントエンドをビルド・デプロイ**
   ```bash
   cd packages/frontend
   npm run build
   gcloud run deploy
   ```

## テスト方法

### ローカルテスト
```bash
cd packages/ai-agents
./venv/bin/python debug/test_restaurant_search.py
```

### 本番環境テスト
1. デプロイされたアプリケーションにアクセス
2. 「レストラン検索」ページを開く
3. 検索クエリを入力（例：「新宿でランチができるおしゃれなカフェを教えて」）
4. HTMLフォーマットの結果が表示されることを確認

## 今後の改善案

1. **HTMLホスティングの分離**
   - Cloud Storage + CDNでHTMLをホスティング
   - パフォーマンス向上とコスト削減

2. **キャッシュ機能**
   - 同じクエリの結果をキャッシュ
   - レスポンス時間の短縮

3. **検索履歴機能**
   - ユーザーの検索履歴を保存
   - パーソナライズされた推薦

4. **実際のレストランAPI連携**
   - Google Places APIなどと連携
   - リアルタイムの営業時間・評価情報