/**
 * Cloud Storage + Firestore保存結果のタイプ定義
 */

export interface SavedRestaurantResult {
  id: string;
  query: string;
  searchParams: {
    area?: string;
    scene?: string;
    time?: string;
    requests?: string[];
  };
  htmlStorageUrl: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  isPublic: boolean;
  metadata: {
    processingTimeMs: number;
    agentVersion: string;
  };
}

export interface SaveResultRequest {
  htmlContent: string;
  query: string;
  searchParams?: Record<string, string | string[]>;
  title?: string;
  processingTimeMs?: number;
}

export interface SaveResultResponse {
  success: boolean;
  resultId: string;
  url: string;
  htmlUrl: string;
  title: string;
}

export interface HistoryResponse {
  success: boolean;
  results: SavedRestaurantResult[];
  totalCount: number;
  availableTags: string[];
}