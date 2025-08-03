/**
 * Tourism Spots Search Agent処理
 * 6段階のAIエージェントワークフローによる観光スポット検索
 */

/**
 * ADK Agent - 観光スポット検索処理
 * 
 * 6段階のAIエージェントワークフローによる観光スポット検索：
 * 1. SimpleIntentAgent: ユーザー入力から検索パラメータ抽出
 * 2. SimpleSearchAgent: 固定観光スポットデータ取得
 * 3. SimpleSelectionAgent: 条件に最適な5スポット選定
 * 4. SimpleDescriptionAgent: 魅力的な説明文生成
 * 5. SimpleUIAgent: 美しいHTML記事生成
 * 6. HTMLExtractorAgent: 最終HTML抽出
 */
export async function processTourismSpotsSearch(
  serviceUrl: string,
  message: string
): Promise<string> {
  if (!serviceUrl) {
    throw new Error('ADK Agent URLが設定されていません');
  }

  const { createADKSession, sendADKMessage } = await import('@/lib/core/adk/client');
  const sessionId = await createADKSession(serviceUrl);
  const response = await sendADKMessage(serviceUrl, sessionId, message);
  
  // レスポンスがJSONオブジェクトの場合、htmlフィールドを抽出
  try {
    const parsed = JSON.parse(response);
    if (parsed.html && typeof parsed.html === 'string') {
      return parsed.html;
    }
  } catch {
    // JSONパースエラーの場合は元のレスポンスを返す
  }
  
  return response;
}