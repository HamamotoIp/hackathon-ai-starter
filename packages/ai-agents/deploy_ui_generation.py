"""
UI Generation Agent Deployment Script
UI生成専用Agent Engineデプロイ
"""

import os
import logging
from datetime import datetime
from vertexai import init, agent_engines

# UI生成専用エージェントをインポート
from agents.ui_generation_agent import create_agent as create_ui_generation_agent

# ログ設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def deploy_ui_generation_agent():
    """UI Generation AgentをAgent Engineにデプロイ"""
    # 環境確認
    project_id = os.getenv('VERTEX_AI_PROJECT_ID')
    location = os.getenv('VERTEX_AI_LOCATION', 'us-central1')
    
    if not project_id:
        raise ValueError("VERTEX_AI_PROJECT_ID environment variable required")
    
    print(f"🚀 Deploying UI Generation Agent: {project_id} ({location})")
    
    # Vertex AI初期化
    init(project=project_id, location=location, 
         staging_bucket=f"gs://{project_id}-agent-engine-staging")
    
    # UI生成専用エージェント作成
    ui_generation_agent = create_ui_generation_agent()
    logger.info("UI Generation Agent created")
    
    # Agent Engineにデプロイ
    remote_app = agent_engines.create(
        ui_generation_agent,
        requirements=[
            "google-cloud-aiplatform[adk,agent_engines]>=1.88.0",
            "pydantic>=2.0.0"
        ],
        env_vars={"VERTEX_AI_PROJECT_ID": project_id},
        display_name="AI Chat Starter Kit - UI Generation Agent",
        description="HTML/Tailwind CSS UI生成専用エージェント"
    )
    
    # LRO (Long Running Operation) 完了まで待機
    logger.info("Waiting for Agent Engine LRO completion...")
    try:
        remote_app.wait()  # LRO完了まで待機
        logger.info("Agent Engine LRO completed successfully")
    except Exception as e:
        logger.error(f"Agent Engine LRO failed: {e}")
        raise
    
    # URLを保存
    agent_url = f"https://{location}-aiplatform.googleapis.com/v1/{remote_app.resource_name}:streamQuery?alt=sse"
    
    with open("ui_generation_agent_url.txt", "w") as f:
        f.write(agent_url)
    
    print(f"✅ UI Generation Agent Deployment completed!")
    print(f"Agent URL: {agent_url}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    
    return remote_app


if __name__ == "__main__":
    try:
        deploy_ui_generation_agent()
    except Exception as e:
        print(f"❌ UI Generation Agent deployment failed: {e}")
        raise