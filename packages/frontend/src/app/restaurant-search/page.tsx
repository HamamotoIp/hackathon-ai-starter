'use client';

import { useState } from 'react';
import { useRestaurantSearch } from '@/components/hooks/use-restaurant-search';

export default function RestaurantSearchPage() {
  const [query, setQuery] = useState('');
  const { isLoading, result, error, processingTimeMs, searchRestaurants, reset } = useRestaurantSearch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    await searchRestaurants(query);
  };

  const handleReset = () => {
    setQuery('');
    reset();
  };

  // 例文の提案
  const examples = [
    "渋谷でデートに使えるディナーのお店を探している",
    "新宿でランチができるおしゃれなカフェを教えて", 
    "銀座でビジネス会食に使える和食のお店を探している",
    "池袋で友達と気軽に行ける居酒屋を教えて",
    "六本木で記念日に使える高級フレンチを探している"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🍽️ 飲食店検索
          </h1>
          <p className="text-lg text-gray-600">
            AIがあなたの要望に合わせて最適なレストランをご提案します
          </p>
        </div>

        {/* 検索フォーム */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-2">
                どんなお店をお探しですか？
              </label>
              <textarea
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="例：渋谷でデートに使えるディナーのお店を探している"
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                disabled={isLoading}
              />
            </div>
            
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    検索中...
                  </span>
                ) : (
                  'レストランを検索'
                )}
              </button>
              
              {(result != null || error != null) && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  リセット
                </button>
              )}
            </div>
          </form>

          {/* 例文提案 */}
          {!isLoading && !result && !error && (
            <div className="mt-6">
              <p className="text-sm text-gray-500 mb-3">例文を参考にしてください：</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {examples.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => setQuery(example)}
                    className="text-left p-3 text-sm text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors"
                  >
                    &quot;{example}&quot;
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 処理時間表示 */}
        {processingTimeMs != null && (
          <div className="text-center mb-4">
            <span className="text-sm text-gray-500">
              処理時間: {(processingTimeMs / 1000).toFixed(1)}秒
            </span>
          </div>
        )}

        {/* エラー表示 */}
        {error != null && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  エラーが発生しました
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 結果表示 */}
        {result != null && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
              <h2 className="text-xl font-semibold">検索結果</h2>
              <p className="text-blue-100">AI生成レストラン特集記事</p>
            </div>
            
            <div className="p-0">
              {/* HTMLを直接表示 */}
              <div 
                className="restaurant-search-result"
                dangerouslySetInnerHTML={{ __html: result }}
                style={{
                  width: '100%',
                  overflow: 'hidden'
                }}
              />
            </div>
            
            {/* ダウンロードオプション */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
              <button
                onClick={() => {
                  const blob = new Blob([result], { type: 'text/html' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'restaurant-search-result.html';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                HTMLファイルをダウンロード
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}