# ADK (Agent Development Kit) フレームワークでのGoogle検索ツール使用ガイド

## 調査結果

### 1. ADKのGoogle検索ツールの正しいimportと使用方法

```python
from google.adk.tools import google_search
from google.adk.agents import LlmAgent
from google.adk import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types  # Content, Partの正しいインポート
```

**重要な発見:**
- `google.adk.types` モジュールは存在しない
- 正しくは `google.genai.types` から `Content` と `Part` をインポートする
- `google_search` は `GoogleSearchTool` クラスのインスタンス

### 2. Google検索APIの権限・認証設定

#### 認証方法の選択肢

**方法A: Google AI Studio API Key（開発・プロトタイピング用）**
```bash
export GOOGLE_API_KEY="YOUR_API_KEY"
export GOOGLE_GENAI_USE_VERTEXAI=false
```

**方法B: Vertex AI認証（本格運用・企業利用）**
```bash
export GOOGLE_CLOUD_PROJECT="your-project-id"
export VERTEX_AI_PROJECT_ID="your-project-id"
export VERTEX_AI_LOCATION="us-central1"
export GOOGLE_GENAI_USE_VERTEXAI=true
```

### 3. Google検索ツールのパラメータと戻り値

#### ツールの特徴
```python
# GoogleSearchToolの詳細
print(f"Type: {type(google_search)}")  # GoogleSearchTool
print(f"Name: {google_search.name}")   # "google_search"
print(f"Description: {google_search.description}")  # "google_search"
print(f"Declaration: {google_search._get_declaration()}")  # None（内蔵ツール）
```

#### 重要な特徴
- `run_async()` メソッドは実装されていない（内蔵ツールのため）
- Gemini 2.x モデルでのみ動作
- LLMによって自動的に呼び出される
- 直接パラメータを渡すことはできない

### 4. エラーが発生する一般的な原因と対処法

#### 主なエラーパターン

**エラー1: `BaseTool.run_async() takes 1 positional argument but 2 were given`**
```python
# ❌ 間違い - 直接実行しようとする
result = await google_search.run_async("検索クエリ")

# ✅ 正解 - エージェントのツールとして使用
agent = LlmAgent(tools=[google_search])
```

**エラー2: `Project and location or API key must be set`**
```python
# 認証設定の問題
# 解決方法: 適切な環境変数設定
os.environ['VERTEX_AI_PROJECT_ID'] = 'your-project'
os.environ['VERTEX_AI_LOCATION'] = 'us-central1'
```

**エラー3: `No module named 'google.adk.types'`**
```python
# ❌ 間違い
from google.adk.types import Content, Part

# ✅ 正解
from google.genai import types
Content = types.Content
Part = types.Part
```

### 5. 実際のサンプルコードでの使用例

#### 基本的な使用例
```python
import os
import asyncio
from google.adk.agents import LlmAgent
from google.adk.tools import google_search
from google.adk import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

# 環境設定
os.environ['VERTEX_AI_PROJECT_ID'] = 'your-project-id'
os.environ['VERTEX_AI_LOCATION'] = 'us-central1'
os.environ['GOOGLE_GENAI_USE_VERTEXAI'] = 'true'

async def restaurant_search_example():
    # エージェント作成
    search_agent = LlmAgent(
        name="RestaurantSearchAgent",
        model="gemini-2.0-flash-exp",  # 重要: Gemini 2.x必須
        description="レストラン検索エージェント",
        instruction="""Google検索を使ってレストラン情報を検索し、
        以下の形式で整理してください：
        - 店名
        - 住所・アクセス
        - ジャンル
        - 特徴（個室、価格帯など）""",
        tools=[google_search]  # ツールリストに追加
    )
    
    # セッション管理
    session_service = InMemorySessionService()
    runner = Runner(
        app_name="RestaurantSearch",
        agent=search_agent,
        session_service=session_service
    )
    
    # セッション作成
    session = await session_service.create_session(
        state={},
        app_name="RestaurantSearch",
        user_id="user-1"
    )
    
    # 検索実行
    content = types.Content(
        parts=[types.Part(text="渋谷でデートにおすすめのレストランを検索してください")]
    )
    
    async for event in runner.run_async(
        session_id=session.id,
        user_id="user-1",
        new_message=content
    ):
        if hasattr(event, 'text'):
            print(f"結果: {event.text}")

# 実行
asyncio.run(restaurant_search_example())
```

#### カスタム検索ツールの実装例
```python
from google.adk.tools import BaseTool
from google.adk.agents import LlmAgent

class CustomRestaurantSearchTool(BaseTool):
    """カスタム検索ツール（フォールバック付き）"""
    
    def __init__(self):
        super().__init__(
            name="restaurant_search",
            description="レストラン情報を検索"
        )
    
    async def run_async(self, *, args, tool_context):
        """検索実行（フォールバック機能付き）"""
        try:
            # 実際のGoogle検索はLLMエージェントに委譲
            search_agent = LlmAgent(
                name="SearchExecutor",
                model="gemini-2.0-flash-exp",
                tools=[google_search]
            )
            # 検索実行ロジック
            return "検索結果"
        except Exception:
            # フォールバックデータを返す
            return self._get_fallback_data(args)
    
    def _get_fallback_data(self, args):
        """フォールバックデータ"""
        return {
            "restaurants": [
                {
                    "name": "サンプルレストラン",
                    "area": args.get("area", "東京"),
                    "genre": "フレンチ",
                    "description": "落ち着いた雰囲気のレストラン"
                }
            ]
        }
```

## ベストプラクティス

### 1. モデル選択
- **必須**: `gemini-2.0-flash-exp` または `gemini-2.0-flash-thinking-exp`
- Gemini 1.x では Google検索が利用できない

### 2. 認証設定
- 開発環境: Google AI Studio API Key
- 本番環境: Vertex AI + サービスアカウント
- 環境変数の適切な設定が必須

### 3. エラーハンドリング
- Google検索が失敗した場合のフォールバック処理を実装
- 認証エラーの適切な処理
- レート制限への対応

### 4. 最適化
- 検索クエリの最適化（具体的で明確な検索語句）
- 結果の構造化（Pydanticスキーマ使用）
- セッション管理の適切な実装

## 注意事項

1. **Google検索ツールは内蔵ツール**: 直接実行はできず、LLMエージェント経由でのみ利用可能
2. **モデル制限**: Gemini 2.x系モデルでのみ利用可能
3. **認証必須**: 適切なGoogle Cloud認証設定が必要
4. **レスポンス形式**: 検索結果はLLMによって処理され、自然言語で返される
5. **API制限**: Google Search APIの利用制限に注意

この設定により、ADKフレームワークでGoogle検索ツールを正しく使用できます。