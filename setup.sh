#!/bin/bash
set -e

source load-env.sh
load_env
REGION=${REGION:-us-central1}
ENVIRONMENT=${ENVIRONMENT:-dev}

echo "🔧 GCP設定中..."
gcloud config set project "$PROJECT_ID" --quiet >/dev/null 2>&1
echo "📋 API有効化中..."
gcloud services enable run.googleapis.com cloudbuild.googleapis.com aiplatform.googleapis.com storage.googleapis.com firestore.googleapis.com customsearch.googleapis.com --quiet >/dev/null 2>&1

echo "👤 サービスアカウント設定中..."
SERVICE_ACCOUNT="ai-chat-$ENVIRONMENT"
SERVICE_ACCOUNT_EMAIL="$SERVICE_ACCOUNT@$PROJECT_ID.iam.gserviceaccount.com"

gcloud iam service-accounts describe "$SERVICE_ACCOUNT_EMAIL" >/dev/null 2>&1 || gcloud iam service-accounts create "$SERVICE_ACCOUNT" --display-name "AI Chat Service Account" --quiet >/dev/null 2>&1

gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" --role="roles/aiplatform.user" --quiet >/dev/null 2>&1
gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" --role="roles/storage.objectAdmin" --quiet >/dev/null 2>&1
gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" --role="roles/datastore.user" --quiet >/dev/null 2>&1

CURRENT_USER=$(gcloud config get-value account)
gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="user:$CURRENT_USER" --role="roles/aiplatform.user" --quiet >/dev/null 2>&1

echo "📦 ストレージバケット設定中..."
BUCKET_NAME="$PROJECT_ID-images"
RESTAURANT_BUCKET_NAME="$PROJECT_ID-restaurant-results"
gsutil ls "gs://$BUCKET_NAME" >/dev/null 2>&1 || gsutil mb -p "$PROJECT_ID" -c STANDARD -l "$REGION" "gs://$BUCKET_NAME" >/dev/null 2>&1
gsutil ls "gs://$RESTAURANT_BUCKET_NAME" >/dev/null 2>&1 || gsutil mb -p "$PROJECT_ID" -c STANDARD -l "$REGION" "gs://$RESTAURANT_BUCKET_NAME" >/dev/null 2>&1
gsutil iam ch allUsers:objectViewer "gs://$RESTAURANT_BUCKET_NAME" >/dev/null 2>&1

echo "🗄️ Firestoreデータベース設定中..."
gcloud firestore databases list --project="$PROJECT_ID" | grep -q "(default)" || gcloud firestore databases create --location="$REGION" --project="$PROJECT_ID" --quiet >/dev/null 2>&1

echo "🤖 エージェントデプロイ中..."
./scripts/deploy-agents-parallel.sh

echo "🌐 フロントエンドデプロイ中..."
./scripts/deploy-frontend.sh

echo "✅ デプロイ完了！"