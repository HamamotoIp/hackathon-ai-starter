'use client';

import { Loader2, FileText, BarChart3 } from 'lucide-react';
import { useAnalysis } from '@/components/hooks/use-analysis';

export default function AIFeaturesPage() {
  const { input, setInput, report, isProcessing, error, analyze, clear } = useAnalysis();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await analyze();
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="bg-white rounded-lg shadow-md border">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-green-600" />
            AI機能統合 - 分析レポート
          </h1>
          <p className="text-gray-600 mt-2">
            ADK Agent Engineによる詳細分析と構造化レポート生成（処理時間: 20-30秒）
          </p>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            <div>
              <label htmlFor="analysis-input" className="block text-sm font-medium text-gray-700 mb-2">
                分析対象データまたは質問を入力してください
              </label>
              <textarea
                id="analysis-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="例：今月の売上データを分析してください。売上は前月比15%増加、新規顧客が30%増加しています..."
                rows={6}
                disabled={isProcessing}
                maxLength={5000}
                className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
              />
              <div className="mt-2 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  {input.length}/5000文字
                </div>
                {Boolean(report ?? error) && (
                  <button
                    type="button"
                    onClick={clear}
                    className="text-sm text-gray-600 hover:text-gray-800 underline"
                  >
                    クリア
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={isProcessing || !input.trim()}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    分析処理中...
                  </>
                ) : (
                  <>
                    <FileText className="h-5 w-5" />
                    分析実行
                  </>
                )}
              </button>
            </div>
          </form>

          {/* エラー表示 */}
          {Boolean(error) && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <div className="text-red-600 font-medium">分析エラーが発生しました</div>
              </div>
              <div className="mt-2 text-red-700">{error}</div>
            </div>
          )}

          {/* 分析結果表示 */}
          {Boolean(report) && (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-600" />
                  分析レポート
                </h2>
                <div className="mt-1 text-sm text-gray-500 flex gap-4">
                  <span>処理時間: {report?.processingTimeMs}ms</span>
                  <span>処理モード: {report?.processingMode}</span>
                  {Boolean(report?.timestamp) && (
                    <span>生成日時: {new Date(report!.timestamp).toLocaleString('ja-JP')}</span>
                  )}
                </div>
              </div>
              <div className="p-6">
                <div className="prose max-w-none">
                  <div 
                    className="whitespace-pre-wrap text-gray-800 leading-relaxed"
                    dangerouslySetInnerHTML={{ 
                      __html: report?.result.replace(/\n/g, '<br>').replace(/##/g, '<h2>').replace(/###/g, '<h3>') ?? '' 
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 初期状態の説明 */}
          {!report && !error && !isProcessing && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <BarChart3 className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">AI分析エンジン</h3>
              <p className="text-gray-500 mb-4">
                データや状況を入力すると、AIが詳細な分析レポートを生成します
              </p>
              <div className="text-sm text-gray-400">
                <p>• データ分析・トレンド分析</p>
                <p>• 問題点の抽出と改善提案</p>
                <p>• 構造化されたレポート出力</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}