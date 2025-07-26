/**
 * API共通ヘルパー関数
 * 軽量な共通処理でコード重複を削減
 */

import { NextRequest, NextResponse } from 'next/server';
import type { BaseAPIRequest, ErrorAPIResponse } from '@/core/types';

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
  const errorResponse: ErrorAPIResponse = {
    error: message,
    status
  };
  return NextResponse.json(errorResponse, { status });
}

/**
 * リクエストボディのJSONパースと基本バリデーション
 */
export async function parseRequestBody<T = BaseAPIRequest>(request: NextRequest): Promise<T> {
  try {
    const body = await request.json();
    return body as T;
  } catch {
    throw new Error('不正なJSONフォーマットです');
  }
}

/**
 * 共通入力バリデーション
 */
export function validateCommonInput(body: Partial<BaseAPIRequest>): asserts body is BaseAPIRequest {
  if (!body.message || typeof body.message !== 'string') {
    throw new Error('メッセージが必要です');
  }
  
  if (body.message.length > 5000) {
    throw new Error('メッセージが長すぎます（最大5000文字）');
  }
}


/**
 * セッションIDを取得または生成
 */
export function getOrCreateSessionId(body: Partial<BaseAPIRequest>): string {
  const sessionId = body.sessionId;
  return typeof sessionId === 'string' ? sessionId : `session-${Date.now()}`;
}