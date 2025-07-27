import { NextRequest } from "next/server";
import { processRestaurantSearch } from "@/lib/adk-agent";
import { 
  parseRequestBody, 
  createSuccessResponse, 
  createErrorResponse,
  getOrCreateSessionId
} from '@/lib/apiHelpers';
import type { BaseAIRequest } from '@/lib/ai-features';
import type { RestaurantSearchAPIResponse } from '@/lib/api';

export const runtime = "nodejs";

/**
 * 飲食店検索 API
 * ADK Agentを使用
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await parseRequestBody<BaseAIRequest>(req);

    // ADK Agentで直接処理
    const serviceUrl = process.env.RESTAURANT_SEARCH_AGENT_URL;
    if (!serviceUrl) {
      throw new Error('RESTAURANT_SEARCH_AGENT_URL環境変数が設定されていません。config.shを使って環境変数を設定してください。');
    }

    const result = await processRestaurantSearch(serviceUrl, body.message);
    const processingTime = Date.now() - startTime;

    const response: RestaurantSearchAPIResponse = {
      success: true,
      result,
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

