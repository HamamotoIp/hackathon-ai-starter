/**
 * Analysis Agent処理
 * データ分析・レポート生成のADK Agent統合
 */

/**
 * ADK Agent - Analysis処理
 */
export async function processAnalysis(
  serviceUrl: string,
  message: string
): Promise<string> {
  if (!serviceUrl) {
    throw new Error('ADK Agent URLが設定されていません');
  }

  try {
    const { createADKSession, sendADKMessage } = await import('@/lib/core/adk/client');
    const sessionId = await createADKSession(serviceUrl);
    return await sendADKMessage(serviceUrl, sessionId, message);
  } catch (error) {
    throw new Error(`Analysis処理エラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}