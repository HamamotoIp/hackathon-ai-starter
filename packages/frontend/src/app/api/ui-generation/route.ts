import { NextRequest } from "next/server";
import { processUIGeneration } from "@/server/lib/adkAgent";
import { 
  parseRequestBody, 
  validateCommonInput, 
  createSuccessResponse, 
  createErrorResponse,
  getOrCreateSessionId
} from '@/server/lib/apiHelpers';
import type {
  UIGenerationAPIRequest,
  UIGenerationAPIResponse,
  UIGenerationResult as APIUIGenerationResult,
  UIMetadata,
  ADKStructuredResponse
} from '@/core/types/apiTypes';

export const runtime = "nodejs";

/**
 * UI生成 API
 * ADK Agentを使用してHTML/Reactコンポーネントを動的生成
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await parseRequestBody<UIGenerationAPIRequest>(req);
    validateCommonInput(body);

    // ADK Agentで直接処理（UI生成モード）
    const serviceUrl = process.env.UI_GENERATION_AGENT_URL;
    if (!serviceUrl) {
      throw new Error('UI_GENERATION_AGENT_URL環境変数が設定されていません');
    }

    const result = await processUIGeneration(serviceUrl, body.message, body.options);
    const processingTime = Date.now() - startTime;

    // UI生成結果の解析
    let uiResult: APIUIGenerationResult;
    try {
      // ADKレスポンスを解析
      const adkResponse = JSON.parse(result) as ADKStructuredResponse;
      
      // content.parts[0].textからコンテンツを取得
      if (adkResponse.content?.parts?.[0]?.text) {
        const contentText = adkResponse.content.parts[0].text;
        
        // コードブロック内のJSONを抽出
        const jsonMatch = contentText.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch?.[1]) {
          const parsedContent = JSON.parse(jsonMatch[1]) as { html: string; metadata?: Partial<UIMetadata> };
          const defaultMetadata: UIMetadata = {
            deviceType: "auto",
            responsive: true
          };
          uiResult = {
            html: parsedContent.html,
            metadata: { ...defaultMetadata, ...parsedContent.metadata }
          };
        } else {
          // JSONブロックが見つからない場合はテキスト全体をHTMLとして扱う
          uiResult = {
            html: contentText,
            metadata: {
              deviceType: "auto",
              responsive: true
            }
          };
        }
      } else {
        // 旧形式のレスポンスの場合
        uiResult = {
          html: (adkResponse as any).html ?? result,
          metadata: {
            deviceType: "auto",
            responsive: true
          }
        };
      }
    } catch {
      // JSON解析失敗時は生のHTMLとして扱う
      uiResult = {
        html: result,
        metadata: {
          deviceType: "auto",
          responsive: true
        }
      };
    }

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