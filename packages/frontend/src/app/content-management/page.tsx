'use client';

import { useState } from 'react';

interface ContentItem {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
}

export default function ContentManagementPage() {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSave = () => {
    if (!title.trim() || !content.trim()) return;

    if (selectedContent) {
      // 更新
      setContents(prev => prev.map(item => 
        item.id === selectedContent.id 
          ? { ...item, title, content }
          : item
      ));
    } else {
      // 新規作成
      const newContent: ContentItem = {
        id: Date.now().toString(),
        title,
        content,
        createdAt: new Date()
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
    if (confirm('削除しますか？')) {
      setContents(prev => prev.filter(item => item.id !== id));
      if (selectedContent?.id === id) {
        setSelectedContent(null);
        setTitle('');
        setContent('');
        setIsEditing(false);
      }
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">📁 コンテンツ管理</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* コンテンツリスト */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">コンテンツ一覧</h2>
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              新規作成
            </button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {contents.length === 0 ? (
              <p className="text-center text-gray-500 py-8">コンテンツがありません</p>
            ) : (
              contents.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 border rounded-lg cursor-pointer ${
                    selectedContent?.id === item.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
                  }`}
                  onClick={() => {
                    setSelectedContent(item);
                    setIsEditing(false);
                  }}
                >
                  <h3 className="font-medium mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.content.substring(0, 100)}...</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {item.createdAt.toLocaleDateString('ja-JP')}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* エディター・プレビュー */}
        <div className="bg-white border rounded-lg p-6">
          {isEditing ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  {selectedContent ? 'コンテンツ編集' : '新規コンテンツ'}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setTitle('');
                      setContent('');
                      setSelectedContent(null);
                      setIsEditing(false);
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!title.trim() || !content.trim()}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300"
                  >
                    保存
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">タイトル</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="タイトルを入力..."
                  className="w-full p-3 border rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">内容</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="内容を入力..."
                  rows={12}
                  className="w-full p-3 border rounded-lg"
                />
              </div>
            </div>
          ) : selectedContent ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">コンテンツプレビュー</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(selectedContent)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(selectedContent.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    削除
                  </button>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4">{selectedContent.title}</h3>
                <div className="whitespace-pre-wrap text-gray-800">{selectedContent.content}</div>
                <div className="mt-6 pt-4 border-t text-sm text-gray-500">
                  作成日: {selectedContent.createdAt.toLocaleString('ja-JP')}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">左側からコンテンツを選択するか、新規作成してください</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}