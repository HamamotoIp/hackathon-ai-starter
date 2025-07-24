import Link from "next/link";

/**
 * AI Chat Starter Kit - 動作確認用シンプルページ
 */
export default function HomePage() {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">AI Chat Starter Kit - 動作確認</h1>
      
      <div className="space-y-4">
        <Link href="/simple-chat" className="block p-4 border rounded hover:bg-gray-50">
          <h2 className="text-xl font-semibold">基本チャット</h2>
          <p className="text-gray-600">Vertex AI Direct での基本会話</p>
        </Link>
        
        <Link href="/ai-features" className="block p-4 border rounded hover:bg-gray-50">
          <h2 className="text-xl font-semibold">AI機能テスト</h2>
          <p className="text-gray-600">分析・UI生成のAgent Engine機能</p>
        </Link>
        
        <Link href="/ui-builder" className="block p-4 border rounded hover:bg-gray-50">
          <h2 className="text-xl font-semibold">UI生成ツール</h2>
          <p className="text-gray-600">HTML/CSS生成とプレビュー</p>
        </Link>
      </div>
    </div>
  );
}

export const metadata = {
  title: 'AI Chat Starter Kit',
  description: '認証なしハッカソン特化のAIチャットスターターキット',
};