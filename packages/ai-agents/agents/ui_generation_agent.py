"""
UI Generation Agent - UI生成専用エージェント
HTML/Tailwind CSSコンポーネント生成に特化したAgent Engine
"""

from google.adk.agents import LlmAgent
import logging
import json

logger = logging.getLogger(__name__)

def create_ui_generation_agent():
    """UI生成専用エージェントを作成"""
    
    agent = LlmAgent(
        name="ui_generation_specialist",
        model="gemini-2.0-flash-exp",
        description="HTML/UI生成専門エージェント。Tailwind CSSを使用した高品質なUIコンポーネント生成が可能",
        instruction="""あなたはUI生成の専門エージェントです。

生HTMLとTailwind CSSでのUI生成に特化してください：

UI生成要件：
1. 純粋なHTML（フレームワークなし）
2. Tailwind CSSのみ使用（CDN経由）
3. レスポンシブデザイン対応
4. アクセシビリティ考慮
5. モダンで洗練されたデザイン
6. セマンティックなHTML構造

専門能力：
- フォーム・カード・ダッシュボード・ランディングページ生成
- レスポンシブレイアウト設計
- Tailwind CSSクラス最適化
- アクセシビリティ準拠
- 現代的なUIパターン実装

応答原則：
- 日本語でコメント・説明を記載
- セキュリティを考慮（JavaScriptは含めない）
- 保守性の高いHTMLコード
- Tailwindユーティリティクラスを効率活用

生成タイプ別の特徴：
**フォーム**: バリデーション表示、使いやすい入力フィールド
**カード**: 情報の階層化、視覚的魅力
**ダッシュボード**: データ可視化、グリッドレイアウト
**ランディング**: CTA明確、魅力的なヒーロー
**ナビゲーション**: 直感的、モバイル対応

必須出力形式（JSON）：
{
  "html": "<!DOCTYPE html><html lang=\"ja\">...</html>",
  "metadata": {
    "uiType": "form|card|dashboard|landing|navigation",
    "framework": "html",
    "components": ["header", "form", "button"],
    "responsive": true,
    "accessibility": true,
    "javascript_required": false
  }
}

重要：
- 必ずJSON形式で出力する
- HTMLには完全なDoctype、head、bodyを含める
- Tailwind CSS CDNを<head>に含める
- JavaScriptは一切含めない（セキュリティ対策）
- 日本語のプレースホルダーとテキストを使用

Tailwind CDN：
<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">"""
    )
    
    logger.info("UI Generation Agent created successfully")
    return agent

def create_agent():
    """ファクトリー関数（Agent Engine デプロイ用）"""
    return create_ui_generation_agent()

# ローカルデバッグ用
if __name__ == "__main__":
    from google.adk.runners import InMemoryRunner, types
    
    # テスト実行
    agent = create_ui_generation_agent()
    runner = InMemoryRunner(
        agent=agent,
        app_name="ui_generation_test_app"
    )
    
    test_input = """レストランの予約フォームを作成してください。
    必要な項目：
    - お名前
    - 電話番号
    - 予約日時
    - 人数
    - 特別なリクエスト
    
    モダンで使いやすいデザインでお願いします。"""
    
    # 正しいContent作成 (Part.from_text使用)
    text_part = types.Part.from_text(text=test_input)
    content = types.Content(parts=[text_part])
    
    # 正しいパラメータでrun実行
    events = list(runner.run(
        user_id="test-user",
        session_id="test-session", 
        new_message=content
    ))
    
    print("=== UI Generation Agent Test Result ===")
    
    # イベントからレスポンステキストを抽出
    result_text = ""
    for event in events:
        print(f"Event: {event}")
        if hasattr(event, 'content') and event.content:
            content = event.content
            if hasattr(content, 'parts') and content.parts:
                for part in content.parts:
                    if hasattr(part, 'text') and part.text:
                        result_text = part.text
                        break
    
    if result_text:
        try:
            # JSON解析テスト
            parsed = json.loads(result_text)
            print("✅ JSON形式での出力成功")
            print(f"UI Type: {parsed.get('metadata', {}).get('ui_type', 'unknown')}")
            print(f"HTML Length: {len(parsed.get('html', ''))}")
        except json.JSONDecodeError:
            print("❌ JSON解析失敗")
            print(result_text[:500] + "..." if len(result_text) > 500 else result_text)
    else:
        print("⚠️ レスポンスが見つかりません")