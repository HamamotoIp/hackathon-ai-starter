/**
 * 飲食店検索カスタムフック
 */
import { useState } from 'react';
import { API_ENDPOINTS, type RestaurantSearchAPIResponse } from '@/lib/api';
import type { BaseAIRequest } from '@/lib/ai-features';

interface UseRestaurantSearchState {
  isLoading: boolean;
  result: string | null;
  error: string | null;
  processingTimeMs: number | null;
}

export function useRestaurantSearch() {
  const [state, setState] = useState<UseRestaurantSearchState>({
    isLoading: false,
    result: null,
    error: null,
    processingTimeMs: null
  });

  const searchRestaurants = async (message: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const requestBody: BaseAIRequest = {
        message,
        sessionId: `restaurant-search-${Date.now()}`
      };

      const response = await fetch(API_ENDPOINTS.RESTAURANT_SEARCH, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: RestaurantSearchAPIResponse = await response.json();

      if (!data.success) {
        const errorMessage = 'error' in data ? data.error?.message ?? data.error : '飲食店検索に失敗しました';
        throw new Error(typeof errorMessage === 'string' ? errorMessage : '飲食店検索に失敗しました');
      }

      setState({
        isLoading: false,
        result: data.result,
        error: null,
        processingTimeMs: data.processingTimeMs
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '予期しないエラーが発生しました';
      
      setState({
        isLoading: false,
        result: null,
        error: errorMessage,
        processingTimeMs: null
      });
    }
  };

  const reset = () => {
    setState({
      isLoading: false,
      result: null,
      error: null,
      processingTimeMs: null
    });
  };

  return {
    ...state,
    searchRestaurants,
    reset
  };
}