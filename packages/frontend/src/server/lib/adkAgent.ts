/**
 * ADK Agent処理ヘルパー
 * Analysis・UI Generation用のADK Agent呼び出し
 */

import { GoogleAuth } from 'google-auth-library';

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
  message: string
): Promise<string> {
  if (!serviceUrl) {
    throw new Error('ADK Agent URLが設定されていません');
  }

  try {
    const sessionId = await createADKSession(serviceUrl);
    const structuredMessage = createUIGenerationMessage(message);
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
  const response = await client.request({
    url: sessionUrl,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: {
      class_method: 'create_session',
      input: { user_id: userId }
    }
  });

  const sessionData = response.data as any;
  return sessionData.session_id ?? `session-${Date.now()}`;
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
  const response = await client.request({
    url: messageUrl,
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream'
    },
    data: {
      class_method: 'run',
      input: {
        message,
        session_id: sessionId,
        user_id: 'demo-user'
      }
    }
  });

  return parseADKResponse(response.data as string);
}

/**
 * UI生成用の構造化メッセージ作成
 */
function createUIGenerationMessage(message: string): string {
  const structuredMessage = {
    type: "ui_generation",
    user_prompt: message,
    ui_type: "auto",
    framework: "html", 
    responsive: true,
    color_scheme: "light"
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

    const lastDataLine = dataLines[dataLines.length - 1];
    if (!lastDataLine) {
      return responseData;
    }
    
    const jsonData = lastDataLine.replace('data: ', '');
    
    if (jsonData === '[DONE]') {
      // 最後のデータ行の1つ前を使用
      if (dataLines.length > 1) {
        const secondLastLine = dataLines[dataLines.length - 2];
        if (!secondLastLine) {
          return responseData;
        }
        const secondLastData = secondLastLine.replace('data: ', '');
        const parsedData = JSON.parse(secondLastData);
        return parsedData.message ?? parsedData.response ?? secondLastData;
      }
    }

    const parsedData = JSON.parse(jsonData);
    return parsedData.message ?? parsedData.response ?? jsonData;

  } catch {
    // JSON解析に失敗した場合は生のレスポンスを返す
    return responseData;
  }
}