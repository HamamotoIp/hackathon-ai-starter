import { VertexAI } from '@google-cloud/vertexai';
import { GoogleAuth } from 'google-auth-library';
import { 
  AIFeatureRequest, 
  AIFeatureResponse, 
  AIFeatureType,
  UIGenerationResult,
  getFeatureConfig,
  isUIGenerationFeature
} from '@/core/types/aiTypes';
import { getADKServiceUrl } from './aiProcessorConfig';

export interface AIProcessorConfig {
  vertexAI?: {
    projectId: string;
    location: string;
  };
  adkServices?: {
    analysis: string;
    uiGeneration: string;
  };
}

/**
 * AI処理の統合ライブラリ
 * 機能ベースでVertex AIとADKを使い分け
 */
export class AIProcessor {
  private vertexAI?: VertexAI;
  private adkServiceUrls?: {
    analysis: string;
    uiGeneration: string;
  };
  private auth?: GoogleAuth;

  constructor(config: AIProcessorConfig) {
    // Vertex AI設定の検証
    if (!config.vertexAI?.projectId) {
      throw new Error('Vertex AI設定が不正です。プロジェクトIDが設定されていません。');
    }
    
    // ADKサービス設定の検証
    if (!config.adkServices) {
      throw new Error('ADKサービス設定が不正です。サービスURLが設定されていません。');
    }

    try {
      this.vertexAI = new VertexAI({
        project: config.vertexAI.projectId,
        location: config.vertexAI.location,
      });
      
      // Google Cloud認証初期化
      this.auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform']
      });
    } catch (error) {
      throw new Error(`Vertex AI初期化エラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    this.adkServiceUrls = config.adkServices;
  }

  /**
   * 機能ベースでAI処理を実行
   */
  async processFeature(request: AIFeatureRequest): Promise<AIFeatureResponse> {
    const startTime = Date.now();
    const config = getFeatureConfig(request.feature);
    
    try {
      if (config.processingMode === "vertex_direct") {
        return await this.processWithVertexAI(request, startTime);
      } else {
        return await this.processWithADK(request, startTime);
      }
    } catch (error) {
      return this.createErrorResponse(request, startTime, error);
    }
  }

  private async processWithVertexAI(
    request: AIFeatureRequest, 
    startTime: number
  ): Promise<AIFeatureResponse> {
    if (!this.vertexAI) {
      throw new Error('Vertex AI が初期化されていません。');
    }

    try {
      const model = this.vertexAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash-exp' 
      });
      
      // 機能に応じたプロンプト調整
      const prompt = this.createPromptForFeature(request);
      
      const result = await model.generateContent(prompt);
      const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No response';
      
      return {
        success: true,
        feature: request.feature,
        result: responseText,
        processingMode: 'vertex_direct',
        processingTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        sessionId: request.sessionId,
      } as AIFeatureResponse;
    } catch (error: unknown) {
      // Vertex AI固有のエラーハンドリング
      if (error instanceof Error && (error.message?.includes('403') || error.message?.includes('PERMISSION_DENIED'))) {
        throw new Error(
          'Vertex AI API の権限が不足しています。\n\n' +
          '解決方法:\n' +
          '1. API有効化: gcloud services enable aiplatform.googleapis.com\n' +
          '2. 権限付与: gcloud projects add-iam-policy-binding YOUR-PROJECT-ID --member="user:YOUR-EMAIL" --role="roles/aiplatform.user"\n' +
          '3. 自動設定: ./setup.sh を実行\n\n' +
          `詳細エラー: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
      
      if (error instanceof Error && (error.message?.includes('404') || error.message?.includes('NOT_FOUND'))) {
        throw new Error(
          'Vertex AI リソースが見つかりません。\n\n' +
          '確認事項:\n' +
          '1. プロジェクトIDが正しいか確認\n' +
          '2. リージョンが正しいか確認\n' +
          '3. Vertex AI APIが有効化されているか確認\n\n' +
          `詳細エラー: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
      
      // その他のVertex AIエラー
      throw new Error(`Vertex AI処理エラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async processWithADK(
    request: AIFeatureRequest, 
    startTime: number
  ): Promise<AIFeatureResponse> {
    if (!this.adkServiceUrls) {
      throw new Error('ADKサービスURLが設定されていません。');
    }

    // 機能に応じたエンドポイントを取得
    const serviceUrl = this.getADKServiceUrl(request.feature);
    if (!serviceUrl) {
      throw new Error(`機能 ${request.feature} に対応するADKサービスURLが見つかりません。`);
    }

    // 固定ユーザーIDを使用（動作確認用）
    const userId = 'demo-user';
    
    try {
      // Step 1: セッション作成
      const sessionId = await this.createADKSession(userId, serviceUrl);
      
      // Step 2: メッセージ送信
      const response = await this.sendADKMessage(sessionId, userId, request.input, request, serviceUrl);
      
      // UI生成機能の場合は構造化データとして解析
      let result: string | UIGenerationResult = response;
      
      if (isUIGenerationFeature(request.feature)) {
        // eslint-disable-next-line no-console
        console.log('ADK Raw Response:', response.substring(0, 500));
        try {
          const parsedResponse = JSON.parse(response);
          // eslint-disable-next-line no-console
          console.log('Parsed Response:', parsedResponse);
          if (typeof parsedResponse === 'object' && parsedResponse !== null && 'html' in parsedResponse) {
            result = parsedResponse as UIGenerationResult;
            // eslint-disable-next-line no-console
            console.log('Successfully parsed as UIGenerationResult');
          } else {
            // eslint-disable-next-line no-console
            console.log('Response format not matching UIGenerationResult');
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.log('JSON parse failed:', error);
          // JSON解析失敗時は文字列のまま
        }
      }
      
      return {
        success: true,
        feature: request.feature,
        result,
        processingMode: 'adk_agent',
        processingTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        sessionId: request.sessionId,
      } as AIFeatureResponse;
      
    } catch (error: unknown) {
      throw error;
    }
  }

  /**
   * 機能に応じたADKサービスURLを取得
   */
  private getADKServiceUrl(feature: AIFeatureType): string | null {
    return getADKServiceUrl(feature);
  }

  private async createADKSession(userId: string, serviceUrl: string): Promise<string> {
    // Agent Engine REST API でのセッション作成
    const sessionUrl = serviceUrl.replace(':streamQuery?alt=sse', ':query');
    
    const requestBody = {
      class_method: "create_session",
      input: {
        user_id: userId
      }
    };

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('=== Creating ADK Session ===');
      // eslint-disable-next-line no-console
      console.log('Session URL:', sessionUrl);
      // eslint-disable-next-line no-console
      console.log('User ID:', userId);
    }

    const accessToken = await this.getVertexAIAccessToken();
    
    try {
      const response = await fetch(sessionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`セッション作成失敗: HTTP ${response.status} ${response.statusText}`);
      }

      const sessionData = await response.json();
      
      // Agent Engineから返されたセッションIDを使用
      const actualSessionId = sessionData.output?.id;
      if (!actualSessionId) {
        throw new Error('セッションIDがレスポンスに含まれていません');
      }
      
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('Session Created Successfully:', actualSessionId);
      }
      
      return actualSessionId;
      
    } catch (error) {
      // セッション作成に失敗した場合はエラーを再スロー
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('ADK Session creation failed:', error);
      }
      throw new Error(`ADKセッション作成に失敗しました: ${error}`);
    }
  }

  private async sendADKMessage(sessionId: string, userId: string, message: string, request?: AIFeatureRequest, serviceUrl?: string): Promise<string> {
    // メッセージ送信用エンドポイント（:streamQuery?alt=sseを使用）
    const messageUrl = serviceUrl ?? this.getADKServiceUrl(request?.feature ?? 'analysis_report') ?? '';
    
    // メッセージの構造化（UI生成対応）
    let finalMessage = message;
    
    if (request && request.feature === "ui_generation") {
      // UI生成リクエストをJSON構造化メッセージとして送信
      const structuredMessage = {
        type: "ui_generation",
        user_prompt: message,
        ui_type: "auto",
        framework: "html", 
        responsive: true,
        color_scheme: "light"
      };
      finalMessage = JSON.stringify(structuredMessage);
      
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('Structured UI Generation Message:', finalMessage);
      }
    }

    // Agent Engine標準のリクエスト構造（セッション情報含む）
    const requestBody = {
      class_method: "stream_query",
      input: {
        message: finalMessage,    // 修正: 'input' -> 'message' (AGENT_ENGINE_API_PATTERNS.mdに基づく)
        user_id: userId,
        session_id: sessionId
      }
    };

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('=== Sending ADK Message ===');
      // eslint-disable-next-line no-console
      console.log('Message URL:', messageUrl);
      // eslint-disable-next-line no-console
      console.log('Session ID:', sessionId);
      // eslint-disable-next-line no-console
      console.log('Message:', message.substring(0, 100));
    }

    const accessToken = await this.getVertexAIAccessToken();

    const response = await fetch(messageUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(requestBody),
    });

    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('=== ADK Message Response ===');
      // eslint-disable-next-line no-console
      console.log('Response Status:', response.status);
      // eslint-disable-next-line no-console
      console.log('Response StatusText:', response.statusText);
    }

    if (!response.ok) {
      let errorText = 'レスポンス読み取りエラー';
      try {
        errorText = await response.text();
      } catch {
        errorText = `HTTP ${response.status} ${response.statusText}`;
      }
      throw new Error(`メッセージ送信失敗: ${response.status} - ${errorText}`);
    }

    // レスポンス解析
    let responseText = 'No response';
    let responseText_raw = '';

    try {
      responseText_raw = await response.text();
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('ADK Message Response Raw:', responseText_raw.substring(0, 500));
      }

      const data = JSON.parse(responseText_raw);
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('ADK Message Response JSON:', JSON.stringify(data, null, 2).substring(0, 500));
      }

      // Agent Engine標準形式: { input: "...", output: "..." }
      if (typeof data === 'object' && data !== null) {
        const obj = data as Record<string, unknown>;
        if (typeof obj.output === 'string') {
          responseText = obj.output;
        } else if (obj.content && typeof obj.content === 'object' && obj.content !== null) {
          // フォールバック: content.parts[0].text 形式
          const content = obj.content as Record<string, unknown>;
          if (Array.isArray(content.parts) && content.parts.length > 0) {
            const firstPart = content.parts[0] as Record<string, unknown>;
            if (typeof firstPart.text === 'string') {
              responseText = firstPart.text;
            }
          }
        }
      }

    } catch {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log('JSON解析失敗、生テキスト使用:', responseText_raw.substring(0, 500));
      }
      responseText = responseText_raw || 'Empty response';
    }

    // UI生成機能の場合は構造化データ解析を試行
    const parsedResponse = this.parseADKResponse(responseText, request?.feature ?? 'analysis_report');
    
    // 構造化データの場合はJSON文字列として返す（フロントエンドで再解析）
    if (typeof parsedResponse === 'object') {
      return JSON.stringify(parsedResponse);
    }
    
    return responseText;
  }

  /**
   * Vertex AI アクセストークンを取得
   */
  private async getVertexAIAccessToken(): Promise<string> {
    if (!this.auth) {
      throw new Error('Google Cloud認証が初期化されていません');
    }
    
    try {
      const client = await this.auth.getClient();
      const accessTokenResponse = await client.getAccessToken();
      
      if (!accessTokenResponse.token) {
        throw new Error('アクセストークンの取得に失敗しました');
      }
      
      return accessTokenResponse.token;
    } catch (error) {
      throw new Error(`認証エラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * ADKレスポンスをUI生成機能用に解析
   */
  private parseADKResponse(responseText: string, feature: AIFeatureType): string | Record<string, unknown> {
    if (feature === 'ui_generation') {
      try {
        // まず直接JSON解析を試行
        const parsed = JSON.parse(responseText);
        
        // ADKエージェントから構造化データが返される場合
        if (typeof parsed === 'object' && parsed !== null) {
          // success: true, result: {...} 形式の場合
          if ('result' in parsed && typeof parsed.result === 'object') {
            return parsed.result as Record<string, unknown>;
          }
          // 直接HTML + metadataが返される場合
          if ('html' in parsed) {
            return parsed as Record<string, unknown>;
          }
        }
        
        // その他の場合は解析失敗として文字列で返す
        return responseText;
      } catch {
        // JSON解析失敗時は、JSONブロックを抽出して再試行
        try {
          // ```json { ... } ``` 形式のJSONブロックを抽出
          const jsonMatch = responseText.match(/```json\s*(\{[\s\S]*?\})\s*```/);
          if (jsonMatch?.[1]) {
            const jsonStr = jsonMatch[1];
            const parsed = JSON.parse(jsonStr);
            if (typeof parsed === 'object' && parsed !== null && 'html' in parsed) {
              return parsed as Record<string, unknown>;
            }
          }
          
          // 単純な { ... } パターンを抽出
          const simpleJsonMatch = responseText.match(/(\{[\s\S]*?\})/);
          if (simpleJsonMatch?.[1]) {
            const jsonStr = simpleJsonMatch[1];
            const parsed = JSON.parse(jsonStr);
            if (typeof parsed === 'object' && parsed !== null && 'html' in parsed) {
              return parsed as Record<string, unknown>;
            }
          }
        } catch {
          // すべての解析が失敗した場合
        }
        
        // JSON解析失敗時は文字列として返す
        return responseText;
      }
    }
    
    // UI生成以外の機能は従来通り文字列で返す
    return responseText;
  }


  private createPromptForFeature(request: AIFeatureRequest): string {
    switch (request.feature) {
      case 'basic_chat':
        return request.input;
      case 'analysis_report':
        return `以下の内容について詳細な分析レポートを作成してください：\n\n${request.input}`;
      case 'ui_generation':
        return `以下の要求に基づいてHTML/Reactコンポーネントを生成してください：\n\n${request.input}`;
      default:
        // TypeScriptのexhaustive checkを満たすため
        return (request as AIFeatureRequest).input;
    }
  }

  private createErrorResponse(
    request: AIFeatureRequest,
    startTime: number,
    error: unknown
  ): AIFeatureResponse {
    return {
      success: false,
      feature: request.feature,
      result: `エラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`,
      processingMode: 'vertex_direct',
      processingTimeMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
      sessionId: request.sessionId,
    } as AIFeatureResponse;
  }
}

// シングルトンインスタンス
let aiProcessorInstance: AIProcessor | null = null;

/**
 * AI処理インスタンスを取得（シングルトン）
 */
/**
 * 環境変数を検証
 */
function validateEnvironmentVariables(): void {
  const requiredVars = {
    VERTEX_AI_PROJECT_ID: process.env.VERTEX_AI_PROJECT_ID,
    ANALYSIS_AGENT_URL: process.env.ANALYSIS_AGENT_URL,
    UI_GENERATION_AGENT_URL: process.env.UI_GENERATION_AGENT_URL,
  };

  const missingVars = Object.entries(requiredVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(
      `環境変数が設定されていません: ${missingVars.join(', ')}\n\n` +
      '解決方法:\n' +
      '1. .env.local ファイルで環境変数を設定してください\n' +
      '2. 本番環境では Cloud Run の環境変数を確認してください\n' +
      '3. 各機能専用のAgent Engineをデプロイしてください'
    );
  }
}

export function getAIProcessor(): AIProcessor {
  // 環境変数検証
  validateEnvironmentVariables();

  aiProcessorInstance ??= new AIProcessor({
    vertexAI: {
      projectId: process.env.VERTEX_AI_PROJECT_ID!,
      location: process.env.VERTEX_AI_LOCATION ?? 'us-central1',
    },
    adkServices: {
      analysis: process.env.ANALYSIS_AGENT_URL!,
      uiGeneration: process.env.UI_GENERATION_AGENT_URL!,
    },
  });
  return aiProcessorInstance;
}