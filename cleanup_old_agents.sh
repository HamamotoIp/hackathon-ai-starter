#!/bin/bash
set -e

source config.sh
REGION=${REGION:-us-central1}

gcloud config set project "$PROJECT_ID" --quiet >/dev/null 2>&1
gcloud services enable aiplatform.googleapis.com --quiet >/dev/null 2>&1

export VERTEX_AI_PROJECT_ID="$PROJECT_ID"
export VERTEX_AI_LOCATION="$REGION"

cd packages/ai-agents

[ ! -d "venv" ] && python -m venv venv
source venv/bin/activate
pip install -r requirements.txt --quiet

python cleanup_old_agents.py "$@"