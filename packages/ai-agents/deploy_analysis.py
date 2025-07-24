"""
Analysis Agent Deployment Script
分析レポート専用Agent Engineデプロイ
"""

import os
import logging
from datetime import datetime
from vertexai import init, agent_engines

# 分析専用エージェントをインポート
from agents.analysis_agent import create_agent as create_analysis_agent

# ログ設定（警告以上のみ表示）
logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)


def deploy_analysis_agent():
    """Analysis AgentをAgent Engineにデプロイ"""
    # 環境確認
    project_id = os.getenv('VERTEX_AI_PROJECT_ID')
    location = os.getenv('VERTEX_AI_LOCATION', 'us-central1')
    
    if not project_id:
        raise ValueError("VERTEX_AI_PROJECT_ID environment variable required")
    
    print(f"🚀 Analysis Agent デプロイ中...")
    
    # Vertex AI初期化
    init(project=project_id, location=location, 
         staging_bucket=f"gs://{project_id}-agent-engine-staging")
    
    # 分析専用エージェント作成
    analysis_agent = create_analysis_agent()
    
    # Agent Engineにデプロイ
    remote_app = agent_engines.create(
        analysis_agent,
        requirements=[
            "google-cloud-aiplatform[adk,agent_engines]>=1.88.0",
            "pydantic>=2.0.0"
        ],
        env_vars={"VERTEX_AI_PROJECT_ID": project_id},
        display_name="AI Chat Starter Kit - Analysis Agent",
        description="データ分析とレポート作成専用エージェント"
    )
    
    # デプロイ完了まで待機
    print("  処理中... (数分かかる場合があります)")
    try:
        remote_app.wait()
    except Exception as e:
        raise Exception(f"デプロイ失敗: {e}")
    
    # URLを保存
    agent_url = f"https://{location}-aiplatform.googleapis.com/v1/{remote_app.resource_name}:streamQuery?alt=sse"
    
    with open("analysis_agent_url.txt", "w") as f:
        f.write(agent_url)
    
    print(f"✅ Analysis Agent デプロイ完了")
    print(f"URL: {agent_url}")
    
    return remote_app


if __name__ == "__main__":
    try:
        deploy_analysis_agent()
    except Exception as e:
        print(f"❌ デプロイ失敗: {e}")
        raise