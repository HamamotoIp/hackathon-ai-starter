# 🔧 トラブルシューティング

## よくあるエラーと解決方法

### デプロイ関連

#### 1. 認証エラー
```
ERROR: (gcloud.auth.login) Your current active account [xxx] does not have any valid credentials
```

**解決方法:**
```bash
gcloud auth login
gcloud auth application-default login
```

#### 2. PROJECT_ID未設定
```
ERROR: PROJECT_ID is not set
```

**解決方法:**
```bash
# .envを確認
cat .env

# PROJECT_IDを設定
export PROJECT_ID="your-project-id"
```

#### 3. API未有効化
```
ERROR: API [xxx] not enabled
```

**解決方法:**
```bash
gcloud services enable aiplatform.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable firestore.googleapis.com
```

#### 4. 権限不足
```
ERROR: Permission denied
```

**解決方法:**
```bash
# プロジェクトオーナー権限が必要
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="user:your-email@example.com" \
  --role="roles/owner"
```

### エージェントデプロイ関連

#### 5. Cloud Build失敗
```
ERROR: build failed
```

**解決方法:**
```bash
# ログ確認
gcloud logging read 'resource.type="build"' --limit=10

# 再デプロイ
./deploy-agents-parallel.sh
```

#### 6. Python依存関係エラー
```
ERROR: Could not install packages
```

**解決方法:**
```bash
cd packages/ai-agents
rm -rf venv
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### フロントエンド関連

#### 7. TypeScriptエラー
```
ERROR: Cannot find module '@/lib/...' or its corresponding type declarations
```

**解決方法:**
```bash
# 型チェック実行
npm run type-check

# インポートパス確認（新しい構造）
# × import { ... } from '@/lib/api-client';
# ○ import { ... } from '@/lib/core/api/client';

# × import { ... } from '@/lib/ai-features';  
# ○ import { ... } from '@/lib/types/api-common';
```

#### 8. ビルドエラー
```
ERROR: Failed to compile
```

**解決方法:**
```bash
# クリーンビルド
rm -rf .next
npm run build

# 依存関係再インストール
rm -rf node_modules package-lock.json
npm install
```

#### 9. npm install失敗
```
ERROR: EACCES: permission denied
```

**解決方法:**
```bash
# Node.js権限修正
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules

# または
npm install --unsafe-perm
```

#### 10. ポート使用中
```
ERROR: Port 3000 is already in use
```

**解決方法:**
```bash
# ポート確認
lsof -ti:3000

# プロセス終了
kill $(lsof -ti:3000)

# または別ポート使用
npm run dev -- -p 3001
```

### Cloud Run関連

#### 11. メモリ不足
```
ERROR: Container memory limit exceeded
```

**解決方法:**
```bash
# .envでメモリ増加
MEMORY="1Gi"  # 512Mi → 1Gi

# 再デプロイ
./deploy-frontend.sh
```

#### 12. タイムアウトエラー
```
ERROR: Request timeout
```

**解決方法:**
```bash
# Cloud Runのタイムアウト設定変更
gcloud run services update SERVICE_NAME \
  --timeout=900 \
  --region=us-central1
```

### ストレージ関連

#### 13. バケット作成失敗
```
ERROR: Bucket already exists
```

**解決方法:**
```bash
# バケット名を変更
BUCKET_NAME="$PROJECT_ID-images-$(date +%s)"

# または既存バケットを使用
gsutil ls gs://existing-bucket-name
```

#### 14. Firestore未初期化
```
ERROR: Firestore database not found
```

**解決方法:**
```bash
# Firestoreデータベース作成
gcloud firestore databases create \
  --location=us-central1 \
  --project=$PROJECT_ID
```

## パフォーマンス改善

### フロントエンド開発効率化

#### 1. 構造整理後の開発フロー
```bash
# 型チェックとビルド
npm run type-check && npm run build

# 機能別開発（例：新しいAI機能追加）
mkdir src/lib/features/new-feature
# types.ts, adk-processor.ts を作成
# src/app/api/new-feature/route.ts を作成
```

#### 2. インポートパスの正規化
```typescript
// 推奨：機能別インポート
import { processAnalysis } from '@/lib/features/analysis/adk-processor';
import { CloudRestaurantStorage } from '@/lib/features/restaurant-search/storage-service';

// 推奨：共通処理インポート
import { apiClient } from '@/lib/core/api/client';
import { sanitizeHTML } from '@/lib/core/utils/sanitize';
```

### デプロイ高速化

#### 3. 並列デプロイ使用
```bash
# 順次デプロイ（遅い）
./deploy-agents.sh

# 並列デプロイ（高速）
./deploy-agents-parallel.sh
```

#### 4. キャッシュ活用
```bash
# Docker キャッシュクリア
gcloud builds submit --no-cache

# npm キャッシュクリア
npm cache clean --force
```

### リソース最適化

#### 5. Cloud Run設定
```bash
# .env で最適化
MEMORY="512Mi"      # 最小限
CPU="1"             # 1CPU
MAX_INSTANCES="1"   # コスト削減
MIN_INSTANCES="0"   # アイドル課金回避
```

#### 6. 不要なエージェント削除
```bash
# 古いエージェント確認
./cleanup_old_agents.sh

# 削除実行
./cleanup_old_agents.sh --execute
```

## ログ確認方法

### Cloud Build
```bash
gcloud logging read 'resource.type="build"' \
  --limit=20 \
  --format="value(textPayload)"
```

### Cloud Run
```bash
gcloud logging read 'resource.type="cloud_run_revision"' \
  --limit=20 \
  --format="value(textPayload)"
```

### エージェント
```bash
gcloud logging read 'resource.type="cloud_function"' \
  --limit=20 \
  --format="value(textPayload)"
```

## 完全リセット手順

すべてを最初からやり直したい場合:

```bash
# 1. Cloud Runサービス削除
gcloud run services list
gcloud run services delete SERVICE_NAME --region=us-central1

# 2. Cloud Storage削除
gsutil rm -r gs://PROJECT_ID-images
gsutil rm -r gs://PROJECT_ID-restaurant-results

# 3. Firestore削除（注意：データは復元不可）
gcloud firestore databases delete --database="(default)"

# 4. 再デプロイ
./setup.sh
```

## サポート

### 問題が解決しない場合

1. **ログ収集**
   ```bash
   gcloud logging read --limit=50 > debug.log
   ```

2. **設定確認**
   ```bash
   gcloud config list
   cat .env
   ```

3. **環境情報**
   ```bash
   gcloud version
   node --version
   python --version
   ```

4. **Issue報告**
   - GitHub Issues: [リンク]
   - 上記の情報を添付して報告

### 緊急時の連絡先

- Email: [連絡先]
- Slack: [チャンネル]
- Discord: [サーバー]