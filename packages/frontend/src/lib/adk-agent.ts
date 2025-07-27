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
  try {
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
    
    for (const line of dataLines) {
      const jsonData = line.replace('data: ', '').trim();
      
      if (jsonData === '[DONE]') {
        break;
      }
      
      try {
        const parsedData = JSON.parse(jsonData) as ADKSSEEventData;
        
        // 深くネストされた構造を確認
        let content: string | undefined;
        
        // content.parts[0].text パターン
        if (typeof parsedData.content === 'object' && parsedData.content?.parts?.[0]?.text) {
          content = parsedData.content.parts[0].text;
        } else {
          // 従来のパターン
          const contentValue = typeof parsedData.content === 'string' ? parsedData.content : undefined;
          content = parsedData.message ?? parsedData.response ?? contentValue ?? parsedData.text ?? parsedData.output;
        }
        
        if (content && typeof content === 'string') {
          fullMessage += content;
        }
      } catch {
        // JSONパースエラーは無視
      }
    }
    
    return fullMessage || responseData;

  } catch {
    // JSON解析に失敗した場合は生のレスポンスを返す
    return responseData;
  }
}

// 🚨 型安全性：クライアントサイドでの使用を防ぐ
if (typeof window !== 'undefined') {
  throw new Error(
    '🚨 ADK Agentはサーバーサイド専用です。' +
    'クライアントサイドではclient/services/api-client.tsを使用してください。'
  );
}