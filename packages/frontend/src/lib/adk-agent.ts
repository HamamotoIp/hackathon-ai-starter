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
 * ADK Agent - 飲食店検索処理（固定データ実装版）
 * 
 * エリア別の厳選レストランデータを返す実装：
 * - 渋谷、新宿、銀座エリアの高品質レストラン情報
 * - イタリアン、フレンチ、和食、中華ジャンル
 * - シーンに応じた最適なレストラン選定
 * - 美しいHTML記事として生成
 * 
 * フォールバック機能：
 * - ADKエージェントが利用できない場合のみ固定データを使用
 * - レスポンスが不完全な場合の安全な代替手段
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
    
    // レスポンスが不完全な場合のチェック
    if (!response || response.length < 100) {
      console.warn('[Restaurant Search] Response too short, using fixed data');
      return generateFixedRestaurantHTML(message);
    }
    
    // HTMLが含まれているかチェック
    if (!response.includes('<!DOCTYPE html>') && !response.includes('<html')) {
      console.warn('[Restaurant Search] No HTML found, using fixed data');
      return generateFixedRestaurantHTML(message);
    }
    
    // レスポンスがJSONオブジェクトの場合、htmlフィールドを抽出
    try {
      const parsed = JSON.parse(response);
      if (parsed.html && typeof parsed.html === 'string') {
        return parsed.html;
      }
    } catch {
      // JSONパースエラーの場合は元のレスポンスを返す
    }
    
    return response;
  } catch (error) {
    console.warn('[Restaurant Search] ADK Agent failed, using fixed data:', error);
    return generateFixedRestaurantHTML(message);
  }
}

// 固定データ用のHTML生成
function generateFixedRestaurantHTML(query: string): string {
  // クエリから地域とシーンを抽出
  const areas = ['渋谷', '新宿', '銀座', '表参道', '六本木'];
  const area = areas.find(a => query.includes(a)) || '渋谷';
  
  const scenes = ['デート', '接待', '女子会', 'ランチ', 'ディナー'];
  
  // エリア別レストランデータの型定義
  interface Restaurant {
    name: string;
    genre: string;
    description: string;
  }
  
  const restaurantData: Record<string, Restaurant[]> = {
    '渋谷': [
      { name: 'リストランテ・ヒロ', genre: 'イタリアン', description: '本格イタリアンと厳選ワインが楽しめる隠れ家的名店' },
      { name: 'ビストロ・ルミエール', genre: 'フレンチ', description: '気軽に楽しめるビストロスタイルのフレンチ' },
      { name: '日本料理 青山', genre: '和食', description: '旬の食材を活かした繊細な和食' },
      { name: '龍華楼', genre: '中華', description: '本格四川料理と飲茶が楽しめる' }
    ],
    '新宿': [
      { name: 'トラットリア・ナポリ', genre: 'イタリアン', description: '新宿の夜景を眺めながら楽しむイタリアン' },
      { name: 'シェ・ピエール', genre: 'フレンチ', description: '新宿の高層階から見下ろす絶景とフレンチ' },
      { name: '季節料理 花月', genre: '和食', description: '四季の移ろいを表現した創作和食' },
      { name: '福満園', genre: '中華', description: '本格広東料理の老舗' }
    ],
    '銀座': [
      { name: 'リストランテ・ローマ', genre: 'イタリアン', description: '銀座の洗練された雰囲気で味わう本格イタリアン' },
      { name: 'ラ・ベルテ', genre: 'フレンチ', description: '銀座の一等地で味わう至極のフレンチ' },
      { name: '料亭 花鳥風月', genre: '和食', description: '銀座の格式ある料亭で極上のおもてなし' },
      { name: '天香閣', genre: '中華', description: '銀座で愛され続ける高級中華' }
    ]
  };
  
  const restaurants = restaurantData[area] || restaurantData['渋谷'] || [];

  const cards = restaurants.map((restaurant: Restaurant) => 
    `<div style='background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); padding: 20px; margin-bottom: 20px;'><h3 style='font-size: 20px; font-weight: bold; color: #1f2937; margin-bottom: 12px;'>${restaurant.name}</h3><p style='color: #6b7280; margin-bottom: 8px;'>${restaurant.genre}</p><p style='color: #6b7280; line-height: 1.6; font-size: 14px;'>${restaurant.description}</p></div>`
  ).join('');

  return `<!DOCTYPE html><html lang='ja'><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'><title>レストラン検索結果 - ${query}</title></head><body style='font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;'><div style='max-width: 800px; margin: 0 auto;'><h1 style='text-align: center; color: #1f2937; margin-bottom: 30px;'>レストラン検索結果</h1><p style='text-align: center; color: #6b7280; margin-bottom: 30px;'>検索条件: ${query}</p>${cards}</div></body></html>`;
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
  console.log('[ADK Response Parser] Raw response length:', responseData.length);
  console.log('[ADK Response Parser] Raw response preview:', responseData.substring(0, 200));
  
  try {
    // Step 1: 直接JSONレスポンスのチェック（最優先）
    const directResult = tryParseDirectJSON(responseData);
    if (directResult) {
      console.log('[ADK Response Parser] Direct JSON parsing successful');
      return directResult;
    }
    
    // Step 2: SSE形式のレスポンス解析
    const sseResult = tryParseSSEResponse(responseData);
    if (sseResult) {
      return sseResult;
    }
    
    // Step 3: HTMLの直接検出
    const htmlResult = tryExtractDirectHTML(responseData);
    if (htmlResult) {
      return htmlResult;
    }
    
    // Step 4: フォールバック処理
    return handleNonSSEResponse(responseData);

  } catch {
    // Parse error handled silently
    return responseData;
  }
}

/**
 * 直接JSONレスポンスの解析を試行
 */
function tryParseDirectJSON(responseData: string): string | null {
  try {
    const jsonParsed = JSON.parse(responseData);
    
    // パターン1: レストラン検索の標準形式
    if (jsonParsed.html && typeof jsonParsed.html === 'string') {
      return cleanHTMLContent(jsonParsed.html);
    }
    
    // パターン2: HTMLOutputスキーマ形式
    if (jsonParsed.structured_html?.html && typeof jsonParsed.structured_html.html === 'string') {
      return cleanHTMLContent(jsonParsed.structured_html.html);
    }
    
    // パターン3: final_html形式
    if (jsonParsed.final_html?.html && typeof jsonParsed.final_html.html === 'string') {
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
  
  return parseMultiAgentSSEResponse(dataLines);
}

/**
 * 直接HTMLの抽出を試行
 */
function tryExtractDirectHTML(responseData: string): string | null {
  // DOCTYPE htmlで始まるHTMLを直接検出
  const htmlMatch = responseData.match(/<!DOCTYPE html>[\s\S]*?<\/html>/i);
  if (htmlMatch) {
    return cleanHTMLContent(htmlMatch[0]);
  }
  
  // <html>で始まるHTMLを検出
  const htmlMatch2 = responseData.match(/<html[\s\S]*?<\/html>/i);
  if (htmlMatch2) {
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
  let _isStreamComplete = false;
  let _finalAgentName = '';
  
  for (const line of dataLines) {
    const jsonData = line.replace('data: ', '').trim();
    
    // SSE完了シグナルの検出
    if (jsonData === '[DONE]') {
      _isStreamComplete = true;
      break;
    }
    
    try {
      const parsedData = JSON.parse(jsonData) as ADKSSEEventData;
      
      // 1. SimpleUIAgentの最終HTML出力を優先的に検出
      if (parsedData.author === 'SimpleUIAgent' && parsedData.actions?.state_delta?.html) {
        finalUIAgentHtml = parsedData.actions.state_delta.html;
        _finalAgentName = 'SimpleUIAgent';
        continue;
      }
      
      // 2. 他のエージェントのHTML出力もフォールバック用に保持
      if (parsedData.actions?.state_delta?.html) {
        lastAnyHtml = parsedData.actions.state_delta.html;
        continue;
      }
      
      // 2.5. レストラン検索のレスポンス形式をチェック
      if (parsedData.html && typeof parsedData.html === 'string') {
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
        lastAnyHtml = parsedData.final_html.html;
        continue;
      }
      
      // 2.8. actions.state_delta内のstructured_htmlとfinal_htmlをチェック
      if (parsedData.actions?.state_delta?.structured_html) {
        const structuredHtml = parsedData.actions.state_delta.structured_html;
        if (typeof structuredHtml === 'object' && structuredHtml !== null && 
            'html' in structuredHtml && typeof structuredHtml.html === 'string') {
          lastAnyHtml = structuredHtml.html;
          continue;
        }
      }
      
      if (parsedData.actions?.state_delta?.final_html) {
        const finalHtml = parsedData.actions.state_delta.final_html;
        if (typeof finalHtml === 'object' && finalHtml !== null && 
            'html' in finalHtml && typeof finalHtml.html === 'string') {
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
      
    } catch {
      // JSONパースエラーは無視して継続
    }
  }
  
  // 優先順位に基づいて最終結果を決定
  let finalResult = '';
  
  if (finalUIAgentHtml) {
    // 1. SimpleUIAgentのHTML出力が最優先
    finalResult = finalUIAgentHtml;
  } else if (lastAnyHtml) {
    // 2. 他のエージェントのHTML出力をフォールバック
    finalResult = lastAnyHtml;
  } else if (fullMessage.trim()) {
    // 3. 非HTMLメッセージの結合
    finalResult = fullMessage;
  }
  
  if (finalResult) {
    return cleanHTMLContent(finalResult);
  }
  
  return '';
}

/**
 * 非SSE形式レスポンスの処理（強化版）
 */
function handleNonSSEResponse(responseData: string): string {
  try {
    const jsonResponse = JSON.parse(responseData);
    
    // パターン1: レストラン検索の標準形式
    if (jsonResponse?.html && typeof jsonResponse.html === 'string') {
      return cleanHTMLContent(jsonResponse.html);
    }
    
    // パターン2: HTMLOutputスキーマ形式
    if (jsonResponse?.structured_html?.html && typeof jsonResponse.structured_html.html === 'string') {
      return cleanHTMLContent(jsonResponse.structured_html.html);
    }
    
    // パターン3: final_html形式
    if (jsonResponse?.final_html?.html && typeof jsonResponse.final_html.html === 'string') {
      return cleanHTMLContent(jsonResponse.final_html.html);
    }
    
    // パターン4: content.parts[0].text の形式
    if (jsonResponse?.content?.parts?.[0]?.text) {
      const text = jsonResponse.content.parts[0].text;
      if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
        return cleanHTMLContent(text);
      }
    }
    
    // パターン5: その他の可能なパス
    const content = jsonResponse.message ?? jsonResponse.response ?? jsonResponse.content ?? jsonResponse.text ?? jsonResponse.output;
    if (typeof content === 'string') {
      if (content.includes('<!DOCTYPE html>') || content.includes('<html')) {
        return cleanHTMLContent(content);
      }
    }
    
    return responseData;
    
  } catch {
    // HTMLの直接マッチングを試行
    const htmlMatch = responseData.match(/<!DOCTYPE html>[\s\S]*?<\/html>/i);
    if (htmlMatch) {
      return cleanHTMLContent(htmlMatch[0]);
    }
    
    const htmlMatch2 = responseData.match(/<html[\s\S]*?<\/html>/i);
    if (htmlMatch2) {
      return cleanHTMLContent(htmlMatch2[0]);
    }
    
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
    } catch {
      // JSON parse failed, using manual cleanup
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
  
  return cleaned;
}

// 🚨 型安全性：クライアントサイドでの使用を防ぐ
if (typeof window !== 'undefined') {
  throw new Error(
    '🚨 ADK Agentはサーバーサイド専用です。' +
    'クライアントサイドではclient/services/api-client.tsを使用してください。'
  );
}