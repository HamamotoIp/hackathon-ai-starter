"""
Orchestrator Agent Schema
統合エージェント用スキーマ
"""

from pydantic import BaseModel, Field
from typing import Optional, Any, Dict


class OrchestratorRequest(BaseModel):
    """統合エージェントリクエスト"""
    user_input: str = Field(..., description="ユーザー入力")
    session_id: str = Field(..., description="セッションID")
    context: Optional[Dict[str, Any]] = Field(default=None, description="コンテキスト情報")


class OrchestratorResponse(BaseModel):
    """統合エージェントレスポンス"""
    result: str = Field(..., description="最終結果")
    agent_used: str = Field(..., description="使用されたエージェント")
    processing_time: float = Field(..., description="処理時間(秒)")
    confidence: float = Field(default=0.8, description="総合信頼度")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="追加メタデータ")