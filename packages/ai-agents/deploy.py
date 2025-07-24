"""
Agent Engine Deployment Script
統合オーケストレーターをAgent Engineにデプロイ
"""

import os
import logging
from datetime import datetime
from vertexai import init, agent_engines

# ADK推奨パターンのオーケストレーターをインポート
from agents.adk_orchestrator import create_agent as create_adk_orchestrator

# ログ設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def deploy_agent_engine():
    """Agent Engineにデプロイ"""
    # 環境確認
    project_id = os.getenv('VERTEX_AI_PROJECT_ID')
    location = os.getenv('VERTEX_AI_LOCATION', 'us-central1')
    
    if not project_id:
        raise ValueError("VERTEX_AI_PROJECT_ID environment variable required")
    
    print(f"🚀 Deploying to Agent Engine: {project_id} ({location})")
    
    # Vertex AI初期化
    init(project=project_id, location=location, 
         staging_bucket=f"gs://{project_id}-agent-engine-staging")
    
    # ADK推奨パターンのオーケストレーター作成
    orchestrator = create_adk_orchestrator()
    logger.info("ADK Multi-Agent Orchestrator created")
    
    # Agent Engineにデプロイ
    remote_app = agent_engines.create(
        orchestrator,
        requirements=[
            "google-cloud-aiplatform[adk,agent_engines]>=1.88.0",
            "pydantic>=2.0.0"
        ],
        env_vars={"VERTEX_AI_PROJECT_ID": project_id},
        display_name="AI Chat Starter Kit ADK Multi-Agent",
        description="ADK推奨パターンによるマルチエージェントシステム"
    )
    
    # URLを保存
    agent_url = f"https://{location}-aiplatform.googleapis.com/v1/{remote_app.resource_name}:streamQuery?alt=sse"
    
    with open("agent_engine_url.txt", "w") as f:
        f.write(agent_url)
    
    print(f"✅ Deployment completed!")
    print(f"Agent URL: {agent_url}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    
    return remote_app


if __name__ == "__main__":
    try:
        deploy_agent_engine()
    except Exception as e:
        print(f"❌ Deployment failed: {e}")
        raise