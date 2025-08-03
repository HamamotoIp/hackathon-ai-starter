/**
 * 観光スポット検索機能の型定義
 */

import type { BaseAIResponse, AIErrorResponse } from '@/lib/types/api-common';

/** 観光スポット検索APIレスポンス（エスケープ問題解決版）
 * 
 * 6段階処理により確実に1行形式の純粋なHTMLが返される：
 * - result: HTMLExtractorAgentによって抽出された1行形式の純粋なHTML
 * - workflowComplete: 6段階すべての処理が完了したかどうか  
 * - finalAgent: 最終処理を行ったエージェント名（通常は'HTMLExtractorAgent'）
 * 
 * エスケープ問題解決の特徴：
 * - エージェント側で1行形式HTML出力を強制
 * - フロントエンド側でシンプル化されたエスケープ除去処理
 * - 結果として綺麗にレンダリングされるHTML
 */
export type TourismSpotsSearchAPIResponse = 
  | (BaseAIResponse & { 
      result: string; 
      error?: never;
      workflowComplete?: boolean;
      finalAgent?: string;
    }) // 成功時
  | (AIErrorResponse & { result?: never; }); // エラー時

/** 観光スポット検索専用のレスポンス形式 */
export interface TourismSpotsSearchResponse {
  html?: string;
  metadata?: {
    deviceType?: string;
    responsive?: boolean;
  };
}

// =============================================================================
// Cloud Storage + Firestore保存結果の型定義（saved-result.tsから移動）
// =============================================================================

export interface SavedTourismSpotsResult {
  id: string;
  query: string;
  searchParams: {
    area?: string;
    category?: string;
    season?: string;
    requests?: string[];
  };
  htmlStorageUrl: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  isPublic: boolean;
  metadata: {
    processingTimeMs: number;
    agentVersion: string;
  };
}

export interface SaveResultRequest {
  htmlContent: string;
  query: string;
  searchParams?: Record<string, string | string[]>;
  title?: string;
  processingTimeMs?: number;
}

export interface SaveResultResponse {
  success: boolean;
  resultId: string;
  url: string;
  htmlUrl: string;
  title: string;
}

export interface HistoryResponse {
  success: boolean;
  results: SavedTourismSpotsResult[];
  totalCount: number;
  availableTags: string[];
}