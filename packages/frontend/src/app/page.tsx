import Link from "next/link";

/**
 * AI Chat Starter Kit - トップページ
 */
export default function HomePage() {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">AI Chat Starter Kit</h1>
      
      <div className="space-y-4">
        <Link href="/simple-chat" className="block p-4 border rounded hover:bg-gray-50">
          <h2 className="text-xl font-semibold">💬 シンプルチャット</h2>
          <p className="text-gray-600">Vertex AI直接呼び出しの高速チャット</p>
        </Link>
        
        <Link href="/ai-features" className="block p-4 border rounded hover:bg-gray-50">
          <h2 className="text-xl font-semibold">📊 AI機能統合</h2>
          <p className="text-gray-600">分析レポート生成のAgent Engine機能</p>
        </Link>
        
        <Link href="/tourism-spots" className="block p-4 border rounded hover:bg-gray-50">
          <h2 className="text-xl font-semibold">🏛️ 観光スポット検索</h2>
          <p className="text-gray-600">AIが生成する観光スポット記事の閲覧・管理</p>
        </Link>
      </div>
    </div>
  );
}

export const metadata = {
  title: 'AI Chat Starter Kit',
  description: '認証なしハッカソン特化のAIチャットスターターキット',
};

