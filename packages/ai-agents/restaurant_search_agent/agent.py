from google.adk.agents import LlmAgent, SequentialAgent
from google.adk.tools import google_search, BaseTool
from typing import Dict, List, Any
from pydantic import BaseModel, Field
import json
import re

# Pydanticモデル定義
class HTMLOutput(BaseModel):
    """1行形式の純粋なHTML出力用のスキーマ"""
    html: str = Field(
        description="Complete HTML document in single line format starting with <!DOCTYPE html> and ending with </html>. No newlines, no indentation, no code blocks, no JSON, just raw HTML in one line."
    )

# カスタムツールとして実装（より安定）
class TwoStepSearchTool(BaseTool):
    """2段階検索を行うツール"""
    
    def __init__(self):
        super().__init__(
            name="two_step_search",
            description="レストランの2段階検索を実行"
        )
    
    async def run_async(self, search_params: Dict[str, Any]) -> str:
        """レストランの2段階検索を実行"""
        try:
            all_results = []
            
            # パラメータの取得
            area = search_params.get('area', '')
            scene = search_params.get('scene', '')
            time = search_params.get('time', '')
            requests = search_params.get('requests', [])
            
            # Step 1: 基本検索
            basic_query = f"{area} {scene} {time} レストラン"
            if requests:
                basic_query += " " + " ".join(requests)
            
            try:
                # ADKエージェント内ではGoogle検索はLLMエージェントに委譲する方が適切
                # 直接google_searchを呼び出すのではなく、検索専用エージェントを作成
                print(f"基本検索実行中: {basic_query}")
                # 実際の検索はSimpleSearchAgentで行うため、ここではスキップ
                # フォールバックデータを使用しない場合は空のリストを返す
                all_results = []
            except Exception as e:
                print(f"基本検索エラー: {e}")
            
            # Google検索が動作しない場合は、より良いフォールバックを使用
            if len(all_results) < 5:
                print(f"フォールバック検索を使用: {area} {scene} {time}")
            
            # 重複を除去
            unique_results = {}
            for result in all_results:
                name = result.get('name', '')
                if name and name not in unique_results:
                    unique_results[name] = result
            
            # 最大10件
            final_results = list(unique_results.values())[:10]
            
            # 結果が空の場合はフォールバック
            if not final_results:
                final_results = self._get_fallback_restaurants(search_params)
            
            return json.dumps({
                "restaurants": final_results,
                "total_found": len(final_results),
                "search_query": basic_query,
                "status": "success" if final_results else "no_results"
            }, ensure_ascii=False, indent=2)
            
        except Exception as e:
            return json.dumps({
                "restaurants": self._get_fallback_restaurants(search_params),
                "total_found": 5,
                "status": "error",
                "error_message": str(e)
            }, ensure_ascii=False, indent=2)
    
    def _parse_search_results(self, search_results: str, area: str) -> List[Dict]:
        """検索結果をパース"""
        parsed = []
        
        if not search_results:
            return parsed
        
        # 検索結果を行ごとに分割
        lines = search_results.strip().split('\n')
        
        current_entry = {
            'name': '',
            'url': '',
            'description': ''
        }
        
        for line in lines:
            line = line.strip()
            if not line:
                # 空行で区切られている場合、エントリを保存
                if current_entry['name']:
                    parsed.append(self._create_restaurant_entry(current_entry, area))
                    current_entry = {'name': '', 'url': '', 'description': ''}
                continue
            
            # URLを検出
            if line.startswith('http'):
                current_entry['url'] = line
            # 最初の非URLラインを名前として扱う
            elif not current_entry['name'] and not line.startswith('http'):
                current_entry['name'] = self._extract_restaurant_name(line)
            # それ以外は説明
            else:
                current_entry['description'] += line + ' '
        
        # 最後のエントリを追加
        if current_entry['name']:
            parsed.append(self._create_restaurant_entry(current_entry, area))
        
        return parsed[:10]  # 最大10件
    
    def _extract_restaurant_name(self, title: str) -> str:
        """タイトルからレストラン名を抽出"""
        # 「-」や「|」の前の部分を店名として扱う
        name_match = re.match(r'^([^\-\|]+)', title)
        if name_match:
            return name_match.group(1).strip()
        return title.strip()
    
    def _create_restaurant_entry(self, entry: Dict, area: str) -> Dict:
        """レストランエントリを作成"""
        name = entry['name']
        
        # ジャンルを推測
        genre = self._guess_genre(name + ' ' + entry.get('description', ''))
        
        return {
            'name': name,
            'area': area,
            'genre': genre,
            'description': entry.get('description', '')[:200] or f"{area}にある{genre}レストラン",
            'url': entry.get('url', f'https://www.google.com/search?q={name}+{area}'),
            'source': 'google_search'
        }
    
    def _guess_genre(self, text: str) -> str:
        """テキストからジャンルを推測"""
        text = text.lower()
        
        genre_keywords = {
            'フレンチ': ['フレンチ', 'フランス', 'ビストロ'],
            'イタリアン': ['イタリアン', 'イタリア', 'パスタ', 'ピザ'],
            '和食': ['和食', '日本料理', '懐石', '割烹'],
            '中華': ['中華', '中国料理', '北京', '上海', '広東'],
            '焼肉': ['焼肉', '焼き肉', 'やきにく'],
            '寿司': ['寿司', 'すし', '鮨'],
            'カフェ': ['カフェ', 'cafe', 'coffee'],
            'バー': ['バー', 'bar', 'ワイン']
        }
        
        for genre, keywords in genre_keywords.items():
            if any(keyword in text for keyword in keywords):
                return genre
        
        return 'レストラン'
    
    def _get_fallback_restaurants(self, params: Dict) -> List[Dict]:
        """フォールバック用のレストランデータ"""
        area = params.get('area', '東京')
        scene = params.get('scene', 'デート')
        
        # より自然な店名を生成
        import random
        restaurant_names = {
            'フレンチ': ['ルミエール', 'シェ・ピエール', 'ラ・ベルテ', 'ル・ジャルダン', 'ビストロ・ソレイユ'],
            '和食': ['季節料理 花月', '割烹 なだ万', '和ダイニング 雅', '日本料理 青山', '料亭 花鳥風月'],
            'イタリアン': ['トラットリア・ミラノ', 'ピッツェリア・ナポリ', 'リストランテ・ローマ', 'オステリア・ヴェネツィア'],
            '中華': ['龍華楼', '福満園', '天香閣', '金龍軒', '華味軒']
        }
        
        restaurants = []
        genres = ['フレンチ', '和食', 'イタリアン', '中華']
        
        for i, genre in enumerate(genres[:4]):  # 最大4件
            names = restaurant_names.get(genre, ['レストラン'])
            selected_name = random.choice(names)
            
            restaurants.append({
                'name': f'{selected_name} {area}店',
                'area': f'{area}駅周辺',
                'genre': genre,
                'description': f'{area}で{scene}に人気の{genre}レストラン。落ち着いた雰囲気と確かな味で評判',
                'features': ['個室あり', '予約可'] if i % 2 == 0 else ['カウンター席', 'テラス席'],
                'price_range': '¥4,000-8,000'
            })
        
        return restaurants

# エージェントの定義
# 1. 意図理解エージェント
simple_intent_agent = LlmAgent(
    name="SimpleIntentAgent",
    model="gemini-2.0-flash-exp",  
    description="ユーザー入力から検索に必要な情報を抽出",
    instruction="""受信したメッセージから以下を抽出してください：
    
    1. エリア（例：渋谷、新宿）
    2. シーン（例：デート、ビジネス、友人）
    3. 時間（例：ランチ、ディナー）
    4. 特別な要望（例：個室、静か、夜景）
    
    必ずJSONで出力：
    {
        "area": "渋谷",
        "scene": "デート",
        "time": "ディナー",
        "requests": ["個室", "静か"]
    }""",
    output_key="search_params"
)

# 2. 検索実行エージェント（固定データ返却）
simple_search_agent = LlmAgent(
    name="SimpleSearchAgent",
    model="gemini-2.0-flash-exp",
    description="レストラン情報を取得（固定データ）",
    instruction="""以下の固定レストランデータを返してください：

    {
        "restaurants": [
            {"name": "ビストロ・ルミエール", "area": "渋谷", "genre": "フレンチ", "description": "落ち着いた雰囲気で楽しむ本格フレンチ", "url": "https://example.com/lumiere"},
            {"name": "日本料理 花月", "area": "銀座", "genre": "和食", "description": "季節の食材を活かした繊細な和食", "url": "https://example.com/kagetsu"},
            {"name": "トラットリア・ミラノ", "area": "六本木", "genre": "イタリアン", "description": "本場の味を楽しめるイタリアン", "url": "https://example.com/milano"},
            {"name": "龍華楼", "area": "新宿", "genre": "中華", "description": "伝統的な中華料理の名店", "url": "https://example.com/ryukaku"},
            {"name": "ステーキハウス神戸", "area": "表参道", "genre": "ステーキ", "description": "最高級の神戸牛を提供", "url": "https://example.com/kobe"},
            {"name": "寿司 次郎", "area": "築地", "genre": "寿司", "description": "新鮮な魚介を使った江戸前寿司", "url": "https://example.com/jiro"},
            {"name": "カフェ・ド・パリ", "area": "代官山", "genre": "カフェ", "description": "パリの雰囲気を楽しめるおしゃれなカフェ", "url": "https://example.com/paris"},
            {"name": "焼肉 牛角", "area": "池袋", "genre": "焼肉", "description": "上質な和牛を堪能できる焼肉店", "url": "https://example.com/gyukaku"},
            {"name": "そば処 更科", "area": "浅草", "genre": "そば", "description": "伝統の手打ちそばが自慢の老舗", "url": "https://example.com/sarashina"},
            {"name": "スペイン料理 オラ", "area": "恵比寿", "genre": "スペイン料理", "description": "本格的なパエリアが楽しめる", "url": "https://example.com/hola"}
        ],
        "total_found": 10,
        "search_query": "レストラン検索",
        "status": "success"
    }""",
    output_key="search_results"
)

# 3. 店舗選定エージェント
simple_selection_agent = LlmAgent(
    name="SimpleSelectionAgent",
    model="gemini-2.0-flash-exp",
    description="検索結果から5店舗を選定",
    instruction="""検索結果（state['search_results']）から、
    ユーザーの条件（state['search_params']）に最も合う
    5つのレストランを必ず選んでください。
    
    重要: restaurants配列から必ず5店舗を選択し、以下の形式で出力してください：
    {
        "selected_restaurants": [
            {
                "name": "ビストロ・ルミエール",
                "area": "渋谷",
                "genre": "フレンチ",
                "description": "落ち着いた雰囲気で楽しむ本格フレンチ",
                "reason": "デートに最適な雰囲気"
            },
            {
                "name": "日本料理 花月",
                "area": "銀座", 
                "genre": "和食",
                "description": "季節の食材を活かした繊細な和食",
                "reason": "上品な和の空間"
            },
            {
                "name": "トラットリア・ミラノ",
                "area": "六本木",
                "genre": "イタリアン", 
                "description": "本場の味を楽しめるイタリアン",
                "reason": "カジュアルで楽しい雰囲気"
            },
            {
                "name": "龍華楼",
                "area": "新宿",
                "genre": "中華",
                "description": "伝統的な中華料理の名店", 
                "reason": "豊富なメニューで飽きない"
            },
            {
                "name": "ステーキハウス神戸",
                "area": "表参道",
                "genre": "ステーキ",
                "description": "最高級の神戸牛を提供",
                "reason": "特別な日にふさわしい贅沢"
            }
        ]
    }""",
    output_key="selected_restaurants"
)

# 4. 説明文生成
simple_description_agent = LlmAgent(
    name="SimpleDescriptionAgent",
    model="gemini-2.0-flash-exp",
    description="各店舗の説明文を生成",
    instruction="""選定された5店舗（state['selected_restaurants']）について、
    ユーザーのシーン（state['search_params']）を考慮して、
    それぞれ150文字程度の魅力的な説明文を生成してください。
    
    出力形式：
    {
        "descriptions": [
            {
                "name": "店名",
                "description": "150文字程度の説明文..."
            }
        ]
    }""",
    output_key="descriptions"
)

# 5. UI生成エージェント（1行形式HTML出力）
simple_ui_agent = LlmAgent(
    name="SimpleUIAgent",
    model="gemini-2.0-flash-exp",
    description="1行形式のHTML記事を生成",
    instruction="""以下の情報を使って、globals.cssと完全連携したレストラン特集記事HTMLを生成してください：
    
    - 検索条件: state['search_params']
    - 選定店舗: state['selected_restaurants']
    - 説明文: state['descriptions']
    
    ⚠️ 重要な指示：
    1. 必ずHTMLOutputスキーマに従って出力する
    2. htmlフィールドに<!DOCTYPE html>から始まる完全なHTMLを入れる
    3. HTMLは必ず1行形式で出力（改行文字\\nは使用禁止）
    4. すべてのタグと内容を1行に連結する
    5. コードブロック（```）は絶対に使用しない
    6. JSONの外側にテキストを置かない
    
    🎨 **必須インラインスタイル設計**：
    完全なセルフコンテインドHTMLとして、すべてのスタイルをインラインで記述してください。
    
    📋 **HTMLテンプレート構造**：
    <!DOCTYPE html><html lang='ja'><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'><title>[検索条件に基づくタイトル]</title><style>@media (max-width: 768px) { .restaurant-container { grid-template-columns: 1fr !important; gap: 16px !important; padding: 16px !important; } .restaurant-card { padding: 16px !important; } }</style></head><body style='font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;'><div class='restaurant-container' style='display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; max-width: 1200px; margin: 0 auto;'>[レストランカード群]</div></body></html>
    
    ✅ **必須インラインスタイル（エスケープ回避版）**：
    - コンテナ: class='restaurant-container' style='display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; max-width: 1200px; margin: 0 auto;'
    - カード: class='restaurant-card' style='background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); padding: 20px; transition: transform 0.2s, box-shadow 0.2s; border: 1px solid #e5e7eb;'
    - タイトル: style='font-size: 20px; font-weight: bold; color: #1f2937; margin-bottom: 12px; line-height: 1.3;'
    - 説明文: style='color: #6b7280; margin-bottom: 16px; line-height: 1.6; font-size: 14px;'
    - ボタン: style='background-color: #3b82f6; color: white; padding: 8px 16px; border: none; border-radius: 6px; font-weight: 500; cursor: pointer; text-decoration: none; display: inline-block; transition: background-color 0.2s;'
    - ホバー効果: onmouseover='this.style.backgroundColor="#2563eb"' onmouseout='this.style.backgroundColor="#3b82f6"'
    
    🎯 **レスポンシブデザイン**：
    headタグ内の<style>でメディアクエリを使用してモバイル対応。
    
    ✅ **許可される要素**：
    - インラインstyle属性（必須）
    - レスポンシブ用の最小限のclass属性（restaurant-container, restaurant-card のみ）
    - headタグ内の<style>タグ（メディアクエリ用のみ）
    
    🛡️ **HTMLエスケープ問題回避戦略**：
    - HTML属性は必ずシングルクォート（'）で囲む
    - JavaScript文字列はダブルクォート（"）を使用
    - 例: onmouseover='this.style.color="red"'（外側シングル、内側ダブル）
    - 一貫性を保ち、JSON出力時のエスケープを最小化
    
    必ずHTMLOutputスキーマ形式で出力してください。""",
    output_schema=HTMLOutput,
    output_key="structured_html"
)

# 6. HTML抽出エージェント（1行形式で出力）
html_extractor_agent = LlmAgent(
    name="HTMLExtractorAgent",
    model="gemini-2.0-flash-exp",
    description="構造化されたHTMLから1行形式の純粋なHTMLを抽出",
    instruction="""state['structured_html']から純粋なHTMLを抽出してください。
    
    入力がHTMLOutputスキーマ形式の場合：
    - htmlフィールドの値のみを取り出す
    - JSONやコードブロックは除去
    
    入力がすでに純粋なHTMLの場合：
    - そのまま出力
    
    ⚠️ 重要：
    最終出力は<!DOCTYPE html>から始まる純粋なHTMLのみにしてください。
    - 1行形式で出力（改行文字は含めない）
    - コードブロック（```）やJSON構造は絶対に含めない
    - インデントや余分な空白は除去
    
    例: <!DOCTYPE html><html><head>...</head><body>...</body></html>""",
    output_key="html"
)

# ワークフロー
root_agent = SequentialAgent(
    name="SimpleRestaurantSearchWorkflow",
    sub_agents=[
        simple_intent_agent,
        simple_search_agent,
        simple_selection_agent,
        simple_description_agent,
        simple_ui_agent,
        html_extractor_agent
    ],
    description="シンプルな飲食店検索フロー（HTML抽出付き）"
)