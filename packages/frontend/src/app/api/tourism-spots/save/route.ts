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
    const bucketName = process.env.TOURISM_SPOTS_BUCKET_NAME ?? `${process.env.VERTEX_AI_PROJECT_ID}-tourism-spots-results`;
    const fileName = `tourism-spots-results/${datePath}/result_${resultId}.html`;
    
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
    const docRef = db.collection('tourism-spots-results').doc(resultId);
    const resultData = {
      id: resultId,
      query,
      searchParams: searchParams ?? {},
      htmlStorageUrl: publicUrl,
      title: title ?? `観光スポット検索結果 - ${query.substring(0, 20)}${query.length > 20 ? '...' : ''}`,
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
      url: `/tourism-spots/saved/${resultId}`,
      htmlUrl: publicUrl,
      title: resultData.title,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
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
  
  // カテゴリタグ
  if (searchParams?.category) tags.push(`カテゴリ:${searchParams.category}`);
  
  // 季節タグ
  if (searchParams?.season) tags.push(`季節:${searchParams.season}`);
  
  // カテゴリ推定
  const categoryKeywords = {
    '歴史': ['歴史', '史跡', '文化財', '遺跡', '城'],
    '自然': ['自然', '公園', '山', '海', '川', '花'],
    '現代': ['現代', 'タワー', 'ビル', 'ショッピング', '都市'],
    '文化': ['文化', '美術館', '博物館', '神社', '寺'],
  };
  
  const lowerQuery = query.toLowerCase();
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => lowerQuery.includes(keyword.toLowerCase()))) {
      tags.push(`カテゴリ:${category}`);
      break;
    }
  }
  
  return tags;
}