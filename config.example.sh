#!/bin/bash

# AI Chat Starter Kit - Configuration Example
# Copy this file to config.sh and customize your settings

# =============================================================================
# Required Configuration
# =============================================================================

# GCP Project ID (REQUIRED)
PROJECT_ID="your-gcp-project-id"

# =============================================================================
# Optional Configuration
# =============================================================================

# GCP Region (default: us-central1)
# Popular options: us-central1, us-east1, asia-northeast1, europe-west1
REGION="us-central1"

# Environment name (default: dev)
# Use: dev, staging, prod, or custom names
ENVIRONMENT="dev"

# =============================================================================
# Advanced Configuration
# =============================================================================

# Cloud Run Configuration
MEMORY="512Mi"        # Memory allocation (256Mi, 512Mi, 1Gi, 2Gi, 4Gi)
CPU="1"              # CPU allocation (1, 2, 4, 8)
MAX_INSTANCES="1"    # Maximum instances (1-1000, use 1 for cost control)
MIN_INSTANCES="0"    # Minimum instances (0-1000, use 0 for cost savings)
CONCURRENCY="80"     # Concurrent requests per instance (1-1000)

# Storage Configuration
STORAGE_CLASS="STANDARD"  # Storage class (STANDARD, NEARLINE, COLDLINE)
LIFECYCLE_DAYS="30"       # Auto-delete images after N days (cost optimization)

# =============================================================================
# Common Configuration Examples
# =============================================================================

# Example 1: Cost-Optimized (recommended for hackathons)
# MEMORY="512Mi"
# CPU="1"
# MAX_INSTANCES="1"
# MIN_INSTANCES="0"

# Example 2: Development Environment
# MEMORY="1Gi"
# CPU="1"
# MAX_INSTANCES="2"
# MIN_INSTANCES="0"

# Example 3: Production Environment
# MEMORY="2Gi"
# CPU="2"
# MAX_INSTANCES="10"
# MIN_INSTANCES="1"

# =============================================================================
# Regional Examples
# =============================================================================

# For Japan users:
# REGION="asia-northeast1"

# For Europe users:
# REGION="europe-west1"

# For US East Coast:
# REGION="us-east1"

# =============================================================================
# Service Names (Auto-generated)
# =============================================================================

# Service names are automatically generated based on environment
FRONTEND_SERVICE_NAME="ai-chat-frontend-${ENVIRONMENT}"
AGENT_SERVICE_NAME="ai-chat-agent-engine-${ENVIRONMENT}"
BUCKET_NAME="${PROJECT_ID}-images"
SERVICE_ACCOUNT_NAME="ai-chat-${ENVIRONMENT}"

# =============================================================================
# Environment Examples
# =============================================================================

# Multiple environments for the same project:
# ENVIRONMENT="dev"      # Development
# ENVIRONMENT="staging"  # Staging
# ENVIRONMENT="prod"     # Production

