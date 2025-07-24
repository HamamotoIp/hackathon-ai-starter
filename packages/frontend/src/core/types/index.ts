/**
 * Core Types Index
 * 🔴 人間が管理：コア型定義の統一エクスポート（フロントエンド専用）
 */

// AI Feature types
export * from "./AIFeatures";

// Domain events (将来的な拡張用)
export interface DomainEvent {
  type: string;
  aggregateId: string;
  occurredAt: Date;
  data: Record<string, unknown>;
}

// Domain errors
export class DomainError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = "DomainError";
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR");
  }
}

export class AuthorizationError extends DomainError {
  constructor(message: string) {
    super(message, "AUTHORIZATION_ERROR");
  }
}

export class BusinessRuleError extends DomainError {
  constructor(message: string) {
    super(message, "BUSINESS_RULE_ERROR");
  }
}