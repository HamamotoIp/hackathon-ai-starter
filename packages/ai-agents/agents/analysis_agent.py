"""
Analysis Agent - 分析レポート専用エージェント
データ分析と詳細レポート作成に特化したAgent Engine
"""

from google.adk.agents import LlmAgent
import logging

logger = logging.getLogger(__name__)

def create_analysis_agent():
    """分析専用エージェントを作成"""
    
    agent = LlmAgent(
        name="analysis_specialist",
        model="gemini-2.0-flash-exp",
        description="データ分析と詳細レポート作成の専門エージェント。トレンド分析、統計処理、実行可能な推奨事項の提案が可能",
        instruction="""あなたはデータ分析の専門家です。

以下の手順で分析を実行してください：
1. データの概要把握と前処理
2. 重要な傾向やパターンの特定
3. 統計的分析の実施
4. 課題と機会の抽出
5. 実行可能な推奨事項の作成
6. 構造化されたレポートの出力

専門能力：
- トレンド分析と予測
- 統計的データ処理
- KPI・指標の評価
- 改善提案の策定

応答原則：
- 日本語で応答する
- 根拠に基づく分析結果を提供する
- データに基づいた客観的な評価
- 実行可能で具体的な推奨事項
- 構造化された読みやすいレポート形式

出力形式：
## 分析結果サマリー
[主要な発見事項を3-5点で要約]

## 詳細分析
### 1. データ概要
[対象データの特徴と範囲]

### 2. 主要な傾向
[発見されたパターンやトレンド]

### 3. 統計的分析
[数値的な分析結果]

### 4. 課題と機会
[特定された問題点と改善機会]

## 推奨事項
### 優先度: 高
[即座に実行すべき改善策]

### 優先度: 中
[中期的に検討すべき施策]

### 優先度: 低
[長期的な改善案]

## 次のステップ
[具体的なアクションプラン]"""
    )
    
    logger.info("Analysis Agent created successfully")
    return agent

def create_agent():
    """ファクトリー関数（Agent Engine デプロイ用）"""
    return create_analysis_agent()

# ローカルデバッグ用（推奨：adk api_server使用）
if __name__ == "__main__":
    print("=== Analysis Agent Local Test ===")
    print("推奨テスト手順：")
    print("1. ターミナルで 'adk api_server' を実行")
    print("2. 以下のcurlコマンドでテスト:")
    print()
    print("# セッション作成:")
    print("curl -X POST http://localhost:8000/apps/analysis_agent/users/test-user/sessions/test-session \\")
    print('  -H "Content-Type: application/json" \\')
    print('  -d \'{"state": {}}\'')
    print()
    print("# 分析実行:")
    print("curl -X POST http://localhost:8000/run \\")
    print('  -H "Content-Type: application/json" \\')
    print('  -d \'{')
    print('    "appName": "analysis_agent",')
    print('    "userId": "test-user",')
    print('    "sessionId": "test-session",')
    print('    "newMessage": {')
    print('      "role": "user",')
    print('      "parts": [{')
    print('        "text": "売上データを分析してください。今月の売上は前月比15%増加、新規顧客が30%増加している状況です。"')
    print('      }]')
    print('    }')
    print('  }\'')
    print()
    
    # エージェント作成確認
    try:
        agent = create_analysis_agent()
        print("✅ Analysis Agent作成成功")
        print(f"エージェント名: {agent.name}")
        print(f"モデル: {agent.model}")
    except Exception as e:
        print(f"❌ Analysis Agent作成失敗: {e}")
        import traceback
        traceback.print_exc()