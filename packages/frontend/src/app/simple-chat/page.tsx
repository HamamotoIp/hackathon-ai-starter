import { getAIProcessor } from '@/server/lib/aiProcessor';
import SimpleForm from './SimpleForm';

/**
 * 基本チャットページ - 動作確認用
 */
export default async function SimpleChatPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ message?: string }> 
}) {
  const params = await searchParams;
  const aiProcessor = getAIProcessor();
  let response = null;
  
  if (params.message) {
    const request = {
      feature: "basic_chat" as const,
      input: params.message,
      sessionId: 'demo-session' // 固定セッションID
    };
    response = await aiProcessor.processFeature(request);
  }
  
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">基本チャット</h1>
      
      {response ? (
        <div className="mb-6 p-4 bg-gray-50 rounded">
          <div className="font-bold mb-2">AI:</div>
          <div>{typeof response.result === 'string' ? response.result : "レスポンス取得"}</div>
          <div className="text-xs text-gray-500 mt-2">
            {response.processingMode} - {response.processingTimeMs}ms
          </div>
        </div>
      ) : null}
      
      {params.message ? (
        <div className="mb-6 p-4 bg-blue-50 rounded">
          <div className="font-bold mb-2">You:</div>
          <div>{params.message}</div>
        </div>
      ) : null}
      
      <div className="border rounded p-4">
        <SimpleForm />
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Simple AI Chat',
  description: 'Server Componentを使用したシンプルなAIチャット',
};