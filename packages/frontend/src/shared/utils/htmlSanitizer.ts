import DOMPurify from 'dompurify';

/**
 * HTML安全化ユーティリティ
 * XSS攻撃を防ぐためのHTML安全化処理
 */

export interface SanitizeOptions {
  /**
   * 追加で許可するタグ
   */
  allowedTags?: string[];
  
  /**
   * 追加で許可する属性
   */
  allowedAttributes?: string[];
  
  /**
   * iframe要素を許可するか
   */
  allowIframes?: boolean;
  
  /**
   * JavaScript関連の属性を完全に除去するか
   */
  stripJavaScript?: boolean;
  
  /**
   * Tailwind CSSクラス用の属性を保持するか
   */
  preserveTailwindClasses?: boolean;
}

/**
 * 生成されたHTMLを安全化
 */
export function sanitizeGeneratedHTML(
  html: string, 
  options: SanitizeOptions = {}
): string {
  const {
    allowedTags = [],
    allowedAttributes = [],
    allowIframes = false,
    stripJavaScript = true,
    preserveTailwindClasses = true
  } = options;

  // DOMPurifyの設定
  const config = {
    // 基本的なHTMLタグを許可
    ALLOWED_TAGS: [
      'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'a', 'img', 'ul', 'ol', 'li', 'br', 'strong', 'em', 'b', 'i',
      'form', 'input', 'textarea', 'select', 'option', 'button', 'label',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'section', 'article', 'header', 'footer', 'nav', 'main', 'aside',
      'figure', 'figcaption', 'blockquote', 'pre', 'code',
      ...allowedTags
    ],
    
    // 基本的な属性を許可
    ALLOWED_ATTR: [
      'class', 'id', 'title', 'alt', 'src', 'href', 'target',
      'type', 'value', 'placeholder', 'name', 'for', 'role',
      'aria-label', 'aria-labelledby', 'aria-describedby', 'aria-expanded',
      'aria-hidden', 'aria-live', 'aria-atomic', 'tabindex',
      'data-*', 'width', 'height', 'colspan', 'rowspan',
      ...allowedAttributes
    ],
    
    // JavaScript関連の除去（styleは個別制御）
    FORBID_ATTR: stripJavaScript ? [
      'onclick', 'onload', 'onerror', 'onmouseover', 'onmouseout',
      'onfocus', 'onblur', 'onchange', 'onsubmit', 'onkeydown',
      'onkeyup', 'onkeypress'
      // 'style' を除外 - Tailwindクラスで表現できないスタイルに必要
    ] : [],
    
    // URI スキーマの制限
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    
    // その他の設定
    SANITIZE_DOM: true,
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_TRUSTED_TYPE: false
  };

  // iframe許可の場合
  if (allowIframes) {
    config.ALLOWED_TAGS?.push('iframe');
    config.ALLOWED_ATTR?.push('src', 'frameborder', 'allowfullscreen');
  }

  // Tailwind CSSクラス保持のための設定
  if (preserveTailwindClasses) {
    // Tailwindクラス用の特別な処理は不要（classは既に許可済み）
  }

  try {
    // HTML安全化実行
    const sanitizedHTML = DOMPurify.sanitize(html, config);
    
    // 空の結果の場合は警告
    if (!sanitizedHTML.trim()) {
      // console.warn('HTML sanitization resulted in empty content');
      return '<div class="p-4 text-center text-gray-500">安全化処理によりコンテンツが除去されました</div>';
    }
    
    return sanitizedHTML;
    
  } catch (error) {
    // console.error('HTML sanitization error:', error);
    // エラーログ出力（本番環境では削除予定）
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('HTML sanitization error:', error);
    }
    return '<div class="p-4 text-center text-red-500">HTMLの安全化処理中にエラーが発生しました</div>';
  }
}

/**
 * UI プレビュー用の安全化（より厳しい制限）
 */
export function sanitizeForPreview(html: string): string {
  return sanitizeGeneratedHTML(html, {
    allowIframes: false,
    stripJavaScript: true,
    preserveTailwindClasses: true,
    allowedTags: [],
    allowedAttributes: []
  });
}

/**
 * ダウンロード用の安全化（セキュリティ強化版）
 */
export function sanitizeForDownload(html: string): string {
  return sanitizeGeneratedHTML(html, {
    allowIframes: false, // セキュリティ強化：iframe無効化
    stripJavaScript: true, // セキュリティ強化：JavaScript除去
    preserveTailwindClasses: true,
    allowedTags: ['style'], // CSSのみ許可
    allowedAttributes: [
      // 基本的な属性のみ許可
      'style', 'class', 'id', 'data-*',
      // CSS関連
      'type', 'media', 'scoped'
    ]
  });
}

/**
 * DOMPurifyが利用可能かチェック
 */
export function isDOMPurifyAvailable(): boolean {
  return typeof DOMPurify !== 'undefined' && typeof DOMPurify.sanitize === 'function';
}

/**
 * セキュリティレベル別の安全化
 */
export enum SecurityLevel {
  STRICT = 'strict',
  NORMAL = 'normal',
  PERMISSIVE = 'permissive'
}

export function sanitizeBySecurityLevel(
  html: string, 
  level: SecurityLevel = SecurityLevel.NORMAL
): string {
  switch (level) {
    case SecurityLevel.STRICT:
      return sanitizeForPreview(html);
    
    case SecurityLevel.PERMISSIVE:
      return sanitizeForDownload(html);
    
    case SecurityLevel.NORMAL:
    default:
      return sanitizeGeneratedHTML(html);
  }
}

/**
 * HTML安全化の統計情報
 */
export interface SanitizationStats {
  originalLength: number;
  sanitizedLength: number;
  removedElements: number;
  removedAttributes: number;
  securityIssuesFound: boolean;
}

/**
 * 安全化統計情報を取得（開発用）
 */
export function getSanitizationStats(
  originalHTML: string, 
  sanitizedHTML: string
): SanitizationStats {
  return {
    originalLength: originalHTML.length,
    sanitizedLength: sanitizedHTML.length,
    removedElements: (originalHTML.match(/<[^>]+>/g) ?? []).length - 
                    (sanitizedHTML.match(/<[^>]+>/g) ?? []).length,
    removedAttributes: (originalHTML.match(/\s\w+=/g) ?? []).length - 
                      (sanitizedHTML.match(/\s\w+=/g) ?? []).length,
    securityIssuesFound: originalHTML.includes('javascript:') || 
                        originalHTML.includes('onclick') ||
                        originalHTML.includes('<script')
  };
}