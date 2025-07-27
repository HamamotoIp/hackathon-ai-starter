#!/usr/bin/env python3
"""
AI Agents テストスクリプト
各エージェントの動作確認と性能テスト
"""

import sys
import os
import time
import json
import requests
from datetime import datetime

# 親ディレクトリをPythonパスに追加
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class AgentTester:
    def __init__(self, base_url="http://localhost:8080"):
        self.base_url = base_url
        self.test_results = []
    
    def test_adk_server_connection(self):
        """ADKサーバー接続テスト"""
        print("🔌 ADKサーバー接続テスト...")
        # ADKサーバーのヘルスチェック相当をテスト
        try:
            # ADKサーバーが起動しているかポート8000で確認
            import socket
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(5)
            result = sock.connect_ex(('localhost', 8000))
            sock.close()
            
            if result == 0:
                print("✅ ADKサーバー接続成功 (ポート8000)")
                return True
            else:
                print("❌ ADKサーバーが起動していません")
                print("   `adk web analysis_agent` でサーバーを起動してください")
                return False
        except Exception as e:
            print(f"❌ ADKサーバー接続エラー: {e}")
            return False
    
    def test_analysis_agent(self):
        """分析エージェントテスト"""
        print("\n📊 分析エージェントテスト...")
        test_data = {
            "content": "売上データの分析をお願いします。Q1: 100万円、Q2: 150万円、Q3: 200万円、Q4: 180万円。トレンドと改善点を教えてください。"
        }
        
        return self._test_agent_endpoint("/analysis", test_data, "分析エージェント")
    
    def test_ui_generation_agent(self):
        """UI生成エージェントテスト"""
        print("\n🎨 UI生成エージェントテスト...")
        test_data = {
            "content": "ユーザー登録フォームを作成してください。名前、メールアドレス、パスワード、パスワード確認の入力欄を含め、送信ボタンも追加してください。デザインはモダンでレスポンシブにしてください。"
        }
        
        return self._test_agent_endpoint("/ui_generation", test_data, "UI生成エージェント")
    
    def _test_agent_endpoint(self, endpoint, data, agent_name):
        """エージェントエンドポイントの共通テスト"""
        try:
            start_time = time.time()
            response = requests.post(
                f"{self.base_url}{endpoint}",
                json=data,
                headers={"Content-Type": "application/json"},
                timeout=120  # 2分のタイムアウト
            )
            end_time = time.time()
            processing_time = round((end_time - start_time) * 1000)  # ミリ秒
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ {agent_name}テスト成功")
                print(f"   処理時間: {processing_time}ms")
                print(f"   レスポンスサイズ: {len(response.text)} bytes")
                
                # 結果の詳細表示（最初の100文字のみ）
                if 'result' in result:
                    result_preview = str(result['result'])[:100] + "..." if len(str(result['result'])) > 100 else str(result['result'])
                    print(f"   結果プレビュー: {result_preview}")
                
                self.test_results.append({
                    "agent": agent_name,
                    "status": "success",
                    "processing_time_ms": processing_time,
                    "response_size": len(response.text),
                    "timestamp": datetime.now().isoformat()
                })
                return True
            else:
                print(f"❌ {agent_name}テスト失敗 (Status: {response.status_code})")
                print(f"   エラー内容: {response.text}")
                self.test_results.append({
                    "agent": agent_name,
                    "status": "failed",
                    "error": response.text,
                    "timestamp": datetime.now().isoformat()
                })
                return False
                
        except requests.exceptions.Timeout:
            print(f"⏱️ {agent_name}テスト タイムアウト")
            self.test_results.append({
                "agent": agent_name,
                "status": "timeout",
                "timestamp": datetime.now().isoformat()
            })
            return False
        except Exception as e:
            print(f"❌ {agent_name}テストエラー: {e}")
            self.test_results.append({
                "agent": agent_name,
                "status": "error",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            })
            return False
    
    def run_all_tests(self):
        """全テストの実行"""
        print("🚀 AI Agents テスト開始...")
        print(f"テスト対象: {self.base_url}")
        print("=" * 50)
        
        # ADKサーバー接続確認
        if not self.test_adk_server_connection():
            print("\n❌ ADKサーバーが起動していません。テストを中止します。")
            print("まず `adk web analysis_agent` でサーバーを起動してから再実行してください。")
            return False
        
        # 各エージェントのテスト
        success_count = 0
        total_tests = 2
        
        if self.test_analysis_agent():
            success_count += 1
        
        if self.test_ui_generation_agent():
            success_count += 1
        
        # 結果サマリー
        print("\n" + "=" * 50)
        print("📋 テスト結果サマリー")
        print(f"成功: {success_count}/{total_tests}")
        print(f"成功率: {round(success_count/total_tests*100)}%")
        
        # 詳細結果をファイルに保存
        self.save_results()
        
        return success_count == total_tests
    
    def save_results(self):
        """テスト結果をファイルに保存"""
        try:
            os.makedirs('debug', exist_ok=True)
            filename = f"debug/test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump({
                    "test_summary": {
                        "timestamp": datetime.now().isoformat(),
                        "base_url": self.base_url,
                        "total_tests": len(self.test_results),
                        "success_count": len([r for r in self.test_results if r['status'] == 'success'])
                    },
                    "test_results": self.test_results
                }, f, indent=2, ensure_ascii=False)
            print(f"📄 テスト結果を保存: {filename}")
        except Exception as e:
            print(f"❌ テスト結果保存エラー: {e}")

def main():
    # コマンドライン引数でURLを指定可能
    base_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8080"
    
    tester = AgentTester(base_url)
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 全テスト成功！")
        sys.exit(0)
    else:
        print("\n💥 一部のテストが失敗しました")
        sys.exit(1)

if __name__ == "__main__":
    main()