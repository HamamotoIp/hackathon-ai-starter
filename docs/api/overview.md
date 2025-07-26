# 📡 API 仕様書

## 概要

AI Chat Starter Kit のAPI仕様書です。機能ベースでAIを使い分ける統一APIを提供し、フロントエンドから簡単にアクセスできます。

## 基本情報

- **ベースURL**: `http://localhost:3000` (ローカル) / `https://your-app.run.app` (本番)
- **認証**: なし（ハッカソン特化設計）
- **レスポンス形式**: JSON
- **リクエスト形式**: JSON (POST), Query Parameters (GET)

## エンドポイント一覧

### 🔍 システム・診断

#### `GET /api/debug`
システム状態確認・デバッグ情報取得

**リクエスト:**
```http
GET /api/debug
```

**レスポンス:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-20T12:00:00.000Z",
  "environment": {
    "VERTEX_AI_PROJECT_ID": "SET",
    "ADK_SERVICE_URL": "SET",
    "BUCKET_NAME": "SET"
  },
  "services": {
    "vertexAI": "CONNECTED",
    "adkEngine": "CONNECTED", 
    "cloudStorage": "CONNECTED"
  },
  "version": "1.0.0"
}
```

### 🤖 AI機能

#### `POST /api/chat/basic`
基本チャット（Vertex AI Direct）

**リクエスト:**
```http
POST /api/chat/basic
Content-Type: application/json

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
分析レポート（ADK Agent Engine）

**リクエスト:**
```http
POST /api/analysis
Content-Type: application/json

{
  "message": "2024年の売上データを分析してトレンドを抽出してください",
  "sessionId": "user-session-123"
}
```

**レスポンス:**
```json
{
  "success": true,
  "result": "## 売上データ分析レポート\n\n### 主要トレンド\n1. Q4に30%の成長\n2. モバイル売上が40%増加\n...",
  "processingMode": "adk_agent",
  "processingTimeMs": 24567,
  "timestamp": "2025-01-20T12:00:00.000Z",
  "sessionId": "user-session-123"
}
```

#### `POST /api/ui-generation`
UI生成（ADK Agent Engine）

**リクエスト:**
```http
POST /api/ui-generation
Content-Type: application/json

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
    "html": "<!DOCTYPE html>\n<html lang=\"ja\">\n<head>...</head>\n<body>...</body>\n</html>",
    "metadata": {
      "uiType": "form",
      "framework": "html",
      "components": ["form", "input", "button"],
      "responsive": true,
      "accessibility": true,
      "javascript_required": false
    }
  },
  "processingMode": "adk_agent",
  "processingTimeMs": 25000,
  "timestamp": "2025-01-20T12:00:00.000Z",
  "sessionId": "user-session-123"
}
```

### 📷 ファイル管理

#### `POST /api/images/upload`
画像アップロード（Cloud Storage）

**リクエスト:**
```http
POST /api/images/upload
Content-Type: multipart/form-data

form-data:
- image: [File] (最大5MB、JPEG/PNG/GIF/WebP)
```

**レスポンス:**
```json
{
  "success": true,
  "url": "https://storage.googleapis.com/project-images/uuid-filename.jpg",
  "filename": "uuid-filename.jpg",
  "originalFilename": "my-image.jpg",
  "size": 1234567,
  "contentType": "image/jpeg",
  "timestamp": "2025-01-20T12:00:00.000Z"
}
```

## データ型定義

### AIFeatureRequest
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

### AIFeatureResponse
```typescript
// 基本チャット用レスポンス
interface BasicChatResponse {
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

## エラーコード

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

## 制限事項

### 入力制限

| 機能 | 最大文字数 | タイムアウト |
|------|------------|-------------|
| 基本チャット | 1,000文字 | 30秒 |
| 分析レポート | 5,000文字 | 60秒 |
| UI生成 | 3,000文字 | 60秒 |

### ファイル制限

| 項目 | 制限 |
|------|------|
| ファイルサイズ | 最大5MB |
| 対応形式 | JPEG, PNG, GIF, WebP |
| 保存期間 | 30日（自動削除） |

### レート制限

| 対象 | 制限 |
|------|------|
| API呼び出し | 1000回/時間/IP |
| ファイルアップロード | 100回/時間/IP |
| 同時接続 | 10接続/IP |

## SDKサンプル

### JavaScript/TypeScript

```typescript
// 基本チャット
async function basicChat(message: string, sessionId?: string) {
  const response = await fetch('/api/chat/basic', {
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

// 画像アップロード
async function uploadImage(file: File) {
  const formData = new FormData();
  formData.append('image', file);
  
  const response = await fetch('/api/images/upload', {
    method: 'POST',
    body: formData
  });
  return await response.json();
}
```

### curl

```bash
# 基本チャット
curl -X POST http://localhost:3000/api/chat/basic \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "sessionId": "demo"}'

# 分析レポート
curl -X POST http://localhost:3000/api/analysis \
  -H "Content-Type: application/json" \
  -d '{"message": "データ分析をお願いします", "sessionId": "demo"}'

# UI生成
curl -X POST http://localhost:3000/api/ui-generation \
  -H "Content-Type: application/json" \
  -d '{"message": "ログインフォーム", "options": {"uiType": "form", "framework": "html"}, "sessionId": "demo"}'

# 画像アップロード
curl -X POST http://localhost:3000/api/images/upload \
  -F "image=@./test-image.jpg"

# システム状態確認
curl http://localhost:3000/api/debug
```

### Python

```python
import requests
import json

class AIClient:
    def __init__(self, base_url="http://localhost:3000"):
        self.base_url = base_url
    
    def basic_chat(self, message, session_id=None):
        response = requests.post(
            f"{self.base_url}/api/chat/basic",
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
    
    def upload_image(self, file_path):
        with open(file_path, 'rb') as f:
            files = {'image': f}
            response = requests.post(f"{self.base_url}/api/images/upload", files=files)
        return response.json()

# 使用例
client = AIClient()
result = client.basic_chat("Hello AI!")
print(result)
```

## 開発者向け情報

### 機能追加の流れ

1. **機能設計（人間）**: `core/types/AIFeatures.ts` で新機能定義
2. **API実装（AI）**: `app/api/new-feature/route.ts` でエンドポイント実装
3. **テスト**: curl または SDK でAPIテスト
4. **ドキュメント更新**: このAPI仕様書に仕様追加

### デバッグ方法

```bash
# ローカル環境確認
curl http://localhost:3000/api/debug | jq .

# 詳細デバッグ
cd /workspaces/hackathon-ai-starter
./debug.sh

# ログ確認（本番環境）
gcloud run services logs read ai-chat-frontend-dev --region us-central1
```

### パフォーマンス最適化

- **キャッシュ**: レスポンスのキャッシュ実装推奨
- **ストリーミング**: 長時間処理の場合はServer-Sent Events検討
- **並列処理**: 複数AIサービスの並列呼び出し
- **エラーハンドリング**: タイムアウト・リトライ戦略

---

このAPI仕様書により、開発者は効率的にAI Chat Starter KitのAPIを活用できます。