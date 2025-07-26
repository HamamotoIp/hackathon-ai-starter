/**
 * Vertex AI Provider - サーバーサイド専用
 * 🔒 API Routes内でのみ実行される
 */

import { VertexAI } from '@google-cloud/vertexai';

export class VertexAIProvider {
  private vertexAI: VertexAI;
  
  constructor() {
    const projectId = process.env.VERTEX_AI_PROJECT_ID;
    const location = process.env.VERTEX_AI_LOCATION ?? 'us-central1';
    
    if (!projectId) {
      throw new Error('VERTEX_AI_PROJECT_ID環境変数が設定されていません');
    }
    
    this.vertexAI = new VertexAI({
      project: projectId,
      location
    });
  }
  
  /**
   * テキスト生成 - サーバーサイド専用処理
   */
  async generateText(message: string): Promise<string> {
    try {
      const model = this.vertexAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash-exp' 
      });
      
      const result = await model.generateContent(message);
      const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        throw new Error('Vertex AIからの応答が空です');
      }
      
      return text;
    } catch (error) {
      throw new Error(`Vertex AI処理エラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * ファクトリー関数 - API Routesでの使用
 */
export function createVertexAIProvider(): VertexAIProvider {
  return new VertexAIProvider();
}

// 🚨 型安全性：クライアントサイドでの使用を防ぐ
if (typeof window !== 'undefined') {
  throw new Error(
    '🚨 VertexAIProviderはサーバーサイド専用です。' +
    'クライアントサイドではclient/services/api-client.tsを使用してください。'
  );
}