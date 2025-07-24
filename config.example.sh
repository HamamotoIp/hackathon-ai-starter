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

# =============================================================================
# Utility Functions
# =============================================================================

# Validate configuration
validate_config() {
    echo "Validating configuration..."
    
    # Check required variables
    if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "your-gcp-project-id" ]; then
        echo -e "${RED}Error: PROJECT_ID is not set or still using default value${NC}"
        echo "Please edit config.sh and set your actual GCP project ID"
        exit 1
    fi
    
    # Validate GCP project ID format
    if [[ ! "$PROJECT_ID" =~ ^[a-z][a-z0-9-]{4,28}[a-z0-9]$ ]]; then
        echo -e "${RED}Error: Invalid PROJECT_ID format${NC}"
        echo "Project ID must be 6-30 characters, start with lowercase letter, contain only lowercase letters, numbers, and hyphens"
        exit 1
    fi
    
    # Validate memory setting
    if [[ ! "$MEMORY" =~ ^[0-9]+[GM]i$ ]]; then
        echo -e "${RED}Error: Invalid MEMORY format${NC}"
        echo "MEMORY must be in format like 512Mi, 1Gi, 2Gi, etc."
        exit 1
    fi
    
    # Validate CPU setting
    if [[ ! "$CPU" =~ ^[0-9]+$ ]]; then
        echo -e "${RED}Error: Invalid CPU format${NC}"
        echo "CPU must be a number (1, 2, 4, 8)"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Configuration validation passed${NC}"
}

# Show current configuration
show_config() {
    echo -e "${BLUE}Project Configuration:${NC}"
    echo "  Project ID: $PROJECT_ID"
    echo "  Region: $REGION"
    echo "  Environment: $ENVIRONMENT"
    echo ""
    echo -e "${BLUE}Service Names:${NC}"
    echo "  Frontend: $FRONTEND_SERVICE_NAME"
    echo "  Agent Engine: $AGENT_SERVICE_NAME"
    echo "  Storage Bucket: $BUCKET_NAME"
    echo "  Service Account: $SERVICE_ACCOUNT_NAME"
    echo ""
    echo -e "${BLUE}Resource Configuration:${NC}"
    echo "  Memory: $MEMORY"
    echo "  CPU: $CPU"
    echo "  Max Instances: $MAX_INSTANCES"
    echo "  Min Instances: $MIN_INSTANCES"
    echo "  Concurrency: $CONCURRENCY"
    echo "  Storage Class: $STORAGE_CLASS"
    echo "  Image Lifecycle: $LIFECYCLE_DAYS days"
}

# Estimate monthly costs
estimate_cost() {
    echo -e "${BLUE}📊 Cost Estimation (Monthly):${NC}"
    echo ""
    echo -e "${YELLOW}Cloud Run Services (2 services):${NC}"
    echo "  • With minimal traffic: $0-1 USD"
    echo "  • With moderate traffic: $1-3 USD"
    echo "  • With high traffic: $3-10 USD"
    echo ""
    echo -e "${YELLOW}Cloud Storage:${NC}"
    echo "  • Standard storage: $0-2 USD"
    echo "  • Egress costs: $0-1 USD"
    echo ""
    echo -e "${YELLOW}Vertex AI API:${NC}"
    echo "  • Gemini 2.0 Flash: $0-5 USD"
    echo "  • (Depends on usage volume)"
    echo ""
    echo -e "${GREEN}Total Estimated Range: $0-15 USD/month${NC}"
    echo -e "${BLUE}Cost optimizations applied:${NC}"
    echo "  • Min instances: 0 (no idle costs)"
    echo "  • Max instances: $MAX_INSTANCES (prevents runaway costs)"
    echo "  • Auto-delete images after $LIFECYCLE_DAYS days"
    echo "  • Minimal memory and CPU allocation"
}