# 環境変数管理ガイド

## 概要

AI Chat Starter Kitでは、環境変数を`config.sh`で一元管理する方式を採用しています。これにより、複数の`.env`ファイルによる設定の重複や不整合を防ぎます。

## 設定ファイルの構成

### 1. config.sh（マスター設定）

**場所**: `/workspaces/hackathon-ai-starter/config.sh`

```bash
# 必須設定
PROJECT_ID="food-hack-466801"

# オプション設定
REGION="us-central1"
ENVIRONMENT="dev"

# リソース設定
MEMORY="512Mi"
CPU="1"
MAX_INSTANCES="1"
MIN_INSTANCES="0"
```

### 2. フロントエンド環境変数

**場所**: `packages/frontend/.env.production`

```
NODE_ENV=production
VERTEX_AI_PROJECT_ID=food-hack-466801
VERTEX_AI_LOCATION=us-central1
ANALYSIS_AGENT_URL=https://...
UI_GENERATION_AGENT_URL=https://...
RESTAURANT_SEARCH_AGENT_URL=https://...
BUCKET_NAME=food-hack-466801-images
SERVICE_ACCOUNT_EMAIL=ai-chat-dev@food-hack-466801.iam.gserviceaccount.com
```

## 環境変数の流れ

```
config.sh
    │
    ├─► デプロイスクリプト
    │   ├─► deploy_analysis.py
    │   ├─► deploy_ui_generation.py
    │   └─► deploy_restaurant_search.py
    │
    ├─► セットアップスクリプト
    │   └─► setup.sh
    │
    └─► クリーンアップスクリプト
        └─► cleanup_old_agents.py
```

## 実装詳細

### デプロイスクリプトでの読み込み

すべてのデプロイスクリプトは以下のパターンで`config.sh`を読み込みます：

```python
# config.shから環境変数を読み込み
config_path = os.path.join(os.path.dirname(__file__), "../../../config.sh")
if os.path.exists(config_path):
    with open(config_path, 'r') as f:
        config_content = f.read()
    
    import re
    project_match = re.search(r'PROJECT_ID="([^"]+)"', config_content)
    region_match = re.search(r'REGION="([^"]+)"', config_content)
    
    if project_match:
        os.environ['VERTEX_AI_PROJECT_ID'] = project_match.group(1)
    if region_match:
        os.environ['VERTEX_AI_LOCATION'] = region_match.group(1)
```

### 変更前後の比較

#### 変更前（.envファイル方式）

```
packages/ai-agents/
├── analysis_agent/
│   └── .env  # GOOGLE_CLOUD_PROJECT=food-hack-466801
├── ui_generation_agent/
│   └── .env  # GOOGLE_CLOUD_PROJECT=food-hack-466801
└── restaurant_search_agent/
    └── .env  # GOOGLE_CLOUD_PROJECT=food-hack-466801
```

**問題点**:
- 同じ設定が複数ファイルに重複
- 更新時に漏れが発生しやすい
- 管理が煩雑

#### 変更後（config.sh方式）

```
/
├── config.sh  # 一元管理
└── packages/ai-agents/
    ├── analysis_agent/      # .envなし
    ├── ui_generation_agent/ # .envなし
    └── restaurant_search_agent/ # .envなし
```

**メリット**:
- 設定の一元管理
- 更新漏れの防止
- シンプルな構成

## 注意事項

### 1. フロントエンドの環境変数

フロントエンドの`.env.production`は手動更新が必要です：

1. エージェントをデプロイ
2. 生成されたURLを`*_agent_url.txt`から取得
3. `.env.production`に手動でコピー

### 2. ローカル開発時

ローカル開発では`config.sh`をソースしてから実行：

```bash
source config.sh
./venv/bin/python debug/test_agents.py
```

### 3. エラーメッセージの改善

環境変数が見つからない場合、明確なエラーメッセージを表示：

```python
if not project_id:
    raise ValueError("PROJECT_ID not found in config.sh. Please set PROJECT_ID in config.sh")
```

## トラブルシューティング

### 「環境変数が設定されていません」エラー

1. `config.sh`が存在することを確認
2. `PROJECT_ID`が正しく設定されているか確認
3. スクリプトの実行ディレクトリが正しいか確認

### デプロイスクリプトが動かない

```bash
# 仮想環境を使用して実行
cd packages/ai-agents
./venv/bin/python deploy/deploy_all_agents.py
```

### フロントエンドで500エラー

1. `.env.production`にエージェントURLが設定されているか確認
2. URLが最新のものか確認（再デプロイ後は更新が必要）

## ベストプラクティス

1. **プロジェクト初期設定時**
   - `config.sh`を最初に設定
   - プロジェクトIDとリージョンを確認

2. **エージェント追加時**
   - デプロイスクリプトに`config.sh`読み込みロジックを追加
   - `.env`ファイルは作成しない

3. **本番デプロイ時**
   - エージェントURLを必ず`.env.production`に反映
   - ビルド前に環境変数を確認

## 今後の改善案

1. **自動化**
   - エージェントURL の自動更新スクリプト
   - CI/CDパイプラインでの環境変数管理

2. **検証機能**
   - 環境変数の整合性チェックスクリプト
   - デプロイ前の設定検証

3. **セキュリティ**
   - Secret Managerとの連携
   - 環境別の設定管理