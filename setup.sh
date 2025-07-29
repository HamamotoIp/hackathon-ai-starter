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
gcloud services enable run.googleapis.com cloudbuild.googleapis.com aiplatform.googleapis.com storage.googleapis.com --quiet

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

# 現在ユーザーにも権限付与
CURRENT_USER=$(gcloud config get-value account)
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="user:$CURRENT_USER" \
    --role="roles/aiplatform.user" --quiet

# ストレージバケット作成
BUCKET_NAME="$PROJECT_ID-images"
echo -e "${BLUE}📋 ストレージバケット設定中...${NC}"
if ! gsutil ls "gs://$BUCKET_NAME" >/dev/null 2>&1; then
    gsutil mb -p "$PROJECT_ID" -c STANDARD -l "$REGION" "gs://$BUCKET_NAME"
fi

# 複数Vertex AI Agent Engine 並列デプロイ
echo -e "${BLUE}📋 複数Vertex AI Agent Engine 並列デプロイ中...${NC}"
cd packages/ai-agents

# Python環境準備
if [ ! -d "venv" ]; then
    python -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt --quiet

# 環境変数設定
export VERTEX_AI_PROJECT_ID="$PROJECT_ID"
export VERTEX_AI_LOCATION="$REGION"

# stagingバケット作成
STAGING_BUCKET="$PROJECT_ID-agent-engine-staging"
echo -e "${BLUE}📋 Staging バケット設定中...${NC}"
if ! gsutil ls "gs://$STAGING_BUCKET" >/dev/null 2>&1; then
    gsutil mb -p "$PROJECT_ID" -c STANDARD -l "$REGION" "gs://$STAGING_BUCKET"
fi

# 複数Agent Engine並列デプロイ
echo -e "${BLUE}📊 分析・UI生成・飲食店検索エージェントを並列デプロイ中...${NC}"
echo "  ⚡ 3つのエージェントを同時実行（処理時間を約1/3に短縮）"
echo ""

# 並列デプロイ開始
echo "  📊 Analysis Agent デプロイ開始..."
python deploy/deploy_analysis.py &
ANALYSIS_PID=$!

echo "  🎨 UI Generation Agent デプロイ開始..."
python deploy/deploy_ui_generation.py &
UI_GENERATION_PID=$!

echo "  🍽️ Restaurant Search Agent デプロイ開始..."
python deploy/deploy_restaurant_search.py &
RESTAURANT_SEARCH_PID=$!

echo ""
echo "  ⏳ 並列デプロイ実行中... (数分かかる場合があります)"

# 各プロセスの完了を待機して結果を取得
echo "  📊 Analysis Agent の完了を待機中..."
wait $ANALYSIS_PID
ANALYSIS_EXIT=$?

echo "  🎨 UI Generation Agent の完了を待機中..."
wait $UI_GENERATION_PID
UI_GENERATION_EXIT=$?

echo "  🍽️ Restaurant Search Agent の完了を待機中..."
wait $RESTAURANT_SEARCH_PID
RESTAURANT_SEARCH_EXIT=$?

echo ""
echo -e "${BLUE}📋 並列デプロイ結果:${NC}"

if [ $ANALYSIS_EXIT -eq 0 ]; then
    echo -e "  ${GREEN}✅ Analysis Agent デプロイ完了${NC}"
else
    echo -e "  ${RED}❌ Analysis Agent デプロイ失敗${NC}"
fi

if [ $UI_GENERATION_EXIT -eq 0 ]; then
    echo -e "  ${GREEN}✅ UI Generation Agent デプロイ完了${NC}"
else
    echo -e "  ${RED}❌ UI Generation Agent デプロイ失敗${NC}"
fi

if [ $RESTAURANT_SEARCH_EXIT -eq 0 ]; then
    echo -e "  ${GREEN}✅ Restaurant Search Agent デプロイ完了${NC}"
else
    echo -e "  ${RED}❌ Restaurant Search Agent デプロイ失敗${NC}"
fi

# 結果確認とURL取得
ANALYSIS_URL=""
UI_GENERATION_URL=""
RESTAURANT_SEARCH_URL=""

if [ $ANALYSIS_EXIT -eq 0 ] && [ -f "analysis_agent_url.txt" ]; then
    ANALYSIS_URL=$(cat analysis_agent_url.txt)
    echo -e "${GREEN}✅ Analysis Agent URL: ${ANALYSIS_URL}${NC}"
else
    echo -e "${RED}❌ Analysis Agent URL取得失敗${NC}"
    cat analysis_deploy.log
fi


if [ $UI_GENERATION_EXIT -eq 0 ] && [ -f "ui_generation_agent_url.txt" ]; then
    UI_GENERATION_URL=$(cat ui_generation_agent_url.txt)
    echo -e "${GREEN}✅ UI Generation Agent URL: ${UI_GENERATION_URL}${NC}"
else
    echo -e "${RED}❌ UI Generation Agent URL取得失敗${NC}"
    cat ui_generation_deploy.log
fi


if [ $RESTAURANT_SEARCH_EXIT -eq 0 ] && [ -f "restaurant_search_agent_url.txt" ]; then
    RESTAURANT_SEARCH_URL=$(cat restaurant_search_agent_url.txt)
    echo -e "${GREEN}✅ Restaurant Search Agent URL: ${RESTAURANT_SEARCH_URL}${NC}"
else
    echo -e "${RED}❌ Restaurant Search Agent URL取得失敗${NC}"
    cat restaurant_search_deploy.log
fi

# 最低1つのAgent Engineが成功していることを確認
if [ -z "$ANALYSIS_URL" ] && [ -z "$UI_GENERATION_URL" ] && [ -z "$RESTAURANT_SEARCH_URL" ]; then
    echo -e "${RED}❌ すべてのAgent Engineデプロイが失敗しました${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Agent Engine デプロイ完了 (成功: $((3-$([ -z "$ANALYSIS_URL" ] && echo 1 || echo 0)-$([ -z "$UI_GENERATION_URL" ] && echo 1 || echo 0)-$([ -z "$RESTAURANT_SEARCH_URL" ] && echo 1 || echo 0)))/3)${NC}"

cd ../..

# Frontend デプロイ
echo -e "${BLUE}📋 Frontend デプロイ開始...${NC}"
cd packages/frontend

# 依存関係インストール
echo "  📦 npm依存関係インストール中..."
npm install --silent

# 環境ファイル作成（複数Agent Engine対応）
echo "  ⚙️ 本番環境設定ファイル作成中..."
cat > .env.production << EOF
NODE_ENV=production
VERTEX_AI_PROJECT_ID=$PROJECT_ID
VERTEX_AI_LOCATION=$REGION
ANALYSIS_AGENT_URL=$ANALYSIS_URL
UI_GENERATION_AGENT_URL=$UI_GENERATION_URL
RESTAURANT_SEARCH_AGENT_URL=$RESTAURANT_SEARCH_URL
BUCKET_NAME=$BUCKET_NAME
SERVICE_ACCOUNT_EMAIL=$SERVICE_ACCOUNT_EMAIL
EOF

echo "     → プロジェクトID: $PROJECT_ID"
echo "     → Agent Engine統合設定完了"

# デプロイ用環境変数準備
DEPLOY_ENV_VARS="NODE_ENV=production,VERTEX_AI_PROJECT_ID=$PROJECT_ID,VERTEX_AI_LOCATION=$REGION,BUCKET_NAME=$BUCKET_NAME,SERVICE_ACCOUNT_EMAIL=$SERVICE_ACCOUNT_EMAIL"

# 成功したAgent EngineのURLのみを環境変数に追加
if [ -n "$ANALYSIS_URL" ]; then
    DEPLOY_ENV_VARS="$DEPLOY_ENV_VARS,ANALYSIS_AGENT_URL=$ANALYSIS_URL"
    echo "     → Analysis Agent統合: 有効"
fi
if [ -n "$UI_GENERATION_URL" ]; then
    DEPLOY_ENV_VARS="$DEPLOY_ENV_VARS,UI_GENERATION_AGENT_URL=$UI_GENERATION_URL"
    echo "     → UI Generation Agent統合: 有効"
fi
if [ -n "$RESTAURANT_SEARCH_URL" ]; then
    DEPLOY_ENV_VARS="$DEPLOY_ENV_VARS,RESTAURANT_SEARCH_AGENT_URL=$RESTAURANT_SEARCH_URL"
    echo "     → Restaurant Search Agent統合: 有効"
fi


# Cloud Run デプロイ（複数Agent Engine対応）
FRONTEND_SERVICE="ai-chat-frontend-$ENVIRONMENT"
echo "  ☁️ Cloud Runコンテナデプロイ中..."
echo "     → サービス名: $FRONTEND_SERVICE"
echo "     → リージョン: $REGION"
echo "     → メモリ: 512Mi, CPU: 1"

gcloud run deploy "$FRONTEND_SERVICE" \
    --source . \
    --region "$REGION" \
    --allow-unauthenticated \
    --service-account "$SERVICE_ACCOUNT_EMAIL" \
    --memory 512Mi \
    --cpu 1 \
    --max-instances 1 \
    --port 3000 \
    --set-env-vars "$DEPLOY_ENV_VARS" \
    --quiet

if [ $? -eq 0 ]; then
    echo -e "  ${GREEN}✅ Frontend デプロイ完了${NC}"
else
    echo -e "  ${RED}❌ Frontend デプロイ失敗${NC}"
    exit 1
fi

# Frontend URL取得
FRONTEND_URL=$(gcloud run services describe "$FRONTEND_SERVICE" --region "$REGION" --format 'value(status.url)')

cd ../..

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