'use client';

import { useState, useEffect } from 'react';
import { Loader2, Send, Sparkles } from 'lucide-react';
import { useChat } from '@/components/hooks/use-chat';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function SimpleChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { message, setMessage, response, isLoading, error, sendMessage } = useChat();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    
    await sendMessage();
  };

  // レスポンスが更新されたときにメッセージリストに追加
  useEffect(() => {
    if (response) {
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    }
  }, [response]);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="bg-white rounded-lg shadow-md border">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-blue-600" />
            シンプルチャット（Vertex AI Direct）
          </h1>
          <p className="text-gray-600 mt-2">
            Vertex AI Geminiモデルを直接呼び出す軽量で高速なチャット機能
          </p>
        </div>
        <div className="p-6">
          <div className="space-y-4">

            {/* チャット履歴 */}
            <div className="min-h-[400px] max-h-[600px] overflow-y-auto border rounded-lg p-4 space-y-4 bg-gray-50">
              {messages.length === 0 && (
                <p className="text-center text-gray-500">
                  メッセージを入力して会話を始めましょう
                </p>
              )}
              {messages.length > 0 && (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString('ja-JP')}
                      </p>
                    </div>
                  </div>
                ))
              )}
              {Boolean(isLoading) && (
                <div className="flex justify-start">
                  <div className="bg-white border rounded-lg p-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>

            {/* エラー表示 */}
            {Boolean(error) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="text-red-800">{error}</div>
              </div>
            )}

            {/* 入力フォーム */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="メッセージを入力してください..."
                rows={3}
                disabled={isLoading}
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading || !message.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      送信中...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      送信
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}