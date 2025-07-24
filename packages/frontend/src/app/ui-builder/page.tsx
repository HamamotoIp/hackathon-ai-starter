"use client";

import { useState } from "react";
import { AIFeatureResponse, isUIGenerationResponse } from "@/core/types/AIFeatures";

export default function UIBuilderPage() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedUI, setGeneratedUI] = useState<AIFeatureResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedUI(null);

    try {
      const response = await fetch("/api/ui-generation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: prompt,
          options: { uiType: "auto", framework: "html" },
          sessionId: 'demo-session', // 固定セッションID
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "UI生成に失敗");
      setGeneratedUI(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsGenerating(false);
    }
  };

  const examplePrompts = [
    "レストランの予約フォームを作成してください。名前、電話番号、人数、希望日時を入力できるようにして。",
    "商品カードを作成してください。画像、タイトル、価格、説明文が表示できるようにして。",
    "売上ダッシュボードを作成してください。グラフとKPI表示を含めて。",
    "会社紹介のランディングページを作成してください。ヒーロー、サービス紹介、お問い合わせを含めて。",
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">UI生成ツール</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="mb-4">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="作成したいUIを説明してください..."
              className="w-full p-3 border rounded h-32"
            />
          </div>
          
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full p-3 bg-blue-500 text-white rounded disabled:bg-gray-300 mb-4"
          >
            {isGenerating ? '生成中...' : 'UI生成'}
          </button>

          <div className="space-y-2">
            <h3 className="font-bold">サンプルプロンプト</h3>
            {examplePrompts.map((example, index) => (
              <button
                key={index}
                className="w-full text-left p-2 text-sm bg-gray-50 rounded hover:bg-gray-100"
                onClick={() => setPrompt(example)}
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        <div>
          {error ? (
            <div className="p-3 bg-red-50 text-red-600 rounded mb-4">
              {error}
            </div>
          ) : null}

          {generatedUI?.success ? (
            <div className="border rounded">
              <div className="p-4 bg-white">
                <div
                  dangerouslySetInnerHTML={{
                    __html: isUIGenerationResponse(generatedUI) 
                      ? generatedUI.result.html 
                      : typeof generatedUI.result === 'string' 
                        ? generatedUI.result 
                        : ""
                  }}
                />
              </div>
              <div className="p-2 bg-gray-50 text-xs text-gray-600">
                生成時間: {generatedUI.processingTimeMs}ms
              </div>
            </div>
          ) : !isGenerating && (
            <div className="h-96 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-500">
              UIを生成してプレビューを表示
            </div>
          )}
        </div>
      </div>
    </div>
  );
}