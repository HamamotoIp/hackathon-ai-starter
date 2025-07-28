import { NextRequest } from "next/server";
import { processRestaurantSearch } from "@/lib/adk-agent";
import { 
  parseRequestBody, 
  createSuccessResponse, 
  createErrorResponse,
  getOrCreateSessionId
} from '@/lib/apiHelpers';
import type { BaseAIRequest } from '@/lib/ai-features';

export const runtime = "nodejs";

/**
 * 飲食店検索デバッグ API
 * レスポンス構造を確認するため
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await parseRequestBody<BaseAIRequest>(req);

    // ADK Agentで直接処理
    const serviceUrl = process.env.RESTAURANT_SEARCH_AGENT_URL;
    if (!serviceUrl) {
      throw new Error('RESTAURANT_SEARCH_AGENT_URL環境変数が設定されていません。');
    }

    const result = await processRestaurantSearch(serviceUrl, body.message);

    const processingTime = Date.now() - startTime;

    const response = {
      success: true,
      result,
      processingMode: "adk_agent",
      processingTimeMs: processingTime,
      sessionId: getOrCreateSessionId(body),
      timestamp: new Date().toISOString(),
      debug: {
        resultType: typeof result,
        resultLength: result.length,
        hasHtml: result.includes('<!DOCTYPE html>'),
        resultPreview: result.substring(0, 500)
      }
    };
    
    return createSuccessResponse(response);

  } catch (error) {
    const message = error instanceof Error ? error.message : "内部エラーが発生しました";
    return createErrorResponse(message, 500);
  }
}