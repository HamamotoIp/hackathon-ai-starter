import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { Storage } from '@google-cloud/storage';

// Firebase Admin初期化（セキュア版）
if (!getApps().length) {
  if (process.env.NODE_ENV === 'production' && process.env.VERTEX_AI_PROJECT_ID) {
    initializeApp({
      projectId: process.env.VERTEX_AI_PROJECT_ID,
    });
  } else if (process.env.NODE_ENV === 'development') {
    initializeApp({
      projectId: process.env.VERTEX_AI_PROJECT_ID,
    });
  } else {
    initializeApp();
  }
}

const db = getFirestore();
const storage = new Storage({
  projectId: process.env.VERTEX_AI_PROJECT_ID,
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const htmlOnly = searchParams.get('html') === 'true';
    
    if (!id) {
      return NextResponse.json(
        { error: 'IDが指定されていません' },
        { status: 400 }
      );
    }

    // Firestoreからメタデータを取得
    const docRef = db.collection('restaurant-results').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: '指定されたIDの結果が見つかりません' },
        { status: 404 }
      );
    }

    const data = doc.data();
    
    // HTMLコンテンツのみを返すパス
    if (htmlOnly && data?.htmlStorageUrl) {
      try {
        // Cloud StorageのURLからバケット名とファイル名を抽出
        const url = new URL(data.htmlStorageUrl);
        const pathParts = url.pathname.split('/');
        const bucketName = pathParts[1];
        const fileName = pathParts.slice(2).join('/');
        
        if (!bucketName || !fileName) {
          return new NextResponse(
            '<div style="padding: 20px; text-align: center;"><h2>無効なファイルパス</h2><p>Cloud StorageのURLが正しくありません。</p></div>',
            { 
              headers: { 'Content-Type': 'text/html; charset=utf-8' },
              status: 400 
            }
          );
        }
        
        const bucket = storage.bucket(bucketName);
        const file = bucket.file(fileName);
        
        const [exists] = await file.exists();
        if (!exists) {
          return new NextResponse(
            '<div style="padding: 20px; text-align: center;"><h2>ファイルが見つかりません</h2><p>Cloud StorageにHTMLファイルが存在しません。</p></div>',
            { 
              headers: { 'Content-Type': 'text/html; charset=utf-8' },
              status: 404 
            }
          );
        }
        
        const [htmlContent] = await file.download();
        return new NextResponse(htmlContent, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
        
      } catch (error) {
        console.error('HTML取得エラー:', error);
        return new NextResponse(
          '<div style="padding: 20px; text-align: center;"><h2>コンテンツを表示できませんでした</h2><p>HTMLファイルの読み込みに失敗しました。</p></div>',
          { 
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
            status: 500 
          }
        );
      }
    }
    
    // メタデータを返すパス
    return NextResponse.json({
      success: true,
      result: {
        ...data,
        createdAt: data?.createdAt?.toDate?.()?.toISOString() ?? data?.createdAt,
        updatedAt: data?.updatedAt?.toDate?.()?.toISOString() ?? data?.updatedAt,
      },
    });

  } catch (error) {
    console.error('取得エラー:', error);
    return NextResponse.json(
      { error: '取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;
    const { title, tags } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'IDが指定されていません' },
        { status: 400 }
      );
    }

    const docRef = db.collection('restaurant-results').doc(id);
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (title) updateData.title = title;
    if (tags) updateData.tags = tags;

    await docRef.update(updateData);

    return NextResponse.json({
      success: true,
      message: '更新しました',
    });

  } catch {
    // エラーログ
    return NextResponse.json(
      { error: '更新に失敗しました' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'IDが指定されていません' },
        { status: 400 }
      );
    }

    // TODO: Cloud Storageのファイルも削除する場合
    // const doc = await db.collection('restaurant-results').doc(id).get();
    // if (doc.exists) {
    //   const data = doc.data();
    //   // Cloud Storageファイル削除処理
    // }

    await db.collection('restaurant-results').doc(id).delete();

    return NextResponse.json({
      success: true,
      message: '削除しました',
    });

  } catch {
    // エラーログ
    return NextResponse.json(
      { error: '削除に失敗しました' },
      { status: 500 }
    );
  }
}