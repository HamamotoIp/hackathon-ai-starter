import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import type { SavedRestaurantResult } from '@/lib/types/saved-result';

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') ?? '10');
    const tag = searchParams.get('tag');
    const search = searchParams.get('search');

    let query = db.collection('restaurant-results')
      .orderBy('createdAt', 'desc');

    // タグフィルター
    if (tag) {
      query = query.where('tags', 'array-contains', tag);
    }

    // 検索フィルター（クエリ文字列に含まれる場合）
    if (search) {
      // Firestoreの制限により、部分一致検索は複雑なので、
      // クライアント側でフィルタリングするか、Algoliaなどの検索サービスを使用
      // ここでは簡単な実装として、取得後にフィルタリング
    }

    query = query.limit(Math.min(limit, 100));

    const snapshot = await query.get();
    let results = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? data.updatedAt,
      } as SavedRestaurantResult;
    });

    // クライアント側での検索フィルタリング
    if (search) {
      const searchLower = search.toLowerCase();
      results = results.filter(result => 
        (result.query?.toLowerCase().includes(searchLower) ?? false) ||
        (result.title?.toLowerCase().includes(searchLower) ?? false)
      );
    }

    // 利用可能なタグを収集
    const allTags = new Set<string>();
    results.forEach(result => {
      if (result.tags && Array.isArray(result.tags)) {
        result.tags.forEach((tag: string) => allTags.add(tag));
      }
    });

    return NextResponse.json({
      success: true,
      results,
      availableTags: Array.from(allTags).sort(),
      totalCount: results.length,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return NextResponse.json(
      { 
        error: '履歴の取得に失敗しました',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}