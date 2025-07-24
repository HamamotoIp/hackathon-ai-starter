# ADK エンドポイント設計

## 🎯 概要

ADK（Agent Developer Kit）では、機能ごとに専用エンドポイントを使用することで、よりクリーンで保守しやすいアーキテクチャを実現します。

## 🔧 エンドポイント構成

### 基本構造
```
ADK_SERVICE_URL/
├── /chat       # 汎用チャット（デフォルト）
├── /analysis   # 分析レポート専用
├── /comparison # 比較研究専用
└── /[feature]  # 機能別エンドポイント
```

### エンドポイント詳細

#### `/analysis` - 分析レポート
```python
# agents/analysis/analysis_agent.py
@app.route('/analysis', methods=['POST'])
def analysis_endpoint():
    data = request.get_json()
    message = data.get('message')
    options = data.get('options', {})
    
    # 分析専用のエージェント処理
    analysis_agent = AnalysisAgent()
    result = analysis_agent.process_analysis(message, options)
    
    return jsonify({
        'message': result.content,
        'metadata': {
            'analysisPoints': result.key_points,
            'recommendations': result.recommendations
        }
    })
```

#### `/comparison` - 比較研究
```python
# agents/comparison/comparison_agent.py
@app.route('/comparison', methods=['POST'])
def comparison_endpoint():
    data = request.get_json()
    message = data.get('message')
    options = data.get('options', {})
    
    # 比較専用のエージェント処理
    comparison_agent = ComparisonAgent()
    result = comparison_agent.process_comparison(message, options)
    
    return jsonify({
        'message': result.content,
        'metadata': {
            'comparisonMatrix': result.comparison_data,
            'recommendations': result.best_options
        }
    })
```

#### `/chat` - 汎用チャット（デフォルト）
```python
# agents/chat/basic_chat_agent.py
@app.route('/chat', methods=['POST'])
def chat_endpoint():
    data = request.get_json()
    message = data.get('message')
    
    # 基本チャット処理
    chat_agent = BasicChatAgent()
    result = chat_agent.process_chat(message)
    
    return jsonify({
        'message': result.content
    })
```

## 🚀 フロントエンド統合

### 機能設定
```typescript
// core/types/AIFeatures.ts
export const AI_FEATURE_CONFIGS = {
  analysis_report: {
    type: "analysis_report",
    processingMode: "adk_agent",
    adkEndpoint: "/analysis"  // 専用エンドポイント
  },
  comparison_study: {
    type: "comparison_study", 
    processingMode: "adk_agent",
    adkEndpoint: "/comparison"  // 専用エンドポイント
  }
};
```

### 自動ルーティング
```typescript
// server/lib/aiProcessor.ts
const config = getFeatureConfig(request.feature);
const endpoint = config.adkEndpoint ?? '/chat';  // デフォルト: /chat
const adkUrl = `${this.adkServiceUrl}${endpoint}`;
```

## 📋 リクエスト形式

### 共通リクエスト
```json
{
  "message": "分析したい内容",
  "feature": "analysis_report",
  "options": {
    "analysisDepth": "detailed"
  },
  "session_id": "session-123",
  "user_id": "user-456"
}
```

### 分析レポート用 (`/analysis`)
```json
{
  "message": "2024年のスマートフォン市場動向を分析してください",
  "feature": "analysis_report",
  "options": {
    "analysisDepth": "comprehensive",
    "includeCharts": true
  }
}
```

### 比較研究用 (`/comparison`)
```json
{
  "message": "iPhone 15 vs Galaxy S24 vs Pixel 8 を比較してください",
  "feature": "comparison_study",
  "options": {
    "comparisonCriteria": ["price", "camera", "performance"],
    "priorityWeights": { "price": 0.3, "camera": 0.4, "performance": 0.3 }
  }
}
```

## 🎯 レスポンス形式

### 基本レスポンス
```json
{
  "message": "処理結果のメッセージ",
  "session_id": "session-123",
  "metadata": {
    // 機能固有のメタデータ
  }
}
```

### 分析レポート用レスポンス
```json
{
  "message": "詳細な分析レポート内容...",
  "session_id": "session-123",
  "metadata": {
    "analysisPoints": [
      "市場成長率: 5.2%",
      "主要トレンド: AI機能の普及"
    ],
    "recommendations": [
      "AI機能搭載モデルに注目",
      "5G対応は必須条件"
    ]
  }
}
```

### 比較研究用レスポンス
```json
{
  "message": "比較分析結果...",
  "session_id": "session-123", 
  "metadata": {
    "comparisonMatrix": {
      "iPhone 15": { "price": 8, "camera": 9, "performance": 9 },
      "Galaxy S24": { "price": 7, "camera": 8, "performance": 8 },
      "Pixel 8": { "price": 9, "camera": 8, "performance": 7 }
    },
    "recommendations": [
      "総合1位: iPhone 15",
      "コスパ1位: Pixel 8"
    ]
  }
}
```

## 🔧 実装手順

### 1. ADK側の実装
```bash
# 1. 新しいエンドポイント作成
mkdir -p agents/analysis
touch agents/analysis/analysis_agent.py

# 2. エージェント実装
# analysis_agent.py にエージェントロジックを実装

# 3. メインアプリにエンドポイント登録
# app.py にルートを追加
```

### 2. フロントエンド側の設定
```typescript
// 1. 機能タイプ追加
export type AIFeatureType = | "new_feature";

// 2. 機能設定追加
new_feature: {
  type: "new_feature",
  processingMode: "adk_agent",
  adkEndpoint: "/new-endpoint"  // 新しいエンドポイント
}
```

### 3. 自動反映
- 設定を追加すると自動的にUIに表示される
- aiProcessor.tsが自動的に適切なエンドポイントを使用

## 🌟 利点

### 1. **明確な責任分離**
- 各エンドポイントが特定の機能に特化
- エージェントロジックが整理される

### 2. **独立した開発・テスト**
- 機能ごとに独立してテスト可能
- 並行開発がしやすい

### 3. **スケーラビリティ**
- 機能追加が容易
- 負荷分散が可能

### 4. **保守性**
- 機能固有のバグ修正が容易
- コードの見通しが良い

## 🎉 使用例

```typescript
// 分析レポート機能を使用
const analysisRequest: AIFeatureRequest = {
  feature: "analysis_report",  // 自動的に /analysis エンドポイントを使用
  input: "2024年のAI市場動向を分析してください",
  options: { analysisDepth: "comprehensive" }
};

// 比較研究機能を使用
const comparisonRequest: AIFeatureRequest = {
  feature: "comparison_study",  // 自動的に /comparison エンドポイントを使用
  input: "ChatGPT vs Claude vs Gemini を比較してください",
  options: { comparisonCriteria: ["accuracy", "speed", "cost"] }
};
```

このエンドポイント設計により、**機能ごとに最適化された処理**と**クリーンなアーキテクチャ**を実現できます。