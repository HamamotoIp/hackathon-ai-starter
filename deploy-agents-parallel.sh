#!/bin/bash
# AI Chat Starter Kit - 並列エージェントデプロイ
# 3つのAgent Engine (Analysis, UI Generation, Restaurant Search) を並列デプロイ
# 安全性重視: エラー時は順次デプロイにフォールバック

set -e

# 色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 AI Chat Starter Kit - 並列エージェントデプロイ${NC}"
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
PARALLEL_TIMEOUT=${PARALLEL_TIMEOUT:-900}  # 15分

echo "プロジェクト: $PROJECT_ID"
echo "リージョン: $REGION"
echo "環境: $ENVIRONMENT"
echo "並列タイムアウト: ${PARALLEL_TIMEOUT}秒"
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

# ログディレクトリ作成（DEBUGモード時のみ保持）
LOG_DIR="$(pwd)/deploy_logs_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$LOG_DIR"

if [ "${DEBUG:-0}" = "1" ]; then
    echo -e "${BLUE}📁 デバッグモード: ログ保持 $LOG_DIR${NC}"
else
    echo -e "${BLUE}📁 デプロイログ: 一時的に使用（完了後削除）${NC}"
fi

# Agent Engine ディレクトリに移動
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
deploy_agent_parallel() {
    local agent_name="$1"
    local agent_script="$2"
    local log_file="$LOG_DIR/${agent_name}_deploy.log"
    local status_file="$LOG_DIR/${agent_name}_status.txt"
    local start_time=$(date +%s)
    
    # ログファイルとステータスファイルを初期化
    touch "$log_file"
    echo "STARTED" > "$status_file"
    echo "ステータスファイル作成: $status_file" >> "$log_file"
    
    # デプロイスクリプトを実行
    {
        echo "🚀 ${agent_name} Agent 並列デプロイ開始: $(date)"
        echo "ログファイル: $log_file"
        echo "ステータスファイル: $status_file"
        echo "作業ディレクトリ: $(pwd)"
        echo "----------------------------------------"
        
        # Pythonスクリプト実行
        echo "Python スクリプト実行: deploy/$agent_script"
        if timeout $PARALLEL_TIMEOUT python "deploy/$agent_script" 2>&1; then
            echo "SUCCESS" > "$status_file"
            echo "✅ ${agent_name} Agent デプロイ完了: $(date)"
        else
            local deploy_exit_code=$?
            echo "FAILED" > "$status_file"
            echo "❌ ${agent_name} Agent デプロイ失敗: $(date)"
            echo "終了コード: $deploy_exit_code"
        fi
        
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        echo "実行時間: ${duration}秒"
        echo "最終ステータス: $(cat "$status_file" 2>/dev/null || echo "ファイル読み取り失敗")"
        
    } >> "$log_file" 2>&1
}

# 並列デプロイ実行
echo -e "${BLUE}🚀 3つのAgent Engineを並列デプロイ中...${NC}"
echo "  ⏱️  タイムアウト: ${PARALLEL_TIMEOUT}秒"
echo "  📁 ログ: $LOG_DIR"
echo ""

DEPLOY_START_TIME=$(date +%s)

# バックグラウンドで並列実行
echo "  📊 Analysis Agent 開始..."
deploy_agent_parallel "analysis" "deploy_analysis.py" &
ANALYSIS_PID=$!
echo "    PID: $ANALYSIS_PID"

echo "  🎨 UI Generation Agent 開始..."
deploy_agent_parallel "ui_generation" "deploy_ui_generation.py" &
UI_GENERATION_PID=$!
echo "    PID: $UI_GENERATION_PID"

echo "  🍽️ Restaurant Search Agent 開始..."
deploy_agent_parallel "restaurant_search" "deploy_restaurant_search.py" &
RESTAURANT_SEARCH_PID=$!
echo "    PID: $RESTAURANT_SEARCH_PID"

# 少し待機してから状況確認
sleep 2
echo ""
echo "  📁 ログディレクトリ: $LOG_DIR"
echo "  📄 作成された初期ステータスファイル:"
ls -la "$LOG_DIR"/*_status.txt 2>/dev/null || echo "    ステータスファイルがまだ作成されていません"

echo ""
echo -e "${YELLOW}⏳ 並列デプロイ実行中... (最大${PARALLEL_TIMEOUT}秒)${NC}"

# プロセス監視関数
monitor_deployment() {
    local check_interval=10
    local elapsed=0
    
    while [ $elapsed -lt $PARALLEL_TIMEOUT ]; do
        sleep $check_interval
        elapsed=$((elapsed + check_interval))
        
        # 生存チェック
        local running_count=0
        
        if kill -0 $ANALYSIS_PID 2>/dev/null; then
            ((running_count++))
        fi
        
        if kill -0 $UI_GENERATION_PID 2>/dev/null; then
            ((running_count++))
        fi
        
        if kill -0 $RESTAURANT_SEARCH_PID 2>/dev/null; then
            ((running_count++))
        fi
        
        if [ $running_count -eq 0 ]; then
            echo -e "${GREEN}✅ 全プロセス完了${NC}"
            break
        fi
        
        echo "  ⏳ 実行中プロセス: $running_count / 3 (経過: ${elapsed}秒)"
    done
}

# 監視開始
monitor_deployment &
MONITOR_PID=$!

# 全プロセス完了を待機
wait $ANALYSIS_PID 2>/dev/null; ANALYSIS_EXIT=$?
wait $UI_GENERATION_PID 2>/dev/null; UI_GENERATION_EXIT=$?
wait $RESTAURANT_SEARCH_PID 2>/dev/null; RESTAURANT_SEARCH_EXIT=$?

# 監視プロセス終了
kill $MONITOR_PID 2>/dev/null || true

DEPLOY_END_TIME=$(date +%s)
TOTAL_DEPLOY_TIME=$((DEPLOY_END_TIME - DEPLOY_START_TIME))

echo ""
echo -e "${BLUE}📋 並列デプロイ結果${NC}"
echo "----------------------------------------"

# 結果確認
check_agent_result() {
    local agent_name="$1"
    local url_file="$2"
    local status_file="$LOG_DIR/${agent_name}_status.txt"
    local log_file="$LOG_DIR/${agent_name}_deploy.log"
    
    if [ -f "$status_file" ]; then
        local status=$(cat "$status_file")
        case "$status" in
            "SUCCESS")
                if [ -f "$url_file" ]; then
                    local url=$(cat "$url_file")
                    echo -e "  ✅ ${agent_name}: 成功 - $url"
                    # setup.shで使用できるよう環境変数をエクスポート
                    case "$agent_name" in
                        "analysis") export ANALYSIS_URL="$url" ;;
                        "ui_generation") export UI_GENERATION_URL="$url" ;;
                        "restaurant_search") export RESTAURANT_SEARCH_URL="$url" ;;
                    esac
                    return 0
                else
                    echo -e "  ⚠️  ${agent_name}: ビルド成功、URL取得失敗"
                    return 1
                fi
                ;;
            "FAILED")
                echo -e "  ❌ ${agent_name}: 失敗"
                echo "     ログ: $log_file"
                return 1
                ;;
            "STARTED")
                echo -e "  ⏳ ${agent_name}: タイムアウト"
                return 1
                ;;
            *)
                echo -e "  ❓ ${agent_name}: 不明な状態"
                return 1
                ;;
        esac
    else
        echo -e "  ❌ ${agent_name}: ステータス不明"
        return 1
    fi
}

# 各エージェントの結果確認
ANALYSIS_SUCCESS=0
UI_GENERATION_SUCCESS=0
RESTAURANT_SEARCH_SUCCESS=0

if check_agent_result "analysis" "analysis_agent_url.txt"; then
    ANALYSIS_SUCCESS=1
fi

if check_agent_result "ui_generation" "ui_generation_agent_url.txt"; then
    UI_GENERATION_SUCCESS=1
fi

if check_agent_result "restaurant_search" "restaurant_search_agent_url.txt"; then
    RESTAURANT_SEARCH_SUCCESS=1
fi

SUCCESS_COUNT=$((ANALYSIS_SUCCESS + UI_GENERATION_SUCCESS + RESTAURANT_SEARCH_SUCCESS))

echo ""
echo -e "${BLUE}📊 デプロイ統計${NC}"
echo "  成功: $SUCCESS_COUNT / 3"
echo "  実行時間: ${TOTAL_DEPLOY_TIME}秒"
echo "  時間短縮: $(awk "BEGIN {printf \"%.1f\", (900 - $TOTAL_DEPLOY_TIME) / 900 * 100}")% (順次実行比)"

# フォールバック処理
if [ $SUCCESS_COUNT -eq 0 ]; then
    echo ""
    echo -e "${YELLOW}⚠️ 全エージェントが失敗しました。順次デプロイにフォールバック中...${NC}"
    
    # 順次デプロイスクリプトを実行
    cd ../..
    ./deploy-agents.sh
    exit $?
elif [ $SUCCESS_COUNT -lt 3 ]; then
    echo ""
    echo -e "${YELLOW}⚠️ 一部のエージェントが失敗しましたが、続行します${NC}"
fi

cd ../..

# 完了メッセージ
echo ""
echo "================================================================="
if [ $SUCCESS_COUNT -eq 3 ]; then
    echo -e "${GREEN}🎉 並列エージェントデプロイ完了！${NC}"
    echo -e "${GREEN}⚡ 時間短縮達成: ${TOTAL_DEPLOY_TIME}秒${NC}"
elif [ $SUCCESS_COUNT -gt 0 ]; then
    echo -e "${GREEN}🎉 部分的デプロイ完了 (成功: ${SUCCESS_COUNT}/3)${NC}"
else
    echo -e "${RED}❌ デプロイ失敗${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🤖 デプロイ済みAgent Engine:${NC}"
if [ $ANALYSIS_SUCCESS -eq 1 ]; then
    ANALYSIS_URL=$(cat packages/ai-agents/analysis_agent_url.txt)
    echo "  📊 分析レポート: $ANALYSIS_URL"
fi
if [ $UI_GENERATION_SUCCESS -eq 1 ]; then
    UI_GENERATION_URL=$(cat packages/ai-agents/ui_generation_agent_url.txt)
    echo "  🎨 UI生成: $UI_GENERATION_URL"
fi
if [ $RESTAURANT_SEARCH_SUCCESS -eq 1 ]; then
    RESTAURANT_SEARCH_URL=$(cat packages/ai-agents/restaurant_search_agent_url.txt)
    echo "  🍽️ レストラン検索: $RESTAURANT_SEARCH_URL"
fi

# ログディレクトリの処理
if [ "${DEBUG:-0}" = "1" ]; then
    echo ""
    echo -e "${BLUE}📁 デバッグログ保存場所:${NC} $LOG_DIR"
    echo "  ログファイル:"
    ls -la "$LOG_DIR"/*.*txt 2>/dev/null | sed 's/^/    /' || echo "    ログファイルなし"
else
    echo ""
    echo -e "${BLUE}🧹 一時ログクリーンアップ中...${NC}"
    rm -rf "$LOG_DIR"
    echo "  ✅ 一時ログファイル削除完了"
fi

echo ""
echo -e "${BLUE}📋 次のステップ:${NC}"
echo "  1. フロントエンドデプロイ: ./deploy-frontend.sh"
echo "  2. 統合テスト: ./debug.sh"
echo "  3. 全機能確認: ブラウザでアクセステスト"
if [ "${DEBUG:-0}" = "1" ]; then
    echo "  4. デバッグログ確認: $LOG_DIR"
fi