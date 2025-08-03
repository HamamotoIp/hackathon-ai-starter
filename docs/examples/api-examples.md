# 📡 API使用例

実際のコード例とベストプラクティス

## 🤖 基本的なAI機能の使用

### チャット機能

```typescript
// 基本的なチャット
async function sendMessage(message: string) {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message,
        sessionId: 'user-123' 
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.message;
  } catch (error) {
    console.error('チャットエラー:', error);
    throw error;
  }
}

// 使用例
const reply = await sendMessage('こんにちは！今日はいい天気ですね。');
console.log(reply); // AIからの返答
```

### 分析レポート生成

```typescript
// 詳細な分析処理
async function generateAnalysis(data: string) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60秒タイムアウト
  
  try {
    const response = await fetch('/api/analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: `以下のデータを分析してください: ${data}` 
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    return {
      analysis: result.result,
      processingTime: result.processingTimeMs,
      timestamp: result.timestamp
    };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('分析がタイムアウトしました');
    }
    throw error;
  }
}

// 使用例
const analysis = await generateAnalysis('売上データ: Q1: 1000万, Q2: 1200万, Q3: 1100万, Q4: 1300万');
console.log(analysis.analysis); // 分析結果
```

### UI生成

```typescript
// レスポンシブUI生成
async function generateUI(prompt: string, deviceType: 'mobile' | 'desktop' | 'auto' = 'auto') {
  try {
    const response = await fetch('/api/ui-generation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: prompt,
        options: { deviceType }
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      return {
        html: data.result.html,
        metadata: data.result.metadata
      };
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('UI生成エラー:', error);
    throw error;
  }
}

// 使用例
const ui = await generateUI('ログインフォームを作成してください', 'mobile');
document.getElementById('preview').innerHTML = ui.html;
```

## 🍽️ レストラン検索の完全例

### 検索から保存まで

```typescript
interface RestaurantSearchFlow {
  search: (query: string) => Promise<string>;
  save: (html: string, query: string, title?: string) => Promise<SaveResult>;
  getHistory: (filters?: HistoryFilters) => Promise<SavedResult[]>;
}

class RestaurantSearchClient implements RestaurantSearchFlow {
  async search(query: string): Promise<string> {
    const response = await fetch('/api/restaurant-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: query })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error);
    }
    
    // ワークフロー完了チェック
    if (!data.workflowComplete) {
      console.warn('AI処理が不完全な可能性があります');
    }
    
    return data.result;
  }
  
  async save(html: string, query: string, title?: string): Promise<SaveResult> {
    const response = await fetch('/api/restaurant-search/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        htmlContent: html,
        query,
        title: title || `レストラン検索結果 - ${query.substring(0, 20)}`,
        processingTimeMs: Date.now() // 簡易的な処理時間
      })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error);
    }
    
    return {
      id: data.resultId,
      url: data.url,
      htmlUrl: data.htmlUrl,
      title: data.title
    };
  }
  
  async getHistory(filters?: HistoryFilters): Promise<SavedResult[]> {
    const params = new URLSearchParams();
    if (filters?.limit) params.set('limit', filters.limit.toString());
    if (filters?.tag) params.set('tag', filters.tag);
    if (filters?.search) params.set('search', filters.search);
    
    const response = await fetch(`/api/restaurant-search/history?${params}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error);
    }
    
    return data.results;
  }
}

// 使用例
const client = new RestaurantSearchClient();

async function completeRestaurantSearch(query: string) {
  try {
    console.log('検索開始:', query);
    
    // 1. AI記事生成
    const html = await client.search(query);
    console.log('生成完了');
    
    // 2. 自動保存
    const saveResult = await client.save(html, query);
    console.log('保存完了:', saveResult.url);
    
    // 3. 履歴更新
    const history = await client.getHistory({ limit: 10 });
    console.log('履歴更新:', history.length, '件');
    
    return saveResult;
  } catch (error) {
    console.error('検索処理エラー:', error);
    throw error;
  }
}

// 実行
completeRestaurantSearch('渋谷でデートに使えるイタリアン')
  .then(result => console.log('成功:', result))
  .catch(error => console.error('失敗:', error));
```

### React Hookの実装例

```typescript
// useRestaurantSearch.ts
import { useState, useCallback } from 'react';

interface UseRestaurantSearchReturn {
  search: (query: string) => Promise<void>;
  results: SavedResult[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useRestaurantSearch(): UseRestaurantSearchReturn {
  const [results, setResults] = useState<SavedResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const client = new RestaurantSearchClient();
  
  const search = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // 検索 → 保存 → 履歴更新
      await completeRestaurantSearch(query);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '検索に失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);
  
  const refresh = useCallback(async () => {
    try {
      const history = await client.getHistory({ limit: 50 });
      setResults(history);
    } catch (err) {
      setError('履歴の取得に失敗しました');
    }
  }, []);
  
  return { search, results, loading, error, refresh };
}

// コンポーネントでの使用
function RestaurantSearchComponent() {
  const { search, results, loading, error } = useRestaurantSearch();
  const [query, setQuery] = useState('');
  
  const handleSearch = async () => {
    if (query.trim()) {
      await search(query.trim());
      setQuery('');
    }
  };
  
  return (
    <div>
      <div className="flex gap-2 mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="レストランを検索..."
          className="flex-1 p-2 border rounded"
        />
        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {loading ? '検索中...' : '検索'}
        </button>
      </div>
      
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map(result => (
          <ResultCard key={result.id} result={result} />
        ))}
      </div>
    </div>
  );
}
```

## 📷 画像アップロード

```typescript
// 画像アップロード機能
async function uploadImage(file: File): Promise<UploadResult> {
  // ファイル検証
  if (!file.type.startsWith('image/')) {
    throw new Error('画像ファイルを選択してください');
  }
  
  if (file.size > 5 * 1024 * 1024) { // 5MB制限
    throw new Error('ファイルサイズは5MB以下にしてください');
  }
  
  const formData = new FormData();
  formData.append('image', file);
  
  try {
    const response = await fetch('/api/images/upload', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'アップロードに失敗しました');
    }
    
    const data = await response.json();
    return {
      url: data.url,
      filename: data.filename,
      size: data.size
    };
  } catch (error) {
    console.error('画像アップロードエラー:', error);
    throw error;
  }
}

// 使用例（React）
function ImageUploadComponent() {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const result = await uploadImage(file);
      setImageUrl(result.url);
    } catch (error) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
      />
      
      {uploading && <p>アップロード中...</p>}
      
      {imageUrl && (
        <img src={imageUrl} alt="アップロード画像" className="max-w-sm" />
      )}
    </div>
  );
}
```

## ⚡ パフォーマンス最適化

### リクエストの並列処理

```typescript
// 複数AI機能の並列実行
async function parallelAIProcessing(queries: string[]) {
  const promises = queries.map(async (query, index) => {
    try {
      // 機能別に適切なエンドポイントを選択
      const endpoint = index % 2 === 0 ? '/api/chat' : '/api/analysis';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query })
      });
      
      return await response.json();
    } catch (error) {
      return { error: error.message, query };
    }
  });
  
  const results = await Promise.allSettled(promises);
  
  return results.map((result, index) => ({
    query: queries[index],
    status: result.status,
    data: result.status === 'fulfilled' ? result.value : result.reason
  }));
}
```

### キャッシュ機能

```typescript
// シンプルなメモリキャッシュ
class APICache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl = 5 * 60 * 1000; // 5分
  
  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  clear(): void {
    this.cache.clear();
  }
}

const apiCache = new APICache();

// キャッシュ付きAPI呼び出し
async function cachedAPICall(endpoint: string, body: any) {
  const cacheKey = `${endpoint}-${JSON.stringify(body)}`;
  
  // キャッシュチェック
  const cached = apiCache.get(cacheKey);
  if (cached) {
    console.log('キャッシュヒット:', cacheKey);
    return cached;
  }
  
  // API呼び出し
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  
  const data = await response.json();
  
  // キャッシュ保存
  apiCache.set(cacheKey, data);
  
  return data;
}
```

## 🔍 エラーハンドリング

### 堅牢なエラー処理

```typescript
// カスタムエラークラス
class AIAPIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public endpoint: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'AIAPIError';
  }
}

// 統一エラーハンドリング
async function safeAPICall<T>(
  endpoint: string,
  body: any,
  options: { timeout?: number; retries?: number } = {}
): Promise<T> {
  const { timeout = 30000, retries = 3 } = options;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new AIAPIError(
          errorData.error || `HTTP ${response.status}`,
          response.status,
          endpoint
        );
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API呼び出し失敗 (${attempt}/${retries}):`, error);
      
      if (attempt === retries) {
        if (error instanceof AIAPIError) {
          throw error;
        } else if (error.name === 'AbortError') {
          throw new AIAPIError('タイムアウトしました', 408, endpoint, error);
        } else {
          throw new AIAPIError('ネットワークエラー', 0, endpoint, error);
        }
      }
      
      // 再試行前の待機
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

// 使用例
try {
  const result = await safeAPICall('/api/analysis', { message: 'test' }, {
    timeout: 60000,
    retries: 2
  });
  console.log(result);
} catch (error) {
  if (error instanceof AIAPIError) {
    console.error(`${error.endpoint}でエラー: ${error.message}`);
  } else {
    console.error('予期しないエラー:', error);
  }
}
```

## 📚 型定義

```typescript
// 共通型定義
interface BaseAPIRequest {
  message: string;
  sessionId?: string;
}

interface BaseAPIResponse {
  success: boolean;
  processingTimeMs: number;
  timestamp: string;
  sessionId?: string;
}

interface UploadResult {
  url: string;
  filename: string;
  size: number;
}

interface SavedResult {
  id: string;
  query: string;
  title: string;
  htmlStorageUrl: string;
  createdAt: string;
  tags: string[];
  isPublic: boolean;
}

interface HistoryFilters {
  limit?: number;
  tag?: string;
  search?: string;
}

interface SaveResult {
  id: string;
  url: string;
  htmlUrl: string;
  title: string;
}
```

これらの例を参考に、AI Chat Starter Kitの機能を最大限活用してください。