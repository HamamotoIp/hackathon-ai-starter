'use client';

import { useState } from 'react';
import { Loader2, Code, Eye, Smartphone, Tablet, Monitor, Wand2 } from 'lucide-react';
import { useUIGeneration } from '@/components/hooks/use-ui-generation';
import type { DeviceType } from '@/lib/ai-features';

const deviceOptions: { value: DeviceType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'auto', label: '自動最適化', icon: Wand2 },
  { value: 'desktop', label: 'デスクトップ', icon: Monitor },
  { value: 'tablet', label: 'タブレット', icon: Tablet },
  { value: 'mobile', label: 'モバイル', icon: Smartphone },
];

export default function UIBuilderPage() {
  const { prompt, setPrompt, html, deviceType, setDeviceType, isGenerating, error, generate, clear } = useUIGeneration();
  const [viewMode, setViewMode] = useState<'code' | 'preview'>('preview');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await generate();
  };

  const renderHTML = () => {
    if (!html?.result) return null;
    
    // HTMLの結果を取得（文字列またはオブジェクト）
    const htmlContent = typeof html.result === 'string' 
      ? html.result 
      : html.result.html;

    return htmlContent;
  };

  const examplePrompts = [
    "レストランの予約フォームを作成してください。名前、電話番号、人数、希望日時を入力できるようにして。",
    "商品カードを作成してください。画像、タイトル、価格、説明文が表示できるようにして。",
    "売上ダッシュボードを作成してください。グラフとKPI表示を含めて。",
    "会社紹介のランディングページを作成してください。ヒーロー、サービス紹介、お問い合わせを含めて。",
  ];

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="bg-white rounded-lg shadow-md border">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Code className="h-6 w-6 text-purple-600" />
            UI生成ツール
          </h1>
          <p className="text-gray-600 mt-2">
            ADK Agent Engineによるデバイス最適化HTML/CSS生成（処理時間: 20-25秒）
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          {/* 入力パネル */}
          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="ui-prompt" className="block text-sm font-medium text-gray-700 mb-2">
                  作成したいUIの説明
                </label>
                <textarea
                  id="ui-prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="例：レストランの予約フォームを作成してください。お名前、電話番号、人数、希望日時を入力できるようにしてください..."
                  rows={6}
                  disabled={isGenerating}
                  maxLength={3000}
                  className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100"
                />
                <div className="mt-2 text-sm text-gray-500">
                  {prompt.length}/3000文字
                </div>
              </div>

              {/* デバイスタイプ選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  対象デバイス
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {deviceOptions.map((option) => {
                    const IconComponent = option.icon;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setDeviceType(option.value)}
                        disabled={isGenerating}
                        className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                          deviceType === option.value
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-gray-300 hover:border-gray-400 text-gray-700'
                        } disabled:opacity-50`}
                      >
                        <IconComponent className="h-4 w-4" />
                        <span className="text-sm font-medium">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <button
                  type="submit"
                  disabled={isGenerating || !prompt.trim()}
                  className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-5 w-5" />
                      UI生成
                    </>
                  )}
                </button>
                
                {Boolean(html ?? error) && (
                  <button
                    type="button"
                    onClick={clear}
                    className="text-sm text-gray-600 hover:text-gray-800 underline"
                  >
                    クリア
                  </button>
                )}
              </div>
            </form>

            {/* サンプルプロンプト */}
            <div className="space-y-2">
              <h3 className="font-medium text-gray-700">サンプルプロンプト</h3>
              {examplePrompts.map((example, index) => (
                <button
                  key={index}
                  className="w-full text-left p-3 text-sm bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  onClick={() => setPrompt(example)}
                  disabled={isGenerating}
                >
                  {example}
                </button>
              ))}
            </div>

            {/* エラー表示 */}
            {Boolean(error) && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <div className="text-red-600 font-medium">UI生成エラーが発生しました</div>
                </div>
                <div className="mt-2 text-red-700">{error}</div>
              </div>
            )}
          </div>

          {/* 結果パネル */}
          <div className="space-y-4">
            {Boolean(html) && (
              <>
                {/* ビューモード切り替え */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">生成結果</h3>
                  <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                    <button
                      onClick={() => setViewMode('preview')}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        viewMode === 'preview'
                          ? 'bg-purple-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Eye className="h-4 w-4 inline mr-1" />
                      プレビュー
                    </button>
                    <button
                      onClick={() => setViewMode('code')}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        viewMode === 'code'
                          ? 'bg-purple-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Code className="h-4 w-4 inline mr-1" />
                      コード
                    </button>
                  </div>
                </div>

                {/* メタデータ表示 */}
                <div className="text-sm text-gray-500 flex gap-4">
                  <span>処理時間: {html?.processingTimeMs}ms</span>
                  <span>デバイス: {deviceType}</span>
                  {Boolean(html?.timestamp) && (
                    <span>生成日時: {new Date(html!.timestamp).toLocaleString('ja-JP')}</span>
                  )}
                </div>

                {/* 結果表示 */}
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  {viewMode === 'preview' ? (
                    <div className="h-96 overflow-auto">
                      <iframe
                        srcDoc={renderHTML() ?? ''}
                        className="w-full h-full border-0"
                        title="UI Preview"
                      />
                    </div>
                  ) : (
                    <div className="h-96 overflow-auto">
                      <pre className="p-4 text-xs bg-gray-900 text-gray-100 overflow-auto">
                        <code>{renderHTML()}</code>
                      </pre>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* 初期状態の説明 */}
            {!html && !error && !isGenerating && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Code className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">UI生成エンジン</h3>
                <p className="text-gray-500 mb-4">
                  作りたいUIの説明を入力すると、デバイス最適化されたHTML/CSSを生成します
                </p>
                <div className="text-sm text-gray-400">
                  <p>• Tailwind CSSを使用した高品質なデザイン</p>
                  <p>• デバイス別最適化対応</p>
                  <p>• プレビューとコード表示</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}