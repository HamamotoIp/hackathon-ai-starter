import { NextRequest, NextResponse } from "next/server";
import { getAIProcessor } from "@/server/lib/aiProcessor";
import { AnalysisReportRequest } from "@/core/types/AIFeatures";

export const runtime = "nodejs";

/**
 * 分析レポート API
 * ADK Agentを使用
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { content } = body;

    // 入力検証
    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: "分析する内容が必要です" },
        { status: 400 }
      );
    }

    // 分析レポート機能リクエスト
    const featureRequest: AnalysisReportRequest = {
      feature: "analysis_report",
      input: content,
      sessionId: 'demo-session' // 固定セッションID
    };

    // AI処理実行
    const aiProcessor = getAIProcessor();
    const response = await aiProcessor.processFeature(featureRequest);

    return NextResponse.json(response);

  } catch {
    return NextResponse.json(
      { error: "内部エラーが発生しました" },
      { status: 500 }
    );
  }
}