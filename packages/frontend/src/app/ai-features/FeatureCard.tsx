'use client';

import { AIFeatureConfig } from '@/core/types/AIFeatures';
import { useState } from 'react';

interface FeatureCardProps {
  config: AIFeatureConfig;
}

export default function FeatureCard({ config }: FeatureCardProps) {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState<{
    error?: string;
    result?: string;
    processingMode?: string;
    processingTimeMs?: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setResponse(null);

    try {
      let apiUrl: string;
      let body: Record<string, unknown>;

      switch (config.type) {
        case 'analysis_report':
          apiUrl = '/api/analysis';
          body = { content: input };
          break;
        case 'ui_generation':
          apiUrl = '/api/ui-generation';
          body = { content: input };
          break;
        default:
          throw new Error(`Unknown feature type: ${config.type}`);
      }

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      setResponse(data);
    } catch {
      setResponse({ error: 'エラーが発生しました' });
    } finally {
      setLoading(false);
    }
  };

  const getProcessingModeText = () => {
    return config.processingMode === 'vertex_direct' ? 'Vertex AI' : 'ADK Agent';
  };

  return (
    <div className="border rounded p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">{config.name}</h3>
        <span className="px-2 py-1 text-xs bg-gray-200 rounded">
          {getProcessingModeText()}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={config.type === 'analysis_report' ? '分析内容を入力...' : 'UI生成要求を入力...'}
          className="w-full p-2 border rounded"
          rows={3}
          maxLength={config.maxInputLength}
        />

        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="w-full p-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          {loading ? '処理中...' : 'テスト実行'}
        </button>
      </form>

      {response ? (
        <div className="mt-4 p-3 bg-gray-50 rounded">
          {response.error ? (
            <div className="text-red-600">エラー: {response.error}</div>
          ) : (
            <div>
              <div className="whitespace-pre-wrap">{response.result}</div>
              <div className="text-xs text-gray-500 mt-2">
                {response.processingMode} - {response.processingTimeMs}ms
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}