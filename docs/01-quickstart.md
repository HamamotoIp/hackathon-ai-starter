# 🚀 クイックスタート

AI Chat Starter Kitを最速で始めるためのガイド

## ⚡ 5分で始める

### 前提条件
- Node.js 18以上
- Git
- テキストエディタ

### 手順

```bash
# 1. クローン
git clone https://github.com/HamamotoIp/hackathon-ai-starter.git
cd hackathon-ai-starter

# 2. フロントエンド起動
cd packages/frontend
npm install
npm run dev

# 3. ブラウザでアクセス
open http://localhost:3000
```

**完了！** 基本的なチャット機能（Vertex AI）が使えます。

## 🎯 次のステップ

### ローカル開発を続ける場合

1. **環境変数の設定**（任意）
   ```bash
   cd packages/frontend
   
   # ローカル開発用環境変数ファイル作成
   cat > .env.local << 'EOF'
   NODE_ENV=development
   VERTEX_AI_PROJECT_ID=your-gcp-project-id
   VERTEX_AI_LOCATION=us-central1
   EOF
   
   # 必要に応じて編集
   code .env.local
   ```

2. **開発コマンド**
   ```bash
   npm run dev        # 開発サーバー
   npm run lint       # コード品質チェック  
   npm run build      # ビルド確認
   npm test           # テスト実行
   ```

### GCPにデプロイする場合

高度なAI機能（Agent Engine）を使いたい場合：

1. **前提条件**
   ```bash
   # Google Cloud CLI認証
   gcloud auth login
   gcloud auth application-default login
   ```

2. **設定ファイル作成**
   ```bash
   cp config.example.sh config.sh
   # config.shでPROJECT_IDを設定
   ```

3. **🚀 最適化デプロイ実行**
   ```bash
   ./setup.sh
   # → 並列Agent Engineデプロイ（3エージェント同時）
   # → 従来比60-70%高速化（実測値）
   # → 自動フォールバック機能付き
   ```

**デプロイ結果例**:
```
📊 デプロイ統計
  成功: 3 / 3
  実行時間: 195秒
  時間短縮: 78.3% (順次実行比)

🤖 デプロイ済みAgent Engine:
  📊 分析レポート: 成功
  🎨 UI生成: 成功  
  🍽️ レストラン検索: 成功
```

詳細は [デプロイメントガイド](./04-deployment.md) と [環境変数リファレンス](./09-environment-variables.md) を参照

## 🤖 利用可能なAI機能

### ローカル開発（即座に利用可能）
- ✅ **基本チャット** - Vertex AI Direct（高速応答）
- ✅ **シンプルチャット** - 基本的な対話

### GCPデプロイ後（高度な機能）
- 📊 **データ分析** - グラフ・表生成（Analysis Agent）
- 🎨 **UI生成** - 動的HTML/CSS生成（UI Generation Agent）  
- 🍽️ **レストラン検索** - 6段階AI処理（Restaurant Search Agent）

## 💡 Tips

- **開発中のホットリロード**: ファイル保存で自動反映
- **TypeScript**: 型安全な開発が可能
- **Tailwind CSS**: ユーティリティファーストのスタイリング

## 🔍 トラブルシューティング

### よくある問題

**Q: npm installでエラー**
```bash
# Node.jsバージョン確認
node --version  # 18以上が必要

# キャッシュクリア
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Q: ポート3000が使用中**
```bash
# 別のポートで起動
PORT=3001 npm run dev
```

詳細は [トラブルシューティング](./08-troubleshooting.md) を参照

## 📚 関連ドキュメント

- [アーキテクチャ](./02-architecture.md) - システム構成の理解
- [開発ガイド](./05-development.md) - カスタマイズ方法
- [API仕様](./03-api-reference.md) - エンドポイント詳細