/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloud Run用の設定
  output: 'standalone',
  
  // 外部パッケージの設定
  serverExternalPackages: ['@google-cloud/vertexai', '@google-cloud/storage', 'firebase-admin'],
  
  // 環境変数の設定
  env: {
    VERTEX_AI_PROJECT_ID: process.env.VERTEX_AI_PROJECT_ID,
    VERTEX_AI_LOCATION: process.env.VERTEX_AI_LOCATION,
  },
  
  // パフォーマンス最適化
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // 開発時の設定
  devIndicators: {
    position: 'bottom-right',
  },
};

module.exports = nextConfig;