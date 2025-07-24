# 🌐 Frontend Package

**Next.js 15.3.1 フロントエンドアプリケーション** - 機能ベースAI使い分けWebアプリ

## 🎯 機能概要

- **ハイブリッドAI**: Vertex AI Direct + ADK Agent Engine の最適選択
- **Server Components**: Next.js 15.3.1 + Turbopack で高速・安全な開発
- **認証なし設計**: ハッカソン特化、30秒でスタート可能
- **レスポンシブ**: Tailwind CSS 4.0 でモダンなUI

## 📝 プロジェクト構造

```
packages/frontend/src/
├── app/                      # Next.js App Router
│   ├── page.tsx             # ランディングページ
│   ├── simple-chat/         # シンプルチャット（Vertex AI Direct）
│   ├── ai-features/         # AI機能統合ページ（ADK Agent）
│   ├── ui-builder/          # UI生成専用ツール
│   ├── content-management/  # 画像アップロード・管理
│   ├── api/                 # API Routes
│   │   ├── chat/basic/      # Vertex AI Direct API
│   │   ├── analysis/        # ADK Analysis Agent API
│   │   ├── ui-generation/   # ADK UI Generation Agent API
│   │   ├── images/upload/   # Cloud Storage画像API
│   │   └── debug/           # デバッグ・環境確認API
│   ├── layout.tsx           # 共通レイアウト
│   └── globals.css          # グローバルスタイル
├── core/                    # 🔴 ビジネスロジック（人間管理）
│   ├── types/               # AI機能定義・データ型
│   └── constants/           # ビジネスルール・設定
├── ui/                      # 🤖 UIコンポーネント（AI管理）
│   └── components/          # Reactコンポーネント
├── server/                  # サーバーサイド処理
│   └── lib/                 # AIプロセッサー・ユーティリティ
├── shared/                  # 共通コード・型定義
│   └── types/               # API型定義・レスポンス形式
└── package.json             # 依存関係・スクリプト
```

## 🚀 ローカル開発セットアップ

### 1. 依存関係インストール
```bash
cd packages/frontend

# 依存関係インストール
npm install

# 開発サーバー起動（Turbopack）
npm run dev
# → http://localhost:3000 でアクセス可能！
```

### 2. 環境変数設定（任意）
```bash
# .env.local ファイル作成（packages/frontend/）
VERTEX_AI_PROJECT_ID=your-gcp-project-id
VERTEX_AI_LOCATION=us-central1
ADK_SERVICE_URL=http://localhost:8080
BUCKET_NAME=your-bucket-name
SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
```

### 3. AIエンジン連携（任意）
```bash
# 別ターミナルでAIエンジン起動
cd packages/ai-agents
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python app.py
# → http://localhost:8080 でAIエンジン起動
```

## 🛠️ 開発・テストコマンド

### 基本コマンド
```bash
npm run dev           # 開発サーバー起動（Turbopack）
npm run build         # プロダクションビルド
npm run start         # プロダクションサーバー起動
npm run lint          # ESLint実行・コード品質チェック
npx tsc --noEmit      # TypeScript型チェック
```

### デバッグ・テストコマンド
```bash
# 環境確認・ヘルスチェック
curl http://localhost:3000/api/debug

# AI機能テスト
curl -X POST http://localhost:3000/api/analysis \
  -H "Content-Type: application/json" \
  -d '{"feature": "analysis", "input": "テスト分析", "sessionId": "demo"}'

curl -X POST http://localhost:3000/api/ui-generation \
  -H "Content-Type: application/json" \
  -d '{"feature": "ui_generation", "input": "ボタンとフォームを作って", "sessionId": "demo"}'
```

### ビルド・品質確認
```bash
# 型チェック → Lint → ビルド の順で実行
npx tsc --noEmit && npm run lint && npm run build

# プロダクションビルドのローカル確認
npm run build && npm run start
```

## 🎯 実装済みページ・機能

### メインページ

| URL | 機能 | 説明 | 推奨用途 |
|-----|------|------|----------|
| `/` | ランディング | プロジェクト概要・紹介 | 初回訪問者向け |
| `/simple-chat` | シンプルチャット | Vertex AI直接呼び出し | 高速チャット |
| `/ai-features` | **AI機能統合** | 分析レポート生成 | **推奨メインページ** |
| `/ui-builder` | UI生成ツール | HTML/Tailwind生成専用 | UI作成・プロトタイプ |
| `/content-management` | 画像管理 | ドラッグ&ドロップアップロード・Cloud Storage | ファイル管理 |

### AI機能詳細

#### 1. シンプルチャット (`/simple-chat`)
- **AI**: Vertex AI Direct (Gemini 2.0 Flash)
- **レスポンス**: < 3秒
- **用途**: 日常会話、質問回答、簡単な情報収集
- **API**: `/api/chat/basic`

#### 2. 分析レポート (`/ai-features`)
- **AI**: ADK Analysis Agent (ADK 1.93.0)
- **レスポンス**: 20-30秒
- **用途**: データ分析、詳細レポート作成、深い洞察
- **API**: `/api/analysis`

#### 3. UI生成 (`/ui-builder`)
- **AI**: ADK UI Generation Agent (ADK 1.93.0)
- **レスポンス**: 25-45秒
- **用途**: HTML/Tailwind生成、UIコンポーネント作成
- **API**: `/api/ui-generation`

#### 4. 画像管理 (`/content-management`)
- **API**: `/api/images/upload`
- **機能**: ドラッグ&ドロップアップロード、Cloud Storage連携
- **用途**: ファイル管理、画像アップロード

## 🧩 技術アーキテクチャ

### フロントエンド技術スタック
- **Next.js**: 15.3.1 (App Router, Server Components)
- **React**: 19.0.0 (最新安定版)
- **TypeScript**: 5.x (strict mode)
- **Tailwind CSS**: 4.0 (ユーティリティファースト)
- **UI Components**: Radix UI, class-variance-authority

### AIプロセッサー設計
```typescript
// server/lib/aiProcessor.ts - 核心統合層
export class AIProcessor {
  async processFeature(request: AIFeatureRequest): Promise<AIFeatureResponse> {
    const config = getFeatureConfig(request.feature);
    
    if (config.processingMode === "vertex_direct") {
      return await this.processWithVertexAI(request);
    } else if (config.processingMode === "adk_agent") {
      return await this.processWithADK(request, config.adkEndpoint!);
    }
  }
}
```

### AI機能設定（人間管理）
```typescript
// core/types/AIFeatures.ts - 機能ベース設定
export const AI_FEATURE_CONFIGS: Record<AIFeatureType, AIFeatureConfig> = {
  basic_chat: {
    processingMode: "vertex_direct",  // 🔴 人間：AI選択
    maxInputLength: 2000,
    expectedProcessingTime: 5
  },
  analysis_report: {
    processingMode: "adk_agent",      // 🔴 人間：AI選択
    adkEndpoint: "/analysis",
    maxInputLength: 5000,
    expectedProcessingTime: 30
  }
};
```

## 🔄 開発フロー（人間-AI協働）

### 新機能追加の流れ

#### 1. 機能設計（🔴 人間が実装）
```typescript
// core/types/AIFeatures.ts
export type AIFeatureType = 
  | "basic_chat"
  | "analysis_report" 
  | "comparison_study"
  | "new_feature";  // 新機能追加

new_feature: {
  type: "new_feature",
  name: "新機能",
  processingMode: "vertex_direct",  // 🔴 人間：AI選択
  maxInputLength: 2000,
  expectedProcessingTime: 10
}
```

#### 2. API実装（🤖 AIが実装）
```typescript
// app/api/new-feature/route.ts
export async function POST(request: Request) {
  // AIが人間の設計に従って実装
}
```

#### 3. UI統合（🤖 AIが実装）
```bash
# ui/components/features/ に自動統合
# FeatureCardコンポーネントが新機能を自動表示
```

#### 4. テスト・確認（🤖 AIが実装）
```bash
# APIテスト
curl -X POST http://localhost:3000/api/new-feature \
  -H "Content-Type: application/json" \
  -d '{"input": "テストデータ"}'

# 型チェック・Lint
npx tsc --noEmit && npm run lint
```

## 📊 パフォーマンス・最適化

### パフォーマンス指標
- **初回ロード**: < 2秒 (Turbopack)
- **ページ遷移**: < 500ms (App Router)
- **AIレスポンス**: 5-45秒 (機能別)
- **Lighthouse**: 90+ (Performance, SEO, Accessibility)

### 最適化設定
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: true,        // Turbopack有効化
    serverActions: true // Server Actions有効化
  },
  images: {
    domains: ['storage.googleapis.com'] // Cloud Storage画像
  }
};
```

### Server Components活用
- **デフォルト**: すべてServer Component
- **Client Component**: ユーザーインタラクション必要時のみ
- **ハイドレーション**: 最小限に抑制

## 🔍 トラブルシューティング

### よくある問題と解決策

#### 1. 開発サーバー起動エラー
```bash
# Node.js バージョン確認（18.17以上推奨）
node --version

# 依存関係再インストール
rm -rf node_modules package-lock.json
npm install

# ポート競合確認
lsof -i :3000
```

#### 2. TypeScript型エラー
```bash
# 型チェック詳細確認
npx tsc --noEmit --pretty

# 型定義更新
npm install --save-dev @types/node @types/react @types/react-dom
```

#### 3. Tailwind CSS スタイル適用エラー
```bash
# Tailwind 設定確認
npx tailwindcss --version

# CSS再ビルド
npm run dev  # 開発サーバー再起動で自動修正
```

#### 4. API連携エラー
```bash
# 環境変数確認
echo $VERTEX_AI_PROJECT_ID
echo $ADK_SERVICE_URL

# デバッグエンドポイント確認
curl http://localhost:3000/api/debug | jq .
```

## 🚀 デプロイメント

### 本番デプロイ
```bash
# ルートディレクトリから統合デプロイ
cd /workspaces/hackathon-ai-starter
./setup.sh

# フロントエンドのみデプロイ
./setup.sh --frontend-only
```

### デプロイ確認
```bash
# デプロイ環境確認
./debug.sh
```

## 📚 関連リソース

- **[QUICKSTART.md](../../QUICKSTART.md)** - クイックスタートガイド
- **[ARCHITECTURE.md](../../ARCHITECTURE.md)** - アーキテクチャ詳細
- **[CLAUDE.md](../../CLAUDE.md)** - 開発者向けガイド
- **[packages/ai-agents/](../ai-agents/)** - AIエンジンパッケージ

## 🎨 UIコンポーネントライブラリ

### デザインシステム
- **カラーパレット**: Tailwind CSS 4.0 デフォルト + カスタム
- **タイポグラフィ**: Inter フォント
- **コンポーネント**: Radix UI ベース
- **アニメーション**: Tailwind CSS Transitions

### 再利用可能コンポーネント
```typescript
// ui/components/common/ - 共通コンポーネント
- Navigation: ナビゲーション
- LoadingSpinner: ローディング表示
- ErrorMessage: エラーメッセージ

// ui/components/features/ - 機能特化コンポーネント
- ImageUpload: ドラッグ&ドロップアップロード
```

---

**🚀 Next.js + AIで効率的な開発を実現しましょう！**