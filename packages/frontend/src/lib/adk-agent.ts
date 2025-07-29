/* eslint-disable no-console */
/**
 * ADK Agent処理ヘルパー - サーバーサイド専用
 * 
 * このモジュールは3つのADK Agentと統合します：
 * - Analysis Agent: データ分析・レポート生成
 * - UI Generation Agent: HTML/CSS生成
 * - Restaurant Search Agent: 6段階処理による飲食店検索
 * 
 * Restaurant Search Agentの革新的実装：
 * - 1行形式HTML出力によるエスケープ問題の根本解決
 * - Pydanticスキーマでの厳密な出力制御
 * - HTMLExtractorAgentで純粋な1行HTMLを最終抽出
 * - 複数のレスポンス形式に対応した堅牢な解析処理
 * - シンプル化されたエスケープ除去処理
 * 
 * レスポンス解析アーキテクチャ（エスケープ問題解決版）：
 * 1. 直接JSONレスポンス解析（最優先）
 * 2. SSE形式レスポンス解析
 * 3. 直接HTML抽出
 * 4. シンプル化されたエスケープ除去処理
 * 5. フォールバック処理
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
 * ADK Agent - 飲食店検索処理（エスケープ問題完全解決版）
 * 
 * 6段階処理による完全な飲食店検索システム：
 * 1. SimpleIntentAgent: ユーザー入力から検索パラメータ抽出
 * 2. SimpleSearchAgent: 2段階Google検索実行
 * 3. SimpleSelectionAgent: 条件に最適な5店舗選定
 * 4. SimpleDescriptionAgent: 魅力的な説明文生成
 * 5. SimpleUIAgent: 1行形式HTML生成（エスケープ問題解決）
 * 6. HTMLExtractorAgent: 純粋な1行HTML最終抽出
 * 
 * エスケープ問題解決の革新：
 * - エージェント側：1行形式HTML出力を強制
 * - フロントエンド側：シンプル化されたエスケープ除去
 * - 結果：綺麗にレンダリングされるHTML
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
    const response = await sendADKMessage(serviceUrl, sessionId, message);
    
    // レスポンスが不完全な場合のチェックを追加
    if (!response || response.length < 100) {
      console.warn('[DEBUG] レスポンスが不完全です:', response?.length || 0, '文字');
      throw new Error('レスポンスが不完全です。ワークフローが途中で停止した可能性があります。再試行してください。');
    }
    
    // HTMLが含まれているかチェック
    if (!response.includes('<!DOCTYPE html>') && !response.includes('<html')) {
      console.warn('[DEBUG] HTMLが含まれていないレスポンス');
      throw new Error('HTML出力が生成されませんでした。ワークフローが完了していない可能性があります。');
    }
    
    // レスポンスがJSONオブジェクトの場合、htmlフィールドを抽出
    // これはHTMLExtractorAgentが処理する前のフォールバック
    try {
      const parsed = JSON.parse(response);
      if (parsed.html && typeof parsed.html === 'string') {
        // eslint-disable-next-line no-console
        console.log('[DEBUG] Restaurant search returned JSON with html field');
        return parsed.html;
      }
    } catch {
      // JSONパースエラーの場合は元のレスポンスを返す
    }
    
    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ERROR] Restaurant search failed:', errorMessage);
    throw new Error(`飲食店検索処理エラー: ${errorMessage}`);
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
    responseType: 'text',
    timeout: 120000  // 2分に延長
  });

  console.log('[DEBUG] ADK Response status:', response.status);
  console.log('[DEBUG] ADK Response type:', typeof response.data);
  console.log('[DEBUG] ADK Response length:', (response.data as string).length);
  console.log('[DEBUG] ADK Response first 1000 chars:', (response.data as string).substring(0, 1000));

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
 * ADKレスポンス解析（完全再構築版）
 */
function parseADKResponse(responseData: string): string {
  // eslint-disable-next-line no-console
  console.log('[DEBUG] ===== ADK Response Analysis =====');
  // eslint-disable-next-line no-console
  console.log('[DEBUG] Response type:', typeof responseData);
  // eslint-disable-next-line no-console
  console.log('[DEBUG] Response length:', responseData.length);
  // eslint-disable-next-line no-console
  console.log('[DEBUG] First 1000 chars:', responseData.substring(0, 1000));
  
  try {
    // Step 1: 直接JSONレスポンスのチェック（最優先）
    const directResult = tryParseDirectJSON(responseData);
    if (directResult) {
      // eslint-disable-next-line no-console
      console.log('[DEBUG] ✅ Direct JSON parsing successful');
      return directResult;
    }
    
    // Step 2: SSE形式のレスポンス解析
    const sseResult = tryParseSSEResponse(responseData);
    if (sseResult) {
      // eslint-disable-next-line no-console
      console.log('[DEBUG] ✅ SSE parsing successful');
      return sseResult;
    }
    
    // Step 3: HTMLの直接検出
    const htmlResult = tryExtractDirectHTML(responseData);
    if (htmlResult) {
      // eslint-disable-next-line no-console
      console.log('[DEBUG] ✅ Direct HTML extraction successful');
      return htmlResult;
    }
    
    // Step 4: フォールバック処理
    // eslint-disable-next-line no-console
    console.log('[DEBUG] ⚠️ Using fallback processing');
    return handleNonSSEResponse(responseData);

  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[DEBUG] ❌ Parse error:', error);
    return responseData;
  }
}

/**
 * 直接JSONレスポンスの解析を試行
 */
function tryParseDirectJSON(responseData: string): string | null {
  try {
    const jsonParsed = JSON.parse(responseData);
    // eslint-disable-next-line no-console
    console.log('[DEBUG] JSON parsed successfully:', Object.keys(jsonParsed));
    
    // パターン1: レストラン検索の標準形式
    if (jsonParsed.html && typeof jsonParsed.html === 'string') {
      // eslint-disable-next-line no-console
      console.log('[DEBUG] Found html field in root');
      return cleanHTMLContent(jsonParsed.html);
    }
    
    // パターン2: HTMLOutputスキーマ形式
    if (jsonParsed.structured_html?.html && typeof jsonParsed.structured_html.html === 'string') {
      // eslint-disable-next-line no-console
      console.log('[DEBUG] Found html in structured_html');
      return cleanHTMLContent(jsonParsed.structured_html.html);
    }
    
    // パターン3: final_html形式
    if (jsonParsed.final_html?.html && typeof jsonParsed.final_html.html === 'string') {
      // eslint-disable-next-line no-console
      console.log('[DEBUG] Found html in final_html');
      return cleanHTMLContent(jsonParsed.final_html.html);
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * SSEレスポンスの解析を試行
 */
function tryParseSSEResponse(responseData: string): string | null {
  const lines = responseData.split('\n');
  const dataLines = lines.filter(line => line.startsWith('data: '));
  
  if (dataLines.length === 0) {
    return null;
  }
  
  // eslint-disable-next-line no-console
  console.log('[DEBUG] SSE data lines found:', dataLines.length);
  return parseMultiAgentSSEResponse(dataLines);
}

/**
 * 直接HTMLの抽出を試行
 */
function tryExtractDirectHTML(responseData: string): string | null {
  // DOCTYPE htmlで始まるHTMLを直接検出
  const htmlMatch = responseData.match(/<!DOCTYPE html>[\s\S]*?<\/html>/i);
  if (htmlMatch) {
    // eslint-disable-next-line no-console
    console.log('[DEBUG] Direct HTML match found');
    return cleanHTMLContent(htmlMatch[0]);
  }
  
  // <html>で始まるHTMLを検出
  const htmlMatch2 = responseData.match(/<html[\s\S]*?<\/html>/i);
  if (htmlMatch2) {
    // eslint-disable-next-line no-console
    console.log('[DEBUG] HTML without DOCTYPE found');
    return cleanHTMLContent(htmlMatch2[0]);
  }
  
  return null;
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
      
      // 2.5. レストラン検索のレスポンス形式をチェック
      if (parsedData.html && typeof parsedData.html === 'string') {
        console.log('[DEBUG] Found restaurant search response with html field in SSE');
        if (parsedData.author === 'SimpleUIAgent' || parsedData.author === 'HTMLExtractorAgent') {
          finalUIAgentHtml = parsedData.html;
          _finalAgentName = parsedData.author;
        } else {
          lastAnyHtml = parsedData.html;
        }
        continue;
      }
      
      // 2.6. HTMLOutputスキーマレスポンスをチェック
      if (parsedData.structured_html?.html && typeof parsedData.structured_html.html === 'string') {
        console.log('[DEBUG] Found structured_html in SSE');
        if (parsedData.author === 'SimpleUIAgent') {
          finalUIAgentHtml = parsedData.structured_html.html;
          _finalAgentName = 'SimpleUIAgent';
        } else {
          lastAnyHtml = parsedData.structured_html.html;
        }
        continue;
      }
      
      // 2.7. final_htmlレスポンスをチェック
      if (parsedData.final_html?.html && typeof parsedData.final_html.html === 'string') {
        console.log('[DEBUG] Found final_html in SSE');
        lastAnyHtml = parsedData.final_html.html;
        continue;
      }
      
      // 2.8. actions.state_delta内のstructured_htmlとfinal_htmlをチェック
      if (parsedData.actions?.state_delta?.structured_html) {
        const structuredHtml = parsedData.actions.state_delta.structured_html;
        if (typeof structuredHtml === 'object' && structuredHtml !== null && 
            'html' in structuredHtml && typeof structuredHtml.html === 'string') {
          console.log('[DEBUG] Found structured_html in actions.state_delta');
          lastAnyHtml = structuredHtml.html;
          continue;
        }
      }
      
      if (parsedData.actions?.state_delta?.final_html) {
        const finalHtml = parsedData.actions.state_delta.final_html;
        if (typeof finalHtml === 'object' && finalHtml !== null && 
            'html' in finalHtml && typeof finalHtml.html === 'string') {
          console.log('[DEBUG] Found final_html in actions.state_delta');
          lastAnyHtml = finalHtml.html;
          continue;
        }
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
 * 非SSE形式レスポンスの処理（強化版）
 */
function handleNonSSEResponse(responseData: string): string {
  console.log('[DEBUG] Handling non-SSE response');
  
  try {
    const jsonResponse = JSON.parse(responseData);
    console.log('[DEBUG] Non-SSE JSON keys:', Object.keys(jsonResponse));
    
    // パターン1: レストラン検索の標準形式
    if (jsonResponse?.html && typeof jsonResponse.html === 'string') {
      console.log('[DEBUG] Found html field in non-SSE response');
      return cleanHTMLContent(jsonResponse.html);
    }
    
    // パターン2: HTMLOutputスキーマ形式
    if (jsonResponse?.structured_html?.html && typeof jsonResponse.structured_html.html === 'string') {
      console.log('[DEBUG] Found structured_html in non-SSE response');
      return cleanHTMLContent(jsonResponse.structured_html.html);
    }
    
    // パターン3: final_html形式
    if (jsonResponse?.final_html?.html && typeof jsonResponse.final_html.html === 'string') {
      console.log('[DEBUG] Found final_html in non-SSE response');
      return cleanHTMLContent(jsonResponse.final_html.html);
    }
    
    // パターン4: content.parts[0].text の形式
    if (jsonResponse?.content?.parts?.[0]?.text) {
      console.log('[DEBUG] Found content.parts[0].text in non-SSE response');
      const text = jsonResponse.content.parts[0].text;
      if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
        return cleanHTMLContent(text);
      }
    }
    
    // パターン5: その他の可能なパス
    const content = jsonResponse.message ?? jsonResponse.response ?? jsonResponse.content ?? jsonResponse.text ?? jsonResponse.output;
    if (typeof content === 'string') {
      if (content.includes('<!DOCTYPE html>') || content.includes('<html')) {
        console.log('[DEBUG] Found HTML in fallback content field');
        return cleanHTMLContent(content);
      }
    }
    
    console.log('[DEBUG] No HTML found in JSON structure');
    return responseData;
    
  } catch {
    // eslint-disable-next-line no-console
    console.log('[DEBUG] JSON parse failed, trying HTML direct match');
    
    // HTMLの直接マッチングを試行
    const htmlMatch = responseData.match(/<!DOCTYPE html>[\s\S]*?<\/html>/i);
    if (htmlMatch) {
      console.log('[DEBUG] Found HTML via regex match');
      return cleanHTMLContent(htmlMatch[0]);
    }
    
    const htmlMatch2 = responseData.match(/<html[\s\S]*?<\/html>/i);
    if (htmlMatch2) {
      console.log('[DEBUG] Found HTML without DOCTYPE via regex match');
      return cleanHTMLContent(htmlMatch2[0]);
    }
    
    console.log('[DEBUG] No HTML found via regex, returning raw response');
    return responseData;
  }
}

/**
 * HTMLコンテンツのエスケープを完全除去（強化版）
 * 
 * 問題: HTMLに改行やエスケープ文字が表示される
 * 原因: LLMのJSON出力時にダブルクォートがエスケープされる + 改行が削除される
 * 解決: 段階的なエスケープ除去処理でHTMLを完全復元
 */
function cleanHTMLContent(content: string): string {
  console.log('[DEBUG] cleanHTMLContent input length:', content.length);
  console.log('[DEBUG] cleanHTMLContent first 200 chars:', content.substring(0, 200));
  
  // Step 1: コードブロックマーカーを除去
  let cleaned = content
    .replace(/^```html\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .replace(/^```\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();
  
  // Step 2: JSONエスケープされた文字列の場合は解除
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    try {
      cleaned = JSON.parse(cleaned);
      console.log('[DEBUG] JSON unescaped successfully');
    } catch {
      console.log('[DEBUG] JSON parse failed, using manual cleanup');
    }
  }
  
  // Step 3: 段階的エスケープ除去（順序重要）
  cleaned = cleaned
    // 3-1: 改行・タブ・キャリッジリターンを適切なスペースに
    .replace(/\\n/g, ' ')      // 改行をスペースに
    .replace(/\\r/g, ' ')      // キャリッジリターンをスペースに  
    .replace(/\\t/g, ' ')      // タブをスペースに
    
    // 3-2: クォートのエスケープを除去
    .replace(/\\"/g, '"')      // ダブルクォート復元（最重要）
    .replace(/\\'/g, "'")      // シングルクォート復元
    
    // 3-3: その他のエスケープ
    .replace(/\\\\/g, '\\')    // バックスラッシュ復元
    .replace(/\\&/g, '&')      // アンパサンド復元
    .replace(/\\</g, '<')      // 小なり復元
    .replace(/\\>/g, '>')      // 大なり復元
    
    // 3-4: 空白の正規化
    .replace(/\s+/g, ' ')      // 連続する空白を1つに
    .trim();
  
  // Step 4: Unicodeエスケープを処理
  cleaned = cleaned.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });
  
  // Step 5: HTMLエンティティのデコード（必要に応じて）
  cleaned = cleaned
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');  // 最後に処理
  
  console.log('[DEBUG] cleanHTMLContent output length:', cleaned.length);
  console.log('[DEBUG] cleanHTMLContent first 200 chars after cleaning:', cleaned.substring(0, 200));
  console.log('[DEBUG] Successfully cleaned HTML - comprehensive escape removal complete');
  
  return cleaned;
}

// 🚨 型安全性：クライアントサイドでの使用を防ぐ
if (typeof window !== 'undefined') {
  throw new Error(
    '🚨 ADK Agentはサーバーサイド専用です。' +
    'クライアントサイドではclient/services/api-client.tsを使用してください。'
  );
}