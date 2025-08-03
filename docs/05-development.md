# 🔧 開発ガイド

AI Chat Starter Kitのカスタマイズと拡張方法

## 🏗️ プロジェクト構造

```
packages/frontend/src/
├── app/                    # Next.js App Router
│   ├── api/                # APIエンドポイント
│   └── [pages]/            # ページコンポーネント
├── components/             # UIコンポーネント
├── lib/                    # サーバーサイドロジック
│   ├── adk-agent.ts        # ADK統合
│   ├── vertex-ai.ts        # Vertex AI統合
│   └── services/           # ビジネスロジック
└── types/                  # TypeScript型定義
```

## 🎯 核心概念

### 機能ベースAI選択

システムが入力内容に基づいて最適なAIを自動選択：

```typescript
"こんにちは" → chat → Vertex AI Direct（高速）
"分析して" → analysis → ADK Agent（詳細）
"UIを作って" → ui_generation → ADK Agent（専門）
```

### 人間-AI協働開発

- **人間が管理**: ビジネスロジック、AI機能設計、重要な意思決定
- **AIが実装**: UIコンポーネント、API実装、繰り返し作業

## 🚀 新しいAI機能の追加

### Step 1: 型定義

```typescript
// types/ai-features.ts
export type AIFeatureType = 
  | "basic_chat"
  | "analysis" 
  | "ui_generation"
  | "translation";  // 新機能

// 機能設定を追加
export const AI_FEATURE_CONFIGS = {
  translation: {
    type: "translation",
    name: "翻訳",
    processingMode: "vertex_direct",
    maxInputLength: 2000,
    expectedProcessingTime: 5
  }
};
```

### Step 2: APIエンドポイント作成

```typescript
// app/api/translation/route.ts
import { NextRequest } from "next/server";
import { generateText } from "@/lib/vertex-ai";
import { 
  parseRequestBody, 
  createSuccessResponse, 
  createErrorResponse 
} from '@/lib/apiHelpers';

export async function POST(req: NextRequest) {
  try {
    const body = await parseRequestBody(req);
    
    // 翻訳プロンプト作成
    const prompt = `次のテキストを英語に翻訳してください: ${body.message}`;
    
    // Vertex AI呼び出し
    const result = await generateText(prompt);
    
    return createSuccessResponse({
      result,
      processingMode: "vertex_direct"
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
```

### Step 3: UI統合

```typescript
// components/features/TranslationCard.tsx
export function TranslationCard() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTranslate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/translation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });
      
      const data = await response.json();
      setResult(data.result);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 border rounded-lg">
      <h3 className="text-xl font-bold mb-4">翻訳</h3>
      <textarea 
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="w-full p-2 border rounded"
        placeholder="翻訳したいテキスト"
      />
      <button 
        onClick={handleTranslate}
        disabled={loading}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        {loading ? "翻訳中..." : "翻訳"}
      </button>
      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          {result}
        </div>
      )}
    </div>
  );
}
```

## 🔄 既存機能のカスタマイズ

### APIの拡張

```typescript
// 既存のAPIにオプション追加
export async function POST(req: NextRequest) {
  const body = await parseRequestBody(req);
  
  // カスタムオプション処理
  const options = body.options || {};
  if (options.format === "markdown") {
    // Markdown形式で処理
  }
  
  // 既存の処理...
}
```

### プロンプトのカスタマイズ

```typescript
// lib/prompts.ts
export const ANALYSIS_PROMPT = `
あなたはデータ分析の専門家です。
以下のデータを分析して、重要な洞察を提供してください：

{data}

出力形式：
1. 概要
2. 主要な発見
3. 推奨事項
`;
```

## 🧪 テストとデバッグ

### ローカルテスト

```bash
# 単体テスト
npm test

# E2Eテスト
npm run test:e2e

# 型チェック
npm run type-check
```

### APIテスト

```bash
# 基本的なテスト
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "テスト"}'

# レスポンス時間測定
time curl -X POST http://localhost:3000/api/analysis \
  -H "Content-Type: application/json" \
  -d '{"message": "分析テスト"}'
```

### デバッグモード

```typescript
// 環境変数でデバッグ有効化
DEBUG=true npm run dev

// コード内でデバッグ情報出力
if (process.env.DEBUG) {
  console.log('Debug:', { request: body, response: result });
}
```

## 🎨 UI/UXカスタマイズ

### Tailwind CSS設定

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#10B981',
      }
    }
  }
}
```

### レスポンシブデザイン

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* モバイル: 1列, タブレット: 2列, デスクトップ: 3列 */}
</div>
```

## 🔐 セキュリティ実装

### 入力検証

```typescript
// lib/validation.ts
export function validateInput(input: string, maxLength: number = 5000) {
  if (!input || typeof input !== 'string') {
    throw new Error('Invalid input');
  }
  
  if (input.length > maxLength) {
    throw new Error(`Input too long (max ${maxLength} chars)`);
  }
  
  // XSS対策
  const sanitized = input.replace(/<script[^>]*>.*?<\/script>/gi, '');
  
  return sanitized;
}
```

### レート制限

```typescript
// middleware.ts
import { rateLimit } from '@/lib/rate-limit';

export async function middleware(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  
  if (!await rateLimit.check(ip)) {
    return new Response('Too Many Requests', { status: 429 });
  }
}
```

## 📊 パフォーマンス最適化

### API応答の最適化

```typescript
// ストリーミングレスポンス
export async function POST(req: NextRequest) {
  const stream = new ReadableStream({
    async start(controller) {
      const chunks = await generateStreamingResponse(prompt);
      for await (const chunk of chunks) {
        controller.enqueue(chunk);
      }
      controller.close();
    }
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' }
  });
}
```

### キャッシング

```typescript
// lib/cache.ts
const cache = new Map();

export async function getCachedOrFetch(key: string, fetcher: () => Promise<any>) {
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  const data = await fetcher();
  cache.set(key, data);
  
  // 5分後に削除
  setTimeout(() => cache.delete(key), 5 * 60 * 1000);
  
  return data;
}
```

## 🚀 ベストプラクティス

### コード構成
1. **単一責任の原則**: 各関数は1つのことだけ行う
2. **型安全性**: TypeScriptの型を最大限活用
3. **エラーハンドリング**: 適切なエラーメッセージ

### Git コミット
```bash
# 良い例
git commit -m "feat: 翻訳機能を追加"
git commit -m "fix: レストラン検索のタイムアウト問題を修正"

# 悪い例
git commit -m "更新"
git commit -m "バグ修正"
```

### 環境管理
```bash
# 環境別設定
.env.local          # ローカル開発
.env.development    # 開発環境
.env.production     # 本番環境
```

## 📚 関連ドキュメント

- [AI機能追加](./06-ai-features.md) - 詳細な実装手順
- [API仕様](./03-api-reference.md) - エンドポイント詳細
- [トラブルシューティング](./08-troubleshooting.md) - 問題解決