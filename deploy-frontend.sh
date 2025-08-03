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
RESTAURANT_SEARCH_URL=""

# 既存のAgent Engine URLファイルから取得
if [ -f "packages/ai-agents/analysis_agent_url.txt" ]; then
    ANALYSIS_URL=$(cat packages/ai-agents/analysis_agent_url.txt)
    echo "  📊 Analysis Agent: ${ANALYSIS_URL}"
fi

if [ -f "packages/ai-agents/ui_generation_agent_url.txt" ]; then
    UI_GENERATION_URL=$(cat packages/ai-agents/ui_generation_agent_url.txt)
    echo "  🎨 UI Generation Agent: ${UI_GENERATION_URL}"
fi

if [ -f "packages/ai-agents/restaurant_search_agent_url.txt" ]; then
    RESTAURANT_SEARCH_URL=$(cat packages/ai-agents/restaurant_search_agent_url.txt)
    echo "  🍽️ Restaurant Search Agent: ${RESTAURANT_SEARCH_URL}"
fi

# 最低1つのAgent Engineの確認
if [ -z "$ANALYSIS_URL" ] && [ -z "$UI_GENERATION_URL" ] && [ -z "$RESTAURANT_SEARCH_URL" ]; then
    echo -e "${RED}❌ Agent Engine URLが見つかりません${NC}"
    echo "先にAgent Engineをデプロイしてください:"
    echo "  ./setup.sh  # 全体デプロイ"
    echo "  または packages/ai-agents/ で個別デプロイ"
    echo ""
    echo "利用可能なAgent Engine:"
    echo "  📊 Analysis Agent (分析レポート用)"
    echo "  🎨 UI Generation Agent (UI生成用)"
    echo "  🍽️ Restaurant Search Agent (飲食店検索用)"
    exit 1
fi

# バケット設定
BUCKET_NAME="$PROJECT_ID-images"
RESTAURANT_BUCKET_NAME="$PROJECT_ID-restaurant-results"
SERVICE_ACCOUNT="ai-chat-$ENVIRONMENT"
SERVICE_ACCOUNT_EMAIL="$SERVICE_ACCOUNT@$PROJECT_ID.iam.gserviceaccount.com"

echo -e "${GREEN}✅ Agent Engine確認完了${NC}"

# Frontend デプロイ
echo -e "${BLUE}📋 Frontend デプロイ開始...${NC}"
cd packages/frontend

# Cloud Build使用のため依存関係インストールをスキップ
echo "  📦 依存関係はCloud Buildで処理されます..."

# 環境変数はCloud Runデプロイ時に設定
echo "  ⚙️ 環境変数はCloud Runデプロイ時に設定されます..."

echo "     → プロジェクトID: $PROJECT_ID"
echo "     → Agent Engine統合設定完了"

# デプロイ用環境変数準備
DEPLOY_ENV_VARS="NODE_ENV=production,VERTEX_AI_PROJECT_ID=$PROJECT_ID,VERTEX_AI_LOCATION=$REGION,BUCKET_NAME=$BUCKET_NAME,RESTAURANT_BUCKET_NAME=$RESTAURANT_BUCKET_NAME,SERVICE_ACCOUNT_EMAIL=$SERVICE_ACCOUNT_EMAIL"

# 成功したAgent EngineのURLのみを環境変数に追加
if [ -n "$ANALYSIS_URL" ]; then
    DEPLOY_ENV_VARS="$DEPLOY_ENV_VARS,ANALYSIS_AGENT_URL=$ANALYSIS_URL"
    echo "     → Analysis Agent統合: 有効"
else
    echo "     → Analysis Agent統合: 無効"
fi
if [ -n "$UI_GENERATION_URL" ]; then
    DEPLOY_ENV_VARS="$DEPLOY_ENV_VARS,UI_GENERATION_AGENT_URL=$UI_GENERATION_URL"
    echo "     → UI Generation Agent統合: 有効"
else
    echo "     → UI Generation Agent統合: 無効"
fi
if [ -n "$RESTAURANT_SEARCH_URL" ]; then
    DEPLOY_ENV_VARS="$DEPLOY_ENV_VARS,RESTAURANT_SEARCH_AGENT_URL=$RESTAURANT_SEARCH_URL"
    echo "     → Restaurant Search Agent統合: 有効"
else
    echo "     → Restaurant Search Agent統合: 無効"
fi

# Cloud Build経由でデプロイ（最適化されたビルドプロセス）
FRONTEND_SERVICE="ai-chat-frontend-$ENVIRONMENT"
echo "  ☁️ Cloud Build経由でコンテナビルド・デプロイ中..."
echo "     → サービス名: $FRONTEND_SERVICE"
echo "     → リージョン: $REGION"
echo "     → メモリ: 512Mi, CPU: 1"
echo "     → 最適化: マルチステージビルド + 並列処理"

# Cloud Buildでビルド・デプロイを実行
echo "  🔨 Cloud Buildプロセス開始..."
BUILD_START_TIME=$(date +%s)

# Cloud Buildでビルド・デプロイを実行（環境変数は後で設定）
echo "  📋 substitutions: _SERVICE_NAME=$FRONTEND_SERVICE,_REGION=$REGION,_SERVICE_ACCOUNT=$SERVICE_ACCOUNT_EMAIL"

# 一時的に環境変数をクリア（Cloud Buildが解析しないように）
unset BUCKET_NAME RESTAURANT_BUCKET_NAME ANALYSIS_URL UI_GENERATION_URL RESTAURANT_SEARCH_URL

gcloud builds submit . \
    --config=cloudbuild.yaml \
    --substitutions="_SERVICE_NAME=$FRONTEND_SERVICE,_REGION=$REGION,_SERVICE_ACCOUNT=$SERVICE_ACCOUNT_EMAIL" \
    --timeout=1200s

BUILD_EXIT_CODE=$?
BUILD_END_TIME=$(date +%s)
BUILD_DURATION=$((BUILD_END_TIME - BUILD_START_TIME))

# ビルド成功後、Agent Engine URLを環境変数として設定（分割して実行）
if [ $BUILD_EXIT_CODE -eq 0 ]; then
    echo "  ⚙️ Agent Engine URL環境変数を設定中..."
    
    # 基本環境変数を設定
    BASE_ENV_VARS="NODE_ENV=production,VERTEX_AI_PROJECT_ID=$PROJECT_ID,VERTEX_AI_LOCATION=$REGION"
    if [ -n "$BUCKET_NAME" ]; then
        BASE_ENV_VARS="$BASE_ENV_VARS,BUCKET_NAME=$BUCKET_NAME"
    fi
    if [ -n "$RESTAURANT_BUCKET_NAME" ]; then
        BASE_ENV_VARS="$BASE_ENV_VARS,RESTAURANT_BUCKET_NAME=$RESTAURANT_BUCKET_NAME"
    fi
    if [ -n "$SERVICE_ACCOUNT_EMAIL" ]; then
        BASE_ENV_VARS="$BASE_ENV_VARS,SERVICE_ACCOUNT_EMAIL=$SERVICE_ACCOUNT_EMAIL"
    fi
    
    echo "     → 基本環境変数設定中..."
    if gcloud run services update "$FRONTEND_SERVICE" \
        --region "$REGION" \
        --update-env-vars "$BASE_ENV_VARS" \
        --quiet; then
        echo "     → 基本環境変数設定完了"
        
        # Agent Engine URLを個別に設定（タイムアウト回避）
        if [ -n "$ANALYSIS_URL" ]; then
            echo "     → Analysis Agent URL設定中..."
            gcloud run services update "$FRONTEND_SERVICE" \
                --region "$REGION" \
                --update-env-vars "ANALYSIS_AGENT_URL=$ANALYSIS_URL" \
                --quiet
        fi
        
        if [ -n "$UI_GENERATION_URL" ]; then
            echo "     → UI Generation Agent URL設定中..."
            gcloud run services update "$FRONTEND_SERVICE" \
                --region "$REGION" \
                --update-env-vars "UI_GENERATION_AGENT_URL=$UI_GENERATION_URL" \
                --quiet
        fi
        
        if [ -n "$RESTAURANT_SEARCH_URL" ]; then
            echo "     → Restaurant Search Agent URL設定中..."
            gcloud run services update "$FRONTEND_SERVICE" \
                --region "$REGION" \
                --update-env-vars "RESTAURANT_SEARCH_AGENT_URL=$RESTAURANT_SEARCH_URL" \
                --quiet
        fi
        
        echo "     → 全環境変数設定完了"
    else
        echo "     → 環境変数設定に失敗（サービスは起動済み）"
    fi
fi

if [ $BUILD_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ Cloud Buildデプロイ完了${NC} (所要時間: ${BUILD_DURATION}秒)"
else
    echo -e "${RED}❌ Cloud Buildデプロイ失敗${NC}"
    echo "詳細ログを確認してください:"
    echo "  gcloud logging read 'resource.type=\"build\"' --limit=20 --format=\"value(textPayload)\""
    exit 1
fi

# 重複した条件チェックを削除（上記で既にチェック済み）

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
echo "  🍽️ 飲食店検索: ${RESTAURANT_SEARCH_URL}"
echo ""
echo -e "${BLUE}📋 利用可能機能:${NC}"
echo "  1. ブラウザでアクセス: $FRONTEND_URL"
echo "  2. AI機能が利用可能:"
echo "     - 💬 シンプルチャット（Vertex AI Direct - 高速3秒以内）"
echo "     - 📊 分析レポート（Analysis Agent - 詳細構造化）"
echo "     - 🎨 UI生成（UI Generation Agent - HTML/Tailwind CSS）"
echo "     - 🍽️ 飲食店検索（Restaurant Search Agent - 6段階処理）"
echo "  3. 問題があれば ./debug.sh を実行"
echo ""