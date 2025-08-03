#!/bin/bash
set -e

source ./load-env.sh
load_env
REGION=${REGION:-us-central1}
ENVIRONMENT=${ENVIRONMENT:-dev}

gcloud config set project "$PROJECT_ID" --quiet >/dev/null 2>&1

ANALYSIS_URL=""
RESTAURANT_SEARCH_URL=""

[ -f "../packages/ai-agents/analysis_agent_url.txt" ] && ANALYSIS_URL=$(cat ../packages/ai-agents/analysis_agent_url.txt)
[ -f "../packages/ai-agents/restaurant_search_agent_url.txt" ] && RESTAURANT_SEARCH_URL=$(cat ../packages/ai-agents/restaurant_search_agent_url.txt)

BUCKET_NAME="$PROJECT_ID-images"
RESTAURANT_BUCKET_NAME="$PROJECT_ID-restaurant-results"
SERVICE_ACCOUNT_EMAIL="ai-chat-$ENVIRONMENT@$PROJECT_ID.iam.gserviceaccount.com"

cd ../packages/frontend

FRONTEND_SERVICE="ai-chat-frontend-$ENVIRONMENT"

gcloud builds submit . --config=cloudbuild.yaml --substitutions="_SERVICE_NAME=$FRONTEND_SERVICE,_REGION=$REGION,_SERVICE_ACCOUNT=$SERVICE_ACCOUNT_EMAIL" --timeout=1200s --quiet

ENV_VARS="NODE_ENV=production,VERTEX_AI_PROJECT_ID=$PROJECT_ID,VERTEX_AI_LOCATION=$REGION,BUCKET_NAME=$BUCKET_NAME,RESTAURANT_BUCKET_NAME=$RESTAURANT_BUCKET_NAME,SERVICE_ACCOUNT_EMAIL=$SERVICE_ACCOUNT_EMAIL"
[ -n "$ANALYSIS_URL" ] && ENV_VARS="$ENV_VARS,ANALYSIS_AGENT_URL=$ANALYSIS_URL"
[ -n "$RESTAURANT_SEARCH_URL" ] && ENV_VARS="$ENV_VARS,RESTAURANT_SEARCH_AGENT_URL=$RESTAURANT_SEARCH_URL"

gcloud run services update "$FRONTEND_SERVICE" --region "$REGION" --update-env-vars "$ENV_VARS" --quiet