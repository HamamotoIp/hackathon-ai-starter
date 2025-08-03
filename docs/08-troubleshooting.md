# 🔍 トラブルシューティング

よくある問題と解決方法

## 🚀 セットアップ関連

### デプロイ失敗

**問題**: `./setup.sh`でエラーが発生
```bash
Error: Project ID not set
```

**解決方法**:
```bash
# 1. 設定ファイル確認
cat config.sh | grep PROJECT_ID

# 2. プロジェクトID設定
vim config.sh
# PROJECT_ID="your-gcp-project-id" に変更

# 3. 再実行
./setup.sh
```

**問題**: 権限不足エラー
```bash
ERROR: (gcloud.services.enable) User does not have permission
```

**解決方法**:
```bash
# 再認証
gcloud auth login
gcloud auth application-default login

# プロジェクト設定確認
gcloud config get-value project
gcloud config set project your-project-id
```

### Cloud Run デプロイエラー

**問題**: ビルドが失敗する
```bash
ERROR: build step 0 failed
```

**解決方法**:
```bash
# ログ確認
gcloud builds list --limit=5
gcloud builds log [BUILD-ID]

# 手動ビルド
cd packages/frontend
docker build -t gcr.io/${PROJECT_ID}/frontend .
```

## 🤖 AI機能関連

### Vertex AI接続エラー

**問題**: `Authentication error`
```bash
Error: Could not load the default credentials
```

**解決方法**:
```bash
# Application Default Credentials設定
gcloud auth application-default login

# 権限確認
gcloud auth list
gcloud services list --enabled | grep aiplatform
```

**問題**: `Project not found`
```bash
Error: Project your-project-id does not exist
```

**解決方法**:
```bash
# プロジェクト一覧確認
gcloud projects list

# 正しいプロジェクトID設定
gcloud config set project CORRECT-PROJECT-ID
```

### ADK Agent接続エラー

**問題**: Agent URLが見つからない
```bash
Error: RESTAURANT_SEARCH_AGENT_URL環境変数が設定されていません
```

**解決方法**:
```bash
# Agent URL確認
ls packages/ai-agents/*_agent_url.txt

# 環境変数設定
export RESTAURANT_SEARCH_AGENT_URL=$(cat packages/ai-agents/restaurant_search_agent_url.txt)

# Cloud Runの環境変数更新
gcloud run services update ai-chat-frontend-dev \
  --set-env-vars RESTAURANT_SEARCH_AGENT_URL=${AGENT_URL}
```

## 🗄️ データベース関連

### Cloud Storage エラー

**問題**: バケットが存在しない
```bash
Error: Bucket does not exist
```

**解決方法**:
```bash
# バケット作成
gsutil mb gs://${PROJECT_ID}-restaurant-results
gsutil mb gs://${PROJECT_ID}-images

# 公開設定
gsutil iam ch allUsers:objectViewer gs://${PROJECT_ID}-restaurant-results
```

**問題**: アップロード権限エラー
```bash
Error: Permission denied
```

**解決方法**:
```bash
# サービスアカウント権限確認
gcloud projects get-iam-policy ${PROJECT_ID} \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:ai-chat-dev@${PROJECT_ID}.iam.gserviceaccount.com"

# 権限追加
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:ai-chat-dev@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"
```

### Firestore エラー

**問題**: Firestoreが有効でない
```bash
Error: Firestore not enabled
```

**解決方法**:
```bash
# Firestore有効化
gcloud services enable firestore.googleapis.com

# データベース作成
gcloud firestore databases create --region=us-central1
```

**問題**: 書き込み権限エラー
```bash
Error: Missing or insufficient permissions
```

**解決方法**:
```bash
# IAM権限追加
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:ai-chat-dev@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/datastore.user"
```

## 🌐 フロントエンド関連

### ローカル開発エラー

**問題**: `npm install`でエラー
```bash
npm ERR! peer dep missing
```

**解決方法**:
```bash
# Node.jsバージョン確認
node --version  # 18以上が必要

# キャッシュクリア
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**問題**: ポート3000が使用中
```bash
Error: Port 3000 is already in use
```

**解決方法**:
```bash
# 別のポートで起動
PORT=3001 npm run dev

# または使用中プロセス終了
lsof -ti:3000 | xargs kill -9
```

### 本番環境でのエラー

**問題**: 環境変数が読み込まれない
```bash
Error: VERTEX_AI_PROJECT_ID is not defined
```

**解決方法**:
```bash
# 環境変数確認
gcloud run services describe ai-chat-frontend-dev \
  --region us-central1 \
  --format="value(spec.template.spec.containers[0].env[].name)"

# 環境変数設定
gcloud run services update ai-chat-frontend-dev \
  --region us-central1 \
  --set-env-vars VERTEX_AI_PROJECT_ID=${PROJECT_ID}
```

**問題**: CORS エラー
```bash
Access-Control-Allow-Origin header is missing
```

**解決方法**:
```typescript
// middleware.ts または API route
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  
  return response;
}
```

## 🔄 レストラン検索関連

### 保存エラー

**問題**: HTMLの保存に失敗
```bash
Error: 保存に失敗しました
```

**解決方法**:
```bash
# バケット確認
gsutil ls gs://${PROJECT_ID}-restaurant-results

# 権限確認
gsutil iam get gs://${PROJECT_ID}-restaurant-results

# 手動テスト
echo "test" | gsutil cp - gs://${PROJECT_ID}-restaurant-results/test.txt
```

### 表示エラー

**問題**: HTMLが正しく表示されない
```
&lt;div&gt; のようなエスケープ文字が表示される
```

**解決方法**:
HTMLクリーニング関数の確認:
```typescript
// lib/adk-agent.ts の cleanHTMLContent関数
function cleanHTMLContent(content: string): string {
  return content
    .replace(/\\"/g, '"')      // エスケープ除去
    .replace(/\\n/g, ' ')      // 改行をスペースに
    .replace(/\s+/g, ' ')      // 連続空白を1つに
    .trim();
}
```

**問題**: 検索結果が表示されない
```bash
Error: 履歴の取得に失敗しました
```

**解決方法**:
```bash
# Firestoreデータ確認
gcloud firestore export gs://${PROJECT_ID}-backup

# 手動でドキュメント作成テスト
# Firestore console で restaurant-results コレクションを確認
```

## 📊 パフォーマンス問題

### 応答が遅い

**問題**: AI処理に時間がかかりすぎる
```
レスポンス時間: 60秒以上
```

**解決方法**:
```bash
# Cloud Runリソース増量
gcloud run services update ai-chat-frontend-dev \
  --memory 1Gi \
  --cpu 2 \
  --region us-central1

# タイムアウト設定延長
gcloud run services update ai-chat-frontend-dev \
  --timeout 900 \
  --region us-central1
```

### メモリ不足

**問題**: Out of memory error
```bash
Error: JavaScript heap out of memory
```

**解決方法**:
```bash
# メモリ制限緩和
NODE_OPTIONS="--max-old-space-size=4096" npm run dev

# 本番環境のメモリ増量
MEMORY="2Gi" ./setup.sh
```

## 🔧 デバッグ方法

### ログ確認

```bash
# Cloud Run ログ（リアルタイム）
gcloud run services logs tail ai-chat-frontend-dev --region us-central1

# Cloud Run ログ（過去分）
gcloud run services logs read ai-chat-frontend-dev --region us-central1 --limit 100

# Cloud Build ログ
gcloud builds list --limit 10
gcloud builds log [BUILD-ID]
```

### ローカルデバッグ

```bash
# デバッグモードで起動
DEBUG=true npm run dev

# API直接テスト
curl -X POST http://localhost:3000/api/debug

# 詳細エラー表示
NODE_ENV=development npm run dev
```

### システム状態確認

```bash
# 統合デバッグツール
./debug.sh

# サービス状態確認
gcloud run services list --region us-central1

# API状態確認
curl https://your-app.run.app/api/debug | jq .
```

## 🆘 緊急時の対応

### サービス停止

```bash
# 緊急停止
gcloud run services update ai-chat-frontend-dev \
  --max-instances 0 \
  --region us-central1

# 復旧
gcloud run services update ai-chat-frontend-dev \
  --max-instances 5 \
  --region us-central1
```

### データベースロールバック

```bash
# Firestoreバックアップからの復元
gcloud firestore import gs://${PROJECT_ID}-backup/[TIMESTAMP]
```

### 設定リセット

```bash
# 設定を初期状態に戻す
git checkout -- config.sh
cp config.example.sh config.sh
# PROJECT_IDを再設定して ./setup.sh
```

## 📞 サポート情報

### よく使うコマンド集

```bash
# プロジェクト情報
gcloud config get-value project
gcloud services list --enabled

# サービス状態
gcloud run services describe ai-chat-frontend-dev --region us-central1

# 環境変数確認
env | grep VERTEX
```

### 問い合わせ先

1. **GitHub Issues**: バグ報告・機能要望
2. **Cloud Console**: GCPリソースの確認
3. **ログ分析**: Cloud Logging でエラー詳細確認

### 参考ドキュメント

- [Google Cloud Run](https://cloud.google.com/run/docs)
- [Vertex AI](https://cloud.google.com/vertex-ai/docs)
- [Next.js](https://nextjs.org/docs)

このトラブルシューティングガイドで解決しない場合は、エラーメッセージとログを添えてIssueを作成してください。