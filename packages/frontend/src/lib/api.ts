/**
 * API型定義 - 統合版（エスケープ問題解決対応）
 * フロントエンド・バックエンド間のインターフェース
 * 
 * 更新履歴：
 * - ADKSSEEventDataを拡張してRestaurant Search Agentの複数レスポンス形式に対応
 * - HTMLOutputスキーマ（structured_html, final_html）フィールドを追加
 * - エスケープ問題解決のための1行形式HTML対応
 * - シンプル化されたエスケープ除去処理に対応した型定義
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

/** 飲食店検索APIレスポンス（エスケープ問題解決版）
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
export type RestaurantSearchAPIResponse = 
  | (BaseAIResponse & { 
      result: string; 
      error?: never;
      workflowComplete?: boolean;
      finalAgent?: string;
    }) // 成功時
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

/** ADK SSEイベントデータ（エスケープ問題解決対応）
 * 
 * Restaurant Search Agentの6段階処理に対応：
 * - 各エージェントのレスポンスを適切に解析
 * - HTMLOutputスキーマ（structured_html, final_html）に対応
 * - 1行形式HTML出力に対応
 * - シンプル化されたエスケープ除去処理に対応
 */
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
  html?: string;  // レストラン検索レスポンス用
  author?: string;
  invocation_id?: string;
  id?: string;
  timestamp?: number;
  actions?: {
    state_delta?: {
      html?: string;
      structured_html?: unknown;  // Pydanticスキーマレスポンス
      final_html?: unknown;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  // HTMLOutputスキーマレスポンス用
  structured_html?: {
    html?: string;
  };
  final_html?: {
    html?: string;
  };
}

/** レストラン検索専用のレスポンス形式 */
export interface RestaurantSearchResponse {
  html?: string;
  metadata?: {
    deviceType?: string;
    responsive?: boolean;
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