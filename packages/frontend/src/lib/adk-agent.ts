/**
 * ADK Agent処理ヘルパー - サーバーサイド専用
 * Analysis・UI Generation用のADK Agent呼び出し
 */

import { GoogleAuth } from 'google-auth-library';
import type {
  ADKCreateSessionRequest,
  ADKCreateSessionResponse,
  ADKStreamQueryRequest,
  ADKSSEEventData
} from '@/lib/api';
import type { UIGenerationOptions } from '@/lib/ai-features';

/**
 * ADK Agent - Analysis処理
 */
export async function processAnalysis(
  serviceUrl: string,
  message: string
): Promise<string> {
  if (!serviceUrl) {
    throw new Error('ADK Agent URLが設定されていません');
  }

  try {
    const sessionId = await createADKSession(serviceUrl);
    return await sendADKMessage(serviceUrl, sessionId, message);
  } catch (error) {
    throw new Error(`Analysis処理エラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * ADK Agent - UI Generation処理
 */
export async function processUIGeneration(
  serviceUrl: string,
  message: string,
  options?: UIGenerationOptions
): Promise<string> {
  if (!serviceUrl) {
    throw new Error('ADK Agent URLが設定されていません');
  }

  try {
    const sessionId = await createADKSession(serviceUrl);
    const structuredMessage = createUIGenerationMessage(message, options);
    return await sendADKMessage(serviceUrl, sessionId, structuredMessage);
  } catch (error) {
    throw new Error(`UI Generation処理エラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * ADK Agent - 飲食店検索処理
 */
export async function processRestaurantSearch(
  serviceUrl: string,
  message: string
): Promise<string> {
  if (!serviceUrl) {
    throw new Error('ADK Agent URLが設定されていません');
  }

  try {
    const sessionId = await createADKSession(serviceUrl);
    return await sendADKMessage(serviceUrl, sessionId, message);
  } catch (error) {
    throw new Error(`飲食店検索処理エラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * ADKセッション作成
 */
async function createADKSession(serviceUrl: string): Promise<string> {
  const sessionUrl = serviceUrl.replace(':streamQuery?alt=sse', ':query');
  const userId = 'demo-user';

  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });

  const client = await auth.getClient();
  
  const requestData: ADKCreateSessionRequest = {
    class_method: 'create_session',
    input: { user_id: userId }
  };
  
  const response = await client.request({
    url: sessionUrl,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: requestData
  });

  const sessionData = response.data as ADKCreateSessionResponse;

  if (!sessionData?.output?.id) {
    throw new Error('セッションIDの取得に失敗しました');
  }
  return sessionData.output.id;
}

/**
 * ADKメッセージ送信
 */
async function sendADKMessage(
  serviceUrl: string,
  sessionId: string,
  message: string
): Promise<string> {
  const messageUrl = serviceUrl;

  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });

  const client = await auth.getClient();
  
  const requestData: ADKStreamQueryRequest = {
    class_method: 'stream_query',
    input: {
      message,
      session_id: sessionId,
      user_id: 'demo-user'
    }
  };
  
  const response = await client.request({
    url: messageUrl,
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream'
    },
    data: requestData,
    responseType: 'text'
  });

  return parseADKResponse(response.data as string);
}

/**
 * UI生成用の構造化メッセージ作成
 */
function createUIGenerationMessage(message: string, options?: UIGenerationOptions): string {
  const structuredMessage = {
    type: "ui_generation",
    user_prompt: message,
    device_type: options?.deviceType ?? "auto"
  };
  return JSON.stringify(structuredMessage);
}

/**
 * ADKレスポンス解析
 */
function parseADKResponse(responseData: string): string {
  // デバッグ: レスポンス全体を確認
  console.log('[DEBUG] Raw ADK Response:', `${responseData.substring(0, 500)}...`);
  try {
    // レストラン検索エージェントの場合、最終的なHTML出力のみを抽出
    // 複数のJSONイベントから最後のHTMLを見つける
    const htmlMatch = responseData.match(/<!DOCTYPE html>[\s\S]*?<\/html>/);
    if (htmlMatch) {
      return htmlMatch[0];
    }

    // SSE形式のレスポンスを解析
    const lines = responseData.split('\n');
    const dataLines = lines.filter(line => line.startsWith('data: '));
    
    if (dataLines.length === 0) {
      // SSE形式でない場合、JSON全体をパースして内容を抽出
      try {
        const jsonResponse = JSON.parse(responseData);
        // content.parts[0].text の形式を試す
        if (jsonResponse?.content?.parts?.[0]?.text) {
          return jsonResponse.content.parts[0].text;
        }
        // その他の可能なパスを試す
        const content = jsonResponse.message ?? jsonResponse.response ?? jsonResponse.content ?? jsonResponse.text ?? jsonResponse.output;
        return typeof content === 'string' ? content : responseData;
      } catch {
        return responseData;
      }
    }

    // すべてのデータラインから内容を結合
    let fullMessage = '';
    let lastHtmlContent = '';
    
    for (const line of dataLines) {
      const jsonData = line.replace('data: ', '').trim();
      
      if (jsonData === '[DONE]') {
        break;
      }
      
      try {
        const parsedData = JSON.parse(jsonData) as ADKSSEEventData;
        
        // デバッグ: パースされたデータの構造を確認
        console.log('[DEBUG] Parsed SSE Event:', `${JSON.stringify(parsedData).substring(0, 300)}...`);
        
        // 深くネストされた構造を確認
        let content: string | undefined;
        
        // content.parts[0].text パターン
        if (typeof parsedData.content === 'object' && parsedData.content?.parts?.[0]?.text) {
          content = cleanHTMLContent(parsedData.content.parts[0].text);
        } else {
          // 従来のパターン
          const contentValue = typeof parsedData.content === 'string' ? parsedData.content : undefined;
          content = parsedData.message ?? parsedData.response ?? contentValue ?? parsedData.text ?? parsedData.output;
        }
        
        if (content && typeof content === 'string') {
          // HTMLコンテンツの場合は最後のものを保持
          if (content.includes('<!DOCTYPE html>') || content.includes('<html')) {
            lastHtmlContent = content;
          } else {
            fullMessage += content;
          }
        }
        
        // actions.state_delta.html パターンも確認（レストラン検索エージェント用）
        if (parsedData.actions?.state_delta?.html) {
          console.log('[DEBUG] Found HTML in actions.state_delta.html');
          lastHtmlContent = parsedData.actions.state_delta.html;
        }
        
        // state.html パターンも確認（AIエージェントの出力キーに対応）
        if (parsedData.actions?.state_delta && 'html' in parsedData.actions.state_delta) {
          console.log('[DEBUG] Found HTML in state_delta');
          const htmlContent = parsedData.actions.state_delta.html;
          if (typeof htmlContent === 'string') {
            lastHtmlContent = htmlContent;
          }
        }
      } catch {
        // JSONパースエラーは無視
      }
    }
    
    // HTMLコンテンツがある場合はそれを返す
    if (lastHtmlContent) {
      console.log('[DEBUG] Returning HTML content:', `${lastHtmlContent.substring(0, 200)}...`);
      return cleanHTMLContent(lastHtmlContent);
    }
    
    return cleanHTMLContent(fullMessage) || responseData;

  } catch {
    // JSON解析に失敗した場合は生のレスポンスを返す
    return responseData;
  }
}

/**
 * HTMLコンテンツからコードブロックを除去し、Unicodeエスケープをデコード
 */
function cleanHTMLContent(content: string): string {
  // ```html と ``` を除去（より厳密に）
  let cleaned = content
    .replace(/^```html\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .replace(/^```\s*\n?/i, '')  // 一般的な```も除去
    .replace(/\n?```\s*$/i, '')
    .trim();
  
  // 手動でエスケープを処理（JSONパースより確実）
  
  // Unicodeエスケープをデコード（\uXXXX形式）
  cleaned = cleaned.replace(/\\u([0-9a-fA-F]{4})/g, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });
  
  // 改行文字のエスケープを実際の改行に変換
  cleaned = cleaned.replace(/\\n/g, '\n');
  
  // タブ文字のエスケープを実際のタブに変換
  cleaned = cleaned.replace(/\\t/g, '\t');
  
  // ダブルクォートのエスケープを解除
  cleaned = cleaned.replace(/\\"/g, '"');
  
  // バックスラッシュのエスケープを解除（最後に実行）
  cleaned = cleaned.replace(/\\\\/g, '\\');
  
  return cleaned;
}

// 🚨 型安全性：クライアントサイドでの使用を防ぐ
if (typeof window !== 'undefined') {
  throw new Error(
    '🚨 ADK Agentはサーバーサイド専用です。' +
    'クライアントサイドではclient/services/api-client.tsを使用してください。'
  );
}