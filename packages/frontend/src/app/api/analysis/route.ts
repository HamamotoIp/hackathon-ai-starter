import { NextRequest } from "next/server";
import { processAnalysis } from "@/lib/adk-agent";
import { 
  parseRequestBody, 
  createSuccessResponse, 
  createErrorResponse,
  getOrCreateSessionId
} from '@/lib/apiHelpers';
import type { BaseAIRequest } from '@/lib/ai-features';
import type { AnalysisAPIResponse } from '@/lib/api';

export const runtime = "nodejs";

/**
 * 分析レポート API
 * ADK Agentを使用
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await parseRequestBody<BaseAIRequest>(req);

    // ADK Agentで直接処理
    const serviceUrl = process.env.ANALYSIS_AGENT_URL;
    if (!serviceUrl) {
      throw new Error('ANALYSIS_AGENT_URL環境変数が設定されていません');
    }

    const result = await processAnalysis(serviceUrl, body.message);
    const processingTime = Date.now() - startTime;

    // ADKレスポンスをそのまま使用（解析は既にadk-agent.ts内で実行済み）
    const finalResult = result;

    const response: AnalysisAPIResponse = {
      success: true,
      result: finalResult,
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