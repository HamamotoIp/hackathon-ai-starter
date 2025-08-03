import { NextRequest } from "next/server";
import { processUIGeneration } from "@/lib/adk-agent";
import { 
  parseRequestBody, 
  createSuccessResponse, 
  createErrorResponse,
  getOrCreateSessionId
} from '@/lib/apiHelpers';
import type { UIGenerationResult, DeviceType } from '@/lib/ai-features';
import type { UIGenerationAPIRequest, UIGenerationAPIResponse } from '@/lib/api';

export const runtime = "nodejs";

/**
 * UI生成 API
 * ADK Agentを使用してHTML/Reactコンポーネントを動的生成
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await parseRequestBody<UIGenerationAPIRequest>(req);

    // ADK Agentで直接処理（UI生成モード）
    const serviceUrl = process.env.UI_GENERATION_AGENT_URL;
    if (!serviceUrl) {
      throw new Error('UI_GENERATION_AGENT_URL環境変数が設定されていません');
    }

    const result = await processUIGeneration(serviceUrl, body.message, body.options);
    const processingTime = Date.now() - startTime;

    // ADKエージェントから既に処理されたHTMLを取得
    const html = result;
    const metadata: { deviceType: DeviceType; responsive: boolean } = {
      deviceType: (body.options?.deviceType as DeviceType) ?? "auto",
      responsive: true
    };

    const uiResult: UIGenerationResult = {
      html,
      metadata
    };

    const response: UIGenerationAPIResponse = {
      success: true,
      result: uiResult,
      processingMode: "adk_agent",
      processingTimeMs: processingTime,
      sessionId: getOrCreateSessionId(body),
      timestamp: new Date().toISOString()
    };
    
    return createSuccessResponse(response);

  } catch (error) {
    const message = error instanceof Error ? error.message : "内部エラーが発生しました";
    return createErrorResponse(message, 500);
  }
}