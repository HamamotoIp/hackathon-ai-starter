/**
 * Cloud Storage + Firestore を使った飲食店検索結果管理
 */

import type { 
  SavedRestaurantResult, 
  SaveResultRequest, 
  SaveResultResponse, 
  HistoryResponse 
} from './types';

export class CloudRestaurantStorage {
  /**
   * 検索結果を保存
   */
  static async save(request: SaveResultRequest): Promise<SaveResultResponse> {
    const response = await fetch('/api/restaurant-search/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error ?? '保存に失敗しました');
    }

    return response.json();
  }

  /**
   * IDで検索結果を取得
   */
  static async getById(id: string): Promise<SavedRestaurantResult> {
    const response = await fetch(`/api/restaurant-search/saved/${id}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('指定されたIDの結果が見つかりません');
      }
      const error = await response.json();
      throw new Error(error.error ?? '取得に失敗しました');
    }

    const data = await response.json();
    return data.result;
  }

  /**
   * 履歴を取得
   */
  static async getHistory(options?: {
    limit?: number;
    tag?: string;
    search?: string;
  }): Promise<HistoryResponse> {
    const params = new URLSearchParams();
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.tag) params.set('tag', options.tag);
    if (options?.search) params.set('search', options.search);

    const response = await fetch(`/api/restaurant-search/history?${params}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error ?? '履歴の取得に失敗しました');
    }

    return response.json();
  }

  /**
   * タイトルを更新
   */
  static async updateTitle(id: string, title: string): Promise<void> {
    const response = await fetch(`/api/restaurant-search/saved/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error ?? 'タイトルの更新に失敗しました');
    }
  }

  /**
   * 検索結果を削除
   */
  static async delete(id: string): Promise<void> {
    const response = await fetch(`/api/restaurant-search/saved/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error ?? '削除に失敗しました');
    }
  }

  /**
   * HTMLコンテンツをAPIルート経由で取得
   */
  static async getHtmlContent(id: string): Promise<string> {
    const response = await fetch(`/api/restaurant-search/saved/${id}?html=true`);
    
    if (!response.ok) {
      throw new Error('HTMLコンテンツの取得に失敗しました');
    }

    return response.text();
  }
}