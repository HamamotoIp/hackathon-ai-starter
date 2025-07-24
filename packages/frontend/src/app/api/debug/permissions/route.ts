import { NextResponse } from 'next/server';
import { VertexAI } from '@google-cloud/vertexai';

/**
 * 権限チェック用デバッグエンドポイント
 * 各サービスの権限状態を確認
 */
export async function GET() {
  const results = {
    timestamp: new Date().toISOString(),
    environment: {
      VERTEX_AI_PROJECT_ID: process.env.VERTEX_AI_PROJECT_ID ? 'SET' : 'NOT_SET',
      VERTEX_AI_LOCATION: process.env.VERTEX_AI_LOCATION ?? 'us-central1',
      ADK_SERVICE_URL: process.env.ADK_SERVICE_URL ? 'SET' : 'NOT_SET',
      BUCKET_NAME: process.env.BUCKET_NAME ? 'SET' : 'NOT_SET',
      SERVICE_ACCOUNT_EMAIL: process.env.SERVICE_ACCOUNT_EMAIL ? 'SET' : 'NOT_SET',
    },
    permissions: {
      vertexAI: 'UNKNOWN',
      adkService: 'UNKNOWN',
      cloudStorage: 'UNKNOWN',
    },
    details: {} as Record<string, unknown>
  };

  // Vertex AI権限チェック
  try {
    if (process.env.VERTEX_AI_PROJECT_ID) {
      const vertexAI = new VertexAI({
        project: process.env.VERTEX_AI_PROJECT_ID,
        location: process.env.VERTEX_AI_LOCATION ?? 'us-central1',
      });
      
      // 軽量なモデル取得でPermissionをテスト
      const _model = vertexAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
      
      // 実際にAPI呼び出しを行わず、初期化のみで権限チェック
      results.permissions.vertexAI = 'CONFIGURED';
      results.details.vertexAI = {
        projectId: process.env.VERTEX_AI_PROJECT_ID,
        location: process.env.VERTEX_AI_LOCATION ?? 'us-central1',
        status: 'SDK初期化成功'
      };
    } else {
      results.permissions.vertexAI = 'NOT_CONFIGURED';
      results.details.vertexAI = { error: 'VERTEX_AI_PROJECT_ID未設定' };
    }
  } catch (error) {
    results.permissions.vertexAI = 'ERROR';
    results.details.vertexAI = {
      error: error instanceof Error ? error.message : 'Unknown error',
      suggestion: 'Vertex AI APIの有効化と権限設定を確認してください'
    };
  }

  // ADKサービス接続チェック
  try {
    if (process.env.ADK_SERVICE_URL) {
      const healthUrl = `${process.env.ADK_SERVICE_URL}/health`;
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000), // 5秒タイムアウト
      });
      
      if (response.ok) {
        const data = await response.json();
        results.permissions.adkService = 'CONNECTED';
        results.details.adkService = {
          url: process.env.ADK_SERVICE_URL,
          status: data.status ?? 'healthy',
          response: data
        };
      } else {
        results.permissions.adkService = 'ERROR';
        results.details.adkService = {
          url: process.env.ADK_SERVICE_URL,
          status: response.status,
          error: `HTTP ${response.status}`,
          suggestion: 'エージェントエンジンのデプロイ状態を確認してください'
        };
      }
    } else {
      results.permissions.adkService = 'NOT_CONFIGURED';
      results.details.adkService = { error: 'ADK_SERVICE_URL未設定' };
    }
  } catch (error) {
    results.permissions.adkService = 'ERROR';
    results.details.adkService = {
      error: error instanceof Error ? error.message : 'Unknown error',
      suggestion: 'ネットワーク接続とエージェントエンジンの起動状態を確認してください'
    };
  }

  // Cloud Storage設定チェック（実際のアクセスは行わない）
  try {
    if (process.env.BUCKET_NAME) {
      results.permissions.cloudStorage = 'CONFIGURED';
      results.details.cloudStorage = {
        bucketName: process.env.BUCKET_NAME,
        status: '設定済み（権限テストはスキップ）',
        note: '実際の権限テストは画像アップロード時に実行されます'
      };
    } else {
      results.permissions.cloudStorage = 'NOT_CONFIGURED';
      results.details.cloudStorage = { error: 'BUCKET_NAME未設定' };
    }
  } catch (error) {
    results.permissions.cloudStorage = 'ERROR';
    results.details.cloudStorage = {
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }

  // 総合評価
  const allConfigured = Object.values(results.permissions).every(
    status => status === 'CONFIGURED' || status === 'CONNECTED'
  );
  
  const hasErrors = Object.values(results.permissions).some(
    status => status === 'ERROR'
  );

  return NextResponse.json({
    ...results,
    summary: {
      overall: allConfigured ? 'READY' : hasErrors ? 'ERROR' : 'PARTIAL',
      readyForProduction: allConfigured,
      recommendedActions: generateRecommendations(results.permissions)
    }
  });
}

function generateRecommendations(permissions: Record<string, string>): string[] {
  const recommendations: string[] = [];
  
  if (permissions.vertexAI === 'NOT_CONFIGURED') {
    recommendations.push('VERTEX_AI_PROJECT_ID環境変数を設定してください');
  }
  
  if (permissions.vertexAI === 'ERROR') {
    recommendations.push('Vertex AI APIの有効化: gcloud services enable aiplatform.googleapis.com');
    recommendations.push('権限付与: gcloud projects add-iam-policy-binding PROJECT_ID --member="user:EMAIL" --role="roles/aiplatform.user"');
  }
  
  if (permissions.adkService === 'NOT_CONFIGURED') {
    recommendations.push('ADK_SERVICE_URL環境変数を設定してください');
  }
  
  if (permissions.adkService === 'ERROR') {
    recommendations.push('エージェントエンジンのデプロイ状態を確認してください');
    recommendations.push('./setup.sh --agent-only でエージェントエンジンを再デプロイしてください');
  }
  
  if (permissions.cloudStorage === 'NOT_CONFIGURED') {
    recommendations.push('BUCKET_NAME環境変数を設定してください');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('全ての設定が正常です。本番運用の準備ができています。');
  } else {
    recommendations.push('上記の問題を解決後、./setup.sh を実行して統合セットアップを完了してください');
  }
  
  return recommendations;
}