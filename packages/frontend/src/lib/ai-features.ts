/**
 * AI機能の型定義 - 共通リソース
 * サーバー・クライアント両方で使用される型定義
 */

// AI機能タイプ
export type AIFeatureType = 
  | 'basic_chat'
  | 'analysis_report'
  | 'ui_generation';

// 処理モード
export type ProcessingMode = 
  | 'vertex_direct'    // Vertex AI直接呼び出し（高速・低コスト）
  | 'adk_agent';       // ADK Agent Engine（高品質・専門処理）

// コストティア
export type CostTier = 'low' | 'medium' | 'high';

// デバイスタイプ（UI生成用）
export type DeviceType = 'desktop' | 'tablet' | 'mobile' | 'auto';

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

// UI生成オプション
export interface UIGenerationOptions {
  deviceType?: DeviceType;
}

// UI生成結果
export interface UIGenerationResult {
  html: string;
  metadata?: {
    deviceType: DeviceType;
    responsive: boolean;
  };
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