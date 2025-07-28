# レストラン検索エージェント レスポンス形式ドキュメント

## 概要

このドキュメントでは、Google Cloud Reasoning Engine（ADK Agent）を使用したレストラン検索エージェントのレスポンス形式について詳細に説明します。

## エージェント構成

レストラン検索エージェントは以下の5つのサブエージェントで構成されています：

1. **SimpleIntentAgent**: ユーザー入力の意図理解
2. **SimpleSearchAgent**: 2段階検索の実行
3. **SimpleSelectionAgent**: 検索結果から5店舗を選定
4. **SimpleDescriptionAgent**: 各店舗の説明文生成
5. **SimpleUIAgent**: HTML記事の生成

## レスポンス形式

### 1. 全体構造

```json
{
  "content": {
    "parts": [{"text": "エージェントの出力テキスト"}],
    "role": "model"
  },
  "usage_metadata": {...},
  "invocation_id": "...",
  "author": "エージェント名",
  "actions": {
    "state_delta": {
      "output_key": "エージェントの出力データ"
    },
    "artifact_delta": {},
    "requested_auth_configs": {}
  },
  "id": "...",
  "timestamp": 1753708543.366816
}
```

### 2. 各エージェントの出力

#### SimpleIntentAgent
```json
{
  "author": "SimpleIntentAgent",
  "actions": {
    "state_delta": {
      "search_params": "```json\n{\n    \"area\": \"銀座\",\n    \"scene\": \"ビジネス\",\n    \"time\": \"ディナー\",\n    \"requests\": [\"和食\"]\n}\n```"
    }
  }
}
```

#### SimpleSearchAgent
```json
{
  "author": "SimpleSearchAgent",
  "actions": {
    "state_delta": {
      "search_results": "```tool_code\ntwo_step_search(area='銀座', scene='ビジネス', cuisine='和食')\n```"
    }
  }
}
```

#### SimpleSelectionAgent
```json
{
  "author": "SimpleSelectionAgent",
  "actions": {
    "state_delta": {
      "selected_restaurants": "```json\n{\n    \"selected_restaurants\": [\n        {\n            \"name\": \"銀座 KOSO\",\n            \"area\": \"銀座\",\n            \"genre\": \"和食\",\n            \"description\": \"...\",\n            \"reason\": \"...\"\n        }\n    ]\n}\n```"
    }
  }
}
```

#### SimpleDescriptionAgent
```json
{
  "author": "SimpleDescriptionAgent",
  "actions": {
    "state_delta": {
      "descriptions": "```json\n{\n    \"descriptions\": [\n        {\n            \"name\": \"銀座 KOSO\",\n            \"description\": \"150文字程度の詳細説明...\"\n        }\n    ]\n}\n```"
    }
  }
}
```

#### SimpleUIAgent（最終出力）
```json
{
  "author": "SimpleUIAgent",
  "actions": {
    "state_delta": {
      "html": "```html\n<!DOCTYPE html>\n<html lang=\"ja\">...</html>\n```"
    }
  }
}
```

### 3. 最終HTML出力の詳細

最終的なHTML出力は以下の特徴を持ちます：

- **場所**: `actions.state_delta.html`
- **形式**: ````html`タグで囲まれた完全なHTMLドキュメント
- **文字エンコーディング**: Unicodeエスケープ（例：`\u9280\u5ea7` = 銀座）
- **構造**: 完全なHTML5ドキュメント（DOCTYPE、head、body含む）

#### HTMLの実際の例
```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>銀座 和食 ビジネス会食 特集</title>
  <style>
    /* レスポンシブデザインのCSS */
  </style>
</head>
<body>
  <div class="container">
    <h1>銀座 和食 ビジネス会食におすすめのお店</h1>
    <div class="card-grid">
      <div class="card">
        <h2>銀座 KOSO</h2>
        <p>詳細説明...</p>
      </div>
      <!-- 他の店舗カード -->
    </div>
  </div>
</body>
</html>
```

## フロントエンド処理

### 1. レスポンス解析

```typescript
function parseADKResponse(responseData: string): string {
  // SSE形式のレスポンスを行ごとに分割
  const lines = responseData.split('\n');
  const dataLines = lines.filter(line => line.startsWith('data: '));
  
  for (const line of dataLines) {
    const jsonData = line.replace('data: ', '').trim();
    const parsedData = JSON.parse(jsonData);
    
    // 最終的なHTML出力を検索
    if (parsedData.actions?.state_delta?.html) {
      return cleanHTMLContent(parsedData.actions.state_delta.html);
    }
  }
}
```

### 2. HTML クリーニング

```typescript
function cleanHTMLContent(content: string): string {
  // ```htmlタグの除去
  let cleaned = content
    .replace(/^```html\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();
  
  // Unicodeエスケープのデコード
  cleaned = cleaned.replace(/\\u([0-9a-fA-F]{4})/g, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });
  
  // その他のエスケープ文字の処理
  cleaned = cleaned.replace(/\\n/g, '\n');
  cleaned = cleaned.replace(/\\t/g, '\t');
  cleaned = cleaned.replace(/\\"/g, '"');
  cleaned = cleaned.replace(/\\\\/g, '\\');
  
  return cleaned;
}
```

## トラブルシューティング

### よくある問題

1. **HTMLが文字列のまま表示される**
   - 原因：Unicodeエスケープが正しくデコードされていない
   - 解決：`cleanHTMLContent`関数でエスケープ処理を実行

2. **スタイルが適用されない**
   - 原因：CSSの`all: 'initial'`でスタイルがリセットされている
   - 解決：スタイルリセットを削除

3. **部分的なHTMLが表示される**
   - 原因：レスポンスの途中でHTMLを取得している
   - 解決：最後の`SimpleUIAgent`の出力のみを使用

### デバッグ用ログ

```typescript
console.log('[DEBUG] Raw ADK Response:', responseData.substring(0, 500));
console.log('[DEBUG] Parsed SSE Event:', JSON.stringify(parsedData));
console.log('[DEBUG] Found HTML in actions.state_delta.html');
console.log('[DEBUG] Returning HTML content:', htmlContent.substring(0, 200));
```

## API仕様

### エンドポイント
```
POST /api/restaurant-search
```

### リクエスト
```json
{
  "message": "銀座でビジネス会食に使える和食のお店を探している",
  "sessionId": "optional-session-id"
}
```

### レスポンス
```json
{
  "success": true,
  "result": "<!DOCTYPE html><html>...</html>",
  "processingMode": "adk_agent",
  "processingTimeMs": 18900,
  "sessionId": "generated-session-id",
  "timestamp": "2025-01-27T12:34:56.789Z"
}
```

## 更新履歴

- **2025-01-27**: 初版作成
- **2025-01-27**: Unicodeエスケープ処理の改善
- **2025-01-27**: HTMLレンダリング問題の修正