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
  "success": true,
  "feature": "basic_chat",
  "result": "iPhoneとAndroidの主な違いは...",
  "processingMode": "vertex_direct",
  "processingTimeMs": 3245,
  "timestamp": "2025-01-20T12:00:00.000Z",
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
  "content": "2024年の売上データを分析してトレンドを抽出してください",
  "sessionId": "user-session-123",
  "analysisDepth": "detailed"
}
```

**レスポンス:**
```json
{
  "success": true,
  "feature": "analysis_report",
  "result": "## 売上データ分析レポート\n\n### 主要トレンド\n1. Q4に30%の成長\n2. モバイル売上が40%増加\n...",
  "processingMode": "adk_agent",
  "processingTimeMs": 24567,
  "timestamp": "2025-01-20T12:00:00.000Z",
  "sessionId": "user-session-123"
}
```

#### `POST /api/comparison`
比較研究（ADK Agent Engine）

**リクエスト:**
```http
POST /api/comparison
Content-Type: application/json

{
  "content": "ReactとVueを学習コスト、パフォーマンス、エコシステムで比較評価してください",
  "sessionId": "user-session-123",
  "comparisonCriteria": ["学習コスト", "パフォーマンス", "エコシステム"]
}
```

**レスポンス:**
```json
{
  "success": true,
  "feature": "comparison_study",
  "result": "## React vs Vue 比較分析\n\n| 項目 | React | Vue | 評価 |\n|------|-------|-----|------|\n| 学習コスト | 中 | 低 | Vue優位 |\n...",
  "processingMode": "adk_agent",
  "processingTimeMs": 35234,
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
  sessionId?: string;          // セッションID（任意）
  
  // 基本チャット用
  message?: string;            // チャットメッセージ
  
  // 分析・比較用
  content?: string;            // 分析・比較対象のコンテンツ
  analysisDepth?: "basic" | "detailed" | "comprehensive";
  comparisonCriteria?: string[];
}
```

### AIFeatureResponse
```typescript
interface AIFeatureResponse {
  success: boolean;
  feature: "basic_chat" | "analysis_report" | "comparison_study";
  result: string;              // AI処理結果
  processingMode: "vertex_direct" | "adk_agent";
  processingTimeMs: number;    // 処理時間（ミリ秒）
  timestamp: string;           // ISO 8601形式
  sessionId?: string;          // セッションID
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
| 基本チャット | 2,000文字 | 30秒 |
| 分析レポート | 5,000文字 | 60秒 |
| 比較研究 | 4,000文字 | 90秒 |

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
async function analysisReport(content: string, sessionId?: string) {
  const response = await fetch('/api/analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, sessionId })
  });
  return await response.json();
}

// 比較研究
async function comparisonStudy(content: string, sessionId?: string) {
  const response = await fetch('/api/comparison', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, sessionId })
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
  -d '{"content": "データ分析をお願いします", "sessionId": "demo"}'

# 比較研究
curl -X POST http://localhost:3000/api/comparison \
  -H "Content-Type: application/json" \
  -d '{"content": "AとBを比較", "sessionId": "demo"}'

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
    
    def analysis_report(self, content, session_id=None):
        response = requests.post(
            f"{self.base_url}/api/analysis",
            json={"content": content, "sessionId": session_id}
        )
        return response.json()
    
    def comparison_study(self, content, session_id=None):
        response = requests.post(
            f"{self.base_url}/api/comparison",
            json={"content": content, "sessionId": session_id}
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
4. **ドキュメント更新**: この API.md に仕様追加

### デバッグ方法

```bash
# ローカル環境確認
curl http://localhost:3000/api/debug | jq .

# 詳細デバッグ
cd /workspaces/kokorone-app
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