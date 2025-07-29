# 📡 AI Chat Starter Kit - API仕様

機能ベースでAIを使い分ける統一API - 完全実装ガイド

## 🎯 概要

AI Chat Starter Kit のAPI仕様書です。機能ベースでAIを使い分ける統一APIを提供し、フロントエンドから簡単にアクセスできます。

### 基本情報
- **ベースURL**: `http://localhost:3000` (ローカル) / `https://your-app.run.app` (本番)
- **認証**: なし（ハッカソン特化設計）
- **レスポンス形式**: JSON
- **リクエスト形式**: JSON (POST), Query Parameters (GET)

## 🚀 エンドポイント一覧

### 🤖 AI機能

#### `POST /api/chat`
チャット（Vertex AI Direct）- 高速レスポンス

**リクエスト:**
```json
{
  "message": "こんにちは、iPhoneとAndroidの違いを教えて",
  "sessionId": "user-session-123"
}
```

**レスポンス:**
```json
{
  "message": "iPhoneとAndroidの主な違いは...",
  "processingTimeMs": 3245,
  "sessionId": "user-session-123"
}
```

#### `POST /api/analysis`
分析レポート（ADK Agent Engine）- 詳細分析

**リクエスト:**
```json
{
  "message": "2024年の売上データを分析してトレンドを抽出してください",
  "sessionId": "user-session-123"
}
```

**レスポンス:**
```json
{
  "success": true,
  "result": "## 売上データ分析レポート\\n\\n### 主要トレンド\\n1. Q4に30%の成長\\n2. モバイル売上が40%増加\\n...",
  "processingMode": "adk_agent",
  "processingTimeMs": 24567,
  "timestamp": "2025-01-20T12:00:00.000Z",
  "sessionId": "user-session-123"
}
```

#### `POST /api/ui-generation`
UI生成（ADK Agent Engine）- デバイス最適化HTML生成

**リクエスト:**
```json
{
  "message": "レストランの予約フォームを作成してください",
  "options": {
    "deviceType": "mobile"
  },
  "sessionId": "user-session-123"
}
```

**レスポンス:**
```json
{
  "success": true,
  "result": {
    "html": "<!DOCTYPE html>\\n<html lang=\\\"ja\\\">\\n<head>...</head>\\n<body>...</body>\\n</html>",
    "metadata": {
      "deviceType": "mobile",
      "responsive": true
    }
  },
  "processingMode": "adk_agent",
  "processingTimeMs": 25000,
  "timestamp": "2025-01-20T12:00:00.000Z",
  "sessionId": "user-session-123"
}
```


## 📊 データ型定義

### AIFeatureRequest（共通リクエスト）
```typescript
interface AIFeatureRequest {
  message: string;             // メッセージ（全機能共通）
  sessionId?: string;          // セッションID（任意）
  
  // UI生成用オプション
  options?: UIGenerationOptions;
}

interface UIGenerationOptions {
  deviceType?: "desktop" | "tablet" | "mobile" | "auto";
}
```

### AIFeatureResponse（共通レスポンス）
```typescript
// チャット用レスポンス
interface ChatResponse {
  message: string;             // AI応答メッセージ
  processingTimeMs: number;    // 処理時間（ミリ秒）
  sessionId?: string;          // セッションID
}

// 分析・UI生成用レスポンス
interface AIFeatureResponse {
  success: boolean;
  result: string | UIGenerationResult;  // AI処理結果
  processingMode: "adk_agent";
  processingTimeMs: number;    // 処理時間（ミリ秒）
  timestamp: string;           // ISO 8601形式
  sessionId?: string;          // セッションID
}

interface UIGenerationResult {
  html: string;
  metadata?: {
    deviceType: string;
    responsive: boolean;
  };
}
```

### ErrorResponse
```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;              // エラーコード
    message: string;           // エラーメッセージ
    details?: any;             // 詳細情報（開発環境のみ）
  };
  timestamp: string;
}
```

## 🚨 エラーコード

### HTTP ステータスコード
| コード | 説明 | 対応 |
|--------|------|------|
| 200 | 成功 | 正常レスポンス |
| 400 | Bad Request | リクエスト形式エラー |
| 413 | Payload Too Large | ファイルサイズ超過 |
| 500 | Internal Server Error | サーバー内部エラー |
| 503 | Service Unavailable | AI サービス利用不可 |

### アプリケーションエラーコード
| コード | 説明 | 対応方法 |
|--------|------|----------|
| `INVALID_INPUT` | 入力データが不正 | リクエスト形式を確認 |
| `INPUT_TOO_LONG` | 入力文字数超過 | 文字数制限内に調整 |
| `AI_SERVICE_ERROR` | AI サービスエラー | 時間をおいて再試行 |
| `TIMEOUT_ERROR` | タイムアウト | 時間をおいて再試行 |
| `UPLOAD_ERROR` | ファイルアップロードエラー | ファイル形式・サイズを確認 |

## ⚡ 制限事項

### 入力制限
| 機能 | 最大文字数 | タイムアウト |
|------|------------|-------------|
| チャット | 2,000文字 | 高速 |
| 分析レポート | 5,000文字 | 60秒 |
| UI生成 | 3,000文字 | 60秒 |


## 💻 SDKサンプル

### JavaScript/TypeScript
```typescript
// チャット
async function chat(message: string, sessionId?: string) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sessionId })
  });
  return await response.json();
}

// 分析レポート
async function analysisReport(message: string, sessionId?: string) {
  const response = await fetch('/api/analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sessionId })
  });
  return await response.json();
}

// UI生成
async function generateUI(message: string, options: UIGenerationOptions, sessionId?: string) {
  const response = await fetch('/api/ui-generation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, options, sessionId })
  });
  return await response.json();
}

```

### Python
```python
import requests
import json

class AIClient:
    def __init__(self, base_url="http://localhost:3000"):
        self.base_url = base_url
    
    def chat(self, message, session_id=None):
        response = requests.post(
            f"{self.base_url}/api/chat",
            json={"message": message, "sessionId": session_id}
        )
        return response.json()
    
    def analysis_report(self, message, session_id=None):
        response = requests.post(
            f"{self.base_url}/api/analysis",
            json={"message": message, "sessionId": session_id}
        )
        return response.json()
    
    def generate_ui(self, message, options, session_id=None):
        response = requests.post(
            f"{self.base_url}/api/ui-generation",
            json={"message": message, "options": options, "sessionId": session_id}
        )
        return response.json()
    

# 使用例
client = AIClient()
result = client.chat("Hello AI!")
print(result)
```

### curl
```bash
# チャット
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "sessionId": "demo"}'

# 分析レポート
curl -X POST http://localhost:3000/api/analysis \
  -H "Content-Type: application/json" \
  -d '{"message": "データ分析をお願いします", "sessionId": "demo"}'

# UI生成（デバイス最適化）
curl -X POST http://localhost:3000/api/ui-generation \
  -H "Content-Type: application/json" \
  -d '{"message": "ログインフォーム", "options": {"deviceType": "auto"}, "sessionId": "demo"}'
```

## 🎯 機能別使い分けガイド

### チャット（Vertex AI Direct）
**最適な用途:**
- 日常会話・質問回答
- 翻訳・要約
- 簡単な情報検索

**特徴:**
- 高速レスポンス（3-5秒）
- 低コスト
- シンプルなテキスト出力

### 分析レポート（ADK Agent）
**最適な用途:**
- データ分析・市場調査
- 詳細レポート作成
- 構造化された分析

**特徴:**
- 詳細分析（20-60秒）
- 構造化されたレポート出力
- 専門的な分析能力

### UI生成（ADK Agent）
**最適な用途:**
- HTML/CSSコンポーネント生成
- ランディングページ作成
- フォーム・UIパーツ作成

**特徴:**
- デバイス最適化（desktop/tablet/mobile/auto）
- Tailwind CSS使用
- 即座にプレビュー可能なHTML

## 🔧 開発者向け情報

### 機能追加の流れ
1. **機能設計（人間）**: `core/types/aiTypes.ts` で新機能定義
2. **API実装（AI）**: `app/api/new-feature/route.ts` でエンドポイント実装
3. **テスト**: curl または SDK でAPIテスト
4. **ドキュメント更新**: このAPI仕様書に仕様追加

### デバッグ方法
```bash
# 基本的なAPI動作確認
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'

# 詳細デバッグ
cd /workspaces/hackathon-ai-starter
./debug.sh
```

### パフォーマンス最適化
- **キャッシュ**: レスポンスのキャッシュ実装推奨
- **ストリーミング**: 長時間処理の場合はServer-Sent Events検討
- **並列処理**: 複数AIサービスの並列呼び出し
- **エラーハンドリング**: タイムアウト・リトライ戦略

## 📚 関連ドキュメント

- **[開発ガイド](./DEVELOPMENT.md)** - 新機能追加・カスタマイズ
- **[クイックスタート](./QUICKSTART.md)** - 基本セットアップ
- **[上級者ガイド](./ADVANCED.md)** - 本格運用・最適化

---

**📅 最終更新:** 2025年7月26日  
**📋 バージョン:** v1.1.0 (UIGenerationOptions deviceType対応)

このAPI仕様書により、開発者は効率的にAI Chat Starter KitのAPIを活用できます。