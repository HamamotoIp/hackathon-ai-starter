/**
 * UI生成機能専用Hook
 * ADK Agentによるデバイス最適化HTML生成
 */
'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type { UIGenerationAPIResponse } from '@/lib/api';
import type { DeviceType } from '@/lib/ai-features';

interface UseUIGenerationReturn {
  prompt: string;
  setPrompt: (prompt: string) => void;
  html: UIGenerationAPIResponse | null;
  deviceType: DeviceType;
  setDeviceType: (type: DeviceType) => void;
  isGenerating: boolean;
  error: string | null;
  generate: () => Promise<void>;
  clear: () => void;
}

/**
 * UI生成機能Hook
 */
export function useUIGeneration(): UseUIGenerationReturn {
  const [prompt, setPrompt] = useState('');
  const [html, setHtml] = useState<UIGenerationAPIResponse | null>(null);
  const [deviceType, setDeviceType] = useState<DeviceType>('auto');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setHtml(null);

    try {
      const result = await apiClient.uiGeneration({
        message: prompt.trim(),
        options: { deviceType }
      });
      
      setHtml(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'UI生成に失敗しました';
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, deviceType, isGenerating]);

  const clear = useCallback(() => {
    setPrompt('');
    setHtml(null);
    setError(null);
  }, []);

  return {
    prompt,
    setPrompt,
    html,
    deviceType,
    setDeviceType,
    isGenerating,
    error,
    generate,
    clear
  };
}