# 🚀 AI Chat Starter Kit

**機能ベースAI使い分け** - ハッカソン特化、高速プロトタイピング

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Next.js](https://img.shields.io/badge/Next.js-15.3.1-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Google Cloud](https://img.shields.io/badge/Google%20Cloud-ADK%201.93.0-4285F4)](https://cloud.google.com/vertex-ai)

## ⚡ クイックスタート

```bash
git clone https://github.com/HamamotoIp/hackathon-ai-starter.git
cd hackathon-ai-starter/packages/frontend
npm install && npm run dev
```

→ **http://localhost:3000** でスタート！

## 🎯 なぜこのプロジェクト？

**AI Chat Starter Kit**は、ハッカソン・プロトタイピングに特化したAIチャットシステムです。

### 🌟 核心価値
- **高速セットアップ** - 複雑な設定なし、即座に動作
- **機能ベースAI選択** - システムが最適なAIを自動選択
- **認証なし設計** - プロトタイプに集中、認証の複雑さを排除
- **人間-AI協働** - 効率的な分業でスピード開発
- **段階的実装** - Phase 1で基盤構築、Phase 2以降で高度機能

### 📋 現在の実装状況（Phase 1）
- ✅ **チャット機能**: Vertex AI直接統合、SSEストリーミング
- ✅ **分析機能**: ADK Analysis Agent統合
- ✅ **UI生成機能**: デバイス最適化HTML生成
- ✅ **レストラン検索**: AI特集記事生成・保存・履歴管理完備
- ✅ **データ管理**: Cloud Storage + Firestore統合、完全CRUD操作
- 🔄 **レストラン検索**: 6段階Sequential Agent（Phase 2予定）
- ✅ **コンテンツ管理**: テキスト作成・編集

### 🎨 AI機能デモ

| 機能 | ページ | API エンドポイント | エージェント種別 | 特徴 |
|------|--------|--------|--------|------|
| **💬 チャット** | `/simple-chat` | `/api/chat` | Vertex AI Direct | 高速レスポンス（3秒以内）、シンプルな会話 |
| **📊 分析レポート** | `/ai-features` | `/api/analysis` | ADK Analysis Agent | 詳細な分析・構造化出力 |
| **🎨 UI生成** | `/ui-builder` | `/api/ui-generation` | ADK UI Generation Agent | デバイス最適化HTML生成、Tailwind CSS連携 |
| **🍽️ レストラン検索** | `/restaurant-search` | `/api/restaurant-search/*` | ADK Agent + Cloud Storage | 特集記事生成→自動保存→ギャラリー表示→個別管理 |
| **📁 コンテンツ管理** | `/content-management` | - | - | テキストコンテンツの作成・編集・管理 |

## 🚀 始め方

### 1. ローカル体験（推奨）
```bash
# クローン & スタート
git clone https://github.com/HamamotoIp/hackathon-ai-starter.git
cd hackathon-ai-starter/packages/frontend
npm install && npm run dev

# ブラウザで体験
open http://localhost:3000
```

### 2. 本格デプロイ（GCP）
```bash
# 1. Google Cloud SDKインストール
# 公式サイト: https://cloud.google.com/sdk/docs/install

# 2. GCP認証
gcloud auth login
gcloud auth application-default login

# 3. GCP設定
cp config.example.sh config.sh
# config.sh でPROJECT_IDを設定

# 4. ワンコマンドデプロイ
./setup.sh
```

## 🏗️ アーキテクチャ

### フロントエンド詳細構成

```
📱 Frontend (hackathon-ai-starter)
├── フレームワーク
│   ├── Next.js 15.3.1 (App Router, Server Components)
│   ├── React 19.0.0 (最新同期機能)
│   ├── TypeScript 5.x (完全型安全)
│   └── Tailwind CSS 4.0 (静的CSS + PostCSS統合)
│
├── ページコンポーネント (src/app/)
│   ├── page.tsx - トップページ（機能一覧）
│   ├── simple-chat/page.tsx - シンプルチャット画面
│   │   └── 'use client'指定、useStateでメッセージ管理
│   ├── ai-features/page.tsx - AI機能統合デモ
│   │   └── FeatureCardコンポーネントで分析機能表示
│   ├── ui-builder/page.tsx - UI生成ツール
│   │   ├── デバイスタイプ選択（auto/desktop/tablet/mobile）
│   │   ├── プレビュー/コード表示切り替え
│   │   └── iframeでリアルタイムプレビュー
│   ├── restaurant-search/page.tsx - レストラン特集記事
│   │   ├── AIが生成した記事のギャラリー表示
│   │   ├── タグ・キーワードフィルタリング機能
│   │   ├── 新規検索への導線（チャットへ誘導）
│   │   └── restaurant-search/saved/[id]/page.tsx - 個別記事詳細
│   │       ├── インライン編集・共有機能
│   │       ├── HTMLダウンロード・削除機能
│   │       └── Web Share API対応
│   └── content-management/page.tsx - コンテンツ管理
│
├── APIルート (src/app/api/)
│   ├── chat/route.ts - Vertex AI直接呼び出し
│   │   ├── runtime: 'nodejs'
│   │   ├── ストリーミング対応
│   │   └── エラーハンドリング完備
│   ├── analysis/route.ts - ADK Analysis Agent呼び出し
│   │   └── processAnalysis経由でADKエージェント利用
│   ├── ui-generation/route.ts - ADK UI Generation Agent
│   │   └── デバイスタイプをオプションで渡す
│   └── restaurant-search/ - レストラン検索API（完全CRUD）
│       ├── route.ts - ADK Agentで特集記事生成
│       ├── save/route.ts - Cloud Storage + Firestore保存
│       ├── history/route.ts - 保存済み記事一覧・フィルタリング
│       └── saved/[id]/route.ts - 個別記事取得・更新・削除
│
├── サーバーサイドライブラリ (src/lib/)
│   ├── vertex-ai.ts - Gemini 2.0 Flash直接呼び出し
│   │   ├── GoogleAuth認証
│   │   ├── ストリーミングレスポンス処理
│   │   └── チャンクSSEパース
│   ├── adk-agent.ts - ADK Agent統合（革新的実装）
│   │   ├── processAnalysis - 分析処理
│   │   ├── processUIGeneration - UI生成処理
│   │   ├── processRestaurantSearch - レストラン検索エージェント
│   │   ├── parseADKResponse - 複数フォーマット対応
│   │   └── cleanHTMLContent - エスケープ完全除去
│   ├── services/cloud-restaurant-storage.ts - Cloud統合サービス
│   │   ├── Cloud Storage HTMLファイル管理
│   │   ├── Firestore メタデータ管理
│   │   └── 完全CRUD操作サポート
│   ├── api-client.ts - クライアントサイドAPI呼び出し
│   ├── apiHelpers.ts - API共通ヘルパー関数
│   └── ai-features.ts - AI機能型定義
│
├── クライアントコンポーネント (src/components/)
│   ├── FeatureCard.tsx - AI機能テストカード
│   │   ├── 'use client'指定
│   │   ├── 分析/UI生成の統一UI
│   │   └── iframeでUI生成結果プレビュー
│   ├── hooks/ - 機能別カスタムフック
│   │   ├── use-chat.ts - チャット管理（SSE対応）
│   │   ├── use-analysis.ts - 分析機能管理
│   │   └── use-ui-generation.ts - UI生成管理
│   │   
│   └── types/ - TypeScript型定義
│       └── saved-result.ts - レストラン検索データ型
│
└── スタイリング
    ├── globals.css - Tailwind CSS設定
    │   ├── restaurant-list/cardクラス定義
    │   └── レスポンシブグリッドレイアウト
    └── tailwind.config.ts - Tailwind設定
```

### AIエージェント構成

```
🤖 AI Agents (packages/ai-agents)
├── ADK 1.93.0 + Gemini 2.0 Flash Exp
├── Analysis Agent (analysis_agent/)
│   └── agent.py - 複雑な分析タスク用エージェント
├── UI Generation Agent (ui_generation_agent/)
│   └── agent.py - デバイス最適化HTML/CSS生成エージェント
└── Restaurant Search Agent (restaurant_search_agent/)
    └── agent.py - 6段階処理SequentialAgent (将来実装予定)
        ├── Phase 1: 保存・表示機能のみ実装済み
        ├── Phase 2以降: 6段階処理フル実装予定
        │   ├── SimpleIntentAgent - ユーザー意図の構造化
        │   ├── SimpleSearchAgent - 2段階Google検索
        │   ├── SimpleSelectionAgent - 条件最適化5店舗選定
        │   ├── SimpleDescriptionAgent - 魅力的説明文生成
        │   ├── SimpleUIAgent - 1行形式HTML生成
        │   └── HTMLExtractorAgent - 純粋HTML最終抽出

☁️ GCP Infrastructure
├── Cloud Run (Frontend + Agent Engine)
├── Vertex AI (Gemini 2.0 Flash)
├── Cloud Storage (レストラン記事HTML保存)
└── Firestore (レストラン記事メタデータ管理)
```

## 📚 ドキュメント

### 🚀 すぐ始める
- **[クイックスタート](./docs/01-quickstart.md)** - 5分で始める基本セットアップ
- **[🚀 デプロイガイド](./docs/04-deployment.md)** - 並列デプロイ・最適化機能
- **[🔧 環境変数リファレンス](./docs/09-environment-variables.md)** - 完全設定ガイド

### 🔧 開発・カスタマイズ
- **[アーキテクチャ](./docs/02-architecture.md)** - システム構成・設計思想
- **[📡 API仕様](./docs/03-api-reference.md)** - 統合API仕様書（全エンドポイント）
- **[開発ガイド](./docs/05-development.md)** - カスタマイズ・拡張方法
- **[レストラン検索実装](./docs/07-restaurant-search.md)** - レストラン検索機能詳細
- **[トラブルシューティング](./docs/08-troubleshooting.md)** - 問題解決・FAQ

## 🛠️ 技術スタック

### フロントエンド
- **Next.js 15.3.1** - App Router, Server Components, Turbopack
- **React 19.0.0** - 最新の同期機能
- **TypeScript 5.x** - 完全型安全性
- **Tailwind CSS 4.0** - PostCSS統合、効率的スタイリング
- **Radix UI** - アクセシブルなUIコンポーネント

### AI・バックエンド
- **Google ADK 1.93.0** - Agent Development Kit
  - LlmAgent: 単一タスク特化エージェント
  - SequentialAgent: 複数エージェントの連携実行
  - カスタムツール: BaseTool継承で独自ツール実装
- **Vertex AI Agent Engine** - エージェントのホスティング
- **Gemini 2.0 Flash Exp** - 高速・低コスト・最新モデル
- **Cloud Run** - フロントエンドのサーバーレス実行
- **Cloud Storage** - 画像アップロード・静的ファイル管理

## 🍽️ レストラン検索機能の使い方

### 1. チャットで検索
`/simple-chat`で自然な言葉でレストランを検索：
- 「渋谷でデートに使えるイタリアン」
- 「銀座で接待向けの高級和食」
- 「新宿で女子会におすすめのカフェ」

### 2. AI特集記事の自動生成
AIが検索内容を理解し、包括的な特集記事を生成：
- 📍 おすすめレストラン情報（5-8店舗）
- 🎯 各店舗の特徴・雰囲気・価格帯
- 🚃 アクセス情報・営業時間
- 💡 シーン別のおすすめポイント

### 3. 記事の保存・管理
`/restaurant-search`で生成された記事を完全管理：
- 📂 **ギャラリー表示**: 美しいカード形式で一覧
- 🏷️ **スマートフィルタリング**: タグ・キーワードで瞬時検索
- ✏️ **インライン編集**: タイトル・タグをワンクリック編集
- 📤 **共有機能**: Web Share API + URLコピー
- 💾 **HTMLダウンロード**: 完全なHTMLファイル取得
- ☁️ **クラウド統合**: Cloud Storage + Firestore で永続保存

## 💰 コスト効率

**月額 $0-15** での本格運用を実現：

- **開発・デモ**: $0-3 (最小限の使用)
- **ハッカソン**: $3-8 (中程度の使用)
- **プロトタイプ運用**: $8-15 (継続的使用)

## 🛠️ 技術的特徴

### フロントエンド実装の特徴

#### 1. Next.js 15 App Router活用
- **Server Components**: トップページでSEO最適化
- **Client Components**: 'use client'でインタラクティブUI
- **API Routes**: サーバーサイドでAI呼び出し
- **Streaming**: チャットでSSEストリーミング対応

#### 2. カスタムフックの設計
```typescript
// 例: use-analysis.ts
export function useAnalysis() {
  const [state, setState] = useState<UseAnalysisState>({
    isLoading: false,
    result: null,
    error: null,
    processingTimeMs: null
  });
  
  const analyze = async (input: string) => {
    // API呼び出しと状態管理
  };
  
  return { ...state, analyze, reset };
}

// Phase 1: レストラン検索はギャラリー表示のみ（カスタムフック不要）
```

#### 3. ADKエージェントレスポンス解析
```typescript
// adk-agent.tsの革新的レスポンス処理
function parseADKResponse(responseData: string): string {
  // 1. 直接JSONレスポンス
  // 2. SSE形式レスポンス
  // 3. HTML直接抽出
  // 4. エスケープ除去処理
}
```

#### 4. UIデザインパターン
- **グラデーション背景**: `bg-gradient-to-br from-blue-50 to-indigo-100`
- **カードデザイン**: `rounded-xl shadow-lg`
- **インタラクティブ要素**: `hover:効果`, `disabled:状態`
- **アニメーション**: `animate-spin`, `transition-colors`

### Restaurant Search Agent Phase 1実装

**Phase 1: 保存・表示機能**による基盤構築：

#### Phase 1で実装済みの機能
- **保存システム**: Cloud Storage + Firestore連携
- **表示システム**: ギャラリー表示とレスポンシブデザイン
- **データ管理**: メタデータ構造化と効率的な取得
- **Phase 2準備**: 6段階処理エージェントの基盤設計完了

#### Phase 2以降で実装予定の6段階処理フロー（SequentialAgent）
1. **SimpleIntentAgent**: 
   - ユーザー入力からエリア・シーン・時間・要望を抽出
   - JSON形式で構造化出力
2. **SimpleSearchAgent**: 
   - カスタムTwoStepSearchToolで2段階検索
   - 基本検索→5件未満なら追加検索
   - 最大10件まで取得
3. **SimpleSelectionAgent**: 
   - ユーザー条件に最適な5店舗を選定
   - 選定理由も生成
4. **SimpleDescriptionAgent**: 
   - 各店舗150文字の魅力的説明文
   - シーンに合わせた訴求ポイント
5. **SimpleUIAgent**: 
   - HTMLOutputスキーマで1行形式強制
   - globals.css連携クラス名使用
   - レスポンシブ対応HTML生成
6. **HTMLExtractorAgent**: 
   - JSON構造から純粋HTML抽出
   - 最終的なクリーンアップ

### フロントエンド最適化

#### パフォーマンス最適化
- **コード分割**: 動的インポートで初期ロード高速化
- **画像最適化**: next/imageで自動最適化
- **キャッシュ戦略**: APIルートで適切なキャッシュヘッダー
- **SSR/SSG**: 静的ページはSSG、動的ページはSSR

#### アクセシビリティ
- **セマンティックHTML**: 適切なタグ使用
- **ARIA属性**: ボタンやフォームにARIAラベル
- **キーボードナビゲーション**: フォーカス管理
- **コントラスト**: WCAG準拠の色コントラスト

#### 実装のポイント

**1. カスタムツール実装（TwoStepSearchTool）**
```python
class TwoStepSearchTool(BaseTool):
    def __init__(self):
        super().__init__(
            name="two_step_search",
            description="レストランの2段階検索を実行"
        )
    
    async def run_async(self, search_params: Dict[str, Any]) -> str:
        # Step 1: 基本検索
        basic_query = f"{area} {scene} {time} レストラン"
        results1 = await google_search.run_async(basic_query)
        
        # Step 2: 結果が5件未満なら追加検索
        if len(all_results) < 5:
            broad_query = f"{area} おすすめ レストラン"
            results2 = await google_search.run_async(broad_query)
```

**2. Pydanticスキーマで出力制御**
```python
class HTMLOutput(BaseModel):
    """1行形式の純粋なHTML出力用のスキーマ"""
    html: str = Field(
        description="Complete HTML document in single line format starting with <!DOCTYPE html> and ending with </html>. No newlines, no indentation, no code blocks, no JSON, just raw HTML in one line."
    )

# SimpleUIAgentで使用
simple_ui_agent = LlmAgent(
    output_schema=HTMLOutput,  # スキーマで出力形式を強制
    instruction="""HTMLは必ず1行形式で出力（改行文字\\nは使用禁止）"""
)
```

**3. フロントエンドのエスケープ除去**
```typescript
function cleanHTMLContent(content: string): string {
  return content
    .replace(/\\n/g, ' ')      // 改行をスペースに
    .replace(/\\"/g, '"')      // クォート復元
    .replace(/```[^`]*```/g, '') // コードブロック除去
    .replace(/\s+/g, ' ')      // 空白正規化
    .trim();
}
```

**4. インラインスタイル完全対応**
```html
<!-- 完全なセルフコンテインドHTML生成 -->
<div class="restaurant-card" style="background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); padding: 20px;">
  <h3 style="font-size: 20px; font-weight: bold; color: #1f2937; margin-bottom: 12px;">レストラン名</h3>
  <p style="color: #6b7280; margin-bottom: 16px; line-height: 1.6;">説明文</p>
  <button style="background-color: #3b82f6; color: white; padding: 8px 16px; border: none; border-radius: 6px;" 
          onmouseover="this.style.backgroundColor='#2563eb'" 
          onmouseout="this.style.backgroundColor='#3b82f6'">詳細を見る</button>
</div>
```

**5. フロントエンドのエラーハンドリング**
```typescript
// APIエラーの統一処理
try {
  const response = await fetch(API_ENDPOINTS.RESTAURANT_SEARCH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
} catch (error) {
  setState({
    isLoading: false,
    result: null,
    error: error instanceof Error ? error.message : '予期しないエラー',
    processingTimeMs: null
  });
}
```

**6. TypeScript型安全性 (Phase 1実装)**
```typescript
// Phase 1: 保存・取得用型定義
interface RestaurantArticle {
  id: string;
  title: string;
  htmlContent: string;
  createdAt: string;
  storageUrl: string;
}

interface RestaurantHistoryResponse {
  success: boolean;
  articles: RestaurantArticle[];
}

// Phase 2以降で拡張予定
interface RestaurantSearchAPIResponse {
  success: boolean;
  result: string;  // HTML文字列
  processingMode: "adk_agent";
  processingTimeMs: number;
  sessionId: string;
  timestamp: string;
  workflowComplete?: boolean;
  finalAgent?: string;
}
```

## 🤝 コントリビューション

このプロジェクトは、人間-AI協働開発の実践例でもあります。

### 開発の分業
- **🔴 人間**: ビジネスロジック設計、AI機能設計、重要な意思決定
- **🤖 AI**: UIコンポーネント実装、API実装、繰り返し作業

### コントリビューション方法
1. Issueで機能提案・バグ報告
2. Pull Requestで改善提案
3. [上級者ガイド](./docs/advanced/claude-collaboration.md)で協働開発パターンを学習

## 📄 ライセンス

Apache License 2.0 - 商用利用・改変・再配布自由

## 🔗 リンク

- **[デモサイト](#)** - ライブデモ（デプロイ後に更新）
- **[ドキュメント](./docs/)** - 完全なガイド
- **[AIエージェント詳細](./packages/ai-agents/README.md)** - ADKエージェント技術仕様
- **[Restaurant Search Agent](./packages/ai-agents/restaurant_search_agent/README.md)** - エスケープ問題解決の詳細
- **[Issue Tracker](https://github.com/your-username/ai-chat-starter-kit/issues)** - バグ報告・機能要求

---

**🎯 ミッション**: ハッカソン・プロトタイピングでAI活用を加速し、アイデアの具現化を瞬時に可能にする。