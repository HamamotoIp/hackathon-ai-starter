/**
 * API Client - クライアントサイド専用
 * 🌐 ブラウザ内でのAPI呼び出し専用クライアント
 */

'use client';

import type { 
  BaseAIRequest
} from '@/lib/types/api-common';
import type { 
  BasicChatAPIResponse
} from '@/lib/features/chat/types';
import type {
  AnalysisAPIResponse
} from '@/lib/features/analysis/types';


/**
 * AI機能APIクライアント
 */
export class AIAPIClient {
  private baseUrl: string;
  
  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }
  
  /**
   * 基本チャット実行
   */
  async basicChat(request: BaseAIRequest): Promise<BasicChatAPIResponse> {
    return this.fetchAPI('/api/chat', request);
  }
  
  /**
   * 分析レポート実行
   */
  async analysis(request: BaseAIRequest): Promise<AnalysisAPIResponse> {
    return this.fetchAPI('/api/analysis', request);
  }
  
  
  /**
   * 汎用API呼び出し
   */
  private async fetchAPI<T>(endpoint: string, request: BaseAIRequest): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...request,
          sessionId: request.sessionId ?? this.generateSessionId()
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success && data.error) {
        throw new Error(data.error);
      }
      
      return data as T;
      
    } catch (error) {
      throw error instanceof Error ? error : new Error('不明なエラーが発生しました');
    }
  }
  
  /**
   * セッションID生成
   */
  private generateSessionId(): string {
    return `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * 接続テスト
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/debug`);
      const data = await response.json();
      return data.status === 'healthy';
    } catch {
      return false;
    }
  }
}

/**
 * シングルトンAPIクライアント
 */
export const apiClient = new AIAPIClient();

/**
 * React Hook用のAPI呼び出し関数
 */
export function createAPIClient(baseUrl?: string): AIAPIClient {
  return new AIAPIClient(baseUrl);
}