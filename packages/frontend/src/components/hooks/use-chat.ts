/**
 * チャット機能専用Hook
 * Vertex AI Directによる高速レスポンス
 */
'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/core/api/client';
import type { BasicChatAPIResponse } from '@/lib/features/chat/types';

interface UseChatReturn {
  message: string;
  setMessage: (message: string) => void;
  response: BasicChatAPIResponse | null;
  isLoading: boolean;
  error: string | null;
  sendMessage: () => Promise<void>;
  clear: () => void;
}

/**
 * チャット機能Hook
 */
export function useChat(): UseChatReturn {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState<BasicChatAPIResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async () => {
    if (!message.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const result = await apiClient.basicChat({
        message: message.trim()
      });
      
      setResponse(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '送信に失敗しました';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [message, isLoading]);

  const clear = useCallback(() => {
    setMessage('');
    setResponse(null);
    setError(null);
  }, []);

  return {
    message,
    setMessage,
    response,
    isLoading,
    error,
    sendMessage,
    clear
  };
}