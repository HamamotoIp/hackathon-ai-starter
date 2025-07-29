#!/usr/bin/env python3
"""
デプロイ済みエージェントの動作テスト
認証済みのVertex AI環境で実行
"""
import os
import sys
import json
import asyncio
from vertexai import init
from google.cloud import aiplatform

# Vertex AI初期化
project_id = "246970286644"
location = "us-central1"
init(project=project_id, location=location)

async def test_agent(agent_id: str, agent_name: str, test_input: str):
    """エージェントをテスト"""
    print(f"\n🔍 {agent_name}テスト中...")
    
    try:
        # ReasoningEngineクライアント作成
        client = aiplatform.ReasoningEngineServiceClient()
        reasoning_engine_name = f"projects/{project_id}/locations/{location}/reasoningEngines/{agent_id}"
        
        # クエリ実行
        request = aiplatform.QueryReasoningEngineRequest(
            name=reasoning_engine_name,
            input={"user_input": test_input}
        )
        
        response = client.query_reasoning_engine(request=request, timeout=180)
        
        if response.output:
            print(f"✅ {agent_name}: 正常動作")
            print(f"   レスポンス長: {len(str(response.output))} 文字")
            # 最初の200文字を表示
            output_str = str(response.output)[:200]
            print(f"   内容: {output_str}...")
        else:
            print(f"❌ {agent_name}: 空のレスポンス")
            
    except Exception as e:
        print(f"❌ {agent_name}: エラー - {str(e)[:100]}...")

async def main():
    """メイン実行関数"""
    print("🚀 デプロイ済みエージェントテスト開始...")
    
    # テスト対象
    agents = [
        ("7017549401396609024", "分析レポートエージェント", "東京の売上データを分析してレポートを作成して"),
        ("8308393644591677440", "UI生成エージェント", "ログインフォームのHTMLを作成して"),  
        ("3756943271180369920", "飲食店検索エージェント", "渋谷でデートにおすすめのレストランを探して")
    ]
    
    # 各エージェントをテスト
    for agent_id, agent_name, test_input in agents:
        await test_agent(agent_id, agent_name, test_input)
        
    print("\n🎉 テスト完了")

if __name__ == "__main__":
    asyncio.run(main())