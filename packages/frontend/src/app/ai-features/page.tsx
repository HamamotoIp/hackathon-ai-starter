'use client';

import { useAnalysis } from '@/components/hooks/use-analysis';

export default function AIFeaturesPage() {
  const { input, setInput, report, isProcessing, error, analyze } = useAnalysis();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await analyze();
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">📊 AI機能統合</h1>
      
      {/* 入力フォーム */}
      <div className="bg-white border rounded-lg p-6 mb-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="input" className="block text-sm font-medium mb-2">
              分析対象データまたは質問を入力してください
            </label>
            <textarea
              id="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="例：今月の売上データを分析してください。売上は前月比15%増加..."
              rows={6}
              disabled={isProcessing}
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
            disabled={isProcessing || !input.trim()}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isProcessing ? '分析中...' : '分析実行'}
          </button>
        </form>
      </div>

      {/* 分析結果 */}
      {report ? (
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">分析レポート</h2>
          <div 
            className="prose max-w-none whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ 
              __html: report.result.replace(/\n/g, '<br>') 
            }}
          />
        </div>
      ) : null}
    </div>
  );
}