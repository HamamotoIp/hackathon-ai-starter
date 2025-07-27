#!/usr/bin/env python3
"""
AI Agents デバッグ用サーバー
ローカル開発でのデバッグ・診断機能を提供
"""

import sys
import os
import logging
import traceback
from datetime import datetime
from flask import Flask, request, jsonify
import json

# 親ディレクトリをPythonパスに追加
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

app = Flask(__name__)

# 詳細ログ設定
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('debug/debug.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

@app.route('/debug/health', methods=['GET'])
def debug_health():
    """デバッグ用ヘルスチェック"""
    return jsonify({
        "status": "debug_mode",
        "timestamp": datetime.now().isoformat(),
        "python_version": sys.version,
        "env_vars": {
            "VERTEX_AI_PROJECT_ID": os.getenv('VERTEX_AI_PROJECT_ID', 'config.shから読み込み'),
            "VERTEX_AI_LOCATION": os.getenv('VERTEX_AI_LOCATION', 'config.shから読み込み'),
            "PORT": os.getenv('PORT', '8080')
        }
    })

@app.route('/debug/test-agent', methods=['POST'])
def test_agent():
    """エージェントのテスト実行"""
    try:
        data = request.get_json()
        agent_type = data.get('agent', 'analysis')
        content = data.get('content', 'テストコンテンツ')
        
        logger.info(f"Testing agent: {agent_type} with content: {content}")
        
        # エージェントの動的インポートとテスト
        if agent_type == 'analysis':
            from agents.analysis_agent import create_analysis_agent
            agent = create_analysis_agent()
            result = agent['handler'](content)
        elif agent_type == 'ui_generation':
            from agents.ui_generation_agent import create_ui_generation_agent
            agent = create_ui_generation_agent()
            result = agent['handler'](content)
        else:
            return jsonify({"error": f"Unknown agent type: {agent_type}"}), 400
        
        logger.info(f"Agent test completed successfully")
        return jsonify({
            "success": True,
            "agent": agent_type,
            "result": result,
            "debug_info": {
                "request_time": datetime.now().isoformat(),
                "content_length": len(content)
            }
        })
        
    except Exception as e:
        error_trace = traceback.format_exc()
        logger.error(f"Agent test failed: {str(e)}\n{error_trace}")
        return jsonify({
            "success": False,
            "error": str(e),
            "traceback": error_trace
        }), 500

@app.route('/debug/logs', methods=['GET'])
def get_logs():
    """デバッグログの取得"""
    try:
        log_file = 'debug/debug.log'
        if os.path.exists(log_file):
            with open(log_file, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                # 最新の50行を返す
                recent_logs = lines[-50:] if len(lines) > 50 else lines
                return jsonify({
                    "logs": recent_logs,
                    "total_lines": len(lines),
                    "showing": len(recent_logs)
                })
        else:
            return jsonify({"logs": [], "message": "No log file found"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/debug/clear-logs', methods=['POST'])
def clear_logs():
    """ログファイルのクリア"""
    try:
        log_file = 'debug/debug.log'
        if os.path.exists(log_file):
            open(log_file, 'w').close()
            logger.info("Debug logs cleared")
        return jsonify({"message": "Logs cleared successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/debug/env-check', methods=['GET'])
def env_check():
    """環境変数と設定の確認"""
    try:
        # GCP認証チェック
        try:
            import google.auth
            credentials, project = google.auth.default()
            gcp_auth = {"status": "OK", "project": project}
        except Exception as e:
            gcp_auth = {"status": "ERROR", "error": str(e)}
        
        # Vertex AI接続チェック
        try:
            from google.cloud import aiplatform
            aiplatform.init(
                project=os.getenv('VERTEX_AI_PROJECT_ID'),
                location=os.getenv('VERTEX_AI_LOCATION')
            )
            vertex_ai = {"status": "OK"}
        except Exception as e:
            vertex_ai = {"status": "ERROR", "error": str(e)}
        
        return jsonify({
            "environment": {
                "python_version": sys.version,
                "working_directory": os.getcwd(),
                "environment_variables": {
                    key: value for key, value in os.environ.items() 
                    if 'VERTEX' in key or 'GOOGLE' in key or 'GCP' in key
                }
            },
            "gcp_authentication": gcp_auth,
            "vertex_ai": vertex_ai,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("🐛 AI Agents Debug Server Starting...")
    print("Available endpoints:")
    print("  GET  /debug/health     - ヘルスチェック")
    print("  POST /debug/test-agent - エージェントテスト")
    print("  GET  /debug/logs       - ログ取得")
    print("  POST /debug/clear-logs - ログクリア")
    print("  GET  /debug/env-check  - 環境確認")
    
    port = int(os.getenv('DEBUG_PORT', 8081))
    app.run(debug=True, host='0.0.0.0', port=port)