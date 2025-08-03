import DOMPurify from 'dompurify';

/**
 * HTMLコンテンツを安全にサニタイズする
 * XSS攻撃を防ぐためのセキュリティレイヤー
 */
export function sanitizeHTML(html: string): string {
  // サーバーサイドの場合はそのまま返す（DOMPurifyはブラウザ環境でのみ動作）
  if (typeof window === 'undefined') {
    return html;
  }

  // DOMPurify設定
  const config = {
    // 許可するタグ（レストラン記事で使用する可能性のあるもの）
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'ul', 'ol', 'li',
      'strong', 'em', 'b', 'i', 'u',
      'a', 'img',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span', 'section', 'article', 'header', 'footer', 'main',
      'blockquote', 'pre', 'code',
      'style', // Tailwind CSSのために必要
    ],
    // 許可する属性
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title',
      'class', 'id', 'style',
      'target', 'rel',
      'width', 'height',
    ],
    // 安全なプロトコルのみ許可
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    // data URLは画像のみ許可
    ADD_TAGS: ['style'],
    ADD_ATTR: ['target'],
    // scriptタグとイベントハンドラーを確実に削除
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  };

  // サニタイズ実行
  const clean = DOMPurify.sanitize(html, config);
  
  return clean;
}

/**
 * 厳格なサニタイズ（テキストのみ許可）
 */
export function sanitizeText(text: string): string {
  if (typeof window === 'undefined') {
    return text;
  }
  
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}