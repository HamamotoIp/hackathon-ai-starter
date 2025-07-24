/**
 * デバッグ用APIエンドポイント
 * 開発時の環境変数確認や接続テストに使用
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 環境変数の状態確認（開発環境では実際の値も表示）
    const envStatus = {
      VERTEX_AI_PROJECT_ID: process.env.VERTEX_AI_PROJECT_ID ? 'SET' : 'NOT_SET',
      VERTEX_AI_LOCATION: process.env.VERTEX_AI_LOCATION ?? 'DEFAULT(us-central1)',
      ADK_SERVICE_URL: process.env.ADK_SERVICE_URL ? 'SET' : 'NOT_SET',
      BUCKET_NAME: process.env.BUCKET_NAME ? 'SET' : 'NOT_SET',
      SERVICE_ACCOUNT_EMAIL: process.env.SERVICE_ACCOUNT_EMAIL ? 'SET' : 'NOT_SET',
      NODE_ENV: process.env.NODE_ENV ?? 'NOT_SET',
    };

    // 開発環境では実際の値も表示
    const envValues = process.env.NODE_ENV === 'development' ? {
      VERTEX_AI_PROJECT_ID: process.env.VERTEX_AI_PROJECT_ID,
      VERTEX_AI_LOCATION: process.env.VERTEX_AI_LOCATION,
      ADK_SERVICE_URL: process.env.ADK_SERVICE_URL,
      BUCKET_NAME: process.env.BUCKET_NAME,
      SERVICE_ACCOUNT_EMAIL: process.env.SERVICE_ACCOUNT_EMAIL,
    } : undefined;

    // ADKサービス接続テスト（Agent Engine形式）
    let adkStatus = 'NOT_CONFIGURED';
    if (process.env.ADK_SERVICE_URL) {
      try {
        // Agent Engineのセッション作成でテスト
        const testUrl = process.env.ADK_SERVICE_URL.replace(':query', ':query');
        const response = await fetch(testUrl, { 
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test' // 認証テスト用ダミー
          },
          body: JSON.stringify({
            class_method: "create_session",
            input: { user_id: "health-check" }
          }),
          signal: AbortSignal.timeout(5000)
        });
        
        if (response.status === 401) {
          adkStatus = 'AUTH_REQUIRED'; // 認証が必要だが、エンドポイントは存在
        } else if (response.ok) {
          adkStatus = 'CONNECTED';
        } else {
          adkStatus = `ERROR(${response.status})`;
        }
      } catch (error) {
        adkStatus = `CONNECTION_FAILED: ${error instanceof Error ? error.message : 'Unknown'}`;
      }
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: envStatus,
      environmentValues: envValues, // 実際の環境変数値（開発環境のみ）
      services: {
        adkEngine: adkStatus,
        vertexAI: envStatus.VERTEX_AI_PROJECT_ID === 'SET' ? 'CONFIGURED' : 'NOT_CONFIGURED'
      },
      debug: {
        userAgent: request.headers.get('user-agent'),
        url: request.url,
        method: request.method
      }
    });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.stack : undefined : undefined
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // テスト用エコーエンドポイント
    return NextResponse.json({
      echo: body,
      timestamp: new Date().toISOString(),
      headers: Object.fromEntries(request.headers.entries()),
      message: 'Debug echo successful'
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Invalid JSON body',
      timestamp: new Date().toISOString(),
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 400 });
  }
}