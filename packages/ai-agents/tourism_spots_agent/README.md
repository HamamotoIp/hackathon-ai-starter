# 🏛️ Tourism Spots Search Agent

**観光スポット検索特化エージェント** - 6段階処理による完全な観光スポット検索システム

## 🎯 機能概要

- **6段階処理**: Intent→Search→Selection→Description→UI→HTML Extract
- **固定観光スポットDB**: 東京・京都・大阪の厳選観光スポット
- **1行形式HTML**: エスケープ問題を根本解決
- **Tailwind CSS**: 静的CSSファイル使用（JavaScript不要）

## 📝 処理フロー

### 6段階エージェント処理
```
1. SimpleIntentAgent     → ユーザー入力から検索パラメータ抽出
2. SimpleSearchAgent     → 固定観光スポットデータから候補取得  
3. SimpleSelectionAgent  → 条件に最適な5スポット選定
4. SimpleDescriptionAgent → 魅力的な説明文生成
5. SimpleUIAgent         → 美しいHTML記事生成（1行形式）
6. HTMLExtractorAgent    → 純粋HTML最終抽出
```

## 🏛️ 観光スポットデータベース

### 東京 (Tokyo)
```python
tokyo_spots = [
    {
        "name": "東京国立博物館",
        "category": "歴史",
        "season": "通年",
        "description": "日本最古の博物館。国宝・重要文化財を多数収蔵。",
        "image": "https://example.com/tokyo-national-museum.jpg"
    },
    {
        "name": "皇居東御苑", 
        "category": "歴史",
        "season": "春",
        "description": "江戸城跡の美しい庭園。桜の名所としても有名。",
        "image": "https://example.com/imperial-garden.jpg"
    },
    # ... 20スポット以上
]
```

### 京都 (Kyoto)
```python
kyoto_spots = [
    {
        "name": "清水寺",
        "category": "文化", 
        "season": "秋",
        "description": "京都の代表的な寺院。紅葉の美しさで知られる。",
        "image": "https://example.com/kiyomizu-dera.jpg"
    },
    # ... 20スポット以上
]
```

### 大阪 (Osaka)
```python
osaka_spots = [
    {
        "name": "大阪城",
        "category": "歴史",
        "season": "春", 
        "description": "豊臣秀吉が築いた名城。桜の名所。",
        "image": "https://example.com/osaka-castle.jpg"
    },
    # ... 20スポット以上
]
```

## 🔄 使用例

### 基本的な検索例
```python
# ユーザー入力
user_query = "東京で歴史を感じられる春の観光スポット"

# 処理結果例
selected_spots = [
    {
        "name": "皇居東御苑",
        "category": "歴史", 
        "season": "春",
        "description": "江戸城跡の美しい庭園...",
        "match_score": 0.95
    },
    {
        "name": "東京国立博物館",
        "category": "歴史",
        "season": "通年", 
        "description": "日本最古の博物館...",
        "match_score": 0.88
    }
    # ... 5スポット合計
]
```

## 🚀 ローカル開発

### ADK標準コマンド
```bash
# Web UIで起動
adk web tourism_spots_agent

# ターミナルで対話実行  
adk run tourism_spots_agent

# → http://localhost:8000 でGUI操作可能
```

### 本番デプロイ
```bash
# 個別デプロイ
python deploy/deploy_tourism_spots.py

# 統合デプロイ（推奨）
cd /workspaces/hackathon-ai-starter
./setup.sh
```

## 🌐 API統合

### フロントエンド呼び出し例
```typescript
const response = await fetch('/api/tourism-spots', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    message: '京都で文化体験できる秋の観光スポット' 
  })
});

const data = await response.json();

// 結果: 美しいHTML記事が生成される
console.log(data.result); // <html>...</html>
```

## 🛠️ エージェント実装詳細

### SimpleIntentAgent
```python
# ユーザー入力解析
intent_agent = LlmAgent(
    name="intent_classifier",
    model="gemini-2.0-flash-exp",
    instruction="""
    ユーザーの観光スポット検索クエリから以下を抽出：
    - エリア (東京/京都/大阪)
    - カテゴリ (歴史/自然/現代/文化)  
    - 季節 (春/夏/秋/冬)
    """
)
```

### SimpleSearchAgent
```python
# 固定データ検索
search_agent = LlmAgent(
    name="spot_searcher", 
    model="gemini-2.0-flash-exp",
    instruction="""
    固定観光スポットデータベースから条件に合致するスポットを検索。
    エリア・カテゴリ・季節の条件でフィルタリング。
    """
)
```

### SimpleUIAgent (1行形式HTML生成)
```python
ui_agent = LlmAgent(
    name="ui_generator",
    model="gemini-2.0-flash-exp", 
    instruction="""
    ⚠️ 重要な指示：
    3. HTMLは必ず1行形式で出力（改行文字\\nは使用禁止）
    4. すべてのタグと内容を1行に連結する
    8. Tailwind CSSを使用

    HTMLは必ず1行にまとめて、改行やインデントは含めないでください。
    例: <!DOCTYPE html><html><head><title>タイトル</title></head><body>...</body></html>
    """
)
```

## 📊 パフォーマンス指標

| 処理段階 | 実行時間 | 説明 |
|---------|---------|------|
| Intent解析 | 2-3秒 | パラメータ抽出 |
| スポット検索 | 1-2秒 | 固定DB検索 |
| スポット選定 | 3-4秒 | 最適5選 |
| 説明文生成 | 4-6秒 | 魅力的な文章 |
| HTML生成 | 5-8秒 | 1行形式HTML |
| HTML抽出 | 1-2秒 | 最終クリーニング |
| **合計** | **15-25秒** | **完全処理** |

## 🔧 カスタマイズ

### 新しい観光スポット追加
```python
# TwoStepSearchToolの_get_fallback_spotsメソッドを編集
def _get_fallback_spots(self, params: Dict) -> List[Dict]:
    """固定観光スポットデータ"""
    
    # 新エリア追加例
    nagoya_spots = [
        {
            "name": "名古屋城",
            "category": "歴史",
            "season": "春", 
            "description": "尾張徳川家の居城。金のしゃちほこで有名。"
        }
    ]
    
    all_spots = tokyo_spots + kyoto_spots + osaka_spots + nagoya_spots
    return all_spots
```

### カテゴリ・季節の追加
```python
# カテゴリ追加
categories = ["歴史", "自然", "現代", "文化", "グルメ", "ショッピング"]

# 季節詳細化  
seasons = ["早春", "春", "初夏", "夏", "秋", "冬"]
```

## 🎯 開発のベストプラクティス

### 1. HTMLエスケープ問題の回避
- **1行形式HTML**: 改行文字を完全に除去
- **静的Tailwind CSS**: JavaScriptフリーで高速
- **構造化出力**: Pydanticスキーマで型安全

### 2. パフォーマンス最適化
- **固定データ**: データベースアクセス不要
- **6段階並列化**: 将来的な並列処理対応
- **キャッシュ活用**: 同一クエリの高速化

### 3. 拡張性の確保
- **モジュラー設計**: 各エージェントが独立
- **データ分離**: 観光スポットデータの外部化可能
- **API互換性**: フロントエンドとの疎結合

---

**🏛️ 美しい観光スポット特集記事を自動生成しましょう！**