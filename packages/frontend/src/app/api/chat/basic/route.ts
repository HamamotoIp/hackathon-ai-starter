import { NextRequest } from 'next/server';
import { generateText } from '@/server/lib/vertexAI';
import { 
  parseRequestBody, 
  validateCommonInput, 
  createSuccessResponse, 
  createErrorResponse,
  getOrCreateSessionId
} from '@/server/lib/apiHelpers';
import type { BaseAPIRequest, BasicChatAPIResponse } from '@/core/types';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await parseRequestBody<BaseAPIRequest>(request);
    validateCommonInput(body);

    // Vertex AIで直接処理
    const result = await generateText(body.message);
    const processingTime = Date.now() - startTime;

    const response: BasicChatAPIResponse = {
      success: true,
      message: result,
      processingMode: 'vertex_direct',
      processingTimeMs: processingTime,
      sessionId: getOrCreateSessionId(body),
      timestamp: new Date().toISOString()
    };
    
    return createSuccessResponse(response);
    
  } catch (error) {
    const message = error instanceof Error ? error.message : 'チャット処理中にエラーが発生しました';
    return createErrorResponse(message, 500);
  }
}