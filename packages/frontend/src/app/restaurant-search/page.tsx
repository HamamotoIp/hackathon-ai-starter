'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { CloudRestaurantStorage } from '@/lib/services/cloud-restaurant-storage';
import type { SavedRestaurantResult } from '@/lib/types/saved-result';

export default function RestaurantSearchPage() {
  const [results, setResults] = useState<SavedRestaurantResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // 新規検索用の状態
  const [isSearching, setIsSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);

  const loadResults = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await CloudRestaurantStorage.getHistory({
        limit: 100, // 全部表示
        tag: selectedTag ?? undefined,
        search: searchQuery ?? undefined,
      });
      setResults(response.results);
      setAvailableTags(response.availableTags);
    } catch {
      // Error silently handled - no console output needed
    } finally {
      setIsLoading(false);
    }
  }, [selectedTag, searchQuery]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchMessage.trim()) return;
    
    setIsSearching(true);
    setSearchError(null);
    
    try {
      // 1. レストラン検索APIを呼び出し
      const searchResponse = await fetch('/api/restaurant-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: searchMessage }),
      });
      
      if (!searchResponse.ok) {
        throw new Error('検索に失敗しました');
      }
      
      const searchData = await searchResponse.json();
      
      if (!searchData.success) {
        throw new Error(searchData.error ?? '検索に失敗しました');
      }
      
      // 2. 生成されたHTMLを自動保存
      await CloudRestaurantStorage.save({
        htmlContent: searchData.result,
        query: searchMessage,
        title: `レストラン検索結果 - ${searchMessage.substring(0, 20)}${searchMessage.length > 20 ? '...' : ''}`,
        processingTimeMs: searchData.processingTimeMs,
      });
      
      // 3. ギャラリーを更新
      await loadResults();
      
      // 4. フォームをクリア
      setSearchMessage('');
      
    } catch (error) {
      const message = error instanceof Error ? error.message : '検索に失敗しました';
      setSearchError(message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('この検索結果を削除しますか？')) {
      try {
        await CloudRestaurantStorage.delete(id);
        await loadResults(); // 再読み込み
      } catch (error) {
        const message = error instanceof Error ? error.message : '削除に失敗しました';
        alert(message);
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🍽️ レストラン特集記事
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            AIが生成したレストラン特集記事の一覧です
          </p>
          
          {/* 新規検索フォーム */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl p-6 shadow-lg">
            <h2 className="text-2xl font-bold mb-3">新しい記事を作成</h2>
            <p className="mb-4 text-blue-100">
              自然な言葉でレストランを検索すると、AIが特集記事を自動生成・保存します
            </p>
            
            {/* 検索フォーム */}
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <textarea
                  value={searchMessage}
                  onChange={(e) => setSearchMessage(e.target.value)}
                  placeholder="例：渋谷でデートに使えるイタリアン、銀座で接待向けの高級和食..."
                  rows={3}
                  disabled={isSearching}
                  className="w-full p-4 border-0 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-300 disabled:bg-gray-100 resize-none"
                />
              </div>
              
              {/* エラー表示 */}
              {searchError ? (
                <div className="bg-red-500 bg-opacity-20 border border-red-300 rounded-lg p-3">
                  <p className="text-red-100 text-sm">{searchError}</p>
                </div>
              ) : null}
              
              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={isSearching || !searchMessage.trim()}
                  className="px-8 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors font-medium shadow-md flex items-center gap-2"
                >
                  {isSearching ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      記事を生成中...
                    </>
                  ) : (
                    <>
                      🍽️ 記事を生成
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* フィルター */}
        {availableTags.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* タグフィルター */}
              <div>
                <label htmlFor="tag-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  タグでフィルター
                </label>
                <select
                  id="tag-filter"
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">すべてのタグ</option>
                  {availableTags.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
              </div>

              {/* 検索フィルター */}
              <div>
                <label htmlFor="search-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  キーワード検索
                </label>
                <input
                  id="search-filter"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="クエリを検索..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}

        {/* 結果がない場合 */}
        {results.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="mb-6">
              <span className="text-6xl">🍽️</span>
            </div>
            <p className="text-gray-500 text-lg mb-4">
              {selectedTag || searchQuery ? '条件に一致する結果がありません' : 'まだ記事が作成されていません'}
            </p>
            <p className="text-gray-400 text-sm">
              上記のフォームから検索すると、AIが特集記事を自動生成します
            </p>
          </div>
        ) : (
          /* 結果一覧 */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {results.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                <div className="p-6">
                  <h3 className="font-bold text-xl mb-3 text-gray-800 leading-tight">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                    {item.query}
                  </p>

                  {/* タグ表示 */}
                  {item.tags && item.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {item.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 text-xs rounded-full font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                      {item.tags.length > 3 && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{item.tags.length - 3}
                        </span>
                      )}
                    </div>
                  ) : null}

                  <div className="flex justify-between items-center mb-6">
                    <div className="text-xs text-gray-500">
                      <div className="font-medium">{formatDate(item.createdAt)}</div>
                      <div className="text-gray-400">{(item.metadata.processingTimeMs / 1000).toFixed(1)}秒で生成</div>
                    </div>
                    {item.isPublic ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                        共有可能
                      </span>
                    ) : null}
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/restaurant-search/saved/${item.id}`}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 text-center font-medium shadow-md"
                    >
                      🍽️ 詳細を見る
                    </Link>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="px-4 py-3 bg-red-50 text-red-600 text-sm rounded-lg hover:bg-red-100 transition-colors border border-red-200"
                      title="削除"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 統計情報 */}
        {results.length > 0 && (
          <div className="mt-12 text-center">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                📊 生成統計
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium text-blue-600">{results.length}</span> 件の結果
                </div>
                <div>
                  <span className="font-medium text-green-600">{availableTags.length}</span> 種類のタグ
                </div>
                <div>
                  <span className="font-medium text-purple-600">
                    {Math.round(results.reduce((acc, r) => acc + r.metadata.processingTimeMs, 0) / results.length / 1000)}
                  </span> 秒平均生成時間
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}