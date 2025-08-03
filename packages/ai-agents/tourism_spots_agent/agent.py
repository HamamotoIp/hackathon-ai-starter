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
class TourismSpotsSearchTool(BaseTool):
    """観光スポット検索を行うツール"""
    
    def __init__(self):
        super().__init__(
            name="tourism_spots_search",
            description="観光スポットの検索を実行"
        )
    
    async def run_async(self, search_params: Dict[str, Any]) -> str:
        """固定観光スポットデータを返す"""
        try:
            # パラメータの取得
            area = search_params.get('area', '')
            category = search_params.get('category', '')
            season = search_params.get('season', '')
            requests = search_params.get('requests', [])
            
            # 検索クエリを構築（ログ用）
            basic_query = f"{area} {category} {season} 観光スポット"
            if requests:
                basic_query += " " + " ".join(requests)
            
            print(f"固定データ検索: {basic_query}")
            
            # 固定データを取得
            spots = self._get_tourism_spots_data(search_params)
            
            return json.dumps({
                "tourism_spots": spots,
                "total_found": len(spots),
                "search_query": basic_query,
                "status": "success"
            }, ensure_ascii=False, indent=2)
            
        except Exception as e:
            return json.dumps({
                "tourism_spots": self._get_tourism_spots_data(search_params),
                "total_found": 5,
                "status": "error",
                "error_message": str(e)
            }, ensure_ascii=False, indent=2)
    
    def _get_tourism_spots_data(self, params: Dict) -> List[Dict]:
        """エリアとカテゴリに応じた固定観光スポットデータ"""
        area = params.get('area', '東京')
        category = params.get('category', '歴史')
        
        # エリア別の観光スポットデータベース
        tourism_database = {
            '東京': {
                '歴史': [
                    {'name': '浅草寺', 'description': '東京最古の寺院として親しまれる由緒ある観光地'},
                    {'name': '明治神宮', 'description': '明治天皇を祀る神社で都心のオアシス'},
                    {'name': '東京国立博物館', 'description': '日本と東洋の文化財を展示する国内最大の博物館'},
                ],
                '自然': [
                    {'name': '上野恩賜公園', 'description': '桜の名所として有名で多くの文化施設も併設'},
                    {'name': '新宿御苑', 'description': '都心にある広大な庭園で四季を感じられる'},
                ],
                '現代': [
                    {'name': '東京スカイツリー', 'description': '東京の新しいシンボルタワー'},
                    {'name': 'お台場', 'description': '未来的な街並みとエンターテイメントが楽しめる'},
                ],
                '文化': [
                    {'name': '歌舞伎座', 'description': '伝統的な歌舞伎を楽しめる劇場'},
                    {'name': '国立新美術館', 'description': '現代アートの展示で有名な美術館'},
                ]
            },
            '京都': {
                '歴史': [
                    {'name': '清水寺', 'description': '世界遺産に登録された古都京都の象徴的な寺院'},
                    {'name': '金閣寺', 'description': '金色に輝く美しい舎利殿で有名'},
                    {'name': '伏見稲荷大社', 'description': '千本鳥居で有名な稲荷神社の総本宮'},
                ],
                '自然': [
                    {'name': '嵐山', 'description': '美しい竹林と渡月橋で有名な景勝地'},
                    {'name': '哲学の道', 'description': '桜並木が美しい散歩道'},
                ],
                '文化': [
                    {'name': '祇園', 'description': '舞妓さんが歩く伝統的な花街'},
                    {'name': '二条城', 'description': '徳川将軍の京都での居住地として使われた城'},
                ]
            },
            '大阪': {
                '歴史': [
                    {'name': '大阪城', 'description': '豊臣秀吉が築いた名城'},
                    {'name': '住吉大社', 'description': '全国の住吉神社の総本社'},
                ],
                '現代': [
                    {'name': '通天閣', 'description': '大阪のシンボルタワー'},
                    {'name': 'ユニバーサル・スタジオ・ジャパン', 'description': '人気のテーマパーク'},
                ],
                '文化': [
                    {'name': '道頓堀', 'description': '大阪の食文化とエンターテイメントが集まる繁華街'},
                ]
            }
        }
        
        # デフォルトエリア（指定がない場合）
        if area not in tourism_database:
            area = '東京'
        
        area_spots = tourism_database[area]
        spots = []
        
        # 指定カテゴリから優先的に選択、他カテゴリからも補完
        if category in area_spots:
            spots.extend(area_spots[category][:3])  # 指定カテゴリから最大3つ
        
        # 他のカテゴリからも補完
        for cat, places in area_spots.items():
            if cat != category and len(spots) < 6:
                spots.extend(places[:2])  # 他カテゴリから各2つまで
        
        # データを構造化
        structured_spots = []
        for i, spot in enumerate(spots[:6]):  # 最大6件
            structured_spots.append({
                'name': spot['name'],
                'area': f'{area}',
                'category': self._get_spot_category(spot['name']),
                'description': spot['description'],
                'features': self._get_features_for_category(category),
                'access': f'{area}駅から電車で30分以内',
                'best_season': self._get_best_season(category),
                'atmosphere': self._get_atmosphere(category)
            })
        
        return structured_spots
    
    def _get_spot_category(self, name: str) -> str:
        """スポット名からカテゴリを推測"""
        if any(word in name for word in ['寺', '神社', '城', '宮']):
            return '歴史'
        elif any(word in name for word in ['公園', '山', '川', '海']):
            return '自然'
        elif any(word in name for word in ['タワー', 'スタジオ', 'センター']):
            return '現代'
        else:
            return '文化'
    
    def _get_features_for_category(self, category: str) -> List[str]:
        """カテゴリに応じた特徴を返す"""
        base_features = ['写真撮影可', 'アクセス良好']
        
        if '歴史' in category:
            return base_features + ['文化財', '由緒ある']
        elif '自然' in category:
            return base_features + ['四季が美しい', 'リラックス']
        elif '現代' in category:
            return base_features + ['最新技術', 'エンターテイメント']
        else:
            return base_features + ['伝統文化', '体験可能']
    
    def _get_best_season(self, category: str) -> str:
        """カテゴリに応じたベストシーズンを返す"""
        if '自然' in category:
            return '春・秋'
        elif '歴史' in category:
            return '通年'
        else:
            return '通年'
    
    def _get_atmosphere(self, category: str) -> str:
        """カテゴリに応じた雰囲気を返す"""
        if '歴史' in category:
            return '荘厳で静寂'
        elif '自然' in category:
            return '開放的で癒される'
        elif '現代' in category:
            return '活気あふれる'
        else:
            return '文化的で洗練された'

# エージェントの定義
# 1. 意図理解エージェント
simple_intent_agent = LlmAgent(
    name="SimpleIntentAgent",
    model="gemini-2.0-flash-exp",  
    description="ユーザー入力から観光スポット検索に必要な情報を抽出",
    instruction="""受信したメッセージから以下を抽出してください：
    
    1. エリア（例：東京、京都、大阪）
    2. カテゴリ（例：歴史、自然、現代、文化）
    3. 季節（例：春、夏、秋、冬）
    4. 特別な要望（例：写真撮影、体験、静か、アクセス）
    
    必ずJSONで出力：
    {
        "area": "東京",
        "category": "歴史",
        "season": "春",
        "requests": ["写真撮影", "静か"]
    }""",
    output_key="search_params"
)

# 2. 検索実行エージェント（固定データ返却）
simple_search_agent = LlmAgent(
    name="SimpleSearchAgent",
    model="gemini-2.0-flash-exp",
    description="観光スポット情報を取得（固定データ）",
    instruction="""以下の固定観光スポットデータを返してください：

    {
        "tourism_spots": [
            {"name": "浅草寺", "area": "東京", "category": "歴史", "description": "東京最古の寺院として親しまれる由緒ある観光地", "url": "https://example.com/sensoji"},
            {"name": "明治神宮", "area": "東京", "category": "歴史", "description": "明治天皇を祀る神社で都心のオアシス", "url": "https://example.com/meiji"},
            {"name": "上野恩賜公園", "area": "東京", "category": "自然", "description": "桜の名所として有名で多くの文化施設も併設", "url": "https://example.com/ueno"},
            {"name": "東京スカイツリー", "area": "東京", "category": "現代", "description": "東京の新しいシンボルタワー", "url": "https://example.com/skytree"},
            {"name": "清水寺", "area": "京都", "category": "歴史", "description": "世界遺産に登録された古都京都の象徴的な寺院", "url": "https://example.com/kiyomizu"},
            {"name": "金閣寺", "area": "京都", "category": "歴史", "description": "金色に輝く美しい舎利殿で有名", "url": "https://example.com/kinkaku"},
            {"name": "嵐山", "area": "京都", "category": "自然", "description": "美しい竹林と渡月橋で有名な景勝地", "url": "https://example.com/arashiyama"},
            {"name": "大阪城", "area": "大阪", "category": "歴史", "description": "豊臣秀吉が築いた名城", "url": "https://example.com/osaka-castle"},
            {"name": "通天閣", "area": "大阪", "category": "現代", "description": "大阪のシンボルタワー", "url": "https://example.com/tsutenkaku"},
            {"name": "道頓堀", "area": "大阪", "category": "文化", "description": "大阪の食文化とエンターテイメントが集まる繁華街", "url": "https://example.com/dotonbori"}
        ],
        "total_found": 10,
        "search_query": "観光スポット検索",
        "status": "success"
    }""",
    output_key="search_results"
)

# 3. スポット選定エージェント
simple_selection_agent = LlmAgent(
    name="SimpleSelectionAgent",
    model="gemini-2.0-flash-exp",
    description="検索結果から5つの観光スポットを選定",
    instruction="""検索結果（state['search_results']）から、
    ユーザーの条件（state['search_params']）に最も合う
    5つの観光スポットを必ず選んでください。
    
    重要: tourism_spots配列から必ず5スポットを選択し、以下の形式で出力してください：
    {
        "selected_spots": [
            {
                "name": "浅草寺",
                "area": "東京",
                "category": "歴史",
                "description": "東京最古の寺院として親しまれる由緒ある観光地",
                "reason": "歴史を感じられる代表的なスポット"
            },
            {
                "name": "明治神宮",
                "area": "東京", 
                "category": "歴史",
                "description": "明治天皇を祀る神社で都心のオアシス",
                "reason": "都心で自然も感じられる神聖な場所"
            },
            {
                "name": "上野恩賜公園",
                "area": "東京",
                "category": "自然", 
                "description": "桜の名所として有名で多くの文化施設も併設",
                "reason": "自然と文化が同時に楽しめる"
            },
            {
                "name": "東京スカイツリー",
                "area": "東京",
                "category": "現代",
                "description": "東京の新しいシンボルタワー", 
                "reason": "現代的な東京の象徴"
            },
            {
                "name": "清水寺",
                "area": "京都",
                "category": "歴史",
                "description": "世界遺産に登録された古都京都の象徴的な寺院",
                "reason": "日本の伝統美を体現する名所"
            }
        ]
    }""",
    output_key="selected_spots"
)

# 4. 説明文生成
simple_description_agent = LlmAgent(
    name="SimpleDescriptionAgent",
    model="gemini-2.0-flash-exp",
    description="各観光スポットの説明文を生成",
    instruction="""選定された5つの観光スポット（state['selected_spots']）について、
    ユーザーの希望（state['search_params']）を考慮して、
    それぞれ150文字程度の魅力的な説明文を生成してください。
    
    出力形式：
    {
        "descriptions": [
            {
                "name": "スポット名",
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
    instruction="""以下の情報を使って、観光スポット特集記事HTMLを生成してください：
    
    - 検索条件: state['search_params']
    - 選定スポット: state['selected_spots']
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
    <!DOCTYPE html><html lang='ja'><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'><title>[検索条件に基づくタイトル]</title><style>@media (max-width: 768px) { .spot-container { grid-template-columns: 1fr !important; gap: 16px !important; padding: 16px !important; } .spot-card { padding: 16px !important; } }</style></head><body style='font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;'><div class='spot-container' style='display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; max-width: 1200px; margin: 0 auto;'>[観光スポットカード群]</div></body></html>
    
    ✅ **必須インラインスタイル（エスケープ回避版）**：
    - コンテナ: class='spot-container' style='display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; max-width: 1200px; margin: 0 auto;'
    - カード: class='spot-card' style='background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); padding: 20px; transition: transform 0.2s, box-shadow 0.2s; border: 1px solid #e5e7eb;'
    - タイトル: style='font-size: 20px; font-weight: bold; color: #1f2937; margin-bottom: 12px; line-height: 1.3;'
    - 説明文: style='color: #6b7280; margin-bottom: 16px; line-height: 1.6; font-size: 14px;'
    - ボタン: style='background-color: #3b82f6; color: white; padding: 8px 16px; border: none; border-radius: 6px; font-weight: 500; cursor: pointer; text-decoration: none; display: inline-block; transition: background-color 0.2s;'
    - ホバー効果: onmouseover='this.style.backgroundColor="#2563eb"' onmouseout='this.style.backgroundColor="#3b82f6"'
    
    🎯 **レスポンシブデザイン**：
    headタグ内の<style>でメディアクエリを使用してモバイル対応。
    
    ✅ **許可される要素**：
    - インラインstyle属性（必須）
    - レスポンシブ用の最小限のclass属性（spot-container, spot-card のみ）
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
    name="TourismSpotsSearchWorkflow",
    sub_agents=[
        simple_intent_agent,
        simple_search_agent,
        simple_selection_agent,
        simple_description_agent,
        simple_ui_agent,
        html_extractor_agent
    ],
    description="観光スポット検索フロー（HTML生成付き）"
)