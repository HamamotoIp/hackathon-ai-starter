'use client';

import { useState, useEffect } from 'react';
import { CloudRestaurantStorage } from '@/lib/features/restaurant-search/storage-service';
import type { SavedRestaurantResult } from '@/lib/features/restaurant-search/types';
import { sanitizeHTML } from '@/lib/core/utils/sanitize';

export default function RestaurantSearchPage() {
  const [searchMessage, setSearchMessage] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<SavedRestaurantResult[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // 履歴読み込み
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await CloudRestaurantStorage.getHistory({ limit: 10 });
      setHistory(response.results);
    } catch {
      // エラーは無視
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchMessage.trim()) return;
    
    setIsSearching(true);
    setError(null);
    setResult(null);
    
    try {
      // 1. 検索実行
      const response = await fetch('/api/restaurant-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: searchMessage }),
      });
      
      if (!response.ok) {
        throw new Error('検索に失敗しました');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error ?? '検索に失敗しました');
      }
      
      setResult(data.result);
      
      // 2. 結果を保存
      await CloudRestaurantStorage.save({
        htmlContent: data.result,
        query: searchMessage,
        title: `${searchMessage.substring(0, 30)}${searchMessage.length > 30 ? '...' : ''}`,
        processingTimeMs: data.processingTimeMs ?? 0,
      });
      
      // 3. 履歴を更新
      await loadHistory();
      
    } catch (error) {
      const message = error instanceof Error ? error.message : '検索に失敗しました';
      setError(message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleHistoryClick = (item: SavedRestaurantResult) => {
    // 専用ページに遷移
    window.open(`/restaurant-search/saved/${item.id}`, '_blank');
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">🍽️ レストラン検索</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 検索フォーム */}
        <div className="lg:col-span-2">
          <div className="bg-white border rounded-lg p-6 mb-8">
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label htmlFor="search" className="block text-sm font-medium mb-2">
                  検索条件を入力してください
                </label>
                <textarea
                  id="search"
                  value={searchMessage}
                  onChange={(e) => setSearchMessage(e.target.value)}
                  placeholder="例：渋谷でデートに使えるイタリアン"
                  rows={3}
                  disabled={isSearching}
                  className="w-full p-3 border rounded-lg disabled:bg-gray-100"
                />
              </div>
              
              {error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              ) : null}
              
              <button
                type="submit"
                disabled={isSearching || !searchMessage.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isSearching ? '検索中...' : '検索'}
              </button>
            </form>
          </div>

          {/* 検索結果 */}
          {result ? (
            <div className="bg-white border rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">検索結果</h2>
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizeHTML(result) }}
              />
            </div>
          ) : null}
        </div>

        {/* 履歴 */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">検索履歴</h2>
          
          {isLoadingHistory ? (
            <p className="text-gray-500 text-center py-4">読み込み中...</p>
          ) : history.length === 0 ? (
            <p className="text-gray-500 text-center py-4">履歴がありません</p>
          ) : (
            <div className="space-y-2">
              {history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleHistoryClick(item)}
                  className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <h3 className="font-medium text-sm mb-1">{item.title}</h3>
                  <p className="text-xs text-gray-600">{item.query}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(item.createdAt).toLocaleDateString('ja-JP')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}