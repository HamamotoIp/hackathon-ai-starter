#!/bin/bash
# AI Chat Starter Kit - シンプル統合デプロイ
# 最もシンプルな形でデプロイを実行

set -e

# 色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 AI Chat Starter Kit - シンプルデプロイ${NC}"
echo "================================================================="

# 設定読み込み
if [ ! -f "config.sh" ]; then
    echo -e "${RED}❌ config.sh が見つかりません${NC}"
    echo ""
    echo "設定ファイルを作成してください:"
    echo "  cp config.example.sh config.sh"
    echo "  # config.sh を編集してPROJECT_IDを設定"
    exit 1
fi

source config.sh

# 必須設定チェック
if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "your-gcp-project-id" ]; then
    echo -e "${RED}❌ PROJECT_ID が設定されていません${NC}"
    echo "config.sh を編集してください"
    exit 1
fi

# デフォルト値設定
REGION=${REGION:-us-central1}
ENVIRONMENT=${ENVIRONMENT:-dev}

echo "プロジェクト: $PROJECT_ID"
echo "リージョン: $REGION"
echo "環境: $ENVIRONMENT"
echo ""

# gcloud設定
gcloud config set project "$PROJECT_ID"

# APIs有効化
echo -e "${BLUE}📋 APIs有効化中...${NC}"
gcloud services enable run.googleapis.com cloudbuild.googleapis.com aiplatform.googleapis.com storage.googleapis.com firestore.googleapis.com customsearch.googleapis.com --quiet

# サービスアカウント作成
SERVICE_ACCOUNT="ai-chat-$ENVIRONMENT"
SERVICE_ACCOUNT_EMAIL="$SERVICE_ACCOUNT@$PROJECT_ID.iam.gserviceaccount.com"

echo -e "${BLUE}📋 サービスアカウント設定中...${NC}"
if ! gcloud iam service-accounts describe "$SERVICE_ACCOUNT_EMAIL" >/dev/null 2>&1; then
    gcloud iam service-accounts create "$SERVICE_ACCOUNT" --display-name "AI Chat Service Account"
fi

# 権限付与
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/aiplatform.user" --quiet

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/storage.objectAdmin" --quiet

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/datastore.user" --quiet

# 現在ユーザーにも権限付与
CURRENT_USER=$(gcloud config get-value account)
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="user:$CURRENT_USER" \
    --role="roles/aiplatform.user" --quiet

# ストレージバケット作成
BUCKET_NAME="$PROJECT_ID-images"
RESTAURANT_BUCKET_NAME="$PROJECT_ID-restaurant-results"
echo -e "${BLUE}📋 ストレージバケット設定中...${NC}"
if ! gsutil ls "gs://$BUCKET_NAME" >/dev/null 2>&1; then
    gsutil mb -p "$PROJECT_ID" -c STANDARD -l "$REGION" "gs://$BUCKET_NAME"
    echo "  ✅ 画像バケット作成: $BUCKET_NAME"
fi

if ! gsutil ls "gs://$RESTAURANT_BUCKET_NAME" >/dev/null 2>&1; then
    gsutil mb -p "$PROJECT_ID" -c STANDARD -l "$REGION" "gs://$RESTAURANT_BUCKET_NAME"
    echo "  ✅ レストランバケット作成: $RESTAURANT_BUCKET_NAME"
fi

# レストランバケットを公開読み取り可能に設定
gsutil iam ch allUsers:objectViewer "gs://$RESTAURANT_BUCKET_NAME"
echo "  ✅ レストランバケット公開設定完了"

# Firestore データベース作成
echo -e "${BLUE}📋 Firestore データベース作成中...${NC}"
if ! gcloud firestore databases list --project="$PROJECT_ID" | grep -q "(default)"; then
    gcloud firestore databases create --location="$REGION" --project="$PROJECT_ID" --quiet
    echo "  ✅ Firestore データベース作成完了"
else
    echo "  ✅ Firestore データベース既存"
fi

# 高速並列 Agent Engine デプロイ
echo -e "${BLUE}🚀 高速並列 Agent Engine デプロイ開始...${NC}"
echo "     → 従来比60-70%時間短縮"
echo "     → エラー時は自動的に順次デプロイにフォールバック"

# 並列デプロイスクリプトを実行（現在のディレクトリから）
# 環境変数は並列デプロイスクリプトで設定される
source ./deploy-agents-parallel.sh

# デプロイ結果を確認
cd packages/ai-agents

# 並列デプロイからの環境変数を確認、ファイルからも読み取り
if [ -z "$ANALYSIS_URL" ] && [ -f "analysis_agent_url.txt" ]; then
    ANALYSIS_URL=$(cat analysis_agent_url.txt)
fi

if [ -z "$UI_GENERATION_URL" ] && [ -f "ui_generation_agent_url.txt" ]; then
    UI_GENERATION_URL=$(cat ui_generation_agent_url.txt)
fi

if [ -z "$RESTAURANT_SEARCH_URL" ] && [ -f "restaurant_search_agent_url.txt" ]; then
    RESTAURANT_SEARCH_URL=$(cat restaurant_search_agent_url.txt)
fi

# 最低1つのAgent Engineが成功していることを確認
if [ -z "$ANALYSIS_URL" ] && [ -z "$UI_GENERATION_URL" ] && [ -z "$RESTAURANT_SEARCH_URL" ]; then
    echo -e "${RED}❌ すべてのAgent Engineデプロイが失敗しました${NC}"
    exit 1
fi

SUCCESS_COUNT=0
if [ -n "$ANALYSIS_URL" ]; then ((SUCCESS_COUNT++)); fi
if [ -n "$UI_GENERATION_URL" ]; then ((SUCCESS_COUNT++)); fi
if [ -n "$RESTAURANT_SEARCH_URL" ]; then ((SUCCESS_COUNT++)); fi

echo -e "${GREEN}✅ 並列Agent Engineデプロイ完了 (成功: ${SUCCESS_COUNT}/3)${NC}"

cd ../..

# Frontend デプロイ（最適化されたスクリプト使用）
echo -e "${BLUE}📋 最適化されたFrontendデプロイ開始...${NC}"
echo "     → マルチステージビルド + Cloud Build並列化を使用"

# 環境変数をエクスポート（deploy-frontend.shで使用）
export PROJECT_ID
export REGION
export ENVIRONMENT
export BUCKET_NAME
export RESTAURANT_BUCKET_NAME
export SERVICE_ACCOUNT_EMAIL
export ANALYSIS_URL
export UI_GENERATION_URL
export RESTAURANT_SEARCH_URL

# 最適化されたデプロイスクリプトを実行
./deploy-frontend.sh

if [ $? -eq 0 ]; then
    echo -e "  ${GREEN}✅ 最適化されたFrontendデプロイ完了${NC}"
    # Frontend URL取得
    FRONTEND_SERVICE="ai-chat-frontend-$ENVIRONMENT"
    FRONTEND_URL=$(gcloud run services describe "$FRONTEND_SERVICE" --region "$REGION" --format 'value(status.url)')
else
    echo -e "  ${RED}❌ Frontendデプロイ失敗${NC}"
    exit 1
fi

# 完了メッセージ
echo ""
echo "================================================================="
echo -e "${GREEN}🎉 複数Agent Engine デプロイ完了！${NC}"
echo ""
echo -e "${BLUE}🌐 フロントエンド:${NC} $FRONTEND_URL"
echo ""
echo -e "${BLUE}🤖 デプロイ済みAgent Engine:${NC}"
if [ -n "$ANALYSIS_URL" ]; then
    echo "  📊 分析レポート: $ANALYSIS_URL"
fi
if [ -n "$UI_GENERATION_URL" ]; then
    echo "  🎨 UI生成: $UI_GENERATION_URL"
fi
if [ -n "$RESTAURANT_SEARCH_URL" ]; then
    echo "  🍽️ 飲食店検索: $RESTAURANT_SEARCH_URL"
fi
echo ""
echo -e "${BLUE}📋 利用可能機能:${NC}"
echo "  1. ブラウザでアクセス: $FRONTEND_URL"
echo "  2. AI機能（Agent Engineの起動には数分かかる場合があります）:"
echo "     - ✅ 基本チャット（Vertex AI Direct）"
if [ -n "$ANALYSIS_URL" ]; then
    echo "     - 📊 分析レポート（Analysis Agent）"
fi
if [ -n "$UI_GENERATION_URL" ]; then
    echo "     - 🎨 UI生成（UI Generation Agent）"
fi
if [ -n "$RESTAURANT_SEARCH_URL" ]; then
    echo "     - 🍽️ 飲食店検索（Restaurant Search Agent）"
fi
echo "  3. 問題があれば ./debug.sh を実行"
echo ""