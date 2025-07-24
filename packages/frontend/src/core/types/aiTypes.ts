/**
 * AI機能の型定義
 * 🔴 人間が管理：機能設計とAI使い分け
 */

// =============================================================================
// 基本機能タイプ
// =============================================================================

/** AI機能の種類 */
export type AIFeatureType = 
  | "basic_chat"
  | "analysis_report"
  | "ui_generation";

/** AI処理方式 */
export type AIProcessingMode = "vertex_direct" | "adk_agent";

// =============================================================================
// 機能設定
// =============================================================================

/** 機能設定インターface */
export interface AIFeatureConfig {
  type: AIFeatureType;
  name: string;
  description: string;
  processingMode: AIProcessingMode;
  maxInputLength: number;
  expectedProcessingTime: number; // 秒
  // ADK用の追加設定
  adkEndpoint?: string; // ADK専用エンドポイント
}

/** 機能設定マップ */
export const AI_FEATURE_CONFIGS: Record<AIFeatureType, AIFeatureConfig> = {
  // Vertex AI直接呼び出し
  basic_chat: {
    type: "basic_chat",
    name: "シンプルチャット",
    description: "軽量で高速なチャット機能",
    processingMode: "vertex_direct",
    maxInputLength: 1000,
    expectedProcessingTime: 3
  },
  
  // 機能別専用Agent Engine設計
  analysis_report: {
    type: "analysis_report",
    name: "分析レポート",
    description: "詳細な分析とレポート作成",
    processingMode: "adk_agent",
    maxInputLength: 5000,
    expectedProcessingTime: 30,
    adkEndpoint: "analysis"  // 専用Agent Engine
  },
  
  ui_generation: {
    type: "ui_generation",
    name: "UI生成",
    description: "生HTML（Tailwind CSS）コンポーネントの動的生成",
    processingMode: "adk_agent",
    maxInputLength: 3000,
    expectedProcessingTime: 25,
    adkEndpoint: "ui-generation"  // 専用Agent Engine
  }
};

// =============================================================================
// リクエスト・レスポンス型
// =============================================================================

/** 基本リクエストインターフェース */
interface BaseAIRequest {
  sessionId?: string;
}

/** シンプルチャットリクエスト */
export interface BasicChatRequest extends BaseAIRequest {
  feature: "basic_chat";
  input: string;
}

/** 分析レポートリクエスト */
export interface AnalysisReportRequest extends BaseAIRequest {
  feature: "analysis_report";
  input: string;
}

/** UI生成オプション */
export interface UIGenerationOptions {
  uiType?: "form" | "card" | "dashboard" | "landing" | "navigation" | "auto";
  framework?: "html" | "react";
  responsive?: boolean;
  colorScheme?: "light" | "dark" | "auto";
}

/** UI生成リクエスト */
export interface UIGenerationRequest extends BaseAIRequest {
  feature: "ui_generation";
  input: string;
  options: UIGenerationOptions;
}

/** 統合AI機能リクエスト型 */
export type AIFeatureRequest = 
  | BasicChatRequest
  | AnalysisReportRequest
  | UIGenerationRequest;

/** UI生成専用レスポンス */
export interface UIGenerationResult {
  html: string;
  metadata?: {
    uiType: string;
    framework: string;
    components: string[];
    responsive: boolean;
    accessibility: boolean;
    javascript_required: boolean;
  };
}

/** 基本レスポンスインターフェース */
interface BaseAIResponse {
  success: boolean;
  processingMode: AIProcessingMode;
  processingTimeMs: number;
  timestamp: string;
  sessionId?: string;
}

/** シンプルチャットレスポンス */
export interface BasicChatResponse extends BaseAIResponse {
  feature: "basic_chat";
  result: string;
}

/** 分析レポートレスポンス */
export interface AnalysisReportResponse extends BaseAIResponse {
  feature: "analysis_report";
  result: string;
  metadata?: {
    analysisPoints?: string[];
    recommendations?: string[];
  };
}

/** UI生成レスポンス */
export interface UIGenerationResponse extends BaseAIResponse {
  feature: "ui_generation";
  result: UIGenerationResult;
}

/** 統合AI機能レスポンス型 */
export type AIFeatureResponse = 
  | BasicChatResponse
  | AnalysisReportResponse
  | UIGenerationResponse;

// =============================================================================
// ユーティリティ関数
// =============================================================================

/** 機能設定を取得 */
export function getFeatureConfig(feature: AIFeatureType): AIFeatureConfig {
  return AI_FEATURE_CONFIGS[feature];
}

/** 処理方式を取得 */
export function getProcessingMode(feature: AIFeatureType): AIProcessingMode {
  return AI_FEATURE_CONFIGS[feature].processingMode;
}

/** シンプルな機能かチェック */
export function isSimpleFeature(feature: AIFeatureType): boolean {
  return getProcessingMode(feature) === "vertex_direct";
}

/** 知的な機能かチェック */
export function isIntelligentFeature(feature: AIFeatureType): boolean {
  return getProcessingMode(feature) === "adk_agent";
}


// =============================================================================
// 型ガード関数
// =============================================================================

/** UI生成結果かチェック */
export function isUIGenerationResult(result: unknown): result is UIGenerationResult {
  return typeof result === 'object' && result !== null && 'html' in result;
}

/** UI生成機能かチェック */
export function isUIGenerationFeature(feature: AIFeatureType): feature is "ui_generation" {
  return feature === "ui_generation";
}


/** UI生成レスポンスかチェック */
export function isUIGenerationResponse(response: AIFeatureResponse): response is UIGenerationResponse {
  return response.feature === "ui_generation";
}