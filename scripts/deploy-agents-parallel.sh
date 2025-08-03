#!/bin/bash
set -e

source ./load-env.sh
load_env
REGION=${REGION:-us-central1}

gcloud config set project "$PROJECT_ID" --quiet >/dev/null 2>&1
gcloud services enable aiplatform.googleapis.com --quiet >/dev/null 2>&1

STAGING_BUCKET="$PROJECT_ID-agent-engine-staging"
gsutil ls "gs://$STAGING_BUCKET" >/dev/null 2>&1 || gsutil mb -p "$PROJECT_ID" -c STANDARD -l "$REGION" "gs://$STAGING_BUCKET" >/dev/null

cd ../packages/ai-agents

[ ! -d "venv" ] && python -m venv venv
source venv/bin/activate
pip install -r requirements.txt --quiet

export VERTEX_AI_PROJECT_ID="$PROJECT_ID"
export VERTEX_AI_LOCATION="$REGION"

deploy_agent() {
    python "deploy/$1" >/dev/null 2>&1
}

deploy_agent "deploy_analysis.py" &
deploy_agent "deploy_restaurant_search.py" &

wait
cd ../../../..