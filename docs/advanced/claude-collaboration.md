# CLAUDE.md - AI Chat Starter Kit 開発ガイド

> Claude Code (claude.ai/code) でのAI協働開発ガイドライン

## 📋 プロジェクト概要

**AI Chat Starter Kit** - 機能ベースAI使い分けによるハッカソン特化チャットシステム

- **🎯 目標**: 30秒セットアップ、30分新機能追加、人間-AI効率協働
- **🚀 特徴**: 認証なし設計、Vertex AI + Agent Engine (ADK v1.93.0)
- **💰 コスト**: 月額$0-15予算でフル機能運用

### ✅ **実装済み機能**

- **Next.js 15.3.1 フロントエンド** - App Router、Server Components
- **機能ベースAI分類** - 3機能（基本チャット、分析、UI生成）
- **Vertex AI Agent Engine** - ADK 1.93.0、2つの専用Agent
- **統合デプロイシステム** - setup.sh 1コマンドデプロイ
- **UI生成ツール** - DOMPurify安全化、リアルタイムプレビュー
- **画像管理** - Cloud Storage、ドラッグ&ドロップ
- **デバッグツール** - debug.sh 診断

### 🎯 実装済みAI機能

| 機能 | AI エンジン | 適用例 |
|-----|------------|----------|
| **基本チャット** | Vertex AI Direct | 日常会話、質問回答 |
| **分析レポート** | AnalysisAgent | データ分析、詳細レポート |
| **UI生成** | UIGenerationAgent | HTML/Tailwind生成、プレビュー |
| **画像管理** | Cloud Storage | ドラッグ&ドロップアップロード |

## 🏗️ アーキテクチャ

```
📱 Next.js 15.3.1 Frontend
├── 機能ベースAI選択 (aiProcessor.ts)
│   ├── basic_chat → Vertex AI Direct
│   ├── analysis_report → Analysis Agent
│   └── ui_generation → UI Generation Agent
├── API Routes
│   ├── /api/chat/basic, /api/analysis
│   ├── /api/ui-generation
│   └── /api/images/upload
└── Pages: /ai-features, /ui-builder, /simple-chat

🤖 Agent Engine (ADK 1.93.0)
├── AnalysisAgent - データ分析専門
└── UIGenerationAgent - UI生成専門

☁️ GCP Infrastructure
├── Cloud Run (Frontend + Agent)
├── Vertex AI (Gemini 2.0 Flash)
└── Cloud Storage (画像管理)
```

## 🛠️ 技術スタック

### フロントエンド
- **Next.js**: 15.3.1 (App Router, Turbopack)
- **React**: 19.0.0, **TypeScript**: 5.x
- **UI**: Tailwind CSS 4.0 + Radix UI
- **セキュリティ**: DOMPurify 3.2.6 (XSS対策)
- **テスト**: Jest 29.7.0 + Testing Library

### Agent Engine
- **ADK**: 1.93.0 (google-cloud-aiplatform)
- **Python**: 3.10+ (仮想環境)
- **エージェント**: AnalysisAgent、UIGenerationAgent
- **モデル**: Gemini 2.0 Flash Exp

### インフラ
- **GCP**: Cloud Run, Vertex AI, Cloud Storage
- **デプロイ**: setup.sh (統合), debug.sh (診断)

## 開発コマンド

### 🚀 統合デプロイ（推奨）

```bash
# 1. 設定ファイル作成
cp config.example.sh config.sh
# config.sh を編集してPROJECT_IDを設定

# 2. 統合デプロイ実行
./setup.sh

# 3. デバッグ・確認
./debug.sh
```

### 🔧 ローカル開発

**フロントエンド開発**:
```bash
cd packages/frontend
npm run dev        # 開発サーバー起動
npm run build      # プロダクションビルド
npm run lint       # ESLint実行
npm run test       # Jest実行
```

**Agent Engine開発**:
```bash
cd packages/ai-agents
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# 個別Agent デプロイ
python deploy_analysis.py
python deploy_ui_generation.py

# 全エージェント一括デプロイ
python deploy_all_agents.py
```

## ディレクトリ構造

```
/packages/frontend/src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # ランディングページ
│   ├── ai-features/       # AI機能選択ページ（推奨）
│   ├── simple-chat/       # シンプルチャット
│   ├── ui-builder/        # UI生成ツール
│   ├── ui-preview/        # 安全プレビュー
│   └── api/               # API Routes
├── core/                  # 🔴 ビジネスロジック（人間管理）
│   ├── types/             # AI機能定義、データ型
│   └── constants/         # ビジネスルール
├── server/                # サーバーサイド処理
│   └── lib/               # AIプロセッサー
└── ui/                    # 🤖 UIコンポーネント（AI管理）

/packages/ai-agents/       # Agent Engine (ADK)
├── agents/                # 🔴 専用エージェント定義
│   ├── analysis_agent.py
│   └── ui_generation_agent.py
├── schemas/               # 🔴 機能別スキーマ
└── deploy_*.py            # デプロイスクリプト
```

## AI協働開発のルール

### 🔴 人間が管理する領域
- **AI機能設計**: `core/types/AIFeatures.ts`
- **AI処理ロジック**: `server/lib/aiProcessor.ts`
- **重要な設計判断**: データ構造、認証、セキュリティ

### 🤖 AIが管理する領域
- **UIコンポーネント**: `ui/components/`
- **API実装**: `app/api/`（人間が設計したルールに従う）
- **ページ実装**: `app/*/page.tsx`

### 🚨 重要な開発ルール
- **🔴 絶対禁止**: AIが勝手にデプロイ実行をしてはいけない
- **✅ 必須手順**: デプロイが必要な場合は必ず人間に依頼・承認を求める
- **⚠️ 重要**: AIがデプロイコマンド（./setup.sh, ./deploy-frontend.sh, ./deploy-agents.sh）を実行するとタイムアウトが発生するため、必ず人間が実行する

## 🤖 AI機能の詳細

### 機能ベースのAI使い分け
```typescript
// aiProcessor.ts による機能ベース処理
"こんにちは" → basic_chat → Vertex AI Direct
"市場動向を分析して" → analysis_report → AnalysisAgent
"フォームを作成して" → ui_generation → UIGenerationAgent
```

### 1. 💬 基本チャット (basic_chat)
- **使用AI**: Vertex AI Direct (Gemini 2.0 Flash)
- **適用シーン**: 日常会話、質問回答、簡単な情報収集
- **特徴**: 高速レスポンス（平均 < 5秒）、低コスト

### 2. 📊 分析レポート (analysis_report)
- **使用AI**: AnalysisAgent (ADK)
- **適用シーン**: データ分析、詳細レポート作成、深い洞察
- **特徴**: 高品質分析、構造化出力、複雑な文脈理解


### 3. 🎨 UI生成 (ui_generation)
- **使用AI**: UIGenerationAgent (ADK)
- **適用シーン**: HTML/Reactコンポーネント生成、プロトタイピング
- **実装ページ**: `/ui-builder` (UI生成ツール), `/ui-preview` (安全プレビュー)
- **セキュリティ**: DOMPurify XSS対策、JavaScript除去
- **対応機能**: フォーム、カード、ダッシュボード、ランディング

## API規約

### 基本レスポンス形式
```typescript
interface AIFeatureResponse {
  success: boolean;
  result: string;
  feature: AIFeatureType;
  processingMode: "vertex_direct" | "adk_agent";
  processingTimeMs: number;
  timestamp: string;
  sessionId?: string;
}
```

### エンドポイント
- **`/api/chat/basic`** - 基本チャット（Vertex AI）
- **`/api/analysis`** - 分析レポート（ADK Agent）
- **`/api/ui-generation`** - UI生成（ADK Agent）
- **`/api/images/upload`** - 画像アップロード

## 実装済みページ

### メインページ
- **`/`** - ランディングページ（プロジェクト紹介）
- **`/ai-features`** - AI機能選択ページ（推奨メインページ）
- **`/simple-chat`** - シンプルチャット
- **`/ui-builder`** - UI生成ツール（リアルタイムプレビュー）
- **`/ui-preview`** - 安全プレビュー表示（iframe分離）
- **`/dashboard`** - ダッシュボード
- **`/content-management`** - コンテンツ管理・画像アップロード

### 推奨ユーザーフロー
1. **ランディングページ** (`/`) - プロジェクト紹介確認
2. **AI機能ページ** (`/ai-features`) - 4つのAI機能体験
3. **UI Builder** (`/ui-builder`) - 自然言語からUI生成体験
4. **シンプルチャット** (`/simple-chat`) - Server Component例

## 開発思想

### 目標
- **30秒**でセットアップ完了
- **30分**で新機能追加
- **人間とAIの適切な分業**

### 哲学
- シンプルさを重視
- 素早いプロトタイピング
- 機能ベースのAI使い分け
- 最小限の設定で最大限の機能
- セキュリティファースト設計

### 開発フロー
1. **プロジェクトセットアップ** - `npm install && npm run dev`
2. **新機能追加** - `core/types/AIFeatures.ts`で機能定義、AIがUI実装
3. **UI生成活用** - `/ui-builder`で必要なコンポーネントを自然言語生成
4. **デプロイ** - `./setup.sh`でGCPにデプロイ

## 📚 必須参照ドキュメント

### 🔥 **Agent Engine開発時の必須資料**
**Agent Engine関連の実装・デバッグ時は必ずこれを確認してください：**

- **[docs/AGENT_ENGINE_API_PATTERNS.md](./docs/AGENT_ENGINE_API_PATTERNS.md)** - Agent Engine API実装パターン完全ガイド（必須参照）

### 📋 **その他の重要資料**
- **[docs/AI_INTERFACE_DOCUMENTATION.md](./docs/AI_INTERFACE_DOCUMENTATION.md)** - AI技術仕様・動作確認済みクエリ形式
- **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - システム全体アーキテクチャ  
- **[docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)** - 本格デプロイ手順

🚀 **AI協働開発で効率的にプロトタイプを作成しましょう！**