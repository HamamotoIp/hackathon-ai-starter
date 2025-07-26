# 🤖 AI Interface & Endpoint Documentation

> AI Chat Starter Kit の AI側インターフェース & エンドポイント完全ガイド

## 📋 目次

- [アーキテクチャ概要](#アーキテクチャ概要)
- [AIエージェントインターフェース](#1-aiエージェントの入力出力インターフェース)
- [Agent Engine エンドポイント](#2-agent-engine-エンドポイント構造)
- [REST API呼び出しパターン](#3-rest-api呼び出しパターン)
- [データフローと認証](#4-データフローと認証方式)
- [実践的なcurlコマンド例](#5-具体的なcurlコマンド例)
- [動作確認済みクエリ形式](#6-動作確認済みクエリ形式-2025年7月21日検証)
- [トラブルシューティング](#トラブルシューティング)

---

## 📋 アーキテクチャ概要

```
┌─────────────────────┐    ┌──────────────────────┐    ┌───────────────────┐
│   Frontend          │    │   Next.js API        │    │   Agent Engine    │
│   (UI Builder)      │───▶│   (/api/*)           │───▶│   (ADK 1.93.0)   │
└─────────────────────┘    └──────────────────────┘    └───────────────────┘
          │                           │                           │
          │                           │                           ▼
          │                           │                 ┌───────────────────┐
          │                           │                 │  Vertex AI        │
          │                           ▼                 │  (Gemini 2.0)     │
          │                 ┌──────────────────────┐    └───────────────────┘
          │                 │   AIProcessor        │
          │                 │   (Route Logic)      │
          │                 └──────────────────────┘
          │                           │
          ▼                           ▼
┌─────────────────────┐    ┌──────────────────────┐
│  User Interface     │    │  Google Cloud Auth   │
│  (React Components) │    │  (Bearer Token)      │
└─────────────────────┘    └──────────────────────┘
```

### 🎯 現在の実装状況

| 機能 | AI エンジン | エンドポイント | 状態 |
|-----|------------|--------------|------|
| **基本チャット** | Vertex AI Direct | `/api/chat/basic` | ✅ 実装済み |
| **分析レポート** | AnalysisAgent (ADK) | `/api/analysis` | ✅ 実装済み |
| **UI生成** | UIGenerationAgent (ADK) | `/api/ui-generation` | ✅ 実装済み |
| **画像管理** | Cloud Storage | `/api/images/upload` | ✅ 実装済み |

---

## 🔍 1. AIエージェントの入力・出力インターフェース

### 🎯 **Analysis Agent (分析レポート専用)**

#### **入力インターフェース**
```python
# ADK Agent標準入力形式
text_part = types.Part.from_text(text=user_input)
content = types.Content(parts=[text_part])

# 期待する入力例
"売上データを分析してください。今月の売上は前月比15%増加、新規顧客が30%増加している状況です。"
```

#### **出力インターフェース**
```markdown
## 分析結果サマリー
- 売上成長率15%は健全な成長を示している
- 新規顧客獲得30%増は営業戦略の成功を表す
- 既存顧客の購買単価向上の余地がある

## 詳細分析
### 1. データ概要
対象期間: 今月 vs 前月
主要指標: 売上成長率、新規顧客数

### 2. 主要な傾向
売上増加の主要因子は新規顧客獲得にある

## 推奨事項
### 優先度: 高
新規顧客のリテンション強化策の実施

### 優先度: 中
顧客セグメンテーション分析の実施

## 次のステップ
具体的なアクションプランの策定
```

#### **スキーマ定義 (改善案)**
```python
class AnalysisResponse(BaseModel):
    analysis_result: str = Field(..., description="分析結果のMarkdown形式レポート")
    sentiment: str = Field(..., description="感情分析結果: positive/neutral/negative")
    keywords: List[str] = Field(default=[], description="抽出されたキーワード")
    summary: str = Field(..., description="分析結果の要約")
    confidence: float = Field(default=0.8, description="分析信頼度 0.0-1.0")
```

---

---

### 🎨 **UI Generation Agent (UI生成専用)**

#### **入力インターフェース**
```python
# 基本テキスト入力
"レストランの予約フォームを作成してください"

# 構造化入力（フロントエンドから）
{
  "type": "ui_generation",
  "user_prompt": "レストランの予約フォーム",
  "device_type": "auto"
}
```

#### **出力インターフェース** ✅ **JSON構造化**
```json
{
  "html": "<!DOCTYPE html>\n<html lang=\"ja\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>レストラン予約フォーム</title>\n    <script src=\"https://cdn.tailwindcss.com\"></script>\n</head>\n<body class=\"bg-gray-50\">\n    <div class=\"max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md\">\n        <h2 class=\"text-2xl font-bold text-gray-800 mb-6 text-center\">レストラン予約</h2>\n        <form class=\"space-y-4\">\n            <div>\n                <label class=\"block text-gray-700 font-medium mb-2\">お名前 *</label>\n                <input type=\"text\" class=\"w-full border border-gray-300 rounded-md px-3 py-2\" required>\n            </div>\n            <div>\n                <label class=\"block text-gray-700 font-medium mb-2\">電話番号 *</label>\n                <input type=\"tel\" class=\"w-full border border-gray-300 rounded-md px-3 py-2\" required>\n            </div>\n            <button type=\"submit\" class=\"w-full bg-blue-500 text-white font-medium py-2 px-4 rounded-md hover:bg-blue-600\">予約する</button>\n        </form>\n    </div>\n</body>\n</html>",
  "metadata": {
    "deviceType": "auto",
    "responsive": true
  }
}
```

#### **スキーマ定義** ✅ **実装済み**
```python
class UIGenerationResponse(BaseModel):
    html: str = Field(..., description="生成されたHTML（Tailwind CSS使用）")
    device_type: str = Field(..., description="対象デバイスタイプ")
    responsive: bool = Field(default=True, description="レスポンシブ対応")
```

---

## 🔗 2. Agent Engine エンドポイント構造

### 🏗️ **Agent Engine URL構造**

#### **基本URL形式**
```
https://us-central1-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/us-central1/reasoningEngines/{ENGINE_ID}:query
```

#### **各エージェント専用エンドポイント**
```bash
# 1. Analysis Agent (分析レポート専用)
ANALYSIS_AGENT_URL="https://us-central1-aiplatform.googleapis.com/v1/projects/your-project/locations/us-central1/reasoningEngines/analysis-engine-id:query"

# 2. UI Generation Agent (UI生成専用)
UI_GENERATION_AGENT_URL="https://us-central1-aiplatform.googleapis.com/v1/projects/your-project/locations/us-central1/reasoningEngines/ui-generation-engine-id:query"
```

### 🔧 **エンドポイント種別**

| エンドポイント | 用途 | レスポンス形式 | 推奨度 |
|---------------|------|---------------|-------|
| `:query` | 単発リクエスト・レスポンス | JSON | ✅ 推奨 |
| `:streamQuery?alt=sse` | Server-Sent Events形式 | SSE | 🟡 特殊用途 |

### 🎯 **Agent Engine内部構造**

#### **ADK Agent定義パターン**
```python
# 各エージェント共通の基本構造
from google.adk.agents import LlmAgent

def create_agent():
    return LlmAgent(
        name="specialist_name",           # エージェント識別子
        model="gemini-2.0-flash-exp",    # 使用モデル
        description="専門分野の説明",      # エージェント説明
        instruction="詳細なシステムプロンプト"  # 処理指示
    )
```

#### **実装パターン例**
```python
# Analysis Agent実装例
def create_analysis_agent():
    return LlmAgent(
        name="analysis_specialist",
        model="gemini-2.0-flash-exp",
        description="データ分析と詳細レポート作成の専門エージェント",
        instruction="""あなたはデータ分析の専門家です。

以下の手順で分析を実行してください：
1. データの概要把握と前処理
2. 重要な傾向やパターンの特定
3. 統計的分析の実施
4. 課題と機会の抽出
5. 実行可能な推奨事項の作成
6. 構造化されたレポートの出力

出力形式：
## 分析結果サマリー
[主要な発見事項を3-5点で要約]

## 詳細分析
### 1. データ概要
[対象データの特徴と範囲]

### 2. 主要な傾向
[発見されたパターンやトレンド]

## 推奨事項
### 優先度: 高
[即座に実行すべき改善策]

## 次のステップ
[具体的なアクションプラン]"""
    )
```

---

## 🌐 3. REST API呼び出しパターン

### 📡 **標準REST API呼び出しパターン**

#### **パターン1: セッション作成 + メッセージ送信**
```javascript
// Step 1: セッション作成（オプション）
const sessionId = `session-${userId}-${Date.now()}`;

const sessionRequest = {
  class_method: "create_session",
  input: {
    user_id: userId,
    session_id: sessionId
  }
};

const sessionResponse = await fetch(agentUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify(sessionRequest)
});

// Step 2: メッセージ送信・処理実行
const messageRequest = {
  class_method: "query",
  input: {
    input: userMessage,           // ユーザー入力
    user_id: userId,              // ユーザーID
    session_id: sessionId         // セッションID
  }
};

const response = await fetch(agentUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify(messageRequest)
});

// Step 3: レスポンス解析
const data = await response.json();
/*
Agent Engine標準レスポンス形式:
{
  "input": "元のユーザー入力",
  "output": "エージェントの応答結果"
}
*/

const result = data.output; // メイン結果を取得
```

#### **パターン2: 直接メッセージ送信（推奨）**
```javascript
// シンプルな直接呼び出し
const messageRequest = {
  class_method: "query",
  input: {
    input: userMessage,
    user_id: `user-${Date.now()}`,
    session_id: `session-${Date.now()}`
  }
};

const response = await fetch(agentUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify(messageRequest)
});

const { output } = await response.json();
```

### 🎯 **機能別API呼び出しパターン**

#### **UI生成の構造化入力**
```javascript
// UI生成専用の構造化メッセージ
const structuredMessage = {
  type: "ui_generation",
  user_prompt: "レストランの予約フォーム",
  device_type: "auto"
};

const uiGenRequest = {
  class_method: "query",
  input: {
    input: JSON.stringify(structuredMessage),
    user_id: userId,
    session_id: sessionId
  }
};
```

---

## 🔐 4. データフローと認証方式

### 🌊 **完全なデータフロー**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   1. User Input │───▶│  2. Frontend    │───▶│  3. Next.js API │───▶│  4. AIProcessor │
│   (UI Builder)  │    │   (React Form)  │    │   (/api/*)      │    │   (Route Logic) │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
                                                      │                         │
                                                      ▼                         ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  8. UI Display  │◀───│  7. Response    │◀───│  6. Parse Data  │◀───│  5. Agent Call  │
│   (Sanitized)   │    │   (JSON)        │    │   (JSON/Text)   │    │   (REST API)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 🔑 **Google Cloud認証フロー**

#### **認証プロセス**
```javascript
// 1. Google Cloud認証インスタンス作成
import { GoogleAuth } from 'google-auth-library';

const auth = new GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/cloud-platform']
});

// 2. アクセストークン取得
const client = await auth.getClient();
const accessTokenResponse = await client.getAccessToken();
const accessToken = accessTokenResponse.token;

// 3. Agent Engine呼び出しでBearer Token使用
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${accessToken}`
};
```

#### **認証環境別設定**

| 環境 | 認証方式 | 設定方法 |
|------|---------|---------|
| **ローカル開発** | Application Default Credentials | `gcloud auth application-default login` |
| **Cloud Run** | Service Account Identity | 自動取得（メタデータサーバー） |
| **手動設定** | Service Account Key | JSON キーファイル環境変数設定 |

#### **必要な権限**
```bash
# サービスアカウントに必要なロール
- roles/aiplatform.user          # Vertex AI Agent Engine呼び出し
- roles/storage.objectAdmin      # 画像アップロード（オプション）

# 権限付与コマンド例
gcloud projects add-iam-policy-binding YOUR-PROJECT-ID \
  --member="serviceAccount:SERVICE-ACCOUNT-EMAIL" \
  --role="roles/aiplatform.user"
```

#### **環境変数設定**
```bash
# 必要な環境変数
export VERTEX_AI_PROJECT_ID="your-project-id"
export VERTEX_AI_LOCATION="us-central1"
export ANALYSIS_AGENT_URL="https://us-central1-aiplatform.googleapis.com/v1/projects/your-project/locations/us-central1/reasoningEngines/analysis-id:query"
export UI_GENERATION_AGENT_URL="https://us-central1-aiplatform.googleapis.com/v1/projects/your-project/locations/us-central1/reasoningEngines/ui-gen-id:query"
```

---

## 📝 5. 具体的なcurlコマンド例

### 🔧 **前準備: 環境設定**

```bash
# Google Cloud CLI でアクセストークン取得
export ACCESS_TOKEN=$(gcloud auth print-access-token)
echo "Access Token: $ACCESS_TOKEN"

# プロジェクトIDを設定
export PROJECT_ID="your-gcp-project-id"

# Agent Engine URLを設定（実際のEngine IDに置き換え）
export ANALYSIS_URL="https://us-central1-aiplatform.googleapis.com/v1/projects/$PROJECT_ID/locations/us-central1/reasoningEngines/ANALYSIS-ENGINE-ID:query"
export UI_GEN_URL="https://us-central1-aiplatform.googleapis.com/v1/projects/$PROJECT_ID/locations/us-central1/reasoningEngines/UI-GEN-ENGINE-ID:query"
```

### 💻 **Agent Engine直接呼び出し例**

#### **1. Analysis Agent 呼び出し**
```bash
# セッション作成（オプション）
curl -X POST "$ANALYSIS_URL" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "class_method": "create_session",
    "input": {
      "user_id": "test-user-001",
      "session_id": "analysis-session-001"
    }
  }' | jq .

# 分析実行
curl -X POST "$ANALYSIS_URL" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "class_method": "query",
    "input": {
      "input": "売上データを分析してください。今月の売上は前月比15%増加、新規顧客が30%増加しています。顧客満足度は4.2/5.0、リピート率は65%です。",
      "user_id": "test-user-001",
      "session_id": "analysis-session-001"
    }
  }' | jq .
```

#### **2. UI Generation Agent 呼び出し**
```bash
# 基本UI生成
curl -X POST "$UI_GEN_URL" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "class_method": "query",
    "input": {
      "input": "お問い合わせフォームを作成してください。会社名、担当者名、メールアドレス、電話番号、お問い合わせ内容を入力できるようにして、送信ボタンも含めてください。",
      "user_id": "test-user-ui",
      "session_id": "ui-session-001"
    }
  }' | jq .

# 構造化UI生成（高度な指定）
curl -X POST "$UI_GEN_URL" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "class_method": "query",
    "input": {
      "input": "{\"type\":\"ui_generation\",\"user_prompt\":\"イベント申し込みフォームを作成してください。イベント名、参加者名、メールアドレス、電話番号、参加人数、特別な要望を入力できるフォームにしてください。\",\"device_type\":\"auto\"}",
      "user_id": "test-user-ui-advanced",
      "session_id": "ui-advanced-session-001"
    }
  }' | jq .
```

### 🌐 **Next.js API経由での呼び出し（推奨）**

#### **フロントエンドAPI経由（本番推奨）**
```bash
# 分析API
curl -X POST "http://localhost:3000/api/analysis" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "ECサイトの売上データを分析してください。今月の売上は1200万円で前月比18%増加、新規顧客数は3500人で25%増加、平均購入単価は15,000円で5%減少しています。",
    "sessionId": "frontend-analysis-001"
  }' | jq .

# UI生成API
curl -X POST "http://localhost:3000/api/ui-generation" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "ユーザー登録フォームを作成してください。ユーザー名、メールアドレス、パスワード、パスワード確認、利用規約の同意チェックボックスを含めてください。",
    "options": {
      "deviceType": "mobile"
    },
    "sessionId": "frontend-ui-001"
  }' | jq .

# 基本チャットAPI（Vertex AI Direct）
curl -X POST "http://localhost:3000/api/chat/basic" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "TypeScriptの型定義について教えてください。interfaceとtypeの違いについても説明してください。",
    "sessionId": "frontend-chat-001"
  }' | jq .
```

### 📊 **レスポンス例**

#### **Analysis Agent レスポンス**
```json
{
  "input": "売上データを分析してください...",
  "output": "## 分析結果サマリー\n- 売上成長率15%は健全な成長トレンドを示しています\n- 新規顧客獲得30%増は営業戦略の成功を表しています\n- 顧客満足度4.2/5.0は業界平均を上回る良好な水準です\n- リピート率65%は継続的な顧客関係を示しています\n\n## 詳細分析\n### 1. データ概要\n対象期間: 今月 vs 前月\n主要指標:\n- 売上成長率: +15%\n- 新規顧客数: +30%\n- 顧客満足度: 4.2/5.0\n- リピート率: 65%\n\n### 2. 主要な傾向\n**ポジティブな要因:**\n- 新規顧客獲得の大幅な増加が売上拡大を牽引\n- 高い顧客満足度が継続的な成長基盤を構築\n- リピート率65%は顧客ロイヤルティの高さを示す\n\n**注意すべき点:**\n- 既存顧客の購買頻度・単価の詳細分析が必要\n- 競合他社との比較分析による市場ポジション確認が重要\n\n### 3. 統計的分析\n- 成長率15%は持続可能な範囲内での健全な成長\n- 新規顧客増加率30%は市場拡大または営業効果の向上を示唆\n- 顧客満足度4.2は業界ベンチマーク（3.8）を上回る\n\n## 推奨事項\n### 優先度: 高\n1. **新規顧客のリテンション強化プログラムの実施**\n   - オンボーディングプロセスの改善\n   - 初回購入後のフォローアップ施策\n\n2. **既存顧客のアップセル・クロスセル戦略の強化**\n   - 購買履歴分析によるレコメンデーション精度向上\n   - パーソナライズされたマーケティング施策\n\n### 優先度: 中\n1. **顧客セグメンテーション分析の実施**\n   - 高価値顧客の特定と特別施策\n   - 離脱リスク顧客の早期発見システム\n\n2. **LTV（顧客生涯価値）の測定・改善**\n   - 顧客価値の定量化\n   - 投資対効果の最適化\n\n### 優先度: 低\n1. **競合他社ベンチマーク分析**\n2. **市場トレンド分析による将来予測**\n\n## 次のステップ\n1. **顧客行動データの詳細分析** (1週間以内)\n2. **競合他社との比較分析** (2週間以内)\n3. **来月の売上予測モデル構築** (3週間以内)\n4. **KPI改善施策の立案・実行** (1ヶ月以内)"
}
```

#### **UI Generation Agent レスポンス**
```json
{
  "input": "お問い合わせフォーム...",
  "output": "{\n  \"html\": \"<!DOCTYPE html>\\n<html lang=\\\"ja\\\">\\n<head>\\n    <meta charset=\\\"UTF-8\\\">\\n    <meta name=\\\"viewport\\\" content=\\\"width=device-width, initial-scale=1.0\\\">\\n    <title>お問い合わせフォーム</title>\\n    <script src=\\\"https://cdn.tailwindcss.com\\\"></script>\\n</head>\\n<body class=\\\"bg-gray-50 py-8\\\">\\n    <div class=\\\"max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md\\\">\\n        <h2 class=\\\"text-3xl font-bold text-gray-800 mb-6 text-center\\\">お問い合わせフォーム</h2>\\n        <form class=\\\"space-y-6\\\">\\n            <div class=\\\"grid grid-cols-1 md:grid-cols-2 gap-4\\\">\\n                <div>\\n                    <label class=\\\"block text-gray-700 font-medium mb-2\\\">会社名 *</label>\\n                    <input type=\\\"text\\\" class=\\\"w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent\\\" required>\\n                </div>\\n                <div>\\n                    <label class=\\\"block text-gray-700 font-medium mb-2\\\">担当者名 *</label>\\n                    <input type=\\\"text\\\" class=\\\"w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent\\\" required>\\n                </div>\\n            </div>\\n            <div class=\\\"grid grid-cols-1 md:grid-cols-2 gap-4\\\">\\n                <div>\\n                    <label class=\\\"block text-gray-700 font-medium mb-2\\\">メールアドレス *</label>\\n                    <input type=\\\"email\\\" class=\\\"w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent\\\" required>\\n                </div>\\n                <div>\\n                    <label class=\\\"block text-gray-700 font-medium mb-2\\\">電話番号</label>\\n                    <input type=\\\"tel\\\" class=\\\"w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent\\\">\\n                </div>\\n            </div>\\n            <div>\\n                <label class=\\\"block text-gray-700 font-medium mb-2\\\">お問い合わせ内容 *</label>\\n                <textarea class=\\\"w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent\\\" rows=\\\"5\\\" placeholder=\\\"お問い合わせ内容をご記入ください...\\\" required></textarea>\\n            </div>\\n            <div class=\\\"text-center\\\">\\n                <button type=\\\"submit\\\" class=\\\"bg-blue-500 text-white font-medium py-3 px-8 rounded-md hover:bg-blue-600 transition duration-200 shadow-md\\\">送信する</button>\\n            </div>\\n        </form>\\n    </div>\\n</body>\\n</html>\",\n  \"metadata\": {\n    \"deviceType\": \"auto\",\n    \"responsive\": true\n  }\n}"
}
```

---

## 🔧 トラブルシューティング

### 🚨 **よくある問題と解決策**

#### **1. 認証エラー (403 Forbidden)**

**エラー例:**
```
[VertexAI.ClientError]: got status: 403 Forbidden
Permission 'aiplatform.endpoints.predict' denied
```

**解決策:**
```bash
# APIs有効化
gcloud services enable aiplatform.googleapis.com

# 権限確認
gcloud projects get-iam-policy YOUR-PROJECT-ID \
  --flatten="bindings[].members" \
  --filter="bindings.role:roles/aiplatform.user"

# 権限付与
gcloud projects add-iam-policy-binding YOUR-PROJECT-ID \
  --member="user:$(gcloud config get-value account)" \
  --role="roles/aiplatform.user"

# 統合セットアップ（推奨）
./setup.sh
```

#### **2. Agent Engine接続エラー**

**エラー例:**
```
Agent Engine error: 404 Not Found
```

**診断手順:**
```bash
# 1. Agent Engine URL確認
echo $ANALYSIS_AGENT_URL
cat packages/ai-agents/analysis_agent_url.txt

# 2. Agent Engineステータス確認
curl -H "Authorization: Bearer $(gcloud auth print-access-token)" \
     "$ANALYSIS_AGENT_URL" 

# 3. Agent Engine再デプロイ
cd packages/ai-agents
python deploy_analysis.py
```

#### **3. レスポンス解析エラー**

**問題:** JSON解析失敗、構造化データが期待通りでない

**解決策:**
```javascript
// デバッグ用詳細ログ
if (process.env.NODE_ENV === 'development') {
  console.log('Raw Response:', responseText.substring(0, 500));
  console.log('Parsed Data:', JSON.stringify(data, null, 2));
}

// フォールバック処理
try {
  const parsed = JSON.parse(responseText);
  return parsed;
} catch (error) {
  console.warn('JSON parse failed, using text response:', error);
  return responseText; // テキストとして返す
}
```

#### **4. UI生成での安全性問題**

**問題:** XSS攻撃、悪意のあるスクリプト注入

**解決策:**
```javascript
// DOMPurify使用（実装済み）
import { sanitizeForPreview } from '@/shared/utils/htmlSanitizer';

const safeHTML = sanitizeForPreview(generatedHTML);
```

### 🔍 **デバッグコマンド集**

#### **環境確認**
```bash
# 認証状態確認
gcloud auth list

# プロジェクト確認
gcloud config get-value project

# APIs有効化状態確認
gcloud services list --enabled | grep aiplatform

# Agent Engine一覧
gcloud ai reasoninг-engines list --region=us-central1
```

#### **ログ確認**
```bash
# Cloud Run ログ（フロントエンド）
gcloud run services logs read ai-chat-frontend-dev --region us-central1

# Agent Engine ログ
gcloud logging read "resource.type=vertex_ai_agent_engine" --limit=10

# ローカル開発ログ
tail -f packages/frontend/.next/server.log
```

---

## 🎯 **まとめ: インターフェース設計のポイント**

### ✅ **現在の実装の優れた点**

1. **🔄 統一されたREST API形式** - `class_method` + `input`構造の一貫性
2. **🎯 機能別専用エージェント** - 各機能に最適化されたエージェント
3. **📊 構造化出力対応** - UI生成でのJSON出力
4. **🔐 認証統合** - Google Cloud Bearer Token統一
5. **⚠️ エラーハンドリング** - 適切な例外処理とフォールバック
6. **🛡️ セキュリティ対応** - DOMPurify XSS対策
7. **📱 レスポンシブ対応** - 全UI生成でモバイル対応

### 🔧 **改善推奨事項**

| 項目 | 現在の状態 | 改善案 | 優先度 |
|------|-----------|--------|--------|
| **Analysis Agent出力** | Markdownテキストのみ | JSON構造化出力 | 🔴 高 |
| **フィールド名統一** | `device_type` vs `deviceType` | 全体で`deviceType`統一 | 🟡 中 |
| **FeatureCard対応** | UI生成未対応 | 全機能対応 | 🟡 中 |
| **エンドポイント最適化** | `:streamQuery` 使用 | `:query` 検討 | 🟢 低 |

### 🚀 **実装後の期待効果**

1. **📈 型安全性向上** - 構造化データによる厳密な型チェック
2. **🎯 機能統一性** - 全AI機能のFeatureCardでの統一体験
3. **📊 データ活用** - 分析結果の機械的処理・可視化が可能
4. **⚡ 開発効率** - 一貫したインターフェースによる開発速度向上
5. **🔒 セキュリティ強化** - 構造化データによる安全性向上

---

## 📚 参考資料

### 🔗 **公式ドキュメント**
- [Google Cloud Agent Starter Pack](https://github.com/GoogleCloudPlatform/agent-starter-pack)
- [Vertex AI SDK デプロイガイド](https://google.github.io/adk-docs/deploy/agent-engine/)
- [ADK Agents公式ドキュメント](https://google.github.io/adk-docs/agents/)
- [ADK LlmAgent仕様](https://google.github.io/adk-docs/agents/llm-agents/)

### 🛠️ **実装ガイド**
- [ADKエージェント開発実践ガイド](https://qiita.com/nnhkrnk/items/023d91b00075be0b1cbf)
- [ADK Python API Reference](https://google.github.io/adk-docs/api-reference/python/)

## 6. 動作確認済みクエリ形式 (2025年7月21日検証)

### 🎯 **検証環境**
- **検証日時**: 2025年7月21日 12:00 JST
- **Agent Engine**: ADK 1.93.0
- **プロジェクト**: your-gcp-project-id
- **リージョン**: us-central1

### ✅ **Step 1: セッション作成**

**エンドポイント形式:**
```
https://us-central1-aiplatform.googleapis.com/v1/projects/PROJECT_ID/locations/LOCATION/reasoningEngines/ENGINE_ID:query
```

**curl実行例:**
```bash
# アクセストークン取得
ACCESS_TOKEN=$(gcloud auth print-access-token)

# セッション作成
curl -X POST "https://us-central1-aiplatform.googleapis.com/v1/projects/YOUR_PROJECT_NUMBER/locations/us-central1/reasoningEngines/YOUR_ENGINE_ID:query" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "class_method": "create_session",
    "input": {
      "user_id": "test-user-1"
    }
  }'
```

**成功時のレスポンス:**
```json
{
  "output": {
    "lastUpdateTime": 1753098954.159102,
    "userId": "test-user-1",
    "state": {},
    "appName": "6360657174498115584",
    "events": [],
    "id": "7295218418607718400"
  }
}
```

### ✅ **Step 2: クエリ実行**

**エンドポイント形式:**
```
https://us-central1-aiplatform.googleapis.com/v1/projects/PROJECT_ID/locations/LOCATION/reasoningEngines/ENGINE_ID:streamQuery?alt=sse
```

**curl実行例 (Analysis Agent):**
```bash
curl -X POST "https://us-central1-aiplatform.googleapis.com/v1/projects/YOUR_PROJECT_NUMBER/locations/us-central1/reasoningEngines/YOUR_ENGINE_ID:streamQuery?alt=sse" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "class_method": "stream_query",
    "input": {
      "session_id": "7295218418607718400",
      "user_id": "test-user-1",
      "message": "売上データを分析してレポートを作成してください"
    }
  }'
```

### 🎯 **動作確認済みAgent Engine URLs**

| Agent | Engine ID | セッション作成URL | クエリ実行URL | 動作状況 |
|-------|-----------|------------------|---------------|----------|
| **Analysis** | `6360657174498115584` | `:query` | `:streamQuery?alt=sse` | ✅ 動作確認済み |
| **UI Generation** | `6909533379083894784` | `:query` | `:streamQuery?alt=sse` | ✅ 動作確認済み |

### 📊 **レスポンス例**

#### Analysis Agent レスポンス
```json
{
  "content": {
    "parts": [{"text": "売上データ分析のレポート作成、承知いたしました。\n\n売上データの内容について、以下の情報を教えていただけますでしょうか？\n\n1. **データの範囲:**\n   * 対象期間（例：2023年1月〜2023年12月）\n   * 対象地域（例：全国、特定の都道府県）"}],
    "role": "model"
  },
  "usage_metadata": {
    "candidates_token_count": 423,
    "prompt_token_count": 369,
    "total_token_count": 792
  },
  "invocation_id": "e-af132d95-2dec-4bce-9891-5d37afb813b1",
  "author": "analysis_specialist",
  "timestamp": 1753098966.6398
}
```

#### UI Generation Agent レスポンス (構造化JSON)
```json
{
  "content": {
    "parts": [{"text": "```json\n{\n  \"html\": \"<!DOCTYPE html>\\n<html lang=\\\"ja\\\">\\n<head>\\n    <meta charset=\\\"UTF-8\\\">\\n    <title>ログインフォーム</title>\\n    <link href=\\\"https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css\\\" rel=\\\"stylesheet\\\">\\n</head>\\n<body class=\\\"bg-gray-100 h-screen flex items-center justify-center\\\">\\n    <div class=\\\"bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4\\\">...\",\n  \"metadata\": {\n    \"deviceType\": \"auto\",\n    \"responsive\": true\n  }\n}\n```"}]
  }
}
```

### 🔑 **重要な注意事項**

1. **必須パラメータ**: `user_id`はセッション作成時に必須
2. **セッション管理**: 各クエリ前にセッション作成が必要
3. **エンドポイント形式**: セッション作成は`:query`、クエリ実行は`:streamQuery?alt=sse`
4. **認証**: Google Cloud Bearer Tokenが必須
5. **レスポンス時間**: 4-14秒程度（クエリ複雑度による）

### 🎯 **関連ドキュメント**
- [アーキテクチャ](../development/architecture.md) - システム全体アーキテクチャ
- [Claude協働ガイド](../advanced/claude-collaboration.md) - AI開発者向けガイド

---

**📅 最終更新:** 2025年7月21日  
**✍️ 作成者:** AI Chat Starter Kit Development Team  
**📋 バージョン:** v1.0.1 (動作確認済みクエリ形式追加)

> 💡 **このドキュメントは生きたドキュメントです。** 実装の変更に合わせて継続的に更新してください。