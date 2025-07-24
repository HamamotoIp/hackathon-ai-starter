"""
ADK Multi-Agent Orchestrator
Google ADK公式パターンに基づく正しいマルチエージェント実装

参考資料:
- Google ADK公式: https://cloud.google.com/blog/ja/products/ai-machine-learning/build-multi-agentic-systems-using-google-adk
- ADK実装ガイド: https://zenn.dev/google_cloud_jp/articles/c5fa102f468cdf
"""

from google import adk
from adk import agent_tool, LocalApp
import copy
import logging

logger = logging.getLogger(__name__)


# 1. global_instruction（共通指示）
global_instruction = """全てのエージェントは以下の原則に従ってください：
- 日本語で応答する
- 根拠に基づく回答を提供する
- 不明な点は推測せず確認を求める
- 簡潔で実用的な情報を提供する
- 専門性を活かした高品質な応答を心がける"""

# 2. 専門エージェントの定義（ADK推奨パターン + 詳細description）
chat_agent = adk.LlmAgent(
    name="chat_specialist",
    model="gemini-2.0-flash-exp",
    description="日常会話、質問回答、基本的な情報提供を専門とするエージェント。フレンドリーで迅速な応答が特徴",
    instruction=f"""{global_instruction}

あなたは基本チャットの専門エージェントです。

専門分野：
- 日常会話と雑談
- 一般的な質問への回答
- 基本的な情報提供
- 簡単な説明とガイダンス

応答方針：
- フレンドリーで親しみやすい口調
- 簡潔明瞭な説明（1-3段落）
- 5秒以内での高速応答
- 専門的すぎる内容は他エージェントへ誘導"""
)

analysis_agent = adk.LlmAgent(
    name="analysis_specialist", 
    model="gemini-2.0-flash-exp",
    description="データ分析と詳細レポート作成の専門エージェント。トレンド分析、統計処理、実行可能な推奨事項の提案が可能",
    instruction=f"""{global_instruction}

あなたはデータ分析の専門家です。

以下の手順で分析を実行してください：
1. データの概要把握と前処理
2. 重要な傾向やパターンの特定
3. 統計的分析の実施
4. 課題と機会の抽出
5. 実行可能な推奨事項の作成
6. 構造化されたレポートの出力

専門能力：
- トレンド分析と予測
- 統計的データ処理
- KPI・指標の評価
- 改善提案の策定"""
)

comparison_agent = adk.LlmAgent(
    name="comparison_specialist",
    model="gemini-2.0-flash-exp", 
    instruction="""あなたは比較研究の専門エージェントです。
    
客観的な比較分析に特化してください。
- 多角的評価の実施
- 明確な評価基準の設定
- バランスの取れた判断
- 用途別推奨順位の提示"""
)

ui_generation_agent = adk.LlmAgent(
    name="ui_generation_specialist",
    model="gemini-2.0-flash-exp",
    instruction="""あなたはUI生成の専門エージェントです。

生HTMLとTailwind CSSでのUI生成に特化してください。
- 純粋なHTML（フレームワークなし）
- Tailwind CSSのみ使用
- レスポンシブデザイン対応
- アクセシビリティ考慮
- JSON形式での出力: {"html": "..."}"""
)


# 3. AgentToolによるエージェント統合（copy.deepcopy使用）
@agent_tool.AgentTool
def chat_tool(input: str) -> str:
    """基本チャット処理ツール"""
    agent_copy = copy.deepcopy(chat_agent)
    return agent_copy.run(input)

@agent_tool.AgentTool
def analysis_tool(input: str) -> str:
    """分析処理ツール"""
    analysis_prompt = f"""以下の内容について詳細分析を実行してください：

{input}

分析観点：
- 主要ポイントの抽出
- トレンド・傾向分析
- 課題・改善点の特定
- 具体的推奨事項"""
    
    agent_copy = copy.deepcopy(analysis_agent)
    return agent_copy.run(analysis_prompt)

@agent_tool.AgentTool  
def comparison_tool(input: str) -> str:
    """比較処理ツール"""
    comparison_prompt = f"""以下の内容について客観的比較を実行してください：

{input}

比較観点：
- 各選択肢の長所・短所
- 評価基準別の採点
- 用途別推奨順位
- 意思決定支援情報"""
    
    agent_copy = copy.deepcopy(comparison_agent)
    return agent_copy.run(comparison_prompt)

@agent_tool.AgentTool
def ui_generation_tool(input: str) -> str:
    """UI生成処理ツール"""
    ui_prompt = f"""以下の要求に基づいてHTMLを生成してください：

{input}

生成要件：
- 純粋なHTML（Tailwind CSSのみ）
- レスポンシブデザイン
- アクセシビリティ対応
- JSON形式出力: {{"html": "HTMLコード"}}"""
    
    agent_copy = copy.deepcopy(ui_generation_agent)
    return agent_copy.run(ui_prompt)


# 3. ルーティングエージェント（機能判定専用）
router_agent = adk.LlmAgent(
    name="request_router",
    model="gemini-2.0-flash-exp",
    instruction="""あなたはリクエストルーティングの専門エージェントです。

ユーザー入力を分析して、適切な処理タイプを判定してください。

判定基準：
- "ui_generation": UI、HTML、フォーム、ボタン、画面、コンポーネント関連
- "comparison": 比較、違い、vs、どちら、選択、判断関連  
- "analysis": 分析、レポート、トレンド、統計、評価関連
- "chat": 上記以外の一般的な会話・質問

必ず以下の形式で回答してください：
{"route": "判定結果", "confidence": 0.9}"""
)


# 4. 結果整形エージェント
formatter_agent = adk.LlmAgent(
    name="response_formatter",
    model="gemini-2.0-flash-exp",
    instruction="""あなたはレスポンス整形の専門エージェントです。

処理結果を統一形式に整形してください。

整形要件：
- JSON形式での出力
- success, result, agent_used, timestampフィールド
- エラー時はerrorフィールド追加
- 読みやすい形式"""
)


# 5. SequentialAgentによるオーケストレーション（ADK推奨パターン）
def create_adk_orchestrator():
    """ADK推奨パターンによるマルチエージェントオーケストレーター"""
    
    # Step 1: ルーティング判定
    routing_agent = adk.LlmAgent(
        name="routing_step",
        model="gemini-2.0-flash-exp",
        instruction="""ユーザー入力を分析して処理タイプを判定し、次のステップで使用するツールを決定してください。
        
判定結果に基づいて適切なツールを呼び出してください：
- UI生成関連 → ui_generation_tool
- 比較関連 → comparison_tool  
- 分析関連 → analysis_tool
- その他 → chat_tool""",
        tools=[chat_tool, analysis_tool, comparison_tool, ui_generation_tool]
    )
    
    # Step 2: 結果整形（フロントエンド互換性重視）
    formatting_agent = adk.LlmAgent(
        name="formatting_step", 
        model="gemini-2.0-flash-exp",
        instruction="""前のステップの結果をそのまま出力してください。

重要: 
- 余分な整形や説明は追加しない
- ツールの実行結果をそのまま返す
- UI生成の場合はJSON形式を保持する
- その他の場合はテキストをそのまま返す"""
    )
    
    # SequentialAgentでワークフロー構築
    orchestrator = adk.SequentialAgent(
        name="adk_multi_agent_orchestrator",
        agents=[routing_agent, formatting_agent],
        instruction="ADKマルチエージェントシステム",
        input_key="user_input",
        output_key="final_result"
    )
    
    logger.info("ADK Multi-Agent Orchestrator created")
    return orchestrator


# 6. ローカルデバッグ用関数
def debug_local_app(user_input: str):
    """LocalAppを使用したローカルデバッグ"""
    orchestrator = create_adk_orchestrator()
    local_app = LocalApp(orchestrator)
    result = local_app.run({"user_input": user_input})
    return result

# 7. ファクトリー関数
def create_agent():
    """ADKオーケストレーターファクトリー関数"""
    return create_adk_orchestrator()