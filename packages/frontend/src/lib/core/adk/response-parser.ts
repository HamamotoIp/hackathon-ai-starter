/**
 * ADK Agentレスポンス解析
 * 複雑なSSEレスポンスとHTMLエスケープ処理
 */

import type { ADKSSEEventData } from '@/lib/types/adk';

/**
 * ADKレスポンス解析（完全再構築版）
 */
export function parseADKResponse(responseData: string): string {
  
  try {
    // Step 1: 直接JSONレスポンスのチェック（最優先）
    const directResult = tryParseDirectJSON(responseData);
    if (directResult) {
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
    
    // HTML系のパターン（レストラン検索・UI生成）
    const htmlPatterns = [
      jsonParsed.html,
      jsonParsed.structured_html?.html,
      jsonParsed.final_html?.html
    ];
    
    for (const htmlContent of htmlPatterns) {
      if (htmlContent && typeof htmlContent === 'string') {
        return cleanHTMLContent(htmlContent);
      }
    }
    
    // テキスト系のパターン（分析機能）
    const textContent = jsonParsed.content?.parts?.[0]?.text;
    if (textContent && typeof textContent === 'string') {
      return textContent;
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
export function cleanHTMLContent(content: string): string {
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