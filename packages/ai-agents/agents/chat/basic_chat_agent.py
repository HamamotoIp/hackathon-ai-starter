"""
Basic Chat Agent
基本的なチャット機能を提供するADKエージェント
"""

from google import adk
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class BasicChatAgent:
    """基本チャットエージェント - 日常会話、質問回答に特化"""
    
    def __init__(self):
        # ADK エージェントインスタンスを作成
        self.agent = adk.Agent(
            name="basic_chat_agent",
            model="gemini-2.0-flash-exp",
            description="基本チャットエージェント - 日常会話、質問回答に特化",
            instruction="""あなたは親しみやすいAIアシスタントです。

【役割】
- 日常的な会話相手
- 質問への的確な回答
- 簡潔で分かりやすい説明

【応答スタイル】
- フレンドリーで親しみやすい
- 簡潔明瞭（通常1-3段落）
- 専門用語は分かりやすく説明
- 必要に応じて具体例を提供

【制約】
- 分析や比較の詳細な処理は行わない
- 複雑な処理は専門エージェントを推奨
- 5秒以内での高速応答を心がける"""
        )
        
        logger.info(f"BasicChatAgent initialized: {self.agent.name}")
    
    @property
    def name(self):
        return self.agent.name
    
    def process_message(self, message: str, session_id: str = None) -> dict:
        """
        基本チャットメッセージの処理
        
        Args:
            message: ユーザーメッセージ
            session_id: セッションID
            
        Returns:
            処理結果辞書
        """
        try:
            logger.info(f"Processing basic chat: {message[:50]}...")
            
            # エージェント実行
            response = self.agent.run(message)
            
            return {
                "success": True,
                "message": response.content,
                "feature": "basic_chat",
                "processing_mode": "adk_agent",
                "session_id": session_id,
                "timestamp": datetime.now().isoformat(),
                "source": "basic_chat_agent"
            }
            
        except Exception as e:
            logger.error(f"BasicChatAgent error: {e}")
            return {
                "success": False,
                "error": f"チャット処理エラー: {str(e)}",
                "feature": "basic_chat",
                "session_id": session_id,
                "timestamp": datetime.now().isoformat()
            }

def create_agent():
    """エージェントファクトリー関数"""
    return BasicChatAgent()