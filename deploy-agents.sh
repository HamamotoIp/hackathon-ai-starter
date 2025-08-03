#!/bin/bash
# AI Chat Starter Kit - Agent Engine専用デプロイ
# 3つのAgent Engine (Analysis, UI Generation, Restaurant Search) を順次デプロイ

set -e

# 色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🤖 AI Chat Starter Kit - Agent Engineデプロイ${NC}"
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
echo -e "${BLUE}📋 必要なAPI有効化中...${NC}"
gcloud services enable aiplatform.googleapis.com --quiet

# stagingバケット作成
STAGING_BUCKET="$PROJECT_ID-agent-engine-staging"
echo -e "${BLUE}📋 Staging バケット設定中...${NC}"
if ! gsutil ls "gs://$STAGING_BUCKET" >/dev/null 2>&1; then
    gsutil mb -p "$PROJECT_ID" -c STANDARD -l "$REGION" "gs://$STAGING_BUCKET"
fi

# AI Agent Engine デプロイ
echo -e "${BLUE}🤖 3つのAgent Engineを順次デプロイ中...${NC}"
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

# デプロイ関数定義
deploy_analysis() {
    echo "  📊 Analysis Agent デプロイ開始..."
    python deploy/deploy_analysis.py
    if [ $? -eq 0 ]; then
        echo -e "  ${GREEN}✅ Analysis Agent デプロイ完了${NC}"
        return 0
    else
        echo -e "  ${RED}❌ Analysis Agent デプロイ失敗${NC}"
        return 1
    fi
}


deploy_ui_generation() {
    echo "  🎨 UI Generation Agent デプロイ開始..."
    python deploy/deploy_ui_generation.py
    if [ $? -eq 0 ]; then
        echo -e "  ${GREEN}✅ UI Generation Agent デプロイ完了${NC}"
        return 0
    else
        echo -e "  ${RED}❌ UI Generation Agent デプロイ失敗${NC}"
        return 1
    fi
}

deploy_restaurant_search() {
    echo "  🍽️ Restaurant Search Agent デプロイ開始..."
    python deploy/deploy_restaurant_search.py
    if [ $? -eq 0 ]; then
        echo -e "  ${GREEN}✅ Restaurant Search Agent デプロイ完了${NC}"
        return 0
    else
        echo -e "  ${RED}❌ Restaurant Search Agent デプロイ失敗${NC}"
        return 1
    fi
}

# 順次実行
echo "⏳ Analysis Agentデプロイ中..."
deploy_analysis
ANALYSIS_EXIT=$?

echo "⏳ UI Generation Agentデプロイ中..."
deploy_ui_generation
UI_GENERATION_EXIT=$?

echo "⏳ Restaurant Search Agentデプロイ中..."
deploy_restaurant_search
RESTAURANT_SEARCH_EXIT=$?

# 結果確認とURL取得
ANALYSIS_URL=""
UI_GENERATION_URL=""
RESTAURANT_SEARCH_URL=""

if [ $ANALYSIS_EXIT -eq 0 ] && [ -f "analysis_agent_url.txt" ]; then
    ANALYSIS_URL=$(cat analysis_agent_url.txt)
    echo -e "${GREEN}✅ Analysis Agent URL: ${ANALYSIS_URL}${NC}"
else
    echo -e "${RED}❌ Analysis Agent デプロイまたはURL取得失敗${NC}"
fi

if [ $UI_GENERATION_EXIT -eq 0 ] && [ -f "ui_generation_agent_url.txt" ]; then
    UI_GENERATION_URL=$(cat ui_generation_agent_url.txt)
    echo -e "${GREEN}✅ UI Generation Agent URL: ${UI_GENERATION_URL}${NC}"
else
    echo -e "${RED}❌ UI Generation Agent デプロイまたはURL取得失敗${NC}"
fi

if [ $RESTAURANT_SEARCH_EXIT -eq 0 ] && [ -f "restaurant_search_agent_url.txt" ]; then
    RESTAURANT_SEARCH_URL=$(cat restaurant_search_agent_url.txt)
    echo -e "${GREEN}✅ Restaurant Search Agent URL: ${RESTAURANT_SEARCH_URL}${NC}"
else
    echo -e "${RED}❌ Restaurant Search Agent デプロイまたはURL取得失敗${NC}"
fi

# 両方のAgent Engineが成功していることを確認
SUCCESS_COUNT=0
if [ -n "$ANALYSIS_URL" ]; then
    ((SUCCESS_COUNT++))
fi
if [ -n "$UI_GENERATION_URL" ]; then
    ((SUCCESS_COUNT++))
fi

cd ../..

# 完了メッセージ
echo ""
echo "================================================================="
if [ $SUCCESS_COUNT -eq 0 ]; then
    echo -e "${RED}❌ すべてのAgent Engineデプロイが失敗しました${NC}"
    exit 1
elif [ $SUCCESS_COUNT -eq 2 ]; then
    echo -e "${GREEN}🎉 全Agent Engineデプロイ完了！${NC}"
else
    echo -e "${GREEN}🎉 Agent Engineデプロイ完了 (成功: ${SUCCESS_COUNT}/2)${NC}"
fi

echo ""
echo -e "${BLUE}🤖 デプロイ済みAgent Engine:${NC}"
if [ -n "$ANALYSIS_URL" ]; then
    echo "  📊 分析レポート（詳細構造化）: $ANALYSIS_URL"
fi
if [ -n "$UI_GENERATION_URL" ]; then
    echo "  🎨 UI生成（HTML/Tailwind CSS）: $UI_GENERATION_URL"
fi
echo ""
echo -e "${BLUE}📋 次のステップ:${NC}"
echo "  1. フロントエンドデプロイ: ./deploy-frontend.sh"
echo "  2. 統合テスト: ./debug.sh"
echo "  3. 全機能確認: ブラウザでアクセステスト"
echo ""
echo -e "${BLUE}💡 ヒント:${NC}"
echo "  - Agent Engineの完全起動には数分かかる場合があります"
echo "  - エラーが発生した場合は個別デプロイを試してください:"
echo "    cd packages/ai-agents && python deploy/deploy_analysis.py"
echo "    cd packages/ai-agents && python deploy/deploy_ui_generation.py"
echo ""
echo -e "${BLUE}🚀 利用可能な機能:${NC}"
echo "  💬 シンプルチャット: Vertex AI Direct（高速3秒以内）"
echo "  📊 分析レポート: Analysis Agent（詳細構造化出力）"
echo "  🎨 UI生成: UI Generation Agent（HTML/Tailwind CSS）"
echo ""