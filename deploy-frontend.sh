#!/bin/bash
# AI Chat Starter Kit - Frontend専用デプロイ
# Agent Engineは既にデプロイ済みの前提でフロントエンドのみをデプロイ

set -e

# 色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 AI Chat Starter Kit - Frontend専用デプロイ${NC}"
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

# Agent Engine URLを取得
echo -e "${BLUE}📋 Agent Engine URL確認中...${NC}"

ANALYSIS_URL=""
UI_GENERATION_URL=""

# 既存のAgent Engine URLファイルから取得
if [ -f "packages/ai-agents/analysis_agent_url.txt" ]; then
    ANALYSIS_URL=$(cat packages/ai-agents/analysis_agent_url.txt)
    echo "  📊 Analysis Agent: ${ANALYSIS_URL}"
fi

if [ -f "packages/ai-agents/ui_generation_agent_url.txt" ]; then
    UI_GENERATION_URL=$(cat packages/ai-agents/ui_generation_agent_url.txt)
    echo "  🎨 UI Generation Agent: ${UI_GENERATION_URL}"
fi

# Analysis AgentとUI Generation Agentが必要
if [ -z "$ANALYSIS_URL" ] || [ -z "$UI_GENERATION_URL" ]; then
    echo -e "${RED}❌ 必要なAgent Engine URLが見つかりません${NC}"
    echo "先にAgent Engineをデプロイしてください:"
    echo "  ./setup.sh  # 全体デプロイ"
    echo "  または packages/ai-agents/ で個別デプロイ"
    echo ""
    echo "必要なAgent Engine:"
    echo "  📊 Analysis Agent (分析レポート用)"
    echo "  🎨 UI Generation Agent (UI生成用)"
    exit 1
fi

# バケット設定
BUCKET_NAME="$PROJECT_ID-images"
SERVICE_ACCOUNT="ai-chat-$ENVIRONMENT"
SERVICE_ACCOUNT_EMAIL="$SERVICE_ACCOUNT@$PROJECT_ID.iam.gserviceaccount.com"

echo -e "${GREEN}✅ Agent Engine確認完了${NC}"

# Frontend デプロイ
echo -e "${BLUE}📋 Frontend デプロイ開始...${NC}"
cd packages/frontend

# 依存関係インストール
echo "  📦 npm依存関係インストール中..."
npm install --silent

# 環境ファイル作成（必要なAgent Engine対応）
echo "  ⚙️ 本番環境設定ファイル作成中..."
cat > .env.production << EOF
NODE_ENV=production
VERTEX_AI_PROJECT_ID=$PROJECT_ID
VERTEX_AI_LOCATION=$REGION
ANALYSIS_AGENT_URL=$ANALYSIS_URL
UI_GENERATION_AGENT_URL=$UI_GENERATION_URL
BUCKET_NAME=$BUCKET_NAME
SERVICE_ACCOUNT_EMAIL=$SERVICE_ACCOUNT_EMAIL
EOF

echo "     → プロジェクトID: $PROJECT_ID"
echo "     → Agent Engine統合設定完了"

# デプロイ用環境変数準備
DEPLOY_ENV_VARS="NODE_ENV=production,VERTEX_AI_PROJECT_ID=$PROJECT_ID,VERTEX_AI_LOCATION=$REGION,BUCKET_NAME=$BUCKET_NAME,SERVICE_ACCOUNT_EMAIL=$SERVICE_ACCOUNT_EMAIL,ANALYSIS_AGENT_URL=$ANALYSIS_URL,UI_GENERATION_AGENT_URL=$UI_GENERATION_URL"

echo "     → Analysis Agent統合: 有効"
echo "     → UI Generation Agent統合: 有効"

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
echo -e "${GREEN}🎉 Frontend デプロイ完了！${NC}"
echo ""
echo -e "${BLUE}🌐 フロントエンド:${NC} $FRONTEND_URL"
echo ""
echo -e "${BLUE}🤖 統合済みAgent Engine:${NC}"
echo "  📊 分析レポート: ${ANALYSIS_URL}"
echo "  🎨 UI生成: ${UI_GENERATION_URL}"
echo ""
echo -e "${BLUE}📋 利用可能機能:${NC}"
echo "  1. ブラウザでアクセス: $FRONTEND_URL"
echo "  2. AI機能が利用可能:"
echo "     - 💬 シンプルチャット（Vertex AI Direct - 高速3秒以内）"
echo "     - 📊 分析レポート（Analysis Agent - 詳細構造化）"
echo "     - 🎨 UI生成（UI Generation Agent - HTML/Tailwind CSS）"
echo "  3. 問題があれば ./debug.sh を実行"
echo ""