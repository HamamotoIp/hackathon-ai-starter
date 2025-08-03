/**
 * API共通型定義
 * サーバー・クライアント両方で使用される基本的な型
 */

// =============================================================================
// 基本型定義（ai-features.tsから移動）
// =============================================================================

// AI機能タイプ
export type AIFeatureType = 
  | 'basic_chat'
  | 'analysis_report';

// 処理モード
export type ProcessingMode = 
  | 'vertex_direct'    // Vertex AI直接呼び出し（高速・低コスト）
  | 'adk_agent'        // ADK Agent Engine（高品質・専門処理）
  | 'local_fallback';  // ローカルフォールバック（開発時）

// コストティア
export type CostTier = 'low' | 'medium' | 'high';

// 基本リクエスト
export interface BaseAIRequest {
  message: string;
  sessionId?: string;
}

// 基本レスポンス
export interface BaseAIResponse {
  success: boolean;
  processingMode?: ProcessingMode;
  processingTimeMs: number;
  timestamp: string;
  sessionId?: string;
}

// エラーレスポンス
export interface AIErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

// 処理状況
export type AIProcessingStatus = 'idle' | 'processing' | 'completed' | 'error';

// =============================================================================
// 定数・エンドポイント（api.tsから移動）
// =============================================================================

/** APIエンドポイント */
export const API_ENDPOINTS = {
  BASIC_CHAT: '/api/chat/basic',
  ANALYSIS: '/api/analysis',
  TOURISM_SPOTS: '/api/tourism-spots',
  DEBUG: '/api/debug',
  IMAGE_UPLOAD: '/api/images/upload'
} as const;

export type APIEndpoint = typeof API_ENDPOINTS[keyof typeof API_ENDPOINTS];

// =============================================================================
// 型ガード関数（api.tsから移動）
// =============================================================================

/** エラーレスポンスかチェック */
export function isErrorResponse(response: unknown): response is AIErrorResponse {
  return typeof response === 'object' && 
         response !== null && 
         'success' in response && 
         (response as { success: boolean }).success === false;
}

/** 成功レスポンスかチェック */
export function isSuccessResponse(response: unknown): response is BaseAIResponse {
  return typeof response === 'object' && 
         response !== null && 
         'success' in response && 
         (response as { success: boolean }).success === true;
}