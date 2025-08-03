/**
 * チャット機能の型定義
 */

/** 基本チャットAPIレスポンス */
export interface BasicChatAPIResponse {
  message: string;
  processingTimeMs: number;
  sessionId?: string;
}