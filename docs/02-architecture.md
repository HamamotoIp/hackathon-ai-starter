# 🏗️ アーキテクチャ

AI Chat Starter Kitのシステム設計と構成

## 🎯 システム概要

機能ベースでAIを使い分けるハッカソン特化のチャットシステム。Vertex AI Direct（高速）とADK Agent Engine（高品質）を適切に使い分けます。

## 🏛️ 全体アーキテクチャ

```
┌─────────────────────────────────────────────────────────┐
│                  🌐 フロントエンド                        │
│                 Next.js 15.3.1 App Router               │
├─────────────────────────────────────────────────────────┤
│  📱 ページ                   🎨 コンポーネント            │
│  ├── /                      ├── common/                 │
│  ├── /simple-chat           ├── features/              │
│  ├── /ai-features           └── restaurant-search/     │
│  ├── /restaurant-search                                │
│  └── /content-management                               │
│                                                         │
│  🔌 API Routes                                          │
│  ├── /api/chat              → Vertex AI Direct         │
│  ├── /api/analysis          → ADK Analysis Agent       │
│  ├── /api/ui-generation     → ADK UI Generation        │
│  ├── /api/restaurant-search → ADK Sequential Agent     │
│  └── /api/images/upload     → Cloud Storage            │
└─────────────────────────────────────────────────────────┘
                          ║
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   🤖 AI エンジン                         │
├────────────────────────┬────────────────────────────────┤
│   Vertex AI Direct     │    ADK Agent Engine            │
│  ・高速応答 (< 5秒)     │  ・深度分析 (20-45秒)          │
│  ・基本チャット         │  ・分析レポート生成             │
│  ・低コスト            │  ・UI/HTML生成                 │
│                       │  ・レストラン特集記事           │
└────────────────────────┴────────────────────────────────┘
                          ║
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   ☁️ GCP インフラ                        │
│  🚀 Cloud Run     📦 Cloud Storage    🔥 Firestore    │
│  🧠 Vertex AI     🔐 IAM              📊 Logging      │
└─────────────────────────────────────────────────────────┘
```

## 🔀 データフロー

### 1. 基本的な処理フロー

```
ユーザー入力
    │
    ▼
API Route判定
    │
    ├─→ 簡単な質問 → /api/chat → Vertex AI Direct
    │                            （2-5秒で応答）
    │
    └─→ 複雑な要求 → /api/[feature] → ADK Agent Engine
                                     （20-45秒で詳細処理）
```

### 2. レストラン検索の特殊フロー

```
検索リクエスト → ADK 6段階処理 → HTML生成
                               ↓
                         自動保存処理
                         ├→ Cloud Storage（HTML）
                         └→ Firestore（メタデータ）
```

## 🧩 主要コンポーネント

### フロントエンド構造
```
packages/frontend/src/
├── app/              # ページとAPIルート
├── components/       # UIコンポーネント
├── lib/              # ユーティリティ
│   ├── adk-agent.ts  # ADK統合
│   ├── vertex-ai.ts  # Vertex AI統合
│   └── services/     # ビジネスロジック
└── types/            # 型定義
```

### AI機能の処理モード
- **vertex_direct**: 高速・基本的な応答
- **adk_agent**: 詳細分析・構造化出力

## 🔄 AI エンジン比較

| 項目 | Vertex AI Direct | ADK Agent Engine |
|------|------------------|------------------|
| 応答速度 | < 5秒 | 20-45秒 |
| 用途 | 基本チャット | 分析・UI生成・検索 |
| コスト | 低（$0-3/月） | 中（$2-6/月） |
| カスタマイズ | 限定的 | 高い |
| 出力形式 | テキスト | JSON/HTML |

## 🔐 セキュリティ

### 現在の設計
- **認証なし**: ハッカソン向けに最速セットアップ
- **環境変数**: 機密情報の安全な管理
- **IAM**: 最小権限のサービスアカウント
- **入力制限**: 文字数とタイムアウト

### 本番対応
- Firebase Auth統合が容易
- Cloud Armorでレート制限
- SSL/TLS標準対応

## 💰 コスト最適化

### 月額推定コスト
- 開発環境: $0-2
- 小規模運用: $2-6  
- 中規模運用: $5-15

### 最適化設定
```bash
# config.sh
MEMORY="512Mi"      # 最小限のメモリ
CPU="1"             # 最小限のCPU
MAX_INSTANCES="1"   # インスタンス制限
MIN_INSTANCES="0"   # アイドル時は0
```

## 🚀 スケーラビリティ

### 水平スケーリング
- Cloud Runの自動スケーリング（0-1000インスタンス）
- 各AIエンジンの独立スケーリング

### 垂直スケーリング
```bash
# 高負荷対応時の調整
MEMORY="2Gi"        # メモリ増量
CPU="4"             # CPU増量
MAX_INSTANCES="10"  # インスタンス数増加
```

## 📊 監視とデバッグ

### 標準監視
- Cloud Logging: リアルタイムログ
- Cloud Monitoring: メトリクス監視
- Error Reporting: エラー追跡

### デバッグツール
```bash
# ローカル環境
curl http://localhost:3000/api/debug

# 本番環境
./debug.sh
```

## 🔧 拡張ポイント

### 新AI機能の追加
1. 型定義に機能追加（types/）
2. APIルート作成（app/api/）
3. UI統合（components/）

### 外部サービス統合
- データベース: Firestore/PostgreSQL
- 認証: Firebase/Auth0
- キャッシュ: Redis/Memcached

## 📚 関連ドキュメント

- [開発ガイド](./05-development.md) - 詳細な開発手順
- [API仕様](./03-api-reference.md) - エンドポイント詳細
- [デプロイメント](./04-deployment.md) - 本番環境構築