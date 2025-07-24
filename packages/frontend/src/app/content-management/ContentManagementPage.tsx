"use client";

import { useState } from "react";
import { Upload, Image as ImageIcon, FileText, AlertCircle, CheckCircle } from "lucide-react";
import ImageUpload from "@/ui/components/features/ImageUpload/ImageUpload";
import Navigation from "@/ui/components/common/Navigation";

export default function ContentManagementPage() {
  const [uploadStatus, setUploadStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const handleUploadSuccess = (imageUrl: string) => {
    setUploadStatus({
      type: "success",
      message: `画像のアップロードが完了しました: ${imageUrl}`,
    });
    
    // 3秒後にメッセージを消去
    setTimeout(() => {
      setUploadStatus({ type: null, message: "" });
    }, 3000);
  };

  const handleUploadError = (error: string) => {
    setUploadStatus({
      type: "error",
      message: error,
    });
    
    // 5秒後にメッセージを消去
    setTimeout(() => {
      setUploadStatus({ type: null, message: "" });
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            コンテンツ管理
          </h1>
          <p className="text-lg text-gray-600">
            画像やファイルのアップロード・管理を行います
          </p>
        </div>

        {/* ステータス表示 */}
        {uploadStatus.type && uploadStatus.type !== null ? (
          <div className={`
            mb-6 p-4 rounded-lg flex items-center space-x-2
            ${uploadStatus.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}
          `}>
            {uploadStatus.type === "success" ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span className="text-sm">{uploadStatus.message}</span>
          </div>
        ) : null}

        {/* メインコンテンツ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 画像アップロード */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <ImageIcon className="h-5 w-5 text-blue-500" />
                <h2 className="text-lg font-medium text-gray-900">画像アップロード</h2>
              </div>
              
              <ImageUpload
                onUpload={handleUploadSuccess}
                onError={handleUploadError}
                maxSize={5}
                className="w-full"
              />
            </div>
          </div>

          {/* サイドバー情報 */}
          <div className="space-y-6">
            {/* 使用方法 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <FileText className="h-5 w-5 text-green-500" />
                <h3 className="text-lg font-medium text-gray-900">使用方法</h3>
              </div>
              
              <div className="space-y-3 text-sm text-gray-600">
                <div>
                  <h4 className="font-medium text-gray-800 mb-1">アップロード方法</h4>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>ドラッグ&ドロップで画像をアップロード</li>
                    <li>クリックしてファイル選択</li>
                    <li>最大5MBまで対応</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-800 mb-1">対応形式</h4>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>JPEG, PNG, GIF, WebP</li>
                    <li>SVG（一部制限あり）</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-800 mb-1">保存先</h4>
                  <p className="text-xs">Google Cloud Storage</p>
                </div>
              </div>
            </div>

            {/* 利用例 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Upload className="h-5 w-5 text-purple-500" />
                <h3 className="text-lg font-medium text-gray-900">利用例</h3>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="p-3 bg-gray-50 rounded-md">
                  <h4 className="font-medium text-gray-800 mb-1">AI分析用画像</h4>
                  <p className="text-xs">アップロードした画像をAIに分析してもらう</p>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-md">
                  <h4 className="font-medium text-gray-800 mb-1">プロフィール画像</h4>
                  <p className="text-xs">ユーザーのプロフィール画像として使用</p>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-md">
                  <h4 className="font-medium text-gray-800 mb-1">コンテンツ素材</h4>
                  <p className="text-xs">ブログやドキュメントの画像素材</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            アップロードした画像は自動的にCloud Storageに保存されます
          </p>
        </div>
      </div>
    </div>
  );
}