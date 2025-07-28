/**
 * API型定義 - 統合版
 * フロントエンド・バックエンド間のインターフェース
 */

import { 
  BaseAIRequest, 
  BaseAIResponse, 
  UIGenerationOptions, 
  UIGenerationResult, 
  AIErrorResponse
} from './ai-features';

// =============================================================================
// 具体的なAPIリクエスト・レスポンス型
// =============================================================================

/** 基本チャットAPIレスポンス */
export interface BasicChatAPIResponse {
  message: string;
  processingTimeMs: number;
  sessionId?: string;
}

/** 分析APIレスポンス */
export interface AnalysisAPIResponse extends BaseAIResponse {
  result: string;
}

/** UI生成APIリクエスト */
export interface UIGenerationAPIRequest extends BaseAIRequest {
  options?: UIGenerationOptions;
}

/** UI生成APIレスポンス */
export interface UIGenerationAPIResponse extends BaseAIResponse {
  result: UIGenerationResult;
}

/** 飲食店検索APIレスポンス */
export type RestaurantSearchAPIResponse = 
  | (BaseAIResponse & { result: string; error?: never; }) // 成功時
  | (AIErrorResponse & { result?: never; }); // エラー時

// =============================================================================
// ADK Agent専用型（サーバーサイドで使用）
// =============================================================================

/** ADKセッション作成リクエスト */
export interface ADKCreateSessionRequest {
  class_method: 'create_session';
  input: {
    user_id: string;
  };
}

/** ADKセッション情報 */
export interface ADKSessionInfo {
  id: string;
  userId: string;
  state: Record<string, unknown>;
  appName: string;
  events: unknown[];
}

/** ADKセッション作成レスポンス */
export interface ADKCreateSessionResponse {
  output: ADKSessionInfo;
}

/** ADKクエリ実行リクエスト */
export interface ADKStreamQueryRequest {
  class_method: 'stream_query';
  input: {
    message: string;
    session_id: string;
    user_id: string;
  };
}

/** ADK SSEイベントデータ */
export interface ADKSSEEventData {
  message?: string;
  response?: string;
  content?: string | {
    parts?: Array<{
      text?: string;
    }>;
  };
  text?: string;
  output?: string;
  actions?: {
    state_delta?: {
      html?: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
}

// =============================================================================
// 定数・エンドポイント
// =============================================================================

/** APIエンドポイント */
export const API_ENDPOINTS = {
  BASIC_CHAT: '/api/chat/basic',
  ANALYSIS: '/api/analysis',
  UI_GENERATION: '/api/ui-generation',
  RESTAURANT_SEARCH: '/api/restaurant-search',
  DEBUG: '/api/debug',
  IMAGE_UPLOAD: '/api/images/upload'
} as const;

export type APIEndpoint = typeof API_ENDPOINTS[keyof typeof API_ENDPOINTS];

// =============================================================================
// 型ガード関数
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

/** UI生成レスポンスかチェック */
export function isUIGenerationResponse(response: unknown): response is UIGenerationAPIResponse {
  return isSuccessResponse(response) && 
         'result' in response && 
         typeof (response as { result: unknown }).result === 'object' &&
         'html' in (response as { result: { html?: unknown } }).result;
}