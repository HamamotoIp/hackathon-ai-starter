# 🔧 Debug フォルダ - ローカル開発支援ツール

ローカル開発環境でのデバッグ・診断・問題解決を支援するツール集です。

## 📁 ファイル構成

```
debug/
├── README.md                 # このファイル
├── debug_server.py          # デバッグ専用サーバー
├── test_agents.py           # エージェントテストスクリプト
├── local_debug_helper.py    # ローカル環境診断ツール
└── *.log, *.json           # 自動生成ログ・レポート
```

## 🚀 クイックスタート

### 前提：仮想環境の準備
```bash
cd packages/ai-agents
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 環境変数設定（config.shを使用）
# プロジェクトルートのconfig.shを確認
cat ../../config.sh
# config.shが存在する場合、環境変数は自動設定されます
```

### 1. エージェントテスト
```bash
# 前提: ADKサーバーを起動
adk web analysis_agent  # 別ターミナルで起動

# 全エージェントの動作確認
python debug/test_agents.py

# 注意: ADKサーバー（ポート8000）の接続テスト
```

### 2. デバッグサーバー起動
```bash
# 詳細デバッグ用サーバー（ポート8081）
python debug/debug_server.py
```

## 🔍 各ツールの詳細

### local_debug_helper.py
**ローカル環境の包括的診断**
- システム情報収集
- 依存関係チェック
- 環境変数確認
- 問題解決の推奨事項

**使用例:**
```bash
cd packages/ai-agents
python debug/local_debug_helper.py
# → debug/local_debug_report_YYYYMMDD_HHMMSS.json 生成
```

### test_agents.py  
**エージェントの自動テスト**
- ヘルスチェック
- 分析エージェントテスト
- UI生成エージェントテスト
- レスポンス時間測定

**使用例:**
```bash
# メインサーバーが起動中の状態で
python debug/test_agents.py
# → debug/test_results_YYYYMMDD_HHMMSS.json 生成
```

### debug_server.py
**詳細デバッグ用サーバー**
- エージェント個別テスト
- リアルタイムログ確認
- 環境設定診断
- エラートレース表示

**エンドポイント:**
```bash
# デバッグサーバー起動後
curl http://localhost:8081/debug/health        # 環境確認
curl http://localhost:8081/debug/env-check     # 詳細環境チェック
curl http://localhost:8081/debug/logs          # ログ取得

# エージェント個別テスト
curl -X POST http://localhost:8081/debug/test-agent \
  -H "Content-Type: application/json" \
  -d '{"agent": "analysis", "content": "テスト"}'
```

## 💡 トラブルシューティング手順

### 1. ADKサーバー起動確認
```bash
# まずADKサーバーを起動
adk web analysis_agent

# 別ターミナルでエージェントテスト
python debug/test_agents.py
```

### 2. 問題がある場合は環境診断
```bash
python debug/local_debug_helper.py
```
→ GCP認証・環境変数・依存関係を確認

### 3. 詳細調査が必要な場合
```bash
python debug/debug_server.py
```
→ 独立したデバッグサーバーで詳細確認

## 📊 よくある問題と解決策

### 認証エラー
```bash
# エラー: "Could not automatically determine credentials"
gcloud auth application-default login
```

### パッケージ不足
```bash
# requirements.txt の再インストール
pip install -r requirements.txt
```

### ポート競合
```bash
# ポート使用状況確認
lsof -i :8080
# 別ポートで起動
PORT=8081 python app.py
```

### 環境変数未設定
```bash
# config.sh の確認と設定
cp ../../config.example.sh ../../config.sh
# config.sh を編集してPROJECT_IDを設定
vi ../../config.sh
```

## 📝 ログファイル

自動生成されるファイル:
- `debug.log` - デバッグサーバーのログ
- `local_debug_report_*.json` - 環境診断レポート
- `test_results_*.json` - テスト実行結果

## 🤝 開発時のベストプラクティス

1. **問題発生時は まず診断**: `local_debug_helper.py` を実行
2. **定期的なテスト**: 機能追加後は `test_agents.py` でテスト
3. **ログの活用**: `debug_server.py` でリアルタイム監視
4. **レポート保存**: 問題解決の記録として診断結果を保存

---

**💡 ヒント**: これらのツールはローカル開発専用です。本番環境では使用しないでください。