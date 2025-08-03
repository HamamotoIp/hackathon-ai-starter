'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CloudRestaurantStorage } from '@/lib/services/cloud-restaurant-storage';
import type { SavedRestaurantResult } from '@/lib/types/saved-result';

export default function SavedRestaurantResultPage() {
  const params = useParams();
  const router = useRouter();
  const [result, setResult] = useState<SavedRestaurantResult | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    const loadResult = async () => {
      if (!params.id) return;
      
      setIsLoading(true);
      try {
        const savedResult = await CloudRestaurantStorage.getById(params.id as string);
        setResult(savedResult);
        setEditedTitle(savedResult.title);
        
        // HTMLコンテンツを取得
        try {
          const html = await CloudRestaurantStorage.getHtmlContent(params.id as string);
          setHtmlContent(html);
        } catch {
          // HTMLコンテンツ取得失敗時はフォールバック表示
          setHtmlContent('<div style="padding: 20px; text-align: center;"><h2>コンテンツを表示できませんでした</h2><p>HTMLファイルの読み込みに失敗しました。</p></div>');
        }
        
        // 共有URL
        setShareUrl(`${window.location.origin}/restaurant-search/saved/${params.id}`);
      } catch {
        // Error handling - redirect to search page
        router.push('/restaurant-search');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadResult();
  }, [params.id, router]);

  const handleTitleUpdate = async () => {
    if (result && editedTitle.trim()) {
      try {
        await CloudRestaurantStorage.updateTitle(result.id, editedTitle.trim());
        setResult({ ...result, title: editedTitle.trim() });
        setIsEditingTitle(false);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'タイトルの更新に失敗しました';
        alert(message);
      }
    }
  };

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

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: result?.title ?? 'レストラン検索結果',
          text: result?.query ?? '',
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert('URLをクリップボードにコピーしました');
      }
    } catch {
      // フォールバック：URLをアラートで表示
      prompt('この URLをコピーして共有してください:', shareUrl);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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

  if (!result) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* ヘッダー */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              {isEditingTitle ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleTitleUpdate();
                      if (e.key === 'Escape') {
                        setEditedTitle(result.title);
                        setIsEditingTitle(false);
                      }
                    }}
                    autoFocus
                  />
                  <button
                    onClick={handleTitleUpdate}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    保存
                  </button>
                  <button
                    onClick={() => {
                      setEditedTitle(result.title);
                      setIsEditingTitle(false);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    キャンセル
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-800">
                    {result.title}
                  </h1>
                  <button
                    onClick={() => setIsEditingTitle(true)}
                    className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                    title="タイトルを編集"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="text-gray-600 mb-4">
            <p className="mb-2">{result.query}</p>
            <div className="flex gap-4 text-sm text-gray-500">
              <span>保存日時: {formatDate(result.createdAt)}</span>
              <span>処理時間: {(result.metadata.processingTimeMs / 1000).toFixed(1)}秒</span>
            </div>
          </div>

          {/* タグ表示 */}
          {result.tags && result.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-4">
              {result.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 text-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          {/* アクションボタン */}
          <div className="flex gap-3 flex-wrap">
            <Link
              href="/restaurant-search"
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ← 一覧に戻る
            </Link>
            <Link
              href="/restaurant-search"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              新しい記事を作成
            </Link>
            <button
              onClick={handleShare}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              共有
            </button>
            <button
              onClick={() => {
                const blob = new Blob([htmlContent], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `restaurant-search-${result.id}.html`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              HTMLダウンロード
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors ml-auto"
            >
              削除
            </button>
          </div>
        </div>

        {/* 結果表示 */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
            <h2 className="text-xl font-semibold">検索結果</h2>
            <p className="text-blue-100 text-sm">Cloud Storage保存済み</p>
          </div>
          
          <div className="p-0">
            <div 
              dangerouslySetInnerHTML={{ __html: htmlContent || '<p>コンテンツを読み込み中...</p>' }}
              className="w-full min-h-[700px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}