/**
 * FeatureCard - クライアントサイドコンポーネント
 * AI機能テスト用のインタラクティブカード
 */
'use client';

import { useState } from 'react';
import type { AIProcessingStatus } from '@/lib/ai-features';
import type { AnalysisAPIResponse } from '@/lib/api';
import { apiClient } from '@/lib/api-client';

interface FeatureCardConfig {
  type: 'analysis_report';
  name: string;
  description: string;
  placeholder: string;
  maxInputLength: number;
}

interface FeatureCardProps {
  config: FeatureCardConfig;
}

type APIResponseType = AnalysisAPIResponse | { error: string };

export default function FeatureCard({ config }: FeatureCardProps) {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState<APIResponseType | null>(null);
  const [status, setStatus] = useState<AIProcessingStatus>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || status === 'processing') return;

    setStatus('processing');
    setResponse(null);

    try {
      const result = await apiClient.analysis({ message: input });
      setResponse(result);
      setStatus('completed');
    } catch (error) {
      setResponse({ 
        error: error instanceof Error ? error.message : 'エラーが発生しました' 
      });
      setStatus('error');
    }
  };

  const getProcessingModeText = () => {
    return 'ADK Agent';
  };

  const renderResponse = () => {
    if (!response) return null;

    if ('error' in response) {
      return (
        <div className="text-red-600 bg-red-50 p-3 rounded">
          エラー: {response.error}
        </div>
      );
    }


    // 通常のテキストレスポンス
    return (
      <div className="space-y-3">
        <div className="whitespace-pre-wrap bg-gray-50 p-3 rounded">
          {'result' in response ? 
            (typeof response.result === 'string' ? response.result : JSON.stringify(response.result, null, 2))
            : 'No result'
          }
        </div>
        <div className="text-xs text-gray-500">
          {getProcessingModeText()} - {'processingTimeMs' in response ? response.processingTimeMs : 0}ms
        </div>
      </div>
    );
  };

  const getStatusColor = () => {
    switch (status) {
      case 'processing': return 'border-blue-300 bg-blue-50';
      case 'completed': return 'border-green-300 bg-green-50';
      case 'error': return 'border-red-300 bg-red-50';
      default: return 'border-gray-300 bg-white';
    }
  };

  return (
    <div className={`border rounded-lg p-6 transition-colors ${getStatusColor()}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">{config.name}</h3>
        <span className="px-2 py-1 text-xs bg-gray-200 rounded">
          {getProcessingModeText()}
        </span>
      </div>

      <p className="text-gray-600 mb-4">{config.description}</p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={config.placeholder}
          className="w-full p-3 border rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
          maxLength={config.maxInputLength}
          disabled={status === 'processing'}
        />

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">
            {input.length}/{config.maxInputLength}文字
          </span>
          
          <button
            type="submit"
            disabled={status === 'processing' || !input.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {status === 'processing' ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                処理中...
              </div>
            ) : (
              'テスト実行'
            )}
          </button>
        </div>
      </form>

{response ? (
        <div className="mt-6 pt-4 border-t border-gray-200">
          {renderResponse()}
        </div>
      ) : null}
    </div>
  );
}

export { FeatureCard };