'use client';

import { useState } from 'react';
import { useUIGeneration } from '@/components/hooks/use-ui-generation';

export default function UIBuilderPage() {
  const { prompt, setPrompt, html, isGenerating, error, generate } = useUIGeneration();
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await generate();
  };

  const renderHTML = () => {
    if (!html?.result) return null;
    return html.result.html;
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">🎨 UI生成ツール</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 入力フォーム */}
        <div className="bg-white border rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium mb-2">
                作成したいUIの説明
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="例：レストランの予約フォームを作成してください"
                rows={6}
                disabled={isGenerating}
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
              disabled={isGenerating || !prompt.trim()}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isGenerating ? '生成中...' : 'UI生成'}
            </button>
          </form>
        </div>

        {/* 結果表示 */}
        <div className="bg-white border rounded-lg p-6">
          {html ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">生成結果</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode('preview')}
                    className={`px-3 py-1 text-sm rounded ${
                      viewMode === 'preview' ? 'bg-purple-600 text-white' : 'bg-gray-200'
                    }`}
                  >
                    プレビュー
                  </button>
                  <button
                    onClick={() => setViewMode('code')}
                    className={`px-3 py-1 text-sm rounded ${
                      viewMode === 'code' ? 'bg-purple-600 text-white' : 'bg-gray-200'
                    }`}
                  >
                    コード
                  </button>
                </div>
              </div>
              
              <div className="border rounded-lg overflow-hidden" style={{ height: '400px' }}>
                {viewMode === 'preview' ? (
                  <iframe
                    srcDoc={renderHTML() ?? ''}
                    className="w-full h-full border-0"
                    title="UI Preview"
                  />
                ) : (
                  <pre className="p-4 text-xs bg-gray-900 text-gray-100 overflow-auto h-full">
                    <code>{renderHTML()}</code>
                  </pre>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">UIの説明を入力して生成ボタンを押してください</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}