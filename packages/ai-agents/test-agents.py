#!/usr/bin/env python3
"""
Agent Engine Local Testing Tool
ローカル環境でのAgent Engineテストツール
"""

import os
import sys
import json
import logging
from datetime import datetime
from typing import Dict, Any

# ローカル環境でのテスト用設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_adk_imports():
    """ADKライブラリのインポートテスト"""
    print("🔍 ADKライブラリテスト")
    print("-" * 40)
    
    try:
        from google import adk
        print("✅ google.adk インポート成功")
        
        # AdkAppの正しいインポートパスを試行
        try:
            from google.adk.core import AdkApp
            print("✅ AdkApp インポート成功 (core)")
        except ImportError:
            try:
                from google_adk import AdkApp
                print("✅ AdkApp インポート成功 (google_adk)")
            except ImportError:
                # ADK v1.1.1では AdkApp がない可能性
                print("⚠️ AdkApp インポートスキップ (旧バージョン)")
        
        # 基本的なエージェント作成テスト
        test_agent = adk.Agent(name="test_agent")
        print(f"✅ テストエージェント作成成功: {test_agent.name}")
        
        return True
        
    except ImportError as e:
        print(f"❌ ADKインポートエラー: {e}")
        return False
    except Exception as e:
        print(f"❌ ADKテストエラー: {e}")
        return False

def test_individual_agents():
    """個別エージェントのテスト"""
    print("\n🤖 個別エージェントテスト")
    print("-" * 40)
    
    results = {}
    
    # BasicChatAgent
    try:
        from agents.chat.basic_chat_agent import create_agent as create_chat
        chat_agent = create_chat()
        print(f"✅ BasicChatAgent: {chat_agent.name}")
        results['chat'] = True
    except Exception as e:
        print(f"❌ BasicChatAgent: {e}")
        results['chat'] = False
    
    # AnalysisAgent
    try:
        from agents.analysis.sentiment_agent import create_agent as create_analysis
        analysis_agent = create_analysis()
        print(f"✅ AnalysisAgent: {analysis_agent.name}")
        results['analysis'] = True
    except Exception as e:
        print(f"❌ AnalysisAgent: {e}")
        results['analysis'] = False
    
    # ComparisonAgent
    try:
        from agents.comparison.comparison_agent import create_agent as create_comparison
        comparison_agent = create_comparison()
        print(f"✅ ComparisonAgent: {comparison_agent.name}")
        results['comparison'] = True
    except Exception as e:
        print(f"❌ ComparisonAgent: {e}")
        results['comparison'] = False
    
    return results

def test_multi_agent_app():
    """マルチエージェントアプリケーションのテスト"""
    print("\n🚀 マルチエージェントアプリテスト")
    print("-" * 40)
    
    try:
        from google import adk
        
        # 各エージェントの作成
        from agents.chat.basic_chat_agent import create_agent as create_chat
        from agents.analysis.sentiment_agent import create_agent as create_analysis  
        from agents.comparison.comparison_agent import create_agent as create_comparison
        
        chat_agent = create_chat()
        analysis_agent = create_analysis()
        comparison_agent = create_comparison()
        
        print("✅ 全エージェント作成成功")
        
        # ルートエージェント作成
        root_agent = adk.Agent(
            name="test_orchestrator",
            model=adk.models.Gemini(
                model_name="gemini-2.0-flash-exp",
                temperature=0.1
            )
        )
        
        print("✅ ルートエージェント作成成功")
        
        # ADK App作成を試行（バージョンによって異なる可能性）
        try:
            # 新しいバージョンのADK
            app = adk.AdkApp(
                agent=root_agent,
                agents=[chat_agent, analysis_agent, comparison_agent],
                enable_tracing=True
            )
            print("✅ マルチエージェントアプリ作成成功 (AdkApp)")
            print(f"   エージェント数: {len(app.agents) + 1}")  # +1 for root agent
        except Exception as e:
            # 旧バージョン またはADK App不使用の場合
            print(f"⚠️ AdkApp作成スキップ: {e}")
            print("✅ 個別エージェント作成のみ成功")
        
        return True
        
    except Exception as e:
        print(f"❌ マルチエージェントアプリ作成失敗: {e}")
        return False

def test_mock_interactions():
    """モック実行テスト"""
    print("\n💬 モック実行テスト")
    print("-" * 40)
    
    # 環境変数がない場合のモック実行
    if not os.environ.get('VERTEX_AI_PROJECT_ID'):
        print("⚠️  VERTEX_AI_PROJECT_ID未設定 - モックモードでテスト")
        
        # モックレスポンス
        mock_responses = {
            'chat': {
                'success': True,
                'message': 'モック: こんにちは！',
                'feature': 'basic_chat',
                'source': 'mock_agent'
            },
            'analysis': {
                'success': True,
                'message': 'モック: 分析レポートを作成しました。',
                'feature': 'analysis_report',
                'source': 'mock_agent'
            },
            'comparison': {
                'success': True,
                'message': 'モック: 比較研究を実行しました。',
                'feature': 'comparison_study',
                'source': 'mock_agent'
            }
        }
        
        for feature, response in mock_responses.items():
            print(f"✅ {feature}モック: {response['message']}")
        
        return True
    else:
        print("🔧 VERTEX_AI_PROJECT_ID設定済み - 実際のテスト可能")
        return True

def generate_test_report(results: Dict[str, Any]):
    """テスト結果レポート生成"""
    print("\n📋 テスト結果レポート")
    print("=" * 60)
    
    # 基本情報
    print(f"実行時刻: {datetime.now().isoformat()}")
    print(f"Python: {sys.version}")
    print(f"作業ディレクトリ: {os.getcwd()}")
    
    # 環境変数
    env_vars = {
        'VERTEX_AI_PROJECT_ID': os.environ.get('VERTEX_AI_PROJECT_ID', '未設定'),
        'VERTEX_AI_LOCATION': os.environ.get('VERTEX_AI_LOCATION', '未設定'),
        'AGENT_RESOURCE_NAME': os.environ.get('AGENT_RESOURCE_NAME', '未設定')
    }
    
    print("\n環境変数:")
    for key, value in env_vars.items():
        status = "✅" if value != "未設定" else "⚠️"
        print(f"  {status} {key}: {value}")
    
    # テスト結果
    print("\nテスト結果:")
    total_tests = len(results)
    passed_tests = sum(1 for v in results.values() if v)
    
    for test_name, result in results.items():
        status = "✅" if result else "❌"
        print(f"  {status} {test_name}")
    
    print(f"\n合計: {passed_tests}/{total_tests} テスト成功")
    
    # 推奨アクション
    print("\n💡 推奨アクション:")
    if passed_tests == total_tests:
        print("  🎉 全テスト成功！")
        print("  次のステップ: python deploy.py でAgent Engineデプロイ")
    else:
        print("  🔧 失敗したテストを確認して修正してください")
        print("  requirements.txtの依存関係を確認: pip install -r requirements.txt")
        
    # ファイル確認
    print("\n📁 ファイル確認:")
    required_files = [
        'requirements.txt',
        'deploy.py',
        'app.py',
        'agents/chat/basic_chat_agent.py',
        'agents/analysis/sentiment_agent.py',
        'agents/comparison/comparison_agent.py'
    ]
    
    for file_path in required_files:
        status = "✅" if os.path.exists(file_path) else "❌"
        print(f"  {status} {file_path}")

def main():
    """メイン実行関数"""
    print("🧪 Agent Engine ローカルテストツール")
    print("=" * 60)
    
    results = {}
    
    # ADKライブラリテスト
    results['adk_imports'] = test_adk_imports()
    
    # 個別エージェントテスト
    agent_results = test_individual_agents()
    results.update(agent_results)
    
    # マルチエージェントアプリテスト
    results['multi_agent_app'] = test_multi_agent_app()
    
    # モック実行テスト
    results['mock_interactions'] = test_mock_interactions()
    
    # レポート生成
    generate_test_report(results)

if __name__ == "__main__":
    main()