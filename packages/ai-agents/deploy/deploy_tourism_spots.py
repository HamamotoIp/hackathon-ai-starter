#!/usr/bin/env python3
"""
観光スポット検索エージェントデプロイスクリプト
"""
import os
import sys
import logging
from datetime import datetime
from dotenv import load_dotenv
from vertexai import init, agent_engines

# ADK標準構造からエージェントをインポート
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from tourism_spots_agent.agent import root_agent as tourism_spots_agent

# ログ設定（警告以上のみ表示）
logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)

def deploy_tourism_spots_agent():
    """観光スポット検索エージェントをAgent Engineにデプロイ"""
    # .envファイルから環境変数を読み込み
    env_path = os.path.join(os.path.dirname(__file__), "../../../scripts/.env")
    if os.path.exists(env_path):
        load_dotenv(env_path)
    
    # 環境確認
    project_id = os.getenv('PROJECT_ID') or os.getenv('VERTEX_AI_PROJECT_ID')
    location = os.getenv('REGION') or os.getenv('VERTEX_AI_LOCATION', 'us-central1')
    
    if not project_id:
        raise ValueError("PROJECT_ID not found in .env file. Please set PROJECT_ID in .env")
    
    print(f"🚀 観光スポット検索エージェントデプロイ中...")
    
    # Vertex AI初期化
    init(project=project_id, location=location, 
         staging_bucket=f"gs://{project_id}-agent-engine-staging")
    
    # Agent Engineにデプロイ
    remote_app = agent_engines.create(
        tourism_spots_agent,
        requirements=[
            "google-cloud-aiplatform[adk,agent_engines]>=1.88.0",
            "pydantic>=2.0.0"
        ],
        extra_packages=["tourism_spots_agent"],
        env_vars={"VERTEX_AI_PROJECT_ID": project_id},
        display_name="AI Chat Starter Kit - Tourism Spots Search Agent",
        description="観光スポット検索とHTML記事生成専用エージェント"
    )
    
    # デプロイ完了まで待機
    print("  処理中... (数分かかる場合があります)")
    try:
        # 作成処理実行
        remote_app.create()
        
        # URL生成とファイル保存
        agent_url = f"https://{location}-aiplatform.googleapis.com/v1/{remote_app.resource_name}:streamQuery?alt=sse"
        
        with open('tourism_spots_search_agent_url.txt', 'w') as f:
            f.write(agent_url)
        
        print("✅ 観光スポット検索エージェントデプロイ完了")
        print(f"URL: {agent_url}")
        
        return remote_app
        
    except Exception as e:
        # エラーログ保存
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        with open(f'tourism_spots_deploy_{timestamp}.log', 'w') as f:
            f.write(f"Error: {str(e)}\n")
            f.write(f"Timestamp: {datetime.now().isoformat()}\n")
        
        raise Exception(f"デプロイエラー: {str(e)}")

def main():
    """メイン実行関数"""
    try:
        deploy_tourism_spots_agent()
        print("\n🎉 観光スポット検索エージェントデプロイ完了！")
        return 0
    except Exception as e:
        print(f"❌ エラー: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())