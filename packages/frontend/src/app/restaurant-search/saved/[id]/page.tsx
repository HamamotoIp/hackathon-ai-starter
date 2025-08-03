'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CloudRestaurantStorage } from '@/lib/features/restaurant-search/storage-service';
import type { SavedRestaurantResult } from '@/lib/features/restaurant-search/types';
import { sanitizeHTML } from '@/lib/core/utils/sanitize';

export default function SavedRestaurantResultPage() {
  const params = useParams();
  const router = useRouter();
  const [result, setResult] = useState<SavedRestaurantResult | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadResult = async () => {
      if (!params.id) return;
      
      setIsLoading(true);
      try {
        const savedResult = await CloudRestaurantStorage.getById(params.id as string);
        setResult(savedResult);
        
        // HTMLコンテンツを取得
        try {
          const html = await CloudRestaurantStorage.getHtmlContent(params.id as string);
          setHtmlContent(html);
        } catch {
          // HTMLコンテンツ取得失敗時はフォールバック表示
          setHtmlContent('<div style="padding: 20px; text-align: center;"><h2>コンテンツを表示できませんでした</h2><p>HTMLファイルの読み込みに失敗しました。</p></div>');
        }
      } catch {
        // Error handling - redirect to search page
        router.push('/restaurant-search');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadResult();
  }, [params.id, router]);

  const handleDelete = async () => {
    if (result && confirm('この検索結果を削除しますか？')) {
      try {
        await CloudRestaurantStorage.delete(result.id);
        router.push('/restaurant-search');
      } catch (error) {
        const message = error instanceof Error ? error.message : '削除に失敗しました';
        alert(message);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* ヘッダー */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {result.title}
          </h1>
          <p className="text-gray-600 mb-4">{result.query}</p>

          {/* アクションボタン */}
          <div className="flex gap-3">
            <Link
              href="/restaurant-search"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              ← 一覧に戻る
            </Link>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              削除
            </button>
          </div>
        </div>

        {/* 結果表示 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-blue-600 text-white p-4">
            <h2 className="text-lg font-semibold">検索結果</h2>
          </div>
          
          <div className="p-0">
            <div 
              dangerouslySetInnerHTML={{ __html: sanitizeHTML(htmlContent || '<p>コンテンツを読み込み中...</p>') }}
              className="w-full min-h-[600px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}