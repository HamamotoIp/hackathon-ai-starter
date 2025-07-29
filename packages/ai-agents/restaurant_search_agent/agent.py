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
                results1 = await google_search.run_async(basic_query)
                parsed_results = self._parse_search_results(results1, area)
                all_results.extend(parsed_results)
            except Exception as e:
                print(f"基本検索エラー: {e}")
            
            # Step 2: 結果が5件未満なら追加検索
            if len(all_results) < 5:
                broad_query = f"{area} おすすめ レストラン"
                try:
                    results2 = await google_search.run_async(broad_query)
                    additional_results = self._parse_search_results(results2, area)
                    all_results.extend(additional_results)
                except Exception as e:
                    print(f"追加検索エラー: {e}")
            
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
        
        return [
            {
                'name': 'ビストロ・ラ・フランス',
                'area': f'{area}駅周辺',
                'genre': 'フレンチ',
                'description': f'{scene}に最適な雰囲気の良いフレンチレストラン',
                'features': ['個室あり', '夜景が見える'],
                'price_range': '¥5,000-8,000'
            },
            {
                'name': '和食処 四季',
                'area': f'{area}駅周辺',
                'genre': '和食',
                'description': f'落ち着いた雰囲気で{scene}に人気の和食店',
                'features': ['個室あり', '静か'],
                'price_range': '¥4,000-6,000'
            },
            # ... 他のフォールバックデータ
        ]

# エージェントの定義
# 1. 意図理解エージェント
simple_intent_agent = LlmAgent(
    name="SimpleIntentAgent",
    model="gemini-2.0-flash-exp",  
    description="ユーザー入力から検索に必要な情報を抽出",
    instruction="""ユーザーの入力（state['user_input']）から以下を抽出してください：
    
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

# 2. 検索実行エージェント
simple_search_agent = LlmAgent(
    name="SimpleSearchAgent",
    model="gemini-2.0-flash-exp",
    description="2段階検索を実行",
    instruction="""検索パラメータ（state['search_params']）を使って、
    レストラン情報を検索してください。
    
    two_step_searchツールを使用して検索を実行し、
    結果をそのまま出力してください。""",
    tools=[TwoStepSearchTool()],  # カスタムツールのインスタンス
    output_key="search_results"
)

# 3. 店舗選定エージェント
simple_selection_agent = LlmAgent(
    name="SimpleSelectionAgent",
    model="gemini-2.0-flash-exp",
    description="検索結果から5店舗を選定",
    instruction="""検索結果（state['search_results']）から、
    ユーザーの条件（state['search_params']）に最も合う
    5つのレストランを選んでください。
    
    以下の形式で出力：
    {
        "selected_restaurants": [
            {
                "name": "店名",
                "area": "エリア",
                "genre": "ジャンル",
                "description": "説明",
                "reason": "選定理由"
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