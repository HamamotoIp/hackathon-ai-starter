#!/usr/bin/env python3
"""
飲食店検索エージェントテストスクリプト
"""
import os
import sys
import subprocess
import tempfile
from pathlib import Path

def test_restaurant_search_agent():
    """飲食店検索エージェントをテスト"""
    print("🍽️ 飲食店検索エージェントテスト開始...")
    
    # 現在のディレクトリ
    current_dir = Path.cwd()
    
    # ai-agentsディレクトリに移動
    if current_dir.name == "debug":
        os.chdir("..")
    
    # 仮想環境のパスを確認
    venv_python = "./venv/bin/python"
    if not Path(venv_python).exists():
        print("❌ 仮想環境が見つかりません。venv/bin/pythonが必要です。")
        return False
    
    # テスト入力
    test_inputs = [
        "渋谷でデートに使えるディナーのお店を探している",
        "新宿でランチができるおしゃれなカフェを教えて",
        "銀座でビジネス会食に使える和食のお店を探している"
    ]
    
    for i, test_input in enumerate(test_inputs, 1):
        print(f"\n📝 テスト{i}: {test_input}")
        
        try:
            # ADKコマンドでテスト実行
            cmd = [
                venv_python, "-c", f"""
import subprocess
import sys
import os
sys.path.append('.')

# config.shから環境変数を読み込み
config_path = '../../config.sh'
if os.path.exists(config_path):
    with open(config_path, 'r') as f:
        config_content = f.read()
    
    import re
    project_match = re.search(r'PROJECT_ID="([^"]+)"', config_content)
    region_match = re.search(r'REGION="([^"]+)"', config_content)
    
    if project_match:
        os.environ['GOOGLE_CLOUD_PROJECT'] = project_match.group(1)
        os.environ['VERTEX_AI_PROJECT_ID'] = project_match.group(1)
    if region_match:
        os.environ['GOOGLE_CLOUD_LOCATION'] = region_match.group(1)
        os.environ['VERTEX_AI_LOCATION'] = region_match.group(1)

os.environ['GOOGLE_GENAI_USE_VERTEXAI'] = '1'

# ADKで実行
result = subprocess.run([
    'venv/bin/adk', 'run', 'restaurant_search_agent'
], input='{test_input}\\nexit\\n', text=True, capture_output=True, timeout=60)

print("=== STDOUT ===")
print(result.stdout)
if result.stderr:
    print("=== STDERR ===") 
    print(result.stderr)
print(f"=== RETURN CODE: {{result.returncode}} ===")
"""
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
            
            if result.returncode == 0:
                print("✅ テスト成功")
                # HTMLが含まれているかチェック
                if "<!DOCTYPE html>" in result.stdout and "</html>" in result.stdout:
                    print("✅ HTML生成確認")
                    
                    # HTMLをファイルに保存
                    html_start = result.stdout.find("<!DOCTYPE html>")
                    html_end = result.stdout.rfind("</html>") + 7
                    if html_start != -1 and html_end != -1:
                        html_content = result.stdout[html_start:html_end]
                        output_file = f"test_result_{i}.html"
                        with open(output_file, 'w', encoding='utf-8') as f:
                            f.write(html_content)
                        print(f"📁 HTML保存: {output_file}")
                else:
                    print("⚠️ HTML生成が確認できません")
            else:
                print("❌ テスト失敗")
                print("STDOUT:", result.stdout)
                print("STDERR:", result.stderr)
                
        except subprocess.TimeoutExpired:
            print("❌ テストタイムアウト（2分）")
        except Exception as e:
            print(f"❌ エラー: {e}")
    
    print("\n🎉 テスト完了")
    return True

if __name__ == "__main__":
    test_restaurant_search_agent()