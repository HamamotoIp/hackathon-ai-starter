"""
All Agents Deployment Script
全ての専用Agent Engineを順次デプロイ
"""

import os
import sys
from datetime import datetime

# 各デプロイスクリプトをインポート
from deploy_analysis import deploy_analysis_agent
from deploy_restaurant_search import deploy_restaurant_search_agent


def deploy_all_agents():
    """全ての専用エージェントをデプロイ"""
    
    print("🚀 AIエージェントデプロイ開始")
    print("=" * 40)
    
    deployment_results = {}
    
    try:
        # 1. Analysis Agent デプロイ
        print("\n[1/2] Analysis Agent")
        analysis_app = deploy_analysis_agent()
        deployment_results['analysis'] = {
            'status': 'success',
            'resource_name': analysis_app.resource_name
        }
        # 完了メッセージは個別スクリプトが出力
        
    except Exception as e:
        print(f"❌ Analysis Agent デプロイ失敗: {e}")
        deployment_results['analysis'] = {
            'status': 'failed',
            'error': str(e)
        }
    
    try:
        # 2. Restaurant Search Agent デプロイ
        print("\n[2/2] Restaurant Search Agent")
        restaurant_search_app = deploy_restaurant_search_agent()
        deployment_results['restaurant_search'] = {
            'status': 'success',
            'resource_name': restaurant_search_app.resource_name
        }
        # 完了メッセージは個別スクリプトが出力
        
    except Exception as e:
        print(f"❌ Restaurant Search Agent デプロイ失敗: {e}")
        deployment_results['restaurant_search'] = {
            'status': 'failed',
            'error': str(e)
        }
    
    # 結果サマリー
    print("\n" + "=" * 40)
    print("📋 デプロイ結果")
    
    successful_deployments = 0
    failed_deployments = 0
    
    for agent_name, result in deployment_results.items():
        status_emoji = "✅" if result['status'] == 'success' else "❌"
        print(f"{status_emoji} {agent_name.upper()}: {result['status']}")
        
        if result['status'] == 'success':
            successful_deployments += 1
        else:
            failed_deployments += 1
            print(f"   エラー: {result.get('error', 'Unknown error')}")
    
    print(f"\n成功: {successful_deployments}/2 | 失敗: {failed_deployments}/2")
    
    # 環境変数設定ガイド
    if successful_deployments > 0:
        print("\n🔧 環境変数設定")
        print("-" * 40)
        
        if 'analysis' in deployment_results and deployment_results['analysis']['status'] == 'success':
            try:
                with open('../analysis_agent_url.txt', 'r') as f:
                    url = f.read().strip()
                print(f"ANALYSIS_AGENT_URL={url}")
            except FileNotFoundError:
                print("ANALYSIS_AGENT_URL=<analysis_agent_url.txtから取得>")
        
        
        if 'restaurant_search' in deployment_results and deployment_results['restaurant_search']['status'] == 'success':
            try:
                with open('../restaurant_search_agent_url.txt', 'r') as f:
                    url = f.read().strip()
                print(f"RESTAURANT_SEARCH_AGENT_URL={url}")
            except FileNotFoundError:
                print("RESTAURANT_SEARCH_AGENT_URL=<restaurant_search_agent_url.txtから取得>")
    
    return deployment_results


if __name__ == "__main__":
    # .envから環境変数を読み込み
    from dotenv import load_dotenv
    
    env_path = os.path.join(os.path.dirname(__file__), "../../../scripts/.env")
    load_dotenv(env_path)
    
    # 環境変数チェック
    if not os.getenv('VERTEX_AI_PROJECT_ID'):
        print("❌ VERTEX_AI_PROJECT_ID not found in .env. Please set VERTEX_AI_PROJECT_ID in .env")
        sys.exit(1)
    
    try:
        results = deploy_all_agents()
        
        # 全て失敗した場合は終了コード1
        if all(result['status'] == 'failed' for result in results.values()):
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n\n⚠️ デプロイ中断されました")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ 予期しないエラー: {e}")
        sys.exit(1)