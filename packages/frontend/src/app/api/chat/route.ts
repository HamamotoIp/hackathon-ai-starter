import { NextRequest } from 'next/server';
import { createVertexAIProvider } from '@/lib/vertex-ai';
import { 
  parseRequestBody, 
  createSuccessResponse, 
  createErrorResponse,
  getOrCreateSessionId
} from '@/lib/apiHelpers';
import type { BaseAIRequest } from '@/lib/ai-features';
import type { BasicChatAPIResponse } from '@/lib/api';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await parseRequestBody<BaseAIRequest>(request);

    // Vertex AIで直接処理
    const provider = createVertexAIProvider();
    const result = await provider.generateText(body.message);
    const processingTime = Date.now() - startTime;

    const response: BasicChatAPIResponse = {
      message: result,
      processingTimeMs: processingTime,
      sessionId: getOrCreateSessionId(body)
    };
    
    return createSuccessResponse(response);
    
  } catch (error) {
    const message = error instanceof Error ? error.message : 'チャット処理中にエラーが発生しました';
    return createErrorResponse(message, 500);
  }
}