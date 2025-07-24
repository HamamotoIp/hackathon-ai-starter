import { NextRequest } from "next/server";
import { getAIProcessor } from "@/server/lib/aiProcessor";
import { AnalysisReportRequest } from "@/core/types/aiTypes";
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
  try {
    const body = await parseRequestBody(req);
    validateCommonInput(body);

    // 分析レポート機能リクエスト
    const featureRequest: AnalysisReportRequest = {
      feature: "analysis_report",
      input: body.message,
      sessionId: getOrCreateSessionId(body)
    };

    // AI処理実行
    const aiProcessor = getAIProcessor();
    const response = await aiProcessor.processFeature(featureRequest);

    return createSuccessResponse(response);

  } catch (error) {
    const message = error instanceof Error ? error.message : "内部エラーが発生しました";
    return createErrorResponse(message, 500);
  }
}