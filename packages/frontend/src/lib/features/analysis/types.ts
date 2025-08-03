/**
 * 分析機能の型定義
 */

import type { BaseAIResponse } from '@/lib/types/api-common';

/** 分析APIレスポンス */
export interface AnalysisAPIResponse extends BaseAIResponse {
  result: string;
}