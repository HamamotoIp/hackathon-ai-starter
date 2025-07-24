/**
 * Core Domain Layer
 * 🔴 人間が管理：フロントエンド用ドメインレイヤーの統一エクスポート
 */

// Types
export type {
  DomainEvent,
} from "./types";

export {
  DomainError,
  ValidationError,
  AuthorizationError,
  BusinessRuleError,
} from "./types";

// Constants
export {
  BUSINESS_RULES,
} from "./constants/businessRules";

// AI機能の開発ガイドライン
export const AI_DEVELOPMENT_GUIDELINES = {
  humanResponsibility: [
    "AI機能の設計（core/types/AIFeatures.ts）",
    "AI処理ロジック（server/lib/aiProcessor.ts）",
    "ビジネスルールの定義（core/constants/）",
    "データ整合性の保証",
  ],
  aiResponsibility: [
    "UIコンポーネントの実装（ui/components/）",
    "API Routes実装（app/api/）",
    "スタイリングの適用",
    "フォーム処理の実装",
  ],
  architecture: [
    "core/は人間が管理するビジネスロジック",
    "ui/はAIが管理するプレゼンテーション層",
    "server/はサーバーサイド処理",
    "app/api/はAPI Routes",
    "shared/は共通コード",
  ],
  aiFeatures: [
    "basic_chat: Vertex AI直接（高速・シンプル）",
    "analysis_report: ADK Agent（複雑処理）",
    "comparison_study: ADK Agent（マルチエージェント）",
  ],
} as const;