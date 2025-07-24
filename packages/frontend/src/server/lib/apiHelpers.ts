/**
 * API共通ヘルパー関数
 * 軽量な共通処理でコード重複を削減
 */

import { NextRequest, NextResponse } from 'next/server';
import { AIFeatureRequest } from '@/core/types/aiTypes';

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
export async function parseRequestBody(request: NextRequest): Promise<any> {
  try {
    const body = await request.json();
    return body;
  } catch {
    throw new Error('不正なJSONフォーマットです');
  }
}

/**
 * 共通入力バリデーション
 */
export function validateCommonInput(body: any): void {
  if (!body.message || typeof body.message !== 'string') {
    throw new Error('メッセージが必要です');
  }
}

/**
 * AIFeatureRequestオブジェクトを構築
 */
export function createAIFeatureRequest(
  feature: string,
  input: string,
  options?: any
): AIFeatureRequest {
  return {
    feature: feature as any,
    input,
    options
  };
}

/**
 * セッションIDを取得または生成
 */
export function getOrCreateSessionId(body: any): string {
  return body.session_id ?? body.sessionId ?? `session-${Date.now()}`;
}