/**
 * API共通ヘルパー関数
 * 軽量な共通処理でコード重複を削減
 */

import { NextRequest, NextResponse } from 'next/server';
import type { BaseAIRequest, AIErrorResponse } from '@/lib/ai-features';

/**
 * 標準的な成功レスポンスを作成
 */
export function createSuccessResponse<T>(data: T): NextResponse {
  return NextResponse.json(data);
}

/**
 * 標準的なエラーレスポンスを作成
 */
export function createErrorResponse(message: string, status = 500): NextResponse {
  const errorResponse: AIErrorResponse = {
    success: false,
    error: {
      code: 'API_ERROR',
      message
    },
    timestamp: new Date().toISOString()
  };
  return NextResponse.json(errorResponse, { status });
}

/**
 * リクエストボディのJSONパースと基本バリデーション
 */
export async function parseRequestBody<T = BaseAIRequest>(request: NextRequest): Promise<T> {
  try {
    const body = await request.json();
    return body as T;
  } catch {
    throw new Error('不正なJSONフォーマットです');
  }
}



/**
 * セッションIDを取得または生成
 */
export function getOrCreateSessionId(body: Partial<BaseAIRequest>): string {
  const sessionId = body.sessionId;
  return typeof sessionId === 'string' ? sessionId : `session-${Date.now()}`;
}