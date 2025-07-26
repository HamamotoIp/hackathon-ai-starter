'use client';

import { useState } from 'react';
import { FileText, FolderOpen, Plus } from 'lucide-react';

interface ContentItem {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function ContentManagementPage() {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSave = () => {
    if (!title.trim() || !content.trim()) return;

    const now = new Date();
    
    if (selectedContent) {
      // 更新
      setContents(prev => prev.map(item => 
        item.id === selectedContent.id 
          ? { ...item, title, content, updatedAt: now }
          : item
      ));
    } else {
      // 新規作成
      const newContent: ContentItem = {
        id: Date.now().toString(),
        title,
        content,
        createdAt: now,
        updatedAt: now
      };
      setContents(prev => [newContent, ...prev]);
    }

    setTitle('');
    setContent('');
    setSelectedContent(null);
    setIsEditing(false);
  };

  const handleEdit = (item: ContentItem) => {
    setSelectedContent(item);
    setTitle(item.title);
    setContent(item.content);
    setIsEditing(true);
  };

  const handleDelete = (id: string) => {
    setContents(prev => prev.filter(item => item.id !== id));
    if (selectedContent?.id === id) {
      setSelectedContent(null);
      setTitle('');
      setContent('');
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setTitle('');
    setContent('');
    setSelectedContent(null);
    setIsEditing(false);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="bg-white rounded-lg shadow-md border">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FolderOpen className="h-6 w-6 text-orange-600" />
            コンテンツ管理
          </h1>
          <p className="text-gray-600 mt-2">
            テキストコンテンツの作成・編集・管理機能
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          {/* コンテンツリスト */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">コンテンツ一覧</h2>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                新規作成
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {contents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>コンテンツがありません</p>
                  <p className="text-sm">新規作成ボタンから始めましょう</p>
                </div>
              ) : (
                contents.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedContent?.id === item.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => {
                      setSelectedContent(item);
                      setIsEditing(false);
                    }}
                  >
                    <h3 className="font-medium text-gray-900 mb-1">{item.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {item.content.substring(0, 100)}...
                    </p>
                    <div className="mt-2 text-xs text-gray-500">
                      作成: {item.createdAt.toLocaleDateString('ja-JP')}
                      {item.updatedAt > item.createdAt && (
                        <span className="ml-2">
                          更新: {item.updatedAt.toLocaleDateString('ja-JP')}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* エディター・プレビュー */}
          <div className="space-y-4">
            {isEditing ? (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {selectedContent ? 'コンテンツ編集' : '新規コンテンツ'}
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={!title.trim() || !content.trim()}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      保存
                    </button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="content-title" className="block text-sm font-medium text-gray-700 mb-2">
                      タイトル
                    </label>
                    <input
                      id="content-title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="コンテンツのタイトルを入力..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="content-body" className="block text-sm font-medium text-gray-700 mb-2">
                      内容
                    </label>
                    <textarea
                      id="content-body"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="コンテンツの内容を入力..."
                      rows={12}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                </div>
              </>
            ) : selectedContent ? (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">コンテンツプレビュー</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(selectedContent)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('このコンテンツを削除しますか？')) {
                          handleDelete(selectedContent.id);
                        }
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      削除
                    </button>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {selectedContent.title}
                  </h3>
                  <div className="prose max-w-none">
                    <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                      {selectedContent.content}
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-gray-200 text-sm text-gray-500">
                    <div className="flex justify-between">
                      <span>作成日: {selectedContent.createdAt.toLocaleString('ja-JP')}</span>
                      {selectedContent.updatedAt > selectedContent.createdAt && (
                        <span>更新日: {selectedContent.updatedAt.toLocaleString('ja-JP')}</span>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <FileText className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">コンテンツ管理</h3>
                <p className="text-gray-500 mb-4">
                  左側からコンテンツを選択するか、新規作成してください
                </p>
                <div className="text-sm text-gray-400">
                  <p>• テキストコンテンツの作成・編集</p>
                  <p>• 一覧表示とプレビュー</p>
                  <p>• 作成・更新日時の管理</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}