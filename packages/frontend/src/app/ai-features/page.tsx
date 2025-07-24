import { AI_FEATURE_CONFIGS } from '@/core/types/AIFeatures';
import FeatureCard from './FeatureCard';

/**
 * AI機能テストページ - 動作確認用
 */
export default function AIFeaturesPage() {
  // basic_chatとui_generation機能を除外
  const testFeatures = Object.values(AI_FEATURE_CONFIGS).filter(
    config => config.type !== 'ui_generation' && config.type !== 'basic_chat'
  );

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">AI機能統合</h1>
      
      <div className="space-y-6">
        {testFeatures.map((config) => (
          <FeatureCard key={config.type} config={config} />
        ))}
      </div>
    </div>
  );
}

export const metadata = {
  title: 'AI機能 - 機能ベースでAIを使い分け',
  description: 'シンプルなチャットから高度な分析まで、適切なAIを自動選択',
};