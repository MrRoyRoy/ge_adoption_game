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

# Trigger build and deployment
echo "Triggering Cloud Run build and deployment from local source..."
gcloud run deploy "${SERVICE_NAME}" \
  --source . \
  --region "${REGION}" \
  --project "${PROJECT_ID}" \
  --service-account "${SERVICE_ACCOUNT}" \
  --max-instances 1 \
  --allow-unauthenticated \
  --set-env-vars="PROJECT_ID=${PROJECT_ID},LOCATION=global,IMAGEN_MODEL=gemini-3.1-flash-lite-image,GEMINI_MODEL=gemini-3.5-flash"

echo "======================================================="
echo "🎉 DEPLOYMENT COMPLETE!"
echo "Your game is live and ready."
echo "======================================================="
