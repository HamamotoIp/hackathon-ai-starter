# 🤝 Claude協働開発ガイド

Claude Code (claude.ai/code) での効率的な開発手順

## 📋 プロジェクト概要

**AI Chat Starter Kit** - ハッカソン向け高速AI開発フレームワーク

### 主要特徴
- 🚀 30分で新AI機能追加
- 💰 月額$0-15での本格運用
- 🤖 人間-AI協働開発に最適化
- ⚡ 認証なし設計で高速セットアップ

## 🏗️ システム構成

```
📱 Next.js Frontend → 🤖 AI処理 → ☁️ GCP Infrastructure
├── Vertex AI Direct    ├── ADK Agent Engine    ├── Cloud Run
├── 基本チャット        ├── 分析・UI生成        ├── Cloud Storage
└── 高速応答(2-5秒)     └── 詳細処理(20-45秒)   └── Vertex AI
```

### 実装済み機能
- ✅ 基本チャット（Vertex AI）
- ✅ 分析レポート（ADK Agent）
- ✅ UI生成（ADK Agent）
- ✅ レストラン検索（Sequential Agent）
- ✅ 画像管理（Cloud Storage）

## 🛠️ 開発コマンド

### 統合デプロイ（推奨）
```bash
# 設定とデプロイ
cp config.example.sh config.sh
# PROJECT_ID編集後
./setup.sh

# 確認
./debug.sh
```

### ローカル開発
```bash
# フロントエンド
cd packages/frontend
npm run dev

# Agent Engine
cd packages/ai-agents
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python app.py
```

## 🎯 人間-AI分業ガイドライン

### 人間が担当
- 🔴 **ビジネスロジック設計**
- 🔴 **AI機能の要件定義**
- 🔴 **アーキテクチャ決定**
- 🔴 **セキュリティポリシー**

### Claudeが担当
- 🤖 **UIコンポーネント実装**
- 🤖 **API実装**
- 🤖 **繰り返し作業**
- 🤖 **デバッグ支援**

## 📚 技術スタック

### フロントエンド
- **Next.js**: 15.3.1 (App Router)
- **React**: 19.0.0
- **TypeScript**: 5.x
- **Tailwind CSS**: 4.0
- **DOMPurify**: 3.2.6 (XSS対策)

### AI Engine
- **ADK**: 1.93.0
- **Python**: 3.10+
- **Gemini**: 2.0 Flash Exp

### Infrastructure
- **GCP**: Cloud Run, Vertex AI, Storage
- **デプロイ**: setup.sh, debug.sh

## 🚀 新AI機能追加手順

### 1. 要件定義（人間）
```typescript
// どんな機能を作るか決める
const newFeature = {
  name: "翻訳機能",
  description: "多言語翻訳",
  processingMode: "vertex_direct", // または "adk_agent"
  expectedTime: 5 // 秒
};
```

### 2. 実装（Claude）
```bash
# Claudeに依頼
「翻訳機能を追加してください。
- エンドポイント: /api/translation
- 入力: 日本語テキスト
- 出力: 英語翻訳
- 処理方式: Vertex AI Direct」
```

### 3. テスト（人間）
```bash
# 動作確認
curl -X POST http://localhost:3000/api/translation \
  -H "Content-Type: application/json" \
  -d '{"message": "こんにちは"}'
```

## 📝 Claude依頼のベストプラクティス

### 効果的な指示例

**良い例**:
```
「レストラン検索結果の表示に課題があります。
現在: HTMLが正しく表示されない
期待: きれいなレンダリング
ファイル: packages/frontend/src/lib/adk-agent.ts
関数: cleanHTMLContent」
```

**悪い例**:
```
「なんか動かない」
```

### 段階的な依頼

```bash
# Step 1: 調査
「現在のレストラン検索機能の実装を確認してください」

# Step 2: 問題特定
「HTMLエスケープの問題を解決してください」

# Step 3: 実装
「cleanHTMLContent関数を改善してください」

# Step 4: テスト
「修正をテストしてください」
```

## 🔍 トラブルシューティング支援

### Claudeへの問題報告テンプレート

```
## 問題の詳細
- **現象**: 何が起きているか
- **期待する動作**: どうなるべきか
- **エラーメッセージ**: 具体的なエラー
- **再現手順**: どうやって問題を起こすか
- **関連ファイル**: どのファイルが関係するか

## 環境情報
- ローカル環境 or 本番環境
- ブラウザ情報（該当する場合）
- デプロイ状況

## ログ・スクリーンショット
（可能であれば添付）
```

### よくある問題と指示例

**デプロイエラー**:
```
「setup.shでエラーが発生しました。
エラー: [具体的なエラーメッセージ]
ログを確認して解決方法を教えてください」
```

**API接続エラー**:
```
「AIエンドポイントに接続できません。
URL: /api/analysis
エラー: 500 Internal Server Error
debug.shの結果も確認してください」
```

**UI表示問題**:
```
「生成されたHTMLが正しく表示されません。
現在の表示: [スクリーンショット]
期待する表示: [説明]
関連コンポーネント: [ファイル名]」
```

## 💡 効率的な協働Tips

### 1. コンテキスト共有
```bash
# 現在の状態を共有
「現在のディレクトリ構造を確認してください」
「既存のAI機能の実装パターンを確認してください」
```

### 2. 段階的な開発
```bash
# 小さな単位で進める
「まず基本的な翻訳機能を実装」
「次にエラーハンドリングを追加」
「最後にUIを改善」
```

### 3. テスト駆動
```bash
# テストしながら進める
「実装後、必ずテストコマンドを実行してください」
「curl でAPI動作を確認してください」
```

## 📚 参考コマンド集

### 開発確認
```bash
# サービス状態確認
./debug.sh

# ローカルテスト
npm run dev
curl http://localhost:3000/api/debug

# 型チェック
npm run type-check

# ビルド確認
npm run build
```

### 本番確認
```bash
# デプロイ状況
gcloud run services list

# ログ確認
gcloud run services logs read ai-chat-frontend-dev

# 環境変数確認
gcloud run services describe ai-chat-frontend-dev
```

## 🎯 プロジェクト目標

### 短期目標（現在〜1ヶ月）
- 新AI機能の迅速な追加
- 安定した本番運用
- パフォーマンス最適化

### 中期目標（1〜3ヶ月）
- 認証システム統合
- 高度なAI機能（複数Agent連携）
- 監視・ログシステム強化

### 長期目標（3ヶ月〜）
- マルチテナント対応
- 外部AI統合（OpenAI、Anthropic）
- エンタープライズ対応

このガイドに従って、効率的にClaude Codeでの開発を進めてください。