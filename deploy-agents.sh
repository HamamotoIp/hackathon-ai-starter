#!/bin/bash
# AI Chat Starter Kit - Agent Engine専用並列デプロイ
# 3つのAgent Engine (Analysis, Comparison, UI Generation) を並列でデプロイ

set -e

# 色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🤖 AI Chat Starter Kit - Agent Engine並列デプロイ${NC}"
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
echo -e "${BLUE}🤖 3つのAgent Engineを並列デプロイ中...${NC}"
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

# 並列デプロイ関数定義
deploy_analysis() {
    echo "  📊 Analysis Agent デプロイ開始..."
    python deploy_analysis.py
    if [ $? -eq 0 ]; then
        echo -e "  ${GREEN}✅ Analysis Agent デプロイ完了${NC}"
        return 0
    else
        echo -e "  ${RED}❌ Analysis Agent デプロイ失敗${NC}"
        return 1
    fi
}

deploy_comparison() {
    echo "  ⚖️ Comparison Agent デプロイ開始..."
    python deploy_comparison.py
    if [ $? -eq 0 ]; then
        echo -e "  ${GREEN}✅ Comparison Agent デプロイ完了${NC}"
        return 0
    else
        echo -e "  ${RED}❌ Comparison Agent デプロイ失敗${NC}"
        return 1
    fi
}

deploy_ui_generation() {
    echo "  🎨 UI Generation Agent デプロイ開始..."
    python deploy_ui_generation.py
    if [ $? -eq 0 ]; then
        echo -e "  ${GREEN}✅ UI Generation Agent デプロイ完了${NC}"
        return 0
    else
        echo -e "  ${RED}❌ UI Generation Agent デプロイ失敗${NC}"
        return 1
    fi
}

# 並列実行
echo "⏳ 3つのAgent Engineを並列デプロイ中..."
deploy_analysis &
ANALYSIS_PID=$!

deploy_comparison &
COMPARISON_PID=$!

deploy_ui_generation &
UI_GENERATION_PID=$!

# プログレス表示
TOTAL_AGENTS=3
COMPLETED=0

# 定期的に状態チェック
while [ $COMPLETED -lt $TOTAL_AGENTS ]; do
    COMPLETED=0
    
    if ! kill -0 $ANALYSIS_PID 2>/dev/null; then
        ((COMPLETED++))
    fi
    if ! kill -0 $COMPARISON_PID 2>/dev/null; then
        ((COMPLETED++))
    fi
    if ! kill -0 $UI_GENERATION_PID 2>/dev/null; then
        ((COMPLETED++))
    fi
    
    echo "   進捗: $COMPLETED/$TOTAL_AGENTS エージェント完了"
    
    if [ $COMPLETED -lt $TOTAL_AGENTS ]; then
        sleep 10
    fi
done

# 結果確認
wait $ANALYSIS_PID
ANALYSIS_EXIT=$?

wait $COMPARISON_PID
COMPARISON_EXIT=$?

wait $UI_GENERATION_PID
UI_GENERATION_EXIT=$?

# 結果確認とURL取得
ANALYSIS_URL=""
COMPARISON_URL=""
UI_GENERATION_URL=""

if [ $ANALYSIS_EXIT -eq 0 ] && [ -f "analysis_agent_url.txt" ]; then
    ANALYSIS_URL=$(cat analysis_agent_url.txt)
    echo -e "${GREEN}✅ Analysis Agent URL: ${ANALYSIS_URL}${NC}"
else
    echo -e "${RED}❌ Analysis Agent デプロイまたはURL取得失敗${NC}"
fi

if [ $COMPARISON_EXIT -eq 0 ] && [ -f "comparison_agent_url.txt" ]; then
    COMPARISON_URL=$(cat comparison_agent_url.txt)
    echo -e "${GREEN}✅ Comparison Agent URL: ${COMPARISON_URL}${NC}"
else
    echo -e "${RED}❌ Comparison Agent デプロイまたはURL取得失敗${NC}"
fi

if [ $UI_GENERATION_EXIT -eq 0 ] && [ -f "ui_generation_agent_url.txt" ]; then
    UI_GENERATION_URL=$(cat ui_generation_agent_url.txt)
    echo -e "${GREEN}✅ UI Generation Agent URL: ${UI_GENERATION_URL}${NC}"
else
    echo -e "${RED}❌ UI Generation Agent デプロイまたはURL取得失敗${NC}"
fi

# 最低1つのAgent Engineが成功していることを確認
SUCCESS_COUNT=0
if [ -n "$ANALYSIS_URL" ]; then
    ((SUCCESS_COUNT++))
fi
if [ -n "$COMPARISON_URL" ]; then
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
elif [ $SUCCESS_COUNT -eq 3 ]; then
    echo -e "${GREEN}🎉 全Agent Engine並列デプロイ完了！${NC}"
else
    echo -e "${GREEN}🎉 Agent Engine並列デプロイ完了 (成功: ${SUCCESS_COUNT}/3)${NC}"
fi

echo ""
echo -e "${BLUE}🤖 デプロイ済みAgent Engine:${NC}"
if [ -n "$ANALYSIS_URL" ]; then
    echo "  📊 分析レポート: $ANALYSIS_URL"
fi
if [ -n "$COMPARISON_URL" ]; then
    echo "  ⚖️ 比較研究: $COMPARISON_URL"
fi
if [ -n "$UI_GENERATION_URL" ]; then
    echo "  🎨 UI生成: $UI_GENERATION_URL"
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
echo "    cd packages/ai-agents && python deploy_analysis.py"
echo ""