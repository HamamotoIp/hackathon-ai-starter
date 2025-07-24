import { NextRequest } from "next/server";
import { getAIProcessor } from "@/server/lib/aiProcessor";
import { UIGenerationRequest } from "@/core/types/aiTypes";
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
  try {
    const body = await parseRequestBody(req);
    validateCommonInput(body);

    // UI生成機能リクエスト
    const featureRequest: UIGenerationRequest = {
      feature: "ui_generation",
      input: body.message,
      options: {
        uiType: body.options?.uiType ?? "auto",
        framework: body.options?.framework ?? "html",
        responsive: body.options?.responsive !== false,
        colorScheme: body.options?.colorScheme ?? "light"
      },
      sessionId: getOrCreateSessionId(body)
    };

    // AI処理実行
    const aiProcessor = getAIProcessor();
    const response = await aiProcessor.processFeature(featureRequest);

    // 開発環境でのデバッグログ
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('UI Generation Response:', JSON.stringify(response, null, 2));
    }

    return createSuccessResponse(response);

  } catch (error) {
    const message = error instanceof Error ? error.message : "内部エラーが発生しました";
    return createErrorResponse(message, 500);
  }
}