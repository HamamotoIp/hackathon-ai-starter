import { NextRequest, NextResponse } from "next/server";
import { getAIProcessor } from "@/server/lib/aiProcessor";
import { AIFeatureRequest } from "@/core/types/AIFeatures";

export const runtime = "nodejs";

/**
 * 基本チャット API
 * Vertex AI Directを使用
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { message } = body;

    // 入力検証
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: "メッセージが必要です" },
        { status: 400 }
      );
    }

    // 基本チャット機能リクエスト
    const featureRequest: AIFeatureRequest = {
      feature: "basic_chat",
      input: message,
      sessionId: 'demo-session' // 固定セッションID
    };

    // AI処理実行
    const aiProcessor = getAIProcessor();
    const response = await aiProcessor.processFeature(featureRequest);

    return NextResponse.json(response);

  } catch {
    // console.error("Basic Chat API error:", error);
    return NextResponse.json(
      { error: "内部エラーが発生しました" },
      { status: 500 }
    );
  }
}