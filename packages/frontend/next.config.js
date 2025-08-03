/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloud Run用の設定（スタンドアロン出力）
  output: 'standalone',
  
  // 外部パッケージの設定
  serverExternalPackages: ['@google-cloud/vertexai', '@google-cloud/storage', 'firebase-admin'],
  
  // 環境変数の設定
  env: {
    VERTEX_AI_PROJECT_ID: process.env.VERTEX_AI_PROJECT_ID,
    VERTEX_AI_LOCATION: process.env.VERTEX_AI_LOCATION,
  },
  
  // パフォーマンス最適化（swcMinifyはNext.js 15では不要）
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // 実験的な高速化機能（optimizeCssを無効化してcritters依存エラーを回避）
  experimental: {
    // optimizeCss: true,  // Next.js 15.3.1で不安定のため無効化
    optimizePackageImports: ['lucide-react'],
  },
  
  // Webpack設定
  webpack: (config, { isServer }) => {
    // ビルドキャッシュの有効化
    config.cache = {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename],
      },
    };
    
    // パス解決の明示的設定（Next.js 15対応）
    const path = require('path');
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };
    
    return config;
  },
  
  // 開発時の設定
  devIndicators: {
    position: 'bottom-right',
  },
};

module.exports = nextConfig;