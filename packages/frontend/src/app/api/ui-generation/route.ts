import { NextRequest } from "next/server";
import { processUIGeneration } from "@/server/lib/adkAgent";
import { 
  parseRequestBody, 
  validateCommonInput, 
  createSuccessResponse, 
  createErrorResponse,
  getOrCreateSessionId
} from '@/server/lib/apiHelpers';

export const runtime = "nodejs";

/**
 * UI生成 API
 * ADK Agentを使用してHTML/Reactコンポーネントを動的生成
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await parseRequestBody(req);
    validateCommonInput(body);

    // ADK Agentで直接処理（UI生成モード）
    const serviceUrl = process.env.UI_GENERATION_AGENT_URL;
    if (!serviceUrl) {
      throw new Error('UI_GENERATION_AGENT_URL環境変数が設定されていません');
    }

    const result = await processUIGeneration(serviceUrl, body.message);
    const processingTime = Date.now() - startTime;

    // UI生成結果の解析
    let uiResult;
    try {
      const parsedResult = JSON.parse(result);
      uiResult = {
        html: parsedResult.html ?? result,
        metadata: {
          uiType: body.options?.uiType ?? "auto",
          framework: body.options?.framework ?? "html",
          components: [],
          responsive: body.options?.responsive !== false,
          accessibility: true,
          javascript_required: false
        }
      };
    } catch {
      // JSON解析失敗時は生のHTMLとして扱う
      uiResult = {
        html: result,
        metadata: {
          uiType: "auto",
          framework: "html",
          components: [],
          responsive: true,
          accessibility: true,
          javascript_required: false
        }
      };
    }

    return createSuccessResponse({
      success: true,
      result: uiResult,
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