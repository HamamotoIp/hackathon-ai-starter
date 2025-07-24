import { NextRequest } from "next/server";
import { processUIGeneration } from "@/server/lib/adkAgent";
import { 
  parseRequestBody, 
  validateCommonInput, 
  createSuccessResponse, 
  createErrorResponse,
  getOrCreateSessionId
} from '@/server/lib/apiHelpers';

export const runtime = "nodejs";

/**
 * UI生成 API
 * ADK Agentを使用してHTML/Reactコンポーネントを動的生成
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await parseRequestBody(req);
    validateCommonInput(body);

    // ADK Agentで直接処理（UI生成モード）
    const serviceUrl = process.env.UI_GENERATION_AGENT_URL;
    if (!serviceUrl) {
      throw new Error('UI_GENERATION_AGENT_URL環境変数が設定されていません');
    }

    const result = await processUIGeneration(serviceUrl, body.message as string);
    const processingTime = Date.now() - startTime;

    // UI生成結果の解析
    let uiResult;
    try {
      // ADKレスポンスを解析
      const adkResponse = JSON.parse(result);
      
      // content.parts[0].textからコンテンツを取得
      if (adkResponse.content?.parts?.[0]?.text) {
        const contentText = adkResponse.content.parts[0].text;
        
        // コードブロック内のJSONを抽出
        const jsonMatch = contentText.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch?.[1]) {
          const parsedContent = JSON.parse(jsonMatch[1]);
          const options = body.options as Record<string, unknown> | undefined;
          uiResult = {
            html: parsedContent.html,
            metadata: parsedContent.metadata ?? {
              uiType: (options?.uiType as string) ?? "auto",
              framework: (options?.framework as string) ?? "html",
              components: [],
              responsive: (options?.responsive as boolean) !== false,
              accessibility: true,
              javascript_required: false
            }
          };
        } else {
          // JSONブロックが見つからない場合はテキスト全体をHTMLとして扱う
          const options = body.options as Record<string, unknown> | undefined;
          uiResult = {
            html: contentText,
            metadata: {
              uiType: (options?.uiType as string) ?? "auto",
              framework: (options?.framework as string) ?? "html",
              components: [],
              responsive: (options?.responsive as boolean) !== false,
              accessibility: true,
              javascript_required: false
            }
          };
        }
      } else {
        // 旧形式のレスポンスの場合
        const options = body.options as Record<string, unknown> | undefined;
        uiResult = {
          html: adkResponse.html ?? result,
          metadata: {
            uiType: (options?.uiType as string) ?? "auto",
            framework: (options?.framework as string) ?? "html",
            components: [],
            responsive: (options?.responsive as boolean) !== false,
            accessibility: true,
            javascript_required: false
          }
        };
      }
    } catch {
      // JSON解析失敗時は生のHTMLとして扱う
      uiResult = {
        html: result,
        metadata: {
          uiType: "auto",
          framework: "html",
          components: [],
          responsive: true,
          accessibility: true,
          javascript_required: false
        }
      };
    }

    return createSuccessResponse({
      success: true,
      result: uiResult,
      processingMode: "adk_agent",
      processingTimeMs: processingTime,
      sessionId: getOrCreateSessionId(body),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : "内部エラーが発生しました";
    return createErrorResponse(message, 500);
  }
}