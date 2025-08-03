import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';

// Firebase Admin初期化（修正版）
if (!getApps().length) {
  try {
    if (process.env.VERTEX_AI_PROJECT_ID) {
      initializeApp({
        projectId: process.env.VERTEX_AI_PROJECT_ID,
      });
    } else {
      initializeApp();
    }
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
  }
}

const db = getFirestore();
const storage = new Storage({
  projectId: process.env.VERTEX_AI_PROJECT_ID,
});


export async function POST(request: NextRequest) {
  try {
    // セキュリティ検証
    if (!process.env.VERTEX_AI_PROJECT_ID) {
      return NextResponse.json(
        { 
          error: 'サーバー設定エラー: プロジェクトIDが設定されていません',
          details: 'VERTEX_AI_PROJECT_ID環境変数を設定してください'
        },
        { status: 500 }
      );
    }


    const { htmlContent, query, searchParams, title, processingTimeMs } = await request.json();
    
    // 入力検証
    if (!htmlContent || !query) {
      return NextResponse.json(
        { error: 'HTMLコンテンツとクエリは必須です' },
        { status: 400 }
      );
    }

    // セキュリティ検証: HTMLコンテンツサイズ制限
    if (htmlContent.length > 1024 * 1024) { // 1MB制限
      return NextResponse.json(
        { error: 'HTMLコンテンツが大きすぎます（最大1MB）' },
        { status: 400 }
      );
    }

    // セキュリティ検証: クエリ長制限
    if (query.length > 1000) {
      return NextResponse.json(
        { error: 'クエリが長すぎます（最大1000文字）' },
        { status: 400 }
      );
    }

    const resultId = uuidv4();
    const timestamp = new Date();
    const datePath = `${timestamp.getFullYear()}/${String(timestamp.getMonth() + 1).padStart(2, '0')}/${String(timestamp.getDate()).padStart(2, '0')}`;
    
    // Cloud StorageにHTMLファイルを保存
    const bucketName = process.env.RESTAURANT_BUCKET_NAME ?? `${process.env.VERTEX_AI_PROJECT_ID}-restaurant-results`;
    const fileName = `restaurant-results/${datePath}/result_${resultId}.html`;
    
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(fileName);
    
    await file.save(htmlContent, {
      metadata: {
        contentType: 'text/html; charset=utf-8',
        customMetadata: {
          query,
          resultId,
          createdAt: timestamp.toISOString(),
        },
      },
    });

    // 公開URLを取得
    await file.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;

    // Firestoreにメタデータを保存
    const docRef = db.collection('restaurant-results').doc(resultId);
    const resultData = {
      id: resultId,
      query,
      searchParams: searchParams ?? {},
      htmlStorageUrl: publicUrl,
      title: title ?? `レストラン検索結果 - ${query.substring(0, 20)}${query.length > 20 ? '...' : ''}`,
      createdAt: timestamp,
      updatedAt: timestamp,
      tags: extractTags(query, searchParams),
      isPublic: true, // ハッカソン用に公開設定
      metadata: {
        processingTimeMs: processingTimeMs ?? 0,
        agentVersion: '1.0.0',
      },
    };

    await docRef.set(resultData);

    return NextResponse.json({
      success: true,
      resultId,
      url: `/restaurant-search/saved/${resultId}`,
      htmlUrl: publicUrl,
      title: resultData.title,
    });

  } catch (error) {
    console.error('Restaurant save error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      projectId: process.env.VERTEX_AI_PROJECT_ID,
      bucketName: process.env.RESTAURANT_BUCKET_NAME
    });
    
    return NextResponse.json(
      { 
        error: '保存に失敗しました',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

// タグを自動抽出
function extractTags(query: string, searchParams?: Record<string, unknown>): string[] {
  const tags: string[] = [];
  
  // エリアタグ
  if (searchParams?.area) tags.push(`エリア:${searchParams.area}`);
  
  // シーンタグ
  if (searchParams?.scene) tags.push(`シーン:${searchParams.scene}`);
  
  // 時間タグ
  if (searchParams?.time) tags.push(`時間:${searchParams.time}`);
  
  // ジャンル推定
  const genreKeywords = {
    'フレンチ': ['フレンチ', 'フランス料理'],
    'イタリアン': ['イタリアン', 'パスタ', 'ピザ'],
    '和食': ['和食', '日本料理', '寿司'],
    '中華': ['中華', '中国料理'],
    'カフェ': ['カフェ', 'コーヒー'],
  };
  
  const lowerQuery = query.toLowerCase();
  for (const [genre, keywords] of Object.entries(genreKeywords)) {
    if (keywords.some(keyword => lowerQuery.includes(keyword.toLowerCase()))) {
      tags.push(`ジャンル:${genre}`);
      break;
    }
  }
  
  return tags;
}