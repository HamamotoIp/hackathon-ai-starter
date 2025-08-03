# 🧪 AIエージェントcurlデバッグガイド

**AI開発・デプロイ後のエージェント動作確認専用ドキュメント**

## 🎯 概要

AIエージェントデプロイ後に、curlコマンドを使用してエージェントの動作を直接確認・デバッグするための詳細手順書です。

## 📋 前提条件

### 1. デプロイ完了の確認
```bash
# エージェントURLファイルの存在確認
ls packages/ai-agents/*.txt

# 期待される出力:
# analysis_agent_url.txt
# tourism_spots_search_agent_url.txt
```

### 2. 環境変数の確認
```bash
# プロジェクトID確認
echo $PROJECT_ID

# リージョン確認  
echo $REGION
```

## 🚀 基本的なcurlテスト手順

### ステップ1: エージェントURL取得
```bash
# Analysis Agent URL取得
ANALYSIS_URL=$(cat packages/ai-agents/analysis_agent_url.txt)
echo "Analysis Agent URL: $ANALYSIS_URL"

# Tourism Spots Search Agent URL取得
TOURISM_URL=$(cat packages/ai-agents/tourism_spots_search_agent_url.txt)
echo "Tourism Spots Agent URL: $TOURISM_URL"
```

### ステップ2: セッション作成テスト
```bash
# Analysis Agentセッション作成
curl -X POST "$ANALYSIS_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -d '{
    "class_method": "create_session",
    "input": {
      "user_id": "debug_user_001"
    }
  }' \
  | jq .

# Tourism Spots Agentセッション作成
curl -X POST "$TOURISM_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -d '{
    "class_method": "create_session", 
    "input": {
      "user_id": "debug_user_002"
    }
  }' \
  | jq .
```

**期待されるレスポンス例:**
```json
{
  "output": {
    "id": "session_abc123",
    "userId": "debug_user_001",
    "state": {},
    "appName": "analysis_agent",
    "events": []
  }
}
```

### ステップ3: 基本クエリテスト

#### Analysis Agent クエリテスト
```bash
# セッションIDを変数に保存（上記レスポンスから取得）
SESSION_ID="session_abc123"

# 分析クエリ実行
curl -X POST "$ANALYSIS_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -d '{
    "class_method": "stream_query",
    "input": {
      "message": "売上データを分析してください。Q1: 100万円、Q2: 150万円、Q3: 120万円、Q4: 180万円",
      "session_id": "'"$SESSION_ID"'",
      "user_id": "debug_user_001"
    }
  }' \
  | jq .
```

#### Tourism Spots Agent クエリテスト
```bash
# 新しいセッション作成（Tourism Spots用）
TOURISM_SESSION_ID="session_def456"

# 観光スポット検索クエリ実行
curl -X POST "$TOURISM_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -d '{
    "class_method": "stream_query",
    "input": {
      "message": "東京で歴史を感じられる春の観光スポットを教えて",
      "session_id": "'"$TOURISM_SESSION_ID"'",
      "user_id": "debug_user_002"
    }
  }' \
  | jq .
```

## 🔍 詳細デバッグテスト

### 1. エラーハンドリングテスト

#### 無効なセッションIDテスト
```bash
curl -X POST "$ANALYSIS_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -d '{
    "class_method": "stream_query",
    "input": {
      "message": "テストメッセージ",
      "session_id": "invalid_session_id",
      "user_id": "debug_user_001"
    }
  }' \
  | jq .
```

#### 認証エラーテスト
```bash
curl -X POST "$ANALYSIS_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "class_method": "create_session",
    "input": {
      "user_id": "debug_user_001"
    }
  }' \
  | jq .
```

### 2. パフォーマンステスト

#### レスポンス時間測定
```bash
# Analysis Agent レスポンス時間測定
time curl -X POST "$ANALYSIS_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -d '{
    "class_method": "stream_query",
    "input": {
      "message": "簡単な分析テスト",
      "session_id": "'"$SESSION_ID"'",
      "user_id": "debug_user_001"
    }
  }' \
  -o /dev/null -s
```

#### 同時接続テスト
```bash
# 5つの並列リクエスト実行
for i in {1..5}; do
  (
    curl -X POST "$TOURISM_URL" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $(gcloud auth print-access-token)" \
      -d '{
        "class_method": "create_session",
        "input": {
          "user_id": "debug_user_00'$i'"
        }
      }' \
      | jq . > "debug_response_$i.json"
  ) &
done
wait

# 結果確認
ls debug_response_*.json
```

### 3. 複雑なクエリテスト

#### Tourism Spots Agent - 複数条件検索
```bash
curl -X POST "$TOURISM_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -d '{
    "class_method": "stream_query",
    "input": {
      "message": "京都で文化を体験できる秋の観光スポット、予算3万円以内、家族向け",
      "session_id": "'"$TOURISM_SESSION_ID"'",
      "user_id": "debug_user_002"
    }
  }' \
  | jq . > tourism_complex_query.json

# HTML出力の確認
cat tourism_complex_query.json | jq -r '.output.html' > debug_output.html
```

#### Analysis Agent - データ分析テスト
```bash
curl -X POST "$ANALYSIS_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -d '{
    "class_method": "stream_query",
    "input": {
      "message": "以下の売上データの傾向分析とQ4予測をお願いします：\nQ1 2024: 120万円\nQ2 2024: 135万円\nQ3 2024: 128万円\n前年同期比: Q1 +5%, Q2 +8%, Q3 +3%",
      "session_id": "'"$SESSION_ID"'",
      "user_id": "debug_user_001"
    }
  }' \
  | jq . > analysis_complex_query.json

# 分析結果の確認
cat analysis_complex_query.json | jq -r '.output' > analysis_result.md
```

## 🛠️ トラブルシューティング

### よくあるエラーと解決策

#### 1. 認証エラー
```bash
# エラー例
# {"error": {"code": 401, "message": "Unauthorized"}}

# 解決策: アクセストークン再取得
gcloud auth print-access-token
gcloud auth application-default login
```

#### 2. エージェントURL不正
```bash
# エラー例
# curl: (6) Could not resolve host

# 解決策: URLファイル確認
cat packages/ai-agents/analysis_agent_url.txt
cat packages/ai-agents/tourism_spots_search_agent_url.txt

# URL再取得
cd packages/ai-agents
python deploy/deploy_analysis.py
python deploy/deploy_tourism_spots.py
```

#### 3. タイムアウトエラー
```bash
# エラー例
# curl: (28) Operation timed out

# 解決策: タイムアウト時間延長
curl --max-time 300 -X POST "$ANALYSIS_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -d '...'
```

#### 4. JSON パースエラー
```bash
# エラー例
# jq: parse error: Invalid numeric literal

# 解決策: レスポンス確認
curl -X POST "$ANALYSIS_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -d '...' \
  -o raw_response.txt

# 生レスポンス確認
cat raw_response.txt
```

## 📊 デバッグ結果の確認・保存

### 1. レスポンス保存
```bash
# デバッグセッション用ディレクトリ作成
mkdir -p debug_sessions/$(date +%Y%m%d_%H%M%S)
cd debug_sessions/*/

# 全テスト結果を保存
curl -X POST "$ANALYSIS_URL" ... | tee analysis_test.json
curl -X POST "$TOURISM_URL" ... | tee tourism_test.json
```

### 2. ログ分析
```bash
# Cloud Runログ確認
gcloud logging read 'resource.type="cloud_run_revision"' \
  --filter='textPayload:"stream_query"' \
  --limit=20 \
  --format="value(textPayload)"

# Agent Engineログ確認
gcloud logging read 'resource.type="reasoning_engine"' \
  --limit=20 \
  --format="value(textPayload)"
```

### 3. パフォーマンス分析
```bash
# レスポンス時間統計
for i in {1..10}; do
  echo "Test $i:"
  time curl -X POST "$ANALYSIS_URL" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $(gcloud auth print-access-token)" \
    -d '{"class_method": "create_session", "input": {"user_id": "perf_test_'$i'"}}' \
    -o /dev/null -s
done
```

## 🎯 実用的なデバッグスクリプト

### 自動テストスクリプト作成
```bash
# debug_agents.sh 作成
cat << 'EOF' > debug_agents.sh
#!/bin/bash

set -e

echo "🧪 AIエージェント自動デバッグテスト開始"

# URL取得
ANALYSIS_URL=$(cat packages/ai-agents/analysis_agent_url.txt 2>/dev/null || echo "")
TOURISM_URL=$(cat packages/ai-agents/tourism_spots_search_agent_url.txt 2>/dev/null || echo "")

if [[ -z "$ANALYSIS_URL" || -z "$TOURISM_URL" ]]; then
  echo "❌ エージェントURLファイルが見つかりません"
  exit 1
fi

# アクセストークン取得
TOKEN=$(gcloud auth print-access-token)

echo "✅ Analysis Agent URL: $ANALYSIS_URL"
echo "✅ Tourism Agent URL: $TOURISM_URL"

# テスト実行
echo "🔄 セッション作成テスト中..."
curl -X POST "$ANALYSIS_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"class_method": "create_session", "input": {"user_id": "auto_test"}}' \
  | jq -r '.output.id' > session_id.txt

SESSION_ID=$(cat session_id.txt)
echo "✅ セッション作成完了: $SESSION_ID"

echo "🔄 クエリテスト中..."
curl -X POST "$ANALYSIS_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "class_method": "stream_query",
    "input": {
      "message": "自動テストクエリ",
      "session_id": "'$SESSION_ID'",
      "user_id": "auto_test"
    }
  }' | jq . > test_result.json

echo "✅ 全テスト完了！結果: test_result.json"
EOF

chmod +x debug_agents.sh
```

### 使用方法
```bash
# スクリプト実行
./debug_agents.sh

# 結果確認
cat test_result.json | jq .
```

## 🔍 高度なデバッグテクニック

### 1. SSEストリーム確認
```bash
# ストリーミングレスポンスの確認
curl -X POST "$TOURISM_URL?alt=sse" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Accept: text/event-stream" \
  -d '{
    "class_method": "stream_query",
    "input": {
      "message": "東京の観光スポット",
      "session_id": "'$TOURISM_SESSION_ID'",
      "user_id": "debug_user_002"
    }
  }' \
  --no-buffer
```

### 2. 詳細エラー情報取得
```bash
# verbose モードでの詳細確認
curl -v -X POST "$ANALYSIS_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -d '...' \
  2>&1 | tee curl_verbose.log
```

### 3. レスポンスヘッダー確認
```bash
# レスポンスヘッダー詳細確認
curl -I -X POST "$ANALYSIS_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)"
```

---

**🧪 このドキュメントを使って、AIエージェントの動作を確実に確認・デバッグしましょう！**