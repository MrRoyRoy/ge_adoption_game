#!/bin/bash

# GE Adoption Game - Cloud Run Deployment Script
# Automatically deploys the containerized application to Google Cloud Run

# Set exit on error
set -e

PROJECT_ID="ge-edu-demo"
SERVICE_NAME="ge-adoption-game"
REGION="us-central1"
SERVICE_ACCOUNT="ge-adoption-sa@ge-edu-demo.iam.gserviceaccount.com"

echo "======================================================="
echo "🚀 INITIATING CLOUD RUN DEPLOYMENT"
echo "🔧 Project: ${PROJECT_ID}"
echo "📦 Service: ${SERVICE_NAME}"
echo "🌍 Region: ${REGION}"
echo "👤 Service Account: ${SERVICE_ACCOUNT}"
echo "======================================================="

# Ensure correct project context
echo "Checking project context..."
gcloud config set project "${PROJECT_ID}"

# Create GCS Bucket if it doesn't already exist
BUCKET_NAME="${PROJECT_ID}-game-db"
echo "Ensuring persistent storage bucket gs://${BUCKET_NAME} exists..."
gcloud storage buckets create "gs://${BUCKET_NAME}" --location="${REGION}" --project="${PROJECT_ID}" 2>/dev/null || true

# Trigger build and deployment
echo "Triggering Cloud Run build and deployment from local source with persistent GCS volume..."
gcloud run deploy "${SERVICE_NAME}" \
  --source . \
  --region "${REGION}" \
  --project "${PROJECT_ID}" \
  --service-account "${SERVICE_ACCOUNT}" \
  --max-instances 1 \
  --allow-unauthenticated \
  --add-volume="name=db-volume,type=cloud-storage,bucket=${BUCKET_NAME}" \
  --add-volume-mount="volume=db-volume,mount-path=/app/data" \
  --set-env-vars="PROJECT_ID=${PROJECT_ID},LOCATION=global,IMAGEN_MODEL=gemini-3.1-flash-lite-image,GEMINI_MODEL=gemini-3.5-flash,DB_PATH=/app/data/game.db"

echo "======================================================="
echo "🎉 DEPLOYMENT COMPLETE!"
echo "Your game is live and ready."
echo "======================================================="
