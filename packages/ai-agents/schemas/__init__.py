"""
Schema Package - 各AI機能別スキーマ定義
"""

# Chat Agent Schemas
from .chat_schema import ChatRequest, ChatResponse

# Analysis Agent Schemas  
from .analysis_schema import AnalysisRequest, AnalysisResponse


# UI Generation Agent Schemas
from .ui_generation_schema import UIGenerationRequest, UIGenerationResponse

# Orchestrator Agent Schemas
from .orchestrator_schema import OrchestratorRequest, OrchestratorResponse

__all__ = [
    # Chat
    'ChatRequest', 'ChatResponse',
    
    # Analysis
    'AnalysisRequest', 'AnalysisResponse',
    
    
    # UI Generation
    'UIGenerationRequest', 'UIGenerationResponse',
    
    # Orchestrator
    'OrchestratorRequest', 'OrchestratorResponse'
]