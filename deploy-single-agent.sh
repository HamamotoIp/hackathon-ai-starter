#!/bin/bash
# 単独エージェントデプロイスクリプト（サンプル）
# 新しいエージェント追加時の参考用

set -e

# 使用方法チェック
if [ $# -eq 0 ]; then
    echo "使用方法: $0 <agent_script_name>"
    echo "例: $0 deploy_analysis.py"
    echo "例: $0 deploy_new_agent.py"
    exit 1
fi

AGENT_SCRIPT="$1"

source config.sh
REGION=${REGION:-us-central1}

gcloud config set project "$PROJECT_ID" --quiet >/dev/null 2>&1
gcloud services enable aiplatform.googleapis.com --quiet >/dev/null 2>&1

STAGING_BUCKET="$PROJECT_ID-agent-engine-staging"
gsutil ls "gs://$STAGING_BUCKET" >/dev/null 2>&1 || gsutil mb -p "$PROJECT_ID" -c STANDARD -l "$REGION" "gs://$STAGING_BUCKET" >/dev/null

cd packages/ai-agents

[ ! -d "venv" ] && python -m venv venv
source venv/bin/activate
pip install -r requirements.txt --quiet

export VERTEX_AI_PROJECT_ID="$PROJECT_ID"
export VERTEX_AI_LOCATION="$REGION"

python "deploy/$AGENT_SCRIPT"