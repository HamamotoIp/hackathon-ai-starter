"""
Analysis Agent Schema
分析機能用スキーマ
"""

from pydantic import BaseModel, Field
from typing import List, Dict


class AnalysisRequest(BaseModel):
    """分析リクエスト"""
    content: str = Field(..., description="分析対象コンテンツ")
    analysis_type: str = Field(default="general", description="分析タイプ")
    session_id: str = Field(..., description="セッションID")


class AnalysisResponse(BaseModel):
    """分析レスポンス"""
    analysis_result: str = Field(..., description="分析結果")
    sentiment: str = Field(..., description="感情分析結果")
    keywords: List[str] = Field(default=[], description="キーワード抽出")
    summary: str = Field(..., description="要約")
    confidence: float = Field(default=0.8, description="分析信頼度")