import Navigation from '@/ui/components/common/Navigation';

/**
 * シンプルなダッシュボードページ
 * システム状態を表示
 */
export default async function DashboardPage() {
  // AI処理の状態確認
  const systemStatus = await checkSystemStatus();
  
  // 簡単な統計データの取得
  const stats = await getSimpleStats();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">AI Dashboard</h1>
        
        {/* システム状態 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">System Status</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Vertex AI</span>
                <div className="flex items-center space-x-2">
                  <div className={`h-2 w-2 rounded-full ${
                    systemStatus.vertexAI ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className="text-sm text-gray-500">
                    {systemStatus.vertexAI ? 'Available' : 'Unavailable'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Agent Engine</span>
                <div className="flex items-center space-x-2">
                  <div className={`h-2 w-2 rounded-full ${
                    systemStatus.agentEngine ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className="text-sm text-gray-500">
                    {systemStatus.agentEngine ? 'Available' : 'Unavailable'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Requests</span>
                <span className="font-medium">{stats.totalRequests}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Success Rate</span>
                <span className="font-medium">{stats.successRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Response Time</span>
                <span className="font-medium">{stats.avgResponseTime}ms</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* AI機能へのリンク */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">AI Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="/ai-features"
              className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-medium text-blue-600">AI機能テスト</h3>
              <p className="text-sm text-gray-600">4つのAI機能を試すことができます</p>
            </a>
            <a
              href="/ui-builder"
              className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-medium text-purple-600">UI Builder</h3>
              <p className="text-sm text-gray-600">AI生成UIの高度なビルダーツール</p>
            </a>
          </div>
        </div>
        
      </div>
    </div>
  );
}


/**
 * システム状態を確認する関数
 */
async function checkSystemStatus() {
  return {
    vertexAI: Boolean(process.env.VERTEX_AI_PROJECT_ID),
    agentEngine: Boolean(process.env.ANALYSIS_AGENT_URL ?? process.env.COMPARISON_AGENT_URL ?? process.env.UI_GENERATION_AGENT_URL),
  };
}

/**
 * 簡単な統計データを取得する関数
 */
async function getSimpleStats() {
  // 実際の実装では、ログやデータベースから統計を取得
  return {
    totalRequests: 42,
    successRate: 95.2,
    avgResponseTime: 750,
  };
}

export const metadata = {
  title: 'AI Dashboard',
  description: 'AI システムのダッシュボード',
};