/**
 * 汎用的な型定義
 * 他のサービスでも再利用可能な基本型
 */

// ===== 基本型 =====
export type ID = string;
export type Timestamp = Date;
export type URL = string;

// ===== ユーザー型 =====
export interface User {
  id: ID;
  name?: string;
  email?: string;
  avatar?: URL;
  role: 'user' | 'admin' | 'moderator';
  isAnonymous: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ===== メッセージ型 =====
export type MessageType = 'text' | 'image' | 'file' | 'system' | 'custom';

export interface MessageContent {
  text?: string;
  imageUrl?: URL;
  fileUrl?: URL;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  metadata?: Record<string, unknown>;
}

export interface BaseMessage {
  id: ID;
  type: MessageType;
  author: {
    id: ID;
    name: string;
    role: 'user' | 'assistant' | 'system';
    avatar?: URL;
  };
  content: MessageContent;
  timestamp: Timestamp;
  conversationId?: ID;
  parentId?: ID; // 返信機能用
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  metadata?: Record<string, unknown>;
}

// ===== 会話型 =====
export interface Conversation {
  id: ID;
  title: string;
  participants: User[];
  messages: BaseMessage[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isArchived: boolean;
  metadata?: Record<string, unknown>;
}

// ===== ファイル型 =====
export interface FileUpload {
  id: ID;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  url: URL;
  uploadedBy: ID;
  uploadedAt: Timestamp;
  metadata?: Record<string, unknown>;
}

// ===== AI型 =====
export interface AIProvider {
  id: string;
  name: string;
  type: 'text' | 'image' | 'multimodal';
  model: string;
  maxTokens?: number;
  temperature?: number;
  metadata?: Record<string, unknown>;
}

export interface AIResponse {
  id: ID;
  provider: string;
  model: string;
  content: string;
  tokensUsed?: number;
  processingTime?: number;
  timestamp: Timestamp;
  metadata?: Record<string, unknown>;
}

// ===== 認証型 =====
export interface AuthProvider {
  signIn: (credentials?: Record<string, unknown>) => Promise<User>;
  signOut: () => Promise<void>;
  getCurrentUser: () => Promise<User | null>;
  onAuthStateChanged: (callback: (user: User | null) => void) => () => void;
  getIdToken: () => Promise<string>;
}

// ===== アップロード型 =====
export interface UploadProvider {
  upload: (file: File, path?: string) => Promise<FileUpload>;
  delete: (fileId: ID) => Promise<void>;
  getDownloadUrl: (fileId: ID) => Promise<URL>;
}

// ===== 設定型 =====
export interface AppConfig {
  app: {
    name: string;
    version: string;
    description: string;
    theme: 'light' | 'dark' | 'auto';
  };
  auth: {
    provider: 'firebase' | 'auth0' | 'supabase' | 'custom';
    allowAnonymous: boolean;
    sessionTimeout: number;
  };
  ai: {
    provider: 'vertex-ai' | 'openai' | 'anthropic' | 'custom';
    model: string;
    location?: string;
    maxTokens?: number;
    temperature?: number;
  };
  storage: {
    provider: 'gcs' | 'aws-s3' | 'cloudflare-r2' | 'custom';
    bucket: string;
    maxFileSize: number;
    allowedMimeTypes: string[];
  };
  features: {
    chat: boolean;
    imageUpload: boolean;
    fileUpload: boolean;
    multiUser: boolean;
    realTime: boolean;
    search: boolean;
  };
}

// ===== エラー型 =====
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: Timestamp;
}

// ===== API型 =====
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: AppError;
  timestamp: Timestamp;
}

// ===== チャット特化型（後方互換性） =====
export interface ChatMessage extends BaseMessage {
  role: 'user' | 'assistant';
  imageUrl?: URL;
}

// ===== フック型 =====
export interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  error: AppError | null;
  signIn: (credentials?: Record<string, unknown>) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  token: string | null;
}

export interface UseMessagesReturn {
  messages: BaseMessage[];
  isLoading: boolean;
  error: AppError | null;
  sendMessage: (content: MessageContent) => Promise<void>;
  deleteMessage: (messageId: ID) => Promise<void>;
  updateMessage: (messageId: ID, content: MessageContent) => Promise<void>;
  initializeWithWelcomeMessage: () => void;
}

export interface UseFileUploadReturn {
  upload: (file: File) => Promise<FileUpload>;
  isUploading: boolean;
  progress: number;
  error: AppError | null;
  clearError: () => void;
}