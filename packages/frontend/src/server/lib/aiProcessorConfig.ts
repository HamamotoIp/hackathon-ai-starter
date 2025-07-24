/**
 * AIProcessor設定
 * 機能別の処理設定を集約
 */

import { AIFeatureType } from '@/core/types/aiTypes';

export interface FeatureProcessingConfig {
  timeout: number;
  serviceUrlEnvKey: string;
  requiresStructuredMessage?: boolean;
}

/**
 * 機能別処理設定
 */
export const FEATURE_PROCESSING_CONFIGS: Record<AIFeatureType, FeatureProcessingConfig> = {
  basic_chat: {
    timeout: 15000,
    serviceUrlEnvKey: '', // Vertex AI直接なので環境変数不要
  },
  analysis_report: {
    timeout: 30000,
    serviceUrlEnvKey: 'ANALYSIS_AGENT_URL',
  },
  ui_generation: {
    timeout: 25000,
    serviceUrlEnvKey: 'UI_GENERATION_AGENT_URL',
    requiresStructuredMessage: true,
  },
};

/**
 * 機能の処理設定を取得
 */
export function getProcessingConfig(feature: AIFeatureType): FeatureProcessingConfig {
  return FEATURE_PROCESSING_CONFIGS[feature];
}

/**
 * ADKサービスURLを取得
 */
export function getADKServiceUrl(feature: AIFeatureType): string | null {
  const config = getProcessingConfig(feature);
  if (!config.serviceUrlEnvKey) return null;
  
  return process.env[config.serviceUrlEnvKey] ?? null;
}