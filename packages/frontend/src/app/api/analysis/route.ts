import { NextRequest } from "next/server";
import { processAnalysis } from "@/server/lib/adkAgent";
import { 
  parseRequestBody, 
  validateCommonInput, 
  createSuccessResponse, 
  createErrorResponse,
  getOrCreateSessionId
} from '@/server/lib/apiHelpers';

export const runtime = "nodejs";

/**
 * 分析レポート API
 * ADK Agentを使用
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await parseRequestBody(req);
    validateCommonInput(body);

    // ADK Agentで直接処理
    const serviceUrl = process.env.ANALYSIS_AGENT_URL;
    if (!serviceUrl) {
      throw new Error('ANALYSIS_AGENT_URL環境変数が設定されていません');
    }

    const result = await processAnalysis(serviceUrl, body.message);
    const processingTime = Date.now() - startTime;

    return createSuccessResponse({
      success: true,
      result,
      processingMode: "adk_agent",
      processingTimeMs: processingTime,
      sessionId: getOrCreateSessionId(body),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : "内部エラーが発生しました";
    return createErrorResponse(message, 500);
  }
}