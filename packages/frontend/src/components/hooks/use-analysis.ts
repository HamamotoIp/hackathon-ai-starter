/**
 * 分析レポート機能専用Hook
 * ADK Agentによる詳細分析と構造化出力
 */
'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type { AnalysisAPIResponse } from '@/lib/api';

interface UseAnalysisReturn {
  input: string;
  setInput: (input: string) => void;
  report: AnalysisAPIResponse | null;
  isProcessing: boolean;
  error: string | null;
  analyze: () => Promise<void>;
  clear: () => void;
}

/**
 * 分析レポート機能Hook
 */
export function useAnalysis(): UseAnalysisReturn {
  const [input, setInput] = useState('');
  const [report, setReport] = useState<AnalysisAPIResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async () => {
    if (!input.trim() || isProcessing) return;

    setIsProcessing(true);
    setError(null);
    setReport(null);

    try {
      const result = await apiClient.analysis({
        message: input.trim()
      });
      
      setReport(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '分析に失敗しました';
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [input, isProcessing]);

  const clear = useCallback(() => {
    setInput('');
    setReport(null);
    setError(null);
  }, []);

  return {
    input,
    setInput,
    report,
    isProcessing,
    error,
    analyze,
    clear
  };
}