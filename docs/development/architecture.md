# 🏗️ AI Chat Starter Kit - アーキテクチャ詳細

> **注意**: このドキュメントは技術詳細を記載しています。
> 基本的な使用方法は [README.md](./README.md) を参照してください。

## 🎯 システム概要

AI Chat Starter Kitは、機能ベースでAIを使い分けるハッカソン特化のチャットシステムです。Vertex AI Direct（高速）とADK Agent Engine（高品質）を適切に使い分け、30秒セットアップから本格運用まで対応します。

## 🏛️ 全体アーキテクチャ（最新版）

```
┌──────────────────────────────────────────────────────────────────┐
│                 🌐 フロントエンド (hackathon-ai-starter)               │
├──────────────────────────────────────────────────────────────────┤
│  📱 Pages (App Router - Next.js 15.3.1)                       │
│  ├── / (ホーム・ナビゲーション)     ┌────────────────────────────┐  │
│  ├── /simple-chat (シンプルチャット) │  🎨 UI Components          │  │
│  ├── /ai-features (AI機能統合)    │  ├── ai-features/          │  │
│  ├── /ui-builder (UI生成ツール)    │  │   └── FeatureCard.tsx    │  │
│  └── /content-management (画像)   │  ├── ui/components/        │  │
│                                   │  │   ├── common/            │  │
│                                   │  │   │   ├── ErrorMessage   │  │
│                                   │  │   │   ├── ErrorMessage   │  │
│                                   │  │   │   ├── LoadingSpinner │  │
│                                   │  │   │   └── Navigation     │  │
│                                   │  │   └── features/         │  │
│                                   │  │       └── ImageUpload/  │  │
│                                   └────────────────────────────┘  │
│  🔌 API Routes (実装済み)                                        │
│  ├── /api/chat/basic     # ✅ Vertex AI Direct           │
│  ├── /api/analysis       # ✅ ADK Analysis Agent         │
│  ├── /api/ui-generation  # ✅ ADK UI Generation Agent    │
│  ├── /api/images/upload  # ✅ Cloud Storage統合          │
│  └── /api/debug          # ✅ システムデバッグ            │
└──────────────────────────────────────────────────────────────────┘
                                    ║
                                    ║ HTTP/JSON
                                    ▼
┌──────────────────────────────────────────────────────────────────┐
│                    📚 Server Libraries (専用ヘルパー)                │
├──────────────────────────────────────────────────────────────────┤
│  🔀 API Routes直接呼び出し                                         │
│  ├── vertexAI.ts → Vertex AI Direct (基本チャット)            │
│  ├── adkAgent.ts → processAnalysis() (分析レポート)           │
│  └── adkAgent.ts → processUIGeneration() (UI生成)            │
└──────────────────────────────────────────────────────────────────┘
                    ║                           ║
                    ║ gRPC/REST                ║ HTTP/JSON
                    ▼                           ▼
┌─────────────────────────────┐    ┌─────────────────────────────┐
│     🤖 Vertex AI Direct     │    │   🎭 ADK Agent Engine      │
│  ┌─────────────────────────┐ │    │  ┌─────────────────────────┐ │
│  │  Gemini 2.0 Flash       │ │    │  │  Analysis Agent         │ │
│  │  - 高速レスポンス < 5秒   │ │    │  │  (analysis_agent.py)    │ │
│  │  - 汎用会話・質問回答     │ │    │  │  - 詳細分析・レポート生成 │ │
│  │  - 低コスト運用         │ │    │  │  - 構造化JSON出力       │ │
│  └─────────────────────────┘ │    │  └─────────────────────────┘ │
└─────────────────────────────┘    │  ┌─────────────────────────┐ │
                                  │  │  UI Generation Agent    │ │
                                  │  │  (ui_generation_agent.py)│ │
                                  │  │  - HTML/Tailwind生成     │ │
                                  │  │  - リアルタイムプレビュー │ │
                                  │  └─────────────────────────┘ │
                                  └─────────────────────────────┘
                                                ║
                                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                    ☁️ GCP Infrastructure                        │
├──────────────────────────────────────────────────────────────────┤
│  🚀 Cloud Run (Frontend)    📦 Cloud Storage (Images)         │
│  🚀 Cloud Run (Agent Engine) 🔐 Service Account (IAM)         │
│  🧠 Vertex AI (Gemini)      📊 Manual Deploy (setup.sh)      │
└──────────────────────────────────────────────────────────────────┘
```

## 🔀 データフロー詳細

### 1. ユーザー入力からAI応答まで

```
ユーザー入力例:
• "こんにちは" → /api/chat/basic → vertexAI.ts → Vertex AI Direct (高速・3秒以内)
• "市場データを分析してレポート作成" → /api/analysis → adkAgent.ts → ADK Analysis Agent (詳細・構造化)
• "ボタンとフォームのUIを作って" → /api/ui-generation → adkAgent.ts → ADK UI Generation Agent (HTML/Tailwind CSS)
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│                     📚 API Routes (直接AI呼び出し)                        │
│                                                                 │
│  1. リクエスト解析・バリデーション（apiHelpers.ts）              │
│  2. 専用ヘルパー関数呼び出し（vertexAI.ts/adkAgent.ts）         │
│  3. AI処理実行（Vertex AI/ADK Agent Engine）                   │
│  4. レスポンス標準化・返却（apiHelpers.ts）                     │
└─────────────────────────────────────────────────────────────────┘
           │                                  │
           ▼ (シンプル処理)                     ▼ (複雑処理)
┌─────────────────────────────────────────────────────────────────┐
│             🤖 Vertex AI Direct (basic_chat)                     │
│                                                                 │
│  ● 高速レスポンス (< 3秒)                                        │
│  ● 低コスト・高品質（月額 $0-3）                                │
│  ● 汎用的な会話・質問回答                                        │
│  ● Gemini 2.0 Flash Exp モデル使用                               │
│  ● @google-cloud/vertexai 1.10.0                               │
│                                                                 │
│  適用例: "こんにちは"、"Reactとは？"、"天気予報"                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│     🎭 ADK Agent Engine (analysis, ui_generation)              │
│                                                                 │
│  ● 複雑なタスクの深度分析・処理 (20-45秒)                       │
│  ● 専門特化エージェント・独立デプロイ                           │
│  ● 構造化された詳細出力・JSON Schema対応                        │
│  ● Python Flask 3.0.0 + Google ADK 1.93.0                     │
│  ● 実装済みエンドポイント（/analysis, /ui-generation）          │
│                                                                 │
│  適用例: "売上データ分析レポート"、"HTML/TailwindでUIコンポーネント作成" │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      🔄 標準化されたレスポンス                        │
│                                                                 │
│  ● 一貫したレスポンスフォーマット                              │
│  ● 処理時間・コスト・メタデータ付き                          │
│  ● エラーハンドリングとタイムアウト対応                      │
│  ● セッション管理とコンテキスト保持                          │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                              ユーザーへ返却
```

### 2. 画像アップロードフロー

```
ユーザー画像選択
    │
    ▼
┌─────────────────────────────────────────────────────────────────┐
│                     📷 ImageUpload Component                     │
│                                                                 │
│  1. ファイルバリデーション (サイズ、形式)                        │
│  2. FormData作成                                                │
│  3. /api/images/upload にPOST                                   │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                     🔌 API Route (/api/images/upload)            │
│                                                                 │
│  1. ファイル受信・検証                                          │
│  2. Cloud Storage アップロード                                  │
│  3. 公開URLの生成                                              │
│  4. メタデータ付きレスポンス                                    │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                     ☁️ Google Cloud Storage                      │
│                                                                 │
│  ● 自動コスト最適化 (30日後削除)                               │
│  ● 公開URL生成                                                  │
│  ● 冗長化・高可用性                                            │
└─────────────────────────────────────────────────────────────────┘
```

## 🧩 コンポーネント詳細

### 1. Server Libraries (専用ヘルパー)

```typescript
// packages/frontend/src/server/lib/vertexAI.ts
export async function generateText(message: string): Promise<string> {
  const vertexAI = new VertexAI({
    project: process.env.VERTEX_AI_PROJECT_ID,
    location: process.env.VERTEX_AI_LOCATION ?? 'us-central1',
  });
  const model = vertexAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  const result = await model.generateContent(message);
  return result.response.candidates?.[0]?.content?.parts?.[0]?.text;
}

// packages/frontend/src/server/lib/adkAgent.ts
export async function processAnalysis(serviceUrl: string, message: string): Promise<string> {
  const sessionId = await createADKSession(serviceUrl);
  return await sendADKMessage(serviceUrl, sessionId, message);
}

export async function processUIGeneration(serviceUrl: string, message: string): Promise<string> {
  const sessionId = await createADKSession(serviceUrl);
  const structuredMessage = createUIGenerationMessage(message);
  return await sendADKMessage(serviceUrl, sessionId, structuredMessage);
}
```

**責務:**
- 各AI専用の処理ロジック
- セッション管理（ADK Agent用）
- エラーハンドリング
- レスポンス解析

### 2. AI機能設定 (各API Route独立)

```typescript
// packages/frontend/src/core/types/aiTypes.ts
export const AI_FEATURE_CONFIGS: Record<AIFeatureType, AIFeatureConfig> = {
  basic_chat: {
    type: "basic_chat",
    name: "基本チャット",
    description: "日常的な会話や質問回答",
    processingMode: "vertex_direct",  // vertexAI.ts使用
    maxInputLength: 2000,
    expectedProcessingTime: 5,
    costTier: "low",
    useCases: ["日常会話", "質問回答", "簡単な情報収集"]
  },
  analysis: {
    type: "analysis",
    name: "分析レポート",
    description: "データ分析や詳細レポート作成",
    processingMode: "adk_agent",      // processAnalysis()使用
    maxInputLength: 5000,
    expectedProcessingTime: 30,
    costTier: "medium",
    useCases: ["データ分析", "市場調査", "詳細レポート作成"]
  },
  ui_generation: {
    type: "ui_generation",
    name: "UI生成",
    description: "HTML/CSS生成とプレビュー",
    processingMode: "adk_agent",      // processUIGeneration()使用
    maxInputLength: 3000,
    expectedProcessingTime: 25,
    costTier: "medium",
    useCases: ["UIコンポーネント生成", "ランディングページ", "フォーム作成"]
  }
};
```

### 3. UI Components (AI-Managed)

```
packages/frontend/src/
├── app/                      # Next.js App Router
│   ├── ai-features/          # AI機能統合ページ（メイン）
│   │   ├── FeatureCard.tsx   # AI機能カード
│   │   └── page.tsx         # 統合体験ページ
│   ├── content-management/  # 画像管理ページ
│   │   ├── ContentManagementPage.tsx
│   │   └── page.tsx
│   └── api/                 # API Routes
│       ├── chat/basic/route.ts
│       ├── analysis/route.ts
│       ├── ui-generation/route.ts
│       └── images/upload/route.ts
├── ui/components/           # 共通UIコンポーネント
│   ├── common/
│   │   ├── ErrorMessage.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── Navigation.tsx
│   └── features/
│       └── ImageUpload/
│           └── ImageUpload.tsx
└── server/lib/              # サーバーサイドロジック
    ├── vertexAI.ts          # Vertex AI Direct呼び出し
    ├── adkAgent.ts          # ADK Agent呼び出し
    └── apiHelpers.ts        # 共通API処理
```

## 🔄 AIエンジン比較

| 項目 | Vertex AI Direct | ADK Agent Engine |
|------|------------------|------------------|
| **用途** | 基本チャット | 分析・UI生成 |
| **応答速度** | < 5秒 | 20-45秒 |
| **処理能力** | 汎用会話・質問回答 | 深度分析・UI生成・専門タスク |
| **コスト** | 低（月額$0-3） | 中（月額$2-5） |
| **カスタマイズ** | 限定的 | 高い（Python Agent） |
| **出力形式** | プレーンテキスト | 構造化JSON・レポート |
| **同時処理** | 高い | 中程度 |
| **学習対応** | 事前学習済み | カスタムエージェント |
| **デプロイ** | GCP Managed | Cloud Run Container |

## 🔐 セキュリティ設計

### 認証なし設計の理由
- **ハッカソン特化**: 迅速な開発・デモを優先（30秒セットアップ）
- **プロトタイプ段階**: 認証システムは後から追加可能な設計
- **開発効率**: 設定・管理の複雑さを回避、AI機能に集中
- **オープンアクセス**: パブリックデモ・テスト環境として最適

### セキュリティ対策
- **環境変数**: 機密情報（API Key、Project ID）は環境変数で管理
- **GCP IAM**: 最小権限サービスアカウント（aiplatform.user、storage.objectAdmin）
- **API制限**: 入力長制限（2000-5000文字）・タイムアウト（30-300秒）
- **CORS**: 適切なクロスオリジン設定・ドメイン制限
- **バリデーション**: 入力データの検証・サニタイゼーション
- **Cloud Run**: コンテナ分離・ネットワーク制限

### 本番環境対応
- **認証追加**: Firebase Auth、Auth0等の統合が容易
- **レート制限**: Cloud Armor、API Gateway統合
- **SSL/TLS**: Cloud Run標準対応
- **ログ監視**: Cloud Logging・Monitoring標準統合

## 💰 コスト最適化

### Cloud Run設定（コスト最適化）
```bash
# config.sh での設定例
MEMORY="512Mi"        # 必要最小限（増量可能：1Gi, 2Gi）
CPU="1"              # 必要最小限（増量可能：2, 4）
MAX_INSTANCES="1"    # 暴走コスト防止（増量可能：3, 5, 10）
MIN_INSTANCES="0"    # アイドル時完全無料
CONCURRENCY="1000"   # 高い同時実行数で効率化
```

### ストレージ最適化
```bash
# Cloud Storage設定
LIFECYCLE_DAYS="30"  # 自動削除でストレージコスト削減
STORAGE_CLASS="STANDARD"  # 標準クラス（アクセス頻度高い）
REGION="us-central1"  # 低価格リージョン
```

### コスト内訳・推定
```
📊 月額コスト内訳（実測ベース）：

🔹 フロントエンド（Cloud Run）
  • 通常利用：$0-1 USD
  • 高利用：$1-2 USD

🔹 AIエンジン（Cloud Run）
  • 通常利用：$0-1 USD
  • 高利用：$1-2 USD

🔹 Vertex AI（従量課金）
  • 基本チャット：$0-1 USD
  • 高利用：$1-2 USD

🔹 Cloud Storage
  • 画像保存：$0-1 USD

📈 合計推定：$0-6 USD/月
```

### スケーリング時のコスト
- **開発・テスト**: $0-2 USD/月
- **小規模運用**: $2-6 USD/月
- **中規模運用**: $5-15 USD/月（config.sh調整で制御可能）

## 🚀 スケーラビリティ・パフォーマンス

### 水平スケーリング
- **Cloud Run**: インスタンス自動増減（0-1000）
- **ADK Agent Engine**: 独立サービス・独立スケーリング
- **ロードバランシング**: GCP標準機能・自動分散
- **マルチリージョン**: 設定変更で対応可能

### 垂直スケーリング
```bash
# config.sh での性能調整
MEMORY="1Gi"         # 高負荷対応（512Mi → 1Gi → 2Gi）
CPU="2"              # 並列処理強化（1 → 2 → 4）
CONCURRENCY="2000"   # 同時接続数増加（1000 → 2000）
MAX_INSTANCES="5"    # 最大インスタンス数増加（1 → 5 → 10）
```

### パフォーマンス指標
```
📈 測定済みパフォーマンス：

🔹 基本チャット（Vertex AI）
  • 応答時間：2-5秒
  • 同時接続：100+
  • 成功率：99.5%+

🔹 分析レポート（ADK Agent）
  • 応答時間：20-30秒
  • 同時接続：10-20
  • 成功率：98%+

🔹 UI生成（ADK Agent）
  • 応答時間：20-25秒
  • 同時接続：10-20
  • 成功率：98%+
```

## 📊 監視・ログ・デバッグ

### 標準監視（GCP統合）
- **Cloud Run**: CPU・メモリ・リクエスト数・エラー率の自動監視
- **Cloud Storage**: アクセスログ・使用量・帯域幅監視
- **Vertex AI**: API使用量・コスト・レイテンシ監視
- **Cloud Logging**: 構造化ログ・リアルタイム表示

### カスタム監視・テスト
```bash
# 開発・デバッグツール
curl http://localhost:3000/api/debug          # ローカル環境確認
./debug.sh                                   # 統合デバッグ・診断
```

### 運用監視項目
- **処理時間**: AI機能別レスポンス時間（basic: <5s, analysis: <30s, ui_generation: <25s）
- **エラー率**: HTTP 4xx/5xx・AI API失敗率
- **使用量統計**: 機能別使用頻度・ユーザー行動分析
- **コスト監視**: 日次・月次コスト推移・予算アラート

### デバッグ・トラブルシューティング
```bash
# Cloud Run ログ確認
gcloud run services logs read ai-chat-frontend-dev --region us-central1

# サービス状態確認
gcloud run services describe ai-chat-frontend-dev --region us-central1

# リビジョン履歴
gcloud run revisions list --service ai-chat-frontend-dev --region us-central1
```

## 🔧 拡張ポイント・カスタマイズ

### 新AI機能の追加（人間-AI協働）
```typescript
// 1. 機能定義（人間が設計）
// packages/frontend/src/core/types/AIFeatures.ts
export type AIFeatureType = 
  | "basic_chat"
  | "analysis_report" 
  | "ui_generation"
  | "translation";  // 新機能追加

translation: {
  type: "translation",
  name: "翻訳",
  processingMode: "vertex_direct",  // 🔴 人間：AI選択
  maxInputLength: 1500,
  expectedProcessingTime: 4
}

// 2. APIエンドポイント（AIが実装）
// packages/frontend/src/app/api/translation/route.ts

// 3. UI統合（AIが実装）
// ui/components/features/ に自動統合

// 4. ADK Agent（必要に応じて）
// packages/ai-agents/agents/translation/
```

### 新AIサービスの統合
```typescript
// 1. 新しい処理モード追加
export type ProcessingMode = 
  | "vertex_direct"
  | "adk_agent"
  | "openai_direct";  // 新AI追加

// 2. AIProcessor拡張
// server/lib/aiProcessor.ts
else if (config.processingMode === "openai_direct") {
  return await this.processWithOpenAI(request);
}

// 3. 設定の拡張
// core/constants/aiProviders.ts
```

### システム拡張・カスタマイズ
- **認証システム**: Firebase Auth・Auth0統合
- **データベース**: Cloud Firestore・PostgreSQL統合
- **キャッシュ**: Redis・Memcached統合
- **API Gateway**: Cloud Endpoints・Kong統合
- **監視強化**: Prometheus・Grafana統合

### 開発効率最適化
```bash
# カスタマイズ可能な設定項目
# config.sh での環境調整
REGION="asia-northeast1"     # リージョン変更
ENVIRONMENT="staging"        # 環境名変更（dev/staging/prod）
MEMORY="1Gi"                # メモリ増量
MAX_INSTANCES="3"           # 最大インスタンス数調整
LIFECYCLE_DAYS="60"         # 画像保持期間延長
```

### 拡張設計の原則
- **疎結合**: 各コンポーネントの独立性維持
- **設定駆動**: config.sh・環境変数での柔軟な調整
- **人間-AI分業**: 人間が設計・AIが実装の効率的協働
- **段階的拡張**: プロトタイプ→本格運用の段階的進化

この設計により、30秒セットアップから本格的なプロダクション運用まで、シームレスに拡張可能な柔軟性を実現しています。