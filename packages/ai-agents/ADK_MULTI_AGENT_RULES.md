# ADKマルチエージェント構築ルール

## 📚 **必須参考資料**
- **Google ADK公式ブログ**: https://cloud.google.com/blog/ja/products/ai-machine-learning/build-multi-agentic-systems-using-google-adk
- **ADK実装ガイド**: https://zenn.dev/google_cloud_jp/articles/c5fa102f468cdf
- **適用**: 全てのADKエージェント構築時に必ず参照

## 🎯 **ADKマルチエージェント設計原則**

### 1. **専門エージェントの定義**
```python
# ✅ 正しい実装
chat_agent = adk.LlmAgent(
    name="chat_specialist",
    model="gemini-2.0-flash-exp",
    instruction="チャット専門エージェント",
)

analysis_agent = adk.LlmAgent(
    name="analysis_specialist", 
    model="gemini-2.0-flash-exp",
    instruction="分析専門エージェント",
)
```

### 2. **AgentToolによる統合**
```python
# ✅ ADK推奨パターン
from adk import agent_tool

@agent_tool.AgentTool
def chat_tool():
    return chat_agent

@agent_tool.AgentTool  
def analysis_tool():
    return analysis_agent
```

### 3. **SequentialAgent/ParallelAgentによるオーケストレーション**
```python
# ✅ 正しいオーケストレーション
orchestrator = adk.SequentialAgent(
    name="multi_agent_orchestrator",
    agents=[
        router_agent,      # ルーティング判定
        specialist_agent,  # 専門処理
        formatter_agent    # 結果整形
    ],
    input_key="user_input",
    output_key="final_result"
)
```

### 4. **共有状態による連携**
```python
# ✅ エージェント間状態共有
state = {
    "user_input": "...",
    "routing_decision": "...", 
    "specialist_result": "...",
    "final_result": "..."
}
```

## 🚫 **避けるべき実装パターン**

### ❌ **間違い1: 手動ルーティング**
```python
# 間違い
def _route_request(self, message):
    if "ui" in message:
        return self.ui_agent.generate_ui(message)
```

### ❌ **間違い2: adk.Agent継承でのオーケストレーション**
```python
# 間違い
class OrchestratorAgent(adk.Agent):
    def __init__(self):
        self.chat_agent = create_chat_agent()
```

### ❌ **間違い3: 個別エージェントインスタンス管理**
```python
# 間違い
self.chat_agent = create_chat_agent()
self.analysis_agent = create_analysis_agent()
```

## ✅ **推奨実装パターン**

### 1. **専門エージェント定義**
- `adk.LlmAgent` を使用
- 明確な専門性と指示
- 適切なモデル選択

### 2. **エージェント統合**
- `AgentTool` でツール化
- `SequentialAgent` でワークフロー
- `ParallelAgent` で並列処理

### 3. **状態管理**
- 共有キーでの状態共有
- 明確な入出力定義
- エージェント間通信

## 🎯 **Zenn記事からの追加ベストプラクティス**

### 1. **明確なdescriptionとinstruction**
```python
# ✅ 推奨: 詳細で明確な指示
agent = adk.LlmAgent(
    name="analysis_specialist",
    model="gemini-2.0-flash-exp",
    description="データ分析と詳細レポート作成の専門エージェント。トレンド分析、統計処理、推奨事項の提案が可能",
    instruction="""あなたはデータ分析の専門家です。
    
以下の手順で分析を実行してください：
1. データの概要把握
2. 重要な傾向やパターンの特定
3. 統計的分析の実施
4. 実行可能な推奨事項の作成
5. 構造化されたレポートの出力"""
)
```

### 2. **global_instructionの活用**
```python
# ✅ 複数エージェント間での共通指示
global_instruction = """全てのエージェントは以下の原則に従ってください：
- 日本語で応答する
- 根拠に基づく回答を提供する  
- 不明な点は推測せず確認を求める
- 簡潔で実用的な情報を提供する"""
```

### 3. **copy.deepcopyによるインスタンス保護**
```python
# ✅ エージェントインスタンス保護
import copy

@agent_tool.AgentTool
def analysis_tool(input: str) -> str:
    agent_copy = copy.deepcopy(analysis_agent)
    return agent_copy.run(input)
```

### 4. **デバッグ用LocalApp活用**
```python
# ✅ ローカルデバッグ
from adk import LocalApp

# 本番前のローカルテスト
local_app = LocalApp(orchestrator)
result = local_app.run({"user_input": "テスト入力"})
```

## 🔧 **実装時の必須チェック項目**

- [ ] **参考記事確認**: 両方の記事を最新確認済み
- [ ] **LlmAgent使用**: `adk.LlmAgent` を適切に使用
- [ ] **明確な定義**: description と instruction を詳細記述
- [ ] **AgentTool統合**: `AgentTool` でエージェント統合
- [ ] **オーケストレーション**: `SequentialAgent`/`ParallelAgent` 使用
- [ ] **手動ルーティング禁止**: ADK機能を活用
- [ ] **インスタンス保護**: `copy.deepcopy` 使用
- [ ] **デバッグ対応**: `LocalApp` でローカルテスト
- [ ] **global_instruction**: 共通指示の設定
- [ ] **ADK推奨パターン**: 公式推奨に準拠

## 📋 **今後のルール**

**全てのADKエージェント構築時:**
1. この資料を必ず確認
2. Google ADK公式ブログ記事を参照
3. 推奨パターンに準拠した実装
4. 手動実装ではなくADK機能を活用