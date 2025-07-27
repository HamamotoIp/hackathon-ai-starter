import { NextRequest } from "next/server";
import { processUIGeneration } from "@/lib/adk-agent";
import { 
  parseRequestBody, 
  createSuccessResponse, 
  createErrorResponse,
  getOrCreateSessionId
} from '@/lib/apiHelpers';
import type { UIGenerationResult, DeviceType } from '@/lib/ai-features';
import type { UIGenerationAPIRequest, UIGenerationAPIResponse } from '@/lib/api';

export const runtime = "nodejs";

/**
 * UI生成 API
 * ADK Agentを使用してHTML/Reactコンポーネントを動的生成
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await parseRequestBody<UIGenerationAPIRequest>(req);

    // ADK Agentで直接処理（UI生成モード）
    const serviceUrl = process.env.UI_GENERATION_AGENT_URL;
    if (!serviceUrl) {
      throw new Error('UI_GENERATION_AGENT_URL環境変数が設定されていません');
    }

    const result = await processUIGeneration(serviceUrl, body.message, body.options);
    const processingTime = Date.now() - startTime;

    // UI生成結果の解析
    // ADKエージェントからのレスポンスを解析してHTMLを取得
    let html: string;
    let metadata: { deviceType: DeviceType; responsive: boolean } = {
      deviceType: (body.options?.deviceType as DeviceType) ?? "auto",
      responsive: true
    };

    try {
      // マークダウンコードブロックを除去
      let cleanedResult = result;
      if (result.includes('```json') && result.includes('```')) {
        // ```json と ``` の間のコンテンツを抽出
        const jsonMatch = result.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch?.[1]) {
          cleanedResult = jsonMatch[1];
        }
      }
      
      // レスポンスがJSONの場合、パースしてhtmlプロパティを取得
      const parsedResult = JSON.parse(cleanedResult);
      if (parsedResult.html) {
        html = parsedResult.html;
        if (parsedResult.metadata) {
          metadata = { ...metadata, ...parsedResult.metadata };
        }
      } else {
        // JSONだがhtmlプロパティがない場合、結果全体をHTMLとして扱う
        html = cleanedResult;
      }
    } catch {
      // JSONでない場合、結果全体をHTMLとして扱う
      html = result;
    }

    const uiResult: UIGenerationResult = {
      html,
      metadata
    };

    const response: UIGenerationAPIResponse = {
      success: true,
      result: uiResult,
      processingMode: "adk_agent",
      processingTimeMs: processingTime,
      sessionId: getOrCreateSessionId(body),
      timestamp: new Date().toISOString()
    };
    
    return createSuccessResponse(response);

  } catch (error) {
    const message = error instanceof Error ? error.message : "内部エラーが発生しました";
    return createErrorResponse(message, 500);
  }
}