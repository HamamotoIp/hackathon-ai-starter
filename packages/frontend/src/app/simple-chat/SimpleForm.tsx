'use client';

import { useState } from 'react';

/**
 * シンプルなチャットフォーム
 * Client Componentとして最小限の実装
 */
export default function SimpleForm() {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    if (!message.trim()) {
      e.preventDefault();
      return;
    }
    setIsLoading(true);
  };

  return (
    <form action="/simple-chat" method="GET" onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
            メッセージ
          </label>
          <textarea
            id="message"
            name="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="AIに聞きたいことを入力してください..."
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            disabled={isLoading}
          />
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {message.length}/500文字
          </div>
          <button
            type="submit"
            disabled={!message.trim() || isLoading}
            className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? '送信中...' : '送信'}
          </button>
        </div>
      </div>
      
      {/* 使用例 */}
      <div className="mt-4 p-3 bg-gray-50 rounded-md">
        <p className="text-sm text-gray-600 mb-2">💡 使用例:</p>
        <div className="space-y-1 text-sm">
          <button
            type="button"
            onClick={() => setMessage('こんにちは')}
            className="text-blue-600 hover:text-blue-800 block"
          >
            • こんにちは
          </button>
          <button
            type="button"
            onClick={() => setMessage('JavaScript について教えて')}
            className="text-blue-600 hover:text-blue-800 block"
          >
            • JavaScript について教えて
          </button>
          <button
            type="button"
            onClick={() => setMessage('今日の天気はどうですか？')}
            className="text-blue-600 hover:text-blue-800 block"
          >
            • 今日の天気はどうですか？
          </button>
        </div>
      </div>
    </form>
  );
}