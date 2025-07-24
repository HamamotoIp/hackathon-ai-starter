import { NextRequest } from 'next/server';
import { getAIProcessor } from '@/server/lib/aiProcessor';
import { BasicChatRequest } from '@/core/types/aiTypes';
import { 
  parseRequestBody, 
  validateCommonInput, 
  createSuccessResponse, 
  createErrorResponse,
  getOrCreateSessionId
} from '@/server/lib/apiHelpers';

export async function POST(request: NextRequest) {
  try {
    const body = await parseRequestBody(request);
    validateCommonInput(body);

    // AI処理リクエストを構築
    const aiRequest: BasicChatRequest = {
      feature: 'basic_chat',
      input: body.message,
      sessionId: getOrCreateSessionId(body),
    };

    // AI処理を実行
    const aiProcessor = getAIProcessor();
    const response = await aiProcessor.processFeature(aiRequest);

    return createSuccessResponse({
      message: response.result,
      processingTimeMs: response.processingTimeMs,
      sessionId: response.sessionId,
    });
    
  } catch (error) {
    const message = error instanceof Error ? error.message : 'チャット処理中にエラーが発生しました';
    return createErrorResponse(message, 500);
  }
}