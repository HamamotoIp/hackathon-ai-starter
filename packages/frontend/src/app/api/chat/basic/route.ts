import { NextRequest, NextResponse } from 'next/server';
import { getAIProcessor } from '@/server/lib/aiProcessor';
import { BasicChatRequest } from '@/core/types/AIFeatures';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // リクエストの検証
    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json(
        { error: 'メッセージが必要です' },
        { status: 400 }
      );
    }

    // AI処理リクエストを構築
    const aiRequest: BasicChatRequest = {
      feature: 'basic_chat',
      input: body.message,
      sessionId: body.sessionId,
    };

    // AI処理を実行
    const aiProcessor = getAIProcessor();
    const response = await aiProcessor.processFeature(aiRequest);

    return NextResponse.json({
      message: response.result,
      processingTimeMs: response.processingTimeMs,
      sessionId: response.sessionId,
    });
    
  } catch (error) {
    console.error('Basic chat error:', error);
    return NextResponse.json(
      { 
        error: 'チャット処理中にエラーが発生しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}