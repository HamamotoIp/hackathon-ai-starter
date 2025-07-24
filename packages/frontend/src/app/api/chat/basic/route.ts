import { NextRequest } from 'next/server';
import { generateText } from '@/server/lib/vertexAI';
import { 
  parseRequestBody, 
  validateCommonInput, 
  createSuccessResponse, 
  createErrorResponse,
  getOrCreateSessionId
} from '@/server/lib/apiHelpers';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await parseRequestBody(request);
    validateCommonInput(body);

    // Vertex AIで直接処理
    const result = await generateText(body.message as string);
    const processingTime = Date.now() - startTime;

    return createSuccessResponse({
      message: result,
      processingTimeMs: processingTime,
      sessionId: getOrCreateSessionId(body),
    });
    
  } catch (error) {
    const message = error instanceof Error ? error.message : 'チャット処理中にエラーが発生しました';
    return createErrorResponse(message, 500);
  }
}