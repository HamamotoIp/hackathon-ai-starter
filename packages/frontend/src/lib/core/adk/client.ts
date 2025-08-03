/**
 * ADK Agent共通クライアント
 * セッション管理とメッセージ送信の共通処理
 */

import { GoogleAuth } from 'google-auth-library';
import type {
  ADKCreateSessionRequest,
  ADKCreateSessionResponse,
  ADKStreamQueryRequest
} from '@/lib/types/adk';

/**
 * ADKセッション作成
 */
export async function createADKSession(serviceUrl: string): Promise<string> {
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
export async function sendADKMessage(
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
      message,  // ここで実際に送信されるのは第3引数のmessage
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
    responseType: 'text',
    timeout: 120000  // 2分に延長
  });

  const { parseADKResponse } = await import('./response-parser');
  return parseADKResponse(response.data as string);
}

// 🚨 型安全性：クライアントサイドでの使用を防ぐ
if (typeof window !== 'undefined') {
  throw new Error(
    '🚨 ADK Clientはサーバーサイド専用です。'
  );
}