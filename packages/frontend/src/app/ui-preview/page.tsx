"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";

/**
 * UI Preview Page Content Component
 * iframe内で安全にUIプレビューを表示するためのページコンテンツ
 */
function UIPreviewContent() {
  const searchParams = useSearchParams();
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const htmlParam = searchParams.get("html");
    
    if (htmlParam) {
      try {
        // Base64デコードされたHTMLを取得
        const decodedHtml = decodeURIComponent(htmlParam);
        setHtmlContent(decodedHtml);
      } catch (err) {
        // console.error("HTML decode error:", err);
        // エラーログ出力（本番環境では削除予定）
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.error('HTML decode error:', err);
        }
        setError("HTMLの読み込みに失敗しました");
      }
    } else {
      setError("プレビューするHTMLが指定されていません");
    }
    
    setLoading(false);
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <div className="text-gray-600">プレビューを読み込み中...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            プレビューエラー
          </h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 生成されたHTMLをそのまま表示 */}
      <div 
        dangerouslySetInnerHTML={{ __html: htmlContent }}
        className="w-full"
      />
      
      {/* プレビュー用のTailwind CSSを確実に読み込み */}
      <style jsx global>{`
        /* Tailwind CSS用のスタイルをここに含める */
        .container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
        .grid { display: grid; }
        .flex { display: flex; }
        .items-center { align-items: center; }
        .justify-center { justify-content: center; }
        .space-y-4 > * + * { margin-top: 1rem; }
        .space-x-4 > * + * { margin-left: 1rem; }
        .text-center { text-align: center; }
        .w-full { width: 100%; }
        .h-full { height: 100%; }
        .min-h-screen { min-height: 100vh; }
        .p-4 { padding: 1rem; }
        .p-6 { padding: 1.5rem; }
        .m-4 { margin: 1rem; }
        .mb-4 { margin-bottom: 1rem; }
        .mt-4 { margin-top: 1rem; }
        .rounded { border-radius: 0.25rem; }
        .rounded-lg { border-radius: 0.5rem; }
        .shadow { box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06); }
        .shadow-md { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
        .border { border-width: 1px; border-color: #e5e7eb; }
        .bg-white { background-color: #ffffff; }
        .bg-gray-50 { background-color: #f9fafb; }
        .bg-gray-100 { background-color: #f3f4f6; }
        .bg-blue-600 { background-color: #2563eb; }
        .text-gray-700 { color: #374151; }
        .text-gray-800 { color: #1f2937; }
        .text-gray-900 { color: #111827; }
        .text-white { color: #ffffff; }
        .font-medium { font-weight: 500; }
        .font-semibold { font-weight: 600; }
        .font-bold { font-weight: 700; }
        .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
        .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
        .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
        .text-2xl { font-size: 1.5rem; line-height: 2rem; }
        .text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
        .leading-relaxed { line-height: 1.625; }
        
        /* フォーム要素のスタイル */
        input, textarea, select {
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          line-height: 1.25rem;
        }
        
        input:focus, textarea:focus, select:focus {
          outline: 2px solid transparent;
          outline-offset: 2px;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        button {
          border-radius: 0.375rem;
          padding: 0.5rem 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease-in-out;
        }
        
        button:hover {
          transform: translateY(-1px);
        }
        
        /* レスポンシブ対応 */
        @media (max-width: 640px) {
          .grid-cols-2 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
          .flex-col { flex-direction: column; }
        }
        
        @media (min-width: 768px) {
          .md\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .md\\:flex-row { flex-direction: row; }
        }
        
        @media (min-width: 1024px) {
          .lg\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
      `}</style>
    </div>
  );
}

/**
 * UI Preview Page with Suspense
 * Next.js 15 の useSearchParams() 要件に対応
 */
export default function UIPreviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <div className="text-gray-600">プレビューを読み込み中...</div>
        </div>
      </div>
    }>
      <UIPreviewContent />
    </Suspense>
  );
}