import { NextRequest } from "next/server";
import { processAnalysis } from "@/server/lib/adkAgent";
import { 
  parseRequestBody, 
  validateCommonInput, 
  createSuccessResponse, 
  createErrorResponse,
  getOrCreateSessionId
} from '@/server/lib/apiHelpers';
import type { BaseAPIRequest, AnalysisAPIResponse, ADKStructuredResponse } from '@/core/types';

export const runtime = "nodejs";

/**
 * 分析レポート API
 * ADK Agentを使用
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await parseRequestBody<BaseAPIRequest>(req);
    validateCommonInput(body);

    // ADK Agentで直接処理
    const serviceUrl = process.env.ANALYSIS_AGENT_URL;
    if (!serviceUrl) {
      throw new Error('ANALYSIS_AGENT_URL環境変数が設定されていません');
    }

    const result = await processAnalysis(serviceUrl, body.message);
    const processingTime = Date.now() - startTime;

    // ADKレスポンスがJSON文字列の場合、パースして実際のテキストを抽出
    let finalResult = result;
    try {
      const parsed = JSON.parse(result) as ADKStructuredResponse;
      if (parsed.content?.parts?.[0]?.text) {
        finalResult = parsed.content.parts[0].text;
      }
    } catch {
      // JSONパースに失敗した場合はそのまま使用
    }

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