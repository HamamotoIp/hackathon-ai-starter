import { NextRequest, NextResponse } from "next/server";
import { Storage } from "@google-cloud/storage";
import { v4 as uuidv4 } from "uuid";

export const runtime = "nodejs";

// Cloud Storage設定
const storage = new Storage({
  projectId: process.env.VERTEX_AI_PROJECT_ID,
});

const BUCKET_NAME = `${process.env.VERTEX_AI_PROJECT_ID}-images`;

export async function POST(req: NextRequest) {
  try {
    // 認証なし設計のため、Firebase認証チェックを削除
    // ハッカソン・プロトタイプ特化のため、認証は省略

    // FormDataから画像を取得
    const formData = await req.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json({ error: "画像ファイルが選択されていません" }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: "有効な画像ファイルを選択してください" }, { status: 400 });
    }

    // ファイルサイズチェック（5MB制限）
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "画像ファイルサイズは5MB以下にしてください" }, { status: 400 });
    }

    // ファイル名生成
    const fileExtension = file.name.split('.').pop() ?? 'jpg';
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = `uploads/${fileName}`;

    // Cloud Storageにアップロード
    const bucket = storage.bucket(BUCKET_NAME);
    const cloudFile = bucket.file(filePath);
    
    const buffer = Buffer.from(await file.arrayBuffer());
    
    await cloudFile.save(buffer, {
      metadata: {
        contentType: file.type,
        cacheControl: 'public, max-age=3600',
      },
      public: true,
    });

    // 公開URLを生成
    const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${filePath}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: fileName,
      size: file.size,
      contentType: file.type,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    // エラーログ（本番環境では削除推奨）
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error("Image upload error:", error);
    }
    return NextResponse.json(
      { error: "画像のアップロードに失敗しました" }, 
      { status: 500 }
    );
  }
}