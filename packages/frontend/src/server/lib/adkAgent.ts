/**
 * ADK Agent処理ヘルパー
 * Analysis・UI Generation用のADK Agent呼び出し
 */

import { GoogleAuth } from 'google-auth-library';
import type {
  ADKCreateSessionRequest,
  ADKCreateSessionResponse,
  ADKStreamQueryRequest,
  ADKSSEEventData,
  UIGenerationOptions
} from '@/core/types/apiTypes';

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
    const response = await sendADKMessage(serviceUrl, sessionId, message);
    return response;
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
    const response = await sendADKMessage(serviceUrl, sessionId, structuredMessage);
    return response;
  } catch (error) {
    throw new Error(`UI Generation処理エラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      return responseData; // SSE形式でない場合はそのまま返す
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
        // message, response, content, text など様々なフィールド名の可能性
        const content = parsedData.message ?? parsedData.response ?? parsedData.content ?? parsedData.text ?? parsedData.output;
        if (content) {
          fullMessage += content;
        }
      } catch {
      }
    }
    
    return fullMessage || responseData;

  } catch {
    // JSON解析に失敗した場合は生のレスポンスを返す
    return responseData;
  }
}