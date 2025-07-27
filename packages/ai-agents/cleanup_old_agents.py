#!/usr/bin/env python3
"""
Agent Engine 古いバージョン削除スクリプト
最新のエージェント以外を削除して、Vertex AI リソースを整理します
"""

import os
import re
import sys
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import vertexai
from vertexai.agent_engines import AgentEngine


def extract_engine_id(url: str) -> Optional[str]:
    """URLからエンジンIDを抽出"""
    match = re.search(r'/reasoningEngines/(\d+)', url)
    return match.group(1) if match else None


def get_current_agents() -> Dict[str, str]:
    """現在使用中のエージェントのIDを取得"""
    agents = {}
    
    # Analysis Agent
    if os.path.exists('analysis_agent_url.txt'):
        with open('analysis_agent_url.txt', 'r') as f:
            url = f.read().strip()
            engine_id = extract_engine_id(url)
            if engine_id:
                agents['analysis'] = engine_id
    
    # UI Generation Agent
    if os.path.exists('ui_generation_agent_url.txt'):
        with open('ui_generation_agent_url.txt', 'r') as f:
            url = f.read().strip()
            engine_id = extract_engine_id(url)
            if engine_id:
                agents['ui_generation'] = engine_id
    
    # Restaurant Search Agent
    if os.path.exists('restaurant_search_agent_url.txt'):
        with open('restaurant_search_agent_url.txt', 'r') as f:
            url = f.read().strip()
            engine_id = extract_engine_id(url)
            if engine_id:
                agents['restaurant_search'] = engine_id
    
    return agents


def list_all_reasoning_engines() -> List[Tuple[str, str, str]]:
    """全てのReasoning Engineを一覧取得
    
    Returns:
        List of (resource_name, display_name, create_time)
    """
    try:
        from google.cloud import aiplatform_v1
        from google.api_core import client_options
        
        project_id = os.getenv('VERTEX_AI_PROJECT_ID')
        location = os.getenv('VERTEX_AI_LOCATION', 'us-central1')
        
        if not project_id:
            raise ValueError("PROJECT_ID not found in config.sh")
        
        # リージョナルエンドポイントを使用
        api_endpoint = f"{location}-aiplatform.googleapis.com"
        client_opts = client_options.ClientOptions(api_endpoint=api_endpoint)
        client = aiplatform_v1.ReasoningEngineServiceClient(client_options=client_opts)
        
        parent = f"projects/{project_id}/locations/{location}"
        
        engines = []
        request = aiplatform_v1.ListReasoningEnginesRequest(parent=parent)
        page_result = client.list_reasoning_engines(request=request)
        
        for engine in page_result:
            create_time = engine.create_time.strftime('%Y-%m-%d %H:%M:%S') if engine.create_time else 'Unknown'
            engines.append((engine.name, engine.display_name or 'No Name', create_time))
        
        return engines
        
    except Exception as e:
        print(f"❌ Reasoning Engine一覧取得エラー: {e}")
        return []


def cleanup_old_agents(dry_run: bool = True) -> None:
    """古いエージェントを削除"""
    
    print("🧹 Agent Engine クリーンアップスクリプト")
    print("=" * 50)
    
    # 現在使用中のエージェントを取得
    current_agents = get_current_agents()
    print(f"\n📋 現在使用中のエージェント: {len(current_agents)}個")
    for agent_type, engine_id in current_agents.items():
        print(f"  • {agent_type}: {engine_id}")
    
    # 全てのReasoning Engineを取得
    print(f"\n🔍 全Reasoning Engine検索中...")
    all_engines = list_all_reasoning_engines()
    
    if not all_engines:
        print("❌ Reasoning Engineが見つかりませんでした")
        return
    
    print(f"📊 検出されたReasoning Engine: {len(all_engines)}個")
    
    # 削除対象を特定
    engines_to_delete = []
    protected_engines = []
    
    for engine_name, display_name, create_time in all_engines:
        engine_id = extract_engine_id(engine_name)
        
        if engine_id and engine_id in current_agents.values():
            protected_engines.append((engine_name, display_name, create_time))
            print(f"  🔒 保護: {display_name} ({engine_id}) - {create_time}")
        else:
            engines_to_delete.append((engine_name, display_name, create_time))
            print(f"  🗑️  削除対象: {display_name} ({engine_id}) - {create_time}")
    
    print(f"\n📈 サマリー")
    print(f"  • 保護されるエージェント: {len(protected_engines)}個")
    print(f"  • 削除対象エージェント: {len(engines_to_delete)}個")
    
    if not engines_to_delete:
        print("\n✨ 削除対象のエージェントはありません")
        return
    
    if dry_run:
        print(f"\n⚠️  ドライランモード: 実際の削除は行われません")
        print(f"実際に削除するには --execute オプションを使用してください")
        return
    
    # 実際の削除実行
    print(f"\n🚨 削除を開始します...")
    
    successful_deletions = 0
    failed_deletions = 0
    
    for engine_name, display_name, create_time in engines_to_delete:
        try:
            print(f"🗑️  削除中: {display_name} ({create_time})")
            
            # AgentEngineインスタンスを作成して削除
            agent_engine = AgentEngine(resource_name=engine_name)
            agent_engine.delete(force=True)
            
            print(f"✅ 削除成功: {display_name}")
            successful_deletions += 1
            
        except Exception as e:
            print(f"❌ 削除失敗: {display_name} - {e}")
            failed_deletions += 1
    
    print(f"\n📊 削除結果")
    print(f"  • 成功: {successful_deletions}個")
    print(f"  • 失敗: {failed_deletions}個")
    
    if successful_deletions > 0:
        print(f"\n✨ クリーンアップ完了")


def main():
    """メイン関数"""
    
    # config.shから環境変数を読み込み
    config_path = os.path.join(os.path.dirname(__file__), "../../config.sh")
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
    
    # Vertex AI初期化
    project_id = os.getenv('VERTEX_AI_PROJECT_ID')
    if not project_id:
        print("❌ PROJECT_ID not found in config.sh. Please set PROJECT_ID in config.sh")
        sys.exit(1)
    
    try:
        location = os.getenv('VERTEX_AI_LOCATION', 'us-central1')
        vertexai.init(project=project_id, location=location)
    except Exception as e:
        print(f"❌ Vertex AI初期化エラー: {e}")
        sys.exit(1)
    
    # コマンドライン引数チェック
    execute_mode = '--execute' in sys.argv or '-e' in sys.argv
    
    if not execute_mode:
        print("⚠️  注意: これはドライランです。実際の削除は行われません。")
        print("実際に削除するには --execute または -e オプションを追加してください。\n")
    
    try:
        cleanup_old_agents(dry_run=not execute_mode)
        
    except KeyboardInterrupt:
        print("\n\n⚠️ クリーンアップが中断されました")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ 予期しないエラー: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()