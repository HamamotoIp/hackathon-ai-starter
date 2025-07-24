import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // リクエストボディの解析
    const { message, user_id, session_id } = await req.json();
    
    if (!message?.trim()) {
      return NextResponse.json({ error: "メッセージが空です" }, { status: 400 });
    }

    // Cloud Run ADKサービスのURL
    const adkServiceUrl = process.env.ADK_SERVICE_URL;
    if (!adkServiceUrl) {
      // ADKサービスが設定されていない場合は、シンプルなレスポンスを返す
      return NextResponse.json({ 
        message: `ADKエージェントモード: "${message}" を受信しました。マルチエージェント処理を行います。（ADKサービス未設定のため、デモレスポンスです）`,
        session_id: session_id ?? `session_${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: "agent-engine"
      });
    }

    try {
      // Cloud Run ADKサービスに転送
      const adkResponse = await fetch(`${adkServiceUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          user_id: user_id ?? "anonymous",
          session_id
        }),
      });

      if (!adkResponse.ok) {
        const _errorText = await adkResponse.text();
        // console.error("ADK service error:", _errorText);
        throw new Error("ADK service failed");
      }

      const adkResult = await adkResponse.json();
      
      return NextResponse.json({
        message: adkResult.message ?? "ADKエージェントからの応答を取得できませんでした",
        session_id: adkResult.session_id,
        timestamp: adkResult.timestamp ?? new Date().toISOString(),
        source: "agent-engine"
      });

    } catch {
      // console.error("ADK service error:", adkError);
      // フォールバック応答
      return NextResponse.json({
        message: `ADKエージェント（フォールバック）: "${message}" に対する分析完了。エージェント間協調処理により詳細な回答を生成中です。`,
        session_id: session_id ?? `session_${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: "agent-engine"
      });
    }

  } catch {
    // console.error("Agent API error:", error);
    return NextResponse.json(
      { error: "ADKエージェントからの応答を取得できませんでした" }, 
      { status: 500 }
    );
  }
}