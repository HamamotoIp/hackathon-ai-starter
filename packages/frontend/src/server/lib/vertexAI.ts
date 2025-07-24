/**
 * Vertex AI処理ヘルパー
 * Basic Chat用のシンプルなVertex AI呼び出し
 */

import { VertexAI } from '@google-cloud/vertexai';

/**
 * Vertex AIでテキスト生成
 */
export async function generateText(message: string): Promise<string> {
  if (!process.env.VERTEX_AI_PROJECT_ID) {
    throw new Error('VERTEX_AI_PROJECT_ID環境変数が設定されていません');
  }

  try {
    const vertexAI = new VertexAI({
      project: process.env.VERTEX_AI_PROJECT_ID,
      location: process.env.VERTEX_AI_LOCATION ?? 'us-central1',
    });

    const model = vertexAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const result = await model.generateContent(message);

    const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) {
      throw new Error('Vertex AIからの応答が空です');
    }

    return responseText;

  } catch (error) {
    throw error;
  }
}