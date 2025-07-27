#!/bin/bash

# Agent Engine 古いバージョン削除スクリプト
# Pythonスクリプトを呼び出してAgent Engineをクリーンアップ

set -e

# 色定義（deploy-agents.shと同じ）
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# 色付きログ用の関数
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW:-\033[0;33m}⚠️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# 設定読み込みと環境変数設定
setup_environment() {
    # 設定ファイル読み込み
    if [ ! -f "config.sh" ]; then
        log_error "config.sh が見つかりません"
        echo ""
        echo "設定ファイルを作成してください:"
        echo "  cp config.example.sh config.sh"
        echo "  # config.sh を編集してPROJECT_IDを設定"
        exit 1
    fi
    
    source config.sh
    
    # 必須設定チェック
    if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "your-gcp-project-id" ]; then
        log_error "PROJECT_ID が設定されていません"
        echo "config.sh を編集してください"
        exit 1
    fi
    
    # デフォルト値設定
    REGION=${REGION:-us-central1}
    
    # gcloud設定（deploy-agents.shと同じ）
    gcloud config set project "$PROJECT_ID"
    
    # APIs有効化（Agent Engine削除に必要）
    log_info "必要なAPI有効化中..."
    gcloud services enable aiplatform.googleapis.com --quiet
    
    # Vertex AI用環境変数設定（deploy-agents.shと同じ方法）
    export VERTEX_AI_PROJECT_ID="$PROJECT_ID"
    export VERTEX_AI_LOCATION="$REGION"
    
    log_info "プロジェクト: $PROJECT_ID"
    log_info "リージョン: $REGION"
    
    # Python環境チェック
    if ! command -v python &> /dev/null; then
        log_error "pythonが見つかりません"
        exit 1
    fi
}

# ヘルプ表示
show_help() {
    echo "Agent Engine クリーンアップスクリプト"
    echo ""
    echo "使用方法: $0 [オプション]"
    echo ""
    echo "オプション:"
    echo "  --execute, -e    実際に削除を実行"
    echo "  --help, -h       このヘルプを表示"
    echo ""
    echo "例:"
    echo "  $0                # ドライラン（削除対象を確認のみ）"
    echo "  $0 --execute      # 実際に削除を実行"
    echo ""
    echo "注意:"
    echo "  - 現在使用中のエージェント（*_agent_url.txtに記録）は保護されます"
    echo "  - デフォルトはドライランモードです"
    echo "  - VERTEX_AI_PROJECT_ID環境変数が必要です"
}

# メイン処理
main() {
    local python_args=()
    
    # コマンドライン引数解析
    for arg in "$@"; do
        case $arg in
            --execute|-e)
                python_args+=("--execute")
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                log_error "不明なオプション: $arg"
                show_help
                exit 1
                ;;
        esac
    done
    
    # 環境設定
    setup_environment
    
    # ai-agentsディレクトリ存在チェック
    if [ ! -d "packages/ai-agents" ]; then
        log_error "packages/ai-agents ディレクトリが見つかりません"
        exit 1
    fi
    
    # Python仮想環境の準備とアクティベート
    log_info "Python環境を準備中..."
    cd packages/ai-agents
    
    if [ ! -d "venv" ]; then
        log_info "仮想環境を作成中..."
        python -m venv venv
    fi
    
    source venv/bin/activate
    
    # 依存関係インストール（必要に応じて）
    if [ ! -f "venv/.deps_installed" ]; then
        log_info "依存関係をインストール中..."
        pip install -r requirements.txt --quiet
        touch venv/.deps_installed
    fi
    
    # Pythonスクリプト実行
    log_info "Agent Engine クリーンアップを開始します..."
    
    if python cleanup_old_agents.py "${python_args[@]}"; then
        log_success "クリーンアップスクリプトが正常終了しました"
        cd ../..
    else
        log_error "クリーンアップスクリプトでエラーが発生しました"
        cd ../..
        exit 1
    fi
}

# スクリプト実行
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi