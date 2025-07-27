# 飲食店検索サービス - シンプルな実装

## 全体フロー（シンプル版）

```
ユーザー入力
  ↓
意図理解（好み・シーン・地域を抽出）
  ↓
2段階Google検索
  ↓
上位5店舗を選定
  ↓
説明文生成
  ↓
UI生成
```

## 1. シンプルな意図理解エージェント

```python
from google.adk.agents import LlmAgent
from google.adk.tools import google_search

# 意図理解エージェント（シンプル版）
simple_intent_agent = LlmAgent(
    name="SimpleIntentAgent",
    model="gemini-1.5-flash",  # 高速なモデルを使用
    description="ユーザー入力から検索に必要な情報を抽出",
    instruction="""
    ユーザーの入力から以下を抽出してください：
    
    1. エリア（例：渋谷、新宿）
    2. シーン（例：デート、ビジネス、友人）
    3. 時間（例：ランチ、ディナー）
    4. 特別な要望（例：個室、静か、夜景）
    
    JSONで出力：
    {
        "area": "渋谷",
        "scene": "デート",
        "time": "ディナー",
        "requests": ["個室", "静か"]
    }
    """,
    output_key="search_params"
)
```

## 2. シンプルな検索エージェント

```python
# 2段階検索ツール
class SimpleTwoStepSearchTool(BaseTool):
    """シンプルな2段階検索"""
    
    def __init__(self):
        super().__init__(
            name="two_step_search",
            description="基本検索＋必要なら追加検索"
        )
    
    async def run_async(self, search_params: Dict) -> List[Dict]:
        all_results = []
        
        # Step 1: 基本検索
        basic_query = f"{search_params['area']} {search_params['scene']} {search_params['time']} レストラン"
        results1 = await google_search(basic_query)
        all_results.extend(self._parse_results(results1))
        
        # Step 2: 結果が10件未満なら追加検索
        if len(all_results) < 10:
            # より広い検索
            broad_query = f"{search_params['area']} おすすめ レストラン"
            results2 = await google_search(broad_query)
            all_results.extend(self._parse_results(results2))
        
        # 重複を簡易的に除去（店名で判定）
        unique_results = {}
        for result in all_results:
            name = result.get('name', '')
            if name and name not in unique_results:
                unique_results[name] = result
        
        return list(unique_results.values())[:20]  # 最大20件
    
    def _parse_results(self, search_results: str) -> List[Dict]:
        """検索結果をパース（簡易版）"""
        # 実際の実装では適切にパース
        return [
            {
                'name': '店名',
                'area': 'エリア',
                'description': '説明',
                'url': 'URL'
            }
        ]

# 検索実行エージェント
simple_search_agent = LlmAgent(
    name="SimpleSearchAgent",
    model="gemini-1.5-flash",
    description="2段階検索を実行",
    instruction="""
    検索パラメータ（state['search_params']）を使って、
    レストラン情報を検索してください。
    
    検索結果を整理して出力してください。
    """,
    tools=[SimpleTwoStepSearchTool()],
    output_key="search_results"
)
```

## 3. シンプルな店舗選定エージェント

```python
# 店舗選定エージェント（シンプル版）
simple_selection_agent = LlmAgent(
    name="SimpleSelectionAgent",
    model="gemini-1.5-flash",
    description="検索結果から5店舗を選定",
    instruction="""
    検索結果（state['search_results']）から、
    ユーザーの条件（state['search_params']）に最も合う
    5つのレストランを選んでください。
    
    選定基準：
    - エリアが合っている
    - シーンに適している
    - 特別な要望に対応できそう
    
    以下の形式で出力：
    {
        "selected_restaurants": [
            {
                "name": "店名",
                "reason": "選定理由",
                "info": {...}
            }
        ]
    }
    """,
    output_key="selected_restaurants"
)
```

## 4. シンプルな説明文生成

```python
# 説明文生成（1店舗ずつ処理するシンプル版）
simple_description_agent = LlmAgent(
    name="SimpleDescriptionAgent",
    model="gemini-1.5-flash",
    description="各店舗の説明文を生成",
    instruction="""
    選定された5店舗（state['selected_restaurants']）について、
    それぞれ150文字程度の説明文を生成してください。
    
    ユーザーのシーン（state['search_params']['scene']）を
    考慮した説明にしてください。
    
    出力形式：
    {
        "descriptions": [
            "店舗1の説明文...",
            "店舗2の説明文...",
            ...
        ]
    }
    """,
    output_key="descriptions"
)
```

## 5. シンプルなUI生成

```python
# UI生成エージェント（シンプル版）
simple_ui_agent = LlmAgent(
    name="SimpleUIAgent",
    model="gemini-1.5-flash",
    description="シンプルなHTML記事を生成",
    instruction="""
    以下の情報を使って、シンプルな特集記事HTMLを生成してください：
    
    - ユーザー名: state['user_name']
    - 検索条件: state['search_params']
    - 選定店舗: state['selected_restaurants']
    - 説明文: state['descriptions']
    
    要件：
    - タイトル「{user_name}さんのための{area}{scene}レストラン特集」
    - 各店舗を見やすく表示
    - レスポンシブデザイン
    - シンプルで読みやすいレイアウト
    """,
    output_key="html"
)
```

## 6. シンプルな完全ワークフロー

```python
from google.adk.agents import SequentialAgent

# シンプルなワークフロー
simple_workflow = SequentialAgent(
    name="SimpleRestaurantSearchWorkflow",
    sub_agents=[
        simple_intent_agent,      # 意図理解
        simple_search_agent,      # 2段階検索
        simple_selection_agent,   # 5店舗選定
        simple_description_agent, # 説明文生成
        simple_ui_agent          # HTML生成
    ],
    description="シンプルな飲食店検索フロー"
)
```

## 7. 実行例

```python
from google.adk.sessions import Session

# 使い方
async def search_restaurants(user_input: str, user_name: str):
    session = Session()
    
    # 入力設定
    session.state['user_input'] = user_input
    session.state['user_name'] = user_name
    
    # 実行
    await simple_workflow.run(session)
    
    # 結果取得
    return session.state.get('html')

# 実行
html = await search_restaurants(
    "渋谷でデートに使えるディナーのお店を探してる",
    "田中"
)
```

## 8. エラーハンドリング（シンプル版）

```python
# エラーに強い検索エージェント
robust_simple_search = LlmAgent(
    name="RobustSimpleSearch",
    model="gemini-1.5-flash",
    instruction="""
    検索を実行してください。
    エラーが発生した場合は、以下のデフォルトデータを使用：
    
    デフォルト店舗リスト：
    1. レストランA（渋谷・イタリアン・個室あり）
    2. レストランB（渋谷・フレンチ・夜景）
    3. レストランC（渋谷・和食・静か）
    （など）
    
    エラーでも必ず5店舗の情報を返してください。
    """,
    output_key="search_results"
)
```

## 9. 最小構成での実装

```python
# 本当に最小限の実装
minimal_agent = LlmAgent(
    name="MinimalRestaurantAgent",
    model="gemini-1.5-flash",
    description="入力から直接HTMLを生成",
    instruction="""
    ユーザー入力：{user_input}
    
    この入力から：
    1. エリアとシーンを理解
    2. 適切な5つのレストランを考える
    3. 簡単な特集記事HTMLを生成
    
    全て一度に処理してHTML出力してください。
    """,
    tools=[google_search],  # 必要なら検索も使える
    output_key="html"
)
```

## まとめ

このシンプル実装の特徴：

1. **エージェント数を最小限に**: 5つの基本エージェントのみ
2. **並列処理なし**: 順次実行でシンプル
3. **2段階検索**: 基本検索＋必要時のみ追加
4. **エラー処理**: デフォルトデータでフォールバック
5. **高速モデル使用**: gemini-1.5-flashで高速化

必要に応じて、後から機能を追加できる拡張性も保っています。