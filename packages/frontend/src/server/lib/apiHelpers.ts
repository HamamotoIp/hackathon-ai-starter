/**
 * API共通ヘルパー関数
 * 軽量な共通処理でコード重複を削減
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * 標準的な成功レスポンスを作成
 */
export function createSuccessResponse(data: unknown) {
  return NextResponse.json(data);
}

/**
 * 標準的なエラーレスポンスを作成
 */
export function createErrorResponse(message: string, status = 500) {
  return NextResponse.json(
    { error: message },
    { status }
  );
}

/**
 * リクエストボディのJSONパースと基本バリデーション
 */
export async function parseRequestBody(request: NextRequest): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    return body as Record<string, unknown>;
  } catch {
    throw new Error('不正なJSONフォーマットです');
  }
}

/**
 * 共通入力バリデーション
 */
export function validateCommonInput(body: Record<string, unknown>): void {
  if (!body.message || typeof body.message !== 'string') {
    throw new Error('メッセージが必要です');
  }
}


/**
 * セッションIDを取得または生成
 */
export function getOrCreateSessionId(body: Record<string, unknown>): string {
  const sessionId = body.session_id ?? body.sessionId;
  return typeof sessionId === 'string' ? sessionId : `session-${Date.now()}`;
}