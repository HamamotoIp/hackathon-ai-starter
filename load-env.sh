#!/bin/bash
# .envファイルを読み込んでbash変数にエクスポートするヘルパー関数

load_env() {
  if [ -f .env ]; then
    export $(grep -v '^#' .env | grep -v '^$' | xargs)
  else
    echo "Error: .env file not found. Please copy .env.example to .env and configure it."
    exit 1
  fi
}