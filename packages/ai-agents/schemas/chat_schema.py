"""
Chat Agent Schema
基本チャット機能用スキーマ
"""

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """チャットリクエスト"""
    message: str = Field(..., description="ユーザーメッセージ")
    session_id: str = Field(..., description="セッションID")


class ChatResponse(BaseModel):
    """チャットレスポンス"""
    response: str = Field(..., description="AI応答")
    session_id: str = Field(..., description="セッションID")
    confidence: float = Field(default=0.8, description="応答信頼度")