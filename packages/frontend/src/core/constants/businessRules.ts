/**
 * Business Rules Constants
 * 🔴 人間が管理：ビジネスルール定数（フロントエンド専用）
 */

export const BUSINESS_RULES = {
  MAX_MESSAGES_PER_SESSION: 1000,
  MAX_MESSAGE_LENGTH: 10000,
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  SUPPORTED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/gif"],
  SESSION_TIMEOUT_HOURS: 24,
} as const;

export const AI_MODES = {
  VERTEX: "vertex",
  ADK: "adk",
} as const;

export const MESSAGE_ROLES = {
  USER: "user",
  ASSISTANT: "assistant",
} as const;

export const DEFAULT_WELCOME_MESSAGE = "こんにちは！AIチャットボットです。Vertex AI直接統合またはADKエージェントシステムを選択してご利用ください。";

export const ERROR_MESSAGES = {
  UNAUTHORIZED: "このセッションにアクセスする権限がありません",
  MESSAGE_LIMIT_EXCEEDED: "メッセージ上限に達しました",
  INVALID_MESSAGE: "有効なメッセージを入力してください",
  CHAT_ACCESS_DENIED: "チャットアクセス権限がありません",
} as const;