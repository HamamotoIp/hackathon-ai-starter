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
 * ADKレスポンス解析（堅牢性改善版）
 */
function parseADKResponse(responseData: string): string {
  // デバッグ: レスポンス全体を確認
  console.log('[DEBUG] Raw ADK Response:', `${responseData.substring(0, 500)}...`);
  
  try {
    // SSE形式のレスポンスを解析
    const lines = responseData.split('\n');
    const dataLines = lines.filter(line => line.startsWith('data: '));
    
    if (dataLines.length === 0) {
      // SSE形式でない場合のフォールバック処理
      return handleNonSSEResponse(responseData);
    }

    // マルチエージェント対応の堅牢な処理
    const result = parseMultiAgentSSEResponse(dataLines);
    
    return result || responseData;

  } catch (error) {
    console.error('[DEBUG] Parse error:', error);
    return responseData;
  }
}

/**
 * マルチエージェントSSEレスポンスの解析結果（将来の拡張用）
 */
interface _ParsedMultiAgentResponse {
  result: string;
  workflowComplete: boolean;
  finalAgent?: string;
}

/**
 * マルチエージェントSSEレスポンスの解析
 */
function parseMultiAgentSSEResponse(dataLines: string[]): string {
  let finalUIAgentHtml = '';
  let lastAnyHtml = '';
  let fullMessage = '';
  let isStreamComplete = false;
  let _finalAgentName = '';
  
  for (const line of dataLines) {
    const jsonData = line.replace('data: ', '').trim();
    
    // SSE完了シグナルの検出
    if (jsonData === '[DONE]') {
      isStreamComplete = true;
      console.log('[DEBUG] SSE stream completed with [DONE] signal');
      break;
    }
    
    try {
      const parsedData = JSON.parse(jsonData) as ADKSSEEventData;
      
      // デバッグ: エージェント名と出力を確認
      console.log(`[DEBUG] Agent: ${parsedData.author ?? 'unknown'}, Event:`, 
                 `${JSON.stringify(parsedData).substring(0, 200)}...`);
      
      // 1. SimpleUIAgentの最終HTML出力を優先的に検出
      if (parsedData.author === 'SimpleUIAgent' && parsedData.actions?.state_delta?.html) {
        finalUIAgentHtml = parsedData.actions.state_delta.html;
        _finalAgentName = 'SimpleUIAgent';
        console.log('[DEBUG] Found final UI Agent HTML output');
        continue;
      }
      
      // 2. 他のエージェントのHTML出力もフォールバック用に保持
      if (parsedData.actions?.state_delta?.html) {
        lastAnyHtml = parsedData.actions.state_delta.html;
        console.log(`[DEBUG] Found HTML from agent: ${parsedData.author ?? 'unknown'}`);
        continue;
      }
      
      // 3. content.parts[0].textからのHTML検出
      if (typeof parsedData.content === 'object' && parsedData.content?.parts?.[0]?.text) {
        const content = parsedData.content.parts[0].text;
        if (content.includes('<!DOCTYPE html>') || content.includes('<html')) {
          if (parsedData.author === 'SimpleUIAgent') {
            finalUIAgentHtml = content;
            _finalAgentName = 'SimpleUIAgent';
            console.log('[DEBUG] Found UI Agent HTML in content.parts[0].text');
          } else {
            lastAnyHtml = content;
          }
        } else {
          fullMessage += content;
        }
        continue;
      }
      
      // 4. その他のコンテンツパターン
      const contentValue = typeof parsedData.content === 'string' ? parsedData.content : undefined;
      const content = parsedData.message ?? parsedData.response ?? contentValue ?? parsedData.text ?? parsedData.output;
      
      if (content && typeof content === 'string') {
        if (content.includes('<!DOCTYPE html>') || content.includes('<html')) {
          if (parsedData.author === 'SimpleUIAgent') {
            finalUIAgentHtml = content;
            _finalAgentName = 'SimpleUIAgent';
          } else {
            lastAnyHtml = content;
          }
        } else {
          fullMessage += content;
        }
      }
      
    } catch (parseError) {
      console.warn('[DEBUG] Failed to parse SSE event:', parseError);
      // JSONパースエラーは無視して継続
    }
  }
  
  // 優先順位に基づいて最終結果を決定
  let finalResult = '';
  
  if (finalUIAgentHtml) {
    // 1. SimpleUIAgentのHTML出力が最優先
    finalResult = finalUIAgentHtml;
    console.log('[DEBUG] Using SimpleUIAgent HTML output');
  } else if (lastAnyHtml) {
    // 2. 他のエージェントのHTML出力をフォールバック
    finalResult = lastAnyHtml;
    console.log('[DEBUG] Using fallback HTML output from other agent');
  } else if (fullMessage.trim()) {
    // 3. 非HTMLメッセージの結合
    finalResult = fullMessage;
    console.log('[DEBUG] Using concatenated message content');
  }
  
  // SSE完了シグナルの確認
  if (!isStreamComplete) {
    console.warn('[DEBUG] SSE stream did not complete with [DONE] signal');
  }
  
  if (finalResult) {
    console.log('[DEBUG] Final result length:', finalResult.length);
    return cleanHTMLContent(finalResult);
  }
  
  return '';
}

/**
 * 非SSE形式レスポンスの処理
 */
function handleNonSSEResponse(responseData: string): string {
  try {
    const jsonResponse = JSON.parse(responseData);
    
    // content.parts[0].text の形式を試す
    if (jsonResponse?.content?.parts?.[0]?.text) {
      return cleanHTMLContent(jsonResponse.content.parts[0].text);
    }
    
    // その他の可能なパスを試す
    const content = jsonResponse.message ?? jsonResponse.response ?? jsonResponse.content ?? jsonResponse.text ?? jsonResponse.output;
    return typeof content === 'string' ? cleanHTMLContent(content) : responseData;
  } catch {
    // HTMLの直接マッチングを試行
    const htmlMatch = responseData.match(/<!DOCTYPE html>[\s\S]*?<\/html>/);
    if (htmlMatch) {
      return cleanHTMLContent(htmlMatch[0]);
    }
    
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
  cleaned = cleaned.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => {
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