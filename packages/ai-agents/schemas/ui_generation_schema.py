"""
UI Generation Agent Schema
UI生成機能用スキーマ
"""

from pydantic import BaseModel, Field
from typing import Optional, List


class UIGenerationRequest(BaseModel):
    """UI生成リクエスト"""
    prompt: str = Field(..., description="UI生成プロンプト", max_length=3000)
    ui_type: Optional[str] = Field(default="auto", description="UIタイプ")
    session_id: str = Field(..., description="セッションID")


class UIGenerationResponse(BaseModel):
    """UI生成レスポンス"""
    html: str = Field(..., description="生成された生HTML（Tailwind CSS使用）")
    ui_type: str = Field(..., description="判定されたUIタイプ")
    components: List[str] = Field(default=[], description="含まれるコンポーネント")
    responsive: bool = Field(default=True, description="レスポンシブ対応")