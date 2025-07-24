import { NextRequest, NextResponse } from "next/server";
import { getAIProcessor } from "@/server/lib/aiProcessor";
import { AIFeatureRequest } from "@/core/types/AIFeatures";

export const runtime = "nodejs";

/**
 * UI生成 API
 * ADK Agentを使用してHTML/Reactコンポーネントを動的生成
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { 
      input, 
      options = {} 
    } = body;

    // 入力検証
    if (!input || typeof input !== 'string') {
      return NextResponse.json(
        { error: "UI生成の指示が必要です" },
        { status: 400 }
      );
    }

    if (input.length > 3000) {
      return NextResponse.json(
        { error: "入力は3000文字以内にしてください" },
        { status: 400 }
      );
    }

    // UI生成機能リクエスト
    const featureRequest: AIFeatureRequest = {
      feature: "ui_generation",
      input,
      options: {
        uiType: options.uiType ?? "auto",
        framework: options.framework ?? "html",
        responsive: options.responsive !== false,
        colorScheme: options.colorScheme ?? "light"
      },
      sessionId: 'demo-session' // 固定セッションID
    };

    // AI処理実行
    const aiProcessor = getAIProcessor();
    const response = await aiProcessor.processFeature(featureRequest);

    // デバッグログ（一時的に本番でも有効）
    // eslint-disable-next-line no-console
    console.log('UI Generation Response:', JSON.stringify(response, null, 2));
    // eslint-disable-next-line no-console
    console.log('UI Generation Success:', response.success);
    // eslint-disable-next-line no-console
    console.log('UI Generation Result Type:', typeof response.result);

    return NextResponse.json(response);

  } catch (error) {
    // console.error("UI Generation API error:", error);
    // エラーログ出力（本番環境では削除予定）
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('UI Generation error:', error);
    }
    return NextResponse.json(
      { error: "内部エラーが発生しました" },
      { status: 500 }
    );
  }
}