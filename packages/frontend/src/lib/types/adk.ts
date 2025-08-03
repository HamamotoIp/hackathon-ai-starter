/**
 * ADK Agent共通型定義
 * Google ADK (Agent Development Kit) 関連の型
 */

// =============================================================================
// ADK Agent専用型（サーバーサイドで使用）
// =============================================================================

/** ADKセッション作成リクエスト */
export interface ADKCreateSessionRequest {
  class_method: 'create_session';
  input: {
    user_id: string;
  };
}

/** ADKセッション情報 */
export interface ADKSessionInfo {
  id: string;
  userId: string;
  state: Record<string, unknown>;
  appName: string;
  events: unknown[];
}

/** ADKセッション作成レスポンス */
export interface ADKCreateSessionResponse {
  output: ADKSessionInfo;
}

/** ADKクエリ実行リクエスト */
export interface ADKStreamQueryRequest {
  class_method: 'stream_query';
  input: {
    message: string;
    session_id: string;
    user_id: string;
  };
}

/** ADK SSEイベントデータ（エスケープ問題解決対応）
 * 
 * Tourism Spots Search Agentの6段階処理に対応：
 * - 各エージェントのレスポンスを適切に解析
 * - HTMLOutputスキーマ（structured_html, final_html）に対応
 * - 1行形式HTML出力に対応
 * - シンプル化されたエスケープ除去処理に対応
 */
export interface ADKSSEEventData {
  message?: string;
  response?: string;
  content?: string | {
    parts?: Array<{
      text?: string;
    }>;
  };
  text?: string;
  output?: string;
  html?: string;  // 観光スポット検索レスポンス用
  author?: string;
  invocation_id?: string;
  id?: string;
  timestamp?: number;
  actions?: {
    state_delta?: {
      html?: string;
      structured_html?: unknown;  // Pydanticスキーマレスポンス
      final_html?: unknown;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  // HTMLOutputスキーマレスポンス用
  structured_html?: {
    html?: string;
  };
  final_html?: {
    html?: string;
  };
}