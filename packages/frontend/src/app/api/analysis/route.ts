import { NextRequest } from "next/server";
import { processAnalysis } from "@/lib/adk-agent";
import { 
  parseRequestBody, 
  createSuccessResponse, 
  createErrorResponse,
  getOrCreateSessionId
} from '@/lib/apiHelpers';
import type { BaseAIRequest } from '@/lib/ai-features';
import type { AnalysisAPIResponse } from '@/lib/api';

export const runtime = "nodejs";

/**
 * 分析レポート API
 * ADK Agentを使用
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await parseRequestBody<BaseAIRequest>(req);

    // ADK Agentで直接処理
    const serviceUrl = process.env.ANALYSIS_AGENT_URL;
    if (!serviceUrl) {
      throw new Error('ANALYSIS_AGENT_URL環境変数が設定されていません');
    }

    const result = await processAnalysis(serviceUrl, body.message);
    const processingTime = Date.now() - startTime;

    // ADKレスポンスを解析してテキストを抽出
    let finalResult: string;
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
      
      // レスポンスがJSONの場合、content.parts[0].textを抽出
      const parsedResult = JSON.parse(cleanedResult);
      if (parsedResult.content?.parts?.[0]?.text) {
        finalResult = parsedResult.content.parts[0].text;
      } else if (parsedResult.text) {
        finalResult = parsedResult.text;
      } else {
        // JSONだがテキストプロパティがない場合、結果全体をテキストとして扱う
        finalResult = cleanedResult;
      }
    } catch {
      // JSONでない場合、結果全体をテキストとして扱う
      finalResult = result;
    }

    const response: AnalysisAPIResponse = {
      success: true,
      result: finalResult,
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