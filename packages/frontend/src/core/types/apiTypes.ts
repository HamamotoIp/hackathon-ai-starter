/**
 * API共通型定義
 * フロントエンド・バックエンド間のインターフェース
 */

// =============================================================================
// 基本型定義
// =============================================================================

/** 処理モード */
export type ProcessingMode = 'vertex_direct' | 'adk_agent';



/** デバイスタイプ */
export type DeviceType = 'desktop' | 'tablet' | 'mobile' | 'auto';

// =============================================================================
// リクエスト型定義
// =============================================================================

/** 基本APIリクエスト */
export interface BaseAPIRequest {
  message: string;
  sessionId?: string;
}

/** UI生成オプション */
export interface UIGenerationOptions {
  deviceType?: DeviceType;
}

/** UI生成APIリクエスト */
export interface UIGenerationAPIRequest extends BaseAPIRequest {
  options?: UIGenerationOptions;
}

// =============================================================================
// レスポンス型定義
// =============================================================================

/** 基本APIレスポンス */
export interface BaseAPIResponse {
  success: boolean;
  processingMode: ProcessingMode;
  processingTimeMs: number;
  sessionId: string;
  timestamp: string;
}

/** エラーAPIレスポンス */
export interface ErrorAPIResponse {
  error: string;
  status?: number;
  details?: unknown;
}

/** シンプルチャットAPIレスポンス */
export interface BasicChatAPIResponse extends BaseAPIResponse {
  message: string;
}

/** 分析APIレスポンス */
export interface AnalysisAPIResponse extends BaseAPIResponse {
  result: string;
}

/** UIメタデータ */
export interface UIMetadata {
  deviceType: DeviceType;
  responsive: boolean;
}

/** UI生成結果 */
export interface UIGenerationResult {
  html: string;
  metadata: UIMetadata;
}

/** UI生成APIレスポンス */
export interface UIGenerationAPIResponse extends BaseAPIResponse {
  result: UIGenerationResult;
}

// =============================================================================
// ADK Agent型定義
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
  content?: string;
  text?: string;
  output?: string;
}

/** ADK構造化レスポンス */
export interface ADKStructuredResponse {
  content?: {
    parts?: Array<{
      text?: string;
    }>;
  };
}

// =============================================================================
// 型ガード関数
// =============================================================================

/** エラーレスポンスかチェック */
export function isErrorResponse(response: unknown): response is ErrorAPIResponse {
  return typeof response === 'object' && response !== null && 'error' in response;
}

/** 成功レスポンスかチェック */
export function isSuccessResponse(response: unknown): response is BaseAPIResponse {
  return typeof response === 'object' && 
         response !== null && 
         'success' in response && 
         (response as any).success === true;
}

/** UI生成レスポンスかチェック */
export function isUIGenerationResponse(response: unknown): response is UIGenerationAPIResponse {
  return isSuccessResponse(response) && 
         'result' in response && 
         typeof (response as any).result === 'object' &&
         'html' in (response as any).result;
}

/** ADKセッションレスポンスかチェック */
export function isADKSessionResponse(response: unknown): response is ADKCreateSessionResponse {
  return typeof response === 'object' && 
         response !== null && 
         'output' in response &&
         typeof (response as any).output === 'object' &&
         'id' in (response as any).output;
}

// =============================================================================
// ユーティリティ型
// =============================================================================

/** APIエンドポイント */
export const API_ENDPOINTS = {
  BASIC_CHAT: '/api/chat/basic',
  ANALYSIS: '/api/analysis',
  UI_GENERATION: '/api/ui-generation',
} as const;

/** APIエンドポイント型 */
export type APIEndpoint = typeof API_ENDPOINTS[keyof typeof API_ENDPOINTS];

/** リクエストヘッダー */
export interface RequestHeaders {
  'Content-Type': 'application/json';
  'Accept'?: 'application/json' | 'text/event-stream';
  'Authorization'?: string;
}