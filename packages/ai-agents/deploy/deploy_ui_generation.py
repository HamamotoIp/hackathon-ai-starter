"""
UI Generation Agent Deployment Script
UI生成専用Agent Engineデプロイ
"""

import os
import sys
import logging
from datetime import datetime
from vertexai import init, agent_engines

# ADK標準構造からエージェントをインポート
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ui_generation_agent.agent import root_agent as ui_generation_agent

# ログ設定（警告以上のみ表示）
logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)


def deploy_ui_generation_agent():
    """UI Generation AgentをAgent Engineにデプロイ"""
    # config.shから環境変数を読み込み
    config_path = os.path.join(os.path.dirname(__file__), "../../../config.sh")
    if os.path.exists(config_path):
        # config.shからPROJECT_IDとREGIONを読み取り
        with open(config_path, 'r') as f:
            config_content = f.read()
        
        import re
        project_match = re.search(r'PROJECT_ID="([^"]+)"', config_content)
        region_match = re.search(r'REGION="([^"]+)"', config_content)
        
        if project_match:
            os.environ['VERTEX_AI_PROJECT_ID'] = project_match.group(1)
        if region_match:
            os.environ['VERTEX_AI_LOCATION'] = region_match.group(1)
    
    # 環境確認
    project_id = os.getenv('VERTEX_AI_PROJECT_ID')
    location = os.getenv('VERTEX_AI_LOCATION', 'us-central1')
    
    if not project_id:
        raise ValueError("PROJECT_ID not found in config.sh. Please set PROJECT_ID in config.sh")
    
    print(f"🚀 UI Generation Agent デプロイ中...")
    
    # Vertex AI初期化
    init(project=project_id, location=location, 
         staging_bucket=f"gs://{project_id}-agent-engine-staging")
    
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
    
    # デプロイ完了まで待機
    print("  処理中... (数分かかる場合があります)")
    try:
        remote_app.wait()
    except Exception as e:
        raise Exception(f"デプロイ失敗: {e}")
    
    # URLを保存
    agent_url = f"https://{location}-aiplatform.googleapis.com/v1/{remote_app.resource_name}:streamQuery?alt=sse"
    
    with open("ui_generation_agent_url.txt", "w") as f:
        f.write(agent_url)
    
    print(f"✅ UI Generation Agent デプロイ完了")
    print(f"URL: {agent_url}")
    
    return remote_app


if __name__ == "__main__":
    try:
        deploy_ui_generation_agent()
    except Exception as e:
        print(f"❌ デプロイ失敗: {e}")
        raise